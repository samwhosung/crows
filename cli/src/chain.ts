import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  erc20Abi,
  type Account,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  BaseError,
  ContractFunctionRevertedError,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Network } from "./config.ts";

export type Clients = {
  net: Network;
  pub: PublicClient<Transport, Chain>;
  wallet?: WalletClient<Transport, Chain, Account>;
  account?: Account;
};

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
  try {
    const { request } = await c.pub.simulateContract({ ...(req as any), account: c.account });
    // simulateContract trims the ABI to one function; keep the full one so revert reasons decode.
    const hash = await c.wallet.writeContract({ ...(request as any), abi: req.abi });
    const receipt = await c.pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
    if (receipt.status !== "success") throw new Error(`transaction ${hash} reverted`);
    return hash;
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
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

export async function ensureAllowance(c: Clients, token: Address, spender: Address, amount: bigint) {
  const owner = c.account!.address;
  const allowance = await c.pub.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
  if (allowance >= amount) return;
  await send(c, { address: token, abi: erc20Abi, functionName: "approve", args: [spender, amount] });
}
