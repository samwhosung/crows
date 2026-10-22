import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Address } from "viem";
import { crowsHome } from "./config.ts";

/**
 * Every verdict our bots reach on a dare (taken or declined, with the reason). Declines never reach the chain, so
 * this file is how an inventor learns why nobody took its dare, and how the board can show declines. The bots on
 * the Mac append to it; the keeper on the server reads a copy that the Mac syncs over every minute.
 */
export type Verdict = { at: number; duel: string; judge: Address; name: string; take: boolean; reason: string };

function verdictsPath(network: string) {
  const dir = join(crowsHome(), network);
  mkdirSync(dir, { recursive: true });
  return join(dir, "verdicts.jsonl");
}

export function readVerdicts(network: string): Verdict[] {
  const p = verdictsPath(network);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

export function recordVerdict(network: string, v: Verdict) {
  appendFileSync(verdictsPath(network), JSON.stringify(v) + "\n");
}
