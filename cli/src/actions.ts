import { encodeAbiParameters, parseUnits, zeroAddress, zeroHash, type Address, type Hex, decodeEventLog } from "viem";
import { crowsAbi, resolverAbi } from "./abi.generated.ts";
import { send, ensureAllowance, explain, type Clients } from "./chain.ts";
import { getDuel, getDuels, involves, decodeCall, type Duel } from "./duels.ts";
import { roundFrom, feedDecimals } from "./rounds.ts";
import { sealMove, findMove } from "./store.ts";
import { abiParams, describeGame, encodeJson } from "./games.ts";

export const now = () => BigInt(Math.floor(Date.now() / 1000));

/** Chain time (a local fork may run ahead of the wall clock). */
export async function chainNow(c: Clients): Promise<bigint> {
  const b = await c.pub.getBlock({ blockTag: "latest" });
  return b.timestamp;
}

/**
 * Parse a time: unix seconds, ISO 8601, "+90m" / "+2h" / "+1d" (relative to `base`), or "next-hour"
 * (the next full hour at least 15 minutes after `base`).
 */
export function parseTime(s: string, base: bigint): bigint {
  const rel = /^\+(\d+)([smhd])$/.exec(s);
  if (rel) return base + BigInt(rel[1]) * { s: 1n, m: 60n, h: 3600n, d: 86400n }[rel[2] as "s" | "m" | "h" | "d"];
  if (s === "next-hour") return ((base + 15n * 60n) / 3600n + 1n) * 3600n;
  if (/^\d{9,11}$/.test(s)) return BigInt(s);
  const t = Date.parse(s);
  if (Number.isNaN(t)) throw new Error(`can't read time "${s}" (use unix seconds, ISO, +30m, +2h or next-hour)`);
  return BigInt(Math.floor(t / 1000));
}

export type GameName = "closer-call" | "price-line" | "up-down";

export type ChallengeOpts = {
  game: GameName;
  asset: string;
  at: bigint;
  stake: string; // in USDC
  theirStake?: string;
  opponent?: Address;
  call?: string; // closer-call: your sealed call, in dollars
  line?: string; // price-line: the line, in dollars
  side?: "over" | "under" | "up" | "down"; // price-line: over|under. up-down: up|down
  end?: bigint; // up-down: end of the window (start = `at`)
  takeBy?: bigint;
  revealBy?: bigint;
  settleBy?: bigint;
};

export async function challenge(c: Clients, o: ChallengeOpts): Promise<{ id: bigint; tx: Hex }> {
  const me = c.account!.address;
  const feed = c.net.feeds[o.asset.toUpperCase()];
  if (!feed) throw new Error(`no price feed for ${o.asset} on ${c.net.name}; known: ${Object.keys(c.net.feeds).join(", ")}`);
  const dec = await feedDecimals(c, feed);
  const t = await chainNow(c);
  // up-down: taking closes a minute before the window [at, end] starts. Others: 15 min from now (or before `at`).
  const takeBy = o.takeBy ?? (o.game === "up-down" ? o.at - 60n : t + 15n * 60n < o.at ? t + 15n * 60n : o.at - 60n);
  const last = o.game === "up-down" ? (o.end ?? o.at + 3600n) : o.at;
  const revealBy = o.revealBy ?? (o.game === "closer-call" ? o.at + 30n * 60n : takeBy);
  const settleBy = o.settleBy ?? last + 3n * 3600n;
  const stakeA = parseUnits(o.stake, 6);
  const stakeB = parseUnits(o.theirStake ?? o.stake, 6);

  let resolver: Address;
  let params: Hex;
  let commitment: Hex = zeroHash;
  if (o.game === "closer-call") {
    if (!o.call) throw new Error("closer-call needs --call <price>");
    resolver = c.net.closerCall;
    params = encodeAbiParameters([{ type: "address" }, { type: "uint64" }], [feed, o.at]);
    const move = encodeAbiParameters([{ type: "int256" }], [parseUnits(o.call, dec)]);
    commitment = sealMove(c.net, me, move, `call ${o.call} ${o.asset} at ${o.at}`);
  } else if (o.game === "up-down") {
    if (o.side !== "up" && o.side !== "down") throw new Error("up-down needs --side up|down");
    resolver = c.net.upDown;
    params = encodeAbiParameters(
      [{ type: "address" }, { type: "uint64" }, { type: "uint64" }, { type: "bool" }],
      [feed, o.at, last, o.side === "up"],
    );
  } else {
    if (!o.line || (o.side !== "over" && o.side !== "under"))
      throw new Error("price-line needs --line <price> and --side over|under");
    resolver = c.net.priceLine;
    params = encodeAbiParameters(
      [{ type: "address" }, { type: "uint64" }, { type: "int256" }, { type: "bool" }],
      [feed, o.at, parseUnits(o.line, dec), o.side === "over"],
    );
  }

  return postTerms(
    c,
    { resolver, params, token: c.net.usdc, stakeA, stakeB, opponent: o.opponent ?? zeroAddress, takeBy, revealBy, settleBy },
    commitment,
  );
}

type Terms = {
  resolver: Address;
  params: Hex;
  token: Address;
  stakeA: bigint;
  stakeB: bigint;
  opponent: Address;
  takeBy: bigint;
  revealBy: bigint;
  settleBy: bigint;
};

async function postTerms(c: Clients, terms: Terms, commitment: Hex): Promise<{ id: bigint; tx: Hex }> {
  await ensureAllowance(c, terms.token, c.net.crows, terms.stakeA);
  const tx = await send(c, { address: c.net.crows, abi: crowsAbi, functionName: "challenge", args: [terms, commitment] });
  const receipt = await c.pub.getTransactionReceipt({ hash: tx });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== c.net.crows.toLowerCase()) continue;
    try {
      const ev = decodeEventLog({ abi: crowsAbi, data: log.data, topics: log.topics });
      if (ev.eventName === "Challenged") return { id: ev.args.duel, tx };
    } catch {}
  }
  throw new Error(`challenge sent (${tx}) but no Challenged event found`);
}

export type GameChallengeOpts = {
  game: Address;
  params: unknown; // JSON: an array in paramsAbi order, or an object by parameter name
  move?: unknown; // JSON for moveAbi, if the game has moves (sealed until both sides are in)
  stake: string;
  theirStake?: string;
  opponent?: Address;
  takeBy: bigint;
  revealBy?: bigint;
  settleBy: bigint;
};

/** Challenge on any game, by address. Params and moves are plain JSON, encoded from the game's own describe(). */
export async function challengeGame(c: Clients, o: GameChallengeOpts): Promise<{ id: bigint; tx: Hex }> {
  const me = c.account!.address;
  const info = await describeGame(c, o.game);
  const t = await chainNow(c);
  const params = encodeJson(c, info.paramsAbi, o.params, t);
  const hasMoves = abiParams(info.moveAbi).length > 0;
  const revealBy = o.revealBy ?? (hasMoves ? o.takeBy + 30n * 60n : o.takeBy);
  const [ok, reason] = await c.pub.readContract({
    address: o.game,
    abi: resolverAbi,
    functionName: "validate",
    args: [params, o.takeBy, revealBy, o.settleBy],
  });
  if (!ok) throw new Error(`${info.name} rejects these terms: ${reason}`);
  let commitment: Hex = zeroHash;
  if (hasMoves) {
    if (o.move === undefined) throw new Error(`${info.name} needs your sealed move: --move '<JSON for ${info.moveAbi}>'`);
    commitment = sealMove(c.net, me, encodeJson(c, info.moveAbi, o.move, t), `${info.name} move`);
  }
  return postTerms(
    c,
    {
      resolver: o.game,
      params,
      token: c.net.usdc,
      stakeA: parseUnits(o.stake, 6),
      stakeB: parseUnits(o.theirStake ?? o.stake, 6),
      opponent: o.opponent ?? zeroAddress,
      takeBy: o.takeBy,
      revealBy,
      settleBy: o.settleBy,
    },
    commitment,
  );
}

export async function accept(c: Clients, id: bigint, call?: string, move?: unknown): Promise<Hex> {
  const me = c.account!.address;
  const d = await getDuel(c, id);
  if (d.state !== "open") throw new Error(`duel ${id} is ${d.state}, not open`);
  let commitment: Hex = zeroHash;
  if (d.game.kind === "closer-call") {
    if (!call) throw new Error("this is a closer-call duel: pass --call <price>");
    const dec = await feedDecimals(c, d.game.feed);
    const move = encodeAbiParameters([{ type: "int256" }], [parseUnits(call, dec)]);
    commitment = sealMove(c.net, me, move, `call ${call} in duel ${id}`);
  } else if (call) {
    throw new Error(`duel ${id} is a ${d.game.kind} duel and takes no call`);
  } else if (d.game.kind === "custom") {
    const info = await describeGame(c, d.resolver);
    if (abiParams(info.moveAbi).length) {
      if (move === undefined) throw new Error(`duel ${id} (${info.name}) needs your sealed move: --move '<JSON for ${info.moveAbi}>'`);
      commitment = sealMove(c.net, me, encodeJson(c, info.moveAbi, move, await chainNow(c)), `${info.name} move in duel ${id}`);
    }
  }
  await ensureAllowance(c, d.token, c.net.crows, d.stakeB);
  return send(c, { address: c.net.crows, abi: crowsAbi, functionName: "accept", args: [id, commitment] });
}

export type TickReport = { revealed: bigint[]; settled: bigint[]; expired: bigint[]; cancelled: bigint[]; errors: string[] };

/**
 * Do every chore that is due: reveal my sealed moves in live duels, then settle, expire or cancel any duel
 * (anyone's) that is ready. Safe to run as often as you like.
 */
export async function tick(c: Clients, opts: { all?: boolean; from?: bigint } = {}): Promise<TickReport> {
  const rep: TickReport = { revealed: [], settled: [], expired: [], cancelled: [], errors: [] };
  const t = await chainNow(c);
  const me = c.account?.address;
  const duels = await getDuels(c, opts.from ?? 0n);
  for (const d of duels) {
    try {
      if (me && (d.state === "live" || d.state === "open") && t <= d.revealBy) {
        // Reveal only once the duel is live: an open challenge's move must stay hidden from would-be takers.
        for (const s of [d.a, d.b]) {
          if (d.state !== "live" || s.player.toLowerCase() !== me.toLowerCase()) continue;
          if (s.move !== "0x" || s.commitment === zeroHash) continue;
          const saved = findMove(c.net.name, me, s.commitment);
          if (!saved) {
            rep.errors.push(`duel ${d.id}: no saved move for my commitment ${s.commitment}`);
            continue;
          }
          await send(c, { address: c.net.crows, abi: crowsAbi, functionName: "reveal", args: [d.id, me, saved.move, saved.salt] });
          rep.revealed.push(d.id);
        }
      }
      if (!opts.all && me && !involves(d, me)) continue;
      if (d.state === "live" && t > d.settleBy) {
        await send(c, { address: c.net.crows, abi: crowsAbi, functionName: "expire", args: [d.id] });
        rep.expired.push(d.id);
      } else if (d.state === "live") {
        if (await trySettle(c, await getDuel(c, d.id), t)) rep.settled.push(d.id);
      } else if (d.state === "open" && t > d.takeBy) {
        await send(c, { address: c.net.crows, abi: crowsAbi, functionName: "cancel", args: [d.id] });
        rep.cancelled.push(d.id);
      }
    } catch (e) {
      // Keepers race: if someone else settled, cancelled or expired it first (possibly still pending), that's fine.
      if (explain(e).startsWith("WrongState")) continue;
      const after = await getDuel(c, d.id).catch(() => null);
      if (after && after.state !== d.state && (after.state === "settled" || after.state === "cancelled")) continue;
      rep.errors.push(`duel ${d.id}: ${explain(e)}`);
    }
  }
  return rep;
}

/** Find the evidence a duel needs and settle it. Returns false if it can't be settled yet. */
export async function trySettle(c: Clients, d: Duel, t: bigint): Promise<boolean> {
  let evidence: Hex = "0x";
  if (d.game.kind === "up-down") {
    if (t < d.game.end) return false;
    const [r0, r1] = await Promise.all([roundFrom(c, d.game.feed, d.game.start), roundFrom(c, d.game.feed, d.game.end)]);
    if (!r0 || !r1) return false;
    evidence = encodeAbiParameters([{ type: "uint80" }, { type: "uint80" }], [r0.id, r1.id]);
  } else if (d.game.kind === "closer-call" || d.game.kind === "price-line") {
    const needsPrice =
      d.game.kind === "price-line" || (decodeCall(d.a.move) !== null && decodeCall(d.b.move) !== null);
    if (needsPrice) {
      if (t < d.game.at) return false;
      const r = await roundFrom(c, d.game.feed, d.game.at);
      if (!r) return false;
      evidence = encodeAbiParameters([{ type: "uint80" }], [r.id]);
    }
  }
  try {
    await c.pub.simulateContract({
      address: c.net.crows,
      abi: crowsAbi,
      functionName: "settle",
      args: [d.id, evidence],
      account: c.account!,
    });
  } catch (e) {
    if (explain(e) === "NotYet") return false;
    throw e;
  }
  await send(c, { address: c.net.crows, abi: crowsAbi, functionName: "settle", args: [d.id, evidence] });
  return true;
}

export async function settleOne(c: Clients, id: bigint): Promise<boolean> {
  return trySettle(c, await getDuel(c, id), await chainNow(c));
}

export async function cancel(c: Clients, id: bigint) {
  return send(c, { address: c.net.crows, abi: crowsAbi, functionName: "cancel", args: [id] });
}

export async function setName(c: Clients, name: string) {
  return send(c, { address: c.net.crows, abi: crowsAbi, functionName: "setName", args: [name] });
}

/** Record a one-line reason for a duel you're in (once, before it's decided). */
export async function note(c: Clients, id: bigint, text: string) {
  return send(c, { address: c.net.crows, abi: crowsAbi, functionName: "note", args: [id, text.slice(0, 280)] });
}

