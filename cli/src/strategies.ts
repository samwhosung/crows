import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** What a strategy sees before each slot. Prices are dollars. */
export type View = {
  asset: string;
  now: number; // unix seconds
  price: number; // latest feed price
  windowStart: number; // the duel window [start, end]
  windowEnd: number;
  history: { time: number; price: number }[]; // feed rounds, oldest first (last ~24h)
};

/** A strategy's answer: a direction for up-down, and a call of the price at windowEnd for closer-call. */
export type Pick = { direction: "up" | "down" | "skip"; call: number | null; reason?: string };

export type Strategy = { name: string; decide(v: View): Promise<Pick> };

/** Calls the current price and takes no side: the random-walk answer. */
export const flat: Strategy = {
  name: "flat",
  async decide(v) {
    return { direction: "skip", call: v.price, reason: "The price won't move." };
  },
};

/** Extrapolates the last window's move. */
export const trend: Strategy = {
  name: "trend",
  async decide(v) {
    const span = v.windowEnd - v.windowStart;
    const past = [...v.history].reverse().find((h) => h.time <= v.now - span);
    if (!past) return { direction: "skip", call: v.price };
    const move = v.price - past.price;
    return {
      direction: move > 0 ? "up" : move < 0 ? "down" : "skip",
      call: Math.max(1, v.price + move),
      reason: `Last ${Math.round(span / 60)} min moved ${move >= 0 ? "+" : ""}${move.toFixed(2)}; assume it continues.`,
    };
  },
};

function hhmm(t: number) {
  return new Date(t * 1000).toISOString().slice(11, 16);
}

/** Summarise history as one line per ~10 minutes so the prompt stays small. */
function compact(history: View["history"]): string {
  const out: string[] = [];
  let lastT = 0;
  for (const h of history) {
    if (h.time - lastT < 600 && h !== history[history.length - 1]) continue;
    out.push(`${new Date(h.time * 1000).toISOString().slice(5, 16).replace("T", " ")} ${h.price.toFixed(2)}`);
    lastT = h.time;
  }
  return out.join("\n");
}

function parsePick(text: string): Pick {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`no JSON in model output: ${text.slice(0, 200)}`);
  const j = JSON.parse(m[0]);
  const direction = ["up", "down", "skip"].includes(j.direction) ? j.direction : "skip";
  const call = typeof j.call === "number" && Number.isFinite(j.call) && j.call > 0 ? j.call : null;
  return { direction, call, reason: typeof j.reason === "string" ? j.reason.slice(0, 280) : undefined };
}

function run(cmd: string, args: string[], input: string, timeoutMs: number, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err.slice(0, 300)}`));
    });
    p.stdin.end(input);
  });
}

/** Asks a Claude model through the Claude Code CLI (headless, no tools). */
export function claude(model: string): Strategy {
  const cwd = mkdtempSync(join(tmpdir(), "crows-claude-"));
  return {
    name: `claude:${model}`,
    async decide(v) {
      const prompt = [
        `You are a trading bot in a real-money duel against another bot. Stakes are small but real.`,
        `Asset: ${v.asset}/USD, from the Chainlink feed on Base (it posts a new round on a 0.15% move or every ~20 minutes).`,
        `Now: ${hhmm(v.now)} UTC. Latest price: ${v.price.toFixed(2)}.`,
        `The duel window runs from ${hhmm(v.windowStart)} to ${hhmm(v.windowEnd)} UTC.`,
        ``,
        `Two bets, decided by the feed:`,
        `1. direction: will the price at ${hhmm(v.windowEnd)} be higher ("up") or lower ("down") than at ${hhmm(v.windowStart)}? Even odds. You must pick one; put your honest confidence in the reason.`,
        `2. call: your best estimate of the exact price at ${hhmm(v.windowEnd)}. The closer of two calls wins.`,
        ``,
        `Price history (UTC, roughly every 10 minutes, oldest first):`,
        compact(v.history),
        ``,
        `Reply with only a JSON object: {"direction":"up"|"down","call":<number>,"reason":"<one short sentence, with your confidence>"}`,
      ].join("\n");
      const raw = await run(
        "claude",
        ["-p", "--model", model, "--tools", "", "--no-session-persistence", "--output-format", "json"],
        prompt,
        180_000,
        cwd,
      );
      const res = JSON.parse(raw);
      if (res.is_error) throw new Error(`claude: ${res.result ?? "error"}`);
      return parsePick(String(res.result));
    },
  };
}

/** Any program: gets the View as JSON on stdin, prints a Pick as JSON on stdout. */
export function command(cmd: string): Strategy {
  return {
    name: `cmd:${cmd}`,
    async decide(v) {
      return parsePick(await run("sh", ["-c", cmd], JSON.stringify(v), 120_000));
    },
  };
}

export function strategyFrom(spec: string): Strategy {
  if (spec === "flat") return flat;
  if (spec === "trend") return trend;
  if (spec.startsWith("claude:")) return claude(spec.slice(7));
  if (spec.startsWith("cmd:")) return command(spec.slice(4));
  throw new Error(`unknown strategy "${spec}" (flat | trend | claude:<model> | cmd:<shell command>)`);
}
