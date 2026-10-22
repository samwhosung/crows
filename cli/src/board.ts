import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Address } from "viem";
import { crowsAbi } from "./abi.generated.ts";
import type { Clients } from "./chain.ts";
import { crowsHome } from "./config.ts";
import { getDuels, decodeCall, winnerOf, fmtUsd, fmtPrice, isOpenFor, type Duel } from "./duels.ts";
import { roundFrom } from "./rounds.ts";
import { chainNow } from "./actions.ts";

export type PlayerRow = {
  address: Address;
  name: string;
  duels: number;
  wins: number;
  losses: number;
  draws: number;
  pnl: string; // USDC, signed
  pnlUnits: string;
};

export type DuelRow = {
  id: string;
  game: string;
  state: string;
  a: Address;
  b: Address;
  aName: string;
  bName: string;
  stakeA: string;
  stakeB: string;
  outcome: string;
  winner: Address | null;
  time: number; // when the duel was decided (or will be)
  summary: string; // one human line
  take?: string; // CLI command to take it, for open duels
  notes?: { name: string; text: string }[]; // bots' own one-line reasons, when the board is built on their machine
  takeBy?: number;
};

export type Board = {
  network: string;
  crows: Address;
  updatedAt: number;
  chainTime: number;
  totals: { duels: number; settled: number; players: number; volume: string };
  players: PlayerRow[];
  open: DuelRow[];
  recent: DuelRow[];
};

/** Prices are immutable once proven, so cache them per feed and time. */
function priceCache(network: string) {
  const dir = join(crowsHome(), network);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "prices-v2.json"); // v2: first round at or after the time
  const data: Record<string, string> = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  return {
    async get(c: Clients, feed: Address, at: bigint): Promise<bigint | null> {
      const k = `${feed.toLowerCase()}:${at}`;
      if (data[k]) return BigInt(data[k]);
      const r = await roundFrom(c, feed, at);
      if (!r) return null;
      data[k] = r.answer.toString();
      return r.answer;
    },
    save() {
      writeFileSync(file, JSON.stringify(data));
    },
  };
}

const short = (a: Address) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const hhmm = (t: bigint) => new Date(Number(t) * 1000).toISOString().slice(11, 16) + " UTC";

/** Reasons bots on this machine gave for their picks, by duel id. */
function localNotes(network: string): Map<string, string> {
  const dir = join(crowsHome(), network);
  const notes = new Map<string, string>();
  if (!existsSync(dir)) return notes;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".journal.jsonl"))) {
    for (const line of readFileSync(join(dir, f), "utf8").split("\n").filter(Boolean)) {
      const j = JSON.parse(line);
      if (j.pick?.reason) for (const id of j.duels ?? []) notes.set(`${id}:${f.slice(0, 42)}`, j.pick.reason);
    }
  }
  return notes;
}

export async function buildBoard(c: Clients): Promise<Board> {
  const notes = localNotes(c.net.name);
  const duels = await getDuels(c);
  const t = await chainNow(c);
  const prices = priceCache(c.net.name);

  const players = new Set<Address>();
  for (const d of duels) {
    players.add(d.a.player);
    if (d.b.player !== "0x0000000000000000000000000000000000000000") players.add(d.b.player);
  }
  const names = new Map<string, string>();
  await Promise.all(
    [...players].map(async (p) => {
      const n = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "nameOf", args: [p] });
      names.set(p.toLowerCase(), n || short(p));
    }),
  );
  const nameOf = (a: Address) => names.get(a.toLowerCase()) ?? short(a);

  const rows = new Map<string, PlayerRow & { pnlN: bigint }>();
  const row = (a: Address) => {
    const k = a.toLowerCase();
    if (!rows.has(k))
      rows.set(k, { address: a, name: nameOf(a), duels: 0, wins: 0, losses: 0, draws: 0, pnl: "0", pnlUnits: "0", pnlN: 0n });
    return rows.get(k)!;
  };

  let volume = 0n;
  const recent: DuelRow[] = [];
  const open: DuelRow[] = [];
  for (const d of duels) {
    if (d.state === "settled") {
      volume += d.a.stake + d.b.stake;
      const ra = row(d.a.player);
      const rb = row(d.b.player);
      ra.duels++;
      rb.duels++;
      const w = winnerOf(d);
      if (!w) {
        ra.draws++;
        rb.draws++;
      } else if (w === d.a.player) {
        ra.wins++;
        rb.losses++;
        ra.pnlN += d.b.stake;
        rb.pnlN -= d.b.stake;
      } else {
        rb.wins++;
        ra.losses++;
        rb.pnlN += d.a.stake;
        ra.pnlN -= d.a.stake;
      }
    }
    if (d.state === "settled" || d.state === "live") {
      const r = await duelRow(c, d, nameOf, prices);
      const n = [d.a.player, d.b.player]
        .map((p) => ({ name: nameOf(p), text: notes.get(`${d.id}:${p.toLowerCase()}`) }))
        .filter((x): x is { name: string; text: string } => !!x.text);
      if (n.length) r.notes = n;
      recent.push(r);
    }
    if (isOpenFor(d, undefined, t)) open.push(await duelRow(c, d, nameOf, prices));
  }
  prices.save();

  const playerRows = [...rows.values()]
    .map(({ pnlN, ...r }) => ({ ...r, pnl: (pnlN < 0n ? "-" : "+") + fmtUsd(pnlN < 0n ? -pnlN : pnlN), pnlUnits: pnlN.toString() }))
    .sort((x, y) => (BigInt(y.pnlUnits) > BigInt(x.pnlUnits) ? 1 : BigInt(y.pnlUnits) < BigInt(x.pnlUnits) ? -1 : y.wins - x.wins));

  recent.sort((x, y) => y.time - x.time);
  open.sort((x, y) => (x.takeBy ?? 0) - (y.takeBy ?? 0));
  return {
    network: c.net.name,
    crows: c.net.crows,
    updatedAt: Math.floor(Date.now() / 1000),
    chainTime: Number(t),
    totals: { duels: duels.length, settled: duels.filter((d) => d.state === "settled").length, players: rows.size, volume: fmtUsd(volume) },
    players: playerRows,
    open,
    recent: recent.slice(0, 100),
  };
}

async function duelRow(
  c: Clients,
  d: Duel,
  nameOf: (a: Address) => string,
  prices: ReturnType<typeof priceCache>,
): Promise<DuelRow> {
  const aName = nameOf(d.a.player);
  const bName = d.b.player === "0x0000000000000000000000000000000000000000" ? "" : nameOf(d.b.player);
  const stakeA = fmtUsd(d.a.stake);
  const stakeB = fmtUsd(d.state === "open" ? d.stakeB : d.b.stake);
  const w = winnerOf(d);
  let summary = "";
  let time = Number(d.takeBy);
  let take: string | undefined;
  const g = d.game;
  if (g.kind === "closer-call") {
    time = Number(g.at);
    const ca = decodeCall(d.a.move);
    const cb = decodeCall(d.b.move);
    const p = d.state === "settled" ? await prices.get(c, g.feed, g.at) : null;
    summary =
      d.state === "open"
        ? `${aName} has a sealed call for ETH at ${hhmm(g.at)}. Closest call wins $${fmtUsd(d.a.stake + d.stakeB)}.`
        : `ETH at ${hhmm(g.at)}: ${aName} ${ca ? fmtPrice(ca) : "sealed"}, ${bName} ${cb ? fmtPrice(cb) : "sealed"}` +
          (p ? `. Price ${fmtPrice(p)}.` : ".");
    take = `crows accept ${d.id} --call <your ETH price for ${hhmm(g.at)}>`;
  } else if (g.kind === "up-down") {
    time = Number(g.end);
    const side = g.challengerUp ? "UP" : "DOWN";
    const other = g.challengerUp ? "DOWN" : "UP";
    if (d.state === "open") {
      summary = `${aName} says ETH goes ${side} from ${hhmm(g.start)} to ${hhmm(g.end)}. Take ${other} for $${stakeB} to win $${fmtUsd(d.a.stake + d.stakeB)}.`;
    } else {
      const [p0, p1] =
        d.state === "settled" ? await Promise.all([prices.get(c, g.feed, g.start), prices.get(c, g.feed, g.end)]) : [null, null];
      summary = `ETH ${hhmm(g.start)}→${hhmm(g.end)}: ${aName} ${side}, ${bName} ${other}` + (p0 && p1 ? `. ${fmtPrice(p0)} → ${fmtPrice(p1)}.` : ".");
    }
    take = `crows accept ${d.id}`;
  } else if (g.kind === "price-line") {
    time = Number(g.at);
    const side = g.challengerOver ? "OVER" : "UNDER";
    const p = d.state === "settled" ? await prices.get(c, g.feed, g.at) : null;
    summary = `ETH at ${hhmm(g.at)} vs ${fmtPrice(g.line)}: ${aName} ${side}` + (bName ? `, ${bName} ${g.challengerOver ? "UNDER" : "OVER"}` : "") + (p ? `. Price ${fmtPrice(p)}.` : ".");
    take = `crows accept ${d.id}`;
  } else {
    summary = `custom game ${short(d.resolver)}`;
    take = `crows show ${d.id}`;
  }
  if (d.state === "settled") summary += w ? ` ${nameOf(w)} wins $${fmtUsd(d.a.stake + d.b.stake)}.` : " Draw, stakes returned.";
  return {
    id: d.id.toString(),
    game: g.kind,
    state: d.state,
    a: d.a.player,
    b: d.b.player,
    aName,
    bName,
    stakeA,
    stakeB,
    outcome: d.outcome,
    winner: w,
    time,
    summary,
    take: d.state === "open" ? take : undefined,
    takeBy: d.state === "open" ? Number(d.takeBy) : undefined,
  };
}
