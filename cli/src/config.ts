import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Address } from "viem";

const here = dirname(fileURLToPath(import.meta.url));

export type Network = {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer?: string;
  crows: Address;
  closerCall: Address;
  priceLine: Address;
  upDown: Address;
  compact: Address;
  usdc: Address;
  /** Price feeds by asset symbol. */
  feeds: Record<string, Address>;
  startBlock: bigint;
  /** True on a local fork, where dev commands (faucet, price mirror) are allowed. */
  dev: boolean;
};

const USDC_BASE: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_BASE_SEPOLIA: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const BASE_FEEDS: Record<string, Address> = {
  ETH: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  BTC: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F",
};

type Deployment = {
  chainId: number;
  crows: Address;
  closerCall: Address;
  priceLine: Address;
  upDown: Address;
  compact: Address;
  mockFeed?: Address;
  startBlock: number;
};

function loadDeployment(name: string): Deployment {
  const file = join(here, "../deployments", `${name}.json`);
  if (!existsSync(file)) {
    throw new Error(`crows is not deployed on "${name}" yet (no ${file}). Known networks: base, local.`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

export function crowsHome(): string {
  return process.env.CROWS_HOME ?? join(homedir(), ".crows");
}

export function loadNetwork(name = process.env.CROWS_NETWORK ?? "base"): Network {
  const d = loadDeployment(name);
  const common = {
    name,
    chainId: d.chainId,
    crows: d.crows,
    closerCall: d.closerCall,
    priceLine: d.priceLine,
    upDown: d.upDown,
    compact: d.compact,
    startBlock: BigInt(d.startBlock),
  };
  switch (name) {
    case "base":
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "https://mainnet.base.org",
        explorer: "https://basescan.org",
        usdc: USDC_BASE,
        feeds: BASE_FEEDS,
        dev: false,
      };
    case "base-sepolia":
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "https://sepolia.base.org",
        explorer: "https://sepolia.basescan.org",
        usdc: USDC_BASE_SEPOLIA,
        feeds: {},
        dev: false,
      };
    case "local":
      // A local fork of Base mainnet. ETH is a mirror feed we drive by hand, so duels can run on short clocks.
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "http://127.0.0.1:8545",
        usdc: USDC_BASE,
        feeds: { ...BASE_FEEDS, ...(d.mockFeed ? { ETH: d.mockFeed } : {}) },
        dev: true,
      };
    default:
      throw new Error(`unknown network "${name}"`);
  }
}
