# Novelty check: established and on-chain prediction-market venues

Date of check: 2026-10-21. Researcher: subagent (Claude). Method: WebSearch (worked this session) + WebFetch + GitHub API (`gh`) + raw contract source + DefiLlama API.

Target combination ("full match"):
1. Permissionless creation
2. Creator-supplied resolution code (arbitrary code, or arbitrary resolver/oracle address of creator's choosing; fixed price-feed menus, human/token-vote/committee oracles do NOT count)
3. Two-sided stakes with escrowed collateral
4. Code-determined resolution, permissionlessly triggered, no human vote in normal path

Legend: [P1]..[P4] = property satisfied. "unverified" = could not confirm from a primary source.

---

## 1. Hyperliquid HIP-4 outcome markets

- **Status/chain:** Live on Hyperliquid L1 (HyperCore) mainnet since ~2 May 2026 (secondary: GoldRush changelog, Forklog). DefiLlama lists "Hyperliquid Outcomes" (id 8941, parent Hyperliquid), `listedAt` = 1791495619 = 2026-10-08 ~21:40 UTC; category Prediction Market; no TVL data; module `dummy.js`.
- **Permissionless phase shipped? NO on mainnet (as of 2026-10-21).** Official docs index (`llms.txt`) lists "HIP-4 deployer actions: **Testnet-only**". The deployer-actions page says testnet-only and gives testnet limits (10 active outcomes/deployer, 50 deployed/day). The Block (2026-07-20) said permissionless deployment comes "in a future upgrade", testnet first. QuickNode (2026-09-18) describes the design and says testnet "Forge" is a live example; gives no mainnet date. No primary source found showing mainnet permissionless deployment live.
- **Creation model (as designed, testnet):** Not free-form. Validators vote on outcome *templates* (`registerTemplate` via validator L1 votes; templates have `semanticRestriction`, `{keyword}` placeholders with typed hints like `hlPerp`, `dateTime`). Deployer must `activateOutcomeDeployer` (Standard account abstraction + staking requirement; 500K HYPE / >=183 days on mainnet per The Block & QuickNode; 100 HYPE testnet per QuickNode), then `registerStandaloneOutcomeFromTemplate` / `registerQuestionFromTemplate`. New structures need validator approval.
- **Resolution:** Mainnet canonical market (validator-deployed): recurring daily BTC binary that "settles daily at 06:00 UTC to the BTC mark price on HyperCore" (HIP-4 page). So today's live mainnet market = protocol price feed (HyperCore mark price), validator-deployed. For deployer markets: `settleOutcome { outcome, settleFraction, ... }` is a **signed action by the deployer** (or an authorized sub-deployer). The protocol does not compute settleFraction from code; the deployer asserts it. Enforcement = validator vote to slash the stake for malformed markets / wrong settlement / failing to settle within a week (slashed stake is burned, per QuickNode FAQ). No creator-supplied code, no arbitrary resolver contract (HyperCore is not a general VM; HyperEVM contracts cannot act as settlers per anything I found — unverified).
- **Collateral:** "fully collateralized contracts that settle within a fixed range"; Yes/No sides with merged order book; split/merge; settlement converts Yes -> settleFraction quote tokens. Quote asset: sources conflict (USDH vs USDC) — unverified.
- **Agent-native:** Full HyperCore API (info/exchange endpoints, `outcomeMeta`, `outcomeTemplates`), community SDKs (nktkas TS SDK v0.33.3 includes `activateOutcomeDeployer`), builder codes.
- **Verdict: PARTIAL — [P3] only on mainnet. [P1] is gated (validator-approved templates + large stake) and testnet-only. [P2] no (deployer is a trusted signer, not code). [P4] no for deployer markets (deployer signs; validator vote as backstop); the canonical BTC market is price-feed settled but validator-deployed.**
- URLs:
  - https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions
  - https://hyperliquid.gitbook.io/hyperliquid-docs/llms.txt  ("HIP-4 deployer actions ... Testnet-only")
  - https://www.theblock.co/post/408875/hyperliquid-hip-4-permissionless-deployment (2026-07-20)
  - https://www.quicknode.com/blog/hyperliquid-hip-4-permissionless-deployment (2026-09-18)
  - https://api.llama.fi/protocol/hyperliquid-outcomes
  - https://www.alchemy.com/docs/data/hypercore/rest-api/outcome-markets/outcome-templates.md

## 2. Drift BET (Solana)

- **Status: DEFUNCT.** Drift was exploited on 2026-04-01 (~$280-295M, secondary reporting) and the program paused. Successor "Velocity" is a fork of Drift v2 at SDK v2.163.0-beta.0 with new program ID; Velocity docs: "The Drift program is paused" and under Removed features: "Prediction markets | `initialize_prediction_market` is removed; `ContractType.PREDICTION` is now `DEPRECATED_PREDICTION`." `docs.drift.trade/prediction-markets/...` now 307-redirects to docs.velocity.exchange (500). GitHub `drift-labs/protocol-v2` now redirects to `velocity-exchange/protocol-v2`, archived (last push 2026-07-08).
- **Creation (historical, from source):** `initialize_prediction_market(ctx: AdminUpdatePerpMarket)` — admin-only. Markets were Drift perp markets with `ContractType::Prediction`.
- **Resolution (historical, from source):** `settle_expired_market(ctx: AdminUpdatePerpMarket, market_index)` and `update_perp_market_expiry(AdminUpdatePerpMarket)` — admin-only; prices from admin-managed prelaunch oracle (`initialize_prelaunch_oracle` / `update_prelaunch_oracle_params`).
- **Collateral:** cross-margined Drift account (30+ collateral assets), not per-market escrow.
- **Verdict: NO MATCH (and no longer live).**
- URLs:
  - https://docs.velocity.exchange/developers/migrate-from-drift.md
  - https://github.com/velocity-exchange/protocol-v2/blob/master/programs/drift/src/lib.rs (archived; lines ~609, 1089, 1133, 1809)
  - https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch (secondary)

## 3. Azuro

- **Status/chain:** Live (V3; docs + SDK/toolkit repos active Oct 2026). EVM chains; DefiLlama lists Gnosis (xDai), Polygon, Base, Arbitrum, Linea, Chiliz; TVL ~ $207K.
- **Creation:** Conditions created by **Data Providers**, which are permissioned. Docs: "Currently, Data Providers are still permissioned due to the critical nature of the role." Future: "permissionless data providers (elected by AzuroDAO)".
- **Resolution:** "the Data Provider is also responsible for resolving Conditions in good-faith, with AzuroDAO acting as the arbiter of last resort in case of disputes." On-chain `oracle` field of a condition = condition-creator address (data provider). Future: Web Proofs (not shipped).
- **Collateral:** Peer-to-pool. Bettors vs a shared LP Liquidity Tree pool; data provider posts reinforcement collateral; odds via vAMM. Not P2P two-sided.
- **Agent-native:** `@azuro-org/toolkit`, `@azuro-org/sdk`, subgraphs/API. No MCP found (not searched exhaustively).
- **Verdict: NO MATCH (has escrowed pool collateral, loosely [P3]; P1/P2/P4 absent).**
- URLs:
  - https://gem.azuro.org/knowledge-hub/how-azuro-works/protocol-actors/data-providers
  - https://gem.azuro.org/knowledge-hub/introduction/event-resolution-azuro-dao
  - https://github.com/Azuro-protocol/gem-docs (source of the above pages)

## 4. Seer (Gnosis CTF front-end)

- **Status/chain:** Live on Gnosis, Ethereum, Base, Optimism (deployments in seer-pm/demo repo; repo active Oct 2026).
- **Creation:** Permissionless. `MarketFactory.createCategoricalMarket/createMultiCategoricalMarket/createScalarMarket/createMultiScalarMarket` are `external` with no access control.
- **Can creators choose an arbitrary oracle? NO (via Seer).** In `MarketFactory.sol`, `realityProxy`, `arbitrator`, `realitio`, `questionTimeout`, `collateralToken` are all `immutable` constructor params. `prepareCondition` calls `conditionalTokens.prepareCondition(address(realityProxy), questionId, outcomeSlotCount)` — oracle hardwired to Seer's RealityProxy. CirclesMarketFactory on Gnosis has the same constructor/ABI (no oracle param). Creator only chooses question text, outcomes, opening time, min bond.
- **Resolution:** `RealityProxy.resolve(market)` is permissionless to call, but it reads `realitio.resultForOnceSettled(questionId)` -> Reality.eth bonded human answers, Kleros arbitration on dispute. Human/crowd oracle, not code.
- **CTF caveat:** The underlying Gnosis ConditionalTokens contract itself lets anyone call `prepareCondition(oracle=any address, ...)`, so a third party *could* create a CTF condition whose oracle is an arbitrary contract — but Seer's factory, indexer and UI do not expose that; it would not be a Seer market.
- **Collateral:** CTF split = full collateral (sDAI on Gnosis, etc.); outcome tokens wrapped to ERC20 and traded on AMMs (Swapr/Uniswap v3-style). Two-sided via complementary outcome tokens.
- **Agent-native:** `@seer-pm/sdk`, `@seer-pm/react`; seer-pm/ai-prediction-markets repo (TradeExecutor contracts; no README content). Futarchy products.
- **Verdict: PARTIAL — [P1], [P3]. Not [P2] (oracle fixed to Reality.eth proxy), not [P4] (human-bonded answers + Kleros).**
- URLs:
  - https://github.com/seer-pm/demo/blob/main/contracts/src/MarketFactory.sol (immutable realityProxy; prepareCondition ~L395)
  - https://github.com/seer-pm/demo/blob/main/contracts/src/RealityProxy.sol (resolve ~L41)
  - https://seer-3.gitbook.io/seer-documentation

## 5. Omen / Presagio (Gnosis Chain, CTF + FPMM)

- **Status/chain:** Gnosis Chain. Omen rebranded/fronted as Presagio (SwaprHQ/presagio repo, last push 2025-05; "where predictions meets AI agents. Powered by Omen, and Gnosis Conditional Tokens"). Still used by AI trader agents: valory-xyz/trader ("AI agent for trading on prediction markets (specifically, Omen on Gnosis ...)") pushed 2026-10-21; Gnosis prediction-market-agent-tooling (PMAT) supports Omen/Presagio. Not listed on DefiLlama protocols list (no TVL entry found). Front-end liveness of presagio site: unverified.
- **Creation:** Permissionless. FPMMDeterministicFactory `create2FixedProductMarketMaker(saltNonce, conditionalTokens, collateralToken, conditionIds[], fee, initialFunds, distributionHint)` (Gnosis 0x9083A2B699c0a4AD06F63580BDE2635d26a3eeF0) has no access control. Standard flow: ask Reality.eth question -> `ConditionalTokens.prepareCondition(oracle = Omen RealitioProxy 0xAB16D643bA051C11962DA645f74632d3130c81E2, questionId, n)` -> create FPMM.
- **Arbitrary oracle? Contract level: YES (inherited from CTF). Venue level: NO.** The FPMM factory accepts any `conditionIds`, and CTF's `prepareCondition` takes any oracle address, so an agent can create an Omen-factory FPMM whose condition is resolved by an arbitrary contract. The Omen subgraph even indexes such conditions (`ConditionalTokensMapping.template.ts`: if oracle is not RealitioProxy/RealitioScalarAdapter it logs "Condition oracle address {} is not a known Realitio address." but still records it). However the product (UI, PMAT market queries filtering on `question_` Reality.eth fields) assumes Reality.eth; custom-oracle markets have no Reality question/title and are effectively invisible/unsupported. This is a primitive capability, not a shipped product feature.
- **Resolution (normal path):** Reality.eth bonded answers (escalation game), Kleros arbitration on dispute; `RealitioProxy.resolve(questionId, templateId, question, numOutcomes)` is permissionless to call but just relays the human/bond-based Reality answer.
- **Collateral:** CTF full collateral (wxDAI/sDAI); FPMM AMM provides liquidity; two-sided via complementary outcome tokens.
- **Agent-native:** Strongest of the legacy venues: Gnosis PMAT (Python), Olas/valory trader agents, ERC-8004 registered trader agents on Gnosis (third-party explorer).
- **Verdict: PARTIAL — [P1], [P3] as a product. [P2]/[P4] only via the raw CTF loophole (not a product feature, no UI/indexing support, no agent tooling for custom resolvers).**
- URLs:
  - https://github.com/gnosis/prediction-market-agent-tooling/blob/main/prediction_market_agent_tooling/markets/omen/omen_contracts.py
  - https://github.com/protofire/omen-subgraph/blob/master/src/ConditionalTokensMapping.template.ts
  - https://github.com/SwaprHQ/presagio
  - https://github.com/valory-xyz/trader

## 6. Gensyn Delphi (Gensyn L2, OP Stack; chain id 685689)

- **Status:** Launched April 2026 (The Block, 2026-04-22: invite-only creators, trading open; mainnet "expected in the coming weeks"). DefiLlama "Delphi" listed 2026-05 (listedAt 1778703409), chain "Gensyn", desc: "anyone can create markets and trade on outcomes - settled by AI with verifiable results." SDK (`@gensyn-ai/gensyn-delphi-sdk` 2.x) has mainnet + testnet + competition-testnet configs; mainnet automated gateway 0x982a67aE92D8de361957249fB2BB4a62BCc6A8d5, factory 0x9C73417f79a1361c6aF9Bd828343badEE1b84936 (I confirmed both have code on mainnet RPC).
- **Creation:** Contract level permissionless. Repo `DelphiFactory.deployNewMarketProxy(initialDeposit, config, metadata)` has no access control; the mainnet factory bytecode exposes exactly the repo factory's selectors (IMPLEMENTATION, TOKEN, MARKET_CREATION_FEE, SETTLEMENT_FEES, MARKET_CREATION_FEE_RECIPIENT, getMarketProxies, ...) and has no `owner()` (any creator-gating inside the DPM market implementation's `initialize` is unverified). Delphi agent skill: "Markets are user-owned and permissionless — Gensyn does not control markets, custody funds, or settle trades" but "markets not created on the UI will not show up on the UI". UI creation was invite-only at launch (The Block); current UI whitelist status: unverified.
- **Can creators supply their own resolver code or model?** Creators choose an **AI model + prompt**, not code and not a resolver address. Market metadata (IPFS/HTTP URI + content hash) carries `model.model_identifier` and `model.prompt_context` plus data sources. REE "is not limited to the listed models. Any compatible Hugging Face model may work" (REE docs) — whether Delphi's UI/workflow accepts arbitrary HF model IDs: unverified. Creator cannot pick the oracle: the gateway has a single `oracleRelayer` set by `onlyOwner` (`setOracleRelayer`). On mainnet, `gateway.oracleRelayer()` = 0x6bba6fc6...0616, a TruebitOracleRelayer whose constants (read via eth_call) are NAMESPACE "gensyn", TASKNAME "workflow_entry", PATH "/webhook/settlement" — i.e. one Gensyn-registered off-chain API workflow on Truebit for all markets. Relayer is UUPS-upgradeable by its owner (0x9f0e...fc8b); gateway owner is a contract (0xe7d8...5e3a).
- **Resolution:** `LmsrGateway.resolveMarket(market)` is permissionless (caller earns keeper fee) -> relayer sends `{metadata_path, created_at, resolves_at}` to Truebit WatchTower -> Gensyn workflow runs the creator-selected model (REE, reproducible) -> `callbackTask` decodes `outcomeIdx` -> `settleMarket`, or `failMarket` on error/malformed output. No human vote in normal path; trust = Gensyn workflow + Truebit + upgradeable relayer. Legacy gateway (pre-"autoset") used `submitWinner`/`GatewayWinnerSubmitted` (manual winner submission). Markets flagged `verifiable` carry a settlement `proof`.
- **Collateral:** USDC on Gensyn. Mainnet/testnet = dynamic parimutuel markets (pool split among winners); competition = LMSR. Creator posts initial deposit/liquidity; traders buy from pool. Escrowed in market proxy; not P2P two-sided.
- **Agent-native:** Yes — TS SDK for agents (CDP server wallet signer), Claude-style agent skill repo (`gensyn-delphi-skills`, SKILL.md/AGENTS.md), REST API with API keys, Goldsky subgraph, agent trading competition (agent-competition.gensyn.ai). AXL (Gensyn agent P2P layer) has MCP/A2A support (separate product).
- **Verdict: PARTIAL (closest match found). [P1] yes at contract level (UI curated). [P2] partial — creator supplies model choice + natural-language prompt, but not arbitrary code and not an arbitrary resolver contract; oracle is a single platform-controlled relayer/workflow. [P3] partial — escrowed USDC, but pooled parimutuel/LMSR rather than matched counterparties. [P4] mostly — permissionless trigger, AI-determined, no human vote, but executed off-chain by Gensyn's workflow via Truebit, not on-chain code.**
- URLs:
  - https://github.com/gensyn-ai/delphi-smart-contracts (src/lmsr/gateway/LmsrGateway.sol, src/oracle/TruebitOracleRelayer.sol, src/factory/DelphiFactory.sol)
  - https://github.com/gensyn-ai/gensyn-delphi-sdk (README; src/client/DelphiClient.ts network addresses)
  - https://github.com/gensyn-ai/gensyn-delphi-skills (SKILL.md, reference/markets.md)
  - https://www.theblock.co/post/398419/a16z-crypto-backed-gensyn-launches-delphi-ai-settled-information-markets-platform
  - https://docs.gensyn.ai/tech/ree/supported-models.md
  - https://api.llama.fi/protocol/delphi

## 7. Polymarket Protocol V2 "OracleAggregator"

- **Status:** Not yet the default. Contracts public (Polymarket/polymarket-v2-external, pushed 2026-10-01). Per secondary coverage: canary testing began 2026-10-05, canary markets through 2026-10-30, full switchover for new markets targeted 2026-11-02 (called tentative). Existing CTF markets not migrated.
- **Can third parties plug in arbitrary oracles? NO — permissioned.** `OracleAggregator.initializeRequest(InitParams)` is `onlyOperator`; the operator chooses reporter modules, disputer modules, arbitrator, thresholds, liveness, finalizer. Docs: "Module edits make the operator a fully trusted role: it chooses which arbitrator `resolveResult` accepts calls from and which reporter modules may vote". Admin can `resolveResult()` at any non-Resolved stage ("Admin Override"). `reportResult` requires `_reporterModules[eventId].contains(msg.sender)`. Modules: EOAReporterModule (authorized EOAs), ChainlinkReporterModule (Chainlink Data Streams candle via trusted `priceSource` writer), OOReporterModule (UMA). PositionManager `addModule` is `onlyAdmin`. Architecturally pluggable (a reporter can be code), but only Polymarket operators can plug.
- **Finalize:** `finalize` permissionless if `finalizer` = 0, else gated.
- **Collateral:** new collateral token (pUSD per secondary sources) in PositionManager ERC1155; CLOB exchange; two-sided full collateral.
- **Agent-native:** CLOB clients (TS/Py/Rust v2), unified ts-sdk/py-sdk, polymarket-cli, Polymarket/agent-skills repo.
- **Verdict: NO MATCH on P1/P2 (operator-gated creation and oracle choice; admin override). [P3] yes. [P4] only for operator-configured Chainlink markets.**
- URLs:
  - https://github.com/Polymarket/polymarket-v2-external/blob/main/docs/oracle.md
  - https://github.com/Polymarket/polymarket-v2-external/blob/main/src/oracle/OracleAggregator.sol (initializeRequest L275 onlyOperator; reportResult L425)
  - https://cryptobriefing.com/polymarket-protocol-v2-mainnet-switchover/ (secondary, dates)

## 8. Zeitgeist (Substrate chain, Polkadot)

- **Status:** Chain/app reachable (app.zeitgeist.pm HTTP 200 on 2026-10-21). Repo zeitgeistpm/zeitgeist last commit 2025-12-01, last release v0.6.1 (2025-08-07). Low activity; not in DefiLlama protocols list. pm.wiki (2026-03) flags "Polkadot Ecosystem Decline" risk. Operating status beyond "chain + app up": unverified.
- **Creation:** Permissionless. `create_market(origin, base_asset, creator_fee, oracle: AccountId, period, deadlines, metadata, creation: MarketCreation, market_type, dispute_mechanism: Option<..>, scoring_rule)`; `MarketCreation::Permissionless` reserves a ValidityBond + OracleBond (`Advised` path needs ApproveOrigin).
- **Arbitrary resolver? Partially.** Creator names any `oracle: T::AccountId`. But Zeitgeist runtime has no smart-contract pallet (runtime pallet list has Authorized, Court, GlobalDisputes; no pallet_contracts/EVM found), so the oracle is a signing account (person, bot, multisig), not on-chain code.
- **Resolution:** `report()`; with `dispute_mechanism = None` ("trusted market") `report_and_resolve_market` requires `sender == market.oracle` and resolves directly. With a dispute mechanism: Court (juror voting) / Authorized / GlobalDisputes (token vote). Outsider can report after oracle window (bonded). Admin `admin_move_market_to_resolved` via ResolveOrigin (governance).
- **Collateral:** complete sets (full collateral) in ZTG/other base assets; AMM (neo-swaps/LMSR) or orderbook.
- **Agent-native:** Polkadot.js / zeitgeist SDK (not checked in detail). No MCP found.
- **Verdict: PARTIAL — [P1], [P3], and a weak [P2] (creator picks an arbitrary oracle *account*, but it cannot be on-chain code). Not [P4] (oracle account signs; Court vote on disputes).**
- URLs:
  - https://github.com/zeitgeistpm/zeitgeist/blob/main/zrml/prediction-markets/src/lib.rs (create_market ~L589; report ~L883; report_and_resolve_market ~L3032)
  - https://github.com/zeitgeistpm/zeitgeist/blob/main/runtime/common/src/lib.rs

## 9. Hedgehog Markets (Solana; Eclipse)

- **Status:** Front-end up (hedgehog.markets 200). DefiLlama "Hedgehog Markets" TVL ~ $46K (Solana, Eclipse). On-chain activity low: P2P v2 program `P2PzLraW8YF87BxqZTZ5kgrfvzcrKGPnqUBNhqmcV9B` has only ~101 signatures total, last successful tx 2025-05-12; legacy P2P escrow `Yb4spZYF...R1u` last successful tx 2023-09-14; parimutuel `PARrVs6F...` last successful tx 2026-04-23. (Latest signatures on all programs are failed txs on 2026-07-28 from what looks like a bot.) Effectively dormant as of Oct 2026.
- **Important prior art (contract level):**
  - Legacy `hh-escrow` (2022, mainnet `Yb4spZYFpgad4pDvV1mdU7pFU9vQWNeDS4degy7eR1u`): `initialize_market` is permissionless (any `creator: Signer`), takes `resolver: Pubkey` chosen by the creator, creates **yes/no escrow token accounts** with target `yes_amount`/`no_amount` (two-sided, unfilled -> Invalid refund). `update_state` requires the `resolver` signer; finalization after `resolution_delay` is permissionless ("anyone can trigger an auto-finalize").
  - Because the resolver is just a pubkey, it can be a **PDA of a resolver program**. Hedgehog shipped one: `hyperspace-resolver` (`CyX3buQXyW939M5LReVhPGwcTDoPWMAdArehA2aqVRvP`) which CPI-signs `update_state` with its PDA and decides YES/NO by comparing `current_floor_price >= floor_price`. However `resolve_nft_floor` requires an `authority: Signer` that *supplies* `current_floor_price` (trusted data input, not a trustless on-chain read). 10 NftFloor resolver accounts exist on mainnet; program used 2022-09 to 2023-03.
  - P2P v2 (`hpl_p2p`, 2024): `CreateMarketV1Args { resolver, odds, yesAmount, closeTimestamp, resolveTimestamp, uri }`; takers `CreateUserPositionV1 { noAmount }`; `ResolveV1` requires `resolver` signer; deposits routed through Lulo for yield. In practice all 31 MarketV1 accounts on mainnet share the same resolver `29QXEssDPugoqXh2mBhby1MvmmVneLbtYUNSJUGVSNWH` (a system-owned wallet, i.e. Hedgehog's key), with 6 distinct creators.
- **Product level:** "Versus" UI uses "pre-populated Event cards" (curated events); users set odds/size. Resolution in practice = Hedgehog platform key. Docs have no resolver-selection feature.
- **Agent-native:** hedgehog-program-library JS clients (2024); Blinks. No MCP/agent API found.
- **Verdict: PARTIAL as a product ([P1] for bet creation on curated events, [P3] strong P2P escrow). At the contract level the 2022 escrow had [P1]+[P2]+[P3] and [P4]-capable architecture (resolver = arbitrary program PDA), but the only shipped resolver program relied on a trusted authority's price input, no generic resolver framework was productized, and the venue is now dormant.**
- URLs:
  - https://github.com/Hedgehog-Markets/hedgehog-escrow (programs/hh-escrow/src/instructions/initialize_market.rs, update_state.rs; programs/hyperspace-resolver/src/instructions/resolve_nft_floor.rs)
  - https://github.com/Hedgehog-Markets/hedgehog-program-library (p2p/idl.json)
  - https://hedgehogmarkets.gitbook.io/hedgehog-markets/getting-started/versus-p2p.md
  - Solana RPC checks (getSignaturesForAddress / getProgramAccounts) on the program IDs above

## 10. Thales / Overtime

- **Status:** Live; Thales brand folded into Overtime (governance by $OVER holders per docs). DefiLlama "Overtime" TVL ~ $1.27M; chains Optimism, Arbitrum, Base, Polygon, Ethereum, BNB.
- **Creation:** Sports markets created by the protocol from games fetched from a Chainlink endpoint (TheRundown) and pushed via Merkle roots (Overtime V2). Speed Markets: user picks asset (ETH/BTC), direction, strike time — a fixed menu, not market authoring.
- **Resolution:** Sports: "Chainlink Sports Feeds" / Chainlink nodes. Speed markets: Pyth Benchmarks price feeds. Parameters set by OIP governance.
- **Collateral:** Trader vs protocol AMM; "Liquidity for Speed Markets is provided by the Overtime treasury, which is the sole liquidity provider". Not P2P.
- **Agent-native:** Casino contracts "callable by any wallet: yours, your users', or an AI agent's"; "Build Your Own Speed Markets App" docs; Overtime V2 integration API.
- **Verdict: NO MATCH. (Speed markets have code/price-feed resolution [P4-ish] from a fixed menu; counterparty is the treasury.)**
- URLs:
  - https://docs.overtime.io/learn-about-overtime/market-creation-and-trading.md
  - https://docs.overtime.io/introduction-to-speed-markets.md

## 11. Limitless (Base)

- **Status:** Live on Base (DefiLlama "Limitless Exchange" TVL ~ $354K). Uses Gnosis CTF on Base (`0xC9c98965297Bc527861c898329Ee280632B76e18`) + CTF Exchange v1-v3 + NegRisk.
- **Creation:** Team markets + two kinds of user-generated markets: (a) **price markets** ("BTC above $X by ...") on the CLOB, any signed-in user, daily limit/capacity caps, Pyth-resolved; (b) **custom markets**: user writes question + criteria, funds an AMM pool as sole LP, "Limitless deploys the market on chain", content-screened, unlisted, per-account daily limit. Creation goes through Limitless's backend/wizard, not a permissionless on-chain factory.
- **Resolution:** Pyth (majority, automatic), Chainlink TWAP (5/15-min up/down), sports data APIs (API-Sports, PandaScore), "external venue parity", manual team resolution for admin event markets, and for custom markets the **creator's wallet** reports ("Only that wallet can settle the market"; "Limitless syncs it every 15 minutes"). No creator-chosen resolver contract.
- **CTF caveat:** Anyone could `prepareCondition` on Base CTF with an arbitrary oracle, but Limitless only lists/indexes its own markets.
- **Collateral:** USDC; CLOB with split/merge (full collateral) or creator-funded AMM pool for custom markets.
- **Agent-native:** Strong: official MCP server, "Build a Trading Agent" boilerplate, TS/Python SDKs, REST/WebSocket, programmatic API with scoped tokens and delegated signing.
- **Verdict: PARTIAL — [P3]; [P1] only through Limitless's gated wizard; [P4] only for Pyth/Chainlink menu markets; custom markets are creator-signed (no [P2]).**
- URLs:
  - https://docs.limitless.exchange/user-guide/custom-markets.md
  - https://docs.limitless.exchange/user-guide/user-generated-markets.md
  - https://docs.limitless.exchange/user-guide/market-resolution.md
  - https://docs.limitless.exchange/developers/mcp-server.md

## 12. Myriad Markets (Abstract, Linea, BNB Chain; Polkamarkets stack)

- **Status:** Live (myriad.markets 200; DefiLlama "Myriad Markets" TVL ~ $229K on Abstract, Linea, BNB). Contracts live in Polkamarkets/polkamarkets-js (`IMyriadMarketManager`, `MyriadCTFExchange`, `PredictionMarketV3ManagerCLOB`, `NegRiskAdapter`). Order book on BNB Smart Chain per myriad-cli.
- **Creation:** Permissioned. CLOB manager: `createMarket(params)` requires `registry.hasRole(MARKET_ADMIN_ROLE, msg.sender)`. AMM (PredictionMarketV3_4): requires `allowedManagers[desc.manager]` and `desc.manager.isAllowedToCreateMarket(token, msg.sender)`.
- **Pluggable oracle per market (architecture):** CLOB markets store `market.oracle = params.oracle` (any `IMarketOracle` contract: "Universal interface for pluggable market resolution oracles ... (Realitio, Chainlink price, etc.)"), and `resolveMarket(marketId)` is **permissionless** ("Permissionless resolution via the market's oracle") reading `IMarketOracle.getResult`. But only market admins choose the oracle, and `adminResolveMarket` (RESOLUTION_ADMIN_ROLE) can override. Only `RealitioOracle` is deployed by the repo's DeployOracles script. AMM markets resolve via Reality.eth or `adminResolveMarketOutcome` (manager-allowed).
- **Collateral:** CTF-style full collateral (YES/NO ERC1155) on CLOB; AMM pools.
- **Agent-native:** Strong: `myriad-cli` ("CLI for AI agents ... with MCP support out of the box", `myriad mcp`), BNB Chain skills hub.
- **Verdict: PARTIAL — [P3]; [P4]-capable architecture (per-market oracle contract + permissionless resolve) but [P1] and [P2] are admin-gated and admin override exists.**
- URLs:
  - https://github.com/Polkamarkets/polkamarkets-js/blob/main/contracts/PredictionMarketV3ManagerCLOB.sol (createMarket ~L102; resolveMarket ~L177)
  - https://github.com/Polkamarkets/polkamarkets-js/blob/main/contracts/IMarketOracle.sol
  - https://github.com/MyriadProtocol/myriad-cli

## 13. Manifold (off-chain)

- **Status:** Live, off-chain (play-money mana; API).
- **Creation:** Anyone (account), incl. via API (`/v0/market`). Types: BINARY, FREE_RESPONSE, MULTIPLE_CHOICE, NUMERIC, PSEUDO_NUMERIC, BOUNTIED_QUESTION, POLL, etc. No code-resolved type.
- **Resolution:** Creator (or mods). Automation only via third-party scripts over the API (e.g., ManifoldMarketManager rules, Mirrorbot). Manifold's own market "Will Manifold have automated resolutions before 2027?" (requires a native method such as user-supplied scripts) is open at ~23% on 2026-10-21.
- **Collateral:** AMM (cpmm), off-chain; no escrow on chain.
- **Agent-native:** Public REST API; community MCP servers (e.g., bmorphism/manifold-mcp-server).
- **Verdict: NO MATCH (off-chain; no native code-resolved markets).**
- URLs:
  - https://docs.manifold.markets/api
  - https://manifold.markets/event/will-manifold-have-automated-resolu
  - https://pypi.org/project/manifoldmarketmanager

---

## Cross-cutting prior art for "creator-chosen resolver" (relevant to novelty framing)

1. **Gnosis CTF (2019-) arbitrary `oracle` address.** Any venue built on CTF (Omen/Presagio, Seer, Limitless, legacy Polymarket) inherits the ability for *anyone* to `prepareCondition(oracle = any contract)`. Omen's FPMM factory and subgraph even accept such conditions. But no CTF venue checked exposes this as a product feature; Seer hardwires `realityProxy` as an immutable oracle in its factory.
2. **Hedgehog hh-escrow (2022, Solana).** Permissionless P2P two-sided escrow + creator-chosen `resolver` pubkey + a shipped resolver *program* (hyperspace-resolver) signing via PDA. Closest historical match to the 4-property design at the contract level; but its resolver took a trusted authority's price input, the product used a platform key in practice, and it is dormant.
3. **Myriad/Polkamarkets `IMarketOracle` (2026).** Per-market pluggable oracle contract + permissionless `resolveMarket`, but admin-only creation and admin override.
4. **Polymarket V2 OracleAggregator (canary Oct 2026).** Pluggable reporter/disputer/arbitrator modules (EOA, Chainlink, UMA), operator-only configuration, admin override.
5. **Gensyn Delphi (2026).** Permissionless factory (contract level); creator supplies AI model ID + prompt as the resolution spec; permissionless resolve trigger; settlement by a single platform-owned Truebit relayer running Gensyn's off-chain workflow. Closest live product to "creator-supplied resolution logic, no human vote", but the logic is model+prompt, not code, and the resolver is not creator-selectable.
6. **Hyperliquid HIP-4.** Deployer-signed settlement with validator-slashable stake; permissionless deployment testnet-only.

## Bottom line

No venue checked ships all four properties as a live product as of 2026-10-21. Closest:
- Gensyn Delphi (P1 contract-level, P2 partial: model+prompt, P3 partial: pooled, P4 mostly: AI via platform relayer).
- Hedgehog legacy hh-escrow (contract-level P1+P2+P3 with a program-resolver pattern, 2022; dormant; resolver in practice was a platform key).
- CTF-based venues (Omen especially): arbitrary oracle possible only via the raw primitive, not the product.
Confidence: medium-high for "no live full match"; the weakest links are (a) Delphi's current UI creation policy and whether arbitrary model IDs are accepted (unverified), and (b) whether any obscure Omen/CTF integrator productized custom resolvers (not found).
