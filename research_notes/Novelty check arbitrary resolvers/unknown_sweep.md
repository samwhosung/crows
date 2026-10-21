# Unknown-projects sweep: code-resolved conditional contracts

As-of: 2026-10-21. Scope: projects NOT in the named-venue list (Sapience, Truemarkets, Opinion, predict.fun, Rain, HIP-4, Drift BET, Azuro, Seer, Omen, Zeitgeist, Hedgehog, Thales, Limitless, Myriad, Manifold, Gensyn Delphi, Polymarket V2).

Full-match test: (1) permissionless creation, (2) creator-supplied resolution code / arbitrary resolver address, (3) two-sided escrowed stakes, (4) permissionless trigger, decided by that code.

Status legend: [V] verified from primary source (repo / contract / on-chain call / official docs); [U] unverified or secondary only.

---

## Method log

- WebSearch: worked (tried once at start; returned results).
- DefiLlama: `https://api.llama.fi/protocols` downloaded 2026-10-21 (8,784 protocols; 135 in "Prediction Market").
- On-chain reads: public RPCs (publicnode) via a small eth_call helper.
- Parallel sub-sweeps: GitHub API; hackathons + ethresear.ch/Magicians; Alkahest + Boundless/Succinct + zkpoex.

---

## Findings (working notes)

### Ante Finance ("Smart Tests for Smart Contracts") -- strongest older prior art [V]
- Repo: https://github.com/antefinance/ante-v06-core (1 star, last push 2023-02-06); v0.5: https://github.com/antefinance/ante-v05-core; community tests repo (35 stars, last push 2024-04-29).
- Docs index labels it "Deprecated: Ante Finance (v0.6)" (https://docs.ante.finance/ante/llms.txt). Site copyright 2021-2023.
- Mechanism (from `AntePoolLogic.sol`, `AntePoolFactory.sol`):
  - Anyone deploys an `AnteTest` contract (arbitrary Solidity implementing `checkTestPasses()`) and calls `AntePoolFactory.createPool(...)`. Only constraint: staking token must be on an owner-controlled allowlist (`AntePoolFactoryController.isTokenAllowed`). -> (1) yes, (2) yes.
  - Two sides escrowed in the pool: stakers ("supporters") `stake()` with lock commitment; challengers `registerChallenge()` then `confirmChallenge()` after `CHALLENGER_BLOCK_DELAY = 12` blocks. Challengers pay continuous "decay" to stakers/test author (premium). -> (3) yes (asymmetric: insurance-like, payout floor ratio).
  - `checkTest()` / `checkTestWithState(bytes)` callable by any confirmed challenger (factory requires `claimableShares > 0`); if `checkTestPasses()` returns false, pool locks and challengers `claim()` staker funds (5% bonus to the caller who triggered failure). -> (4) yes, but gated to "anyone who has challenged".
  - No deadline / expiry: tests are perpetual invariants; there is no "resolve YES at deadline" path. Test must pass at pool creation.
- On-chain (eth_call `numPools()` on v0.6 factories, 2026-10-21): Ethereum 0x89E583A67B5FA1B39b8CE7E77654071c3a34cc48 = 37 pools; Arbitrum 0x1A53b3500216D547186C833c35F39a82053B7223 = 10; Optimism 0x4f2be0244146b4408154504a481c799ba1a9a355 = 8. zkSync factory also listed in docs. DefiLlama still lists ~$0.5M TVL (likely stale/locked).
- Verdict: near-full match (1, 2, 3, 4) for the "invariant that may break" shape, but no deadline, asymmetric premium/decay economics, token allowlist, deprecated.

### Opium Protocol v2 -- older derivatives framework with arbitrary oracle + payout-logic contracts [V]
- Repo: https://github.com/OpiumProtocol/opium-protocol-v2 (9 stars, last push 2022-12-12); v1: https://github.com/OpiumProtocol/opium-contracts (37 stars, 2023-03). DefiLlama "Opium" (Options) ~$76k TVL.
- `Core.create(Derivative, amount, [buyer, seller])` has no allowlist on `syntheticId` or `oracleId`: checks are `block.timestamp < endTime`, protocol not paused, and `IDerivativeLogic(syntheticId).validateInput(...)`. Caller posts buyer+seller margin; LONG/SHORT ERC-20s minted to the two owners. -> (1) yes, (3) yes (margin escrowed in Core's p2p vault for both legs).
- `Derivative` struct = margin, endTime, params, oracleId, token, syntheticId. So "stake + resolver + deadline" maps 1:1 onto Opium's derivative hash.
- `OracleAggregator.__callback(timestamp, data)`: ANY contract can push data for itself once per timestamp (keyed by msg.sender). So the oracleId is a creator-chosen arbitrary contract; `syntheticId.getExecutionPayout(...)` is creator-chosen arbitrary payout code. -> (2) yes.
- (4): execution after endTime by position holders (third-party execution if `thirdpartyExecutionAllowed`); whether the oracle push is permissionless depends on the oracleId contract the creator picked. No-data cancellation path refunds if the oracle never reports.
- Mainnet deployments listed in README: Ethereum Core 0xE6AFB8b01CAF0214706116c7Dc3B978E6eb8ce7e (impl), Arbitrum Core 0x5854694204828385ED3d5B9d0FF912794D78cdaE, plus Polygon/BSC for v1.
- Verdict: architecturally a full match (as a generic framework), 2021-2022 era, effectively dormant. Not agent-native; no "program" abstraction beyond Solidity contracts.

### Cozy Finance v2 -- protection markets with arbitrary trigger contracts [V docs; usage low]
- Docs: https://docs.cozy.finance (Custom Triggers page; Permissions page). Repos: https://github.com/Cozy-Finance/cozy-triggers-v2 (2 stars, 2023-08).
- "The following actions in the manager are permissionless: Creating Sets" (permissions doc). Market = cost model + trigger contract. Custom triggers: "A contract must at least implement the ITrigger interface"; examples include triggers that "Use any piece of on-chain data". Chainlink/UMA triggers toggled by anyone via `runProgrammaticCheck`.
- Two sides: protection buyers (premium) vs providers (capital escrowed in the Set). Insurance economics, not symmetric stakes; no single deadline.
- -> (1) yes, (2) yes, (3) partial (asymmetric premium vs capital), (4) depends on trigger.
- Mainnet: Optimism Manager 0x7eDfAd1b566657a236C8422bA6997536BC647a29, SetFactory 0xDebE19B57e8B7Eb6eA6EBEa67B12153E011E6447 (docs Contract Addresses page).
- Status: DefiLlama Cozy V2 TVL ~$5k; Cozy has pivoted to "Cozy Earn" (Euler vault curation, listed 2026-03). Safety-module trigger repo renamed "...-triggers-deprecated" (2025-12). Dormant.

### Gnosis Conditional Tokens (primitive) [V]
- https://github.com/gnosis/conditional-tokens-contracts (308 stars, last push 2023-01). `prepareCondition(address oracle, bytes32 questionId, uint outcomeSlotCount)` is permissionless and the oracle is ANY address; `reportPayouts` derives conditionId from `msg.sender`. So a resolver contract with a permissionless `resolve()` is already a valid CTF oracle. Seer/Omen/Precog/BlackDoor/OTHERWISE all sit on CTF but plug in Reality.eth/UMA/admins, not creator code.

### MetaDAO conditional_vault (Solana primitive) [V]
- https://github.com/metaDAOproject/programs (119 stars, pushed 2026-10-19). `initialize_question{question_id, oracle: Pubkey, num_outcomes}` -- comment in source: "The InitializeQuestion instruction is permissionless". `resolve_question` requires `oracle: Signer` (`has_one = oracle`). The oracle can be any key, including a PDA of a resolver program -> Solana analog of CTF arbitrary-oracle. MetaDAO's own futarchy uses on-chain TWAP comparison as the fixed resolver (code-resolved but not creator-supplied).

### DefiLlama leads checked and ruled out (resolution is human/AI/UMA)
- Hot Take (Base, listed 2026-09-14): P2P USDC bets from X posts; "Bets are settled by the judge named in the bet, or by the protocol's house judge account" via `resolveMarket` (DefiLlama PR #21016). Contract 0x64Be8f389E202a77b446C7E86B564F4122Cb5a66 (ERC1967 proxy, implementation source not verified on Basescan; ~573 txs). Two-sided escrow yes; resolver = a named judge address. [U] whether a contract can be the judge (impl source not public). Site usehottake.app does not resolve (2026-10-21).
- ref_market (Base, 2026-09): referral bounties; proof is screenshot/link reviewed by referrer, disputes go to a random wallet jury (refmarket.io). Not code.
- OTHERWISE (Base, 2026-10): conditional markets on tokenised stocks; unmodified Gnosis CTF 1.0.3 + Polymarket CTF Exchange; resolution via UMA CTF Adapter (PR #21686).
- XO Market (own Celestia rollup, 2026-06): AI-first oracle + staked-token jury on disputes (secondary sources: CryptoRank, Blockworks Research) [U].
- Seeryx (Solana): Binance mid-price + UMA OO. PFWA Markets: CoinGecko/DefiLlama/football feed menu. EL Predict / wambo.fun: fixed Uniswap TWAP resolver. Delphi (app.delphi.fyi) = Gensyn Delphi (excluded).

### ERC-8183 "Agentic Commerce" (Draft, created 2026-02-25) -- standard for one-sided job escrow with arbitrary evaluator [V spec]
- Spec: https://github.com/ethereum/ERCs/blob/master/ERCS/erc-8183.md ; forum: https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902. Authors include Davide Crapis (EF) and Virtuals team members.
- `createJob(provider, evaluator, expiredAt, description, hook?)`: client escrows budget; "Evaluator: Single address per job, set at creation ... MAY be a smart contract that performs arbitrary checks (e.g. verifying a zero-knowledge proof or aggregating off-chain signals) before deciding whether to call complete or reject". After `expiredAt` "anyone may trigger refund" (`claimRefund`, not hookable). Hooks = arbitrary contracts on each transition.
- -> (1) yes, (2) yes (evaluator/hook = arbitrary contract), (3) NO: one-sided (client budget; provider deposits only via optional hook patterns), (4) depends on evaluator contract; expiry refund is permissionless.
- Deployments: secondary reports only [U] -- QuickNode blog (2026-04-17) says UFX Agentic Commerce hook contracts on Base mainnet and a ThoughtProof 3-model AI evaluator are "in production"; Magicians thread posts claim a Base mainnet self-implementation since April 2026 and Base Sepolia redeploys; a Rust crate `erc8183` lists a Monad mainnet deployment. Evaluators seen in the wild are AI/LLM or EOAs, not code/zk.

### Proofgold -- live chain with permissionless, proof-checked bounties [V via arXiv 2509.08267]
- Own L1 (since 2020) whose consensus includes a higher-order-logic proof checker. "users can place rewards for the verification (or refutation) of specific conjectures"; bounties collected by proving the proposition OR its negation. "2836 of the 13142 bounties resolved as of April 2025."
- -> (1) yes, (2) yes in spirit (the proposition IS the resolution spec; checker is the chain), (3) one-sided stake (but two outcomes: prove/disprove both collect), (4) yes (anyone who posts a valid proof).
- Closest live analog of "code-verified bounty"; not EVM, not agent-oriented, tiny economic value.
- Related: Bittensor "Conjectures" subnet (SN66) pays for Lean proofs, container-checked but with a manual review step (vendor page, [U]).

### XRPL Smart Escrows (XLS-100) -- creator-supplied WASM finish condition [V: NOT live on mainnet]
- Spec: https://xls.xrpl.org/xls/XLS-0100-smart-escrows.html (Draft, updated 2025-11-20); WASM VM XLS-0102 draft updated 2026-02-03. EscrowCreate carries a `FinishFunction` (WASM, `finish() -> i32`, positive = may finish); EscrowFinish callable by anyone with a computation allowance; must also be cancellable.
- `feature` RPC on xrplcluster.com (2026-10-21): only Escrow, TokenEscrow (enabled 2026-02-12), fixTokenEscrowV1 exist; no SmartEscrow amendment on mainnet.
- -> (1) yes, (2) yes, (3) one-sided, (4) yes. Devnet only.

### Agent-native escrow / wager attempts (2026) -- all LLM/judge/oracle-resolved
- Moltbet (Feb 2026, OpenClaw/Moltbook USDC hackathon era; repos e.g. https://github.com/koredeycode/moltbet, 0 stars): "decentralized prediction market for autonomous AI agents"; agents propose/counter 1v1 bets; resolution via "decentralized dispute resolution" + reputation. Not code. Prototype.
- playchessify (Celo mainnet, https://github.com/jadonamite/playchessify): humans and ERC-8004 agents wager free CHESS tokens; "settled on-chain by a trusted oracle" (server replays moves). Not code-resolved on-chain.
- BountyBook (Base, Product Hunt Feb 2026): USDC bounty escrow, "LLM-based oracle evaluates output against the spec" [U; GitHub shows several 0-star submission repos, so some real usage].
- TermiX (DefiLlama AI Agents, listed 2026-09-01, ~$3.8k TVL): agents hire agents, USDC escrow "released on completion" [U on who decides]. Fuci (Arc, 2026-09): FuciEscrow with ERC-8004 identities [U].
- Hackathon prototypes with creator-chosen resolution pipelines (Chainlink "Convergence" hackathon 2026): OmniOracle (Base Sepolia; 5 pipeline types incl. "Functions API (custom JavaScript calling any external API)"; https://github.com/yt2025id-lab/omnioracle), Wraith (Arbitrum Sepolia; resolution config locked at creation: PRICE_FEED / API_POLL / AI_VERDICT / OPTIMISTIC; Chainlink Automation keeper trigger; https://github.com/dannyy2000/Wraith). Testnet only.

### Other ruled-out / minor items
- Precog Markets (Base/Arbitrum, https://github.com/precog-markets/precog-dev, 10 stars, 2026-07): `PrecogMasterV8.createMarket` is `onlyMarketOperator` and `require(allowedOracles[config.oracle])` (admin whitelist; Reality.eth oracle adapters). Market's oracle "EOA or Contract" but whitelisted. Not permissionless resolver. Ships an agent skill (forecast-os) for agents to create markets.
- Hunch (Arbitrum One, buildathon 2026; vault 0xD8832E0156BD7Dd99C38d0b2EE2694E928116114; https://github.com/rajkaria/hunch): parimutuel vault; "resolves from code-readable onchain or market data" but `resolve(id, outcome, observationHash)` is restricted to an oracle role run by a cron; fixed sources (CoinGecko, Dune, DefiLlama). Not creator code.
- Baozi (Solana): agent MCP server (68-76 tools) for pari-mutuel markets; resolution by proposal/challenge [U].
- Punk.Coffee (BSC, factory 0xF7262C7eb1737f7701130C0151C0697Ad7c7A94D): "anyone can create and settle binary markets" per BNB dappbay; settlement source not documented [U].
- LexLocker V2 (lexDAO, https://github.com/lexDAO/LexLockerV2, 27 stars, 2022): escrow with parties' "selected resolver" (registered human resolvers). Arbiter framework, human.
- Historic one-sided code-verified bounties: Peter Todd's 2013 P2SH hash-collision bounties (SHA-1 one claimed 2017-02-23, 2.48 BTC) -- creator-written script, anyone can claim with a collision. [secondary sources: bitcoin-dev list 2013-09-13; bounty catalog]
- a16z crypto essay on "AI judges" (fix model + prompt on-chain at creation) -- conceptual cousin (resolver = pinned model), not code.

### Budokan (Provable Games, Starknet mainnet) -- permissionless tournaments scored by creator-chosen on-chain game contract [V docs]
- Docs: https://github.com/Provable-Games/docs (src/pages/budokan). Mainnet Budokan 0x0596ced030e74ebc37f33607f07ecd5a62eff22cdc4ae31fe2d724040c1bdc0b. Core repo not public under that name now; budokan-sdk pushed 2026-10-19.
- "Anyone can create or enter tournaments"; creator picks a game (any game implementing the Embeddable Game Standard, with a game registry for fee info -- [U] whether registry listing is permissionless); entry fees (any Ekubo-listed ERC-20) escrowed from all entrants; scores read from the on-chain game and "validated by the contract"; open-source submission bot, anyone can submit; `claim_reward` after finalization.
- -> (1) yes, (2) partial (resolver = arbitrary EGS game contract, but the "question" is always "who scores highest"), (3) yes (N-sided entry-fee pool), (4) yes. Close relative: contest/tournament shape rather than conditional claim.

### BitVM (conceptual prior art)
- Linus 2023 whitepaper (https://bitvm.org/bitvm.pdf) and AFT 2026 paper use two-party bets on a program's output (prover vs verifier; e.g. chess-puzzle claim) settled by on-chain fraud proofs in Bitcoin Script. Two-sided escrow + program-as-resolver, but two-party only and pre-arranged; no shipped bet product found.
- Risk Harbor (2021-22, now rebranded Subsea): "automated, transparent, and impartial invariant detection mechanism" for claims (DefiLlama text; Pantera blog). Market creation curated as far as found [U]. Insurance shape like Ante/Cozy.
- APRO (BNB oracle) + Brevis (announced 2026-01-26): zkTLS / ZK-coprocessor-proven oracle data for prediction-market resolution. Oracle infrastructure (feeds + proofs), not creator-supplied resolvers; no live markets found [U, press only]. Opinion Labs (excluded venue) also announced Brevis ZK settlement.
- HYPERSTITIONS (DefiLlama PM, Monad per adapter address): protocol-created "coordination markets" ($9.06M volume per site); resolution method not stated.
- RELAY (ERC-8004 agent #30372, Base mainnet, registered 2026-03-13; owner 0x5ce5331c1e62645ab903c353aeabdb424abed286): self-described "Autonomous agent-to-agent code bounty protocol" -- posts coding tasks with ETH rewards, competing agents deploy contracts, test suites run against them, payment auto-released "when all tests pass"; claims "fully on-chain" verification. No service endpoints, 0 feedback/validations, last activity 2026-05-01 (QuickNode ERC-8004 explorer). [U] -- no contracts or repo found; looks dormant.
- AIGEN Open Bounty Protocol (Base/Optimism, MCP server): permissionless USDC/ETH bounties for agents; verification by peer vote or creator judgment (mcp.so listing) [U]. "Agent Bounties" MCP (Base USDC) [U].

---

## Sub-sweep: Alkahest / Boundless-SP1 / zk proof-of-exploit (sub-agent report, spot-checked)

### Agent Bounties (agentbounties.app) -- strongest LIVE agent-native relative [V repo + on-chain code; traction self-reported]
- Repo https://github.com/NSPG13/agent-bounties (18 stars, 95 forks, created 2026-07-08, pushed 2026-10-19). Base mainnet, USDC. Factories: V1 0x082c52131aaf0c56e76b075f895eab6fcab6d2f9; V2 0xc33e2ae33bb9580837ea59df18e57fa1039ae58a (I confirmed 8,061 bytes of code on Base via publicnode RPC).
- `AgentBountyV2`: `enum VerificationMode { DeterministicModule, SignedQuorum, AiJudgeQuorum }`. In DeterministicModule mode the only check on `verifierModule` is non-zero (no allowlist). `verifyAndSettle(bytes proof)` -- source comment: "Anyone may relay a valid deterministic proof. A passing call settles atomically." Calls `IAgentBountyVerifier(verifierModule).verify(bountyId, round, solver, submissionHash, evidenceHash, policyHash, proof)`; failing verdict reverts; unprovable submissions expire and return the solver's claim bond. Windows: claim / verification windows, funding deadline.
- -> (1) yes, (2) yes (arbitrary verifier contract), (3) NO -- one-sided reward with a small solver claim bond, (4) yes.
- SP1 path (`Sp1VerifierAdapterV2Beta3`, open competitions) present in source but unreleased (sub-agent: all 36 release gates false).
- Traction (api.agentbounties.app, self-reported; sub-agent confirmed one tx on Base RPC): 73 bounties, 46 settled, 73.07 USDC paid lifetime, 66 identities; 37 bounties configured with deterministic modules (toy 16-bit proof-of-work verifier, meta-verifiers) but all 46 settlements went through the quorum path.

### Alkahest (Arkhai) [sub-agent V]
- https://github.com/arkhai-io/alkahest (11 stars, 951 commits, created 2024-08-14, last push 2026-07-17; Zellic audit 2026-06-30). EAS-based escrow obligations carrying `(arbiter, demand)`; `collect(escrow, fulfillment)` public, calls `IArbiter(arbiter).check(...)` (view); `reclaim` public after expiration. Arbiter = any creator-chosen address, no allowlist. Shipped arbiters: Trivial, TrustedOracle, CommitmentTrustedOracle, Intrinsics, ReferencesEscrow, ERC8004, All/Any, 12 attestation-property arbiters, confirmation arbiters; examples (GameWinner, MajorityVote, OptimisticStringValidator). No zk arbiter. No wager/two-sided pattern (barter only).
- Deployments: Ethereum mainnet 43 contracts (2026-02-18) with 0 txs / 0 logs; Monad mainnet partial deploy (2025-11-22) unused by deployer, third-party use unverified; testnets ~1,391 txs total on Base Sepolia, quiet since 2026-01-27. npm alkahest-ts 4,912 all-time downloads.
- Git Commit Marketplace (https://github.com/arkhai-io/git-commit-trading, 6 stars): creator escrows ERC-20 against test repo + commit; off-chain oracle runs tests in Docker and posts via TrustedOracleArbiter. Testnet only (Base Sepolia 19 txs, last 2026-01-30). Also natural-language-agreements (LLM oracle), simple-compute-market (10 stars, active).
- -> (1) yes, (2) yes in contracts / trusted-oracle in every app, (3) no, (4) yes.

### zk-settled bounties / puzzles
- Bear Trap (https://github.com/osobot-ai/bear-trap, 2 stars, 2026-02..05): ETH puzzle prize on Base, RISC0/Boundless proof, but operator backend co-signs claims; contract address unpublished.
- Lemma (https://github.com/asm-nop/lemma, 10 stars, Aug 2024 hackathon): theorem bounties verified via RISC0 Bonsai; fixed verifier program; no deployment.
- zkvm-lean4 TheoremBounty (https://github.com/ayumiohno/zkvm-lean4, 0 stars, Sep 2026): RISC0 Lean-4 theorem bounty, ~314k gas claim; research.
- ZTF (https://github.com/Tetration-Lab/ztf, 10 stars, Oct 2023): zk-claimable on-chain CTF bounty, hackathon.
- zescrow (https://github.com/kobby-pentangeli/zescrow, 3 stars, 2026-06): RISC0-gated escrow with a fixed condition menu; "do not deploy in production".
- code4ai-arena (Hedera testnet, Sep 2026): agent proof-of-exploit arena; operator server replays and judges.
- obscura-protocol (Noir + SP1, Sep 2026 hackathon): SP1 proves solvency, not resolution.
- Brevis partnerships (Opinion Dec 2025; APRO 2026-01-26; Trendle on Monad 2026-01-22): proven input data for platform-chosen settlement; none confirmed live. Nothing found for Axiom/Lagrange/Herodotus or official Boundless/Succinct ecosystem lists.

### zk proof-of-exploit
- zkPoEX (https://github.com/zkoranges/zkPoEX, 240 stars, 2023; history rewritten 2026-02-03): off-chain prove/verify CLI (RISC0 3.0.4); no bounty contract, no deployment.
- zkpoex (https://github.com/ziemen4/zkpoex, 45 stars, last push 2026-01-06; ACM SAC 2026 paper doi 10.1145/3748522.3779811): owner deploys `VerifierContract` (spec hash, context hash, REWARD_IN_ETH); anyone calls `verify(beneficiary, seal, journal)`, pays once. Sub-agent notes `beneficiary` not bound into journal (front-runnable). No deployments.
- Others: proof-of-exploit/cli (zkEVM, 43 stars, 2024-09), SecureFi (31 stars, 2024-07), OrchidMantis (SP1, 2026-05, disclosure only). None with live on-chain payouts.

---

## Sub-sweep: hackathons + ethresear.ch + Ethereum Magicians + ERCs (sub-agent report; repo stats spot-checked)

- zkAPI (ETHGlobal Scaling Ethereum, Apr 2024; https://github.com/marleymarl/zkAPI, 1 star): `PredictionGame.sol` pooled multi-party stakes; after deadline anyone calls `triggerResult(result, digest, seal)` verified against a RISC Zero `predictionImageId`. Image ID is a compiled-in constant (one contract per deployment, no factory); guest "fetches" an API with no TLS attestation. (1) partial, (2) partial, (3) yes, (4) yes. No deployment. -- Closest hackathon prototype to the full shape.
- HoneyPause (ETHDenver 2024; https://github.com/merklejerk/honeypause, 42 stars, last push 2024-03-09; Sepolia 0x81cb0ba5E7B724B03C8B64A5FAF4f2C655aD15E4): "Permissionless onchain exploit bounties tied to a circuit breaker". Project registers a custom Verifier (`beforeExploit()` / `assertExploit()`), Pauser, Payer; whitehat `claim()` runs exploit in reverted frame, pauses, pays. (1) yes, (2) yes, (3) no, (4) yes.
- ProofOfHack (ETHGlobal Paris 2023; https://github.com/gzeoneth/ProofOfHack, 2 stars): protocol overrides `_postHackCheck`; anyone calls `proofOfHack()`. Per-protocol deployment, testnets.
- TestedOK (ETHGlobal Bangkok Nov 2024; https://github.com/Ranaco/testedok, 0 stars): creator-supplied Foundry tests run in a Cartesi VM decide payout. One-sided; on-chain enforcement unverified.
- TEE Bounty (ETHGlobal Trifecta 2025), Arena Mayhem (ETHOnline 2023, Cartesi two-player stake, fixed game), P1X3LZ Agent Arena (ETHGlobal Lisbon 2026: agents negotiate wager, both stake HBAR, deterministic Snake engine but server reports result), ChainMate (ETHOnline 2025: P2P chess wager, Reclaim zkTLS proof of Chess.com result verified on-chain; fixed data source; testnets).
- Agent-commerce verifier escrows (one-sided, operator-run): CtrlZ (ETHGlobal NY 2026), AgentLevy (ETHGlobal Cannes 2026, x402 on Flare), Proofs of Inference (ETHGlobal Prague, zkML proof-gated escrow).
- zk-attested oracle data (fails 2): zkConfide, Dark Oracle (Convergence 2026; Groth16 verifier 0xF0029EC0836173806b3c26C383C55436b41959BC Base Sepolia), CREsolver (AI BFT), wthelly, AntiSoon (CRE replays PoC exploits in Tenderly; LLM/human jurors for non-strict cases).
- Cartesi Compute docs (Dec 2023): Alice/Bob both deposit, Cartesi Machine computes winner, verification game on dispute -- conceptual two-sided code-resolved wager.
- Human/LLM/oracle resolvers (fail 2): WannaBet, Betcha, vamos.fun, Settlebeef, Verdict, ETHGambit, AgentMarket, Prove Me Wrong, Courtside, Arbiter/Arbiter402/Arbitra (ETHOnline 2026), AgentDuel, ZKaggle, zkLeaderboard.

### ERCs / forum threads
- ERC-8183 Agentic Commerce (Draft 2026-02-25, PR #1581 merged 2026-03-04; Magicians /t/27902, ~418 posts): see above. Thread includes ThoughtProof evaluator on Base (a later reviewer says never called), ZkInferenceEscrowV2, a deterministic judge-protocol evaluator on Arc.
- ERC-8414 Token-Bound Task Tenders (Magicians /t/29597, 2026-09-05, PR #2005 open; https://github.com/garyyang-finchip/task-token-standard, 0 stars, pushed 2026-10-18): ERC-721 task token with own vault; if `acceptanceAuthority` is a contract declaring `ITaskVerifier`, task is "machine-settled" and `settleFulfillment` is permissionless; deadlines + permissionless `releaseExpired`; stock hash-preimage verifiers. (1)(2)(4) yes, (3) no. Closest one-sided standard analogue.
- ERC-8195 Task Market Protocol (2026-03-10): resolver = ERC-8004 Validation Registry, worker stake/forfeit in Claim mode. ERC-8203 Agent Off-Chain Conditional Settlement (2026-03-22): state-channel lock with ZK_PROOF condition + verifier address; one-sided.
- ZkInferenceEscrow (ethresear.ch /t/25660, 2026-08-07): x402 payment settles only on on-chain zk proof of pinned circuit; deadline + permissionless refund; Base Sepolia claimed [U].
- "Procedure Manifests" RFC (Magicians /t/29563, 2026-09-02): pinned LLM-judge procedure (model hash, prompts, rubric) as ERC-792 arbitrator / ERC-8183 evaluator.
- Conditional Tokens draft ERC (Magicians /t/27363, 2025-12-31) and ERC-8351 CTF Wrapper (PR #1913): arbitrary-oracle CTF standardisation.
- Older: ERC-1154 Oracle Interface (withdrawn 2018), ERC-792 Arbitration (2017, any arbitrator contract), ERC-7826 Quantum Supremacy Bounty (2024, closed), ERC-8033 Agent Council Oracles, ERC-8210 Agent Assurance, ASG (/t/28404, 2026-04-30). ethresear.ch: barryWhiteHat "Solving optimization problems using snarks" (2019), Justin Drake "Cryptographic canaries" (2018). ERC-8004 thread post #22 (2025-08-26) proposes `(address arbiter, bytes demand)` (= Alkahest design).
- No ERC for two-sided wagers resolved by code (merged ERCs folder and open PRs checked).

---

## Sub-sweep: GitHub (sub-agent report; key items spot-checked)

- Opium v1 (https://github.com/OpiumProtocol/opium-contracts, 37 stars): mainnet Core 0xd60F0A53c7e97f78fe4AC9013F5749920C601494; p2p `_create` pulls `margins[0]` from buyer and `margins[1]` from seller; `execute()` after endTime; third-party execution only if holder enabled it; no-data cancel after `NO_DATA_CANCELLATION_PERIOD`. (v2 verified by me above.)
- Ante v0.5 README mainnet 0xa03492A9A663F04c51684A3c172FC9c4D7E02eDc, Avalanche 0x18aB6357f673696375018f006B86fE44F195DE1f (unlabelled, presumably factory).
- Cozy v1: developer guide deploys custom `ITrigger` and calls `comptroller.deployProtectionMarket(underlying, trigger)` from an arbitrary key (permissionless inferred, core repo not public).
- Curta (https://github.com/waterfall-mkt/curta, 138 stars, 2024-02; mainnet 0x0000000006bC8D9e5e9d436217B88De704a9F307, Base 0x00000000D1329c5cd5386091066d49112e590969): on-chain CTF where puzzles are `IPuzzle.verify` contracts; `solve()` permissionless and code-verified; adding a puzzle needs an AuthorshipToken; rewards are NFTs/fame, no escrowed stakes.
- Reckn (https://github.com/psyto/reckn, 0 stars, pushed 2026-10-17; ETHGlobal Tokyo 2026 3rd place Uniswap Foundation track; Sepolia RecknZkEscrow 0x6d6a9deb67d785BC131a5d732617EABE751098C5, Arc testnet 0x580f2c3268b0a13bf46c6d381bf807cbf1595669): `fund()` permissionless; funder names arbitrary `verifier` pinned by `verifierCodeHash` ("pinned at funding and re-checked at settlement" -- I confirmed `verifier.codehash != verifierCodeHash` revert in source); `settleWithProof` permissionless (SP1 proof + `dealBinding`); 30-day refund. One-sided. Closest recent one-sided design; codehash pinning is a directly reusable idea.
- Agent Bounties OpenCompetition v1 factory on Base mainnet 0x9e9382beb8b1a45b737d484b5eafa7b8779d4ca5 (creator-supplied `verifierModule`, only `code.length > 0` checked; solvers commit with entry bond; `revealSolution` verifies and settles). V2Beta3 adds per-bounty creator-supplied SP1 `programVKey` + `finalizeBestScore` after deadline -- unreleased.
- MetaLex LeXscroW (https://github.com/MetaLex-Tech/LeXscroW, 9 stars, pushed 2026-06-30): ownerless permissionless factories; `LexscrowConditionManager` takes arbitrary `ICondition.checkCondition` contracts (AND/OR); `DoubleTokenLexscrow` both parties deposit; `execute()` callable by anyone when conditions pass; refunds after expiry. Conditional SWAP, not winner-take-all. No deployed addresses listed. -- (1)(2)(4) yes, (3) yes-as-swap.
- ERC-8183 impl qntx-labs/market-contract (2 stars, 2026-09): hooks owner-whitelisted.
- agent-arena (https://github.com/0xdevesh15/agent-arena, Synthesis hackathon 2026-03; Base Sepolia WagerEscrow 0x5AE674C0CFBD27514716E2b27C3E22339Cb80bDF): two-sided creator/challenger stakes, on-chain verification, but verifiers from owner menu `setVerifier(ProblemType)`.
- validus-protocol (Soroban, 2026-07): creator-supplied RISC Zero image_id but "trusted verifier" + timelock; one-sided.
- Resolver-allowlist pattern (pluggable `IResolver` but owner-approved): clawshi-protocol, montions (`TimelockOpResolver`), Foresight-Arena-Celo, UnitFlow predict-smart-contract, squidlor resolver template, contention-markets (two-sided entry fees; permissionless resolution from game program state; game programs admin-allowlisted), shake-escrow (Solana devnet, two equal stakes, deadline, resolver signer allowlisted), TxLINE proof-settled World Cup markets (templated predicates over one feed), carrot-kpi (governance-added templates).
- Off-chain/trusted agent wagers & bounties: agent-pact (Stripe + sandboxed Python verifier), defi-bounty-escrow (Docker/GH Actions), BlindBugBounty (TEE), ClawBond (two-sided agent bond on Chainlink price), GenLayer intelligent-oracle (LLM consensus), theorem-marketplace-contract (Chainlink operator), zk-bbp (WIP), Figaro (buyer resolves).

---

## SYNTHESIS (2026-10-21)

| Project | What | Status | Props (1/2/3/4) |
|---|---|---|---|
| Opium Protocol v1/v2 | P2P derivatives; each position names arbitrary payout-logic (`syntheticId`) + oracle (`oracleId`) contracts, margin from both sides, endTime | Mainnet 2020-23, dormant (~$76k DefiLlama) | Y / Y / Y / partial (depends on oracle contract; holder-gated execute) |
| Ante Finance v0.5/0.6 | Stakers vs challengers on arbitrary `checkTestPasses()` contract | Mainnet ETH/ARB/OP/zkSync/AVAX; 37+10+8 v0.6 pools; deprecated | Y / Y / Y (asymmetric) / Y-ish (challengers only); no deadline |
| Cozy v1/v2 | Protection markets on arbitrary trigger contracts | Mainnet (OP); dormant, pivoted | Y / Y / partial / depends |
| Gnosis CTF; MetaDAO conditional_vault | Arbitrary-oracle conditional-token primitives | Live primitives | Y / Y (structural) / split-collateral / depends |
| LeXscroW (MetaLex) | Two-party conditional swap gated by arbitrary ICondition contracts | Code, no addresses | Y / Y / Y (swap) / Y |
| Agent Bounties | Agent bounty board, creator-chosen verifier module, permissionless verifyAndSettle | Base mainnet since 2026-07; 73 bounties, ~$73 paid; all settlements via quorum | Y / Y / N / Y |
| Alkahest (Arkhai) | EAS escrow + arbitrary arbiter contracts | ETH mainnet deploy with 0 txs; testnet ~1.4k txs | Y / Y / N / Y |
| Reckn RecknZkEscrow | SP1 proof-gated escrow, verifier pinned by codehash | Testnets (ETHGlobal Tokyo 2026) | Y / Y / N / Y |
| ERC-8183 / ERC-8414 | Job / task escrow standards with arbitrary evaluator / ITaskVerifier | Draft / proposal; some impls | Y / Y / N / Y-ish |
| HoneyPause, ProofOfHack, zkpoex | Code/zk-verified exploit bounties | Hackathon / paper; testnet | Y / Y / N / Y |
| Proofgold | Chain-verified proof bounties (prove or disprove) | Live own L1; 13,142 bounties, 2,836 resolved (Apr 2025) | Y / Y / N (one-sided stake) / Y |
| Curta | Puzzle contracts, code-verified solves | Mainnet + Base; NFT rewards | gated / Y / N / Y |
| Budokan | Permissionless tournaments scored by on-chain game contract | Starknet mainnet | Y / partial / Y (N-party pool) / Y |
| zkAPI | Pooled bets resolved by RISC Zero proof | Hackathon 2024, no deploy | partial / partial / Y / Y |
| XRPL Smart Escrows | WASM FinishFunction escrow | Draft / devnet, not on mainnet | Y / Y / N / Y |

Bottom line: nothing found ships the full four-property combination as a live, used, 2025-26 product. The only full-shape matches are dormant 2020-23 DeFi frameworks (Opium; Ante with no deadline; Cozy with asymmetric economics). Every 2026 agent-native system that accepts a creator-chosen verifier contract (Agent Bounties, Alkahest, Reckn, ERC-8183/8414 implementations) is one-sided, and in practice their settlements go through quorum/LLM/trusted-oracle paths. Recent two-sided prediction-market repos with pluggable resolvers all gate resolvers behind an owner allowlist.

---

## DefiLlama "Prediction Market" category (api.llama.fi/protocols, fetched 2026-10-21; 135 entries)

Name | listedAt | chains | TVL USD
|---|---|---|---|
| OTHERWISE | 2026-10-20 | Base | 490 |
| Seeryx | 2026-10-20 | Solana | 567 |
| PFWA Markets | 2026-10-15 | Robinhood Chain | 328 |
| Closer | 2026-10-13 |  | 0 |
| SX Bet V3 | 2026-10-09 |  | 0 |
| Hyperliquid Outcomes | 2026-10-08 |  | 0 |
| EL Predict | 2026-10-06 | Robinhood Chain | 0 |
| Wager Predict | 2026-10-06 | Binance | 0 |
| cro.trade Predict | 2026-10-03 |  | 0 |
| STRATO Odds | 2026-09-25 | Strato | 1,914 |
| BV-7X | 2026-09-25 | Robinhood Chain | 0 |
| ParamX | 2026-09-24 | Sui | 97 |
| Hot Take | 2026-09-14 | Base | 1,677 |
| Levr Bet | 2026-09-11 | Monad | 1,846,603 |
| PopcornCine | 2026-09-02 |  | 0 |
| wambo.fun | 2026-08-12 | Robinhood Chain | 0 |
| TayDex | 2026-08-11 | Base | 0 |
| Pascal | 2026-07-29 | Solana | 2,127,133 |
| PredictStreet | 2026-07-23 | ADI | 1,339,694 |
| Meridian Predict | 2026-07-07 | Robinhood Chain | 1,032,409 |
| Hoodbets | 2026-07-03 | Robinhood Chain | 1,058 |
| world | 2026-07-02 | Solana | 193,785 |
| Livara | 2026-07-01 | Polygon | 200 |
| BlackDoor | 2026-06-30 | Arbitrum | 31 |
| Bubblegum | 2026-06-23 | Solana | 153 |
| XO Market | 2026-06-16 |  | 0 |
| HypeMarket | 2026-06-16 | Supra | 218 |
| PRED | 2026-05-21 | Base | 125,610 |
| Delphi | 2026-05-13 |  | 0 |
| Reppo | 2026-05-07 | Base | 0 |
| Premarket | 2026-04-21 | MegaETH | 0 |
| Suibets | 2026-04-14 | Sui | 2 |
| Kizzy | 2026-04-13 | Monad | 63,620 |
| MarkIt | 2026-04-01 |  | 0 |
| Xmarket | 2026-03-23 | Binance | 610 |
| Signals | 2026-03-18 | Citrea | 0 |
| PredPred | 2026-03-09 | Sei | 0 |
| evently | 2026-03-06 | MegaETH | 7 |
| GFEX | 2026-02-27 | Base | 0 |
| Rush Sports | 2026-02-27 | Solana | 37 |
| Nexion Predictions | 2026-02-21 | Pulse | 0 |
| PredMart | 2026-02-17 | Polygon,Base | 6,250 |
| Probable | 2026-01-24 | Binance | 203,489 |
| Precog Markets | 2025-12-26 | Base,Arbitrum | 6,741 |
| OPINION | 2025-10-28 | Binance | 3,092,276 |
| Rain | 2025-10-28 | Arbitrum | 16,994,679 |
| Punk.Coffee | 2025-10-14 | Binance | 2,485 |
| Belief Market | 2025-09-05 | Binance,Base | 549 |
| Myriad Markets | 2025-09-03 | Abstract,Binance,Linea | 228,874 |
| Sport.fun | 2025-08-25 | Base | 2,119,273 |
| R3R | 2025-08-14 | World Chain | 1,752 |
| Prophet.fun | 2025-07-29 | Solana | 0 |
| TopCut Finance | 2025-07-17 | Arbitrum | 54 |
| Jackson Protocol | 2025-06-14 | Sui | 1,242 |
| Alpha Arcade | 2025-06-14 | Algorand | 201,162 |
| X3X | 2025-06-05 | World Chain | 7 |
| dripit | 2025-05-12 | Avalanche | 200 |
| Bodega Market | 2025-04-08 | Cardano | 1,107 |
| Spindash | 2025-03-31 | Sonic | 0 |
| Clutch Markets Predictions | 2025-03-31 | ApeChain,Arbitrum | 13,025 |
| Gacha Markets | 2025-03-23 | Abstract | 0 |
| Unihedge | 2025-03-07 | Polygon | 29 |
| Liquidity House | 2025-02-17 | Etherlink | 1,260,872 |
| SX Bet V2 | 2025-02-03 | SX Rollup | 0 |
| O.LAB | 2025-01-20 | Base | 0 |
| NODO | 2025-01-08 | Celo,Polygon,Avalanche,Binance | 1 |
| HackenAI | 2024-12-20 | Base | 0 |
| SuiMarket | 2024-10-27 | Sui | 439 |
| Trueo | 2024-10-18 | Base | 1,184,561 |
| Seer | 2024-10-17 | xDai,Ethereum | 342,621 |
| SynStation | 2024-10-16 | Soneium,Ethereum,Astar | 5,604 |
| Limitless Exchange | 2024-09-25 | Base | 353,689 |
| Hedgehog Markets | 2024-09-23 | Solana,Eclipse | 46,005 |
| Predict Fun | 2024-09-10 | Binance,Blast | 10,868,240 |
| Perfect Pool | 2024-09-04 | Base,Hyperliquid L1 | 203 |
| Random Reward | 2024-08-19 | Ethereum | 34 |
| PredX Ai | 2024-08-05 | Base,Bitlayer,Binance,Linea,Ma | 3,414 |
| ScorePlay.xyz | 2024-06-19 | Base,Sophon | 0 |
| Divvy.Bet | 2024-06-06 | Solana | 4,885 |
| eesee | 2024-04-05 | Blast | 43,789 |
| BetFolio | 2024-03-25 | Polygon | 106 |
| DropCopy | 2024-01-05 | Solana | 9 |
| DeeppDAO | 2023-10-11 | Arbitrum | 3,953 |
| One guy Finance | 2023-09-12 | Polygon | 0 |
| CoChilli | 2023-08-10 | Base | 0 |
| Whale Game | 2023-07-24 | Ethereum | 10,683 |
| WINR Protocol | 2023-05-26 | Arbitrum | 0 |
| SageBet | 2023-05-08 | Arbitrum | 3 |
| Kava Football Club | 2023-03-16 | Kava | 0 |
| Nexter | 2023-02-21 | Polygon,Mantle | 48 |
| ZKasino | 2023-01-23 | Polygon,Arbitrum,Binance,Fanto | 944 |
| LunaFi | 2023-01-11 | Polygon | 9 |
| Debets | 2022-11-04 | Polygon,Fantom | 7 |
| PRDT | 2022-10-20 | Ethereum,Binance,Polygon,Arbit | 489,155 |
| Prophet | 2022-08-15 | Obyte | 2,722 |
| BetSwirl | 2022-07-19 | Unichain,Avalanche,Binance,Arb | 0 |
| Azuro | 2022-07-13 | Polygon,Linea,Arbitrum,xDai,Ba | 206,568 |
| CatsLuck | 2022-05-10 | smartBCH | 0 |
| SportBet | 2022-02-25 | EOS | 2 |
| Predictcoin | 2022-01-07 | Binance | 0 |
| Polkamarkets | 2021-12-21 | Ethereum,Polygon,Moonriver,Moo | 13,473 |
| Entropyfi | 2021-12-20 | Polygon | 5,243 |
| Risq Protocol | 2021-11-17 | Binance | 0 |
| Polymarket International | 2021-10-26 | Polygon | 360,404,967 |
| Augur | n/a | Ethereum | 1,655,525 |
| Overtime | n/a | Arbitrum,Base,Optimism,Polygon | 1,273,356 |
| Gnosis Protocol v1 | n/a | Ethereum | 1,030,907 |
| Zethr | n/a | Ethereum | 676,276 |
| PredictEX | n/a | Base | 238,722 |
| LoTerra | n/a | Terra | 0 |
| TotemFi | n/a | Binance | 0 |
| Bear Vs Bull | n/a |  | 0 |
| Demented Games | n/a |  | 0 |
| MEMECAST.AI | n/a |  | 0 |
| Ninja Blaze | n/a |  | 0 |
| PancakeSwap Prediction | n/a |  | 0 |
| Kalshi | n/a |  | 0 |
| HyperTek | n/a |  | 0 |
| HYPERSTITIONS | n/a |  | 0 |
| Ratio | n/a |  | 0 |
| GameClub | n/a |  | 0 |
| Polymarket US | n/a |  | 0 |
| FrenFlow | n/a |  | 0 |
| Worm | n/a |  | 0 |
| Gambit Zone | n/a |  | 0 |
| FanVibe | n/a |  | 0 |
| Aster Predictions | n/a |  | 0 |
| TurboFlow Prediction Markets | n/a |  | 0 |
| InsightX | n/a |  | 0 |
| Fibo | n/a |  | 0 |
| Hermes Trade | n/a |  | 0 |
| Polymarket Combos | n/a |  | 0 |
| MagicMarkets | n/a |  | 0 |
| Prophet Prediction Market | n/a |  | 0 |
| CRSHMARKET | n/a |  | 0 |

Unfamiliar 2025-26 listings checked for resolver model: Hot Take, OTHERWISE, XO Market, Precog, Seeryx, PFWA Markets, EL Predict, wambo.fun, Punk.Coffee, HYPERSTITIONS, BV-7X (agent price calls), Worm, InsightX. None uses creator-supplied resolver code. Notable non-PM categories: Ante Finance, Cozy V1/V2, Risk Harbor (Insurance); Opium (Options); Hats (Bug Bounty, committee); Ref Market, PeddleQuest, Zenland (Services escrow, human/Merkle); TermiX, Fuci (AI Agents escrow).
