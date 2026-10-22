import { decodeAbiParameters, formatUnits, zeroAddress, type Address, type Hex } from "viem";
import { crowsAbi } from "./abi.generated.ts";
import type { Clients } from "./chain.ts";

export const STATES = ["none", "open", "live", "settled", "cancelled"] as const;
export const OUTCOMES = ["pending", "a-wins", "b-wins", "draw"] as const;
export type State = (typeof STATES)[number];
export type OutcomeName = (typeof OUTCOMES)[number];

export type Side = {
  player: Address;
  stake: bigint;
  expires: bigint;
  nonce: bigint;
  commitment: Hex;
  move: Hex;
};

export type Game =
  | { kind: "closer-call"; feed: Address; at: bigint }
  | { kind: "price-line"; feed: Address; at: bigint; line: bigint; challengerOver: boolean }
  | { kind: "up-down"; feed: Address; start: bigint; end: bigint; challengerUp: boolean }
  | { kind: "duel-bet"; duel: bigint; challengerBacksA: boolean }
  | { kind: "custom"; resolver: Address };

export type Duel = {
  id: bigint;
  resolver: Address;
  token: Address;
  opponent: Address;
  stakeB: bigint;
  takeBy: bigint;
  revealBy: bigint;
  settleBy: bigint;
  state: State;
  outcome: OutcomeName;
  params: Hex;
  a: Side;
  b: Side;
  game: Game;
};

export function decodeGame(c: Clients, resolver: Address, params: Hex): Game {
  const r = resolver.toLowerCase();
  const is = (current: Address, legacy: Address[]) => r === current.toLowerCase() || legacy.some((a) => a.toLowerCase() === r);
  try {
    if (is(c.net.closerCall, c.net.legacy.closerCall)) {
      const [feed, at] = decodeAbiParameters([{ type: "address" }, { type: "uint64" }], params);
      return { kind: "closer-call", feed, at };
    }
    if (is(c.net.priceLine, c.net.legacy.priceLine)) {
      const [feed, at, line, challengerOver] = decodeAbiParameters(
        [{ type: "address" }, { type: "uint64" }, { type: "int256" }, { type: "bool" }],
        params,
      );
      return { kind: "price-line", feed, at, line, challengerOver };
    }
    if (is(c.net.upDown, c.net.legacy.upDown)) {
      const [feed, start, end, challengerUp] = decodeAbiParameters(
        [{ type: "address" }, { type: "uint64" }, { type: "uint64" }, { type: "bool" }],
        params,
      );
      return { kind: "up-down", feed, start, end, challengerUp };
    }
    if (c.net.duelBet && r === c.net.duelBet.toLowerCase()) {
      const [duel, challengerBacksA] = decodeAbiParameters([{ type: "uint256" }, { type: "bool" }], params);
      return { kind: "duel-bet", duel, challengerBacksA };
    }
  } catch {}
  return { kind: "custom", resolver };
}

/** A revealed closer-call move as a number in feed units, or null. */
export function decodeCall(move: Hex): bigint | null {
  if (!move || move === "0x" || (move.length - 2) / 2 !== 32) return null;
  return decodeAbiParameters([{ type: "int256" }], move)[0];
}

function toDuel(c: Clients, id: bigint, raw: any): Duel {
  const side = (s: any): Side => ({
    player: s.player,
    stake: BigInt(s.stake),
    expires: BigInt(s.expires),
    nonce: BigInt(s.nonce),
    commitment: s.commitment,
    move: s.move,
  });
  return {
    id,
    resolver: raw.resolver,
    token: raw.token,
    opponent: raw.opponent,
    stakeB: BigInt(raw.stakeB),
    takeBy: BigInt(raw.takeBy),
    revealBy: BigInt(raw.revealBy),
    settleBy: BigInt(raw.settleBy),
    state: STATES[Number(raw.state)],
    outcome: OUTCOMES[Number(raw.outcome)],
    params: raw.params,
    a: side(raw.a),
    b: side(raw.b),
    game: decodeGame(c, raw.resolver, raw.params),
  };
}

export async function duelCount(c: Clients): Promise<bigint> {
  return c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "duelCount" });
}

// Settled and cancelled duels never change again, so they're read once per process. This keeps a bot's loop at a
// handful of calls instead of one per duel ever played (the public RPC rate-limits at a few hundred a minute).
const finalDuels = new Map<string, Duel>();

export async function getDuel(c: Clients, id: bigint): Promise<Duel> {
  const key = `${c.net.chainId}:${c.net.crows.toLowerCase()}:${id}`;
  const hit = finalDuels.get(key);
  if (hit) return hit;
  const raw = await c.pub.readContract({ address: c.net.crows, abi: crowsAbi, functionName: "getDuel", args: [id] });
  const d = toDuel(c, id, raw);
  if (d.state === "settled" || d.state === "cancelled") finalDuels.set(key, d);
  return d;
}

/** Read duels [from, to) in parallel batches (the transport batches JSON-RPC calls). */
export async function getDuels(c: Clients, from = 0n, to?: bigint): Promise<Duel[]> {
  const end = to ?? (await duelCount(c));
  const ids: bigint[] = [];
  for (let i = from; i < end; i++) ids.push(i);
  const out: Duel[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    out.push(...(await Promise.all(chunk.map((id) => getDuel(c, id)))));
  }
  return out;
}

export function involves(d: Duel, who: Address): boolean {
  const w = who.toLowerCase();
  return d.a.player.toLowerCase() === w || d.b.player.toLowerCase() === w;
}

export function isOpenFor(d: Duel, who: Address | undefined, now: bigint): boolean {
  if (d.state !== "open" || now > d.takeBy) return false;
  if (who && d.a.player.toLowerCase() === who.toLowerCase()) return false;
  return d.opponent === zeroAddress || (!!who && d.opponent.toLowerCase() === who.toLowerCase());
}

export function winnerOf(d: Duel): Address | null {
  if (d.state !== "settled") return null;
  if (d.outcome === "a-wins") return d.a.player;
  if (d.outcome === "b-wins") return d.b.player;
  return null;
}

export function fmtUsd(units: bigint, decimals = 6): string {
  const s = formatUnits(units, decimals);
  const [i, f = ""] = s.split(".");
  return `${i}.${(f + "00").slice(0, 2)}`;
}

export function fmtPrice(units: bigint, decimals = 8): string {
  const n = Number(formatUnits(units, decimals));
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
