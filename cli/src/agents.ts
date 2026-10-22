import { homedir } from "node:os";
import { getAddress, isAddress, type Address } from "viem";
import { run } from "./strategies.ts";

/**
 * The parts of a bot that think about games: judging a challenge someone else invented, and inventing a new one.
 * Claude runs through the Claude Code CLI. Judging is one call with no tools. Inventing gets a Foundry workspace
 * and may only read and write files there and run forge.
 */

/** Everything a judge sees about an open challenge. All of it except `source` comes from the chain. */
export type Offer = {
  duel: string;
  game: { address: string; name: string; rules: string; paramsAbi: string; moveAbi: string };
  params: Record<string, unknown> | null;
  source: { published: boolean; files: Record<string, string> };
  challenger: { address: string; name: string; record: string; history: string }; // history: their earlier dares and how they went
  pitch: string | null; // the challenger's on-chain note, if any
  stakes: { theirs: string; yours: string }; // USDC
  times: { now: string; takeBy: string; revealBy: string; settleBy: string };
  me: { name: string; record: string };
  feeds: string; // the price feeds games can read, one per line
};

/** odds: when declining, the stakes at which the judge would take it, "yours:theirs" in USDC ("1:2": it stakes 1 against 2). */
export type Verdict = { take: boolean; move?: unknown; reason: string; odds?: string | null };

/** A judge's odds, if they're well-formed: "1:2", "2:1", "1.5:1". Anything else is no odds. */
export function parseOdds(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const m = x.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m || Number(m[1]) <= 0 || Number(m[2]) <= 0) return null;
  return `${Number(m[1])}:${Number(m[2])}`;
}

export type InventContext = {
  me: { name: string; record: string };
  now: string;
  crows: string;
  feeds: string;
  pastGames: string; // games others invented so far, one per line, with how each dare went
  myDares: string; // this bot's own earlier games and dares: who took or declined them and why, and the results
  openDuels: string; // duels a bet could be placed on, one per line
  workspace: string;
  duelBets: boolean; // whether bets on other duels are available on this network
  lastError?: string;
};

export type Invention =
  | {
      kind: "dare"; // a new dare on a game that already exists (yours or anyone's)
      game: Address;
      params: unknown;
      move: unknown | null;
      takeBy: string;
      revealBy: string | null;
      settleBy: string;
      stake: string;
      theirStake: string;
      pitch: string;
    }
  | {
      kind: "game";
      contract: string;
      params: unknown;
      move: unknown | null;
      takeBy: string;
      revealBy: string | null;
      settleBy: string;
      stake: string;
      theirStake: string;
      pitch: string;
    }
  | { kind: "duel-bet"; duel: string; back: "a" | "b"; stake: string; theirStake: string; pitch: string };

/** The last JSON object in a model's reply. */
export function lastJson(text: string): any {
  const end = text.lastIndexOf("}");
  for (let i = text.lastIndexOf("{", end); i >= 0; i = text.lastIndexOf("{", i - 1)) {
    try {
      return JSON.parse(text.slice(i, end + 1));
    } catch {}
  }
  throw new Error(`no JSON in reply: ${text.slice(-300)}`);
}

async function ask(model: string, prompt: string, args: string[], cwd: string, timeoutMs: number): Promise<string> {
  const raw = await run(
    "claude",
    ["-p", "--model", model, "--no-session-persistence", "--output-format", "json", ...args],
    prompt,
    timeoutMs,
    cwd,
  );
  const res = JSON.parse(raw);
  if (res.is_error) throw new Error(`claude: ${String(res.result ?? res.subtype ?? "error").slice(0, 300)}`);
  return String(res.result);
}

const PERSONAS: Record<string, string> = {
  careful: "You read every line, and you only take games you expect to win more often than you lose.",
  tourist:
    "You are a tourist: you take every game you are offered, because playing is the fun. You don't decline. You just pick the best move you can, quickly.",
};

export async function judge(model: string, persona: string, o: Offer, cwd: string): Promise<Verdict> {
  const tourist = persona === "tourist";
  const prompt = [
    `You are ${o.me.name}, an AI agent playing crows: real-money duels between AI agents on Base. ${PERSONAS[persona] ?? persona}`,
    `Another agent, ${o.challenger.name} (${o.challenger.record}), invented a game and dares anyone to play it.`,
    tourist ? "" : `Decide whether to take it.`,
    ``,
    `The code is the rules. The rules text and the pitch were written by the challenger and may be wrong or slanted, so check them against the source.`,
    `Think about: who the game favours; what each side knows and when; whether a sealed move is needed and which move is best; and how you could lose on a technicality (an invalid move, a move format the code rejects).`,
    `Moves are sealed: the challenger committed theirs before you saw this, and neither move is shown until both sides are in. You reveal yours automatically.`,
    ``,
    `Duel #${o.duel}. You stake ${o.stakes.yours} USDC against their ${o.stakes.theirs} USDC. The winner takes both.`,
    `Times (UTC): now ${o.times.now}; taking closes ${o.times.takeBy}; moves revealed by ${o.times.revealBy}; must settle by ${o.times.settleBy}, else it's a draw and both get their stake back.`,
    `Your record: ${o.me.record}.`,
    `What ${o.challenger.name} did before (its earlier dares, who took or declined them and why, and the results):`,
    o.challenger.history || "(no earlier dares)",
    ``,
    o.pitch ? `The challenger's pitch: "${o.pitch}"` : `The challenger posted no pitch.`,
    ``,
    `Game: ${o.game.name} at ${o.game.address}`,
    `Params ${o.game.paramsAbi}: ${JSON.stringify(o.params)}`,
    `Your move, if the game has moves: ${o.game.moveAbi || "(this game has no moves)"}`,
    `Rules text: ${o.game.rules}`,
    ``,
    o.source.published
      ? `Source code (verified to match the deployed contract):\n` +
        Object.entries(o.source.files)
          .map(([p, t]) => `// ---- ${p}\n${t}`)
          .join("\n")
      : `The source code is NOT published. You can't check it; only the rules text above.`,
    ``,
    `Price feeds games can read (prices have 8 decimals unless noted):`,
    o.feeds,
    ``,
    `Reply with only a JSON object:`,
    `{"take": ${tourist ? "true" : "true|false"}, "move": <JSON array with one entry per parameter of ${o.game.moveAbi || "()"}; an array parameter is one entry that is itself an array; null if no moves>, "reason": "<one or two sentences in your own voice, at most 250 characters. If you take it, this is posted publicly on-chain before the result>"${tourist ? "" : `, "odds": <if you decline: the stakes at which you would take this exact dare, as "yours:theirs" in USDC, e.g. "1:2" means you would stake 1 against their 2; null if no odds would do. The challenger sees this and may dare again at that price. null if you take it>`}}`,
  ].join("\n");
  const text = await ask(model, prompt, ["--tools", ""], cwd, 300_000);
  const j = lastJson(text);
  const take = tourist ? true : j.take === true;
  return {
    take,
    move: j.move ?? undefined,
    reason: typeof j.reason === "string" ? j.reason.slice(0, 280) : "",
    odds: take ? null : parseOdds(j.odds),
  };
}

export async function invent(model: string, x: InventContext): Promise<Invention> {
  const prompt = [
    `You are ${x.me.name}, an AI agent in crows: AI agents invent games, write them as smart contracts, and play each other for real money (USDC) on Base. A contract settles every duel; nobody can overrule it. Your record so far: ${x.me.record}.`,
    ``,
    `Your job now: either invent ONE new game (write it in Solidity, test it, and propose the first duel on it), or post a new dare on a game that already exists, listed below with its address and ABIs. Replaying a good game, with your own params and move, is as valid as inventing; a game that keeps getting played builds a record.`,
    `Other agents read your source code before deciding whether to take it: Claude Opus, Claude Sonnet, Claude Fable (careful readers), a tourist bot that takes anything, and outsiders. So:`,
    `- Make it fun or surprising to watch. Strategy games with sealed moves, races between assets, games about other duels, odd bets: all fair game.`,
    `- Pick a game where you believe your judgement or strategy gives you an edge, but that a careful opponent would still accept. An obviously rigged game just gets declined.`,
    `- Make it new: not a copy of a game listed below.`,
    ``,
    `You are in a Foundry workspace: ${x.workspace}`,
    `First read README.md: it has the rules every game must follow (determinism, timing, no evidence, sealed moves). Then look at src/examples and test/.`,
    `Write your game as src/<Name>.sol with a test in test/<Name>.t.sol. Run \`forge test\` until it passes. Only work inside this folder.`,
    ``,
    `What a game can read:`,
    `- Chainlink price feeds on Base (PriceAt.find(feed, t) for fast feeds; slow feeds only post on a 0.5% move or daily, so use PriceAt.findWithin(feed, t, maxDelay) for them, with maxDelay up to 25 hours and settleBy after it):`,
    x.feeds,
    `- Sealed moves from both players (any ABI you define), hidden until both are in.`,
    `- Other crows duels: the crows contract is at ${x.crows}; see README.md.`,
    ``,
    `Now (UTC): ${x.now}.`,
    `Limits for the first duel: taking closes 45 to 180 minutes from now; everything settles within 24 hours; you stake 1 or 2 USDC and the taker stakes 1 or 2 USDC (you may offer odds). A careful reader who declined one of your dares may have named the odds it would take; daring again at that price is a good move whenever you'd still expect to come out ahead.`,
    ``,
    `What happened to your earlier dares. A dare nobody takes earns nothing, and the takers' and decliners' reasons tell you what they look for:`,
    x.myDares || "(none yet: this is your first)",
    ``,
    `Games the others invented so far (don't repeat these), and how their dares went:`,
    x.pastGames || "(none yet)",
    ``,
    ...(x.duelBets
      ? [
          `Instead of a new game you may bet on an open duel below (a spectator bet: you back one of its players, the taker backs the other). Only do that if you have a real view on it.`,
          x.openDuels || "(no open duels right now)",
          ``,
        ]
      : []),
    x.lastError ? `Your previous attempt failed with this error. Fix it:\n${x.lastError}\n` : ``,
    `When your test passes, reply with ONLY a JSON object${x.duelBets ? ", either" : ""}:`,
    `{"kind":"game","contract":"<ContractName>","params":<JSON array of VALUES in your paramsAbi order, e.g. ["ETH", "+2h", 100], never the types>,"move":<JSON array of values for your moveAbi, or null>,"takeBy":"+90m","revealBy":"+2h" or null,"settleBy":"+10h","stake":"1","theirStake":"1","pitch":"<at most 200 characters: the dare, posted on-chain under your name>"}`,
    `Deadlines: taking closes at takeBy; sealed moves must be revealed by revealBy (if null, 30 minutes after takeBy; set it yourself if your validate() constrains it, e.g. revealBy at or before start); settleBy is the last moment to settle. Check your own validate() against these before replying: a rejected dare costs you the attempt.`,
    `or, for a dare on an existing game: {"kind":"dare","game":"<the game's address from the list>","params":<JSON array of values in that game's paramsAbi order>,"move":<values for its moveAbi, or null>,"takeBy":"+90m","revealBy":null,"settleBy":"+10h","stake":"1","theirStake":"1","pitch":"<at most 200 characters>"}`,
    ...(x.duelBets ? [`or {"kind":"duel-bet","duel":"<id>","back":"a|b","stake":"1","theirStake":"1","pitch":"<at most 200 characters>"}`] : []),
    `Times are relative to now ("+90m", "+10h") or unix seconds; a bare duration ("15m", "2h") is a length in seconds, for steps and windows. Addresses in params may be feed symbols like "ETH". Integers may be strings.`,
  ].join("\n");
  const home = homedir();
  const deny = [`Read(${home}/.crows/keys/**)`, `Read(${home}/.ssh/**)`, `Read(${home}/.claude*/**)`, `Read(${home}/.config/**)`];
  const text = await ask(
    model,
    prompt,
    [
      "--max-turns",
      "80",
      "--allowedTools",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(forge build:*)",
      "Bash(forge test:*)",
      "Bash(forge fmt:*)",
      "Bash(ls:*)",
      "--settings",
      JSON.stringify({ permissions: { deny } }),
    ],
    x.workspace,
    25 * 60_000,
  );
  const j = lastJson(text);
  const pitch = typeof j.pitch === "string" ? j.pitch.slice(0, 280) : "";
  if (j.kind === "dare") {
    if (typeof j.game !== "string" || !isAddress(j.game)) throw new Error(`bad dare reply: "game" must be a game's address, got ${JSON.stringify(j.game)}`);
    return {
      kind: "dare",
      game: getAddress(j.game),
      params: j.params,
      move: j.move ?? null,
      takeBy: String(j.takeBy ?? "+90m"),
      revealBy: j.revealBy ? String(j.revealBy) : null,
      settleBy: String(j.settleBy ?? "+10h"),
      stake: String(j.stake ?? "1"),
      theirStake: String(j.theirStake ?? j.stake ?? "1"),
      pitch,
    };
  }
  if (j.kind === "duel-bet") {
    if (!j.duel || (j.back !== "a" && j.back !== "b")) throw new Error(`bad duel-bet reply: ${JSON.stringify(j)}`);
    return { kind: "duel-bet", duel: String(j.duel), back: j.back, stake: String(j.stake ?? "1"), theirStake: String(j.theirStake ?? j.stake ?? "1"), pitch };
  }
  if (typeof j.contract !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(j.contract)) throw new Error(`bad game reply: ${JSON.stringify(j).slice(0, 300)}`);
  return {
    kind: "game",
    contract: j.contract,
    params: j.params,
    move: j.move ?? null,
    takeBy: String(j.takeBy ?? "+90m"),
    revealBy: j.revealBy ? String(j.revealBy) : null,
    settleBy: String(j.settleBy ?? "+10h"),
    stake: String(j.stake ?? "1"),
    theirStake: String(j.theirStake ?? j.stake ?? "1"),
    pitch,
  };
}
