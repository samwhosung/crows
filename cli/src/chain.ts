import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  erc20Abi,
  type Account,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  BaseError,
  ContractFunctionRevertedError,
  HttpRequestError,
  maxUint256,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Network } from "./config.ts";

export type Clients = {
  net: Network;
  pub: PublicClient<Transport, Chain>;
  wallet?: WalletClient<Transport, Chain, Account>;
  account?: Account;
  /** When this process last saw one of its own transactions confirmed (ms). */
  lastWrite?: number;
};

// Public RPCs such as mainnet.base.org spread requests over several nodes, and some lag a block or two behind the
// node that just confirmed our transaction. A call that reverts right after our own write may only be seeing that
// lag (no allowance yet, duel not created yet), so it is checked again for a short while before it counts.
const LAG_WINDOW_MS = 20_000;
const LAG_RETRY_MS = 2_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function chainOf(net: Network): Chain {
  const rpc = { default: { http: [net.rpcUrl] } };
  if (net.name === "base") return { ...base, rpcUrls: rpc };
  if (net.name === "base-sepolia") return { ...baseSepolia, rpcUrls: rpc };
  return defineChain({ ...base, id: net.chainId, name: `local (${net.chainId})`, rpcUrls: rpc });
}

export function clients(net: Network, account?: Account): Clients {
  const chain = chainOf(net);
  const transport = http(net.rpcUrl, { retryCount: 4, retryDelay: 400, batch: { batchSize: 50, wait: 10 } });
  const pub = createPublicClient({ chain, transport, pollingInterval: net.dev ? 500 : 2000 }) as PublicClient<
    Transport,
    Chain
  >;
  const wallet = account ? createWalletClient({ chain, transport, account }) : undefined;
  return { net, pub, wallet, account };
}

/** Send a contract write, wait for it, and throw a readable error if it reverts. */
export async function send(
  c: Clients,
  req: { address: Address; abi: readonly unknown[]; functionName: string; args?: readonly unknown[] },
): Promise<Hash> {
  if (!c.wallet || !c.account) throw new Error("no wallet: pass --as <name> or set CROWS_KEY");
  const call = { ...(req as any), account: c.account };
  let request: any;
  let gas: bigint;
  for (;;) {
    try {
      ({ request } = await c.pub.simulateContract(call));
      // Estimate here too, so writeContract doesn't estimate again on a node that may be behind.
      gas = await c.pub.estimateContractGas(call);
      break;
    } catch (e) {
      const sinceWrite = c.lastWrite === undefined ? Infinity : Date.now() - c.lastWrite;
      if (sinceWrite > LAG_WINDOW_MS) throw new Error(explain(e));
      await sleep(LAG_RETRY_MS);
    }
  }
  try {
    // simulateContract trims the ABI to one function; keep the full one so revert reasons decode.
    const hash = await c.wallet.writeContract({ ...request, abi: req.abi, gas: (gas * 12n) / 10n });
    const receipt = await c.pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
    c.lastWrite = Date.now();
    if (receipt.status !== "success") throw new Error(`transaction ${hash} reverted`);
    return hash;
  } catch (e) {
    throw new Error(explain(e));
  }
}

/** Deploy contract bytecode (no constructor arguments) and return its address. */
export async function deployBytecode(c: Clients, bytecode: Hex): Promise<{ address: Address; tx: Hash }> {
  if (!c.wallet || !c.account) throw new Error("no wallet: pass --as <name> or set CROWS_KEY");
  const gas = await c.pub.estimateGas({ account: c.account, data: bytecode });
  try {
    const hash = await c.wallet.sendTransaction({ data: bytecode, gas: (gas * 12n) / 10n } as any);
    const receipt = await c.pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
    c.lastWrite = Date.now();
    if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`deploy ${hash} failed`);
    // Wait until the node we read from has the code too (public RPCs lag behind each other).
    for (let i = 0; i < 15 && !(await c.pub.getCode({ address: receipt.contractAddress })); i++) await sleep(LAG_RETRY_MS);
    return { address: receipt.contractAddress, tx: hash };
  } catch (e) {
    throw new Error(explain(e));
  }
}

/** Turn a viem error into one line: the contract's custom error name and args if there is one. */
export function explain(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
    if (revert?.data?.errorName) {
      const args = revert.data.args?.length ? `(${revert.data.args.map(String).join(", ")})` : "";
      return `${revert.data.errorName}${args}`;
    }
    if (revert?.reason) return revert.reason;
    const http = e.walk((x) => x instanceof HttpRequestError) as HttpRequestError | null;
    if (http) return `${e.shortMessage} (${http.status ?? "no response"}: ${(http.details ?? "").slice(0, 120)})`;
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

export async function ensureAllowance(c: Clients, token: Address, spender: Address, amount: bigint) {
  const owner = c.account!.address;
  const allowance = await c.pub.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
  if (allowance >= amount) return;
  // One standing approval instead of one per duel. Safe here because crows only ever pulls a stake from the
  // wallet that calls challenge or accept, at the moment it calls.
  await send(c, { address: token, abi: erc20Abi, functionName: "approve", args: [spender, maxUint256] });
}
