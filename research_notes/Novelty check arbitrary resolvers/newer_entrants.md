# Novelty check: newer prediction-market entrants (Sapience, Truemarkets/Trueo, Opinion, predict.fun, Rain)

Date of check: 2026-10-21. Researcher: subagent (Claude). Method: WebSearch (worked this session) for discovery; primary evidence from docs (llms.txt / llms-full.txt / GitHub docs repos), GitHub contract source (cloned), Sourcify-verified source, public RPC reads (eth_getCode / eth_getLogs / eth_getStorageAt), public venue APIs, and the DefiLlama API.

Target combination ("full match"):
1. Permissionless creation
2. Creator-supplied resolution code (arbitrary code, or an arbitrary resolver/oracle address of the creator's choosing; fixed price-feed menus and human/token-vote/committee oracles do NOT count)
3. Two-sided stakes with escrowed collateral (order book, AMM or bilateral matching)
4. Code-determined resolution, triggered permissionlessly, with no human vote in the normal path

Legend: [P1]..[P4] = property satisfied. "unverified" = could not confirm from a primary source.

DefiLlama (api.llama.fi/protocols, fetched 2026-10-21): Rain $16.99M TVL (Arbitrum); Predict Fun $10.87M (Binance, Blast); OPINION $3.09M (Binance); Trueo $1.18M (Base). Sapience not listed.

---

## 1. Sapience (sapience.xyz): the important finding

**Short version:** at the contract level, Sapience's `PredictionMarketEscrow` is a bilateral escrow with a pluggable resolver. Each "pick" names an **arbitrary `conditionResolver` contract address** plus an opaque `bytes conditionId`. There is no allowlist. `settle()` is permissionless and reads the outcome from that resolver contract. At the protocol layer this satisfies all four properties. At the product layer it does not. Sapience curates the questions and ships a fixed set of resolvers (Polymarket mirror via Conditional Tokens and LayerZero, Pyth Lazer, UMA via LayerZero, and an admin "Manual" resolver). On mainnet, nobody has used a third-party resolver.

- **Status/chain:**
  - Original deployment on **Ethereal** (Ethena appchain, chain 5064014; Arbitrum Orbit). Collateral is wUSDe. The escrow `0xe7e515FC1DF93565A47770a4110f4366E26a2D3F` was redeployed on 2026-04-03. On-chain logs (my eth_getLogs scan): about 19.6k events between blocks 4.1M and 5.56M. Activity peaked in Jun–Jul 2026. The **last event was at block 5,562,256 (2026-08-05)**, and there have been none since (current block about 5.649M on 2026-10-20). The Ethereal deployment looks dormant.
  - The current public app repo (`sapiencexyz/sapience`, HEAD 2026-09-08) is now "pinned to the **Robinhood (Meridian) deployment**". It runs on Robinhood Chain mainnet (chain 4663), escrow `0xE4cea507b19796362A5a28Fa7cb705A3F1866213`, through API `api.predict.meridian.xyz`. The Meridian GraphQL API is live: 25 newest conditions were all created on 2026-10-21, **all using resolver `0xE42847…0475` = ConditionalTokensConditionResolver** (the Polymarket mirror). sapience.xyz shows "Trade on Meridian" links.
  - On 2026-08-03, commit `387210281` ("Remove service packages…") **deleted `packages/protocol`, api, relayer and docs from the public repo**. Protocol source is therefore public only in git history. Source for the Robinhood-chain escrow is **unverified** (not on Sourcify). docs.sapience.xyz still serves the old docs.
- **Who can create:** At the contract level, anyone. `mint(MintRequest)` takes `Pick[] picks`, and each pick is `{address conditionResolver; bytes conditionId; OutcomeSide predictedOutcome}`. `_validatePicks` only requires `IConditionResolver(resolver).isValidCondition(conditionId)` to return true, called under try/catch with a 500k gas cap. **There is no resolver allowlist, and no owner gate on mint.** Both parties' EIP-712 or ERC-1271 signatures are required. The off-chain relayer validates only the address *format* of `conditionResolver` (docs table of validation codes; `packages/sdk/auction/validation.ts`), and "the on-chain mint never goes through the relayer". At the product level, the questions (conditions) listed in the app or API are created by Sapience's admin/API. Market makers and vaults only quote on listed conditions.
- **Resolution:** The `IConditionResolver` interface (`isValidCondition`, `getResolution`, `getResolutions`, `isFinalized`) returns outcome vectors `[yes,no]`. `settle(predictionId, refCode)` has no access control. It calls the resolver(s) under try/catch with a gas cap. Code comments say this is to "prevent malicious resolvers from permanently blocking settlement", which shows that arbitrary resolvers are expected by design. Non-decisive outcomes count as a counterparty win. Deployed resolvers:
  - `PythConditionResolver`: `isValidCondition` is `pure`, so any `abi.encode(priceId, endTime, strike, expo, overWinsOnTie)` is valid, and anyone can define a price condition. `settleCondition()` is permissionless and verifies a Pyth Lazer signed update on-chain. This is fully code-determined, but it is a fixed price-feed menu.
  - `ConditionalTokensConditionResolver`: receives Polymarket CTF payouts from Polygon via LayerZero. Final authority is therefore Polymarket's UMA flow.
  - `LZConditionResolver` with `LZConditionResolverUmaSide`: UMA OOv3, `submitAssertion` gated to `_approvedAsserters` (owner-set). Docs: "Prediction markets are settled using UMA… market deployer can submit a resolution… If a dispute is submitted, UMA tokenholders vote."
  - `ManualConditionResolver` (in `resolvers/mocks/`): owner-approved settlers.
  - Docs: "Additional resolver contracts are under development."
- **Empirical check of whether anyone used a custom resolver:** I decoded every `PickConfigCreated` event on the Ethereal escrow (3,292 pick configurations, blocks 4.1M–5.6M). The resolver addresses used were `0xc7A489…` (CT resolver, 7,623 picks), `0x19e34D…` (legacy CT resolver, 62), and `0x49E848…` (Pyth, 1). **There were zero third-party resolvers.**
- **Deployed bytecode check:** I fetched the Ethereal escrow bytecode via RPC. All 40 function selectors from the 2026-03-31 ABI (commit `fcc6b6d5`) are present in the dispatcher, with no unexplained admin functions beyond 2 stray PUSH4/EQ patterns. That source has no resolver allowlist. So the deployed Ethereal escrow very likely matches the audited public source (0xMacro audits phases 1 and 2).
- **Collateral/escrow:** Bilateral RFQ. The predictor broadcasts picks plus stake. Responders (market makers, vaults) sign bids. `mint` pulls collateral from both sides into the escrow and mints fungible predictor and counterparty ERC-20 position tokens per pick configuration (parimutuel within a configuration). Supports multi-leg parlays. There is a secondary-market OTC escrow. Collateral is wUSDe on Ethereal and USDe on Robinhood chain.
- **Agent-native:** Strong. The docs have a "Builder Guide" with Forecasting, Trading and Market-Making **agent** starters, and a hosted agent skill (`sapience.xyz/skill`, for Claude Code, Codex and OpenClaw). There is an ElizaOS plugin (`sapiencexyz/plugin-sapience`), a GraphQL API, a WebSocket auction relayer (open source, self-hostable), and `@sapience/sdk`. Forecasts are attested on-chain via EAS. MCP and x402: not found in the docs (0 mentions).
- **Verdict: PARTIAL at the product level ([P1] only at the contract layer, [P3], and [P4] for the Pyth path). At the CONTRACT level it is effectively a FULL MATCH as a latent capability.** Anyone holding a counterparty signature can open a two-sided escrowed position on a condition resolved by *any* contract they deploy, and settle permissionlessly from that contract's output. What is missing relative to the target: (a) no creator-facing flow, listing or discovery for custom resolvers, and liquidity (vaults and market makers) only quotes curated conditions; (b) the shipped resolvers are a fixed menu, and the dominant one inherits Polymarket/UMA (human vote on dispute); (c) the condition is not a first-class market object, since "creation" equals a signed bilateral mint; (d) the Ethereal deployment has been dormant since 2026-08-05, and the new Robinhood/Meridian deployment's source is not public (unverified).
- URLs:
  - https://docs.sapience.xyz/llms-full.txt (Resolution, Auctions, Trust Model, Contracts & Addresses, Relayer validation)
  - https://github.com/sapiencexyz/sapience/blob/fcc6b6d5969d7b4739f9a9f0c54c03ad154f2a63/packages/protocol/src/PredictionMarketEscrow.sol (`mint`, `_validatePicks`, `settle`, `_resolveBatch`/`_resolveIndividual`)
  - https://github.com/sapiencexyz/sapience/blob/fcc6b6d5969d7b4739f9a9f0c54c03ad154f2a63/packages/protocol/src/interfaces/IConditionResolver.sol
  - https://github.com/sapiencexyz/sapience/blob/fcc6b6d5969d7b4739f9a9f0c54c03ad154f2a63/packages/protocol/src/interfaces/IV2Types.sol (`struct Pick { address conditionResolver; bytes conditionId; … }`)
  - https://github.com/sapiencexyz/sapience/commit/3872102819199bce85aa1e3331c1b683702a52e5 (protocol package removed from public repo, 2026-08-03)
  - https://github.com/sapiencexyz/sapience (HEAD 2026-09-08; README: "Robinhood (Meridian) deployment")
  - https://explorer.ethereal.trade/address/0xe7e515FC1DF93565A47770a4110f4366E26a2D3F
  - https://api.predict.meridian.xyz/graphql (live conditions; resolver field)
  - https://immunefi.com/bug-bounty/sapience/scope (secondary)

## 2. Truemarkets, now Trueo (trueo.com)

- **Identity:** `truemarkets.org` returns **301 to `https://trueo.com/`**. The prediction market was rebranded **Trueo** (TRUE token kept; docs "Trueo"). The company True Markets (truemarkets.co) separately pivoted to "Gateway", a B2B API for fintechs, which is out of scope.
- **Status/chain:** Live on **Base** mainnet. DefiLlama "Trueo" has $1.18M TVL. Contracts: `TruthMarketManager 0x61A98Bef…95d7`, `OracleCouncil 0xCa7Af04B…98BE`, `OracleBonds 0x8175b0A1…baA`, `OrderManager 0x1cdB1C43…1A1a`, TruthMarketV2 mastercopy `0x2CA897F9…3409`. Contracts repo last pushed 2026-07-17; docs repo last pushed 2026-09-24.
- **Who can create:** The UI says "Proposing a market is permissionless". Flow: pick a model (General, Crypto, Grok, Template), and an **AI agent drafts the rules**. An AI evaluator grades your edits. The proposal must meet "Market Integrity Standards". It enters a crowdfunding phase and **graduates** at a funding threshold (5% launch fee). **On-chain, both entry points are role-gated:** `Launchpad.propose(...)` is `onlyRole(LAUNCHPAD_PROPOSER_ROLE)`, and `TruthMarketManager.createMarket*/createMarketV2` are `onlyRole(MARKET_CREATOR_ROLE)`. So user proposals pass through Trueo's backend.
- **Resolution:** Each market stores immutable strings `_marketQuestion`, `_marketSource` and `_additionalInfo`. Any participant can `proposeResolution(market, outcome)` with a bond (250 TYD default). There is a 12h challenge window, then disputes go to **Oracle Council** (5 named humans), then a **TRUE token-holder vote**, then **11 random "Attesters"** (reputation-selected humans). This is the "Truth Oracle" framework. There is no creator-supplied resolver and no code resolution.
- **Collateral/escrow:** Collateral is TYD ("True Yield Dollar"). Each market has YES/NO tokens (split 1 TYD into YES plus NO). Trading runs through a **custom Uniswap v4 hook** (AMM), and there is an on-chain `OrderManager`/`OrderBook`. Cancelled markets redeem at 0.50.
- **Agent-native:** Weak. AI is used for market drafting. The docs say "most low-level resolutions and disputes will be handled by AI agents" (aspirational). I found no public API, MCP, SDK or x402 in the docs.
- **Verdict: PARTIAL, with [P3] only.** [P1] is permissionless at the UI level with a backend gate, but role-gated on-chain. [P2] no. [P4] no (optimistic bond plus a human committee, token vote and attesters).
- URLs:
  - https://trueo.com/ (truemarkets.org redirects here)
  - https://github.com/trueo-protocol/docs/blob/main/docs/proposing-markets.md
  - https://github.com/trueo-protocol/docs/blob/main/docs/resolving-markets.md
  - https://github.com/trueo-protocol/docs/blob/main/docs/optimistic-oracle.md
  - https://github.com/trueo-protocol/docs/blob/main/docs/deployments.md
  - https://github.com/trueo-protocol/trueo-contracts/blob/main/src/Launchpad.sol (`propose … onlyRole(Roles.LAUNCHPAD_PROPOSER_ROLE)`)
  - https://github.com/trueo-protocol/trueo-contracts/blob/main/src/TruthMarketManager.sol (`createMarketV2 … onlyRole(Roles.MARKET_CREATOR_ROLE)`, `proposeResolution`)
  - https://api.llama.fi/protocol/trueo

## 3. Opinion Labs (Opinion / O.LAB, opinion.trade)

- **Status/chain:** Live on **BNB Chain** (chain 56). DefiLlama has $3.09M TVL. The public resolution API shows markets proposed on 2026-10-21 (market IDs around 49k). Collateral is USDT (BSC).
- **Who can create:** Opinion (the operator) creates markets. Contract stack: a Gnosis-CTF fork `ConditionalTokens 0xAD1a38cE…D774` (Sourcify-verified) plus `CTFExchange 0x5f453441…7246` (Sourcify-verified `CTFExecutionEngine`). In the CTF fork, **`prepareCondition(address oracle, bytes32 questionId, uint outcomeSlotCount, IERC20 collateralToken)` is permissionless with an arbitrary oracle address**, and `reportPayouts` is enforced by `msg.sender == oracle`. **However, the exchange's `registerToken(...)` is `onlyOperator`**, and order matching is an off-chain operator CLOB. A user can create a CTF condition with their own oracle contract and split collateral into YES/NO tokens, but it cannot trade on Opinion's venue unless the operator registers it. Marketing says "Opinion AI… assists in the creation of **permissionless markets**". I found no shipped user-creation flow in the docs or API (no create-market endpoint in the OpenAPI paths: /market, /order, /positions, /quoteToken, /resolution/*, /token/*, /trade, /label, /auth).
- **Resolution:** "At present, most markets are resolved through **Opinion AI**, which serves as the primary oracle mechanism." The oracle of record is Opinion's `DisputeResolver` contract (e.g. `0xe19b1645…64a4`, unverified source), with events `ResolutionReceived`, `DisputeFiled`, `DisputeResolved`, `ResolutionFinalized`. There is a dispute window (typically 2h) where anyone can stake OPN (max(1% OI, 1,000 OPN)). A dispute goes to a **"review process"** (opaque, operator-run), and a timeout counts as dispute success. Recurring crypto price markets are "resolved automatically by a price oracle" with no dispute window.
- **Collateral/escrow:** CTF split/merge (USDT to YES/NO ERC-1155). Off-chain CLOB matching with on-chain settlement via the CTF exchange (Polymarket-style). Supports Gnosis Safe.
- **Agent-native:** Moderate. Opinion Open API (REST, API-key), WebSocket, Python and TypeScript CLOB SDKs, "Builder Mode" (create users, place orders for them), Builders Program. GitBook docs expose an agent "ask" endpoint. MCP and x402: not found (0 mentions in llms-full).
- **Verdict: PARTIAL, with [P3] only.** [P1] no (operator-registered markets). [P2] no at the venue level (the raw CTF permits an arbitrary oracle, but such conditions cannot be listed or traded on Opinion). [P4] no (Opinion AI plus operator review; price-oracle path only for operator-created recurring price markets).
- URLs:
  - https://docs.opinion.trade/trade-on-opinion.trade/resolution.md
  - https://docs.opinion.trade/trade-on-opinion.trade/dispute.md
  - https://docs.opinion.trade/developer-guide/opinion-clob-python-sdk/core-concepts/architecture.md
  - https://docs.opinion.trade/developer-guide/opinion-open-api/resolution.md
  - https://openapi.opinion.trade/openapi/resolution/market/49163 (live; disputeResolver address)
  - https://openapi.opinion.trade/openapi/quoteToken (ctfExchangeAddress)
  - https://sourcify.dev/server/v2/contract/56/0xAD1a38cEc043e70E83a3eC30443dB285ED10D774 (CTF, permissionless prepareCondition)
  - https://sourcify.dev/server/v2/contract/56/0x5f45344126d6488025b0b84a3a8189f2487a7246 (`registerToken … onlyOperator`)

## 4. predict.fun

- **Status/chain:** Live on **BNB Chain**. DefiLlama "Predict Fun" has $10.87M TVL across Binance and Blast. It was originally on Blast; current deployed-contracts page lists BNB mainnet only. It acquired Probable in Mar 2026 and is the primary provider for Binance Wallet prediction markets (secondary sources).
- **Who can create:** Team-curated. The technical overview says "Whitelisted requestors for market creation" (UmaCompatibleCtfAdapter), and `NegRiskOperator` is "a permissioned layer for oracle operations". The docs recruit a "Markets Operator" to "draft, review and manage new markets". UMA docs page: the integration "lays the groundwork for **future** features like user-generated markets" (not shipped). On-chain, the CTF fork's `prepareCondition(bytes32 questionId, uint outcomeSlotCount)` makes msg.sender the oracle (permissionless at the raw CTF layer). But `CTFExchange.registerToken` is **`onlyAdmin`** (Sourcify exact match, `0x8BC070BE…B689`), and the CTF has optional `SPLIT_POSITION_ROLE`/`MERGE_POSITIONS_ROLE` gating.
- **Resolution:** "As of March 2026, all new markets on Predict are served by UMA's Optimistic Oracle". Anyone can propose with a bond. If disputed, a second round runs, then a UMA token-holder vote. Recurring up/down price markets use `ChainlinkUpDownAdapter` with Chainlink Data Streams, with reports delivered by the predict.fun backend forwarder or Chainlink CRE, and an admin `emergencyCloseRounds` when paused. The older in-house `UmaCompatibleOptimisticOracle` uses whitelisted proposers with "No bonding or dispute mechanism".
- **Collateral/escrow:** Gnosis-CTF fork (USDT, optionally yield-bearing via Venus) plus Polymarket-style CTFExchange/NegRisk with an off-chain operator CLOB.
- **Agent-native:** Predict API (Beta) at dev.predict.fun (REST, orderbook, deployed contracts). Community SDKs and bots exist. MCP and x402: not found.
- **Verdict: PARTIAL, with [P3] only.** [P1] no. [P2] no. [P4] no (UMA with a human vote on dispute). Chainlink up/down markets are code-resolved, but operator-created and on a fixed feed menu.
- URLs:
  - https://docs.predict.fun/developers/technical-overview.md
  - https://docs.predict.fun/knowledge-base/how-resolution-works-on-predict.md
  - https://docs.predict.fun/developers/chainlink-price-markets.md
  - https://dev.predict.fun/-deployed-contracts-1860295m0.md
  - https://sourcify.dev/server/v2/contract/56/0x8BC070BEdAB741406F4B1Eb65A72bee27894B689 (`registerToken … onlyAdmin`)
  - https://blog.uma.xyz/articles/uma-powers-market-resolution-for-predict-fun-on-bnb-chain

## 5. Rain (rain.one, Arbitrum)

- **Status/chain:** Live on **Arbitrum One**. DefiLlama "Rain" has $16.99M TVL, methodology "TVL includes all markets created on rain.one platform". Collateral is USDT0 or RAIN (factory-allowlisted base tokens). Production factory: proxy `0xA8640B62D755e42C9ed6A86d0fc65CE09e31F264`, implementation `RainDeployer 0x496212cb…7D1A` (Sourcify exact match; implementation slot read via RPC 2026-10-21). Each market is a Diamond with facets (Trading, Resolution, Dispute, Claim…). Facet source was not checked (unverified).
- **Who can create:** **Anyone.** `RainDeployer.createPool(Params)` has no role check. It only requires `tokenData[baseToken].isAllowed` and at least 100 wei of initial liquidity. Docs: "Any user can create a market"; SDK: "permissionless market creation… you never need our approval". Markets can be public or private (private ones require an access code).
- **Resolution:** The creator chooses at creation between **Manual (creator resolves)** and **AI-Powered (Delphi, Olympus AI; 3-of-5 "Explorer Agents" consensus; $1 fee)**. Private markets are always creator-resolved. In the deployed `createPool`, per-pool `resolver` is set to the global owner-set `resolverAI`, and `disputeResolver` to the owner-set `disputeResolverAI`. The `Params.poolResolver` field exists in the struct but is **not used** in `createPool`. For manual pools, the creator (`poolOwner`) decides the winner. `poolOwner` is a free parameter, so in principle a contract could be the creator-resolver. Whether contract callers are accepted, and the exact facet checks, is **unverified** because I didn't read facet source. Disputes: a 15-min to 2-h window with collateral (min(0.1% volume, $1,000)), then **Lex** (AI judge, Olympus AI), then appeal to **"decentralized human oracles"** for a binding decision. This dispute layer can override any creator or AI outcome. There is also a separate "RNG Layer" (Chainlink VRF) for random-outcome markets on a shared pool, which is not creator-defined resolution.
- **Collateral/escrow:** Per-market AMM pool (initial liquidity from the creator, LPs earn 1.2%). Funds are escrowed in the per-market diamond contract. There is a secondary market for options.
- **Agent-native:** Moderate. `@rainprotocolsdk/sdk` / `@buidlrrr/rain-sdk` (TypeScript: create, trade, liquidity, close, choose-winner and resolve tx builders), account abstraction with gas sponsorship (Alchemy), WebSockets, and **agent skills** (`skills/rain-create-market`, `rain-trade`, `rain-data`), with docs pages for Claude Code, Cursor and Windsurf. MCP and x402: not found.
- **Verdict: PARTIAL, with [P1] and [P3].** [P2] no as designed: the choice is creator-as-human-resolver or Rain's AI oracle, and there is no arbitrary resolver contract field in use. Pointing `poolOwner` at a contract is an unverified hack, not a feature. [P4] no: AI oracle or creator, plus Lex AI and human-oracle appeals.
- URLs:
  - https://github.com/rain1-labs/docs/blob/main/Help-Center/Creatingamarket.mdx
  - https://github.com/rain1-labs/docs/blob/main/Help-Center/Publicmarkets.mdx
  - https://github.com/rain1-labs/docs/blob/main/Help-Center/FilingaDispute.mdx
  - https://github.com/rain1-labs/docs/blob/main/For-Developers/Rain-SDK/Creating-a-Market.mdx
  - https://github.com/rain1-labs/rain-sdk (src/tx/CreateMarket/buildCreateMarketRawTx.ts; src/config/environments.ts; skills/)
  - https://sourcify.dev/server/v2/contract/42161/0x496212cb8f1bc189d82D3F96B1477eE17aaE7D1A (RainDeployer.createPool)
  - https://api.llama.fi/protocol/rain

---

## Summary table

| Venue | Status / chain | Creation | Resolution mechanism | Verdict |
|---|---|---|---|---|
| Sapience | Ethereal escrow dormant since 2026-08-05; now powers Meridian on Robinhood Chain (live) | Contract: anyone (two-party signed `mint`, any picks). Product: Sapience-curated questions | Per-pick **arbitrary `IConditionResolver` address**; permissionless `settle()`. Shipped resolvers: Polymarket CTF mirror (UMA), Pyth Lazer, UMA via LZ (approved asserters), admin manual | **Contract level: latent full match. Product level: partial [P1 contract-only, P3, P4 Pyth path]** |
| Truemarkets, now Trueo | Live, Base | UI "permissionless" proposals (AI-drafted, crowdfund graduation); on-chain role-gated | Optimistic bond, then Oracle Council, then TRUE vote, then Attesters | Partial [P3] |
| Opinion | Live, BNB Chain | Operator-only (`registerToken onlyOperator`) | Opinion AI plus OPN-staked dispute, then operator review; price oracle for recurring crypto | Partial [P3] |
| predict.fun | Live, BNB Chain | Team-curated (whitelisted requestors; `registerToken onlyAdmin`) | UMA OO (human vote on dispute); Chainlink Data Streams for up/down | Partial [P3] |
| Rain | Live, Arbitrum ($17M TVL) | Anyone (`createPool` ungated) | Creator (human) or Delphi AI, then Lex AI judge, then human oracles | Partial [P1, P3] |

## Bottom line

None of these five venues ships the full combination as a product. Sapience is the exception that changes the novelty claim. Its audited escrow (deployed on Ethereal, on-chain since early 2026) already implements "two-party escrow with a per-condition arbitrary resolver contract and permissionless settlement". The `IConditionResolver` interface plus `settle()` is essentially a code-resolved conditional contract primitive. What it lacks is the creator-facing "bring your own resolver code" product, discovery and liquidity for such conditions, and any usage of it (0 third-party resolvers in 3,292 pick configurations). The protocol source has also been pulled from the public repo since the Robinhood/Meridian pivot.
