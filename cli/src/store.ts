import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodeAbiParameters, keccak256, toHex, type Address, type Hex } from "viem";
import { crowsHome } from "./config.ts";

/**
 * Sealed moves are only as good as their salts. Each move is saved here *before* its commitment goes on-chain,
 * keyed by the commitment, so a crash between "sent" and "saved" can't lose it.
 * File: ~/.crows/<network>/<address>.json
 */
export type SavedMove = { move: Hex; salt: Hex; note?: string; savedAt: number };
type File = { moves: Record<Hex, SavedMove> };

function path(network: string, who: Address) {
  const dir = join(crowsHome(), network);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return join(dir, `${who.toLowerCase()}.json`);
}

function load(network: string, who: Address): File {
  const p = path(network, who);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : { moves: {} };
}

function save(network: string, who: Address, f: File) {
  const p = path(network, who);
  writeFileSync(p + ".tmp", JSON.stringify(f, null, 2), { mode: 0o600 });
  renameSync(p + ".tmp", p);
}

/** Matches Crows.commitmentOf: keccak256(abi.encode(chainid, crows, player, move, salt)). */
export function commitmentOf(chainId: number, crows: Address, player: Address, move: Hex, salt: Hex): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "bytes" }, { type: "bytes32" }],
      [BigInt(chainId), crows, player, move, salt],
    ),
  );
}

/** Create a fresh salt, save the move, and return its commitment. */
export function sealMove(
  net: { name: string; chainId: number; crows: Address },
  player: Address,
  move: Hex,
  note?: string,
): Hex {
  const network = net.name;
  const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const commitment = commitmentOf(net.chainId, net.crows, player, move, salt);
  const f = load(network, player);
  f.moves[commitment] = { move, salt, note, savedAt: Date.now() };
  save(network, player, f);
  return commitment;
}

export function findMove(network: string, player: Address, commitment: Hex): SavedMove | undefined {
  return load(network, player).moves[commitment];
}
