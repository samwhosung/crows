import type { Address } from "viem";
import { feedAbi } from "./abi.generated.ts";
import type { Clients } from "./chain.ts";

export type Round = { id: bigint; answer: bigint; updatedAt: bigint };

const PHASE_SHIFT = 64n;
const AGG_MASK = (1n << 64n) - 1n;

export async function getRound(c: Clients, feed: Address, id: bigint): Promise<Round | null> {
  try {
    const [rid, answer, , updatedAt] = await c.pub.readContract({
      address: feed,
      abi: feedAbi,
      functionName: "getRoundData",
      args: [id],
    });
    if (rid !== id || updatedAt === 0n) return null;
    return { id, answer, updatedAt };
  } catch {
    return null;
  }
}

export async function latestRound(c: Clients, feed: Address): Promise<Round> {
  const [id, answer, , updatedAt] = await c.pub.readContract({ address: feed, abi: feedAbi, functionName: "latestRoundData" });
  return { id, answer, updatedAt };
}

export async function feedDecimals(c: Clients, feed: Address): Promise<number> {
  return Number(await c.pub.readContract({ address: feed, abi: feedAbi, functionName: "decimals" }));
}

/** Rounds posted since `since` (newest last). Walks back from the latest round. */
export async function roundsSince(c: Clients, feed: Address, since: bigint, max = 400): Promise<Round[]> {
  const latest = await latestRound(c, feed);
  const out: Round[] = [latest];
  const phaseBase = (latest.id >> PHASE_SHIFT) << PHASE_SHIFT;
  let id = latest.id;
  const batch = 20n;
  while (out.length < max && out[0].updatedAt > since && id - phaseBase > 1n) {
    const ids: bigint[] = [];
    for (let i = 1n; i <= batch && id - i > phaseBase; i++) ids.push(id - i);
    const rs = await Promise.all(ids.map((x) => getRound(c, feed, x)));
    for (const r of rs) if (r) out.unshift(r);
    id = ids[ids.length - 1];
    if (rs.every((r) => !r)) break;
  }
  return out.filter((r) => r.updatedAt >= since).sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1));
}

/**
 * The price a game uses for time `t`: the first round of the feed's current phase posted at or after `t`, at most
 * an hour later (the contracts' PriceAt.firstAtOrAfter). Returns null until such a round exists.
 */
export async function roundFrom(c: Clients, feed: Address, t: bigint): Promise<Round | null> {
  const MAX_DELAY = 3600n;
  const latest = await latestRound(c, feed);
  if (latest.updatedAt < t) return null;
  const base = (latest.id >> PHASE_SHIFT) << PHASE_SHIFT;
  let lo = 0n; // invariant: round lo (if > 0) was posted before t
  let hi = latest.id & AGG_MASK; // invariant: round hi was posted at or after t
  while (hi - lo > 1n) {
    const mid = (lo + hi) / 2n;
    const r = await getRound(c, feed, base | mid);
    if (r && r.updatedAt >= t) hi = mid;
    else lo = mid;
  }
  const r = await getRound(c, feed, base | hi);
  if (!r || r.updatedAt < t || r.updatedAt > t + MAX_DELAY) return null;
  return r;
}

