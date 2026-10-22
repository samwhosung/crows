import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatUnits, parseUnits, type Address } from "viem";
import type { Clients } from "./chain.ts";
import { explain } from "./chain.ts";
import { crowsHome } from "./config.ts";
import { accept, challenge, challengeGame, chainNow, note, parseTime, tick } from "./actions.ts";
import { getDuel, getDuels, duelCount, isOpenFor, involves, fmtUsd, winnerOf, type Duel } from "./duels.ts";
import { feedDecimals, latestRound, roundsSince } from "./rounds.ts";
import type { Pick, Strategy, View } from "./strategies.ts";
import type { Offer } from "./agents.ts";
import { crowsAbi } from "./abi.generated.ts";
import { BASE_FEED_INFO } from "./config.ts";
import { decodeJson, deployGame, describeGame, gamesDir, initWorkspace, ownFiles, sourceOf } from "./games.ts";
import { readVerdicts, recordVerdict, type Verdict } from "./verdicts.ts";

export type BotOpts = {
  /** house: posts and takes even-money price bets (retired by decision 0015). keeper: only chores and the board. */
  role: "house" | "player" | "keeper";
  strategy?: Strategy;
  asset: string;
  stake: string; // USDC per duel
  slot: number; // window length in seconds (3600 = hourly)
  lead: number; // posting opens this many seconds before a window starts
  maxExposure: string; // USDC that may be locked at once
  interval: number; // seconds between loops
  board?: string; // if set, write the scoreboard data to this file about once a minute
  hourly: boolean; // play the hourly ETH table (players)
  inventEvery?: number; // seconds between inventing new games, if the strategy can
  maxTake: string; // largest stake (USDC) to put up when taking someone's game
  workspace?: string; // where this bot writes its games
  ours?: Address[]; // our own bots' addresses, so the board can tell outsiders apart
};

type JournalEntry = {
  slot: number;
  at: number;
  strategy?: string;
  pick?: Pick;
  duels: string[];
  note?: string;
  kind?: "judged" | "invented";
  take?: boolean;
  reason?: string;
};

function journalPath(network: string, who: Address) {
  const dir = join(crowsHome(), network);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${who.toLowerCase()}.journal.jsonl`);
}

export function readJournal(network: string, who: Address): JournalEntry[] {
  const p = journalPath(network, who);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

const log = (who: string, msg: string) => console.log(`${new Date().toISOString()} [${who}] ${msg}`);


/**
 * One loop, forever: do chores (reveal, settle, cancel), then play the current slot.
 *  - house: posts an UP and a DOWN up-down challenge for every window, and takes any even-money up-down or
 *    closer-call challenge from others (calling the current price). It never forms a view: it is the random walk.
 *  - player: asks its strategy once per window, takes the house's opposite side (or posts its own), and posts
 *    a closer-call with its call.
 */
export async function runBot(c: Clients, o: BotOpts) {
  const me = c.account!.address;
  // A local fork starts with mainnet's duels in it; CROWS_FROM_DUEL makes the bots ignore everything before it.
  const fromDuel = BigInt(process.env.CROWS_FROM_DUEL ?? "0");
  const tag = o.role === "player" ? (o.strategy?.name ?? "player") : o.role;
  const feed = c.net.feeds[o.asset];
  if (!feed) throw new Error(`no feed for ${o.asset}`);
  const dec = await feedDecimals(c, feed);
  const stake = parseUnits(o.stake, 6);
  const maxExposure = parseUnits(o.maxExposure, 6);
  const done = new Set(readJournal(c.net.name, me).map((j) => j.slot));
  let lastBoard = 0;
  log(tag, `${me} on ${c.net.name}: ${o.asset}, $${o.stake} stakes, ${o.slot}s windows`);

  for (;;) {
    try {
      const r = await tick(c, { all: o.role !== "player" });
      const did = [
        r.revealed.length && `revealed ${r.revealed}`,
        r.settled.length && `settled ${r.settled}`,
        r.expired.length && `expired ${r.expired}`,
        r.cancelled.length && `cancelled ${r.cancelled}`,
      ].filter(Boolean);
      if (did.length) log(tag, did.join(", "));
      for (const e of r.errors) log(tag, `chore failed: ${e}`);

      const t = await chainNow(c);
      const S = ((t + BigInt(o.slot) - 1n) / BigInt(o.slot)) * BigInt(o.slot); // next window start
      const inWindow = S - t <= BigInt(o.lead) && S > t;
      const count = await duelCount(c);
      const since = count > 300n ? count - 300n : 0n;
      const recent = await getDuels(c, since > fromDuel ? since : fromDuel, count);
      let exposure = recent
        .filter((d) => (d.state === "open" || d.state === "live") && involves(d, me))
        .reduce((s, d) => s + (d.a.player.toLowerCase() === me.toLowerCase() ? d.a.stake : d.b.stake), 0n);

      if (o.role === "house") {
        if (inWindow) await housePost(c, o, S, recent, exposure, maxExposure, tag);
        await houseTake(c, o, t, recent, exposure, maxExposure, stake, dec, feed, tag);
      } else if (o.role === "player") {
        const s = o.strategy!;
        if (o.hourly && s.decide && inWindow && S - t <= BigInt(o.lead - Math.min(60, Math.floor(o.lead / 4))) && !done.has(Number(S))) {
          // Players wait a little into the posting window, so the house's bets are usually already up.
          done.add(Number(S));
          await playerPlay(c, o, S, t, recent, exposure, maxExposure, stake, dec, feed, tag);
        }
        if (s.judge) exposure = await judgeOpen(c, o, t, recent, exposure, maxExposure, tag);
        if (s.invent && o.inventEvery) await inventOne(c, o, t, recent, exposure, maxExposure, tag);
      }
      if (o.board && Date.now() - lastBoard > 55_000) {
        lastBoard = Date.now();
        const { buildBoard } = await import("./board.ts");
        const b = await buildBoard(c, { ours: o.ours });
        writeFileSync(o.board + ".tmp", JSON.stringify(b, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
        renameSync(o.board + ".tmp", o.board);
      }
    } catch (e) {
      log(tag, `loop error: ${explain(e)}`);
    }
    await new Promise((res) => setTimeout(res, o.interval * 1000));
  }
}

async function housePost(c: Clients, o: BotOpts, S: bigint, recent: Duel[], exposure: bigint, max: bigint, tag: string) {
  const me = c.account!.address.toLowerCase();
  const mine = recent.filter(
    (d) => d.a.player.toLowerCase() === me && d.game.kind === "up-down" && d.game.start === S,
  );
  for (const side of ["up", "down"] as const) {
    if (mine.some((d) => d.game.kind === "up-down" && d.game.challengerUp === (side === "up"))) continue;
    if (exposure + parseUnits(o.stake, 6) > max) return log(tag, `exposure cap reached, not posting ${side}`);
    const r = await challenge(c, {
      game: "up-down",
      asset: o.asset,
      side,
      at: S,
      end: S + BigInt(o.slot),
      stake: o.stake,
      takeBy: S - 60n,
    });
    exposure += parseUnits(o.stake, 6);
    journal(c, { slot: Number(S), at: Date.now(), duels: [r.id.toString()], note: `posted ${side}` });
    log(tag, `posted #${r.id}: ${o.asset} ${side.toUpperCase()} ${hhmm(S)}-${hhmm(S + BigInt(o.slot))}`);
  }
}

/** Take others' challenges when the odds are even or better for the house. */
async function houseTake(
  c: Clients,
  o: BotOpts,
  t: bigint,
  recent: Duel[],
  exposure: bigint,
  max: bigint,
  stake: bigint,
  dec: number,
  feed: Address,
  tag: string,
) {
  const me = c.account!.address;
  for (const d of recent) {
    if (!isOpenFor(d, me, t)) continue;
    if (d.token.toLowerCase() !== c.net.usdc.toLowerCase()) continue;
    if (d.stakeB > d.a.stake || d.stakeB > stake * 5n) continue; // even money or better, and not huge
    if (exposure + d.stakeB > max) continue;
    let call: string | undefined;
    if (d.game.kind === "up-down") {
      if (d.game.feed.toLowerCase() !== feed.toLowerCase() || d.game.end - d.game.start < 60n) continue;
    } else if (d.game.kind === "closer-call") {
      if (d.game.feed.toLowerCase() !== feed.toLowerCase() || d.game.at - t < BigInt(o.slot) / 2n) continue;
      call = formatUnits((await latestRound(c, feed)).answer, dec); // flat: the price won't move
    } else continue;
    try {
      await accept(c, d.id, call);
      exposure += d.stakeB;
      journal(c, { slot: 0, at: Date.now(), duels: [d.id.toString()], note: `took ${d.game.kind}${call ? ` calling ${call}` : ""}` });
      log(tag, `took #${d.id} (${d.game.kind}${call ? `, call ${Number(call).toFixed(2)}` : ""})`);
    } catch (e) {
      log(tag, `couldn't take #${d.id}: ${explain(e)}`);
    }
  }
}

async function playerPlay(
  c: Clients,
  o: BotOpts,
  S: bigint,
  t: bigint,
  recent: Duel[],
  exposure: bigint,
  max: bigint,
  stake: bigint,
  dec: number,
  feed: Address,
  tag: string,
) {
  const end = S + BigInt(o.slot);
  const rounds = await roundsSince(c, feed, t - 86400n, 600);
  const latest = rounds[rounds.length - 1] ?? (await latestRound(c, feed));
  const toNum = (x: bigint) => Number(formatUnits(x, dec));
  const view: View = {
    asset: o.asset,
    now: Number(t),
    price: toNum(latest.answer),
    windowStart: Number(S),
    windowEnd: Number(end),
    history: rounds.map((r) => ({ time: Number(r.updatedAt), price: toNum(r.answer) })),
  };
  const pick = await o.strategy!.decide!(view);
  log(tag, `window ${hhmm(S)}-${hhmm(end)}: ${pick.direction}, call ${pick.call?.toFixed(2) ?? "-"}. ${pick.reason ?? ""}`);
  const duels: string[] = [];

  if (pick.direction !== "skip" && exposure + stake <= max) {
    const me = c.account!.address;
    // The strategy may have taken a while: look at the table again before choosing what to take.
    const count = await duelCount(c);
    recent = await getDuels(c, count > 300n ? count - 300n : 0n, count);
    t = await chainNow(c);
    // Taking a challenger's side gives me the opposite one, so to go UP I take a DOWN challenge.
    const offer = recent.find(
      (d) =>
        isOpenFor(d, me, t) &&
        d.game.kind === "up-down" &&
        d.game.start === S &&
        d.game.end === end &&
        d.game.challengerUp === (pick.direction === "down") &&
        d.stakeB <= stake &&
        d.stakeB <= d.a.stake,
    );
    try {
      if (offer) {
        await accept(c, offer.id);
        duels.push(offer.id.toString());
        log(tag, `took #${offer.id}: ${pick.direction.toUpperCase()}`);
      } else {
        const r = await challenge(c, { game: "up-down", asset: o.asset, side: pick.direction, at: S, end, stake: o.stake, takeBy: S - 60n });
        duels.push(r.id.toString());
        log(tag, `posted #${r.id}: ${pick.direction.toUpperCase()}`);
      }
      exposure += stake;
    } catch (e) {
      log(tag, `up-down failed: ${explain(e)}`);
    }
  }

  if (pick.call && exposure + stake <= max) {
    try {
      const r = await challenge(c, {
        game: "closer-call",
        asset: o.asset,
        call: pick.call.toFixed(Math.min(dec, 8)),
        at: end,
        takeBy: S,
        stake: o.stake,
      });
      duels.push(r.id.toString());
      log(tag, `posted #${r.id}: closer-call ${pick.call.toFixed(2)} for ${hhmm(end)}`);
    } catch (e) {
      log(tag, `closer-call failed: ${explain(e)}`);
    }
  }
  journal(c, { slot: Number(S), at: Date.now(), strategy: o.strategy!.name, pick, duels });
  // Put the reasoning on-chain before anyone knows the result.
  if (pick.reason) {
    for (const id of duels) {
      try {
        await note(c, BigInt(id), pick.reason);
      } catch (e) {
        log(tag, `note on #${id} failed: ${explain(e)}`);
      }
    }
  }
}

function journal(c: Clients, e: JournalEntry) {
  appendFileSync(journalPath(c.net.name, c.account!.address), JSON.stringify(e) + "\n");
}

function hhmm(t: bigint) {
  return new Date(Number(t) * 1000).toISOString().slice(11, 16);
}

// ------------------------------------------------------------------ games other agents invented

/** Wins, losses, draws and net USDC per address, from settled duels. */
export function recordsOf(duels: Duel[]) {
  const r = new Map<string, { w: number; l: number; d: number; net: bigint }>();
  const get = (a: string) => r.get(a.toLowerCase()) ?? r.set(a.toLowerCase(), { w: 0, l: 0, d: 0, net: 0n }).get(a.toLowerCase())!;
  for (const d of duels) {
    if (d.state !== "settled") continue;
    const a = get(d.a.player);
    const b = get(d.b.player);
    const w = winnerOf(d);
    if (!w) (a.d++, b.d++);
    else if (w === d.a.player) (a.w++, b.l++, (a.net += d.b.stake), (b.net -= d.b.stake));
    else (b.w++, a.l++, (b.net += d.a.stake), (a.net -= d.a.stake));
  }
  return (addr: string) => {
    const x = r.get(addr.toLowerCase());
    if (!x) return "no duels yet";
    return `${x.w} won, ${x.l} lost, ${x.d} drawn, net ${x.net < 0n ? "-" : "+"}$${fmtUsd(x.net < 0n ? -x.net : x.net)}`;
  };
}

const iso = (t: bigint) => new Date(Number(t) * 1000).toISOString().replace(".000Z", "Z");

async function nameOf(c: Clients, a: Address) {
  const n = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "nameOf", args: [a] });
  return n || `${a.slice(0, 6)}…${a.slice(-4)}`;
}

async function noteOf(c: Clients, id: bigint, who: Address) {
  const [text] = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "noteOf", args: [id, who] });
  return text || null;
}

/** The feeds games can read, with this network's addresses (a local fork swaps in a hand-driven ETH feed). */
function feedsText(c: Clients) {
  return BASE_FEED_INFO.map(
    (f) => `${f.symbol} ${c.net.feeds[f.symbol] ?? f.address} ${f.name}: new round on a ${f.deviation}% move, at least every ${f.heartbeat >= 3600 ? f.heartbeat / 3600 + "h" : f.heartbeat / 60 + "m"}`,
  ).join("\n");
}


const q = (s: string | null | undefined) => (s ? `"${s.replace(/\s+/g, " ").slice(0, 200)}"` : "");

/** One line on how a dare went: who took it and why, or who declined it and why, and the result. */
async function dareFate(c: Clients, d: Duel, verdicts: Verdict[]): Promise<string> {
  const parts: string[] = [];
  if (d.b.player !== zeroAddr) {
    const [bn, bNote] = await Promise.all([nameOf(c, d.b.player), noteOf(c, d.id, d.b.player)]);
    parts.push(`taken by ${bn}${bNote ? `, who wrote ${q(bNote)}` : ""}`);
  }
  const declined = verdicts.filter((v) => v.duel === d.id.toString() && !v.take && v.judge.toLowerCase() !== d.a.player.toLowerCase());
  if (declined.length) {
    parts.push(
      `declined by ${declined
        .map((v) => {
          const o = v.odds ? v.odds.split(":") : null;
          return `${v.name} (${q(v.reason)}${o ? `; would take it staking ${o[0]} against your ${o[1]}` : ""})`;
        })
        .join("; ")}`,
    );
  }
  if (d.state === "cancelled") parts.push("expired untaken");
  else if (d.state === "settled") {
    const w = winnerOf(d);
    parts.push(w ? `${w === d.a.player ? "the challenger" : "the taker"} won $${fmtUsd(w === d.a.player ? d.b.stake : d.a.stake)}` : "a draw");
  } else parts.push(d.state);
  return parts.join("; ");
}

/** A player's earlier dares on invented games, one line each, newest last. What a judge needs to know them by. */
async function dareHistory(c: Clients, who: Address, recent: Duel[], verdicts: Verdict[], except?: bigint): Promise<string> {
  const lines: string[] = [];
  for (const d of recent) {
    if (d.a.player.toLowerCase() !== who.toLowerCase() || d.id === except) continue;
    if (d.game.kind !== "custom" && d.game.kind !== "duel-bet") continue;
    const info = d.game.kind === "custom" ? await describeGame(c, d.resolver).catch(() => null) : null;
    const pitch = await noteOf(c, d.id, who);
    lines.push(`- #${d.id} ${info?.name ?? d.game.kind}${pitch ? `, pitched ${q(pitch)}` : ""}: ${await dareFate(c, d, verdicts)}`);
  }
  return lines.slice(-8).join("\n");
}

/** Look at open challenges on invented games and spectator bets, and take the ones the strategy likes. */
async function judgeOpen(c: Clients, o: BotOpts, t: bigint, recent: Duel[], exposure: bigint, max: bigint, tag: string): Promise<bigint> {
  const me = c.account!.address;
  const s = o.strategy!;
  const judged = new Set(readJournal(c.net.name, me).filter((j) => j.kind === "judged").flatMap((j) => j.duels));
  const maxTake = parseUnits(o.maxTake, 6);
  const record = recordsOf(recent);
  for (const d of recent) {
    if (!isOpenFor(d, me, t) || judged.has(d.id.toString())) continue;
    if (d.game.kind !== "custom" && d.game.kind !== "duel-bet") continue;
    if (d.token.toLowerCase() !== c.net.usdc.toLowerCase() || d.stakeB > maxTake || exposure + d.stakeB > max) continue;
    if (d.takeBy - t < 180n) continue; // too close to the deadline to take safely
    if (s.judgeWithin && d.takeBy - t > BigInt(s.judgeWithin)) continue; // not yet: this bot arrives late
    let verdict;
    try {
      const info = await describeGame(c, d.resolver);
      const src = await sourceOf(c, d.resolver);
      let context = "";
      if (d.game.kind === "duel-bet") {
        const u = await getDuel(c, d.game.duel);
        const ui = await describeGame(c, u.resolver).catch(() => null);
        const [ua, ub, pa] = await Promise.all([nameOf(c, u.a.player), u.b.player === zeroAddr ? "" : nameOf(c, u.b.player), noteOf(c, u.id, u.a.player)]);
        context = `This is a bet on duel #${u.id}: ${ui?.name ?? u.game.kind} between ${ua} (side A, the challenger) and ${ub || "whoever takes it"} (side B). Its state: ${u.state}. ${pa ? `${ua} said: "${pa}". ` : ""}Rules of that game: ${ui?.rules ?? ""}`;
      }
      const offer: Offer = {
        duel: d.id.toString(),
        game: { address: info.address, name: info.name, rules: info.rules + (context ? `\n\n${context}` : ""), paramsAbi: info.paramsAbi, moveAbi: info.moveAbi },
        params: decodeJson(info.paramsAbi, d.params),
        source: { published: src.verified, files: ownFiles(src.files) },
        challenger: {
          address: d.a.player,
          name: await nameOf(c, d.a.player),
          record: record(d.a.player),
          history: await dareHistory(c, d.a.player, recent, readVerdicts(c.net.name), d.id),
        },
        pitch: await noteOf(c, d.id, d.a.player),
        stakes: { theirs: fmtUsd(d.a.stake), yours: fmtUsd(d.stakeB) },
        times: { now: iso(t), takeBy: iso(d.takeBy), revealBy: iso(d.revealBy), settleBy: iso(d.settleBy) },
        me: { name: await nameOf(c, me), record: record(me) },
        feeds: feedsText(c),
      };
      verdict = await s.judge!(offer);
    } catch (e) {
      log(tag, `couldn't judge #${d.id}: ${explain(e)}`);
      continue;
    }
    journal(c, { slot: 0, at: Date.now(), duels: [d.id.toString()], kind: "judged", take: verdict.take, reason: verdict.reason });
    recordVerdict(c.net.name, {
      at: Date.now(),
      duel: d.id.toString(),
      judge: me,
      name: await nameOf(c, me),
      take: verdict.take,
      reason: verdict.reason,
      odds: verdict.odds ?? null,
    });
    if (!verdict.take) {
      log(tag, `declined #${d.id}${verdict.odds ? ` (would take it at ${verdict.odds})` : ""}: ${verdict.reason}`);
      continue;
    }
    try {
      await accept(c, d.id, undefined, verdict.move);
      exposure += d.stakeB;
      log(tag, `took #${d.id}${verdict.move !== undefined ? ` with ${JSON.stringify(verdict.move)}` : ""}: ${verdict.reason}`);
      if (verdict.reason) await note(c, d.id, verdict.reason).catch((e) => log(tag, `note on #${d.id} failed: ${explain(e)}`));
    } catch (e) {
      log(tag, `couldn't take #${d.id}: ${explain(e)}`);
    }
  }
  return exposure;
}

const zeroAddr = "0x0000000000000000000000000000000000000000";

/** Every `inventEvery` seconds: invent a game (or a spectator bet), deploy it, and post the first challenge. */
async function inventOne(c: Clients, o: BotOpts, t: bigint, recent: Duel[], exposure: bigint, max: bigint, tag: string) {
  const me = c.account!.address;
  const j = readJournal(c.net.name, me).filter((e) => e.kind === "invented");
  const lastDone = j.filter((e) => e.duels.length).at(-1)?.at ?? 0;
  const lastFailed = j.filter((e) => e.note === "failed").at(-1)?.at ?? 0;
  if (Date.now() - lastDone < o.inventEvery! * 1000) return;
  if (Date.now() - lastFailed < 15 * 60_000) return; // no tight retry loops
  if (exposure + parseUnits("2", 6) > max) return;

  const ws = o.workspace ?? join(gamesDir(), tag.replace(/[^a-z0-9._-]/gi, "-"));
  if (!existsSync(join(ws, "foundry.toml"))) initWorkspace(ws);
  const record = recordsOf(recent);

  // Games so far: one line each, oldest first. Names and rules come from the games themselves.
  const byGame = new Map<string, Duel[]>();
  for (const d of recent) if (d.game.kind === "custom") byGame.set(d.resolver.toLowerCase(), [...(byGame.get(d.resolver.toLowerCase()) ?? []), d]);
  const verdicts = readVerdicts(c.net.name);
  const past: string[] = [];
  const myDares: string[] = [];
  for (const ds of byGame.values()) {
    const info = await describeGame(c, ds[0].resolver).catch(() => null);
    if (!info) continue;
    const by = await nameOf(c, ds[0].a.player);
    const mine = ds[0].a.player.toLowerCase() === me.toLowerCase();
    const fates = await Promise.all(ds.map(async (d) => `#${d.id}: ${await dareFate(c, d, verdicts)}`));
    const line = `- ${info.name.slice(0, 40)} at ${ds[0].resolver} by ${mine ? "you" : by} (params ${info.paramsAbi || "()"}, move ${info.moveAbi || "none"}): ${info.rules.replace(/\s+/g, " ").slice(0, 220)} [${fates.join(" | ")}]`;
    (mine ? myDares : past).push(line);
    if (mine) {
      const pitch = await noteOf(c, ds[0].id, me);
      if (pitch) myDares.push(`  your pitch was ${q(pitch)}`);
    }
  }
  const openDuels: string[] = [];
  for (const d of recent) {
    if ((d.state !== "open" && d.state !== "live") || d.takeBy - t < 50n * 60n || involves(d, me)) continue;
    const info = d.game.kind === "custom" ? await describeGame(c, d.resolver).catch(() => null) : null;
    const [a, b] = await Promise.all([nameOf(c, d.a.player), d.b.player === zeroAddr ? Promise.resolve("(open)") : nameOf(c, d.b.player)]);
    openDuels.push(`- #${d.id} ${info?.name ?? d.game.kind}: A=${a}, B=${b}, taking closes ${iso(d.takeBy)}`);
  }

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const inv = await o.strategy!.invent!({
        me: { name: await nameOf(c, me), record: record(me) },
        now: iso(t),
        crows: c.net.crows,
        feeds: feedsText(c),
        pastGames: past.join("\n"),
        myDares: myDares.join("\n"),
        openDuels: openDuels.join("\n"),
        workspace: ws,
        duelBets: !!c.net.duelBet,
        lastError,
      });
      const cap = (x: string) => (Number(x) > 0 && Number(x) <= 2 ? x : "1");
      const now = await chainNow(c);
      let r: { id: bigint; tx: string };
      let label: string;
      if (inv.kind === "dare") {
        const info = await describeGame(c, inv.game);
        r = await challengeGame(c, {
          game: inv.game,
          params: inv.params,
          move: inv.move ?? undefined,
          stake: cap(inv.stake),
          theirStake: cap(inv.theirStake),
          takeBy: parseTime(inv.takeBy, now),
          revealBy: inv.revealBy ? parseTime(inv.revealBy, now) : undefined,
          settleBy: parseTime(inv.settleBy, now),
        });
        label = `${info.name} (an existing game)`;
      } else if (inv.kind === "duel-bet") {
        if (!c.net.duelBet) throw new Error("duel-bet isn't deployed on this network");
        const u = await getDuel(c, BigInt(inv.duel));
        r = await challengeGame(c, {
          game: c.net.duelBet,
          params: [inv.duel, inv.back === "a"],
          stake: cap(inv.stake),
          theirStake: cap(inv.theirStake),
          takeBy: u.takeBy,
          settleBy: u.settleBy + 2n * 3600n,
        });
        label = `a bet on #${inv.duel} (backing ${inv.back.toUpperCase()})`;
      } else {
        const dep = await deployGame(c, inv.contract, ws);
        log(tag, `deployed ${dep.info.name} at ${dep.address}${dep.verified ? " (source published)" : ""}`);
        if (!dep.verified && !c.net.dev) log(tag, `source NOT published: ${(dep.verifyLog ?? "").replace(/\s+/g, " ").slice(-300)}`);
        r = await challengeGame(c, {
          game: dep.address,
          params: inv.params,
          move: inv.move ?? undefined,
          stake: cap(inv.stake),
          theirStake: cap(inv.theirStake),
          takeBy: parseTime(inv.takeBy, now),
          revealBy: inv.revealBy ? parseTime(inv.revealBy, now) : undefined,
          settleBy: parseTime(inv.settleBy, now),
        });
        label = dep.info.name;
      }
      journal(c, { slot: 0, at: Date.now(), duels: [r.id.toString()], kind: "invented", note: label, reason: inv.pitch });
      log(tag, `posted #${r.id}: ${label}. "${inv.pitch}"`);
      if (inv.pitch) await note(c, r.id, inv.pitch).catch((e) => log(tag, `note on #${r.id} failed: ${explain(e)}`));
      return;
    } catch (e) {
      lastError = explain(e).slice(0, 1500);
      log(tag, `inventing failed (attempt ${attempt + 1}): ${lastError.slice(0, 300)}`);
    }
  }
  journal(c, { slot: 0, at: Date.now(), duels: [], kind: "invented", note: "failed", reason: lastError });
}
