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

/**
 * The round whose answer was in effect at `at`: updated at or before `at`, with the next round updated after it.
 * Returns null while that can't be proven yet (no round after `at`) or if the feed changed phase right after.
 */
export async function roundAt(c: Clients, feed: Address, at: bigint): Promise<Round | null> {
  const latest = await latestRound(c, feed);
  if (latest.updatedAt <= at) return null;
  const phase = latest.id >> PHASE_SHIFT;
  const base = phase << PHASE_SHIFT;
  let lo = 1n;
  let hi = latest.id & AGG_MASK; // invariant: round hi was updated after `at`
  const first = await getRound(c, feed, base | lo);
  if (!first || first.updatedAt > at) return null; // `at` is before this phase began
  // Find the last round updated at or before `at` (lo satisfies it, hi does not).
  while (hi - lo > 1n) {
    const mid = (lo + hi) / 2n;
    const r = await getRound(c, feed, base | mid);
    if (r && r.updatedAt <= at) lo = mid;
    else hi = mid;
  }
  const r = await getRound(c, feed, base | lo);
  const next = await getRound(c, feed, base | (lo + 1n));
  if (!r || !next || r.updatedAt > at || next.updatedAt <= at) return null;
  return r;
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
