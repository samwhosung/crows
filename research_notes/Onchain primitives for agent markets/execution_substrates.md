# Execution Substrates for a Permissionless, Agent-Native Protocol of Code-Resolved Conditional Contracts (state as of 2026-10-21)

Research method note: ~40 web searches plus ~25 direct fetches of primary docs. The session's shared web-search budget ran out partway through. Topics covered only by direct doc fetches, or not covered at all, are listed under each section's Gaps. Status tags used below: **[LIVE]** = shipped on mainnet; **[SCHEDULED]** = date set, not yet confirmed active; **[ANNOUNCED]** = planned with no date; **[RESEARCH]** = spec or paper only; **[PAUSED]** = was live, now disabled.

---

## Q1. Ethereum L1 roadmap state in 2026 (Pectra, Fusaka, Glamsterdam, gas limits, zk-relevant precompiles, zkEVM L1, lean Ethereum, native/based rollups, preconfirmations)

### Takeaway
Pectra (May 2025) and Fusaka (Dec 3, 2025) are both live. Between them, L1 now has native BLS12-381 ops, P-256 verification at `0x100`, 8191 historical block hashes stored in state, a 60M default gas limit, and a hard **per-transaction gas cap of 2^24 (16,777,216)**. Glamsterdam (ePBS + Block-Level Access Lists + a `SLOTNUM` opcode + a contract-size increase) went live on Sepolia on Oct 6, 2026 and is scheduled for Hoodi on Oct 26, 2026, with **no mainnet date yet**. Real-time L1 zkEVM proving was declared achieved in Dec 2025. Integrating proofs into consensus is 2026 roadmap work that depends on ePBS, so it is not live.

### Cited Findings
**Pectra [LIVE]**
- Activated at epoch 364032, 07-May-2025 10:05 UTC. Includes EIP-7702 (an EOA can delegate to contract code via a signed authorization), EIP-2537 (BLS12-381 curve-operation precompiles), EIP-2935 (system contract storing recent block hashes beyond `BLOCKHASH`'s 256-block window), EIP-7691 (blob target/max raised from 3/6 to 6/9), EIP-7623 (calldata repricing for data-heavy txs), and EIP-7251 (max effective balance 2048 ETH) — [ethereum.org Pectra](https://ethereum.org/roadmap/pectra/)
- EIP-2935 is Final, with `HISTORY_SERVE_WINDOW = 8191` block hashes at system contract `0x0000F90827F1C53a10cb7A02335B175320002935`. Stated purposes: stateless clients and proofs checking ancestor hashes against current state, and giving rollups longer history than `BLOCKHASH` — [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935). (ethereum.org says "8192"; the EIP spec says 8191, and the spec is authoritative.)

**Fusaka [LIVE since 2025-12-03]**
- "Ethereum's highly anticipated Fusaka upgrade went live on December 3, 2025." The headline is EIP-7594 PeerDAS ("theoretical scale-up of up to 8x for blobs") — [ethereum.org Fusaka](https://ethereum.org/roadmap/fusaka/). Scheduled slot 13,164,544 at 21:49:11 UTC — [Blockworks](https://blockworks.co/news/ethereum-fusaka-dec3-launch)
- Other Fusaka EIPs: 7892 (Blob-Parameter-Only forks, which raise blob target/max between hard forks); 7918 (blob fee reserve price); **7825 (per-transaction gas cap 16,777,216 = 2^24)**; 7823 (MODEXP inputs capped at 8192 bits); 7883 (MODEXP gas raised); 7934 (10 MiB RLP block size cap); **7935 (default gas limit 60M)**; **7917 (deterministic proposer lookahead for the next epoch)**; 7939 (CLZ opcode); **7951 (secp256r1/P-256 precompile at `0x100`, superseding RIP-7212)**; 7910 (`eth_config` RPC) — [ethereum.org Fusaka](https://ethereum.org/roadmap/fusaka/)
- An Ethereum Magicians post confirms the P-256 precompile is "officially live at address 0x100 on Ethereum Mainnet with EIP-7951" — [Ethereum Magicians EIP-7212 thread](https://ethereum-magicians.org/t/eip-7212-precompiled-for-secp256r1-curve-support/14789/122)
- The illustrative BPO schedule on ethereum.org is target 6/max 9 at activation, then BPO1 10/15, then BPO2 14/21. The page itself also says 15/21 for BPO2 and calls the schedule illustrative — [ethereum.org Fusaka](https://ethereum.org/roadmap/fusaka/)

**Gas limit**
- Path: 30M→35M (Feb 2025), 45M (Jul 2025), 60M (late Nov 2025, via validator signaling) — [Cointelegraph](https://cointelegraph.com/news/ethereum-could-get-faster-gas-limit-rise-january); [The Block on 45M](https://www.theblock.co/amp/post/363763/ethereum-hits-45-million-block-gas-limit). A Jan 2026 rise to 80M was floated (Cointelegraph headline) but **not confirmed** in my sources. A Feb 2026 EF roadmap summary targets ">100M" in 2026, and "180M by end of 2026" was discussed. Both are targets, not achieved values (search-summary level, not verified).

**Glamsterdam [SCHEDULED on testnets; mainnet TBD]**
- Meta-EIP-7773 "Scheduled for Inclusion" (SFI) list: 2780 (resource-based intrinsic tx gas), 7688, 7708 (ETH transfers emit a log), **7732 (enshrined PBS)**, 7778 (gas accounting without refunds), **7843 (SLOTNUM opcode)**, **7928 (Block-Level Access Lists)**, **7954 (increase max contract size)**, 7976/7981 (calldata/access-list cost increases), **7997 (deterministic factory contract)**, 8024 (SWAPN/DUPN/EXCHANGE), 8037/8038 (state creation/access gas repricing), 8045, 8061, 8246 (remove SELFDESTRUCT burn), 8282 (builder execution requests). **FOCIL and slot-time reduction are not on the SFI list** — [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773)
- Activation: Sepolia epoch 353024 = **2026-10-06 13:53:36 UTC**; Hoodi epoch 132352 = **2026-10-26 17:42:48 UTC**; mainnet "no date yet" — [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773). Secondary sources say mainnet is expected in Q4 2026 and that the upgrade "has already slipped twice" — [parameter.io](https://parameter.io/ethereums-glamsterdam-testnet-launch-set-for-october-6-amid-builder-attack-concerns/); [Alchemy Glamsterdam guide](https://www.alchemy.com/es/blog/glamsterdam-ethereum-upgrade)
- BALs list every account and storage slot a block touches, which lets nodes execute non-conflicting txs in parallel — [investinglive explainer](https://investinglive.com/education/glamsterdam-in-plain-english-how-ethereum-plans-to-cut-out-the-middlemen-in-block-building/)

**L1 zkEVM / real-time proving**
- EF real-time-proving targets: prove ≥99% of mainnet blocks in ≤10 s on ≈$100k hardware at ≤10 kW, with 128-bit security and proofs ≤300 KB — [EF blog, Jul 2025](https://blog.ethereum.org/2025/07/10/realtime-proving)
- On Dec 18, 2025 the EF declared real-time proving achieved (measured on EthProofs). Focus then shifted to soundness and a strict 128-bit rule — [CryptoSlate](https://cryptoslate.com/ethereum-foundation-refocuses-to-security-over-speed-sets-strict-128-bit-rule-for-2026/)
- The 2026 L1-zkEVM roadmap (Jan 26, 2026) has six themes: ExecutionWitness and guest program; zkVM-guest API standardization; CL integration ("zkAttester" clients verifying proofs during beacon block validation); prover infra (Ethproofs, Ere); benchmarking for gas repricing; formal verification. **ePBS is a critical dependency.** Without ePBS the proof window is 1–2 s; with ePBS it is 6–9 s — [Ethereum Magicians L1-zkEVM Roadmap 2026](https://ethereum-magicians.org/t/l1-zkevm-roadmap-2026-integrating-zkevm-proofs-into-ethereums-core-protocol/27595)
- The plan is that validators eventually verify blocks by checking multiple independent zk proofs instead of re-executing. Adoption starts optional and small — [The Block](https://www.theblock.co/post/362170/ethereum-zkevm-zk-proofs)
- "Lean Ethereum" is Justin Drake's proposed roadmap from July 2025. My source snippet did not give details — [Bankless](https://www.bankless.com/read/ethereums-lean-leaps)

### Inferences
- **The per-tx gas cap of 2^24 ≈ 16.8M gas is a hard ceiling on any single L1 resolution transaction.** Heavy resolvers cannot run on L1 and must be zk-verified (BN254 pairing precompile, or BLS12-381 via EIP-2537). P-256 at `0x100` makes it cheap to verify passkey/WebAuthn signatures and some TEE attestation chains (many hardware attestations use P-256) on L1 and RIP-7212-compatible L2s.
- EIP-2935 gives any L1 contract trustless access to the last 8191 block hashes (~27 h at 12 s slots). An L1 resolver can verify a Merkle-Patricia storage proof of historical L1 state with no oracle: "what was X's balance or oracle value at block N" becomes a deterministic, self-contained resolution input.
- The `SLOTNUM` opcode (Glamsterdam) gives contracts a native slot clock. Deadline logic gets cleaner than `block.timestamp`, which is still 12-s granular on L1.
- EIP-7917 (deterministic proposer lookahead) is the protocol hook based-rollup preconfirmation schemes need: who sequences the next N slots is known in advance.
- Since ePBS is not on mainnet, L1-level zk verification by validators is at least one fork away, probably 2027+. Do not plan on enshrined "native rollup" verification for this protocol.

### Gaps
- Current L1 gas limit as of Oct 2026 (60M confirmed through Fusaka; whether 80M/100M+ was reached was not verified).
- Native rollups (`EXECUTE` precompile) and based-rollup and preconfirmation status (Taiko, etc.): web-search budget exhausted before coverage. Treat as **[RESEARCH]/early** unless verified separately.
- Exact gas cost of the P-256 precompile after the repricing discussed in ACD calls was not retrieved.
- Groth16 verification cost on L1 was not fetched this session. The BN254 pairing pricing formula in [EIP-1108](https://eips.ethereum.org/EIPS/eip-1108) (45,000 + 34,000·k gas for k pairings) implies roughly 200–300k gas per Groth16 verify (from the spec, not re-verified this session).

---

## Q2. L2s and fast EVM chains (Base, Arbitrum/Stylus, Superchain, MegaETH, Monad, Unichain, Abstract, Tempo, Arc, Plasma/Stable, Hyperliquid, Starknet, zkSync, Aztec, Scroll, Linea, Taiko)

### Takeaway
2026 brought large structural shifts. **Base left the OP Stack (Feb 18, 2026)**. **Arbitrum's Security Council paused new Stylus (WASM) activations on Oct 2, 2026** after attacks using hand-crafted WASM. MegaETH (Feb 9, 2026), Tempo (Mar 18, 2026) and Arc (Sep 16, 2026) are all live. Monad runs 300 ms blocks with 600 ms finality. Hyperliquid has become a programmable venue: builder-deployed perps (HIP-3), native outcome markets (HIP-4), and EVM precompiles that read HyperCore state. Superchain interop was still being rolled out as of late Sep 2026.

### Cited Findings
**Base**
- Flashblocks went live July 2025 (built with Flashbots), cutting effective confirmations from 2 s to 200 ms — [The Block](https://theblock.co/news/ecosystems/2025-07-17-coinbase-base-flashblocks-363109)
- Docs: "~200ms" flashblocks; ten build up per 2-s block. The `pending` tag exposes pre-confirmed state for `eth_call`, `eth_getStorageAt`, `eth_getLogs`, `eth_estimateGas`, etc. Pre-confirmed state is available "up to about 1.8 seconds before the block seals." Extra methods: `eth_simulateV1`, `base_transactionStatus`, `newFlashblockTransactions`, `pendingLogs`, `newFlashblocks`. Transactions are "sequencer-ordered" (single sequencer) — [Base docs: Flashblocks](https://docs.base.org/base-chain/flashblocks/apps); [QuickNode guide](https://www.quicknode.com/guides/other-chains/base/flashblocks-in-your-app)
- **Feb 18, 2026: Base announced it is moving off the OP Stack to its own "unified" codebase (base/base).** It stays compatible with the OP Stack spec and RPCs, plans three hard forks (including "Base V1"), and **keeps the sequencer revenue previously shared with Optimism**. OP Labs' CEO said the new stack still shares ~99% of code with OP Stack/Reth/Flashbots. The OP token fell 7–20% — [FXStreet](https://www.fxstreet.com/amp/cryptocurrencies/news/coinbases-base-pivots-away-from-optimism-stack-202602190447); [Unchained](https://unchainedcrypto.com/coinbases-base-shifts-away-from-op-stack-in-major-layer-2-strategy-pivot/); [Whale Alert story](https://whale-alert.io/stories/a08c01394b1245/Base-abandons-OP-Stack-forces-node-migration-and-keeps-sequencer-revenue-OP-plunges-amid-market-chill-etherfi-migrates-to-Optimism)

**Optimism Superchain interop**
- Governance approved "Upgrade 20" on Sep 16, 2026. It moves fault proofs to Super Root Dispute Games, a prerequisite for interop. Testnets (OP Sepolia, Ink Sepolia, Soneium Minato, Unichain Sepolia) were upgraded Sep 17, with mainnet targeted for Sep 24 if a 7-day soak passed. "Upgrade 20 keeps each chain's dispute infrastructure separate," so **it is a prerequisite and does not itself turn interop on** — [CryptoSlate](https://cryptoslate.com/optimism-just-approved-the-upgrade-its-superchain-needs-before-interoperability-can-go-live/)
- Optimism docs: "OP Stack interop is in active development. Some features may be experimental… rolled out iteratively." Security model: per-chain dependency sets with transitive trust and unsafe/safe/finalized levels. If a sequencer equivocates, executing-message blocks are reorged and replaced with deposit-only blocks. Accepting messages that reference unsafe initiating messages gives the lowest latency but adds trust — [Optimism interop explainer](https://docs.optimism.io/interop/explainer)

**Arbitrum (Stylus, Timeboost)**
- Stylus went live on mainnet in Sep 2024 (ArbOS 32). It runs WASM as "a second, coequal virtual machine" next to the EVM, and Solidity and Stylus contracts call each other freely. Rust has a first-class SDK and C/C++ are supported. Max contract size is **96 KB** vs the 24 KB EVM limit. Programs get **up to 8 MB memory** (128 × 64 KB pages default). Execution uses a Wasmer fork. Deployed WASM is fraud-provable via interactive proofs — [Arbitrum Stylus intro](https://docs.arbitrum.io/stylus/gentle-introduction); [Arbitrum blog](https://blog.arbitrum.io/stylus-now-live-one-chain-many-languages/)
- Stylus gas model: 1 gas = 10,000 ink. Call init cost is **8,832 gas uncached / 352 gas cached** plus a dynamic term. Activation is a fixed **1,659,168 gas** plus a data fee scaling with compiled size, paid once per codehash. Memory pricing is "100–500x cheaper" than EVM. Compute is "generally 10–100x cheaper". **SLOAD/SSTORE cost the same as EVM** — [Stylus gas docs](https://docs.arbitrum.io/stylus/concepts/stylus-gas)
- Contracts must be reactivated every 365 days or after a Stylus upgrade, or they become uncallable — [Arbitrum Stylus intro](https://docs.arbitrum.io/stylus/gentle-introduction)
- **[PAUSED] On Oct 2, 2026 the Security Council executed an emergency action.** It set activation gas prohibitively high, so there are no new Stylus activations on Arbitrum One or Nova, including new versions of existing apps. The cause was "sophisticated attacks on hand-crafted WASM programs that bypass the standard Stylus compiler toolchain" that "can degrade chain performance." The known bugs affect liveness, and no fund-theft attack was found. ArbOS 61 renewed existing contracts so none expire before **Aug 20, 2027**. The same action added a BoLD One-Step-Proof guard that lets anyone pause One's settlement on proof of two conflicting valid OSP answers — [Arbitrum forum: Security Council Emergency Action 2/10/2026](https://forum.arbitrum.foundation/t/security-council-emergency-action-2-10-2026/31530) (the title date is DD/MM; the body says Oct 2, 2026)
- The Arbitrum Foundation plans to work with the DAO on "reopening activations while restricting hand-crafted WASM programs." No timeline. Orbit chains are not mentioned — [Arbitrum pause notice](https://docs.arbitrum.io/notices/stylus-activation-pause-notice)
- Tooling: a Hardhat 3 plugin suite for Stylus was released Jul 2026 — [Arbitrum Foundation mid-year recap](https://blog.arbitrum.foundation/builders-block-022-arbitrums-mid-year-recap-new-stylus-hardhat-plugin/)
- Timeboost (express-lane auction): ~$2M in fees in its first 3 months (2025), used for ~20–30% of Arbitrum DEX volume — [The Block](https://www.theblock.co/news/ecosystems/2025-07-04-arbitrum-timeboost-fees-361058). An empirical study of 48.5M express-lane txs and 494k auctions (Jan–Apr 2026) found **3 entities won 99.74% of auctions and ~30% of boosted txs reverted**. It concludes Timeboost misses its fairness, decentralization and spam goals — [Messias & Torres, arXiv 2509.22143](https://arxiv.org/abs/2509.22143). A competing study finds reduced duplication spam and higher DAO revenue — [arXiv 2512.10094](https://arxiv.org/html/2512.10094v2)

**MegaETH [LIVE since 2026-02-09]**
- Public mainnet launched Feb 9, 2026 after a 7-day stress test (35k TPS per Cointelegraph, 55k per Crypto Briefing). Day 1 saw ~39M txs (~28–29 TPS average) with 50+ apps — [Cointelegraph](https://cointelegraph.com/news/megaeth-mainnet-launch-feb-9-after-tests); [The Defiant](https://thedefiant.io/newsletter/defi-daily/megaeth-launches-mainnet)
- **Mini-blocks every ~10 ms, EVM blocks every ~1 s** (~100 mini-blocks per EVM block). Mini-block headers carry **microsecond-resolution timestamps**. Since the "Rex5" upgrade, the **sequencer signs each mini-block header (secp256k1 over keccak256(rlp(header))), verifiable on-chain via `ecrecover`**, with the key registered in `SequencerRegistry` at `0x6342…0006`. Full finality still requires L1 posting. Streamed via `eth_subscribe("miniBlocks")` — [MegaETH docs: mini-blocks](https://docs.megaeth.com/mini-block.md)
- The design is a single centralized active sequencer (target 100k TPS / 10 Ggas/s) with DA on EigenDA — [Aave governance ARFC](https://governance.aave.com/t/arfc-deploy-aave-v3-on-megaeth/21329)

**Monad [LIVE]**
- On **Jul 23, 2026** Monad moved from 400 ms blocks / 800 ms finality to **300 ms blocks / 600 ms deterministic finality** (MonadBFT finalizes in two slots). It has 200+ independent validators in 30+ countries. Design capacity is 10,000 TPS — [Monad blog](https://monad.xyz/blog/300ms-block-times)

**Tempo (Stripe/Paradigm) [LIVE since 2026-03-18]**
- Mainnet went live Mar 18, 2026. Stripe launched the **Machine Payments Protocol (MPP)** alongside it — [Bankless](https://www.bankless.com/es/read/news/stripe-deploys-tempo-blockchain-to-mainnet-introduces-machine-payments-protocol.md)
- Docs: Simplex BFT (Commonware) with "deterministic sub-second finality". Fees are payable in USD stablecoins or sponsored. **Payment lanes** give payments dedicated blockspace. **TIP-20** native stablecoin standard with **32-byte memos** and compliance policies. **Expiring nonces** (validity extended to 5 min in T11) and configurable parallel nonces (T12). Native atomic batching. **Access keys with protocol-enforced spending limits, expiry and call scopes.** Passkeys and weighted multisig. AA "without bundlers, paymasters, or EntryPoint." MPP uses HTTP 402 challenges, supports one-time charges and session-based pay-as-you-go **via payment channels**. No protocol-level scheduled transactions — [Tempo developers](https://tempo.xyz/developers)
- About 0.6 s finality. Validators are permissioned (Stripe, Visa and Zodia were added as external validators in Apr 2026) with plans for permissionless validation (secondary source) — [Everstake](https://everstake.one/resources/blog/what-is-tempo-stripe-and-paradigms-stablecoin-payments-blockchain-explained)

**Arc (Circle) [LIVE since 2026-09-16]**
- Public mainnet opened Sep 16, 2026 with Aave V4, Morpho and Uniswap at launch. Circle plus 11 founding validators (BlackRock, DTCC, ICE, Mastercard, Visa…) run permissioned PoA, with PoS planned by 2027. 10B ARC tokens minted at genesis — [The Block](https://www.theblock.co/news/ecosystems/2026-09-16-circle-launches-arc-mainnet-with-blackrock-and-visa-among-validators-mints-10-billion-arc-tokens-415250); post-quantum signature support — [Forklog](https://forklog.com/en/circle-launches-arc-mainnet-for-institutional-finance/)
- Docs: "Transactions are final in under 1 second". "USDC is the gas token" with **USDC using 18 decimals natively**. A 20 gwei `maxFeePerGas` floor. Targets the Osaka EVM baseline, but runtime behaviors differ (blocklist-reverted transfers produce no receipt, sends to `address(0)` revert) — [Arc docs](https://docs.arc.io/arc/concepts/welcome-to-arc)

**Hyperliquid (HyperCore + HyperEVM)**
- HyperEVM dual blocks: **small blocks every 1 s with a 3M gas limit; big blocks every 1 min with 30M gas**. Separate on-chain mempools; only the next 8 nonces per address are accepted; txs are pruned after 1 day — [Hyperliquid docs: dual-block](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture). (Another copy of the docs says 2 s / 2M for small blocks, so these values change over time.)
- **Read precompiles from `0x…0800`** expose HyperCore perp positions, spot balances, oracle prices, staking delegations and L1 block number, as of EVM block construction. Cost is 2000 + 65·(input_len + output_len) gas. The **CoreWriter** at `0x3333…3333` sends actions to HyperCore, but these are **not atomic**: an action can succeed on EVM and fail on Core with no revert — [Hyperliquid docs: interacting with HyperCore](https://hyperliquid.gitbook.io/Hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore); [Chainstack](https://chainstack.com/hyperliquid-hyperevm-precompiles-corewriter-bridge/)
- HIP-3 (builder-deployed perps) has been live since Oct 13, 2025 and requires a 500k HYPE stake (first 3 markets free, then Dutch auction, deployer keeps 50% of fees) — [Nansen](https://nansen.ai/post/what-is-hip-3-hyperliquid). Builder-deployed open interest was >$2.3B by Apr 2026 and >$62B monthly volume in May 2026. HIP-3 makes up roughly 38–50% of Hyperliquid daily volume, dominated by trade.xyz (equities, oil, commodities) — [The Defiant](https://thedefiant.io/news/defi/builder-deployed-perp-markets-push-hyperliquid-to-record-share-of-global-perps-volume); [BlockEden](https://blockeden.xyz/blog/2026/04/29/hyperliquid-hip3-builder-markets-1b-oi-commodities/)
- **HIP-4 (outcome markets) [LIVE since 2026-05-02]**: fully collateralized 0/1 binaries opened by a ~15-min clearing auction, prices bounded 0.001–0.999, **settled in USDC** (USDH being phased out). Positions share the HyperCore margin account with perps and spot. At launch, resolution used only HyperCore price feeds. From May 25, validators publish canonical markets via automated newsfeed software and **on-chain validator votes govern settlement**, with no external oracle or dispute layer. Builder deployment needs a **1M HYPE** stake. Permissionless "Phase 2" deployment had **not shipped** as of Jun 9, 2026. The network has 24 validators (soon 27). On day 25, HIP-4's BTC market did $2.38M in 24h volume vs Polymarket's $9.46M — [Galaxy Research](https://www.galaxy.com/insights/research/hyperliquid-hip-4-prediction-markets-polymarket-kalshi-analysis)

**Starknet (Cairo)**
- Release page: v0.14.0 (Sep 2025) added a mempool, a fee market, a distributed sequencer architecture and pre-confirmations. v0.14.1 (Dec 2025): BLAKE hashing and adaptive block timing. v0.14.2 (Mar 2026): **Stwo proof verification on Starknet**, L1 finality ~3 h. v0.14.3 (May 2026): fee stabilization (SNIP-35 auto min base fee) and 2× throughput. **v0.15 (Sep 2026): decentralized validation by stakers, L1 finality under 1.5 h.** The page labels every entry "Upcoming features," so shipped status is not explicit — [Starknet version releases](https://www.starknet.io/developers/version-releases/); the 0.14.3 pre-release notes give a mainnet date of Jul 6, 2026 — [Starknet community](https://community.starknet.io/t/starknet-0-14-3-pre-release-notes/116211)

**Aztec (private L2)**
- The "Ignition Chain" (consensus only, no contract execution) launched on Ethereum mainnet in Nov 2025, requiring 200k AZTEC to stake — [Forklog](https://forklog.com/en/aztec-team-launches-private-l2-protocol-on-ethereum-mainnet/). The "Alpha Network" with full private smart-contract execution launched around Apr 1, 2026 after a governance vote (single report) — [ChainCatcher](https://www.chaincatcher.com/en/article/2256006). A token sale in Feb 2026 raised $61M. The roadmap targets 3–4 s blocks by end-2026 — [BlockEden](https://blockeden.xyz/blog/2026/03/13/aztec-network-tge-noir-language-privacy-l2-mainnet/)

### Inferences
- **Stylus was the most natural fit for "WASM resolvers on a general-purpose EVM chain", but it is currently [PAUSED] for new code on Arbitrum One.** The stated reopening direction ("restricting hand-crafted WASM") is in direct tension with a design where anyone uploads an arbitrary WASM resolver. Even before the pause, the per-codehash activation cost (~1.66M gas plus a size fee) and yearly reactivation made "one contract per resolver" unattractive. A more robust pattern on any EVM-family chain is a **single audited interpreter contract** (a WASM, RISC-V or custom-bytecode interpreter) that executes resolver bytecode held as data. That moves metering into your own code, at the cost of interpretive overhead. The other route is a dedicated Arbitrum Orbit chain or L3 where you control the Stylus configuration (not verified whether the pause applies to Orbit).
- MegaETH's **signed, microsecond-timestamped mini-blocks verifiable via `ecrecover`** are an overlooked primitive. A contract can verify that "the sequencer committed tx T at position P at time t". That supports provable latency-ordering disputes, "first-to-take wins" with cryptographic evidence, and slashing the sequencer for equivocation if paired with a bond. No other chain I found exposes this.
- Hyperliquid is the only venue where **contracts can natively read a high-liquidity order book's oracle and position state** (HyperEVM precompiles) and where **native binary outcome markets with on-chain validator settlement** already exist (HIP-4). For "markets referencing markets", HyperCore state is a ready-made reference set. The downsides: 24-validator resolution authority, non-atomic CoreWriter, a 1M HYPE builder stake, and a 3M gas small-block limit.
- Base's exit from the OP Stack means Base may not join Superchain native interop. Cross-chain composability between Base and other OP chains should not be assumed to arrive through Superchain messaging.
- Tempo's protocol-level **access keys** (spending limits, expiry, call scopes) and **expiring and parallel nonces** match what agent wallets need: session-scoped delegation and high-concurrency submission without nonce contention. MPP/x402 payment channels map well to high-frequency small-ticket flows. The validator set is permissioned.

### Gaps
- Unichain (TEE builder, flashblocks), Abstract, Plasma (live: DefiLlama lists $1.29B in stablecoins), Stable (live: $0.02B), Scroll, Linea, Taiko, zkSync (Airbender/ZK Stack): search budget ran out, so no 2026 specs were verified.
- Whether Superchain interop actually went live on mainnet after Sep 24, 2026: no confirmation found.
- Whether Stylus activations are enabled on Arbitrum Orbit chains and Robinhood Chain: not covered.
- Monad mainnet launch date: not verified this session. It is live (Jul 2026 blog, DefiLlama shows $0.70B in stablecoins).
- Aztec network status after Apr 2026: unverified.
- MegaETH per-block gas limits and fees: not retrieved.

---

## Q3. Non-EVM substrates (Solana, Sui, Aptos, NEAR, Cosmos/CosmWasm, ICP, Mina, Flow)

### Takeaway
Solana changed the most in 2026: 100M-CU blocks (Jul 29), **200 ms slots (activated Oct 9)**, 4 KB transactions, BN254-G2 and BLS12-381 syscalls, and **Alpenglow (Votor, ~150 ms finality target) scheduled to activate today, Oct 21, 2026**. Sui offers the richest set of composition and verification primitives: 1,024-op atomic PTBs, native randomness, a native Groth16 verifier, and Nautilus TEE attestation on mainnet. NEAR (yield/resume), ICP (consensus-verified HTTPS outcalls, 40B-instruction calls) and Flow (protocol-native scheduled transactions) each have one capability that is unusual and relevant here.

### Cited Findings
**Solana**
- Agave 4.1 (shipped May 2026): **100M CU blocks** (from 60M), a validator admission ticket (max 2,000 validators, 0.8 SOL/epoch fee once Alpenglow activates), **native syscalls for BN254 G2 and BLS12-381** ("10–20x" cheaper than pure-BPF), XDP networking, and a token program optimized for 95–98% fewer CUs. Agave 4.2 (shipped Aug 2026): **slots 400→200 ms**, blockhash expiry 60→30 s, **max tx size 1232→4096 bytes**, rent cut 90% (phased). Agave 4.3 (Oct 2026): **Alpenglow, target "~150ms" finality vs 12.8 s today**. Agave 4.4 (Nov 2026): sBPFv3-only for new deployments and **max nested CPI depth 4→8**. Agave 4.5 (Dec 2026): 96 accounts per v1 tx (from 64). Durable nonces are slated for deprecation (unscheduled) — [solana.com/upgrades](https://solana.com/upgrades)
- 100M CU went live at epoch 1009, **Jul 29, 2026** (SIMD-0286). **The per-writable-account cap stays at 12M CU per block** — [solana.com 100M CU](https://solana.com/upgrades/100m-cu-blocks)
- "Solana reduced its target slot times to 200 milliseconds at Epoch 1053 on October 9, 2026." Jito's BAM (TEE-based block building on AMD SEV-SNP, mainnet since Sep 25, 2025) tightened auction intervals from 25 to 20 ms. BAM has ~37% of stake (385 validators, 164M SOL, end of epoch 1050) — [Crypto Briefing](https://cryptobriefing.com/jito-bam-upgrade-cuts-bundle-delays/); [Blockworks](https://blockworks.co/news/jito-bam-solana-mainnet). A Feb 2026 figure put BAM at 27.4% of stake (conflicting, unverified).
- Alpenglow mainnet switch was scheduled for **Oct 21, 2026 at ~14:50 UTC** — [Solana Compass](https://solanacompass.com/news/anza-sets-alpenglow-mainnet-date-solanas-consensus-switch-is-scheduled-for-october-21-at-about-1450-utc). **Only Votor (voting/finality) activates. Rotor (Turbine replacement) has no date** — [KuCoin News](https://www.kucoin.com/news/flash/solana-confirms-alpenglow-upgrade-on-october-21). Earlier rumors of a Sep 28 activation were denied — [KuCoin News](https://www.kucoin.com/news/flash/solana-developers-deny-alpenglow-mainnet-activation-on-september-28)

**Sui (Move, object model)**
- PTBs: "up to **1,024 unique operations** in a single execution". All-or-nothing atomicity. Results of earlier commands feed later ones (`Result(i)`, `NestedResult(i,j)`). No loops (loops require a published Move package). Cannot call private or `public(package)` functions — [Sui docs: PTBs](https://docs.sui.io/concepts/transactions/prog-txn-blocks)
- Native on-chain randomness through the `Random` shared object at **`0x8`**, backed by a random-beacon DKG. The compiler **rejects `public` functions taking `Random`**, and docs recommend private `entry` functions plus a two-transaction commit/reveal flow to stop revert-on-lose composition attacks — [Sui docs: randomness](https://docs.sui.io/guides/developer/advanced/randomness-onchain)
- Native **Groth16 verifier** (`sui::groth16`) on **BN254 and BLS12-381**, up to **8 public inputs**. The API does not pin verifying keys, so the contract must pin them — [Sui docs: Groth16](https://docs.sui.io/guides/developer/cryptography/groth16)
- **Nautilus is live on Sui mainnet**: verifiable off-chain computation in TEEs (AWS Nitro Enclaves, plus Marlin-hosted), with Move contracts verifying enclave attestations. It pairs with Seal for attestation-gated key management. The reproducible-build template is unaudited — [Sui blog](https://blog.sui.io/nautilus-tamper-proof-oracles/); [Sui docs: Nautilus](https://docs.sui.io/sui-stack/nautilus/nautilus-overview)
- Mysticeti v2 (announced Nov 6) folds validation into consensus and replaces the Quorum Driver with a Transaction Driver — [CoinCentral](https://coincentral.com/?p=133239). Claimed 390 ms finality in Jan 2026 (secondary, unverified) — [BlockEden](https://blockeden.xyz/es/blog/2026/02/18/sui-blockchain-scalability-improvements-innovations-2026/)

**Aptos (Move, Block-STM)**
- Aptos reports **sub-50 ms block times on mainnet in Dec 2025** (vendor claim) — [Aptos 2025 year in review](https://aptosnetwork.com/currents/2025-year-in-review). Baby Raptr (live since Jun 2025) cut consensus from 6 to 4 hops, improving finality latency by ~100–150 ms — [Aptos Foundation](https://aptosfoundation.org/currents/baby-raptr-lands-on-mainnet). Full Raptr and Zaptos are not confirmed live. Zaptos is a research paper reporting 20k TPS at sub-second latency — [arXiv Zaptos](https://arxiv.org/html/2501.10612v1)

**NEAR (WASM)**
- **Yield/Resume (NEP-519)**: a contract yields a promise, an external service calls back with a payload, and the contract resumes within **200 blocks ("around 2 minutes")**. On timeout the callback runs with a timeout/None input. The resume function is public, so callers must be guarded. State changes must be reverted on timeout or invalid response — [NEAR docs: yield/resume](https://docs.near.org/smart-contracts/anatomy/yield-resume). It has been available since protocol v1.40 (2024) — [NEAR blog](https://docs.near.org/blog/2024-05-30-yield-resume)
- **Shade Agents**: off-chain agents in TEEs. An on-chain contract stores the expected code hash, verifies attestations, and grants signing via **chain signatures (MPC)** across Ethereum, Solana, Bitcoin and others — [NEAR docs: Shade Agents](https://docs.near.org/ai/shade-agents/concepts/framework-overview). Shade Agent Framework 2.0 shipped Feb 23, 2026. NEAR Intents is a solver-based settlement layer — [NEAR docs blog index](https://docs.near.org/blog/overview.md)

**ICP (canisters, WASM)**
- Limits: **40 billion instructions per update call, heartbeat or timer**; 5B per query; 300B per install/upgrade; 100 MiB WASM module; 4 GiB (wasm32) / 6 GiB (wasm64) heap; **500 GiB stable memory** — [ICP docs: resource limits](https://docs.internetcomputer.org/building-apps/canister-management/resource-limits)
- **HTTPS outcalls**: in replicated mode every replica (13 or 34 per subnet) fetches, a transform function normalizes the response, and **≥2/3 must agree**. Non-replicated mode uses a single unverified replica. **Flexible mode** returns a committee's individual responses. Max response is 2,000,000 bytes. Timeouts are 30 s (server) and 60 s (subnet). HTTPS only, public endpoints only, no WebSockets. Legacy pricing is ~20.85B cycles for a 2 MB max on a 13-node subnet; pay-as-you-go v2 is recommended. API keys in canister state are visible to all replicas unless on TEE-enabled subnets — [ICP docs: HTTPS outcalls](https://docs.internetcomputer.org/concepts/https-outcalls.md)

**Flow (Cadence)**
- **Scheduled transactions (Forte upgrade) [LIVE on mainnet]**: contracts register a `TransactionHandler` and call `FlowTransactionScheduler.schedule()` with a future timestamp, an execution-effort limit, fees and data. **High priority = "execution in the first block with the scheduled time, or scheduling fails"** (10× base fee). Medium 5× is best-effort and Low 2× is opportunistic. Fees are paid upfront with no refund. Cancel refunds 50% — [Flow docs: scheduled transactions](https://developers.flow.com/build/cadence/advanced-concepts/scheduled-transactions)

**Cosmos/CosmWasm**
- CosmWasm powered ~100 chains as of late 2024. Funding was cut after Interchain Foundation changes, and Neutron/Atom Accelerator matched a $250k grant (aggregator repost of a Chainwire release) — [Chainwire via aggregator](https://rss.boorghani.com/?p=265538). Neutron acquired 25% of Confio, the CosmWasm developer — [Blockworks](https://blockworks.com/news/neutron-to-acquire-25-of-cosmwasm-developer-confio)

### Inferences
- **Solana's 12M-CU-per-writable-account cap per block is the key constraint for a hot market account.** If many agents take the same market in one 200-ms slot, they contend for one writable account. Shard market state (per-position PDAs) so no single account is write-hot. The CPI depth increase (4→8, Nov 2026) matters directly for "markets referencing markets" via nested CPI.
- Alpenglow's ~150 ms finality target, once live, would make Solana the fastest high-liquidity substrate for *final* (not just pre-confirmed) settlement. As of today it is **[SCHEDULED]** and unconfirmed.
- Sui PTBs are the best native primitive for agent-composed atomic flows such as "take position in market A, use the receipt as collateral in market B, hedge in DeepBook" in one atomic transaction, with no custom router contract.
- NEAR yield/resume is a native "request → wait for external computation/oracle/agent → resume" primitive. That is exactly the asynchronous shape of resolution for resolvers that need off-chain work. It can be combined with Shade-Agent TEE attestation, or a zk proof submitted in the resume call.
- ICP is the only substrate where a contract can **fetch web data under subnet consensus** and run very heavy deterministic WASM (40B instructions per call) natively. Trust rests on ICP subnet honesty (13–34 nodes) and the determinism of the transform. Liquidity and USDC presence are negligible (DefiLlama: ~$4M in stablecoins).
- Flow's scheduled transactions are the only protocol-native deadline trigger I verified with a timing guarantee ("first block at scheduled time or schedule fails"). On every other chain, "resolve at deadline" needs keepers or the first post-deadline caller.

### Gaps
- Firedancer's share of Solana stake in 2026: not found.
- Solana per-transaction CU limit (historically 1.4M CU) in 2026: not re-verified.
- Sui Seal mainnet status, DeepBook v3 and Walrus status: not verified.
- Aptos keyless and on-chain randomness specifics: not retrieved (budget).
- NEAR block time, finality and per-call gas cap (historically 300 Tgas): the docs URL 404'd and was not verified. The yield timeout implies ~0.6 s blocks (200 blocks ≈ 2 min), but another NEAR page says ~4 minutes for the same 200 blocks.
- CosmWasm 2026 chain status, Injective and Neutron metrics: no 2026 data.
- Mina: not covered.

---

## Q4. Which environments can run general-purpose deterministic WASM/RISC-V programs on-chain at reasonable cost, and what are the limits?

### Takeaway
Six candidates exist. **Stylus** (Arbitrum) is EVM-composable WASM, but new activations are paused on One and Nova. **ICP** canisters are WASM with 40B instructions per call, web access, and almost no USDC. **NEAR** is WASM with async yield/resume. **CosmWasm** has fragile ecosystem funding. **Polkadot Hub PolkaVM** (RISC-V) went live Jan 27, 2026 and is immature. **Cartesi** is a RISC-V Linux optimistic rollup with niche adoption. None is a clean "anyone uploads a metered WASM resolver to a USDC-dense chain" platform today. The practical path is zk: run resolvers in a RISC-V zkVM off-chain and verify succinct proofs on a liquid chain.

### Cited Findings
- **Arbitrum Stylus**: WASM, 96 KB contracts, 8 MB memory, 1 gas = 10,000 ink, compute 10–100× cheaper than EVM, storage at EVM price. Activation costs 1,659,168 gas fixed plus a size fee and must be renewed yearly. Fraud-provable. **New activations paused since Oct 2, 2026** — [Stylus gas docs](https://docs.arbitrum.io/stylus/concepts/stylus-gas); [Stylus intro](https://docs.arbitrum.io/stylus/gentle-introduction); [Arbitrum forum](https://forum.arbitrum.foundation/t/security-council-emergency-action-2-10-2026/31530)
- **ICP**: 40B instructions per update call, 4–6 GiB heap, 500 GiB stable memory, 100 MiB modules — [ICP resource limits](https://docs.internetcomputer.org/building-apps/canister-management/resource-limits). HTTPS outcalls with 2/3 replica consensus — [ICP HTTPS outcalls](https://docs.internetcomputer.org/concepts/https-outcalls.md)
- **NEAR**: WASM contracts with yield/resume up to 200 blocks — [NEAR yield/resume](https://docs.near.org/smart-contracts/anatomy/yield-resume)
- **Polkadot Hub (Revive)**: smart contracts released **Jan 27, 2026**. A dual-backend VM runs EVM and PVM (PolkaVM, RISC-V-based), and the two interoperate; Solidity and Rust are supported. Known issues at launch: legacy-tx gas model mismatch, missing receipts without archive indexing, broken Foundry verification. "Initial release focuses on correctness and reliability" — [Polkadot forum](https://forum.polkadot.network/t/release-of-smart-contracts-on-polkadot/16848); [Parity](https://www.parity.io/blog/what-is-polkadot-hub). ink! v6 targets PolkaVM (proponent claim) — [Polkassembly ref 1796](https://polkadot.polkassembly.io/referenda/1796)
- **Cartesi**: a deterministic RISC-V machine booting Linux, run as an optimistic rollup on Ethereum with an on-chain Solidity step function. Permissionless dispute via PRT/"Dave" tournaments. The Honeypot app is on mainnet. Sources are low-quality aggregators, so verify — [Plisio](https://plisio.net/de/crypto/cartesi-ctsi)
- **CosmWasm**: ~100 chains (late 2024), with constrained funding — [Chainwire via aggregator](https://rss.boorghani.com/?p=265538)
- **Ethereum L1** caps any tx at 16,777,216 gas (EIP-7825) — [ethereum.org Fusaka](https://ethereum.org/roadmap/fusaka/)
- **Verification precompiles and syscalls available for the zk route**: L1 BN254 pairing (EIP-1108 era) and BLS12-381 (EIP-2537, Pectra) — [ethereum.org Pectra](https://ethereum.org/roadmap/pectra/); Solana BN254 G2 and BLS12-381 syscalls (Agave 4.1) — [solana.com/upgrades](https://solana.com/upgrades); Sui native Groth16 on BN254/BLS12-381 with ≤8 public inputs — [Sui Groth16](https://docs.sui.io/guides/developer/cryptography/groth16); Starknet verifies Stwo proofs (v0.14.2) — [Starknet releases](https://www.starknet.io/developers/version-releases/)

### Inferences
- Recommended resolver architecture across substrates: **resolver = RISC-V ELF (Rust → riscv32im) committed by hash; execution off-chain in a zkVM; on-chain contract verifies a Groth16/PLONK-wrapped proof whose public inputs = (resolver hash, input commitment, outcome)**. Any of L1, Base, Arbitrum, Solana, Sui or Hyperliquid can host the verifier. Sui's 8-public-input limit is fine if inputs are hashed into one commitment. The "WASM" design goal becomes "deterministic guest program", and WASM can still be the authoring target if compiled or interpreted inside the zkVM guest.
- For **light** resolvers that must run on-chain (synchronous, no prover latency), an in-contract interpreter with your own metering beats per-resolver native deployment. Stylus would host such an interpreter efficiently once activations resume, because one audited interpreter contract is not "hand-crafted WASM per market". On Solana, a BPF-hosted interpreter is bounded by per-tx CU limits.
- ICP is the strongest pure "heavy deterministic compute + web fetch on-chain" engine, but it would have to act as a resolver coprocessor whose outcome is signed by threshold-ECDSA/Schnorr and verified on the settlement chain. That adds ICP subnet trust.

### Gaps
- Exact zkVM proving costs and latencies in Oct 2026 (SP1, RISC Zero/Boundless, Airbender, OpenVM, Jolt) and on-chain verify gas on L2s: not retrieved (search budget exhausted).
- Polkadot Hub PolkaVM gas/weight limits and Cartesi primary-source specs: not retrieved.
- Whether Stylus activations work on non-Arbitrum-One Orbit chains: unknown.

---

## Q5. Interop and cross-chain composability (ERC-7683, Superchain interop, LayerZero, Hyperlane, Wormhole, CCIP, Polymer, Espresso, AggLayer, chain abstraction). Can a resolver on chain A read chain B trustlessly?

### Takeaway
Native, trust-minimized cross-chain reads remain weak in Oct 2026. Superchain interop is still rolling out, and Base, the largest OP chain, has left the OP Stack. ERC-7683 is still a Draft that was rewritten into a solver-facing "resolver" interface. Production cross-chain reads mostly use event or storage proofs from Polymer, Herodotus and Espresso-style finality layers, or messaging bridges, each with its own trust assumptions. For a resolver on chain A to read chain B trustlessly, the clean path is a zk light-client or storage proof verified on A. Within a single L1, EIP-2935 already provides this for 8191 blocks of history.

### Cited Findings
- **ERC-7683: still Draft.** The current text "defines a solver-facing interface for intent protocols": protocols expose opaque orders plus a **resolver contract** that converts them into steps, variables, payments and named assumptions. It replaced the earlier `IOriginSettler`/`IDestinationSettler` design. It requires EIP-7930 (interoperable addresses) — [EIP-7683](https://eips.ethereum.org/EIPS/eip-7683)
- **Superchain interop**: in development and rolling out iteratively. Transitive dependency sets, with equivocation causing reorgs to deposit-only blocks — [Optimism docs](https://docs.optimism.io/interop/explainer); Upgrade 20 was a prerequisite with a mainnet target of Sep 24, 2026 — [CryptoSlate](https://cryptoslate.com/optimism-just-approved-the-upgrade-its-superchain-needs-before-interoperability-can-go-live/)
- **Base left the OP Stack** (Feb 2026) — [Unchained](https://unchainedcrypto.com/coinbases-base-shifts-away-from-op-stack-in-major-layer-2-strategy-pivot/)
- **Polymer** provides "event proofs" via a Prove API (an MCP server exists for AI agents), with security from IBC light-client proofs — [Polymer MCP README](https://app.unpkg.com/@polymerdao/mcp-polymer@0.2.5/files/README.md); [Eco docs: Polymer prover](https://docs.eco.com/routes/architecture/provers/polymer.md)
- **Espresso**: a "common finality layer". Connected chains keep their own sequencers, Espresso PoS finalizes their output, and zk proofs let other chains verify that finality. Users: Offchain Labs (Arbitrum), Celo, ApeChain, Morph, Rari Chain, LitVM. "Fast finality on Mainnet today" with no latency number — [Espresso docs](https://docs.espressosys.com)
- **Herodotus Storage Proof API**: an HTTP API that generates storage proofs, priced by resource usage. Supported chains and latency were not stated on the page fetched — [Herodotus docs](https://docs.herodotus.dev/herodotus-docs/developers/storage-proof-api)
- **NEAR chain signatures** let a NEAR contract (or a TEE agent it authorizes) sign transactions on Ethereum, Solana and Bitcoin. NEAR Intents is a cross-chain solver settlement layer — [NEAR Shade Agents docs](https://docs.near.org/ai/shade-agents/concepts/framework-overview)
- **Ethereum EIP-2935** keeps 8191 block hashes in state for proof verification — [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935)

### Inferences
- "Markets referencing markets" works best **inside one execution domain** (synchronous, atomic). Across chains it degrades to asynchronous message passing with each bridge's trust model and minutes-to-hours latency to true L1 finality (Starknet L1 finality ~1.5–3 h; optimistic rollups up to 7 days for withdrawals).
- The rewritten ERC-7683 "resolver contract" concept lines up with the protocol: an order format plus an on-chain resolver that canonicalizes it. Aligning the conditional-contract format with ERC-7683 could make positions fillable by existing intent solvers.
- Practical cross-chain resolver inputs today: (a) zk storage or event proofs (Polymer, Herodotus) verified on the settlement chain; (b) Espresso finality certificates for supported chains; (c) a NEAR or ICP threshold-signed attestation. Each adds a dependency to document in the market's resolver metadata.

### Gaps
- LayerZero, Hyperlane, Wormhole, CCIP and AggLayer 2026 status, fees and latency: not retrieved (search budget exhausted).
- Polymer storage proofs (vs event proofs) and the list of supported chains: not confirmed.
- No benchmark found for zk light-client verification cost of Solana or Hyperliquid state on an EVM chain.

---

## Q6. Timing and ordering: block times, finality, preconfirmations, sequencer centralization, MEV; which give atomic resolution-with-outcome or fair ordering?

### Takeaway
Sub-second pre-confirmation is now standard: MegaETH ~10 ms, Base 200 ms, Solana 200 ms slots, Monad 300 ms, HyperEVM 1 s. Sub-second *finality* is available on Monad (600 ms), Arc (<1 s), Tempo (sub-second BFT), and Solana once Alpenglow activates (~150 ms target). Most fast EVM L2s rely on a **single centralized sequencer**. **No major substrate offers verifiable fair ordering**: Arbitrum Timeboost is an auction dominated by 3 entities, and Solana's BAM uses TEEs, which are a trust assumption. Atomic "resolve and pay out in the same transaction" is native to every substrate. What differs is whether the outcome *input* is native: HyperCore prices on Hyperliquid, randomness on Sui, historical state on L1.

### Cited Findings
| Substrate | Block / pre-conf | Finality | Sequencing / ordering | Source |
|---|---|---|---|---|
| Ethereum L1 | 12 s slots; ePBS not live (Glamsterdam SFI) | (not re-verified) | PBS via relays; proposer lookahead deterministic (EIP-7917) | [Fusaka](https://ethereum.org/roadmap/fusaka/), [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773) |
| Base | 2 s blocks, 200 ms Flashblocks | L1-dependent | single sequencer; own stack since 2026 | [Base docs](https://docs.base.org/base-chain/flashblocks/apps) |
| Arbitrum One | (not retrieved) | L1-dependent (BoLD) | Timeboost: 3 entities won 99.74% of auctions; ~30% of boosted txs revert | [arXiv 2509.22143](https://arxiv.org/abs/2509.22143) |
| MegaETH | ~10 ms mini-blocks (signed, µs timestamps), ~1 s EVM blocks | L1 posting via EigenDA | single sequencer | [MegaETH docs](https://docs.megaeth.com/mini-block.md), [Aave ARFC](https://governance.aave.com/t/arfc-deploy-aave-v3-on-megaeth/21329) |
| Monad | 300 ms | 600 ms deterministic | 200+ validators, MonadBFT | [Monad blog](https://monad.xyz/blog/300ms-block-times) |
| Solana | 200 ms slots (since Oct 9, 2026) | 12.8 s today → ~150 ms target (Alpenglow Votor, scheduled Oct 21, 2026) | leader rotation; BAM TEE builder ~37% of stake | [solana.com/upgrades](https://solana.com/upgrades), [Crypto Briefing](https://cryptobriefing.com/jito-bam-upgrade-cuts-bundle-delays/) |
| HyperEVM | 1 s small (3M gas) / 1 min big (30M gas) | HyperBFT (24 validators) | on-chain mempool, next 8 nonces only | [HL docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/dual-block-architecture), [Galaxy](https://www.galaxy.com/insights/research/hyperliquid-hip-4-prediction-markets-polymarket-kalshi-analysis) |
| Tempo | (not stated) | deterministic sub-second (Simplex BFT; ~0.6 s secondary) | permissioned validators; payment lanes | [Tempo docs](https://tempo.xyz/developers), [Everstake](https://everstake.one/resources/blog/what-is-tempo-stripe-and-paradigms-stablecoin-payments-blockchain-explained) |
| Arc | (not stated) | <1 s | permissioned PoA (Circle + 11) | [Arc docs](https://docs.arc.io/arc/concepts/welcome-to-arc), [The Block](https://www.theblock.co/news/ecosystems/2026-09-16-circle-launches-arc-mainnet-with-blackrock-and-visa-among-validators-mints-10-billion-arc-tokens-415250) |
| Sui | — | ~390 ms claimed (secondary) | Mysticeti v2 | [BlockEden](https://blockeden.xyz/es/blog/2026/02/18/sui-blockchain-scalability-improvements-innovations-2026/) |
| Aptos | <50 ms blocks claimed | sub-second | Baby Raptr | [Aptos](https://aptosnetwork.com/currents/2025-year-in-review) |
| Starknet | adaptive (v0.14.1) | L1: ~3 h (v0.14.2) → <1.5 h (v0.15) | distributed sequencers (v0.14.0); staker validation (v0.15) | [Starknet releases](https://www.starknet.io/developers/version-releases/) |
| Flow | — | — | protocol scheduler executes High-priority txs in first block at the scheduled time | [Flow docs](https://developers.flow.com/build/cadence/advanced-concepts/scheduled-transactions) |

- Sui randomness: the docs warn of revert-on-lose composition attacks and require private `entry` functions or a two-tx commit/reveal — [Sui docs](https://docs.sui.io/guides/developer/advanced/randomness-onchain)
- Optimism interop: accepting unsafe initiating messages lowers latency but adds trust, and equivocation causes reorgs — [Optimism docs](https://docs.optimism.io/interop/explainer)

### Inferences
- **Settlement-timing exploits** (taking a position after the outcome is knowable but before the deadline closes) are bounded by the gap between "the outcome is observable off-chain" and "the deadline is enforced on-chain". Mitigations by substrate: (1) deadlines expressed in **block or slot number** (`SLOTNUM` on L1 after Glamsterdam; slot on Solana) rather than wall-clock; (2) a mandatory **pre-deadline lockout window** sized to the substrate's pre-conf-to-finality gap (e.g., ≥1.8 s on Base where pre-confs lead sealing by up to 1.8 s; ≥12.8 s on Solana until Alpenglow is live); (3) **commit/reveal takes** (two-tx, as Sui recommends for randomness); (4) on MegaETH, use the **signed mini-block timestamp** as cryptographic evidence of when a take was sequenced.
- **Front-running** of takes is structural on single-sequencer L2s (the sequencer sees everything) and on auction-ordered Arbitrum. The only substrate-level mitigations found are TEE ordering (Solana BAM, Unichain-style builders, not verified) and privacy (Aztec private contracts). Protocol-level batch auctions per block or slot (uniform clearing price) are substrate-independent, and HIP-4 uses this pattern itself (15-min opening clearing auction).
- "Atomic resolution with outcome" is only *native* where the outcome data lives in the same state machine: HyperCore prices via HyperEVM precompiles, Sui randomness, L1 historical state via EIP-2935. Everything else needs an oracle, a proof, or an attestation.

### Gaps
- Arbitrum block time and Base, Unichain and MegaETH sequencer decentralization status in 2026: not retrieved.
- Quantitative MEV-on-L2 data for 2026 beyond Timeboost: not retrieved.
- Whether Alpenglow Votor actually activated at ~14:50 UTC on Oct 21, 2026: not confirmable at writing time.

---

## Q7. Where are agents and USDC liquidity actually concentrated in 2026?

### Takeaway
Stablecoin supply in Oct 2026 is dominated by Ethereum ($143B) and Tron ($94B). Among fast execution venues, **Solana ($15.7B) leads, then Hyperliquid L1 ($7.0B), then Base ($5.1B)**, with Arbitrum at $3.5B. The new payment chains (Arc $0.77B, Tempo $0.72B, Plasma $1.29B) are still small. On **x402 agent-payment activity, Solana overtook Base in Aug 2026** (~70% of monthly volume, >90% of transactions in the last week of Aug). Total x402 activity has declined since 2025, and the measurements are noisy.

### Cited Findings
- DefiLlama (fetched Oct 21, 2026), peggedUSD stablecoin supply: Ethereum **$143.00B**, Tron **$94.11B**, Solana **$15.65B**, BSC $13.10B, **Hyperliquid L1 $7.02B**, **Base $5.08B**, Arbitrum $3.54B, Polygon $2.83B, X Layer $1.49B, Avalanche $1.33B, Plasma $1.29B, Robinhood Chain $1.06B, Aptos $0.95B, Arc $0.77B, Tempo $0.72B, Monad $0.70B, Sui $0.55B, Starknet $0.15B, NEAR $0.13B, Stable $0.02B, MegaETH $0.02B, ICP $0.004B — [DefiLlama stablecoin chains API](https://stablecoins.llama.fi/stablecoinchains)
- USDC by chain on Jun 30, 2026: Ethereum ~$47.4B, Solana $7.8B, **HyperEVM $5.4B**, Base $4.2B — [Dune blog](https://dune.com/blog/behavioral-map-of-stablecoins)
- Solana stablecoin supply was $16.7B on Aug 9, 2026, ~75–80% of it USDC (Artemis) — [Solana Compass](https://solanacompass.com/news/solana-stablecoin-supply-reaches-167b-growing-11x-in-three-years-to-rank-third-globally)
- x402: mid-Aug 2026, Solana had ~70% of monthly x402 volume (~$24.24M over 30 days, per x402scan) — [Crypto Briefing](https://cryptobriefing.com/solana-x402-market-share-dominance/). Solana passed Base in daily x402 tx count for the first time since January, partly because BlockRun's AI gateway routes through Solana — [Crypto Briefing](https://cryptobriefing.com/solana-surpasses-base-x402-transactions/). In the last week of Aug, Solana handled >90% of x402 txs (Artemis) — [CoinTurk](https://en.coin-turk.com/solana-overtakes-base-with-90yuzde-share-in-x402-transaction-volume-and-count/). Volume estimates "vary widely, suggesting some measurement challenges or non-organic activity", and x402 activity has declined since 2025 — [Pluang citing Crypto Briefing](https://pluang.com/en/news-feed/solana-kuasai-pangsa-pasar-x402-saat-volume-transaksi-menurun)
- Hyperliquid derivatives: HIP-3 builder markets drive 38–50% of HL daily volume, with >$62B monthly in May 2026 — [The Defiant](https://thedefiant.io/news/defi/builder-deployed-perp-markets-push-hyperliquid-to-record-share-of-global-perps-volume)

### Inferences
- For an agent-dense, USDC-settled, small-ticket protocol, the liquidity and agent-traffic case points to **Solana first, Base second, Hyperliquid as a specialist venue** (deep USDC and native trading state, but more closed). Base's lead in x402 has eroded. Its advantages now are Coinbase distribution, EVM tooling and Flashblocks, not dominant agent payment volume.
- x402's total dollar volume (tens of millions per month) is small next to stablecoin float. Being where USDC float and trading agents already sit matters more than being where x402 originated.
- Arc and Tempo are stablecoin-native (USDC or stablecoin gas, sub-second finality, protocol-level payment features) but have <$1B in float each and permissioned validators. They are good second deployments or settlement rails, not the primary liquidity venue in 2026.

### Gaps
- Agent-count metrics by chain (number of active AI-agent wallets) were not found from reliable sources.
- DefiLlama's chain labels (e.g., "Hyperliquid L1" covers HyperCore + HyperEVM) were not broken down.
- No Oct 2026 x402 snapshot; latest data is late Aug to mid-Sep 2026.

---

## Q8. Synthesis: fit-for-protocol trade-offs and overlooked chain-level capabilities that enable new market types

### Takeaway
No single substrate is best on all axes. Ranking for this protocol: **Solana** (USDC and agent density, 200 ms slots, imminent ~150 ms finality, BN254/BLS12-381 syscalls, CPI depth going to 8) and **Base** (EVM, Flashblocks, Coinbase/x402 distribution) are the primary candidates. **Hyperliquid** is the specialist venue for markets that reference trading state. **Sui** is the composability and verification-primitive leader with thin liquidity. Off-chain RISC-V zkVM resolvers with on-chain proof verification are the portable resolver strategy. On-chain WASM (Stylus) is currently blocked for user-supplied code on Arbitrum One.

### Cited Findings
Overlooked or underused chain-level capabilities (each verified above):
1. **HyperEVM read precompiles (`0x…0800`)**: contracts read HyperCore perp positions, oracle prices and balances for 2000 + 65·bytes gas — [Hyperliquid docs](https://hyperliquid.gitbook.io/Hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore). **HIP-4** has native 0/1 outcome contracts with validator-voted settlement and a shared margin account with perps — [Galaxy](https://www.galaxy.com/insights/research/hyperliquid-hip-4-prediction-markets-polymarket-kalshi-analysis)
2. **MegaETH signed mini-blocks** (10 ms, µs timestamps, `ecrecover`-verifiable sequencer commitment) — [MegaETH docs](https://docs.megaeth.com/mini-block.md)
3. **Flow protocol-native scheduled transactions** with "first block at scheduled time or fail" (High priority) — [Flow docs](https://developers.flow.com/build/cadence/advanced-concepts/scheduled-transactions)
4. **NEAR yield/resume** (contract waits ≤200 blocks for an external result) plus **Shade Agents** (TEE code-hash attestation, then MPC chain signatures) — [NEAR yield/resume](https://docs.near.org/smart-contracts/anatomy/yield-resume); [Shade Agents](https://docs.near.org/ai/shade-agents/concepts/framework-overview)
5. **ICP HTTPS outcalls under 2/3 replica consensus**, including a "flexible" mode returning multiple independent responses, plus 40B-instruction calls — [ICP outcalls](https://docs.internetcomputer.org/concepts/https-outcalls.md); [ICP limits](https://docs.internetcomputer.org/building-apps/canister-management/resource-limits)
6. **Sui**: 1,024-op atomic PTBs; native randomness (`0x8`); native Groth16 (BN254/BLS12-381); **Nautilus TEE attestation verified in Move on mainnet** — [PTBs](https://docs.sui.io/concepts/transactions/prog-txn-blocks); [randomness](https://docs.sui.io/guides/developer/advanced/randomness-onchain); [Groth16](https://docs.sui.io/guides/developer/cryptography/groth16); [Nautilus](https://blog.sui.io/nautilus-tamper-proof-oracles/)
7. **Ethereum L1**: EIP-2935 (8191 historical block hashes in state) — [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935); P-256 at `0x100` and EIP-7917 proposer lookahead — [Fusaka](https://ethereum.org/roadmap/fusaka/); `SLOTNUM`, BALs, ePBS and deterministic factory (Glamsterdam, pending) — [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773)
8. **Solana**: BN254-G2 and BLS12-381 syscalls; 4 KB txs; CPI depth 8 (Nov 2026) — [solana.com/upgrades](https://solana.com/upgrades)
9. **Tempo**: protocol-enforced access keys (spending limit, expiry, call scope), expiring and parallel nonces, payment lanes, MPP payment-channel sessions — [Tempo docs](https://tempo.xyz/developers)
10. **Arc**: USDC as native gas (18 decimals), <1 s finality — [Arc docs](https://docs.arc.io/arc/concepts/welcome-to-arc)
11. **Aztec**: private smart-contract execution (Alpha Network, ~Apr 2026, single report) — [ChainCatcher](https://www.chaincatcher.com/en/article/2256006)
12. **Stylus**: 8 MB memory and 10–100× cheaper compute once activations resume — [Stylus gas](https://docs.arbitrum.io/stylus/concepts/stylus-gas); paused — [Arbitrum forum](https://forum.arbitrum.foundation/t/security-council-emergency-action-2-10-2026/31530)

### Inferences
**Fit matrix (inference from the findings above; H/M/L = high/medium/low fit for this protocol)**

| Criterion | Solana | Base | Arbitrum | Hyperliquid | Sui | MegaETH | Monad | Tempo/Arc | NEAR | ICP |
|---|---|---|---|---|---|---|---|---|---|---|
| USDC float (Oct 2026) | H ($15.7B) | M-H ($5.1B) | M ($3.5B) | H ($7.0B) | L ($0.55B) | L | L ($0.7B) | L (<$1B each) | L | ~0 |
| Agent / x402 traffic | H (lead since Aug 2026) | M-H | L-M | M (trading bots) | L | L | L | Tempo: MPP-native | M (Shade/Intents) | L |
| Latency (pre-conf / finality) | 200 ms / ~150 ms target | 200 ms / L1 | ? / L1 | 1 s / BFT | ~390 ms claimed | 10 ms / L1 | 300 / 600 ms | sub-second | ~0.6 s blocks (inferred) | seconds |
| On-chain general compute | M (CU-bounded) | L (EVM) | H but **paused** | L (3M-gas small blocks) | M (Move) | M (EVM) | M (EVM) | L (EVM) | H (WASM) | **H** (40B instr) |
| zk verify primitives | BN254 + BLS12-381 syscalls | EVM precompiles (assumed RIP-7212) | EVM + Stylus | EVM | native Groth16 | EVM | EVM | EVM (Osaka) | WASM | WASM |
| In-domain composability | H (CPI → 8) | H (EVM) | H | H with native trading state | **H** (PTBs) | H | H | M | async only | async only |
| Ordering fairness | TEE (BAM) | single sequencer | Timeboost auction | validator set | consensus | single sequencer, signed | BFT | permissioned | — | — |
| Decentralization of resolution venue | H | M (centralized sequencer) | M | L-M (24 validators) | H | L | H | L (permissioned) | H | M |

**Recommendation-oriented trade-offs**
- **Primary deployment: Solana or Base, abstracted so both are possible.** Solana wins on USDC, agent traffic and timing once Alpenglow is live. It costs a non-EVM rewrite (Rust/Anchor, which suits the user's background) and needs careful account sharding because of the 12M-CU writable-account cap. Base wins on EVM ecosystem, Flashblocks UX and Coinbase distribution, but has a single sequencer and its own stack (no Superchain interop guarantee).
- **Resolver execution: go zk-first and substrate-portable.** Author resolvers as deterministic Rust compiled to RISC-V (or WASM run inside a zkVM guest). The commitment is the program hash. Verify proofs with Groth16 on whatever chain hosts the market. That sidesteps the Stylus pause, the L1 2^24 gas cap and Solana's CU limits, and lets one resolver serve markets on multiple chains. For trivially cheap resolvers ("price feed X > K at slot S"), use a native, audited on-chain evaluator.
- **Hyperliquid as specialist venue** for markets whose resolvers reference trading state (perp prices, funding, OI). Precompile reads make those resolvers oracle-free. HIP-4 competes and complements: binaries settled by validator vote, with permissionless deployment not yet shipped as of Jun 2026, so a code-resolved alternative has room.
- **Time and ordering defenses are protocol-level, not substrate-level.** Use slot or block deadlines, lockout windows sized to each chain's pre-conf-to-finality gap, commit-reveal or batch-auction takes, and (on MegaETH) signed-mini-block evidence.
- **New market types the overlooked capabilities enable:**
  - **Web-fact markets resolved by consensus HTTP** (ICP outcalls), with the outcome threshold-signed to the settlement chain.
  - **Agent-task markets** resolved by **TEE attestation of a code hash** (Sui Nautilus / NEAR Shade) or by zk proof: "agent X produced output satisfying predicate P".
  - **Latency and ordering markets** on MegaETH: bets on sequencing outcomes, with signed mini-block headers as resolution evidence.
  - **Self-executing deadline markets** on Flow (protocol scheduler), with no keeper risk.
  - **Historical-state markets** on L1 via EIP-2935 storage proofs ("was X true at block N"), fully trustless within ~27 h of history.
  - **Private-take markets** on Aztec, which reduces front-running of informed takers.
  - **Randomness-resolved markets** on Sui (`0x8`), with mandatory two-tx commit/reveal.
  - **Perp-state-referencing markets** on HyperEVM with no external oracle.

### Gaps
- Fee-level comparisons (USD cost of a typical take or resolve tx on Solana, Base, Monad, MegaETH, Sui, Tempo or Arc in Oct 2026) were not retrieved because the search budget ran out. These should be measured directly before committing.
- zkVM proving cost and latency per resolver (needed to size the "heavy resolver" path) is not covered here.
- Unichain, Abstract, zkSync, Scroll, Linea, Taiko, LayerZero, CCIP, Hyperlane, Wormhole and AggLayer have no verified 2026 data in these notes.
