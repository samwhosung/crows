import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { formatUnits, parseUnits, type Address } from "viem";
import type { Clients } from "./chain.ts";
import { explain } from "./chain.ts";
import { crowsHome } from "./config.ts";
import { accept, challenge, chainNow, tick } from "./actions.ts";
import { getDuels, duelCount, isOpenFor, involves, type Duel } from "./duels.ts";
import { feedDecimals, latestRound, roundsSince } from "./rounds.ts";
import type { Pick, Strategy, View } from "./strategies.ts";

export type BotOpts = {
  role: "house" | "player";
  strategy?: Strategy;
  asset: string;
  stake: string; // USDC per duel
  slot: number; // window length in seconds (3600 = hourly)
  lead: number; // posting opens this many seconds before a window starts
  maxExposure: string; // USDC that may be locked at once
  interval: number; // seconds between loops
};

type JournalEntry = { slot: number; at: number; strategy?: string; pick?: Pick; duels: string[]; note?: string };

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
  const tag = o.role === "house" ? "house" : (o.strategy?.name ?? "player");
  const feed = c.net.feeds[o.asset];
  if (!feed) throw new Error(`no feed for ${o.asset}`);
  const dec = await feedDecimals(c, feed);
  const stake = parseUnits(o.stake, 6);
  const maxExposure = parseUnits(o.maxExposure, 6);
  const done = new Set(readJournal(c.net.name, me).map((j) => j.slot));
  log(tag, `${me} on ${c.net.name}: ${o.asset}, $${o.stake} stakes, ${o.slot}s windows`);

  for (;;) {
    try {
      const r = await tick(c, { all: o.role === "house" });
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
      const recent = await getDuels(c, count > 300n ? count - 300n : 0n, count);
      const exposure = recent
        .filter((d) => (d.state === "open" || d.state === "live") && involves(d, me))
        .reduce((s, d) => s + (d.a.player.toLowerCase() === me.toLowerCase() ? d.a.stake : d.b.stake), 0n);

      if (o.role === "house") {
        if (inWindow) await housePost(c, o, S, recent, exposure, maxExposure, tag);
        await houseTake(c, o, t, recent, exposure, maxExposure, stake, dec, feed, tag);
      } else if (inWindow && S - t <= BigInt(o.lead - Math.min(60, Math.floor(o.lead / 4))) && !done.has(Number(S))) {
        // Players wait a little into the posting window, so the house's bets are usually already up.
        done.add(Number(S));
        await playerPlay(c, o, S, t, recent, exposure, maxExposure, stake, dec, feed, tag);
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
  const pick = await o.strategy!.decide(view);
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
}

function journal(c: Clients, e: JournalEntry) {
  appendFileSync(journalPath(c.net.name, c.account!.address), JSON.stringify(e) + "\n");
}

function hhmm(t: bigint) {
  return new Date(Number(t) * 1000).toISOString().slice(11, 16);
}
