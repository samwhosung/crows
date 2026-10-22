import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crowsHome } from "./config.ts";

/**
 * How an agent finds out what changed without anyone telling it: CHANGES.md in the repo, read by `crows news`,
 * and a one-line hint from any command when the clone is behind its origin. The check runs in the background,
 * at most once an hour, and never slows a command down or makes it fail.
 */

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, "..", "..");

function seenPath() {
  mkdirSync(crowsHome(), { recursive: true });
  return join(crowsHome(), "news-seen");
}

/** The CHANGES.md entries dated after `since` (a YYYY-MM-DD date), oldest first; all of them if `since` is "". */
export function newsSince(since: string): { date: string; text: string }[] {
  const p = join(repoRoot, "CHANGES.md");
  if (!existsSync(p)) return [];
  const out: { date: string; text: string }[] = [];
  let date = "";
  let lines: string[] = [];
  const flush = () => {
    if (date && date > since && lines.join("").trim()) out.push({ date, text: lines.join("\n").trim() });
    lines = [];
  };
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^## (\d{4}-\d{2}-\d{2})/.exec(line);
    if (m) {
      flush();
      date = m[1];
    } else if (date) lines.push(line);
  }
  flush();
  return out.reverse();
}

export function lastSeen(): string {
  const p = seenPath();
  return existsSync(p) ? readFileSync(p, "utf8").trim() : "";
}

export function markSeen(date: string) {
  writeFileSync(seenPath(), date + "\n");
}

/** A hint when the clone is behind its origin, from the last background check; and start the next check. */
export function updateHint(): string | null {
  const cache = join(crowsHome(), "behind");
  let hint: string | null = null;
  try {
    if (existsSync(cache)) {
      const n = Number(readFileSync(cache, "utf8").trim());
      if (n > 0) hint = `crows: your clone is ${n} commit${n === 1 ? "" : "s"} behind. Update with: git -C ${repoRoot} pull && npm i --prefix ${join(repoRoot, "cli")}; then run \`crows news\`.`;
    }
    const fresh = existsSync(cache) && Date.now() - statSync(cache).mtimeMs < 60 * 60_000;
    if (!fresh && existsSync(join(repoRoot, ".git"))) {
      mkdirSync(crowsHome(), { recursive: true });
      const script = `cd "${repoRoot}" && { command -v timeout >/dev/null && T="timeout 20" || T=""; $T git fetch -q origin 2>/dev/null; git rev-list --count HEAD..origin/main 2>/dev/null > "${cache}.tmp" && mv "${cache}.tmp" "${cache}"; }`;
      spawn("sh", ["-c", script], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // Never let the hint get in the way of the command.
  }
  return hint;
}
