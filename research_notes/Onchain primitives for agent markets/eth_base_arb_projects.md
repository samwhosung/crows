# Application-layer projects on Ethereum, Base and Arbitrum (as of Oct 21, 2026): composable building blocks for an agent-native conditional-contract protocol

Research method note: the shared WebSearch budget ran out after the first 8 searches. Everything after that comes from (a) direct fetches of primary sources (official blogs and docs, GitHub READMEs, governance forum posts) and (b) the public DefiLlama API, pulled on 2026-10-21. Unless stated otherwise, "TVL", "30d volume" and "30d fees" are DefiLlama figures as of 2026-10-21. DefiLlama URLs are cited as the human-readable protocol page; the numbers came from `api.llama.fi/protocols`, `api.llama.fi/summary/{fees|dexs}/{slug}` and `api.llama.fi/overview/{dexs|fees|open-interest}/{chain}`. DefiLlama volume figures can include wash or bot volume. Treat them as order-of-magnitude.

Market context: TVLs are well below 2025 peaks (Aave V3 $17.2B, Lido $23.7B). Curve's own recap mentions "a broad market drawdown" in mid-2026 ([Curve News](https://news.curve.finance/)). Several 2025–26 exploits reshaped the landscape (see Q5).

---

## Q1. Established protocols doing genuinely new things (Uniswap, Aave, Morpho, Euler, Balancer, Curve, Pendle, Ethena, Sky/Spark, Lido, Compound, GMX, Synthetix, 1inch, etc.)

### Takeaway
The incumbents with the most new programmable surface are Uniswap, Morpho and 1inch:
- **Uniswap** shipped governance-upgradeable first-party v4 hooks (StablePair, VolatilePair, Permissioned Pools), per-block uniform-price token auctions (CCA) with bid-validation hooks, The Compact resource locks, and the UNI fee switch.
- **Morpho** has permissionless Blue markets, Vaults V2, and Midnight fixed-rate/fixed-term offer-based credit (live July 2026). Total deposits are above $17B.
- **1inch Aqua** is a new shared-liquidity layer where funds stay in LP wallets. It already does about $3.9B per 30 days on Ethereum.

Aave V4 is live (Mar 30, 2026), but spokes are governance-gated, so it is less useful as a permissionless building block. Euler publicly retrenched. Balancer collapsed after its Nov 2025 exploit. Synthetix's mainnet perps have negligible traction.

### Cited Findings

#### Uniswap (v4 hooks, CCA, The Compact, UNIfication, Unichain)
- **v4 scale**
  - TVL $1.50B: Ethereum $806M, BSC $246M, Robinhood Chain $195M, Base $105M, Arbitrum $39M.
  - Volume: $35.1B over 30 days, $480B all-time. Fees: $69.0M over 30 days, $535.6M all-time.
  - Deployed on about 20 chains, including Robinhood Chain, Arc, Tempo and MegaETH.
  - Source: [DefiLlama uniswap-v4](https://defillama.com/protocol/uniswap-v4).
- **v4 is now the top Ethereum DEX by 30d volume.** On Ethereum: Uniswap V4 $13.98B, Uniswap V3 $9.90B, 1inch Aqua $3.88B, Fluid DEX $3.48B, Curve $2.52B, Angstrom $0.56B. [DefiLlama DEX overview, Ethereum](https://api.llama.fi/overview/dexs/Ethereum)
- **StablePair hook (Sep 10, 2026)**
  - Uniswap Labs' first upgradeable dynamic-fee hook. Live on Ethereum mainnet in two pools: USDC/USDG and USDC/USDT.
  - The fee is recomputed on every swap. Inside a band around a reference rate, it holds a fixed bid/ask spread.
  - Swaps that push price further off-peg pay no fee.
  - Swaps that restore the peg from outside the band go through a **Dutch auction**: the fee starts high and drops each block until someone fills, and LPs keep the difference.
  - Pool parameters and fee logic are upgradeable via Uniswap Governance without migrating pools.
  - Context: stable-to-stable swaps on Uniswap did $43.4B in Q2 2026.
  - Source: [Uniswap blog: StablePair](https://blog.uniswap.org/stablepair-hook-a-fee-that-moves-with-the-market).
- **VolatilePair hook (Oct 14, 2026)**
  - Live on Ethereum mainnet, starting with ETH/USDC.
  - Sets separate (asymmetric) buy and sell fees from recent price moves, recalculated every swap. After a large move, trades that push the price back pay a temporary fee.
  - Governance-upgradeable.
  - StablePair did $3.1B volume within four weeks. Volatile pairs did ">$500B on Uniswap this year."
  - The article does not name the oracle or price source.
  - Source: [Uniswap blog: VolatilePair](https://blog.uniswap.org/volatilepair-hook-pricing-both-sides-of-the-trade).
- **Permissioned Pools (Aug 24, 2026; live on Ethereum mainnet and Sepolia)**
  - The restricted token never enters the pool. A Permissions Adapter holds it, and the PoolManager holds a virtual balance.
  - `beforeSwap` and `beforeAddLiquidity` hooks check an issuer-deployed checker contract (Securitize DS Protocol, ERC-3643, or a custom registry).
  - Issuers can `unwindPosition` to force-close LP positions. LP NFTs are non-transferable.
  - Superstate, Securitize and Dowgo are named as building on it.
  - Source: [Uniswap blog: Permissioned Pools](https://blog.uniswap.org/how-permissioned-pools-work-on-uniswap-v4).
- **Spark DualPool hook (announced Jun 25, 2026; "coming soon")**
  - Idle stablecoin inventory sits in Spark-managed ERC-4626 vaults. On each swap the hook pulls only the capital needed, deploys it as concentrated liquidity, executes the swap, then returns the remainder plus fees to the vault in the same block.
  - Spark migrated $150M to v4 ahead of it. Code will be open-sourced after audits.
  - Source: [Uniswap blog: Spark DualPool](https://blog.uniswap.org/spark-moves-150m-of-liquidity-to-v4-with-new-hook-coming-soon).
  - The VolatilePair post also lists a "LitePSM" hook among Uniswap-supported hooks, with no detail found ([Uniswap blog](https://blog.uniswap.org/volatilepair-hook-pricing-both-sides-of-the-trade)).
- **Tokenized securities (Jun 12, 2026)**
  - Tokenized SpaceX, Apple, Tesla, NVIDIA and others are tradable in the Uniswap app and API.
  - Real-world-asset pools: >$9.1B swapped, >2.6M transactions, >140K wallets.
  - Issuer restrictions "may not be technically enforced."
  - Source: [Uniswap blog](https://blog.uniswap.org/tokenized-securities-are-live).
  - BlackRock BUIDL became tradable via UniswapX through Securitize (Feb 11, 2026) ([Uniswap blog index](https://blog.uniswap.org/)).
- **Continuous Clearing Auctions (CCA)**
  - Unveiled Nov 2025 with Aztec, whose token sale was the first CCA ([The Block](https://www.theblock.co/post/378864/uniswap-continuous-clearing-auctions)).
  - Mechanism: bidders set a max price. Each block clears at a single price, with pro-rata fills if oversubscribed. Supply releases gradually, with optional tranches. Proceeds automatically seed a v4 pool at the final clearing price. There is an optional ZK Passport module ([The Block](https://www.theblock.co/post/378864/uniswap-continuous-clearing-auctions)).
  - Rollout: the Auctions tab went live in the web app Feb 2, 2026. Self-serve auction creation from the web app followed Jun 24, 2026, reportedly across Ethereum, Base, Unichain and Arbitrum ([search summary of The Block / Cointelegraph / Uniswap blog](https://blog.uniswap.org/token-auctions-are-coming-to-the-uniswap-web-app); [Crypto Briefing](https://cryptobriefing.com/uniswap-token-auctions-web-app/)).
- **CCA contracts**
  - `ContinuousClearingAuction` plus a factory. Each factory is bound immutably to an `IProtocolFeeController`. `CCALens` provides stateless reads.
  - **Optional validation hook**: `validate()` is called on every bid and reverts to reject. Under CIP-1, hooks implement ERC-165.
  - v2.0.0 was audited by OpenZeppelin and Spearbit (reports dated 06/16/2026). v2.1.0 adds an Arbitrum/Orbit fix and is recommended for production.
  - Designed to pair with the Uniswap "Liquidity Launcher" suite.
  - Source: [GitHub Uniswap/continuous-clearing-auction](https://github.com/Uniswap/continuous-clearing-auction).
- **The Compact v1 (Sep 23, 2025)**
  - Ownerless ERC-6909 contract for reusable resource locks. The sponsor deposits tokens and gets ERC-6909 lock tokens. A 12-byte lock tag encodes allocator, scope and reset period.
  - "Compacts" are signed or registered commitments naming an **arbiter** that verifies conditions and submits claims.
  - **Allocators** prevent double-spend. **Emissaries** are fallback signers (multisig, timelock, P256, WebAuthn).
  - Sponsors can force-withdraw after the reset period if the allocator is unresponsive.
  - Same address on Ethereum, Unichain, Base and Arbitrum. Reviewed by OpenZeppelin and Spearbit/Cantina.
  - Integrations: UniswapX cross-chain will use it. LI.FI, Rhinestone, Hyperlane, Across and OneBalance are named builders.
  - Source: [Uniswap blog: The Compact](https://blog.uniswap.org/the-compact-v1).
- **UNIfication fee switch**
  - Passed Dec 25, 2025 with about 125M UNI for and 742 against.
  - 100M UNI (about $590–596M) burned Dec 28, 2025.
  - Between one-sixth and one-quarter of swap fees go to a "token jar" for buyback-and-burn. Unichain net sequencer fees also feed the burn.
  - Uniswap Foundation teams moved into Labs, and Labs' interface fees were removed.
  - Sources: [The Block](https://www.theblock.co/post/383742/uniswap-passes-unification-proposal); [Cointelegraph](https://cointelegraph.com/news/uniswap-executes-100m-uni-burn-after-fee-switch-approval).
- **Unichain has stalled on usage and is outsourcing operations**
  - TVL about $30M, 30d DEX volume $289M, 30d fees about $0.7M ([DefiLlama chains](https://defillama.com/chains); [DefiLlama DEX Unichain](https://api.llama.fi/overview/dexs/Unichain)).
  - On Oct 9, 2026 Uniswap announced Unichain is moving to "OP Enterprise": Optimism will run the sequencers, RPC and incident response. Testnet migrates Oct 13 and mainnet Oct 29, 2026. It stays a Stage 1 rollup, and native OP-Stack interop is next.
  - Source: [Uniswap blog: Unichain](https://blog.uniswap.org/unichain-is-upgrading-to-op-enterprise).
- **Other Uniswap news**
  - Uniswap went live on Robinhood Chain (v2, v3, v4 and UniswapX; Jul 2, 2026) and on Circle's Arc (Sep 16, 2026).
  - SMBC Nikko and Nethermind are building a Japanese DeFi gateway on v4, targeting 2027 ([Uniswap blog index](https://blog.uniswap.org/)).
- **Third-party hooks with measurable traction**
  - **Fables**: dynamic-fee ve(3,3) DEX on v4 on Robinhood Chain. Fees are "calendar-based for tokenised stocks, volatility-based for crypto." $2.37B 30d volume, $4.9M 30d fees, $29.6M TVL ([DefiLlama fables](https://defillama.com/protocol/fables)).
  - **What The Hook**: a v4 hook that "captures the price gap a swap opens between connected pools and returns the realised arbitrage to the trader and the pool's LPs." Listed Aug 2026, Robinhood Chain, $0.4M TVL ([DefiLlama what-the-hook](https://defillama.com/protocol/what-the-hook)).
  - **Angstrom (Sorella)**: MEV-protecting v4 hook on Ethereum. $0.56B 30d volume, $3.5B all-time, $6.0M TVL ([DefiLlama angstrom](https://defillama.com/protocol/angstrom)).
  - **Bunni v2**: $2.5B all-time volume, but about $0 now and $0.2M TVL, i.e. effectively dormant ([DefiLlama bunni-v2](https://defillama.com/protocol/bunni-v2)).
  - **Flaunch**: v4-based meme launchpad on Base. $1.7M TVL, $0.02M 30d fees, $3.6M all-time ([DefiLlama flaunch](https://defillama.com/protocol/flaunch)).

#### Aave (V4, GHO, Horizon)
- **V4 launch**
  - Live on Ethereum mainnet Mar 30, 2026 as a "controlled launch."
  - Hub-and-spoke design with three hubs: Prime (low risk), Core and Plus.
  - Spokes have their own risk parameters, collateral and liquidation rules, and draw a capped credit line from a hub. **Spokes are DAO-governed; permissionless spoke creation is not available.**
  - Planned spoke operators: Lido, EtherFi, Kelp, Ethena, Lombard.
  - sGHO savings product. A Reinvestment Module sweeps idle liquidity.
  - Sources: [The Block](https://www.theblock.co/post/395617/aave-v4-launches-ethereum-mainnet); [search summary](https://www.theblock.co/post/395617).
- **Scale**
  - V4 TVL $668.5M (Ethereum, Arc, Avalanche), $1.03M 30d fees ([DefiLlama aave-v4](https://defillama.com/protocol/aave-v4)).
  - V3 still dominates: $17.2B TVL, of which Ethereum is $14.3B, Base $558M and Arbitrum $548M ([DefiLlama aave-v3](https://defillama.com/protocol/aave-v3)).
- **Recent Aave blog posts** (undated in the listing): V4 on Avalanche (first multichain V4); "Coinbase Tokenized Stocks on Aave V4," with seven stocks usable as collateral to borrow USDC "on Aave V4 on Base"; an Aave MCP server that "lets AI assistants read live Aave data and build V3 and V4 transactions that the user's own wallet signs"; and an AI-assisted security review that produced 71 findings ([Aave blog](https://aave.com/blog)).
  - Conflict: DefiLlama does not yet list Base among V4 chains.
- **Horizon RWA market**: launched Dec 2025, $253M TVL, $123M borrowed ([DefiLlama aave-horizon-rwa](https://defillama.com/protocol/aave-horizon-rwa)).
- **GHO supply**: $698M, almost all on Ethereum ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins)).

#### Morpho (Blue, Vaults V2, Midnight)
- **Scale**
  - Total deposits passed $15B in mid-Sep 2026 and exceeded $17B at the time of writing. More than $11B sits in curated vaults with 30+ curators ([Morpho Effect Sep 2026](https://morpho.org/blog/the-morpho-effect-september-2026)).
  - DefiLlama Morpho Blue TVL (excluding borrows) is $11.25B: Ethereum $5.10B, Base $4.50B, Robinhood Chain $607M, Arc $303M ([DefiLlama morpho-blue](https://defillama.com/protocol/morpho-blue)).
- **Distribution partners (Sep 2026)**
  - Coinbase Lend >$500M deposits. Robinhood Earn >$500M.
  - Morpho on Robinhood Chain reached $1B deposits in three months.
  - Arc: $220M on day one and >$500M now. Circle Mint "Digital Asset Borrow" reached about $200M borrowed in under two weeks.
  - Steakhouse curates >$2.3B. Sentora went from about $0 to >$1B in 2026.
  - Zama is launching 16 confidential vaults on Morpho.
  - Source: [Morpho Effect Sep 2026](https://morpho.org/blog/the-morpho-effect-september-2026).
- **Midnight: what it is**
  - Fixed-rate, fixed-term, offer-based credit. Each market is isolated with one loan token, one maturity and a fixed set of accepted collateral. Parameters are immutable after creation.
  - Makers publish **signed offers**. Lenders take asks and borrowers take bids. The rate is set by the price of credit units (each a "claim on … exactly one loan token at maturity"), not by an interest-rate model.
  - A Router API (`GET /v0/midnight/takeable-offers`) returns takeable offers.
  - Early exit works by taking resting offers. Partial liquidation is possible pre-maturity; full liquidation after maturity, priced by oracle × LLTV. Bad debt is socialized via a market loss factor.
  - Source: [Morpho docs: Midnight](https://docs.morpho.org/build/midnight/get-started/).
- **Midnight: launch and status**
  - Launched July 2026 on Base with cbBTC/USDC only. Offers can be multi-market and multi-collateral, and capital earns a variable rate until filled. Auto-rolling, **callbacks** and vault allocations are "upcoming" ([Morpho: Now Live Midnight](https://morpho.org/blog/now-live-morpho-midnight); [offer-based markets](https://morpho.org/blog/how-onchain-credit-is-evolving-with-offer-based-markets)).
  - Live on Ethereum by Sep 2026. P2P Orders are on Ethereum, Base, Arc and Robinhood Chain. Coinbase is the first large distributor to offer fixed-rate loans via Midnight ([Morpho Effect Sep 2026](https://morpho.org/blog/the-morpho-effect-september-2026)).
  - Still small on DefiLlama: $14.2M TVL, $0.03M 30d fees ([DefiLlama morpho-midnight](https://defillama.com/protocol/morpho-midnight)).
- **Stock-backed loans**: live on Morpho Blue and Midnight via Coinbase Tokenized Stocks ([Morpho Effect Sep 2026](https://morpho.org/blog/the-morpho-effect-september-2026)).
- **Morpho Agents Beta**
  - A CLI and MCP server (`npx skills add morpho-org/morpho-skills`) that reads vault data, simulates every write, and builds **unsigned** transactions for the user's wallet.
  - A separate "Builder Agent" (AGENTS.md plus skill) helps with integrations.
  - The post cites ">130,000 AI agents registered onchain" since January.
  - Source: [Morpho blog](https://morpho.org/blog/introducing-morpho-agents-beta-interface-built-for-ai-agents).
- **Funding and institutions**: the Morpho Association raised $175M. There are cooperation and integration deals with Apollo, Anchorage, Fireblocks (2,400+ enterprise customers), Taurus and Ledger ([Morpho blog index](https://morpho.org/blog)).

#### Euler v2 (EVK / EVC / EulerSwap): candid retrenchment
- **Building blocks**
  - EVK deploys configurable ERC-4626 lending vaults.
  - EVC lets vaults recognise each other as collateral, delegate scoped permissions to operators, and batch actions.
  - Euler Earn is a curator-managed allocation vault.
  - EulerSwap puts AMM liquidity inside vault positions.
  - Source: [Euler blog index](https://www.euler.finance/blog).
- **Q1 2026 retrospective (Apr 7, 2026)**
  - More than $4B in deposits within a year of the V2 launch.
  - Plasma, Euler's second-largest chain, was effectively "gone" after **Stream Finance defaulted** in late 2025.
  - EulerSwap: "a single operator could push illiquid vaults to full utilization, destabilizing rates."
  - Labs recommends cutting protocol fees to zero, sunsetting DAO-managed markets, and positioning as pure infrastructure (APIs and SDK first). Fixed-rate lending and synthetics are deferred.
  - Co-founders departed in early 2026.
  - Source: [Euler Q1 2026](https://www.euler.finance/blog/euler-q1-2026).
- **Current TVL**: $292M, of which Monad is $209M and Ethereum only $52.5M ([DefiLlama euler-v2](https://defillama.com/protocol/euler-v2)).
- **New 2026 work**: Securitize permissioned-asset lending markets (Jun 1, 2026) and Unlink transaction privacy for institutional lending (Jun 11, 2026) ([Euler blog index](https://www.euler.finance/blog)).

#### Balancer v3 (hooks): effectively collapsed
- The Balancer V2 exploit on Nov 3, 2025 took $128M via a rounding error across Ethereum, Arbitrum, Base, Polygon, Sonic and Optimism ([DefiLlama hacks](https://api.llama.fi/hacks)).
- Current TVL: V2 $18.4M, V3 $19.5M ([DefiLlama balancer-v3](https://defillama.com/protocol/balancer-v3)). The Balancer CoW AMM is about $0.1M ([DefiLlama](https://defillama.com/protocol/balancer-cow-amm)).

#### Curve (crvUSD, LlamaLend V2, YieldBasis)
- **LlamaLend V2**: live on Optimism (May–Jun 2026) and Ethereum (Jul 2026), with "productive collateral" added in Aug 2026. V1 markets are being deprecated. Average crvUSD borrow rates fell nearly two-thirds and borrower-minted crvUSD grew 29% in July ([Curve News](https://news.curve.finance/)). LlamaLend V2 TVL is $42.4M ([DefiLlama curve-llamalend-v2](https://defillama.com/protocol/curve-llamalend-v2)).
- **YieldBasis V3**: launched May–Jun 2026 ([Curve News](https://news.curve.finance/)). Yield Basis TVL is $124.4M on Ethereum ([DefiLlama yield-basis](https://defillama.com/protocol/yield-basis)).
- **Other**: crvUSD supply is $244M ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins)). CRV emissions fell below 100M/yr in Aug 2026 ([Curve News](https://news.curve.finance/)). Curve DEX TVL is $1.20B ([DefiLlama curve-dex](https://defillama.com/protocol/curve-dex)).

#### Pendle (V2 and Boros funding-rate markets)
- **Pendle V2**: TVL $1.11B, of which Ethereum is $812M and Arbitrum $52M ([DefiLlama pendle-v2](https://defillama.com/protocol/pendle-v2)).
- **Boros is Pendle's margin-based funding-rate trading venue on Arbitrum**
  - TVL $7.5M. Latest open interest in DefiLlama's dataset is about $128M ([DefiLlama boros](https://defillama.com/protocol/boros); [DefiLlama OI](https://api.llama.fi/overview/open-interest)).
  - It reached a daily notional ATH of $338.5M in the week of Mar 27, 2026, and added commodity, crypto and equity funding-rate markets: the first equity market (S&P 500), plus XAU, XAG and HYPE ([Pendle Print #107](https://pendlefi.substack.com/p/pendle-print-107)).
  - Secondary sources report $10B cumulative notional by Feb 5, 2026 ([DefiLlama-generated PDF via search](https://artifacts.llama.fi/pdf-exports/09097be1-9085-4083-bd5b-8d537fb062a3.pdf)).
- **Pendle MCP/Skills for AI agents**: launched Mar 27, 2026 ([Pendle Print #107](https://pendlefi.substack.com/p/pendle-print-107)).

#### Ethena, Sky/Spark, Lido, Compound, Fluid
- **Ethena**: USDe supply $4.67B: Ethereum $2.46B, Base $386M, Robinhood Chain $363M ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins); [DefiLlama ethena-usde](https://defillama.com/protocol/ethena-usde)).
- **Sky / Spark**
  - USDS supply $6.72B. Sky Lending TVL $5.69B, SparkLend $5.15B, Spark Liquidity Layer $2.71B (Base $405M), Spark Savings $1.62B (Arbitrum $312M).
  - Grove (Sky's RWA allocator, listed Mar 2026) has $1.40B.
  - Sources: [DefiLlama](https://defillama.com/protocol/spark-liquidity-layer); [DefiLlama grove-finance](https://defillama.com/protocol/grove-finance).
- **Lido**
  - TVL $23.7B ([DefiLlama lido](https://defillama.com/protocol/lido)).
  - **Lido V3 stVaults are live in production**: per-operator, per-client isolated staking vaults that can mint stETH. There is a series of institutional integrations in 2026: Fireblocks, Copper, Cactus, Luganodes, Stakely, and KR1 × P2P.org (up to 6,000 ETH).
  - LDO automated buybacks ("NEST") began in Aug 2026. Sharplink allocated $200M ETH.
  - Source: [Lido blog](https://blog.lido.fi/).
- **Compound V3**: TVL $1.42B, mostly Ethereum ([DefiLlama compound-v3](https://defillama.com/protocol/compound-v3)).
- **Fluid**: Lending $681M, DEX $234M TVL, with $3.48B 30d DEX volume on Ethereum ([DefiLlama fluid-dex](https://defillama.com/protocol/fluid-dex)).

#### 1inch Aqua (new shared-liquidity primitive)
- **Mechanism**
  - LPs approve tokens once. Aqua "doesn't hold tokens"; it tracks virtual allocations across many strategies, while funds stay in LP wallets.
  - Apps inherit `AquaApp`, `pull` output from the maker's allocation, and require the taker to `push` input via a callback. The app verifies that the maker's balance increased.
  - Strategies are immutable structs keyed by `keccak256(abi.encode(strategy))` and changed via `dock()` and `ship()`.
  - A "SwapVM router" exists alongside Aqua.
  - Same addresses on 16 networks, including Ethereum, Base and Arbitrum. Custom source license.
  - Source: [GitHub 1inch/aqua](https://github.com/1inch/aqua).
- **Scale**: $3.88B 30d volume and $7.0B all-time. Most volume is on Ethereum ([DefiLlama 1inch-aqua](https://defillama.com/protocol/1inch-aqua)).

#### GMX, Synthetix, Across, Sablier, Superfluid, Liquity, Frax
- **GMX**: TVL $213M ($205M on Arbitrum), latest open interest about $56.5M, about $1.1M 30d fees on Arbitrum. Small MegaETH deployment ([DefiLlama gmx-evm](https://defillama.com/protocol/gmx-evm); [DefiLlama fees Arbitrum](https://api.llama.fi/overview/fees/Arbitrum)). GMX V1 was exploited for $42M by reentrancy on Jul 9, 2025 ([DefiLlama hacks](https://api.llama.fi/hacks)).
- **Synthetix V4 (Ethereum mainnet perps)**: TVL $0.9M and open interest about $0.3M, i.e. negligible traction ([DefiLlama synthetix-v4](https://defillama.com/protocol/synthetix-v4)).
- **Across**: TVL $17.6M; named as a builder on The Compact ([DefiLlama across](https://defillama.com/protocol/across); [Uniswap](https://blog.uniswap.org/the-compact-v1)).
- **Sablier**: Lockup has $4.40B tracked as "vesting" but only $2.0M TVL; Flow has $0.5M ([DefiLlama sablier-lockup](https://defillama.com/protocol/sablier-lockup)).
- **Superfluid**: TVL $5.4M ([DefiLlama superfluid](https://defillama.com/protocol/superfluid)).
- **Liquity V2**: TVL $97.3M; BOLD supply $38M ([DefiLlama liquity-v2](https://defillama.com/protocol/liquity-v2)).
- **Frax**: frxUSD $103M TVL; Fraxtal $167M ([DefiLlama](https://defillama.com/protocol/frax)).

#### ENS
- ENSv2 is being discussed publicly: "Exploring Subnames in ENSv2" (Sep 24, 2026) describes subnames that can be tokens with "owners, expiries and permissions."
- ENS is also pitching itself as a registry layer for tokenized assets (Sep 4, 2026) and is working with GLEIF on organizational identity (Sep 28, 2026).
- Source: [ENS blog](https://ens.domains/blog).

### Inferences
- **Uniswap v4 hooks** are the most mature "host" surface for conditional logic. First-party hooks now prove that governance-upgradeable, per-swap fee logic, Dutch-auction fee decay, and compliance gating can carry $3B+ per month. A conditional-contract protocol could:
  - deploy its own v4 hook, e.g. settle or escrow in `afterSwap`, or create pools whose fee or curve depends on resolution state; or
  - simply read v4 pool state and TWAP-like data from deep pools (ETH/USDC on Ethereum, stable pairs) as resolver inputs.
- **CCA** gives a deterministic, per-block, uniform clearing price stored on-chain and readable via `CCALens`. That is a clean, manipulation-resistant resolver input (e.g. "Will token X's CCA clear above $P?" or "final raise above $N?"). The `validate()` bid hook is also a place where a conditional contract could gate bids, for example letting only holders of a winning outcome token bid.
- **The Compact** is nearly a ready-made escrow layer for "stake + resolver + deadline":
  - sponsor = the poster;
  - arbiter = the resolver program;
  - reset period = deadline plus a liveness fallback;
  - ERC-6909 lock tokens can transfer, so stake positions can move.
  - It is deployed at the same address on all three target chains.
- **Morpho** is the obvious venue for using conditional-contract positions as collateral. Blue markets are permissionless and need only an oracle for the position token.
  - **Midnight's isolated maturity markets** map neatly onto deadline-based contracts: a lender can lend against an outcome-claim token maturing at the resolver deadline.
  - Midnight "callbacks" (upcoming) would allow idle stake to earn variable yield until matched.
- **1inch Aqua and Spark DualPool** both show a "capital stays productive until pulled" pattern. A conditional-contract protocol could let posters keep their stake in their wallet or a yield vault and pull it only at take or settlement.
- **Avoid as building blocks for now**: Aave V4 (governance-gated spokes), Euler (retrenching, fees going to zero, team turnover) and Balancer (TVL collapse).

### Gaps
- No 2026 data found on: Uniswap v4 hook counts or rankings; the Doppler/Zora/Clanker share of v4 volume; CCA aggregate raise totals; or UniswapX volumes.
- Not verified (search budget exhausted):
  - Aave GHO-specific 2026 changes, Umbrella, and whether Aave V4 is formally live on Base (the Aave blog says yes for tokenized-stock collateral; DefiLlama doesn't list Base).
  - Morpho Vaults V2 adoption split.
  - Ethena product changes, Sky Endgame milestones, Safe/Gnosis/CoW 2026 changes, ENS Namechain status (no mention found on the ENS blog), Chainlink app-layer products, Across v4, and GMX/Synthetix product details.

---

## Q2. Base ecosystem (Base App, Zora/creator coins, Clanker, Aerodrome→Aero, Virtuals, Flaunch, Doppler, Moonwell, Morpho/Coinbase loans, agents, tokenized stocks)

### Takeaway
Base in late 2026 is mostly about:
- Coinbase distribution of DeFi rails: Morpho (variable and fixed-rate loans), tokenized stocks under the new B20 standard, and Aave V4 stock collateral;
- protocol-level programmability: Validity Transactions in the Cobalt upgrade, native account abstraction coming;
- agent tooling: Base MCP, x402.

The 2025 creator-coin and launchpad wave (Zora, Flaunch, Virtuals, Clanker) has largely cooled. Aerodrome is mid-migration to the cross-chain "Aero." No Base token has been announced.

### Cited Findings
- **Scale**
  - Base chain TVL $6.26B ([DefiLlama chains](https://defillama.com/chains)).
  - 30d DEX volume $29.95B, led by Aerodrome Slipstream $15.59B, Uniswap V3 $6.19B, PancakeSwap V3 $2.87B and Uniswap V4 $1.75B ([DefiLlama DEX Base](https://api.llama.fi/overview/dexs/Base)).
  - 30d fees on Base: Aerodrome Slipstream $9.7M, Uniswap V3 $9.4M, Morpho Blue $9.0M, Steakhouse $3.2M, Uniswap V4 $2.7M, Gauntlet $2.4M, clanker $1.3M, Venice $1.0M, Bankr $0.7M ([DefiLlama fees Base](https://api.llama.fi/overview/fees/Base)).
  - USDC on Base is $4.29B ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins)).
- **Base protocol upgrades (Base now ships its own named upgrades)**
  - Azul: first independent upgrade, mainnet May 13, 2026.
  - Beryl (Jun 18, 2026): B20 token standard, shorter withdrawal delay, Reth V2.
  - Cobalt (Sep 30, 2026).
  - Multiproofs, toward Stage 2.
  - "Native Account Abstraction" (Jul 17, 2026).
  - Builder Codes / ERC-8021 attribution (Feb 12, 2026).
  - Base Verify anti-sybil (Feb 9, 2026).
  - Practical on-chain AWS Nitro attestation verification (Aug 11, 2026).
  - A block-production outage on Jun 25, 2026.
  - Source: [Base blog](https://base.org/blog).
- **Cobalt "Validity Transactions"**
  - Users submit one signed transaction via `base_sendRawTransactionValidity` with criteria. The transaction "remain[s] dormant until user-specified criteria are met."
  - Base evaluates the conditions against chain state as each block is built. Examples: pool price ≥ 4,000 USDC, block number < 1,157,000, or a `flashblock_index` condition.
  - Submissions stay private until they land.
  - Coming next: 200ms blocks, "Base Transactions" (smart accounts first-class), and a subset of Glamsterdam EVM features.
  - Source: [Base blog: Cobalt](https://base.org/blog/cobalt).
- **B20 tokenized-stock standard**
  - Transfer policies with a shared Policy Registry. Composite AND/OR policies were added in Cobalt.
  - A corporate-action **multiplier** handles dividends and splits without rebasing balances, so "AMM liquidity stays in place through a split."
  - `seizeWithMemo`, pause switches, and ISIN/CUSIP metadata. ERC-8056 alignment.
  - Each Coinbase Tokenized Stock pairs with a **Chainlink total-return feed** that includes the multiplier.
  - Non-US eligible persons only. Mint and redeem are limited to KYC'd Authorized Participants.
  - Sources: [Base blog: B20](https://base.org/blog/b20-tokenized-stocks-on-base); [Cobalt](https://base.org/blog/cobalt).
  - Tokenized stocks went live on Base Aug 24, 2026 ([Base blog](https://base.org/blog)). Coinbase stock tokens did $124.8M DEX volume by Aug 28, 2026, led by NVIDIA and Alphabet ([Crypto Briefing](https://cryptobriefing.com/coinbase-stock-tokens-drive-125m-dex-volume-on-base-platform/)).
- **Base token**
  - No 2026 Base blog post mentions one. A 2025 post said Base was "beginning to explore a network token" ([Base blog](https://base.org/blog)).
  - Polymarket-style odds of a launch by Dec 31, 2026 ranged 5–13% in late Aug 2026 ([Crypto Briefing](https://cryptobriefing.com/coinbase-stock-tokens-drive-125m-dex-volume-on-base-platform/)).
  - JPMorgan estimated up to $34B in value (2025) ([The Block](https://www.theblock.co/amp/post/376134/coinbases-base-token-could-be-worth-34-billion-jpmorgan-says)).
- **Agents on Base**
  - Base MCP went live May 26, 2026. Users connect a Base Account to an agent to swap, transfer, lend and track portfolios.
  - x402 on Base in the 30 days to May 29, 2026: 3.1M transactions and $1.2M value. Sellers +23%, buyers +37%.
  - Named agent services include Bankr x402 Cloud, Venice, BlockRun and Browserbase.
  - Source: [Base blog: Agentic Economy](https://base.org/blog/the-agentic-economy-is-here).
- **Base App**: launched Dec 2025 per the Base blog listing ([Base blog](https://base.org/blog)). It shows $2.34M 30d fees and $129.3M all-time across chains ([DefiLlama base-app](https://defillama.com/protocol/base-app)).
- **Zora coins (mechanics)**
  - Creator Coins: 1B supply, of which 500M goes to the pool and 500M vests to the creator over 5 years.
  - Content Coins: backed by the creator coin; 990M to the pool, 10M to the creator.
  - Trend Coins: 1 bps fee.
  - Each coin has its own **Uniswap v4 pool with a custom hook**: a 99% "sniper tax" decaying over 10 seconds, per-trade reward distribution, and 20% of fees locked as permanent liquidity. Initial liquidity is set up via **Doppler** multicurve.
  - Source: [Zora docs](https://docs.zora.co/coins).
- **Zora coins (activity has collapsed)**: $10.4M all-time fees but only about $0.01M in the last 30 days ([DefiLlama zora-coins](https://defillama.com/protocol/zora-coins)).
- **Doppler**
  - A token-launch protocol using "multicurve" liquidity defined by market-cap ranges, deployed via an SDK (`createMulticurve`) on Base, with a Solana devnet version.
  - Users: Zora, Paragraph, Noice and Bankr.
  - Source: [Doppler docs](https://docs.doppler.lol/).
- **Clanker**
  - Token deployment on Base, Arbitrum and other EVM chains.
  - REST API with partner and user tiers. `clanker-sdk` V4 with extensions for airdrops, presales and allowlists.
  - "Droids": AI agents launched with a token, a Farcaster account, and compute funded from LP rewards.
  - Source: [Clanker docs](https://clanker.gitbook.io/clanker-documentation).
  - Fees: $1.35M in the last 30 days and $92.5M all-time, across Base, Arbitrum, Unichain, Ethereum, Monad and Robinhood Chain ([DefiLlama clanker](https://defillama.com/protocol/clanker)).
- **Bankr**: $1.87M 30d fees and $40.4M all-time on Base and Robinhood Chain ([DefiLlama bankr](https://defillama.com/protocol/bankr)).
- **Virtuals**
  - $0.39M 30d fees vs $74.7M all-time, across Base, Solana, Ethereum, Robinhood Chain and Arc ([DefiLlama virtuals-protocol](https://defillama.com/protocol/virtuals-protocol)).
  - The "Agent Commerce Protocol" (ACP) has four phases: Request, Negotiation (signed "Proof of Agreement"), Transaction ("both payment and deliverables held in escrow"), and Evaluation by **evaluator agents** that approve or reject deliverables with reasoning ([Virtuals ACP deep dive](https://whitepaper.virtuals.io/about-virtuals/commerce-layer/technical-deep-dive.md)).
  - Agent tokens pair with VIRTUAL and graduate at 42,000 VIRTUAL to Uniswap V2 with 10-year LP locks ([Virtuals whitepaper](https://whitepaper.virtuals.io/)).
  - Nearly 16K agents launched on Base via Virtuals between Oct 2024 and Feb 2025 ([Base blog](https://base.org/blog/the-agentic-economy-is-here)).
- **Aerodrome → Aero**
  - Dromos Labs announced in Nov 2025 a merger of Aerodrome (Base) and Velodrome (OP) into "Aero" with a single AERO token. AERO holders get about 94.5% and VELO holders about 5.5%. The plan includes "MetaDEX03," expansion to Ethereum and Circle Arc, and ending legacy support after launch ([The Defiant](https://thedefiant.io/news/defi/dromos-labs-merges-aerodrome-and-velodrome-into-new-dex-aero); [The Block](https://www.theblock.co/post/378634/aerodrome-upgrades-evm-extensions-circles-arc-metadex)).
  - Status on Oct 21, 2026: aero.xyz says "Aero is on the horizon," lists Base, Ethereum, Robinhood, Arc, OP, Arbitrum and Ink, promises "100% of exchange revenue to AERO stakers," and shows a banner for "October 21, 8:00 PM EDT" ([aero.xyz](https://aero.xyz/)).
  - DefiLlama lists a lightweight "Aero" on Arc since Sep 18, 2026 ($3.4M) and "Aero V2" since Oct 20, 2026 ($0) ([DefiLlama aero-v2](https://defillama.com/protocol/aero-v2)). **Treat the launch as imminent, not shipped.**
  - Aerodrome Ignition (Nov 2025) is a DEX-native launch mechanism that deposits 10–20% of supply into pools, with veAERO directing emissions. TVL $22.2M ([DefiLlama aerodrome-ignition](https://defillama.com/protocol/aerodrome-ignition)).
- **Lending on Base besides Morpho is small**: Moonwell Lending $11.6M TVL; Seamless V2 has a dead URL on DefiLlama ([DefiLlama moonwell-lending](https://defillama.com/protocol/moonwell-lending); [DefiLlama](https://defillama.com/protocol/seamless-v2)).
- **Perps on Base**: Veranta (crypto plus equities, FX, metals and commodities) has $11.8M TVL and about $81M latest open interest ([DefiLlama veranta](https://defillama.com/protocol/veranta); [DefiLlama OI](https://api.llama.fi/overview/open-interest)).
- **Prediction market**: Limitless Exchange TVL is $0.4M ([DefiLlama](https://defillama.com/protocol/limitless-exchange)).
- **Ethos**: portable reputation (reviews, vouches, credibility scores) on Base ([Base blog](https://base.org/blog)).

### Inferences
- **Validity Transactions are the single most relevant new Base primitive** for an agent-native conditional-contract protocol:
  - Agents can pre-sign "take the other side if on-chain condition X holds before block N" or "trigger settlement at the deadline block" without running a keeper.
  - Submissions are private until inclusion, which limits front-running of takes.
  - Risk: Base-specific, sequencer-trusted, and not portable to Ethereum or Arbitrum.
- **B20 plus Chainlink total-return feeds** give a standardized 24/7 equity price surface that a resolver can read. Corporate actions are handled by the multiplier rather than balance changes, so resolvers must read `multiplier()` or the total-return feed, not raw balances.
- **Virtuals ACP** is the closest existing analogue to the user's design (escrow plus evaluator). Its evaluator is an agent's judgment rather than a deterministic program. A code-resolved protocol could position itself as a deterministic evaluator backend for ACP jobs.
- **Creator-coin markets are too thin to be robust resolver inputs.** Activity collapsed (Zora coins at about $10K fees per 30 days), so "creator coin X above $Y at time T" contracts would be cheap to manipulate.
- **Base MCP, Morpho Agents, Aave MCP and Pendle MCP** set the bar: major protocols now ship MCP servers plus "skills" that construct unsigned transactions. An agent-native protocol should ship the same.

### Gaps
- Not verified (search budget exhausted): Base App user numbers; Farcaster/Clanker ownership changes; Flashblocks status in 2026; Avantis (not found under that name in DefiLlama); Limitless details; Coinbase crypto-backed loan totals beyond the "Coinbase Lend >$500M" figure; Base Names; onchain games on Base.
- The Virtuals ACP refund and release logic, chains and contract addresses were not found on the fetched page.

---

## Q3. Arbitrum ecosystem (Stylus, GMX, Pendle/Boros, Hyperliquid bridge, Robinhood Chain, Ostium, DAO programs, Camelot, Vertex, Gains, Orbit chains)

### Takeaway
The Arbitrum story in 2026 is **Robinhood Chain**, a dedicated Arbitrum chain live since Jul 1, 2026 that pays 10% of net revenue to Arbitrum. On DefiLlama it is already the #2 EVM DEX venue by 30-day volume ($34.2B, ahead of Base's $30.0B), with Uniswap v4, Morpho, Lighter and Arcus perps, and Robinhood stock tokens. Arbitrum One itself has modest TVL ($1.45B) but strong derivatives activity: Variational (P2P derivatives), Boros (funding-rate markets), GMX and USD.AI. It also has new transaction ordering (Priority Gas Auctions plus Fast Feed, Oct 7, 2026).

### Cited Findings
- **Arbitrum One scale**
  - Chain TVL $1.45B ([DefiLlama chains](https://defillama.com/chains)).
  - 30d DEX volume $5.26B: Uniswap V3 $2.97B, Uniswap V4 $716M, Fluid $452M, Camelot V3 $115M ([DefiLlama DEX Arbitrum](https://api.llama.fi/overview/dexs/Arbitrum)).
  - Top 30d fees: USD AI $4.5M, Aethir $3.0M, Spiko $2.5M, Uniswap V3 $1.8M, GMX $1.1M, Aave V3 $1.0M, Gains $0.6M, Ostium $0.2M ([DefiLlama fees Arbitrum](https://api.llama.fi/overview/fees/Arbitrum)).
- **Arbitrum H1 2026 (self-reported)**
  - 474–478M transactions in the half and 2.7B lifetime. ATH of 133M transactions in Feb 2026.
  - 10.5M stablecoin holders and $60–70B monthly stablecoin transfers.
  - About $850M RWA AUM (3x YoY), #1 by RWA deployment count.
  - Derivatives OI +434%, peaking at $1.5B. PYUSD peaked at $428M.
  - DAO H1 income $6.19M at 97% gross margins, from tx fees, Timeboost, AEP licence fees and treasury. $125M non-native treasury.
  - Sources: [Arbitrum Foundation blog H1 2026](https://blog.arbitrum.foundation/arbitrum-h1-2026-the-programmable-economy-is-accelerating/); [Forum H1 update](https://forum.arbitrum.foundation/t/the-arbitrum-foundation-h1-2026-progress-update/31378); [The Block](https://theblock.co/news/ecosystems/2026-09-02-arbitrum-dao-reports-6-2-million-first-half-income-robinhood-chain-adds-new-revenue-stream-413345).
- **Protocol and ordering changes**
  - ArbOS 61 "Elara" is live (Aug 2026) with contract-size limits and compliance controls. "ZK is coming to Arbitrum One and dedicated chains."
  - **Priority Gas Auctions (PGA) and Fast Feed went live Oct 7, 2026**, with a Sep 28 post on "How Arbitrum's New Ordering Mechanism Creates More Opportunities for Traders & DeFi Primitives."
  - Dynamic pricing is live.
  - USDG (Paxos) went live on Arbitrum Oct 20, 2026 under a Stablecoin Growth Program.
  - Source: [Arbitrum Foundation blog](https://blog.arbitrum.foundation/).
- **Stylus**: the only 2026 item found was a Stylus Hardhat plugin suite from CoBuilders (Jul 30, 2026) ([Arbitrum Foundation blog](https://blog.arbitrum.foundation/)). arbitrum.io/stylus returned 403.
- **Robinhood Chain**
  - Public mainnet Jul 1, 2026. Testnet opened Feb 10, 2026 and processed >200M transactions.
  - ETH gas token, 100ms latency via preconfirmations.
  - New Stock Tokens are restructured as **tokenised debt securities**, self-custodied in Robinhood Wallet, and traded 24/7 in 120+ countries. Classic Stock Tokens have been on Arbitrum One since Jun 2025.
  - Launch apps: Uniswap, Morpho, USDG, Robinhood Earn.
  - Pays 10% of net revenue: 8% to the DAO and 2% to the Developer Guild.
  - Sources: [ArbitrumDAO factsheet](https://forum.arbitrum.foundation/t/arbitrumdao-factsheet-robinhood-chain-mainnet-launch/31041); [The Block testnet](https://www.theblock.co/post/389325/robinhood-launches-public-testnet-arbitrum).
- **Robinhood Chain metrics**
  - Two weeks in: about $600M total value secured, $808M+ 24h DEX volume, >$800K revenue ([Arbitrum blog](https://blog.arbitrum.foundation/arbitrum-h1-2026-the-programmable-economy-is-accelerating/)).
  - Now: chain TVL $1.15B ([DefiLlama chains](https://defillama.com/chains)).
  - **30d DEX volume $34.16B**: Uniswap V4 $13.93B, Uniswap V3 $12.57B, Fables $2.37B, Ramses $976M, Lighter Spot $267M ([DefiLlama DEX Robinhood Chain](https://api.llama.fi/overview/dexs/Robinhood%20Chain)).
  - **30d fees $117.6M**: Uniswap V4 $45.6M, **Pons V2 launchpad $31.7M**, Fables $4.9M, Lighter perps $2.3M, Morpho $1.8M, Arcus $1.7M ([DefiLlama fees Robinhood Chain](https://api.llama.fi/overview/fees/Robinhood%20Chain)).
  - Stablecoins on the chain: USDG $690M and USDe $363M ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins)).
- **Robinhood Chain apps**
  - **Lighter Robinhood Perps**: TVL $113.8M, latest OI about $211M ([DefiLlama lighter-robinhood-perps](https://defillama.com/protocol/lighter-robinhood-perps)).
  - **Arcus Perps**: "built by the team behind dYdX in partnership with Robinhood Crypto." P2P trading of stock tokens, crypto and perps. TVL $63.4M, OI about $111M ([DefiLlama arcus-perps](https://defillama.com/protocol/arcus-perps)).
  - **Pons**: a "fixed-supply tokens … liquidity graduation" launchpad ([DefiLlama pons-v2](https://defillama.com/protocol/pons-v2)).
  - **Meridian**: RWA perps plus prediction markets, small ([DefiLlama meridian-perps](https://defillama.com/protocol/meridian-perps)).
- **Variational (Arbitrum)**
  - P2P trading, clearing and settlement for perps and "generalized derivatives."
  - **Omni** is a zero-fee perps venue with 500+ markets that sources liquidity from CEXs and DEXs.
  - **Pro** lets institutions "define their own derivatives, margin and liquidation rules, and escrow collateral in segregated on-chain contracts," priced by the Variational Oracle.
  - Sources: [Variational docs](https://docs.variational.io/); [DefiLlama variational](https://defillama.com/protocol/variational).
  - Latest open interest in DefiLlama's dataset is about $999M, the largest of any Arbitrum, Base or Ethereum perp venue listed ([DefiLlama OI](https://api.llama.fi/overview/open-interest)).
- **Hyperliquid bridge**: $6.74B total, of which $400M sits on the Arbitrum side ([DefiLlama hyperliquid-bridge](https://defillama.com/protocol/hyperliquid-bridge)). DefiLlama also lists "Hyperliquid Outcomes" (outcome markets on Hyperliquid) from Oct 8, 2026 ([DefiLlama hyperliquid-outcomes](https://defillama.com/protocol/hyperliquid-outcomes)).
- **USD.AI**: a "yield-bearing synthetic dollar … backed by real-world infrastructure assets" (GPU loans). TVL $263M on Arbitrum; the top Arbitrum fee earner at $4.5M per 30 days ([DefiLlama usd-ai](https://defillama.com/protocol/usd-ai)).
- **Ostium (RWA perps: FX, metals, energy)**: hit by a $23.8M private-key compromise on Jul 15, 2026 ([DefiLlama hacks](https://api.llama.fi/hacks)). TVL is now $3.9M, latest OI about $8.8M ([DefiLlama ostium](https://defillama.com/protocol/ostium)).
- **Gains Network**: TVL $8.3M, chains include Arbitrum, Base and MegaETH ([DefiLlama gains-network](https://defillama.com/protocol/gains-network)). **Camelot V3**: TVL $4.4M ([DefiLlama camelot-v3](https://defillama.com/protocol/camelot-v3)).
- **Vertex Perps**: TVL $0 on all chains ([DefiLlama vertex-perps](https://defillama.com/protocol/vertex-perps)).
- **Rain**: prediction-market protocol on Arbitrum with "create markets" and $17.0M TVL ([DefiLlama rain](https://defillama.com/protocol/rain)). **Overtime** (sportsbook with Chainlink feeds) has $1.3M TVL ([DefiLlama overtime](https://defillama.com/protocol/overtime)).
- **Kelp exploit (Apr 18, 2026)**: cross-chain message spoofing on the LayerZero-based rsETH bridge, about $292–293M, on Ethereum and Arbitrum. stETH VWAP hit about 0.9941 during the stress window ([DefiLlama hacks](https://api.llama.fi/hacks); [Lido blog](https://blog.lido.fi/steth-liquidity-held-ground-during-stress-event/)).

### Inferences
- **Robinhood Chain is a large, under-appreciated venue** for an agent-native protocol. It has deep Uniswap v4 liquidity on tokenized equities, Morpho credit, and a retail memecoin flow (Pons) generating more fees than any Base launchpad.
  - Conditional contracts on 24/7 equity tokens (e.g. "NVDA token price at deadline vs strike, read from v4 pool or Chainlink") have natural demand there.
  - Caveat: Robinhood-operated sequencer and governance.
- **Variational Pro is effectively an institutional "custom bilateral contract with escrowed collateral and oracle-driven settlement" engine.** It is both a competitor and a possible settlement or hedging venue for agents taking the other side.
- **Boros** turns funding rates (crypto, HYPE, gold, silver, S&P 500) into tradable implied-APR markets on Arbitrum. Boros implied APR and the underlying funding rates are useful resolver variables, and a hedge venue for agents writing funding-linked conditional contracts.
- **Arbitrum's PGA + Fast Feed ordering** affects agents racing to "take" the other side or to trigger settlement. The protocol design should avoid first-come-first-served take races, e.g. by using batch or auction-based takes.

### Gaps
- Stylus production apps (names, counts, gas savings) are unverified; the arbitrum.io page was 403 and the search budget was exhausted.
- DRIP results and the gaming catalyst's status were not found.
- Not verified: Vertex's shutdown reason or date (DefiLlama shows $0); whether Timeboost has been replaced or supplemented by PGA; Xai status; other Orbit chains (30+ dedicated chains exist per Arbitrum's H1 blog, but none were named).
- How DefiLlama's open-interest dataset defines the "24h" value is not fully clear (taken here as the latest OI snapshot); cross-check before quoting.

---

## Q4. New and unusual primitives on Ethereum mainnet and L2s (resource locks, programmable liquidity, onchain auctions, streaming, perps on anything, funding-rate markets, MEV-aware AMMs, intent/offer lending, order books, tokenized stocks/RWAs, stablecoins, launch mechanics)

### Takeaway
The most novel live mechanisms are:
- resource locks with pluggable arbiters (The Compact);
- per-block uniform-price token auctions with bid-validation hooks (CCA);
- protocol-level conditional transactions (Base Validity Transactions);
- wallet-resident shared liquidity (1inch Aqua) and just-in-time liquidity pulled from vaults (Spark DualPool);
- governance-upgradeable dynamic-fee hooks with Dutch-auction fees;
- offer-based fixed-term credit (Morpho Midnight);
- funding-rate markets on equities and commodities (Boros);
- issuer-controlled tokenized-stock standards (B20, Permissioned Pools);
- calendar-aware AMM fees for stocks (Fables);
- a wave of curator-run vaults, tranching protocols (Strata) and on-chain reinsurance (Re).

Streaming (Sablier, Superfluid) remains small.

### Cited Findings
- **Resource locks**: The Compact. ERC-6909 locks, arbiters, allocators, emissaries, force-withdraw after reset period; on Ethereum, Unichain, Base and Arbitrum ([Uniswap](https://blog.uniswap.org/the-compact-v1)).
- **Onchain auctions**
  - Uniswap CCA: per-block clearing, max-price bids, v4 seeding, `validate()` hooks, self-serve since Jun 24, 2026 ([GitHub](https://github.com/Uniswap/continuous-clearing-auction); [The Block](https://www.theblock.co/post/378864/uniswap-continuous-clearing-auctions)).
  - StablePair Dutch-auction fee decay for peg-restoring flow ([Uniswap](https://blog.uniswap.org/stablepair-hook-a-fee-that-moves-with-the-market)).
  - Aerodrome Ignition DEX-native launch ([DefiLlama](https://defillama.com/protocol/aerodrome-ignition)).
  - Doppler multicurve launches ([Doppler docs](https://docs.doppler.lol/)).
- **Conditional transactions at the sequencer**: Base Validity Transactions (Sep 30, 2026) ([Base](https://base.org/blog/cobalt)).
- **Programmable and shared liquidity**
  - 1inch Aqua: $3.88B per 30 days ([GitHub](https://github.com/1inch/aqua); [DefiLlama](https://defillama.com/protocol/1inch-aqua)).
  - Spark DualPool ([Uniswap](https://blog.uniswap.org/spark-moves-150m-of-liquidity-to-v4-with-new-hook-coming-soon)).
  - EulerSwap (liquidity inside lending vaults; single-operator instability noted) ([Euler](https://www.euler.finance/blog/euler-q1-2026)).
  - Prop AMMs are emerging on EVM: FermiSwap ("prop AMM on Ethereum," $1.36B per 30 days), Tessera V, Metric, and Hanji ("on-chain CLOB dex and prop-amm" on Base) ([DefiLlama DEX Ethereum](https://api.llama.fi/overview/dexs/Ethereum); [DefiLlama protocols](https://defillama.com/protocol/hanji-protocol)).
- **MEV-aware AMMs**: Angstrom ($0.56B per 30 days on Ethereum) ([DefiLlama](https://defillama.com/protocol/angstrom)); What The Hook (arbitrage returned to traders and LPs) ([DefiLlama](https://defillama.com/protocol/what-the-hook)); the Balancer CoW AMM is effectively dead at $0.1M ([DefiLlama](https://defillama.com/protocol/balancer-cow-amm)).
- **Intent and offer-based lending**: Morpho Midnight with signed maker offers, credit units, and fixed maturities ([Morpho docs](https://docs.morpho.org/build/midnight/get-started/)). Other fixed-rate lenders: Olympus Cooler Loans (fixed 0.5% APR, $232.5M) ([DefiLlama](https://defillama.com/protocol/cooler-loans)) and TermMax/Term Finance (present in DefiLlama; not examined).
- **Funding-rate and rate derivatives**: Boros, with equity, commodity and HYPE funding markets ([Pendle Print #107](https://pendlefi.substack.com/p/pendle-print-107)).
- **"Perps on anything" on EVM**
  - Variational Omni: 500+ markets ([Variational](https://docs.variational.io/)).
  - Veranta on Base: equities, FX, metals, commodities ([DefiLlama](https://defillama.com/protocol/veranta)).
  - Ondo Perps (listed Jun 9, 2026): equities, indices, commodities up to 20x ([DefiLlama ondo-perps](https://defillama.com/protocol/ondo-perps)).
  - Arcus and Lighter on Robinhood Chain ([DefiLlama](https://defillama.com/protocol/arcus-perps)).
  - Derive v3 options, "a zkVM exchange settling on Ethereum," listed Oct 8, 2026 with $181.7M TVL ([DefiLlama derive-v3-options](https://defillama.com/protocol/derive-v3-options)).
- **Tokenized stocks and RWAs**
  - Coinbase B20 stocks on Base (Aug 2026) ([Base](https://base.org/blog/b20-tokenized-stocks-on-base)).
  - Robinhood Stock Tokens as tokenized debt securities on Robinhood Chain ([Arbitrum forum](https://forum.arbitrum.foundation/t/arbitrumdao-factsheet-robinhood-chain-mainnet-launch/31041)).
  - Uniswap Permissioned Pools ([Uniswap](https://blog.uniswap.org/how-permissioned-pools-work-on-uniswap-v4)).
  - BUIDL via UniswapX ([Uniswap](https://blog.uniswap.org/)).
  - Centrifuge S&P 500 index fund token on Base ([Base](https://base.org/blog)).
  - Aave Horizon at $253M ([DefiLlama](https://defillama.com/protocol/aave-horizon-rwa)).
  - Euler and Securitize permissioned lending ([Euler](https://www.euler.finance/blog)).
- **Stablecoin innovation (supply, Oct 2026)**
  - USDG $3.07B (Robinhood Chain $690M); PYUSD $2.87B; USD1 $4.01B; RLUSD $2.41B; Falcon USDf $1.72B; USDai $262M ([DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins)).
  - **USDCx**: "a private, programmable stablecoin built with Circle," $64.3M, listed Jun 2026 ([DefiLlama usdcx](https://defillama.com/protocol/usdcx)).
  - **Circle Gateway**: unified cross-chain USDC balance, $76.8M ([DefiLlama circle-gateway](https://defillama.com/protocol/circle-gateway)).
- **Structured risk and insurance**
  - **Re**: on-chain reinsurance. It pools stablecoins into regulated reinsurance contracts and issues reUSD and reUSDe. $450.6M on Ethereum, Base, Arbitrum and Avalanche ([DefiLlama re](https://defillama.com/protocol/re)).
  - **Strata**: generalized senior/junior tranching, $32.5M ([DefiLlama strata-markets](https://defillama.com/protocol/strata-markets)); Pendle lists srUSDe and jrUSDe ([Pendle Print #107](https://pendlefi.substack.com/p/pendle-print-107)).
  - **Lido Earn**: on-chain first-loss protection ([Lido blog](https://blog.lido.fi/)).
- **Curator and vault economy**
  - Sentora $2.52B, Nonce Capital $601M, RockawayX $275M, Mellow Core $263M, Armitage by Wintermute $131M, Galaxy $125M ([DefiLlama protocols](https://defillama.com/protocol/sentora-curator)).
  - Makina: strategy "Machines" with cross-chain "Calibers," $41.1M ([DefiLlama makina](https://defillama.com/protocol/makina)).
  - Morpho reports 30+ curators and >$11B in curated vaults ([Morpho](https://morpho.org/blog/the-morpho-effect-september-2026)).
- **Streaming**: Sablier Flow $0.5M and Superfluid $5.4M TVL, so streaming is not a growth area ([DefiLlama](https://defillama.com/protocol/superfluid)).
- **Launchpads**: Robinhood Chain's Pons V2 ($31.7M fees per 30 days) has displaced Base launchpads by fees (Zora coins $0.01M, Flaunch $0.02M, Clanker $1.35M, Virtuals $0.39M) ([DefiLlama fees Robinhood Chain](https://api.llama.fi/overview/fees/Robinhood%20Chain); [DefiLlama](https://defillama.com/protocol/zora-coins)).
- **Onchain order books on EVM**
  - Lighter Spot on Robinhood Chain: $267M per 30 days ([DefiLlama DEX RH](https://api.llama.fi/overview/dexs/Robinhood%20Chain)).
  - Hanji CLOB on Base: $365M per 30 days ([DefiLlama DEX Base](https://api.llama.fi/overview/dexs/Base)).
  - MegaETH chain TVL is only about $0.01B on DefiLlama ([DefiLlama chains](https://defillama.com/chains)).
- **Privacy primitives entering DeFi**: Zama (FHE) $131.6M TVL listed May 2026, with 16 confidential Morpho vaults launching ([DefiLlama zama](https://defillama.com/protocol/zama); [Morpho](https://morpho.org/blog/the-morpho-effect-september-2026)); Unlink privacy on Euler ([Euler](https://www.euler.finance/blog)).

### Inferences
- **The Compact plus Base Validity Transactions plus Morpho Midnight** together sketch an agent-native stack: lock the stake in a resource lock, condition the take or settlement transaction on chain state, and finance or hedge the position in a fixed-term market maturing at the deadline.
- **Wallet-resident liquidity** (Aqua) and **vault-resident JIT liquidity** (DualPool) suggest a design where posted stakes are "virtual" commitments that earn yield until a counterparty takes them. Liveness risk applies if the poster withdraws, but Aqua-style post-callback balance checks handle it atomically.
- **Prop AMMs, permissioned pools and stock tokens** mean more real-world-referenced prices now live on-chain 24/7. That widens the resolver data universe, at the cost of issuer-level controls (pause, seize) that can freeze settlement assets.

### Gaps
- No verified data on: HIP-3-equivalent permissionless perp listing on EVM (Variational Omni lists 500+ markets, but whether third parties can permissionlessly list was not confirmed); Angstrom/Sorella 2026 roadmap; am-AMM deployments; onchain games on Base or Arbitrum; points-program trends; GTE/Kuru/other MegaETH order books (Kuru CLOB shows $1.1M TVL on DefiLlama, chain not checked).

---

## Q5. Which primitives are most resolver-friendly or could host conditional contracts? Plus the most surprising mechanisms and composition ideas

### Takeaway
The best **resolver data sources** are deterministic, on-chain, and expensive to manipulate:
- deep Uniswap v4/v3 pools on Ethereum (ETH/USDC, stable pairs);
- CCA clearing prices (single per-block uniform price, stored on-chain);
- ERC-4626 share prices of large curated vaults (Morpho, Spark);
- Morpho Midnight implied fixed rates (credit-unit prices);
- Boros implied funding APRs;
- Chainlink total-return feeds for B20 stocks;
- Lido stETH/ETH market depth.

The best **hosts or settlement layers** are Uniswap v4 hooks, The Compact (escrow with pluggable arbiter), Morpho Blue and Midnight (outcome tokens as collateral, maturity-aligned loans), Base Validity Transactions (conditional take or settle), and 1inch Aqua (wallet-resident stakes).

### Cited Findings
- **Exploits shaped which primitives are safe to compose with (Jun 2025 to Oct 2026, ETH/Base/Arb-relevant)**
  - Kelp rsETH bridge spoofing, $293M (Apr 18, 2026).
  - Balancer V2 rounding error, $128M (Nov 3, 2025).
  - GMX V1 reentrancy, $42M (Jul 9, 2025).
  - Resolv USR "key leaked via infrastructure," $24.5M (Mar 21, 2026); USR supply is now about $0.
  - AFX Bridge validator key, $24.1M (Arbitrum, Jul 22, 2026).
  - Ostium private key, $23.8M (Jul 15, 2026).
  - Truebit arithmetic error, $26.4M (Jan 8, 2026).
  - Matcha frontend compromise, $13.4M (Jan 25, 2026, Base/Ethereum).
  - Source: [DefiLlama hacks](https://api.llama.fi/hacks); [DefiLlama stablecoins](https://stablecoins.llama.fi/stablecoins).
- **Euler's explicit lessons on oracles**: the Resolv exploit (Mar 2026) is cited as "collateral losing value and oracles reporting stale prices." Stream Finance's default wiped Euler's Plasma deployment ([Euler Q1 2026](https://www.euler.finance/blog/euler-q1-2026)).
- **The stETH peg held during the Kelp stress**: worst Curve daily VWAP about 0.9941, and the wstETH $1M sell impact rose from -0.1 bps to -5.0 bps median ([Lido](https://blog.lido.fi/steth-liquidity-held-ground-during-stress-event/)). That is a useful benchmark for "expensive to manipulate."
- **StablePair and VolatilePair fee logic is governance-upgradeable** ([Uniswap](https://blog.uniswap.org/stablepair-hook-a-fee-that-moves-with-the-market)). Pool behaviour can therefore change under a resolver that reads fees or prices from these pools.
- **B20 issuers can pause, seize (`seizeWithMemo`) and schedule multiplier changes** ([Base Cobalt](https://base.org/blog/cobalt)). Permissioned Pools let issuers `unwindPosition` ([Uniswap](https://blog.uniswap.org/how-permissioned-pools-work-on-uniswap-v4)).
- **The Compact provides force-withdraw after the reset period and lets sponsors exit if an allocator or arbiter misbehaves** ([Uniswap](https://blog.uniswap.org/the-compact-v1)). This liveness guarantee directly suits deadline-based contracts.
- **CCA validation hooks reject bids by reverting in `validate()`**; `CCALens` exposes auction state for reads ([GitHub](https://github.com/Uniswap/continuous-clearing-auction)).
- **Morpho Midnight credit units are claims on exactly one loan token at maturity**, with rates implied by the prices at which units are taken ([Morpho docs](https://docs.morpho.org/build/midnight/get-started/)).

### Inferences: resolver-friendliness ranking (Oct 2026)

**Tier 1: deep, deterministic, permissionless to read**
- Uniswap v4/v3 ETH/USDC and stable pools on Ethereum. A resolver should use multi-block TWAP or median logic rather than spot, given $1B+/day of flow on the chain.
- Lido stETH/ETH.
- Large ERC-4626 vault share prices (Morpho >$11B curated; Spark Savings $1.6B).
- Chainlink feeds, including B20 total-return feeds.

**Tier 2: deterministic but thinner or newer**
- CCA clearing prices (one-shot, auction-specific).
- Morpho Midnight implied rates (still only about $14M TVL).
- Boros implied APRs (about $128M OI).
- Robinhood Chain v4 stock-token pools (deep volume, but sequencer and issuer controlled).

**Tier 3: avoid as resolver inputs**
- Creator coins (Zora, Clanker, Flaunch) and launchpad tokens: thin and collapsing.
- Small perps venues (Ostium post-hack, Synthetix V4).
- Anything bridged via a single-verifier message path (Kelp lesson).

### Inferences: host and composition ideas

**Settlement and escrow**
1. **Compact-native conditional contracts.** The poster deposits a stake into a Compact resource lock (ERC-6909) and signs a Compact whose arbiter is the resolver program. The taker locks matching stake. At the deadline the arbiter submits the claim, and the force-withdraw reset period acts as a timeout refund. The same address on Ethereum, Base, Arbitrum and Unichain enables cross-chain takes, e.g. stake on Base, taker on Arbitrum, via Tribunal-style fills.
2. **Wallet-resident or vault-resident stakes.** Model a posted offer as a 1inch Aqua strategy, or a DualPool-style pull from an ERC-4626 vault. Funds earn yield until taken, and the take callback verifies that funds moved atomically.

**Hooks and Base-native triggers**
3. **Uniswap v4 "settlement hook."**
   - A pool between YES/NO claim tokens and USDC whose hook freezes trading and redeems at the deadline, reading the resolver result in `beforeSwap`.
   - Or a hook that charges StablePair-style Dutch-auction fees near resolution, to price information-driven flow.
4. **CCA as price discovery for conditional contracts.** Auction off the "taker side" of a large conditional contract via a per-block uniform-price CCA. A `validate()` hook enforces taker eligibility (e.g. a staked agent identity). Proceeds seed a v4 pool for secondary trading of the position.
5. **Base Validity Transactions as agent standing orders.**
   - Agents pre-sign takes that execute only when on-chain state (pool price, vault share price) crosses a threshold before block N.
   - Resolvers or settlers pre-sign "settle at block ≥ deadline" transactions that need no keeper.
   - Private until inclusion, so no front-running of takes.

**Credit, data and venue**
6. **Outcome or position tokens as Morpho Blue collateral; deadline-aligned Midnight loans.** A permissionless Blue market lending USDC against wrapped conditional-contract positions, priced by an oracle that reads the resolver's mark (e.g. 0/1 after resolution, a model price before). A Midnight market whose maturity equals the contract deadline lets agents lever or finance positions on fixed terms.
7. **Funding-rate and rate contracts.** A resolver reads Boros implied APR or Midnight credit-unit prices at the deadline, e.g. "Will the cbBTC/USDC 3-month fixed rate on Midnight exceed 6%?" Agents hedge on Boros.
8. **Equity-linked contracts on Robinhood Chain or Base.** Resolve on B20 or Robinhood stock-token prices via v4 TWAP or Chainlink total-return feeds. Use Fables-style calendar logic (weekend and after-hours windows) in the resolver to avoid illiquid-hour manipulation.
9. **Deterministic evaluator for agent commerce.** Plug in as the "evaluator" for Virtuals ACP jobs, or for x402-paid services. The resolver program replaces a subjective evaluator agent, and the conditional contract becomes the escrow.
10. **Reinsurance, tranching and parametric covers.** Re ($450M on-chain reinsurance) and Strata (tranching) show demand for structured risk. Code-resolved parametric covers (e.g. "stETH VWAP < 0.99 for more than N blocks" or "protocol X TVL drops >50%") are natural conditional contracts, given how many exploits occurred in 2025–26.

### Most surprising and novel findings (for the report writer)
- **Robinhood Chain**, four months old, out-volumes Base on DEXs ($34.2B vs $30.0B over 30 days). Uniswap v4 is its main AMM, and a memecoin launchpad (Pons) earns $31.7M per 30 days in fees.
- **Base shipped sequencer-native conditional transactions** ("Validity Transactions," Sep 30, 2026): dormant signed transactions that land only when on-chain state criteria are met.
- **Uniswap Labs now runs its own governance-upgradeable hooks.** StablePair uses Dutch-auction fee decay for peg-restoring trades ($3.1B in four weeks). VolatilePair uses asymmetric buy/sell fees.
- **CCA turned token launches into per-block uniform-price auctions** with programmable bid-validation hooks, self-serve since June 2026.
- **The Compact**: an ownerless, cross-chain, ERC-6909 resource-lock contract with pluggable arbiters, essentially a general conditional-escrow primitive.
- **1inch Aqua** made "liquidity that never leaves the LP's wallet" a $3.9B-per-month reality on Ethereum.
- **Morpho Midnight**: signed offer-based fixed-term credit, already distributed by Coinbase. Morpho's total deposits are above $17B, and it is the lending backbone of Coinbase, Robinhood, Circle Arc and Ledger.
- **B20's multiplier model**: corporate actions without rebasing, so AMM liquidity survives splits. It also has issuer seize and pause.
- **Fables**: AMM fees keyed to stock-market calendars.
- **What The Hook**: arbitrage returned to traders and LPs.
- **Boros funding-rate markets on the S&P 500, gold and silver.**
- **Variational**: about $1B open interest in P2P derivatives on Arbitrum, with institution-defined contracts and segregated escrow.
- **Big incumbents are publicly retrenching or fading.** Euler: fees to zero, DAO markets sunset, co-founders gone. Balancer: TVL down to about $38M after the Nov 2025 exploit. Unichain: $30M TVL, ops handed to Optimism. The Zora creator-coin economy has collapsed.
- **Every major protocol now ships an agent interface**: Morpho Agents (CLI/MCP), Aave MCP, Pendle MCP/Skills, Base MCP, Clanker API/SDK and "Droids." All construct unsigned transactions for user wallets rather than holding keys.

### Gaps
- No on-chain data was pulled for manipulation cost (depth at ±2%) of specific pools. Tier rankings above are qualitative and based on volume and TVL.
- Not confirmed whether Morpho Midnight market creation is permissionless, or how its offers are stored and matched (off-chain mempool or router). The docs mention a Router API and "mempool concepts" but the fetched page didn't specify.
- The CCA `IValidationHook` exact signature and the per-block supply schedule were not retrieved (they are in `docs/TechnicalDocumentation.md` in the repo).
- Base Validity Transactions: fees, ordering guarantees, and whether criteria can reference arbitrary contract storage vs predefined condition types are in the Base docs and were not retrieved.
