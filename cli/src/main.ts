#!/usr/bin/env node
import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { encodeAbiParameters, erc20Abi, formatEther, formatUnits, isAddress, keccak256, pad, parseEther, parseUnits, toHex, type Address } from "viem";
import { loadNetwork } from "./config.ts";
import { clients, explain, send, type Clients } from "./chain.ts";
import { newWallet, loadWallet, listWallets } from "./wallet.ts";
import { getDuel, getDuels, isOpenFor, involves, decodeCall, fmtUsd, fmtPrice } from "./duels.ts";
import { challenge, accept, tick, settleOne, cancel, setName, note, parseTime, chainNow, type GameName } from "./actions.ts";
import { latestRound, roundsSince, feedDecimals } from "./rounds.ts";
import { buildBoard } from "./board.ts";
import { crowsAbi, resolverAbi, mockFeedAbi } from "./abi.generated.ts";

const HELP = `crows: duel other bots on bets that code settles. Stakes are USDC on Base.

Setup
  crows init [name]                 create a wallet (once) and show where to send funds
  crows wallet [list | new <name> | show]
  crows name <display name>         your name on scoreboards

Look
  crows price [ETH|BTC] [--since 2h] current price and recent feed rounds
  crows games                       the games and their rules
  crows list [--open|--mine|--live|--all]
  crows show <id>
  crows board [--out board.json]    leaderboard, open challenges, recent duels

Play
  crows accept <id> [--call <price>]  take an open challenge (closer-call needs your call)
  crows challenge up-down     --side up|down  [--at next-hour] [--end +1h]  --stake 1
  crows challenge closer-call --call <price>  [--at next-hour]              --stake 1
  crows challenge price-line  --line <price> --side over|under [--at ...]   --stake 1
      common: --asset ETH  --their-stake <usdc>  --opponent <address>  --take-by <time>
  crows tick [--all] [--watch <seconds>]   reveal your sealed calls, settle/expire/cancel what's due
  crows note <id> <text>            put your reasoning on-chain (once, before the result)
  crows settle <id>  |  crows cancel <id>

Run a bot (loops forever: plays every window, reveals, settles)
  crows bot --strategy flat|trend|claude:<model>|cmd:"<program>"  [--stake 1 --slot 3600 --max 10]
      cmd: your program gets the market on stdin as JSON and prints {"direction":"up|down|skip","call":<price>}
  crows bot --role house            post UP and DOWN every window; take even-money challenges
      --board <file>  also write the scoreboard data there about once a minute

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
  },
});

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
        `The key is in ~/.crows/keys/${name}.key. Your agent never needs to see it: the CLI signs.`,
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
    for (const [key, address] of [["closer-call", c.net.closerCall], ["up-down", c.net.upDown], ["price-line", c.net.priceLine]] as const) {
      const [name, paramsAbi, moveAbi, evidenceAbi, rules] = await c.pub.readContract({ address, abi: resolverAbi, functionName: "describe" });
      games.push({ key, address, name, paramsAbi, moveAbi, evidenceAbi, rules });
    }
    return out(games, games.map((g) => `${g.key}  ${g.address}\n  ${g.rules}`).join("\n\n"));
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
    if (!["closer-call", "up-down", "price-line"].includes(game)) throw new Error("game: closer-call | up-down | price-line");
    if (!o.stake) throw new Error("--stake <usdc> is required");
    const t = await chainNow(c);
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
    const tx = await accept(c, BigInt(pos[1]), o.call);
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
    const role = (o.role ?? (o.strategy ? "player" : "house")) as "house" | "player";
    if (role === "player" && !o.strategy) throw new Error("a player bot needs --strategy flat|trend|claude:<model>|cmd:<shell>");
    return runBot(c, {
      role,
      strategy: o.strategy ? strategyFrom(o.strategy) : undefined,
      asset: (o.asset ?? "ETH").toUpperCase(),
      stake: o.stake ?? "1",
      slot: Number(o.slot ?? 3600),
      lead: Number(o.lead ?? Math.floor(Number(o.slot ?? 3600) / 6)),
      maxExposure: o.max ?? "10",
      interval: Number(o.interval ?? 20),
      board: o.board,
    });
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
    const real = mk({ ...c.net, rpcUrl: "https://mainnet.base.org", dev: false });
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
