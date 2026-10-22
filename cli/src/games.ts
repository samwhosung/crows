import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  getAddress,
  isAddress,
  keccak256,
  parseAbiParameters,
  type AbiParameter,
  type Address,
  type Hex,
} from "viem";
import { resolverAbi } from "./abi.generated.ts";
import type { Clients } from "./chain.ts";
import { deployBytecode } from "./chain.ts";
import { crowsHome } from "./config.ts";
import { parseTime } from "./actions.ts";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = join(here, "../..");

/** What a game says about itself, plus what the chain says about it. */
export type GameInfo = {
  address: Address;
  name: string;
  paramsAbi: string;
  moveAbi: string;
  evidenceAbi: string;
  rules: string;
  codehash: Hex;
};

const infoCache = new Map<string, GameInfo>();

export async function describeGame(c: Clients, address: Address): Promise<GameInfo> {
  const key = `${c.net.chainId}:${address.toLowerCase()}`;
  const hit = infoCache.get(key);
  if (hit) return hit;
  const [desc, code] = await Promise.all([
    c.pub.readContract({ address, abi: resolverAbi, functionName: "describe" }),
    c.pub.getCode({ address }),
  ]);
  const [name, paramsAbi, moveAbi, evidenceAbi, rules] = desc;
  const info = { address: getAddress(address), name, paramsAbi, moveAbi, evidenceAbi, rules, codehash: keccak256(code ?? "0x") };
  infoCache.set(key, info);
  return info;
}

// ------------------------------------------------------------------ JSON <-> ABI

/** "(address feed,uint64 at)" -> ABI parameters. "" or "()" -> none. */
export function abiParams(tuple: string): readonly AbiParameter[] {
  const inner = tuple.trim().replace(/^\(/, "").replace(/\)$/, "").trim();
  return inner ? parseAbiParameters(inner) : [];
}

/**
 * Turn plain JSON into ABI values. Integers may be numbers or strings; a uint field may also be a time ("+2h",
 * "next-hour", ISO 8601); an address may be a feed symbol such as "ETH".
 */
function coerce(p: AbiParameter, v: unknown, ctx: { now: bigint; feeds: Record<string, Address> }): unknown {
  const type = p.type;
  const arr = /^(.*)\[(\d*)\]$/.exec(type);
  if (arr) {
    if (!Array.isArray(v)) throw new Error(`${p.name ?? type}: expected an array`);
    const el = { ...p, type: arr[1] } as AbiParameter;
    return v.map((x) => coerce(el, x, ctx));
  }
  if (type === "tuple") {
    const comps = (p as any).components as AbiParameter[];
    const vals = Array.isArray(v) ? v : comps.map((cp) => (v as any)?.[cp.name ?? ""]);
    return comps.map((cp, i) => coerce(cp, vals[i], ctx));
  }
  if (/^u?int\d*$/.test(type)) {
    if (typeof v === "number") return BigInt(Math.trunc(v));
    if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return BigInt(v.trim());
    if (typeof v === "string" && type.startsWith("uint")) return parseTime(v.trim(), ctx.now);
    throw new Error(`${p.name ?? type}: expected an integer, got ${JSON.stringify(v)}`);
  }
  if (type === "bool") return v === true || v === "true";
  if (type === "address") {
    if (typeof v === "string" && isAddress(v)) return getAddress(v);
    const feed = typeof v === "string" ? ctx.feeds[v.toUpperCase()] : undefined;
    if (feed) return feed;
    throw new Error(`${p.name ?? type}: expected an address or a feed symbol, got ${JSON.stringify(v)}`);
  }
  return v; // string, bytes, bytesN
}

export function encodeJson(c: Clients, tuple: string, values: unknown, now: bigint): Hex {
  const ps = abiParams(tuple);
  if (!ps.length) return "0x";
  // A single array parameter, e.g. "(uint8[] chips)", is naturally written as the array itself: [10, 20, ...].
  // Accept that as well as the strict form [[10, 20, ...]].
  if (ps.length === 1 && /\[\d*\]$/.test(ps[0].type) && Array.isArray(values) && !(values.length === 1 && Array.isArray(values[0]))) {
    values = [values];
  }
  const vals = Array.isArray(values) ? values : ps.map((p) => (values as any)?.[p.name ?? ""]);
  if (vals.length !== ps.length) throw new Error(`expected ${ps.length} values for ${tuple}, got ${vals.length}`);
  const ctx = { now, feeds: c.net.feeds };
  return encodeAbiParameters(ps, ps.map((p, i) => coerce(p, vals[i], ctx)) as any);
}

/** Decode to a JSON-friendly object keyed by parameter name (or index). Returns null if it doesn't decode. */
export function decodeJson(tuple: string, data: Hex): Record<string, unknown> | null {
  const ps = abiParams(tuple);
  if (!ps.length || !data || data === "0x") return null;
  try {
    const vals = decodeAbiParameters(ps, data);
    const plain = (x: unknown): unknown =>
      typeof x === "bigint" ? x.toString() : Array.isArray(x) ? x.map(plain) : x;
    return Object.fromEntries(ps.map((p, i) => [p.name || String(i), plain(vals[i])]));
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ the workspace where games are written

export function gamesDir(): string {
  return process.env.CROWS_GAMES ?? join(crowsHome(), "games");
}

/**
 * Make (or refresh) a private Foundry workspace for writing games, from the kit in the repo's games/ folder.
 * The crows sources are copied into deps/crows/ so a game's whole import graph lives under the workspace root:
 * Sourcify verification only sends files under the project, so imports through absolute paths can't be verified.
 */
export function initWorkspace(dir = gamesDir()): string {
  const kit = join(REPO, "games");
  const contracts = join(REPO, "contracts");
  if (!existsSync(join(kit, "README.md"))) throw new Error(`the game kit isn't here (${kit}): use a clone of the crows repo`);
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, "test"), { recursive: true });
  cpSync(join(kit, "README.md"), join(dir, "README.md"));
  if (!existsSync(join(dir, "src/examples"))) cpSync(join(kit, "src/examples"), join(dir, "src/examples"), { recursive: true });
  if (!existsSync(join(dir, "test/GameTest.sol"))) cpSync(join(kit, "test"), join(dir, "test"), { recursive: true });
  // Not under lib/: Foundry invents remappings for anything in lib/, and they clash with these.
  // The copy keeps the repo's layout (src/, test/mocks/), because the mocks import crows by relative path.
  rmSync(join(dir, "deps"), { recursive: true, force: true });
  cpSync(join(contracts, "src"), join(dir, "deps/crows/src"), { recursive: true });
  cpSync(join(contracts, "test/mocks"), join(dir, "deps/crows/test/mocks"), { recursive: true });
  writeFileSync(
    join(dir, "foundry.toml"),
    [
      `# A crows game workspace. Made by \`crows game init\` (which also refreshes deps/); the kit lives in ${kit}.`,
      `[profile.default]`,
      `src = "src"`,
      `test = "test"`,
      `out = "out"`,
      `libs = ["${join(contracts, "lib")}"]`,
      `auto_detect_remappings = false`,
      `solc = "0.8.30"`,
      `evm_version = "cancun"`,
      `optimizer = true`,
      `optimizer_runs = 200`,
      `bytecode_hash = "none"`,
      `remappings = ["crows/=deps/crows/src/", "crows-test/=deps/crows/test/", "forge-std/=${join(contracts, "lib/forge-std/src")}/"]`,
      ``,
    ].join("\n"),
  );
  return dir;
}

function forge(args: string[], cwd: string, timeoutMs = 300_000) {
  const r = spawnSync("forge", args, { cwd, encoding: "utf8", timeout: timeoutMs });
  if (r.error) throw new Error(`forge: ${r.error.message} (is Foundry installed and on PATH?)`);
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/** Find a contract's build artifact: out/<File>.sol/<Name>.json with deployable bytecode. */
function artifactOf(dir: string, name: string): { file: string; abi: unknown[]; bytecode: Hex; source: string } {
  const out = join(dir, "out");
  for (const sub of readdirSync(out)) {
    const p = join(out, sub, `${name}.json`);
    if (!existsSync(p)) continue;
    const a = JSON.parse(readFileSync(p, "utf8"));
    const bytecode = a.bytecode?.object as Hex;
    if (!bytecode || bytecode === "0x") continue;
    const source = Object.keys(a.metadata?.settings?.compilationTarget ?? {})[0] ?? `src/${sub}`;
    return { file: p, abi: a.abi, bytecode, source };
  }
  throw new Error(`no deployable contract named ${name} in ${out} (did it compile?)`);
}

export type Deployed = { address: Address; tx: Hex; source: string; verified: boolean; verifyLog?: string; info: GameInfo };

/**
 * Build, deploy and publish a game. The source is verified on Sourcify, so anyone (and any agent) can read the
 * exact code before taking a duel on it. Games take no constructor arguments.
 */
export async function deployGame(c: Clients, name: string, dir = gamesDir()): Promise<Deployed> {
  if (!existsSync(join(dir, "foundry.toml"))) throw new Error(`no game workspace at ${dir}: run \`crows game init\``);
  initWorkspace(dir); // refresh lib/crows and the config, so the published sources match this repo's
  const b = forge(["build"], dir);
  if (!b.ok) throw new Error(`forge build failed:\n${b.out.slice(-1500)}`);
  const art = artifactOf(dir, name);
  const { address, tx } = await deployBytecode(c, art.bytecode);
  let verified = false;
  let verifyLog: string | undefined;
  if (!c.net.dev) {
    const v = forge(
      ["verify-contract", address, `${art.source}:${name}`, "--chain-id", String(c.net.chainId), "--verifier", "sourcify", "--watch"],
      dir,
      180_000,
    );
    verified = v.ok && !/fail|error/i.test(v.out.split("\n").slice(-5).join(" "));
    verifyLog = v.out.slice(-400);
  }
  registerLocal(c, address, join(dir, art.source));
  const info = await describeGame(c, address);
  return { address, tx, source: art.source, verified, verifyLog, info };
}

// Games this machine deployed, with their source path. Used to show source on local forks, where Sourcify can't.
function localRegistry(c: Clients) {
  const dir = join(crowsHome(), c.net.name);
  mkdirSync(dir, { recursive: true });
  return join(dir, "games.json");
}

function registerLocal(c: Clients, address: Address, sourcePath: string) {
  const p = localRegistry(c);
  const reg = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  reg[address.toLowerCase()] = { source: sourcePath, at: Date.now() };
  writeFileSync(p, JSON.stringify(reg, null, 2));
}

/** The game's published source files: from Sourcify on real networks, from this machine's registry on a fork. */
export async function sourceOf(c: Clients, address: Address): Promise<{ verified: boolean; files: Record<string, string> }> {
  if (c.net.dev) {
    const p = localRegistry(c);
    const reg = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
    const e = reg[address.toLowerCase()];
    if (e && existsSync(e.source)) return { verified: true, files: { [relative(gamesDir(), e.source)]: readFileSync(e.source, "utf8") } };
    return { verified: false, files: {} };
  }
  try {
    const url = `https://sourcify.dev/server/v2/contract/${c.net.chainId}/${address}?fields=sources`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { verified: false, files: {} };
    const j = (await res.json()) as any;
    const files: Record<string, string> = {};
    for (const [path, f] of Object.entries<any>(j.sources ?? {})) {
      // The interface and libraries are the same for every game; keep the game's own file(s) up front.
      files[path] = f.content;
    }
    return { verified: Object.keys(files).length > 0, files };
  } catch {
    return { verified: false, files: {} };
  }
}

/** The game's own source, without the shared crows interface and libraries (those are the same for all games). */
export function ownFiles(files: Record<string, string>): Record<string, string> {
  const shared = /(interfaces\/IDuelResolver|lib\/PriceAt|forge-std|Crows\.sol$|interfaces\/ICompact)/;
  const own = Object.fromEntries(Object.entries(files).filter(([p]) => !shared.test(p)));
  return Object.keys(own).length ? own : files;
}

export function sourcifyUrl(chainId: number, address: Address) {
  return `https://repo.sourcify.dev/${chainId}/${address}`;
}
