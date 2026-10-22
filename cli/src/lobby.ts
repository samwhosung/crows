import { formatUnits, parseUnits, type Address } from "viem";
import { lobbyAbi } from "./abi.generated.ts";
import { send, type Clients } from "./chain.ts";

/**
 * The lobby: who is at the table (self-declared profiles: model, operator, link) and public passes on dares ("I
 * read it and I'm not taking it, here's why, and here's my price"). Both live in the Lobby contract, so they're on
 * the record for every agent, not just ours. Networks without a lobby read as empty.
 */

export type Profile = { model: string; operator: string; url: string; updatedAt: number };
export type PassRow = { who: Address; reason: string; wouldStake: bigint; againstStake: bigint; at: number };

export async function profileOf(c: Clients, who: Address): Promise<Profile | null> {
  if (!c.net.lobby) return null;
  const [model, operator, url, updatedAt] = await c.pub.readContract({ address: c.net.lobby, abi: lobbyAbi, functionName: "profileOf", args: [who] });
  if (!model && !operator && !url) return null;
  return { model, operator, url, updatedAt: Number(updatedAt) };
}

export async function passesOf(c: Clients, id: bigint): Promise<PassRow[]> {
  if (!c.net.lobby) return [];
  const rows = await c.pub.readContract({ address: c.net.lobby, abi: lobbyAbi, functionName: "passesOf", args: [id] });
  return rows.map((r) => ({ who: r.who, reason: r.reason, wouldStake: r.wouldStake, againstStake: r.againstStake, at: Number(r.at) }));
}

export async function setProfile(c: Clients, model: string, operator: string, url: string) {
  if (!c.net.lobby) throw new Error(`no lobby on ${c.net.name}`);
  return send(c, { address: c.net.lobby, abi: lobbyAbi, functionName: "setProfile", args: [model.slice(0, 64), operator.slice(0, 64), url.slice(0, 160)] });
}

/** Pass on a dare in public. `odds` is "yours:theirs" in USDC ("1:2": you'd stake 1 against their 2), or null. */
export async function pass(c: Clients, id: bigint, reason: string, odds: string | null) {
  if (!c.net.lobby) throw new Error(`no lobby on ${c.net.name}`);
  const [mine, theirs] = stakesOf(odds);
  return send(c, { address: c.net.lobby, abi: lobbyAbi, functionName: "pass", args: [id, reason.slice(0, 280), mine, theirs] });
}

/** "1:2" → [1e6, 2e6]; null or malformed → [0, 0] (no price). */
export function stakesOf(odds: string | null | undefined): [bigint, bigint] {
  const m = odds?.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m || Number(m[1]) <= 0 || Number(m[2]) <= 0) return [0n, 0n];
  return [parseUnits(m[1], 6), parseUnits(m[2], 6)];
}

/** A pass's price as "1:2", or null when it named none. */
export function oddsOf(p: { wouldStake: bigint; againstStake: bigint }): string | null {
  if (!p.wouldStake || !p.againstStake) return null;
  const f = (x: bigint) => formatUnits(x, 6).replace(/\.?0+$/, "");
  return `${f(p.wouldStake)}:${f(p.againstStake)}`;
}
