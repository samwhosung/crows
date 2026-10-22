import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Address } from "viem";
import { crowsAbi } from "./abi.generated.ts";
import type { Clients } from "./chain.ts";
import { crowsHome } from "./config.ts";
import { getDuels, decodeCall, winnerOf, fmtUsd, fmtPrice, isOpenFor, type Duel } from "./duels.ts";
import { roundFrom } from "./rounds.ts";
import { chainNow } from "./actions.ts";
import { abiParams, describeGame, sourcifyUrl, type GameInfo } from "./games.ts";

export type PlayerRow = {
  address: Address;
  name: string;
  duels: number;
  wins: number;
  losses: number;
  draws: number;
  pnl: string; // USDC, signed
  pnlUnits: string;
  ours: boolean; // one of our own bots (false = an outsider)
};

/** Two players' record against each other. `net` is USDC from a's side. */
export type PairRow = { a: Address; aName: string; b: Address; bName: string; aWins: number; bWins: number; draws: number; net: string };

/** A game somebody published, with the duels played on it. */
export type GameRow = {
  address: Address;
  name: string;
  rules: string;
  inventor: Address;
  inventorName: string;
  duels: number;
  sourceUrl: string | null;
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
  read?: string; // CLI command to read the game's code, for open duels on published games
  notes?: { name: string; text: string }[]; // players' one-line reasons, recorded on-chain before the result
  takeBy?: number;
  gameAddress?: Address;
};

export type Board = {
  network: string;
  crows: Address;
  updatedAt: number;
  chainTime: number;
  totals: { duels: number; settled: number; players: number; volume: string };
  players: PlayerRow[];
  games: GameRow[]; // games published by players (not the built-in ones), newest first
  pairs: PairRow[]; // head-to-head records between players, from settled duels
  outsiders: { players: number; duels: number; games: number }; // activity by addresses that aren't ours
  open: DuelRow[];
  recent: DuelRow[];
};

export type BoardOpts = { ours?: Address[] };

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

export async function buildBoard(c: Clients, opts: BoardOpts = {}): Promise<Board> {
  const duels = await getDuels(c);
  const t = await chainNow(c);
  const prices = priceCache(c.net.name);
  const oursSet = new Set((opts.ours ?? []).map((a) => a.toLowerCase()));
  const isOurs = (a: Address) => (oursSet.size ? oursSet.has(a.toLowerCase()) : true);
  const builtIn = new Set(
    [c.net.closerCall, c.net.upDown, c.net.priceLine, c.net.duelBet ?? "0x", ...Object.values(c.net.legacy).flat()].map((a) => a.toLowerCase()),
  );
  const gameInfo = new Map<string, GameInfo | null>();
  const infoOf = async (a: Address) => {
    const k = a.toLowerCase();
    if (!gameInfo.has(k)) gameInfo.set(k, await describeGame(c, a).catch(() => null));
    return gameInfo.get(k)!;
  };

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
      rows.set(k, { address: a, name: nameOf(a), duels: 0, wins: 0, losses: 0, draws: 0, pnl: "0", pnlUnits: "0", ours: isOurs(a), pnlN: 0n });
    return rows.get(k)!;
  };

  let volume = 0n;
  const pairMap = new Map<string, PairRow & { netN: bigint }>();
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
      // Head to head, keyed with the lower address first so both orders land on one row.
      const [x, y] = [d.a.player, d.b.player].sort((p, q) => (p.toLowerCase() < q.toLowerCase() ? -1 : 1));
      const pk = `${x.toLowerCase()}|${y.toLowerCase()}`;
      if (!pairMap.has(pk)) pairMap.set(pk, { a: x, aName: nameOf(x), b: y, bName: nameOf(y), aWins: 0, bWins: 0, draws: 0, net: "0", netN: 0n });
      const pr = pairMap.get(pk)!;
      if (!w) pr.draws++;
      else if (w === x) (pr.aWins++, (pr.netN += w === d.a.player ? d.b.stake : d.a.stake));
      else (pr.bWins++, (pr.netN -= w === d.a.player ? d.b.stake : d.a.stake));
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
    const isOpen = isOpenFor(d, undefined, t);
    if (d.state === "settled" || d.state === "live" || isOpen) {
      const r = await duelRow(c, d, nameOf, prices, await infoOf(d.resolver));
      // Each player's on-chain note: written once, before the duel was decided. The challenger's is the pitch.
      const n = (
        await Promise.all(
          [d.a.player, d.b.player].filter((p) => p !== "0x0000000000000000000000000000000000000000").map(async (p) => {
            const [text] = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "noteOf", args: [d.id, p] });
            return { name: nameOf(p), text };
          }),
        )
      ).filter((x) => !!x.text);
      if (n.length) r.notes = n;
      (isOpen ? open : recent).push(r);
    }
  }
  prices.save();

  // Games players published themselves (anything that isn't one of the built-in games).
  const games: GameRow[] = [];
  const byGame = new Map<string, Duel[]>();
  for (const d of duels) {
    if (builtIn.has(d.resolver.toLowerCase())) continue;
    byGame.set(d.resolver.toLowerCase(), [...(byGame.get(d.resolver.toLowerCase()) ?? []), d]);
  }
  for (const ds of byGame.values()) {
    const info = await infoOf(ds[0].resolver);
    games.push({
      address: ds[0].resolver,
      name: info?.name ?? short(ds[0].resolver),
      rules: info?.rules ?? "",
      inventor: ds[0].a.player,
      inventorName: nameOf(ds[0].a.player),
      duels: ds.length,
      sourceUrl: c.net.name === "base" ? sourcifyUrl(c.net.chainId, ds[0].resolver) : null,
    });
  }
  games.reverse();
  const outsiders = {
    players: [...players].filter((p) => !isOurs(p)).length,
    duels: duels.filter((d) => !isOurs(d.a.player) || (d.b.player !== "0x0000000000000000000000000000000000000000" && !isOurs(d.b.player))).length,
    games: games.filter((g) => !isOurs(g.inventor)).length,
  };

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
    pairs: [...pairMap.values()].map(({ netN, ...r }) => ({ ...r, net: (netN < 0n ? "-" : "+") + fmtUsd(netN < 0n ? -netN : netN) })),
    games,
    outsiders,
    open,
    recent: recent.slice(0, 100),
  };
}

async function duelRow(
  c: Clients,
  d: Duel,
  nameOf: (a: Address) => string,
  prices: ReturnType<typeof priceCache>,
  info: GameInfo | null,
): Promise<DuelRow> {
  const aName = nameOf(d.a.player);
  const bName = d.b.player === "0x0000000000000000000000000000000000000000" ? "" : nameOf(d.b.player);
  const stakeA = fmtUsd(d.a.stake);
  const stakeB = fmtUsd(d.state === "open" ? d.stakeB : d.b.stake);
  const w = winnerOf(d);
  let summary = "";
  let time = Number(d.takeBy);
  let take: string | undefined;
  let read: string | undefined;
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
  } else if (g.kind === "duel-bet") {
    time = Number(d.settleBy);
    const side = g.challengerBacksA ? "the challenger" : "the taker";
    summary =
      d.state === "open"
        ? `${aName} backs ${side} in duel #${g.duel}, $${stakeA}. Back the other side for $${stakeB}.`
        : `Bet on duel #${g.duel}: ${aName} backs ${side}, ${bName} the other.`;
    take = `crows accept ${d.id}`;
    read = `crows show ${g.duel}`;
  } else {
    time = Number(d.settleBy);
    const name = info?.name ?? `game ${short(d.resolver)}`;
    const needsMove = !!info && abiParams(info.moveAbi).length > 0;
    summary =
      d.state === "open"
        ? `${aName} invented ${name} and dares anyone: $${stakeA} against your $${stakeB}.`
        : `${name}: ${aName} against ${bName}.`;
    take = needsMove ? `crows accept ${d.id} --move '<JSON for ${info!.moveAbi}>'` : `crows accept ${d.id}`;
    read = `crows game show ${d.id} --source`;
  }
  if (d.state === "settled") summary += w ? ` ${nameOf(w)} wins $${fmtUsd(d.a.stake + d.b.stake)}.` : " Draw, stakes returned.";
  return {
    id: d.id.toString(),
    game: g.kind === "custom" ? (info?.name ?? "custom") : g.kind,
    gameAddress: g.kind === "custom" ? d.resolver : undefined,
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
    read: d.state === "open" ? read : undefined,
    takeBy: d.state === "open" ? Number(d.takeBy) : undefined,
  };
}
