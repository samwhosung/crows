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
  /** More endpoints to fall back to when `rpcUrl` errors or rate-limits (public RPCs do, with several bots). */
  fallbackRpcUrls: string[];
  explorer?: string;
  crows: Address;
  closerCall: Address;
  priceLine: Address;
  upDown: Address;
  /** Bets on another duel's outcome; absent on networks deployed before it existed. */
  duelBet?: Address;
  /** Earlier deployments of the built-in games. Any contract can be a game, so duels on them stay valid. */
  legacy: { closerCall: Address[]; upDown: Address[]; priceLine: Address[] };
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

/** Chainlink feeds on Base that games can read, checked live on 2026-10-22. A feed posts a new round when the price
 * moves by `deviation` percent, and at least every `heartbeat` seconds. Stock feeds move only in market hours. */
export type FeedInfo = { symbol: string; address: Address; name: string; heartbeat: number; deviation: number };
export const BASE_FEED_INFO: FeedInfo[] = (
  [
    ["ETH", "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", "ETH / USD", 1200, 0.15],
    ["BTC", "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", "BTC / USD", 1200, 0.1],
    ["CBETH", "0xd7818272B9e248357d13057AAb0B417aF31E817d", "cbETH / USD", 1200, 0.15],
    ["CBBTC", "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D", "cbBTC / USD", 1200, 0.3],
    ["SOL", "0x5D424D5a664a9f3c820F422297077d49877F9C93", "SOL / USD", 86400, 0.5],
    ["DOGE", "0x304adeae3041d6D0745249FD4583e8C542De67d6", "DOGE / USD", 86400, 0.5],
    ["XRP", "0xF35059FB4471333F81E4F39fA40260FF53Dc340b", "XRP / USD", 86400, 0.5],
    ["LINK", "0x17CAb8FE31E32f08326e5E27412894e49B0f9D65", "LINK / USD", 86400, 0.5],
    ["OP", "0x3E3A6bD129A63564FE7abde85FA67c3950569060", "OP / USD", 86400, 0.5],
    ["AERO", "0x4EC5970fC728C5f65ba413992CD5fF6FD70fcfF0", "AERO / USD", 86400, 0.5],
    ["DEGEN", "0xE62BcE5D7CB9d16AB8b4D622538bc0A50A5799c2", "DEGEN / USD", 86400, 0.5],
    ["PEPE", "0xB48ac6409C0c3718b956089b0fFE295A10ACDdad", "PEPE / USD", 86400, 0.5],
    ["TRUMP", "0x7bAfa1Af54f17cC0775a1Cf813B9fF5dED2C51E5", "TRUMP / USD", 86400, 0.5],
    ["VIRTUAL", "0xEaf310161c9eF7c813A14f8FEF6Fb271434019F7", "VIRTUAL / USD", 86400, 0.5],
    ["HYPE", "0xEdB56c5DE751eD3182DDa337f7d9ab33cf091DcA", "HYPE / USD", 86400, 0.5],
    ["XAU", "0x5213eBB69743b85644dbB6E25cdF994aFBb8cF31", "Gold (XAU / USD)", 86400, 0.5],
    ["XAG", "0x7dBC779B2A6F9B9AaB83a2dED78A2F7E9e203f0c", "Silver (XAG / USD)", 86400, 0.5],
    ["EUR", "0xc91D87E81faB8f93699ECf7Ee9B44D11e1D53F0F", "EUR / USD", 3600, 0.1],
    ["GBP", "0xCceA6576904C118037695eB71195a5425E69Fa15", "GBP / USD", 86400, 0.5],
    ["TSLA", "0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4", "Tesla (tokenized, Coinbase)", 86400, 0.5],
    ["NVDA", "0x04689a41629776563E6822F76f2e57D148d28513", "Nvidia (tokenized, Coinbase)", 86400, 0.5],
    ["AAPL", "0x787f13dEa48Db0897CbCDD985de77809D837F988", "Apple (tokenized, Coinbase)", 86400, 0.5],
    ["COIN", "0x408e44f504A7371a345F03a73dDC96A4b48e8aa7", "Coinbase (tokenized, Coinbase)", 86400, 0.5],
    ["MSTR", "0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a", "Strategy (tokenized, Coinbase)", 86400, 0.5],
  ] as const
).map(([symbol, address, name, heartbeat, deviation]) => ({ symbol, address, name, heartbeat, deviation }));

const BASE_FEEDS: Record<string, Address> = Object.fromEntries(BASE_FEED_INFO.map((f) => [f.symbol, f.address]));

/** The built-in games as first deployed on 2026-10-22, before the price library changed (new addresses since). */
const BASE_LEGACY = {
  closerCall: ["0xdC10f40032a33aEF573456eab56EA9bbde4417AF"] as Address[],
  upDown: ["0x87c8B7DCaA8CEdDf9bF1740df5D58f551425D24a"] as Address[],
  priceLine: ["0x46cd02a4f5aCCB57E26793D4ee19c271Da72808F"] as Address[],
};
const NO_LEGACY = { closerCall: [], upDown: [], priceLine: [] };

type Deployment = {
  chainId: number;
  crows: Address;
  closerCall: Address;
  priceLine: Address;
  upDown: Address;
  duelBet?: Address;
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
    duelBet: d.duelBet,
    compact: d.compact,
    startBlock: BigInt(d.startBlock),
  };
  switch (name) {
    case "base":
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "https://mainnet.base.org",
        fallbackRpcUrls: process.env.CROWS_RPC_URL ? [] : ["https://base.drpc.org", "https://base-rpc.publicnode.com"],
        explorer: "https://basescan.org",
        usdc: USDC_BASE,
        feeds: BASE_FEEDS,
        legacy: BASE_LEGACY,
        dev: false,
      };
    case "base-sepolia":
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "https://sepolia.base.org",
        fallbackRpcUrls: [],
        explorer: "https://sepolia.basescan.org",
        usdc: USDC_BASE_SEPOLIA,
        feeds: {},
        legacy: NO_LEGACY,
        dev: false,
      };
    case "local":
      // A local fork of Base mainnet. ETH is a mirror feed we drive by hand, so duels can run on short clocks.
      return {
        ...common,
        rpcUrl: process.env.CROWS_RPC_URL ?? "http://127.0.0.1:8545",
        fallbackRpcUrls: [],
        usdc: USDC_BASE,
        feeds: { ...BASE_FEEDS, ...(d.mockFeed ? { ETH: d.mockFeed } : {}) },
        legacy: BASE_LEGACY,
        dev: true,
      };
    default:
      throw new Error(`unknown network "${name}"`);
  }
}
