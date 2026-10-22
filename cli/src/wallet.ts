import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { nonceManager, type Hex } from "viem";
import { crowsHome } from "./config.ts";

/**
 * Wallets are plain private keys in ~/.crows/keys/<name>.key (mode 600). Fine for small bot budgets; anything
 * larger belongs in a real wallet. CROWS_KEY (a 0x private key) overrides the file lookup.
 */
function keysDir() {
  const d = join(crowsHome(), "keys");
  mkdirSync(d, { recursive: true, mode: 0o700 });
  return d;
}

// Public RPCs answer from several nodes, and one can report an old nonce right after we send. Counting nonces
// locally keeps back-to-back transactions (approve, then stake) from colliding.
const account = (key: Hex) => privateKeyToAccount(key, { nonceManager });

const NAME = /^[a-z0-9][a-z0-9._-]{0,31}$/;

export function newWallet(name: string): PrivateKeyAccount {
  if (!NAME.test(name)) throw new Error("wallet name: lowercase letters, digits, . _ - (max 32)");
  const file = join(keysDir(), `${name}.key`);
  if (existsSync(file)) throw new Error(`wallet "${name}" already exists (${file})`);
  const key = generatePrivateKey();
  writeFileSync(file, key + "\n", { mode: 0o600 });
  chmodSync(file, 0o600);
  return account(key);
}

export function loadWallet(name?: string): PrivateKeyAccount | undefined {
  if (process.env.CROWS_KEY) return account(process.env.CROWS_KEY.trim() as Hex);
  const n = name ?? process.env.CROWS_WALLET;
  if (!n) {
    const all = listWallets();
    if (all.length === 1) return loadWallet(all[0]);
    return undefined;
  }
  const file = join(keysDir(), `${n}.key`);
  if (!existsSync(file)) throw new Error(`no wallet "${n}" (run: crows wallet new ${n})`);
  return account(readFileSync(file, "utf8").trim() as Hex);
}

export function listWallets(): string[] {
  return readdirSync(keysDir())
    .filter((f) => f.endsWith(".key"))
    .map((f) => f.slice(0, -4))
    .sort();
}
