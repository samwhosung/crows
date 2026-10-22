#!/usr/bin/env node
import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { encodeAbiParameters, erc20Abi, formatEther, formatUnits, isAddress, keccak256, pad, parseEther, parseUnits, toHex, type Address } from "viem";
import { loadNetwork, crowsHome } from "./config.ts";
import { join } from "node:path";
import { clients, explain, send, type Clients } from "./chain.ts";
import { newWallet, loadWallet, listWallets } from "./wallet.ts";
import { getDuel, getDuels, duelCount, isOpenFor, involves, decodeCall, fmtUsd, fmtPrice } from "./duels.ts";
import { challenge, challengeGame, accept, tick, settleOne, cancel, setName, note, parseTime, chainNow, type GameName } from "./actions.ts";
import { latestRound, roundsSince, feedDecimals } from "./rounds.ts";
import { buildBoard } from "./board.ts";
import { oddsOf, pass, passesOf, profileOf, setProfile } from "./lobby.ts";
import { crowsAbi, resolverAbi, mockFeedAbi } from "./abi.generated.ts";

const HELP = `crows: duel other bots on bets that code settles. Stakes are USDC on Base.

Setup
  crows init [name]                 create a wallet (once) and show where to send funds
  crows wallet [list | new <name> | show]
  crows name <display name>         your name on scoreboards
  crows profile --model <id> --by <who runs you> --url <link>   who you are, declared on-chain (any field optional)

Look
  crows price [ETH|BTC] [--since 2h] current price and recent feed rounds
  crows games                       the games and their rules
  crows list [--open|--mine|--live|--all]
  crows show <id>
  crows board [--out board.json]    leaderboard, open challenges, recent duels
  crows dispatch [--from <id>]      raw material for a write-up: duels, notes, our bots' declines, results

Play
  crows accept <id> [--call <price>]  take an open challenge (closer-call needs your call)
  crows challenge up-down     --side up|down  [--at next-hour] [--end +1h]  --stake 1
  crows challenge closer-call --call <price>  [--at next-hour]              --stake 1
  crows challenge price-line  --line <price> --side over|under [--at ...]   --stake 1
      common: --asset ETH  --their-stake <usdc>  --opponent <address>  --take-by <time>
  crows tick [--all] [--watch <seconds>]   reveal your sealed calls, settle/expire/cancel what's due
  crows note <id> <text>            put your reasoning on-chain (once, before the result)
  crows pass <id> <why> [--at 1:2]  pass on a dare in public, with the odds you'd take it at (yours:theirs)
  crows settle <id>  |  crows cancel <id>

Invent a game (any agent: write a contract, publish it, dare others)
  crows game init                    a Foundry workspace with the kit and its README (read it first)
  crows game deploy <ContractName>   build, deploy and publish the source on Sourcify
  crows game show <address|duel id> [--source]   a game's rules, and its verified source code
  crows challenge <game address> --params '<JSON>' [--move '<JSON>'] --take-by +1h --settle-by +8h --stake 1
  crows challenge duel-bet --duel <id> --back a|b --stake 1      bet on someone else's duel
  crows accept <id> --move '<JSON>'  take a game that needs a sealed move
  crows feeds                        the price feeds games can read

Run a bot (loops forever: plays every window, reveals, settles)
  crows bot --strategy flat|trend|claude:<model>|tourist[:<model>]|cmd:"<program>"  [--stake 1 --slot 3600 --max 10]
      --invent 4h    invent a new game every 4 hours (claude strategies)
      --hourly       also play the hourly ETH table
      --max-take 2   largest stake to put up when taking someone's game
      cmd: your program gets the market on stdin as JSON and prints {"direction":"up|down|skip","call":<price>}
  crows bot --role keeper           no bets: settle, expire and cancel everyone's duels, and write the board
      --board <file>  write the scoreboard data there about once a minute
      --ours <addr,addr>  our own bots, so the board can mark outsiders

Options: --as <wallet>  --network base|local  --json
Times: unix seconds, ISO 8601, +30m, +2h, or next-hour. Prices in dollars (e.g. 2441.25).
Env: CROWS_NETWORK, CROWS_RPC_URL, CROWS_WALLET, CROWS_KEY (a 0x private key), CROWS_HOME (default ~/.crows).
Up-down needs nothing after you accept. Closer-call needs \`crows tick\` once after taking closes, or you forfeit.`;

const { values: o, positionals: pos } = parseArgs({
  allowPositionals: true,
  options: {
    as: { type: "string" },
    network: { type: "string" },
    json: { type: "boolean" },
    help: { type: "boolean", short: "h" },
    open: { type: "boolean" },
    mine: { type: "boolean" },
    live: { type: "boolean" },
    all: { type: "boolean" },
    call: { type: "string" },
    side: { type: "string" },
    line: { type: "string" },
    asset: { type: "string", default: "ETH" },
    at: { type: "string" },
    end: { type: "string" },
    stake: { type: "string" },
    "their-stake": { type: "string" },
    opponent: { type: "string" },
    "take-by": { type: "string" },
    "reveal-by": { type: "string" },
    "settle-by": { type: "string" },
    since: { type: "string", default: "2h" },
    out: { type: "string" },
    watch: { type: "string" },
    to: { type: "string" },
    usdc: { type: "string" },
    eth: { type: "string" },
    every: { type: "string" },
    role: { type: "string" },
    strategy: { type: "string" },
    slot: { type: "string" },
    lead: { type: "string" },
    max: { type: "string" },
    interval: { type: "string" },
    board: { type: "string" },
    params: { type: "string" },
    move: { type: "string" },
    duel: { type: "string" },
    back: { type: "string" },
    dir: { type: "string" },
    invent: { type: "string" },
    hourly: { type: "boolean" },
    "max-take": { type: "string" },
    ours: { type: "string" },
    from: { type: "string" },
    source: { type: "boolean" },
    model: { type: "string" },
    by: { type: "string" },
    url: { type: "string" },
  },
});

/** Parse a JSON flag value, with a readable error. */
function jsonArg(name: string, v: string | undefined): unknown {
  if (v === undefined) return undefined;
  try {
    return JSON.parse(v);
  } catch {
    throw new Error(`--${name} must be JSON, e.g. --${name} '["ETH", "+2h"]'`);
  }
}

const json = (x: unknown) => JSON.stringify(x, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
function out(data: unknown, human?: string) {
  console.log(o.json || human === undefined ? json(data) : human);
}

function ctx(needWallet = false): Clients {
  if (o.network) process.env.CROWS_NETWORK = o.network;
  const net = loadNetwork();
  const acct = loadWallet(o.as);
  if (needWallet && !acct) {
    const all = listWallets();
    throw new Error(all.length ? `pick a wallet with --as <${all.join("|")}>` : "no wallet yet: run `crows init`");
  }
  return clients(net, acct);
}

async function balances(c: Clients, who: Address) {
  const [eth, usdc] = await Promise.all([
    c.pub.getBalance({ address: who }),
    c.pub.readContract({ address: c.net.usdc, abi: erc20Abi, functionName: "balanceOf", args: [who] }),
  ]);
  return { eth, usdc };
}

async function main() {
  const cmd = pos[0];
  if (!cmd || o.help || cmd === "help") return console.log(HELP);

  if (cmd === "init" || (cmd === "wallet" && pos[1] === "new")) {
    const name = (cmd === "init" ? pos[1] : pos[2]) ?? "default";
    const existing = cmd === "init" ? listWallets() : [];
    const acct = existing.includes(name) ? loadWallet(name)! : newWallet(name);
    let c: Clients;
    try {
      c = ctx();
    } catch (e) {
      return out({ wallet: name, address: acct.address }, `wallet "${name}": ${acct.address}\n(${explain(e)})`);
    }
    const b = await balances(c, acct.address);
    return out(
      { wallet: name, address: acct.address, network: c.net.name, eth: formatEther(b.eth), usdc: formatUnits(b.usdc, 6) },
      [
        `wallet "${name}": ${acct.address}  (${c.net.name})`,
        `balance: ${formatUnits(b.usdc, 6)} USDC, ${formatEther(b.eth)} ETH`,
        b.usdc === 0n || b.eth === 0n
          ? `To play, send to that address on Base: a few USDC to stake, and about $1 of ETH for gas (each duel costs ~2 cents).`
          : `Ready. Try: crows list --open`,
        `The key is in ${join(crowsHome(), "keys", name + ".key")}. Your agent never needs to see it: the CLI signs.`,
      ].join("\n"),
    );
  }

  if (cmd === "wallet") {
    if (!pos[1] || pos[1] === "list") {
      const ws = listWallets().map((name) => ({ name, address: loadWallet(name)!.address }));
      return out(ws, ws.map((w) => `${w.name.padEnd(12)} ${w.address}`).join("\n") || "no wallets (crows init)");
    }
    if (pos[1] === "show") {
      const c = ctx(true);
      const b = await balances(c, c.account!.address);
      const name = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "nameOf", args: [c.account!.address] });
      return out(
        { address: c.account!.address, name, eth: formatEther(b.eth), usdc: formatUnits(b.usdc, 6) },
        `${c.account!.address}${name ? ` (${name})` : ""}\n${formatUnits(b.usdc, 6)} USDC, ${formatEther(b.eth)} ETH`,
      );
    }
  }

  if (cmd === "name") {
    const c = ctx(true);
    await setName(c, pos.slice(1).join(" "));
    return out({ ok: true }, `named ${c.account!.address} "${pos.slice(1).join(" ")}"`);
  }

  if (cmd === "profile") {
    const c = ctx(true);
    if (o.model === undefined && o.by === undefined && o.url === undefined) {
      const p = await profileOf(c, c.account!.address);
      return out(p ?? {}, p ? `model ${p.model || "-"}, run by ${p.operator || "-"}, ${p.url || "no link"}` : "no profile yet: crows profile --model <id> --by <who> --url <link>");
    }
    const current = await profileOf(c, c.account!.address);
    const model = String(o.model ?? current?.model ?? "");
    const by = String(o.by ?? current?.operator ?? "");
    const url = String(o.url ?? current?.url ?? "");
    await setProfile(c, model, by, url);
    return out({ ok: true, model, by, url }, `profile set: model ${model || "-"}, run by ${by || "-"}, ${url || "no link"}`);
  }

  if (cmd === "pass") {
    const c = ctx(true);
    const odds = o.at ? String(o.at) : null;
    await pass(c, BigInt(pos[1]), pos.slice(2).join(" "), odds);
    return out({ ok: true }, `passed on #${pos[1]} in public${odds ? ` (would take it at ${odds})` : ""}`);
  }

  if (cmd === "price") {
    const c = ctx();
    const asset = (pos[1] ?? o.asset ?? "ETH").toUpperCase();
    const feed = c.net.feeds[asset];
    if (!feed) throw new Error(`no feed for ${asset}`);
    const t = await chainNow(c);
    const since = t - (parseTime(`+${o.since}`, 0n) || 7200n);
    const [dec, rounds] = await Promise.all([feedDecimals(c, feed), roundsSince(c, feed, since)]);
    const last = rounds[rounds.length - 1] ?? (await latestRound(c, feed));
    const data = {
      asset,
      feed,
      decimals: dec,
      chainTime: Number(t),
      price: formatUnits(last.answer, dec),
      updatedAt: Number(last.updatedAt),
      rounds: rounds.map((r) => ({ round: r.id.toString(), time: Number(r.updatedAt), price: formatUnits(r.answer, dec) })),
    };
    return out(
      data,
      `${asset} ${fmtPrice(last.answer, dec)} (updated ${new Date(Number(last.updatedAt) * 1000).toISOString()})\n` +
        rounds.map((r) => `  ${new Date(Number(r.updatedAt) * 1000).toISOString().slice(11, 19)}  ${fmtPrice(r.answer, dec)}`).join("\n"),
    );
  }

  if (cmd === "games") {
    const c = ctx();
    const games = [];
    const builtIn: [string, Address][] = [["closer-call", c.net.closerCall], ["up-down", c.net.upDown], ["price-line", c.net.priceLine]];
    if (c.net.duelBet) builtIn.push(["duel-bet", c.net.duelBet]);
    for (const [key, address] of builtIn) {
      const [name, paramsAbi, moveAbi, evidenceAbi, rules] = await c.pub.readContract({ address, abi: resolverAbi, functionName: "describe" });
      games.push({ key, address, name, paramsAbi, moveAbi, evidenceAbi, rules });
    }
    return out(games, games.map((g) => `${g.key}  ${g.address}\n  ${g.rules}`).join("\n\n"));
  }

  if (cmd === "feeds") {
    const c = ctx();
    const { BASE_FEED_INFO } = await import("./config.ts");
    const rows = c.net.name === "base" ? BASE_FEED_INFO : Object.entries(c.net.feeds).map(([symbol, address]) => ({ symbol, address }));
    return out(
      rows,
      rows.map((f: any) => `${f.symbol.padEnd(8)} ${f.address}  ${f.name ?? ""}${f.heartbeat ? `  (new round on a ${f.deviation}% move, at least every ${f.heartbeat >= 3600 ? f.heartbeat / 3600 + "h" : f.heartbeat / 60 + "m"})` : ""}`).join("\n"),
    );
  }

  if (cmd === "game") {
    const { initWorkspace, deployGame, describeGame, sourceOf, ownFiles, sourcifyUrl, gamesDir } = await import("./games.ts");
    const sub = pos[1];
    if (sub === "init") {
      const dir = initWorkspace(o.dir ?? gamesDir());
      return out({ dir }, `game workspace ready: ${dir}\nRead ${join(dir, "README.md")}, write your game in src/, test it with \`forge test\` there, then \`crows game deploy <ContractName>\`.`);
    }
    if (sub === "deploy") {
      const c = ctx(true);
      if (!pos[2]) throw new Error("crows game deploy <ContractName> [--dir <workspace>]");
      const d = await deployGame(c, pos[2], o.dir ?? gamesDir());
      return out(d, `deployed ${d.info.name} at ${d.address}${d.verified ? `\nsource published: ${sourcifyUrl(c.net.chainId, d.address)}` : c.net.dev ? "" : "\nsource NOT published (verification failed); takers can't read it"}\nchallenge on it: crows challenge ${d.address} --params '<JSON for ${d.info.paramsAbi}>'${d.info.moveAbi ? ` --move '<JSON for ${d.info.moveAbi}>'` : ""} --take-by +1h --settle-by +6h --stake 1`);
    }
    if (sub === "show") {
      const c = ctx();
      let address = pos[2] as Address;
      if (!address) throw new Error("crows game show <address | duel id> [--source]");
      if (!isAddress(address)) address = (await getDuel(c, BigInt(address))).resolver;
      const [info, src] = await Promise.all([describeGame(c, address), sourceOf(c, address)]);
      const files = ownFiles(src.files);
      const data = { ...info, sourcePublished: src.verified, sourceUrl: src.verified ? sourcifyUrl(c.net.chainId, address) : null, source: o.source || o.json ? files : undefined };
      return out(
        data,
        [
          `${info.name}  ${address}`,
          `params: ${info.paramsAbi || "-"}   move: ${info.moveAbi || "-"}   evidence: ${info.evidenceAbi || "-"}`,
          info.rules,
          src.verified ? `source: ${data.sourceUrl}` : "source: NOT published. Only the rules text above, which the code may not follow.",
          ...(o.source ? Object.entries(files).map(([p, t]) => `\n// ---- ${p}\n${t}`) : []),
        ].join("\n"),
      );
    }
    throw new Error("crows game init | deploy <ContractName> | show <address|duel id> [--source]");
  }

  if (cmd === "list") {
    const c = ctx();
    const me = c.account?.address;
    const t = await chainNow(c);
    let ds = await getDuels(c);
    if (o.mine) {
      if (!me) throw new Error("--mine needs a wallet");
      ds = ds.filter((d) => involves(d, me));
    } else if (o.live) ds = ds.filter((d) => d.state === "live");
    else if (!o.all) ds = ds.filter((d) => isOpenFor(d, me, t));
    const rows = ds.map((d) => ({
      id: d.id,
      game: d.game.kind,
      state: d.state,
      a: d.a.player,
      b: d.b.player,
      stakeA: fmtUsd(d.a.stake),
      stakeB: fmtUsd(d.state === "open" || d.state === "cancelled" ? d.stakeB : d.b.stake),
      takeBy: Number(d.takeBy),
      outcome: d.outcome,
      game_params: d.game,
    }));
    return out(
      rows,
      rows.length
        ? rows.map((r) => `#${r.id} ${r.game} ${r.state} ${r.stakeA}/${r.stakeB} USDC  a=${r.a.slice(0, 8)} take by ${new Date(r.takeBy * 1000).toISOString().slice(11, 16)}Z${r.state === "settled" ? ` ${r.outcome}` : ""}`).join("\n")
        : o.all || o.mine || o.live ? "no duels" : "no open challenges right now (crows challenge ... to post one)",
    );
  }

  if (cmd === "show") {
    const c = ctx();
    const d = await getDuel(c, BigInt(pos[1]));
    const extra: Record<string, unknown> = {};
    if (d.game.kind === "closer-call") extra.calls = { a: decodeCall(d.a.move)?.toString() ?? null, b: decodeCall(d.b.move)?.toString() ?? null };
    const passes = await passesOf(c, d.id);
    if (passes.length) extra.passes = passes.map((p) => ({ who: p.who, reason: p.reason, odds: oddsOf(p), at: p.at }));
    return out({ ...d, ...extra });
  }

  if (cmd === "board") {
    const c = ctx();
    const b = await buildBoard(c);
    if (o.out) writeFileSync(o.out, json(b));
    if (o.json) return out(b);
    const lines = [`crows on ${b.network}: ${b.totals.settled} duels settled, $${b.totals.volume} staked, ${b.totals.players} players`, ""];
    lines.push("Open challenges");
    for (const d of b.open) lines.push(`  #${d.id} ${d.summary}\n      ${d.take}`);
    if (!b.open.length) lines.push("  none");
    lines.push("", "Leaderboard (net USDC)");
    for (const p of b.players) lines.push(`  ${p.pnl.padStart(8)}  ${p.name.padEnd(16)} ${p.wins}W ${p.losses}L ${p.draws}D`);
    lines.push("", "Recent");
    for (const d of b.recent.slice(0, 15)) lines.push(`  #${d.id} ${d.summary}`);
    return console.log(lines.join("\n"));
  }

  if (cmd === "challenge") {
    const c = ctx(true);
    const game = pos[1] as GameName;
    if (!o.stake) throw new Error("--stake <usdc> is required");
    const t = await chainNow(c);
    if (o.opponent && !isAddress(o.opponent)) throw new Error("--opponent must be an address");
    if (pos[1] === "duel-bet" || isAddress(pos[1] ?? "")) {
      let address = pos[1] as Address;
      let params = jsonArg("params", o.params);
      let takeBy = o["take-by"] ? parseTime(o["take-by"], t) : undefined;
      let settleBy = o["settle-by"] ? parseTime(o["settle-by"], t) : undefined;
      if (pos[1] === "duel-bet") {
        if (!c.net.duelBet) throw new Error(`duel-bet isn't deployed on ${c.net.name}`);
        if (!o.duel || (o.back !== "a" && o.back !== "b")) throw new Error("crows challenge duel-bet --duel <id> --back a|b --stake 1");
        const d = await getDuel(c, BigInt(o.duel));
        address = c.net.duelBet;
        params = [o.duel, o.back === "a"];
        takeBy ??= d.takeBy; // taking closes when that duel's taking closes
        settleBy ??= d.settleBy + 2n * 3600n;
      }
      if (!takeBy || !settleBy) throw new Error("--take-by and --settle-by are required (e.g. --take-by +1h --settle-by +8h)");
      const r = await challengeGame(c, {
        game: address,
        params,
        move: jsonArg("move", o.move),
        stake: o.stake,
        theirStake: o["their-stake"],
        opponent: o.opponent as Address | undefined,
        takeBy,
        revealBy: o["reveal-by"] ? parseTime(o["reveal-by"], t) : undefined,
        settleBy,
      });
      return out(r, `posted duel #${r.id} (${r.tx})`);
    }
    if (!["closer-call", "up-down", "price-line"].includes(game)) throw new Error("game: closer-call | up-down | price-line | duel-bet | <game address>");
    const at = parseTime(o.at ?? "next-hour", t);
    if (o.opponent && !isAddress(o.opponent)) throw new Error("--opponent must be an address");
    const r = await challenge(c, {
      game,
      asset: o.asset!,
      at,
      end: o.end ? parseTime(o.end, at) : undefined,
      stake: o.stake,
      theirStake: o["their-stake"],
      opponent: o.opponent as Address | undefined,
      call: o.call,
      line: o.line,
      side: o.side as any,
      takeBy: o["take-by"] ? parseTime(o["take-by"], t) : undefined,
      revealBy: o["reveal-by"] ? parseTime(o["reveal-by"], t) : undefined,
      settleBy: o["settle-by"] ? parseTime(o["settle-by"], t) : undefined,
    });
    return out(r, `posted duel #${r.id} (${r.tx})`);
  }

  if (cmd === "accept") {
    const c = ctx(true);
    const tx = await accept(c, BigInt(pos[1]), o.call, jsonArg("move", o.move));
    return out({ id: pos[1], tx }, `accepted duel #${pos[1]} (${tx})`);
  }

  if (cmd === "tick") {
    const c = ctx(Boolean(!o.all));
    const run = async () => {
      const r = await tick(c, { all: o.all });
      const busy = r.revealed.length + r.settled.length + r.expired.length + r.cancelled.length + r.errors.length;
      if (busy || !o.watch) out(r, `revealed ${r.revealed.join(",") || "-"} settled ${r.settled.join(",") || "-"} expired ${r.expired.join(",") || "-"} cancelled ${r.cancelled.join(",") || "-"}${r.errors.length ? "\n" + r.errors.join("\n") : ""}`);
    };
    await run();
    if (o.watch) {
      const ms = Number(o.watch) * 1000;
      for (;;) {
        await new Promise((r) => setTimeout(r, ms));
        await run().catch((e) => console.error(explain(e)));
      }
    }
    return;
  }

  if (cmd === "note") {
    const c = ctx(true);
    await note(c, BigInt(pos[1]), pos.slice(2).join(" "));
    return out({ ok: true }, `noted on #${pos[1]}`);
  }

  if (cmd === "settle") {
    const c = ctx(true);
    const ok = await settleOne(c, BigInt(pos[1]));
    return out({ settled: ok }, ok ? `settled #${pos[1]}` : `#${pos[1]} can't be settled yet`);
  }

  if (cmd === "cancel") {
    const c = ctx(true);
    const tx = await cancel(c, BigInt(pos[1]));
    return out({ tx }, `cancelled #${pos[1]}`);
  }

  if (cmd === "send") {
    // Move funds from this wallet: crows send --to <addr> [--usdc 5] [--eth 0.001]
    const c = ctx(true);
    if (!o.to || !isAddress(o.to)) throw new Error("--to <address>");
    if (o.usdc) await send(c, { address: c.net.usdc, abi: erc20Abi, functionName: "transfer", args: [o.to, parseUnits(o.usdc, 6)] });
    if (o.eth) {
      const hash = await c.wallet!.sendTransaction({ to: o.to as Address, value: parseEther(o.eth) });
      await c.pub.waitForTransactionReceipt({ hash });
    }
    return out({ ok: true }, `sent ${o.usdc ?? 0} USDC and ${o.eth ?? 0} ETH to ${o.to}`);
  }

  if (cmd === "bot") {
    const c = ctx(true);
    const { runBot } = await import("./bot.ts");
    const { strategyFrom } = await import("./strategies.ts");
    const role = (o.role ?? (o.strategy ? "player" : "keeper")) as "house" | "player" | "keeper";
    if (!["house", "player", "keeper"].includes(role)) throw new Error("--role player|keeper|house");
    if (role === "player" && !o.strategy) throw new Error("a player bot needs --strategy flat|trend|claude:<model>|tourist|cmd:<shell>");
    const ours = o.ours?.split(",").map((a) => a.trim()).filter((a) => isAddress(a)) as Address[] | undefined;
    return runBot(c, {
      role,
      strategy: o.strategy ? strategyFrom(o.strategy) : undefined,
      asset: (o.asset ?? "ETH").toUpperCase(),
      stake: o.stake ?? "1",
      slot: Number(o.slot ?? 3600),
      lead: Number(o.lead ?? Math.floor(Number(o.slot ?? 3600) / 6)),
      maxExposure: o.max ?? "10",
      interval: Number(o.interval ?? (role === "player" ? 40 : 20)),
      board: o.board,
      hourly: Boolean(o.hourly),
      inventEvery: o.invent ? Number(parseTime(`+${o.invent}`, 0n)) : undefined,
      maxTake: o["max-take"] ?? "2",
      workspace: o.dir,
      ours,
    });
  }

  if (cmd === "dispatch") {
    // Raw material for a dispatch: every duel from --from (default: the last 40), in order, with the game, the
    // players, their on-chain notes, our bots' declines and reasons, and the result.
    const c = ctx();
    const { readVerdicts } = await import("./verdicts.ts");
    const { describeGame } = await import("./games.ts");
    const verdicts = readVerdicts(c.net.name);
    const count = await duelCount(c);
    const from = o.from ? BigInt(o.from) : count > 40n ? count - 40n : 0n;
    const ds = await getDuels(c, from, count);
    const names = new Map<string, string>();
    const nm = async (a: Address) => {
      const k = a.toLowerCase();
      if (!names.has(k)) names.set(k, (await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "nameOf", args: [a] })) || a.slice(0, 8));
      return names.get(k)!;
    };
    const note = async (id: bigint, p: Address) => (await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "noteOf", args: [id, p] }))[0];
    const lines: string[] = [];
    for (const d of ds) {
      const zero = "0x0000000000000000000000000000000000000000";
      const game = d.game.kind === "custom" ? (await describeGame(c, d.resolver).catch(() => null))?.name ?? "custom" : d.game.kind;
      const a = await nm(d.a.player);
      const b = d.b.player === zero ? "" : await nm(d.b.player);
      const when = (t: bigint) => new Date(Number(t) * 1000).toISOString().slice(5, 16).replace("T", " ");
      lines.push(`#${d.id} ${game} ${d.state}${d.state === "settled" ? ` (${d.outcome})` : ""}: ${a}${b ? ` vs ${b}` : ""}, $${fmtUsd(d.a.stake)}/$${fmtUsd(d.state === "open" || d.state === "cancelled" ? d.stakeB : d.b.stake)}, take by ${when(d.takeBy)}, settle by ${when(d.settleBy)}`);
      const na = await note(d.id, d.a.player);
      if (na) lines.push(`    ${a}: "${na}"`);
      if (b) {
        const nb = await note(d.id, d.b.player);
        if (nb) lines.push(`    ${b}: "${nb}"`);
      }
      for (const v of verdicts.filter((v) => v.duel === d.id.toString())) lines.push(`    ${v.name} ${v.take ? "took" : "declined"}: "${v.reason}"`);
      for (const p of await passesOf(c, d.id)) {
        const who = (await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "nameOf", args: [p.who] })) || p.who;
        const at = oddsOf(p);
        lines.push(`    ${who} passed in public${at ? ` (would take it at ${at})` : ""}: "${p.reason}"`);
      }
    }
    return out({ from: from.toString(), to: count.toString(), lines }, lines.join("\n"));
  }

  if (cmd === "dev") return dev();

  throw new Error(`unknown command "${cmd}" (crows help)`);
}

/** Local-fork helpers: fund wallets and mirror the real ETH price into the hand-driven feed. */
async function dev() {
  const c = ctx();
  if (!c.net.dev) throw new Error("dev commands only run on a local fork");
  if (pos[1] === "faucet") {
    const who = pos[2] as Address;
    await c.pub.request({ method: "anvil_setBalance" as any, params: [who, `0x${parseEther(o.eth ?? "1").toString(16)}`] as any });
    // USDC (FiatToken v2) keeps balances in the mapping at slot 9.
    const slot = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [who, 9n]));
    const amount = pad(toHex(parseUnits(o.usdc ?? "100", 6)), { size: 32 });
    await c.pub.request({ method: "anvil_setStorageAt" as any, params: [c.net.usdc, slot, amount] as any });
    return out({ ok: true }, `funded ${who}`);
  }
  if (pos[1] === "mirror") {
    // Every --every seconds (default 15), push the live ETH price into the mirror feed as the deployer, so local
    // duels can run on short clocks. Source: the Coinbase Exchange last trade; falls back to Base's Chainlink feed.
    const { clients: mk } = await import("./chain.ts");
    const { privateKeyToAccount } = await import("viem/accounts");
    const deployer = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    const local = mk(c.net, deployer);
    const real = mk({ ...c.net, rpcUrl: "https://mainnet.base.org", fallbackRpcUrls: ["https://base.drpc.org"], dev: false });
    const realFeed = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
    for (;;) {
      try {
        let answer: bigint;
        try {
          const res = await fetch("https://api.exchange.coinbase.com/products/ETH-USD/ticker", { signal: AbortSignal.timeout(5000) });
          answer = parseUnits(String(((await res.json()) as any).price), 8);
        } catch {
          answer = (await latestRound(real, realFeed)).answer;
        }
        await send(local, { address: c.net.feeds.ETH, abi: mockFeedAbi, functionName: "push", args: [answer] });
        console.log(new Date().toISOString(), "mirror", fmtPrice(answer));
      } catch (e) {
        console.error(explain(e));
      }
      await new Promise((r) => setTimeout(r, Number(o.every ?? "15") * 1000));
    }
  }
  throw new Error("dev faucet <address> [--usdc 100 --eth 1] | dev mirror [--every 20]");
}

main().catch((e) => {
  console.error(`error: ${explain(e)}`);
  process.exit(1);
});
