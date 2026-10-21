# On-chain Market & Mechanism Primitives + Cryptoeconomic Security (state as of Oct 2026)

Scope note: research run 2026-10-21. The session's shared web-search budget ran out partway through. Areas researched only partly, or not at all, are listed under each section's Gaps rather than filled from memory. Status tags used: [MAINNET] shipped and live; [ALPHA] live on mainnet in limited or curated form; [TESTNET]; [ANNOUNCED]; [RESEARCH] paper or prototype only; [WOUND DOWN] shut down, stalled, or exiting.

---

## 1. Prediction-market infrastructure in 2026 (Polymarket, Kalshi, Hyperliquid, others; market creation, pricing, resolution)

### Takeaway
Volume is now dominated by regulated, CLOB-based, operator-curated venues. Kalshi has about 75% share and about $60B in face-value volume for Sept 2026. Polymarket's growth is mostly Polymarket US, and it is replacing its 2019-era Gnosis-CTF stack with an upgradeable "Protocol V2" that has an oracle aggregator. Code-resolved (oracle- or TWAP-settled) short-duration markets are the fastest-growing type, and they are where the settlement-timing exploits occurred (Ghost Fills, last-10-second spot manipulation). No major venue lets anyone permissionlessly post a market whose resolver is arbitrary code.

### Cited Findings
**Polymarket: volume, token, V2**
- Polymarket US has traded about $30.2B in 2026 through Oct 20, 2026, with $8.5B so far in October (DeFi Rate tracker, $1 face-value convention) — [DeFi Rate Polymarket US](https://defirate.com/prediction-markets/volume/polymarket-us/). Global Polymarket: about $4.6B in contracts ($2.3B dollars paid) for Sep 10–Oct 9, 2026 — [DeFi Rate Polymarket](https://defirate.com/prediction-markets/volume/polymarket/).
- Market share, Sep 20–Oct 19, 2026: Kalshi about 76% (DeFi Rate) or 75.1% (Prediction News). Polymarket global about 5% and Polymarket US about 12% in one late-Sept/early-Oct window. Another tracker puts Polymarket at 14–16% vs Kalshi at 84–86% through early Sept. Methodologies differ: Kalshi counts $1/contract, Polymarket reports dollars paid — [DeFi Rate Kalshi](https://defirate.com/prediction-markets/volume/kalshi/); [Prediction News](https://predictionnews.com/story/kalshi-volume-surges-but-rivals-gain-market-share); [DeFi Rate weekly report](https://defirate.com/news/sept-28-oct-4-2026-volume-report/).
- Kalshi September 2026: about $60–60.7B face-value volume, a monthly record. Rivals named: Polymarket US, DKeX, Novig. A Macquarie estimate of $20.1B total market volume in Sept 2026 uses a different method and could not be reconciled — [Prediction News](https://predictionnews.com/story/kalshi-volume-surges-but-rivals-gain-market-share); [DeFi Rate Kalshi](https://defirate.com/prediction-markets/volume/kalshi/).
- POLY token: as of Oct 2026 Polymarket has not announced a token or airdrop (the official FAQ reportedly says so). Coverage is speculative and rests mainly on the CMO's 2025 podcast remarks — [Tangem explainer](https://tangem.com/en/learning-hub/post/polymarket-token-launch/); [crypto.news](https://crypto.news/polymarket-hits-aths-in-volume-and-traders-driven-by-poly-token-announcement-and-u-s-re-entry-plans/). An unverified user-posted GitHub "release note" claims $73.3B YTD volume, a $21B valuation, and "IPO vs token" deliberations. It is not credible: no primary source, and its user stats match Oct 2025 — [GitHub release (unreliable)](https://github.com/Ricosworks1/blockchain-payment-flow-analysis/releases/tag/market-update-polymarket-ipo-token-21b-valuation-oct-2026).
- **Protocol V2** [ROLLING OUT]. Testing on a limited set of live markets runs through Oct 30, 2026, with a tentative Nov 2 cutover for new markets. Details:
  - pUSD (USDC-backed 1:1, introduced in an April 2026 exchange upgrade) becomes the sole collateral.
  - One contract holds all position tokens, and one exchange supports multiple market types. This replaces "2019-era code".
  - Contracts are upgradeable via a "secure governance process".
  - A new **OracleAggregator** can plug in UMA, Chainlink, and others.
  - Audits by Cantina, Quantstamp, and Zellic; formal verification by Certora; bounty up to $5M.
  - Designed for cross-chain transfer of positions and outcome data (no chains or dates announced).
  - Existing positions are not migrated.
  — [Cointelegraph, Oct 6 2026](https://cointelegraph.com/news/polymarket-smart-contract-overhaul-protocol-v2). Secondary outlets say V2 consolidates outcome tokens into a single ERC-1155 contract replacing the Gnosis CTF — [Blockonomi](https://blockonomi.com/pusd-to-become-standard-collateral-as-polymarket-deploys-new-framework).
- **Polymarket resolution today**:
  - UMA-resolved markets: proposer posts a bond (typically $750 pUSD) with a 2-hour challenge window. The first dispute (same-size counter-bond) restarts the proposal. A second dispute triggers a 24–48h debate in UMA Discord, then a roughly 48h DVM token-holder vote. Undisputed resolution takes about 2h; disputed takes 4–6 days. The loser forfeits half its bond to the winner. "Too early" or unknown outcomes resolve 50/50 ($0.50 per token). "Clarifications" are posted on-chain via a bulletin-board contract.
  - **Chainlink-TWAP "Up/Down" markets have no proposal or dispute process.** They resolve on start-TWAP vs end-TWAP from the same stream, so they are code-resolved.
  — [Polymarket docs](https://docs.polymarket.com/developers/resolution/UMA)
- Polymarket's CTF mechanics: pUSD splits into YES+NO, merges back, and the winning token redeems for 1 pUSD — [Polymarket docs](https://docs.polymarket.com/trading/ctf/redeem).

**Settlement-timing exploits on Polymarket (the "Ghost Fill" literature)**
- "The Ghosts of Polymarket: When Off-Chain Matches Meet On-Chain Reverts" (Shen, Jin, Wu, Wang, Chen; Sun Yat-sen and Zhejiang Univ.; arXiv 2606.16852, June 15 2026) — [arXiv](https://arxiv.org/html/2606.16852v1):
  - **Root cause**: the CLOB matches off-chain and reports fills right away, then a Polymarket operator later submits `matchOrders` to the CTF Exchange on Polygon. A "Ghost Fill" is an off-chain-reported fill whose on-chain settlement reverts.
  - **Four vectors (35 variants)**: nonce bump (`incrementNonce()`, V1 only); balance drain (move collateral out with higher gas); allowance revoke; and **proxy trap** (the wallet rejects the ERC-1155 receive callback), which dominated after V2.
  - **Scale**: 1,952,440 reverted `matchOrders` txs from 2025-08-15 to 2026-05-06, involving 233,887 participants. 980,133 of these (50.2%) were deliberate "Cancellation Attacks", with about $1.44B of collateral at risk ($1.78B total at risk). Realized attacker profit was at least $1.49M (the conclusion says "at least $2.95M", an internal inconsistency). The operator burned about 2.17M POL (about $212K) in gas. Daily reverts peaked at 8.5%, and over 24.3% of filled orders reverted at peak hours.
  - **5-minute BTC example**: the attacker gets an "Up" order matched near the window's end, sees BTC resolve "Down", then front-runs the pending settlement with a high-gas nonce bump so the losing leg voids at the counterparty's expense.
  - **Mitigations**: V2 cutover on Apr 28 2026 replaced the nonce with a timestamp; attacks spiked the following week via other vectors. A "Deposit Wallet" on May 4 2026, a platform-controlled wallet that revokes users' power to move funds or change allowances before settlement, cut the daily revert rate from about 8% to 0.3% in two days. Attacker blacklisting was also used. The authors say the structural cause remains.
  - **Recommendations**: escrow (lock maker collateral at order placement and match only within locked capacity); shrink the match-to-settlement window; treat CLOB fills as provisional.
  - **Ecosystem exposure**: 167 Polymarket-like forks across 10 chains, holding at least $23M.
- Companion paper "Ghost-Filled Orders: Detecting and Testing Atomicity Violations in Non-Custodial Prediction Markets" (2609.17902) — [Pith](https://pith.science/paper/2609.17902):
  - 97.2% of 1,824,926 reverted settlements trace to preconditions the order owner controls and can flip unilaterally. 6 preconditions are owner-invalidable: nonce, approvals, balances, ERC-1155 receiver hook, and others.
  - All three other audited (unnamed) markets were exploitable. In one, an "anti-latency delay" between fill and settlement made the attack directly profitable.
  - Monitoring and bans only raise costs because fresh wallets are cheap. Jointly controlled deposit wallets weaken non-custodial guarantees.
- **Separate settlement-price manipulation (Stanford/SMU study)**: 821 accounts (about 0.3% of 5-minute BTC traders) made about $8.2M by pushing Binance BTC in the final ~10 seconds before settlement. Polymarket moved 5-minute BTC markets to a **30-second TWAP from Aug 7 (2026)** — [BigGo Finance](https://finance.biggo.com/news/215238d7-38a3-4596-83ff-cfe707267561); [Bitcoin Foundation news](https://bitcoinfoundation.org/news/prediction-markets/polymarket-btc-price-manipulation/); [polymarkets.co.il on the fix](https://polymarkets.co.il/en/news/polymarket-bitcoin-twap-settlement-fix).

**Kalshi on-chain moves**
- Since Dec 1, 2025, Kalshi has offered tokenized versions of "thousands" of its event contracts on Solana. They mirror the off-chain contracts' payouts. DFlow and Jupiter bridge Kalshi's off-chain orderbook to Solana liquidity. The contracts remain under federal (CFTC) oversight — [The Block](https://www.theblock.co/post/380983/kalshi-tokenizes-thousands-of-its-prediction-markets-using-solana); [DeFi Rate](https://defirate.com/news/kalshi-rolls-out-tokenized-version-of-event-contracts-on-solana/).
- Perpetuals:
  - Polymarket announced perps for crypto and stocks on Apr 21 2026 (waitlist; BTC and NVDA first; up to 20x reported) — [CNBC](https://www.cnbc.com/2026/04/21/polymarket-launches-trading-of-heavily-leveraged-perps-contracts.html); [Marketplace](https://www.marketplace.org/story/2026/04/22/kalshi-polymarket-to-start-offering-perpetual-futures-markets).
  - The CFTC approved Kalshi's BTC perpetual on May 29 2026, and it went live June 3. It passed $1B in volume within a week, and its waitlist exceeded 1M — [Axios](https://www.axios.com/2026/05/29/kalshi-perps-perpetual-futures-crypto); [CNBC](https://www.cnbc.com/2026/06/09/kalshi-perpetual-futures-trading-perps-crosses-1-billion-in-volume-within-a-week-of-launch.html).
  - These are perps on financial assets. "Perps on event probabilities" exist mainly in vendor marketing — [Prediction Perps (vendor)](https://prediction.perps.com/).

**Hyperliquid HIP-4 outcome markets** [ALPHA, curated]
- Announced Feb 2 2026; first mainnet market May 2 2026: a recurring daily BTC binary settling at 06:00 UTC to the HyperCore BTC mark price — [CoinGecko](https://www.coingecko.com/learn/hyperliquid-hip3-hip4-tokenized-stocks-and-prediction-markets); [HIP-4 docs](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets).
- Mechanics from the docs:
  - Fully collateralized, no leverage or liquidation.
  - Yes settles to `settleFraction` and No to `1 − settleFraction`.
  - Yes and No books are merged (buy Yes at p equals sell No at 1−p).
  - Split and merge are supported.
  - **Composes with portfolio margin and HyperEVM.**
  - Zero trading fees during testing; builder fees via builder codes.
  - Multi-outcome "Questions" (exactly one outcome settles Yes) are specified but not in the initial release.
  — [HIP-4 docs](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets)
- Phase 1 is curated canonical markets (validators curate). Phase 2 is meant to open permissionless deployment. One secondary source reports 6.05M contracts on day one (unverified) — [Cryptobriefing](https://cryptobriefing.com/hyperliquid-hip-4-outcome-markets/).

**Other venues (partial)**
- **Limitless**: most markets resolve via the Pyth price oracle, with Chainlink Data Streams added in June 2026 for short-duration crypto markets. Sports and politics markets are resolved **manually by the Limitless team** within 24–72h — [PredictionTalk](https://predictiontalk.org/platforms/limitless/).
- **Myriad**: sources conflict. An academic appendix calls it operator-resolved. Other sources describe blended oracles with proofs and disputes — [arXiv 2601.01706](https://arxiv.org/html/2601.01706); [Cournot Protocol on Medium](https://medium.com/@CournotProtocol/the-prediction-market-resolution-landscape-c75b2ea6939a); [FinFeedAPI](https://www.finfeedapi.com/blog/myriad-markets-explained).
- **Seer** (Gnosis ecosystem, continuation of Gnosis/Omen PM): built on the Gnosis CTF. Supports user-created categorical, multi-categorical, scalar, and multi-scalar markets, and escalates disputed answers to Kleros — [Gnosis forum](https://forum.gnosis.io/t/gnosis-chain-is-dying-are-we-going-to-do-something-about-it/12135/6); [NOWNodes listicle (weak)](https://nownodes.io/blog/top-10-crypto-prediction-markets-in-2026/).

**AI agents creating, trading, and resolving markets**
- Trading agents are established. Olas's "Polystrat" agent launched on Polymarket in Feb 2026 and made over 4,200 trades in its first month. Polymarket and Kalshi both offer APIs for programmatic trading — [CoinDesk](https://www.coindesk.com/tech/2026/03/15/ai-agents-are-quietly-rewriting-prediction-market-trading).
- Public (the brokerage) launched AI trading agents with Kalshi. The agent converts a request into fixed rules that the investor must approve — [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/public-brings-ai-trading-agents-113000637.html).
- Meta reportedly plans a prediction-market app that uses Llama to **auto-generate questions from trending topics** [ANNOUNCED/REPORTED] — [NPR, June 24 2026](https://www.npr.org/2026/06/24/nx-s1-5869486/meta-prediction-market-app-ai).
- AI resolution research: "Design and Evaluation of Multi-Agent AI Oracle Systems for Prediction Market Resolution" (Kota, arXiv 2605.30802, May 29 2026) — [arXiv](https://arxiv.org/abs/2605.30802):
  - Tested on 1,189 KalshiBench questions.
  - Independent aggregation with confidence-weighted voting reached 83.43%, versus about 76% for deliberative "debate", which was worse than any single model.
  - Inter-model error correlation was 0.529–0.689.
  - **Auto-resolving only unanimous, high-confidence questions gave 97.87% accuracy on 47% of questions**; the rest are routed to humans.
- "Prediction Arena" benchmarks AI models on real prediction markets — [arXiv 2604.07355](https://arxiv.org/html/2604.07355v1).

**Pricing and AMM designs**
- pm-AMM (Paradigm, Moallemi and Robinson, Nov 2024): an AMM uniform under loss-vs-rebalancing, assuming Gaussian score dynamics. A dynamic variant tightens liquidity toward expiry so expected LVR stays constant — [Paradigm](https://paradigm.xyz/2024/11/pm-amm).
- Follow-on: "Uniform-Loss Automated Market Making for Prediction Markets" (arXiv 2607.17428, 2026) — [arXiv](https://arxiv.org/pdf/2607.17428).
- Fragmentation evidence: "Semantic Non-Fungibility and Violations of the Law of One Price in Prediction Markets" (Gebele and Matthes, arXiv 2601.01706, Jan 2026) — [arXiv](https://arxiv.org/abs/2601.01706):
  - Dataset: over 100,000 events across 10 venues (2018–2025).
  - About 6% of events are listed on multiple platforms.
  - Semantically equivalent markets show **2–4% average execution-aware price deviations**, caused by the lack of shared event identity, including resolution semantics.

### Inferences
- The two documented exploit families map directly onto the user's design. (a) **Settlement atomicity**: off-chain match followed by later on-chain settle opens a gap of time-of-check vs time-of-use. (b) **Resolver-input manipulation**: a single-tick spot price at the deadline is cheap to move. A fully on-chain venue with escrow at posting and atomic take-and-lock removes (a) entirely. (b) needs TWAPs, multi-source medians, or commit windows. Polymarket's own move from end-tick to 30s TWAP is a data point.
- The "proxy trap" vector exists because ERC-1155 `safeTransferFrom` calls the recipient's `onERC1155Received`, and the Gnosis CTF requires recipients to implement it. Any agent-native venue that pushes outcome tokens to agent smart-wallets inherits this. Prefer pull-based claims, or credit internal balances.
- Polymarket's V2 "OracleAggregator" plus "one exchange for many market types" is the closest a major venue has come to pluggable resolvers. It is permissioned and governance-upgradeable, not permissionless code.
- Code-resolved markets already exist and carry the fastest-growing volume (5-minute BTC, HIP-4 daily BTC, Limitless Pyth markets). But only venue operators choose the resolver program, and the resolver is always a price feed. That leaves the niche the user wants open.

### Gaps
- Not checked this session because the search budget ran out: **Drift BET, Azuro, Zeitgeist, Omen/Presagio, Manifold, PredictIt, Thales/Overtime, Hedgehog, Truemarkets, Sapience, Opinion Labs/predict.fun (BNB Chain), Polymarket US relaunch mechanics (QCEX/CFTC path), Kalshi "combos"/parlays.** Current statuses for these are unknown. Several may have stalled or pivoted; Zeitgeist and Hedgehog in particular should be re-checked.
- HIP-3 deployer staking requirements and HIP-4 phase-2 deployer bond/slashing are not in the HIP-4 docs page fetched.
- No primary data on combinatorial-market (combinatorial LMSR) deployments in 2026.
- Polymarket's official token stance is reported second-hand (FAQ not fetched directly).

---

## 2. Futarchy and decision markets (MetaDAO, Butter, Optimism, Gnosis)

### Takeaway
MetaDAO on Solana is the only futarchy at production scale. It has used decision markets mainly as a capital-formation and anti-rug wrapper ("ownership coins"), with $624.7M committed across 23 sales but only $45.4M accepted. Its governance markets are thin: median about 12 traders per decision, and one proposal passed with 2 participants. It announced a reset in Sept 2026. Optimism, Uniswap/Butter, and Gnosis ran advisory or play-money pilots with mixed results. Futarchy works when there is (a) a sponsor paying for the decision and (b) a measurable, manipulation-resistant metric.

### Cited Findings
- **MetaDAO numbers** [MAINNET] — [KuCoin News](https://www.kucoin.com/news/flash/metadao-raises-625m-in-23-sales-faces-challenge-of-filtering-quality-projects):
  - Raises: 23 public sales drew $624.7M in commitments and accepted $45.4M, about 13.8x oversubscribed (the summary paragraph says $454M, which conflicts with the body). Rip Cars (July 2025) targeted $250K and received $32M in commitments; $250K was accepted and the rest refunded. In Credible's sale, 77% of committed capital came from wallets of $100K or more.
  - Permissionless track "Futardio" (futard.io): 9 of 90 launches met minimum threshold; only $568K accepted of $44M subscribed. The "Ownership Score" (July 2026) allocates quota by how early and how long investors committed.
  - Fees and revenue: 0.50% Futarchy AMM fee, routed to the protocol since Dec 22 2025. Quarterly revenue was $1.8M (Q4'25), $556K (Q1'26), and $376.5K (Q2'26); March 2026 was $67K.
  - Treasury about $9.95M; market cap about $109.6M.
  - **Minting new tokens requires a public proposal, a 200,000-META stake, and a 3-day market.**
  - **Median about 12 traders per decision; one September proposal passed with 2 participants; of 51 tokens, 23 had active decision markets, open on 5.4% of days.**
  - Sept 1 2026: "restart" announcement, with an institutional "For Funds" seat.
- DefiLlama Q3 2026 revenue $533.5K; 30-day DEX volume about $29.99M (CoinGecko's 24h figure is much smaller) — [DefiLlama](https://defillama.com/protocol/metadao); [CoinGecko](https://www.coingecko.com/en/exchanges/metadao-futarchy-amm).
- Futardio launched Mar 3 2026 and was renamed **Backable** in Oct 2026. It had $44.2M committed by 2,407 backers (Oct 5 2026), and only 2 of its first 54 projects met goals — [Solana Compass](https://solanacompass.com/news/metadao-renames-futardio-as-backable-its-permissionless-fundraising-platform-on-solana); [Crypto Briefing](https://cryptobriefing.com/futardio-44m-commitments-metadao-sourcing/).
- MetaDAO's model: high-float ICOs. IP, treasury, and mint authority are controlled by "market-driven governance", and insider unlocks are proportional to premium over launch price ("pay-for-performance") — [MetaDAO docs](https://docs.metadao.fi/). Blockworks headline: "MetaDAO eyes a reset" — [Blockworks](https://blockworks.com/news/rangers-ico-metadao).
- **Optimism Futarchy v1** (closed June 12 2025) [COMPLETED, play money] — [Optimism forum](https://gov.optimism.io/t/futarchy-v1-preliminary-findings/10062); [GG Research](https://ggresear.ch/t/futarchy-vs-grants-council-optimisms-futarchy-experiment/57):
  - Design: a futarchy cohort and the Grants Council each picked 5 of 22 projects for 100K OP grants, with Superchain TVL as the metric.
  - Result: the futarchy picks produced about $32.5M more TVL growth. They included the top 2 performers but also the single worst performer.
  - Participation: 430 forecasters after filtering out 4,122 suspected bots; 5,898 trades; 41% of addresses first traded in the final 3 days. Non-transferable play tokens made the sign-up pool sybil-vulnerable.
- **Butter × Uniswap Foundation Conditional Funding Market**: allocated a $100K grant among Unichain lending protocols. Markets closed July 11 (2025) and resolved Aug 10 on realized TVL. Butter published a lessons report — [Uniswap Foundation](https://www.uniswapfoundation.org/blog/conditional-funding-markets-launch-for-unichain-lending-protocols); [Butter on X](https://x.com/butterygg/status/1958830591031615982); [Butter ggresearch repo](https://github.com/buttermarkets/ggresearch).
- **GnosisDAO GIP-145**: a 9-month advisory futarchy pilot by Futarchy Labs, using the Gnosis CTF and running alongside Snapshot with live YES/NO conditional prices per proposal. It passed Feb 16 2026 with $100K temporary GNO+WETH liquidity. Martin Köppelmann: "We are not going all in on futarchy on day 1." — [GnosisDAO Feb 2026 summary](https://gnosisdao.ghost.io/gnosisdao-governance-summary-february-2026/). Seer's price-based futarchy markets are available only on Gnosis Chain — [Seer docs](https://seer-3.gitbook.io/seer-documentation/getting-started/navigate-our-site/futarchy-markets).

### Inferences
- Lessons for a code-resolved venue:
  1. Thin markets are the norm even with real money (about 12 traders per decision). Reflexive "markets about the venue" will be manipulable unless subsidized, or unless the resolver uses long TWAPs.
  2. Massive oversubscription (13.8x) and Futardio's 10% success rate are a **market-for-lemons signal**: curation, not mechanism, decided quality.
  3. Sponsor-subsidized conditional markets (Optimism, Uniswap CFMs) are a working template for "outside money": a sponsor pays for information.
- MetaDAO's "stake 200K META to propose" is a live example of a creator bond gating proposal creation.

### Gaps
- MetaDAO's exact current proposal mechanics (TWAP window, pass threshold) were not retrieved; the docs index page lacked them.
- GnosisDAO pilot results so far (it runs through about Nov 2026) were not found.
- Butter's CFM report contents were not fetched.

---

## 3. Dispute & arbitration systems (UMA, Kleros, Reality.eth, Augur, AI courts)

### Takeaway
Optimistic oracles dominate, and their failure mode is token-weighted capture at the final vote. UMA's March 2025 incident showed a single holder with about 25% of votes. UMA's fix was to curate proposers (whitelists), not to fix voting. Augur has rebooted as a B2B "truth layer" (Lituus) whose general-use launch is not dated. GenLayer is an AI-validator court on testnet targeting mainnet in Q4 2026. Arbitrum BoLD is the production-grade, permissionless dispute game over arbitrary computation, and is the closest thing to "code-resolved disputes".

### Cited Findings
- **UMA Managed Optimistic Oracle v2 / Managed Proposers** (Aug 12 2025) [MAINNET] — [UMA blog](https://blog.uma.xyz/articles/managed-proposers); [The Block](https://www.theblock.co/post/366507/polymarket-uma-oracle-update); [UMA docs](https://docs.uma.xyz/using-uma/proposing-programmatically):
  - Integrations can whitelist proposers; disputes stay open to anyone.
  - Polymarket's criterion: 20+ proposals in 3 months at over 95% accuracy. 37 addresses qualified at launch. A guide site claims 177 by 2026 or by Nov 2025 (timing unclear) — [polymarkets.co.il](https://polymarkets.co.il/en/guide/uma-disputes/).
  - Stats: OO dispute rate about 1.3%; usage up about 500% year-over-year; whitelisted proposers made 96% of proposals with 99.7% accuracy, vs 85.8% for others; 420 unique DVM voters.
  - Motivation: inexperienced users were being encouraged to propose wrong answers that others then disputed for profit.
- **UMA governance attack, March 2025**: a $7M Polymarket market ("Ukraine agrees to Trump mineral deal before April?") resolved YES although no deal occurred. A UMA whale's 3 accounts held about 5M UMA, about 25% of votes. Polymarket called it "unprecedented", gave no refunds ("not a market failure"), and promised monitoring — [The Block](https://www.theblock.co/post/348171/polymarket-says-governance-attack-by-uma-whale-to-hijack-a-bets-resolution-is-unprecedented); [Cointelegraph](https://cointelegraph.com/news/polymarket-trump-ukraine-bet-whale-governance-attack); [Decrypt](https://decrypt.co/311634/polymarket-allegations-oracle-manipulation?amp=1).
- 2026 dispute claims (single, unverified source): more than 1,150 disputed Polymarket markets in the first 5 months of 2026, and about 1 in 5 disputes had a voter with a financial stake in the market. It argues DVM voting-power concentration "can't be fixed by parameter tuning" — [Bitget News](https://www.bitget.com/news/detail/12560605489048).
- **Kleros v2** [MAINNET/BETA on Arbitrum]:
  - Native and exclusive to Arbitrum One; jurors stake PNK. Disputes from other chains are bridged to Arbitrum — [Arbitrum forum](https://forum.arbitrum.foundation/t/introducing-kleros-2-0-beta-decentralized-justice-built-on-arbitrum-one/28136).
  - Certora security review dated Mar 3 2026; multi-round appeals — [Certora](https://www.certora.com/reports/kleros-v2).
  - Self-published claim (April 2026 data): over 900 disputes processed, 800+ jurors, about 150M PNK staked (unverified) — [Steemit analysis](https://www.steemit.com/dao/@flodner/kleros-dao-analysis).
  - Kleros is the escalation court for Seer markets — [Gnosis forum](https://forum.gnosis.io/t/gnosis-chain-is-dying-are-we-going-to-do-something-about-it/12135/6).
- **Augur reboot** (Lituus Foundation):
  - The Lituus oracle whitepaper (Jan 2026) positions it as a shared "truth layer" for prediction markets, DeFi, and cross-chain systems, using algorithmic forks — [The Defiant](https://thedefiant.io/news/defi/augur-reveals-augur-lituus-oracle-whitepaper).
  - Status: Lituus is in development with ChainSafe. The **Moon Fork went live Jul 21 2026**, and Augur v2's fork mechanism completed its first full end-to-end run on Ethereum. REP migration deadline Aug 1; the project also backs "Dark Florist" — [augur.net](https://www.augur.net/).
  - No general-use launch date; a two-month token-migration test was reported Jul 17 2026 — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/).
  - One secondary claim: the new design re-mints and auctions REP after a fork, with attack cost about 134% of FDV vs about 92% before (unverified) — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/).
  - Positioned as B2B: any dApp pays a fee to resolve outcomes — [Crypto Times](https://www.cryptotimes.io/insights/polymarket-vs-kalshi-vs-augur-which-prediction-market-wins-in-2026/).
- **GenLayer** [TESTNET; mainnet targeted Q4 2026] — [Crypto Briefing, Sep 7 2026](https://cryptobriefing.com/genlayer-ai-court-validators/); [GenLayer](https://genlayer.com/); [MetaMask news](https://metamask.io/news/genlayer-internet-court-ai-agent-jury):
  - Architecture: an "Optimistic Democracy" consensus. A random panel of 5 validators, each running a different LLM ("greyboxing"), can escalate to about 1,000. Runs on a zkSync-based L2. "Intelligent Contracts" are written in Python and can read the open web.
  - Cost and speed: about $0.50 per adjudication; verdicts in as little as 30 minutes.
  - Testnet activity: about 70 validators; about 350K tx/day and 20–25K adjudications/day, peak 4,097 rulings in a day.
  - Ecosystem: a 27-firm "Internet Court" consortium (OKX, MetaMask/ConsenSys) formed Jul 10 2026.
  - Markets: an "Intelligent Oracle" is marketed for prediction-market settlement, but no live PM integration was found.
- **Arbitrum BoLD** [MAINNET since Feb 2025]:
  - A permissionless, all-vs-all dispute game over execution, bounded to about one challenge period (about 6.4 days). One honest defender can beat many malicious claims.
  - Replaced allow-listed validation on Arbitrum One and Nova.
  — [Arbitrum docs](https://docs.arbitrum.io/bold/bold-gentle-introduction); [The Block](https://www.theblock.co/post/340278/offchain-labs-releases-arbitrum-bold-on-mainnet-for-permissionless-validation)

### Inferences
- For a venue whose resolver is deterministic code, the "dispute" should not be "what happened?", which needs human or AI judgment. It should be "what does this code output on this input at this state?" That question is answerable by re-execution, a ZK proof, or a BoLD-style bisection game. Human or AI courts (UMA, Kleros, GenLayer) are needed only for **spec disputes**: "the resolver doesn't do what the description says". That is exactly the market-for-lemons problem.
- UMA's experience shows that curating *proposers* reduces noise but does not address *voter* capture. Any token-vote backstop in the user's protocol inherits that ceiling. The arXiv 2605.30802 routing result (auto-resolve only unanimous multi-model verdicts) is a cheaper backstop for natural-language spec disputes.

### Gaps
- **Reality.eth** (bond-doubling escalation with an arbitrator fallback; Omen and Zodiac Reality module) and **Aragon Court** (believed defunct since Aragon's 2023 wind-down): current status and usage were not verified this session.
- No primary 2026 Kleros dispute counts.
- Augur Lituus's full mechanism (fork plus REP auction details) was not retrieved; The Defiant page did not render.
- Truebit (the original "verification game" for off-chain computation) status not checked.

---

## 4. Bonding & slashing in practice (EigenLayer, Symbiotic, Karak, Babylon, Jito); can creator bonds be restaked?

### Takeaway
Programmable slashing is live: EigenLayer since Apr 17 2025 (Operator Sets, Unique Stake), plus **redistributable** slashing (ELIP-006), where slashed funds go to a fixed recipient instead of being burned. That is exactly the primitive needed to compensate counterparties of a malicious resolver. EigenCompute and EigenAI (TEE-based verifiable execution and inference) have been in mainnet alpha since Sep 30 2025. But slashing is barely exercised: no major slash had been confirmed as of mid-2026. TVL figures conflict widely, and Karak appears to have exited restaking.

### Cited Findings
- **EigenLayer slashing** [MAINNET Apr 17 2025] — [Eigen Labs blog](https://www.eigenlabs.org/blog/slashing-goes-live/):
  - AVSs define slashing conditions per Operator Set. **Unique Stake Allocation** earmarks portions of stake so only one AVS can slash that slice.
  - Slashed funds are burned at launch, with "slashing with redistribution" planned.
  - Scale at launch: 40 AVSs on mainnet, 190 in development, 2,000+ operators, 80,000+ staking addresses.
  - Example conditions: LayerZero DVN SLAs; Infura DIN uptime and latency SLAs; a ZK-coprocessor AVS with proof-timing and accuracy conditions.
  - Date conflict: BlockEden and Bex date slashing activation to Apr 17 **2026**. The official Eigen Labs post confirms 2025 — [BlockEden](https://blockeden.xyz/blog/2026/04/18/eigenlayer-avs-slashing-activation-15b-restaking-reality-check/).
- **Redistributable slashing (ELIP-006)** [MAINNET] — [EigenCloud docs](https://docs.eigencloud.xyz/eigenlayer/concepts/slashing/slashing-concept):
  - Introduces Redistributable Operator Sets. The redistribution recipient is fixed when the set is created.
  - **Key risk**: whoever controls both the AVS slashing key and the redistributionRecipient can drain the set's allocated stake.
  - ELIP-016 adds a 7-day delay before slashed shares are cleared.
  - Unique Stake only partially isolates cross-AVS exposure.
- **EigenCompute and EigenAI** [MAINNET ALPHA, Sep 30 2025]: EigenCompute is verifiable code execution, initially in a TEE. EigenAI is a verifiable, OpenAI-API-compatible LLM inference AVS — [SiliconANGLE](https://siliconangle.com/2025/10/01/eigencloud-launches-platform-verifiable-ai-infrastructure/); [EigenCloud on X](https://x.com/eigenlayer/status/1973072142875897971). Recall ran an "Eigen Arena" agent trading competition using EigenAI on Aerodrome — [KuCoin](https://www.kucoin.com/news/flash/recall-launches-first-verifiable-ai-agent-trading-competition-with-eigencloud).
- Slashing events:
  - One guide says zero slashing events through May 2026 — [web3wagmi](https://blog.web3wagmi.com/eigenlayer-guide).
  - An unverified July 27 2026 report claims a misconfigured AVS triggered a slash that cost restakers a haircut — [OBOL news (unverified)](https://obolcryptocoin.com/news/eigenlayer-restaking-slashing-event/).
  - A comparison site says no major slashing event across restaking protocols as of mid-2026 — [Protofire](https://protofire.io/guides/restaking-protocols/).
- **Symbiotic**: slashing framework shipped January 2025. As of mid-2026, mev-commit is one of the few Symbiotic-secured networks with live slashing — [Protofire](https://protofire.io/guides/restaking-protocols/). TVL estimates conflict: about $329M base-layer (DefiLlama, July 2026; about $550M self-reported) vs about $1.6–1.7B elsewhere — [LlamaRisk](https://llamarisk.com/research/current-state-of-symbiotic); [restaking.ink](https://restaking.ink/).
- **Babylon**: BTC-enforced finality-provider slashing; about $3.3B BTC TVL (July 2026 snapshot), or over $4B per another source — [Protofire](https://protofire.io/guides/restaking-protocols/); [Spark comparison](https://www.spark.money/tools/restaking-protocol-comparison).
- **Karak**: reportedly "effectively left restaking (rebranded to OpenGDP)", unconfirmed. TVL estimates range $100M–$740M — [Protofire](https://protofire.io/guides/restaking-protocols/); [Crawlux](https://www.crawlux.com/compare/symbiotic-vs-karak/).
- EigenLayer TVL estimates range from about $5B (DefiLlama, July 2026) to over $15B — [Protofire](https://protofire.io/guides/restaking-protocols/); [BlockEden](https://blockeden.xyz/blog/2026/04/18/eigenlayer-avs-slashing-activation-15b-restaking-reality-check/).
- **MetaDAO** gates proposals with a 200K-META stake — [KuCoin](https://www.kucoin.com/news/flash/metadao-raises-625m-in-23-sales-faces-challenge-of-filtering-quality-projects). **UMA and Polymarket** use $750 symmetric proposer/disputer bonds with a 50% forfeit to the winner — [Polymarket docs](https://docs.polymarket.com/developers/resolution/UMA).

### Inferences
- **Could a creator bond be secured by restaked collateral?** Technically yes, today. A "Resolver Underwriter" AVS would work like this:
  - It creates a Redistributable Operator Set whose slashing condition is "a resolver this operator underwrote was proven to deviate from its declared spec", for example via a successful meta-bounty (see §8).
  - The redistributionRecipient is the market's escrow, which pays harmed takers.
  - Operators (or creators themselves) allocate Unique Stake to it.
  - This turns the creator bond into **underwriting capital supplied by third parties who earn a fee for vouching for resolvers**, a direct anti-lemons mechanism.
  - Caveats: the redistribution-key risk, the 7-day clearing delay (bad for short markets), and a slashing track record that is essentially untested.
- EigenCompute (TEE) is a candidate way to run "hidden test" resolvers without revealing tests. The trust assumption is TEE integrity, not math.

### Gaps
- **Jito (Solana) restaking** and its slashing status: not researched (search budget).
- Number of redistributable operator sets in production and any actual redistribution events: not found.
- The ambiguous claim that "less than 1% of [some] assets remain restaked with EigenLayer, down from about 50% in early 2026" could not be attributed or verified; excluded.

---

## 5. On-chain bug bounty / exploit-proof systems and the AI-slop problem

### Takeaway
Bounty markets are consolidating and being reshaped by AI on both sides:
- Code4rena wound down in May 2026 and Immunefi absorbed its clients.
- curl killed its bounty in Jan 2026 over AI-generated junk; its confirmed-vulnerability rate fell below 5%.
- Frontier AI agents now generate working exploits for about 51% of historically exploited contracts in simulation.
- SEAL Safe Harbor standardizes a 10% bounty on rescued funds.
- **No production system verifies an exploit proof and pays out automatically.** ZK proof-of-exploit exists only as research or hackathon code. This is the clearest unoccupied niche relevant to "existence-proof bounties".

### Cited Findings
- **curl** ended its HackerOne bounty on Jan 31 2026:
  - The confirmed-vulnerability rate fell below 5%, from over 15% in earlier years. In one week, 7 reports arrived in 16 hours and none were real.
  - Since 2019 it paid over $100K for 87 confirmed vulnerabilities.
  - Reports now go to GitHub with no reward, explicitly to remove the incentive for low-effort and AI reports.
  — [Daniel Stenberg's blog](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/); [BleepingComputer](https://bleepingcomputer.com/news/security/curl-ending-bug-bounty-program-after-flood-of-ai-slop-reports/)
- A secondary blog claims HackerOne's Internet Bug Bounty paused new submissions on Mar 27 2026 (unverified) — [Pinggy blog](https://pinggy.io/blog/curl_ai_slop_summer_of_bliss/).
- **Code4rena** [WOUND DOWN] announced its wind-down on May 13 2026. Immunefi is absorbing its bug-bounty customers and researchers, and open contests are being completed. Background: Zellic acquired Code4rena in 2024, and Code4rena raised $6M from Paradigm in 2023 — [The Block](https://www.theblock.co/post/401179/immufefi-absorb-code4rena-bug-bounty-customers-shutdown-decision).
- **Immunefi H1 2026**: about $972M lost across 207 hacks, a record count. Immunefi paid researchers about $13.45M for 837 valid bugs — [The Block](https://www.theblock.co/post/407707/crypto-hack-losses-fall-below-1-billion-in-h1-2026-even-as-attack-volume-hits-record-immunefi); [KuCoin](https://www.kucoin.com/news/flash/immunefi-report-207-hacks-in-h1-2026-cost-crypto-industry-972m).
- **AI policy on audit platforms** (single-source snapshot dated Oct 15 2026) — [munimtechnologies/audit-contest-ai-rules](https://github.com/munimtechnologies/audit-contest-ai-rules):
  - Sherlock's "Audit Engine" is invite-based and explicitly welcomes AI auditors. It requires KYC, at least 2 valid findings, and a 20% valid ratio, and pays USDC on Polygon or RLUSD on XRPL. No classic Sherlock contest was active on Oct 15; the last started Jul 20 2026.
  - Cantina allows AI-generated findings only if validated; unvalidated AI submissions can lead to disqualification or a permanent ban. Live contest: Revert v4lend, $50K, Oct 6–Nov 3.
- **SEAL Safe Harbor** (whitehat rescue framework):
  - Standard terms: return rescued funds within 72h to an official recovery address for a bounty of 10% of recovered funds, capped at $1M per incident; KYC and OFAC checks required — [Bitget summary](https://www.bitget.site/news/detail/12560604995928).
  - Adoption: 29 organizations signed on Oct 1 2025 — [Cointelegraph](https://cointelegraph.com/news/white-hat-hackers-saved-billions-crypto-seal-safe-harbor). Uniswap governance proposal: 10% capped at $2.25M — [Uniswap vote](https://vote.uniswapfoundation.org/proposals/79). 1inch: 10% capped at $500K, pro-rata among whitehats — [1inch forum](https://gov.1inch.network/t/1ip-104-adopt-the-seal-safe-harbor-agreement/959).
  - Immunefi's version: rescued funds go to a protocol-controlled **Immunefi Vault**; failing to deposit everything within 6 hours is a "material and uncurable breach" — [Immunefi Origin Safe Harbor](https://immunefi.com/bug-bounty/originprotocol/safe-harbor/).
- **Hats Finance** is described in a May 2026 review as an on-chain, vault-funded bounty platform. Its current activity is unverified (its homepage returned no content) — [m3dython review](https://m3dython.com/blog/immunefi-review-2026).
- **Anthropic SCONE-bench** (Dec 2025) — [Anthropic research](https://www.anthropic.com/research/smart-contracts); [red.anthropic.com](https://red.anthropic.com/2025/smart-contracts/):
  - Benchmark: 405 really-exploited contracts (2020–2025; Ethereum, BSC, Base), drawn from DefiHackLabs. Agents run in Docker against a **local fork at the exploit block**.
  - Results: 10 models (Best@8) produced working exploits for 207 (51.11%), worth $550.1M simulated. On post-cutoff contracts, Opus 4.5, Sonnet 4.5, and GPT-5 exploited 19 (55.8%), worth $4.6M. Post-cutoff success rose from about 2% to 55.88% in a year, and exploit revenue doubled every about 1.3 months.
  - Zero-day scan: 2,849 fresh BSC contracts yielded 2 novel zero-days worth $3,694, at a GPT-5 API cost of $3,476. One was later exploited by a real attacker (about $1K).
  - GPT-5 economics: about $1.22 per run, about $1,738 per vulnerable contract found, about $1,847 revenue per exploit.
  - Exploit value tracks assets at risk, not code complexity.
- **Proof-of-exploit verifiers** [RESEARCH only]:
  - "A Framework for Zero-Knowledge Proofs of Exploits in Solidity Smart Contracts" (zkpoex): replays the exploit transaction in the RISC Zero zkVM to produce a SNARK that the contract can be breached, without revealing how. It pitches automatic bounty agreements — [ACM DOI](https://doi.org/10.1145/3748522.3779811).
  - PoPETs 2023: ZK proofs of exploitability on real processors (Microcorruption CTF) — [PoPETs](https://petsymposium.org/popets/2023/popets-2023-0036.pdf).
  - A Midnight hackathon project: hunters prove "at least N paid findings" in ZK; payout is atomic with vendor acceptance; disputes go to a GenLayer jury — [GitHub jenzylove/exploit](https://github.com/jenzylove/exploit).
  - A commit-reveal ZK disclosure proposal (single author, undeployed) — [dev.to](https://dev.to/ar1as1/zkegolddev-zk-exploit-disclosure-protocol-on-ethereum-o7d).
  - EvoPoC: automated DeFi exploit synthesis — [arXiv 2605.02868](https://arxiv.org/pdf/2605.02868).
  - The search found **no audited, production deployment combining exploit-proof verification with automated on-chain payout.**
- Polymarket V2 offers bounties up to $5M — [Cointelegraph](https://cointelegraph.com/news/polymarket-smart-contract-overhaul-protocol-v2).

### Inferences
- The AI-slop crisis and AI exploit capability point the same way. **Human-triaged bounties are breaking under AI submission volume, while machine-checkable exploit proofs are becoming cheap to produce.** A bounty whose resolver is a program (fork at block N, run the submitted tx or calldata, check an invariant or balance delta) needs no triage. It is immune to slop by construction, because invalid submissions just fail and can be made to cost a submission bond. SCONE-bench's harness (fork at the exploit block, then measure the balance delta) is essentially a reference resolver for "there exists an input that breaks contract X".
- The economics also work. GPT-5 found exploitable contracts at about $1.7K each against about $1.8K average value, so a standing on-chain "exploit-me" bounty with automatic payout prices security at the attacker's marginal cost. Immunefi's $13.45M per half-year is the scale of existing outside money willing to pay for this.
- Private-exploit payout ordering matters: proof first, reveal later (zkpoex), or a TEE-run resolver. Otherwise the submission itself leaks the exploit to front-runners.

### Gaps
- No 2026 data on Spearbit/Cantina payouts, Immunefi Vault TVL, or Attackathon formats.
- Hats Finance status unconfirmed.
- No staked-submission bounty platform (submitter posts a bond forfeited on invalid reports) was found in this session's searches. Whether one exists remains unknown, not confirmed absent.
- Paradigm CTF / Capture the Ether / Ethernaut-style wagers: not researched.

---

## 6. Agent competitions with money at stake (Recall, Alpha Arena, Bittensor, Numerai, Freysa)

### Takeaway
Paid agent competitions exist in three shapes:
1. **Benchmark leagues** with sponsor prize pools (Recall, Nof1 Alpha Arena).
2. **Continuous emission markets** where validator code scores miners (Bittensor subnets such as Ridges SN62), which are heavily gamed: 67 of 128 subnets burn 99%+ of incentives.
3. **Stake-on-your-model** with burn-on-failure (Numerai, about $700M AUM fund).

Freysa (Nov 2024) is the canonical "adversarial agent bounty". It was pay-to-play with an escalating fee, resolved by a code path (an LLM calling `approveTransfer`), and won after 482 attempts for about $47K.

### Cited Findings
- **Recall Network**: a decentralized competition network for AI agents.
  - "EVM week" arena, Nov 2025: 40,000 RECALL pool. "Single Asset Trading on Aerodrome": 10,000 RECALL per week. "Eigen Arena": verifiable via EigenAI.
  - 2026 expansion was announced without specifics.
  — [CoinMarketCap](https://coinmarketcap.com/cmc-ai/recall-network/latest-updates/); [Recall app](https://app.recall.network/competitions); [KuCoin](https://www.kucoin.com/news/flash/recall-launches-first-verifiable-ai-agent-trading-competition-with-eigencloud)
- **Alpha Arena (Nof1.ai)**: launched Oct 2025. Each model gets $10K of real capital. Season 1 traded crypto perps; Season 1.5 traded stocks and an index — [Grokipedia (weak)](https://grokipedia.com/page/Alpha_Arena_AI_Trading_Competition). A weak-source report says all eight major models posted losses from overtrading — [BigGo Finance](https://finance.biggo.com/news/5BSX_Z0BaoGGrU-ID27J). Not to be confused with Crypto.com's "Alpha Arena" volume campaign (Oct 16–Nov 16 2026, $10K USDC) — [Crypto.com](https://crypto.com/en/events/x-alpha-arena).
- **Bittensor**:
  - dTAO went live Feb 2025: each subnet token is paired with TAO in an AMM — [Backpack Learn](https://learn.backpack.exchange/zh-tw/articles/what-is-bittensor-tao).
  - Since Nov 2025, "Taoflow" emissions are based on net TAO inflow rather than alpha price. Previously dominant subnets (Ridges, Gradients, Hippius, Dippy) risked 0% emissions — [Macrocosmos](https://macrocosmosai.substack.com/p/from-tao-price-to-flow-emissions).
  - Daily issuance was halved Dec 2025 from 7,200 to 3,600 TAO — [Backpack Learn](https://learn.backpack.exchange/zh-tw/articles/what-is-bittensor-tao).
  - **As of Apr 16 2026, 67 of 128 subnets burned 99%+ of miner incentives; only 20 burned 0%**, because burning reduces sell outflow under Taoflow — [FalconX](https://falconx.io/newsroom/state-of-bittensor-subnet-adoption-trends-network-mechanics-and-covenants-departure).
  - Ridges (SN62) is a marketplace where miners' SWE agents compete on coding tasks such as fixing regressions or writing tests — [Alea Research](https://alearesearch.substack.com/p/bittensor-subnets-how-they-work-and). A promotional claim that it beats Claude is unverified — [TAO Explained](https://taoexplained.substack.com/p/the-big-five-top-bittensor-subnets).
- **Numerai** — [OneKey deep dive](https://onekey.so/blog/ecosystem/nmr-deep-dive-token-fundamentals-recent-developments-and-possible-future-trajectories); [Kraken Learn](https://www.kraken.com/gb/learn/what-is-numeraire-nmr):
  - Mechanism: a weekly tournament; data scientists stake NMR on models, are paid for accuracy, and have stakes burned for poor performance.
  - Funding: $30M Series C at $500M valuation (Nov 20 2025).
  - Fund AUM about $700M by July 2026, up from about $560M at end-2025.
  - $3.2M NMR buybacks through Jul 17 2026.
- **Freysa** (Nov 2024) — [The Decoder](https://the-decoder.com/hacker-wins-47000-by-tricking-ai-chatbot-with-smart-prompting/); [OECD AI incident](https://oecd.ai/en/incidents/2024-11-29-2e31); [The Block](https://www.theblock.co/amp/post/328659/players-are-trying-to-convince-this-ai-to-hand-over-her-40000-crypto-stash):
  - Pay-to-play: fees rose from $10 to $4,500 per message; 70% of fees went to the pool and 30% to the developer.
  - Won by "p0pular.eth" on attempt 482 (195 participants). The winner convinced the bot that `approveTransfer` handled incoming funds and received 13.19 ETH (about $47K).

### Inferences
- Bittensor is the largest live experiment in "the scoring code decides payout". Its pathology (validators and owners tuning or burning incentives, emission games) is a preview of resolver-design games in the user's protocol. The scorer is a governance-controlled moving target, unlike an immutable resolver committed at market creation.
- Numerai is the cleanest "outside money" template: a party who values the signal (a hedge fund) subsidizes a stake-and-burn tournament. "This code passes hidden tests" challenges need an analogous buyer: a company that pays for code, as in Ridges-style procurement.
- Freysa demonstrates that escalating entry fees plus a code-checked win condition self-fund an adversarial bounty. That is a direct template for "jailbreak my agent" or "beat my agent" markets, with an escalating fee curve in place of a counterparty stake.

### Gaps
- Gensyn (RL Swarm / mainnet), Kaggle-like on-chain contests, AI poker or arena wagers, and Alpha Arena Season 2: not researched (search budget).
- No current Ridges emissions or benchmark data.
- Recall's 2026 status (token, pivot) only partially covered.

---

## 7. Autonomous worlds / on-chain games as resolver substrate

### Takeaway
The flagship EVM autonomous-world stack is gone. **Lattice is winding down, and Redstone was scheduled to shut down May 15 2026.** MUD is "feature complete" and open source, and DUST moved to its own Conduit-hosted chain. Dojo/Starknet (Cartridge) remains the active fully-on-chain game ecosystem (Loot Survivor 2, Budokan tournaments, Eternum). Deterministic on-chain game engines are a viable resolver substrate, but this history shows substrate risk.

### Cited Findings
- Lattice: "After five years, Lattice is winding down. Redstone shuts down May 15, 2026 (23:59 UTC)." An L1 withdrawal contract is provided for EOA balances. Lattice said it never made Redstone a sustainable business — [Lattice on X](https://x.com/latticexyz/status/2044103611072835744); [BingX flash](https://bingx.com/en/flash-news/post/lattice-to-shut-down-redstone-network-on-may-at-utc-users-told-to-withdraw-funds).
  - MUD is "feature complete, OpenZeppelin-audited, fully open source", with a world-migration tool between chains.
  - DUST migrated to the DUST Chain (Conduit-hosted, Optimism Foundation-supported); team members continue via 0xPARC — [Lattice on X](https://x.com/latticexyz/status/2044103611072835744).
- Cartridge and Dojo: Dojo is an open-source framework for provable on-chain games on Starknet. v1.0 shipped alongside Cartridge's $7.5M Series A led by BITKRAFT (Aug 2024). Games include Loot Survivor, Eternum, Paved, and Dope Wars — [press release](https://pressreleases.triplepointpr.com/2024/08/05/cartridge-raises-series-a-funding-round-led-by-bitkraft-ventures-to-accelerate-onchain-game-development); [Starknet blog](https://www.starknet.io/blog/lessons-from-the-dojo-a-striking-conversation-with-cartridge/).
- Loot Survivor 2 runs fully on Starknet via Dojo with Cartridge Controller. Provable Games' **Budokan** platform runs on-chain tournaments on LS2. About 2.26M SURVIVOR in season rewards (about Oct 2025) — [Bankless](https://www.bankless.com/es/read/starknets-newest-onchain-rpg-ls2).

### Inferences
- "My agent beats yours" is cleanly code-resolvable when the game is a deterministic state machine. Budokan-style tournaments on LS2 are close prior art: on-chain tournaments with prizes resolved by on-chain game state.
- Given Redstone's shutdown, the user should not depend on an external world staying alive through a market's deadline. Better options: (a) embed the game engine inside the resolver (pure function over move logs), or (b) resolve against a ZK-provable state commitment (Dojo's "provable games" angle).

### Gaps
- Dark Forest (zk fog-of-war), Primodium, Paima, and on-chain chess engines: current status not retrieved (search budget). Dojo and Starknet 2026 status is also unverified; the sources found are 2024–2025.

---

## 8. Composability of market outcomes (derivatives, leverage, lending, cross-market references)

### Takeaway
Outcome tokens are becoming collateral (PredMart on Polygon; a Morpho prototype at 77% LLTV) and margin (HIP-4 composes with portfolio margin and HyperEVM). The Gnosis CTF natively supports **nested positions across multiple conditions**, so composite and combinatorial markets are a primitive the CTF already has. Cross-venue composition is blocked by "semantic non-fungibility": only 6% of events overlap across venues, with 2–4% persistent price gaps. Polymarket is moving off the Gnosis CTF to its own V2 position contract.

### Cited Findings
- **PredMart**: a non-custodial lending protocol on Polygon for Polymarket outcome shares. Lenders supply USDC; collateral limits scale with share price; a "depth gate" caps borrowing by order-book liquidity. Described as live — [Paragraph](https://paragraph.com/@vska/predmart-lending-protocol-for-polymarket).
- A Morpho Blue prototype wraps CTF ERC-1155 positions as ERC-20 and borrows USDC at 77% LLTV. Test project only — [GitHub](https://github.com/mcmoodoo/leveraged-prediction-positions).
- **Gnosis CTF mechanics** — [CTF developer guide](https://github.com/gnosis/conditional-tokens-contracts/blob/master/docs/developer-guide.rst):
  - `prepareCondition(oracle, questionId, outcomeSlotCount)`. **The oracle is just an address that calls `reportPayouts` with a payout vector**; scalar outcomes are supported, e.g. [9/10, 1/10].
  - Outcome collections are index-set bitmasks. Collection IDs from different conditions combine by elliptic-curve point addition into **"deeper" positions**, e.g. `$:(A|B)&(LO)`, whose value is the product of their collections' values.
  - `splitPosition` / `mergePositions` / `redeemPositions` over ERC-1155. **Contract recipients must implement `ERC1155TokenReceiver`.**
- Polymarket V2 is designed for cross-chain transfer of positions and outcome data, with an OracleAggregator — [Cointelegraph](https://cointelegraph.com/news/polymarket-smart-contract-overhaul-protocol-v2).
- HIP-4 outcomes compose with portfolio margin and HyperEVM; split/merge supported — [HIP-4 docs](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets).
- Kalshi outcome tokens are on Solana via DFlow and Jupiter — [The Block](https://www.theblock.co/post/380983/kalshi-tokenizes-thousands-of-its-prediction-markets-using-solana).
- Cross-venue fragmentation: about 6% overlap and 2–4% price deviations — [arXiv 2601.01706](https://arxiv.org/abs/2601.01706).

### Inferences
- Because a CTF "oracle" is just an address calling `reportPayouts`, **a resolver contract can itself be the oracle**. A composite market's resolver can read other conditions' payout vectors (`payoutNumerators`) and compute its own. This is native, deterministic market-of-markets composition with no new token standard. The user's protocol could adopt CTF semantics, or something compatible, to get split/merge/deep positions and lending integrations (PredMart-style) for free. Since Polymarket is leaving the CTF, it is no longer a de facto standard, though Seer/Gnosis still use it.
- A semantic-identity layer (content-addressed resolver bytecode plus parameters plus deadline block) solves non-fungibility by construction for code-resolved markets. Two markets with the same resolver hash and inputs *are* the same event, so liquidity can pool.

### Gaps
- No data found on derivatives that pay off on *other* markets' outcomes in production (e.g., options on Polymarket probabilities), Kalshi combos, or on-chain parlays. Not researched due to search budget.

---

## 9. Closest prior art to "permissionless code-resolved conditional contracts" and what is unoccupied

### Takeaway
Every ingredient exists somewhere:
- Code-resolved settlement: Polymarket Chainlink-TWAP markets, HIP-4, Limitless/Pyth.
- Permissionless creation: Seer, MetaDAO proposals, CTF `prepareCondition`.
- Stake-on-performance: Numerai, Bittensor.
- Adversarial code-checked bounties: Freysa, SCONE-bench harness, zkpoex.
- Disputes over computation: Arbitrum BoLD.
- AI adjudication: GenLayer.
- Programmable slashing with redistribution: EigenLayer ELIP-006.

**No live system combines** permissionless creation, an *arbitrary* creator-supplied resolver program, bilateral stake matching aimed at agents, and machine-verifiable existence-proof claims. Also unoccupied: production proof-of-exploit auto-payout, and resolver-quality underwriting (anti-lemons).

### Cited Findings
- Closest by component:
  - **Gnosis CTF**: any address can be the oracle; arbitrary conditions; nested positions. It is a generic substrate rather than a venue, and its oracle is usually a human-dispute system — [CTF dev guide](https://github.com/gnosis/conditional-tokens-contracts/blob/master/docs/developer-guide.rst).
  - **Polymarket Chainlink-TWAP Up/Down markets**: resolved purely by code with no dispute, but only operator-created and only price feeds — [Polymarket docs](https://docs.polymarket.com/developers/resolution/UMA).
  - **HIP-4**: oracle-settled outcomes on HyperCore; curated now, with permissionless deployment planned for phase 2 — [Cryptobriefing](https://cryptobriefing.com/hyperliquid-hip-4-outcome-markets/).
  - **Arbitrum BoLD**: permissionless all-vs-all dispute game over arbitrary execution — [Arbitrum docs](https://docs.arbitrum.io/bold/bold-gentle-introduction).
  - **GenLayer Intelligent Contracts**: Python contracts adjudicated by multi-LLM validators; testnet, mainnet target Q4 2026 — [Crypto Briefing](https://cryptobriefing.com/genlayer-ai-court-validators/).
  - **zkpoex**: ZK proof that an exploit exists, pitched for automatic bounty agreements; research only — [ACM](https://doi.org/10.1145/3748522.3779811).
  - **SCONE-bench harness**: fork-at-block exploit verification; simulation only — [Anthropic](https://www.anthropic.com/research/smart-contracts).
  - **Freysa**: code-checked adversarial agent bounty — [The Decoder](https://the-decoder.com/hacker-wins-47000-by-tricking-ai-chatbot-with-smart-prompting/).
  - **Bittensor subnets**: validator code scores agents, paid by emissions — [FalconX](https://falconx.io/newsroom/state-of-bittensor-subnet-adoption-trends-network-mechanics-and-covenants-departure).
  - **Numerai**: stake-and-burn on model performance — [Kraken](https://www.kraken.com/gb/learn/what-is-numeraire-nmr).
  - **Budokan on Loot Survivor 2**: on-chain game tournaments — [Bankless](https://www.bankless.com/es/read/starknets-newest-onchain-rpg-ls2).
  - **MetaDAO**: TWAP-resolved conditional markets with a 200K-META proposer stake — [KuCoin](https://www.kucoin.com/news/flash/metadao-raises-625m-in-23-sales-faces-challenge-of-filtering-quality-projects).
  - **Augur Lituus**: aims to be a shared resolution layer, with no general-use date — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/).
- Unoccupied, by absence in this session's searches:
  - No production exploit-proof-and-auto-pay system — [search summary of zkpoex/Midnight/dev.to projects](https://github.com/jenzylove/exploit).
  - No live PM integration of GenLayer's oracle found — [Crypto Briefing](https://cryptobriefing.com/genlayer-ai-court-validators/).
  - No platform found where AI agents both create and resolve markets without humans — [CoinDesk](https://www.coindesk.com/tech/2026/03/15/ai-agents-are-quietly-rewriting-prediction-market-trading).

### Inferences
- **Genuinely unoccupied:**
  1. Permissionless markets whose resolver is creator-supplied arbitrary code, with **resolver bytecode hash as event identity**.
  2. **Existence-claim markets** ("∃ input such that P(input)") where the taker wins by submitting a witness the resolver checks. Bounties are only one-sided, sponsor-funded instances of this. A *two-sided* version, where the creator stakes "no such input exists" and the market prices that probability, does not exist.
  3. **Resolver underwriting / insurance** against creator manipulation, slashable via redistributable restaking.
  4. **Atomic, escrow-first agent-to-agent matching**: the exact fix for Ghost Fills.
  5. **Hidden-test challenges with verifiable confidentiality** (TEE/ZK). Bittensor/Ridges do hidden evaluation but with trusted validators.
- **Partially occupied / crowded:** price-feed binaries (Polymarket, HIP-4, Limitless, Kalshi), human-judgment event markets, sponsor-funded audit contests (consolidating: C4 dead, Sherlock contests idle).

### Gaps
- Could not check whether any 2026 entrant (e.g., Sapience, Truemarkets, Opinion Labs, or newer agent-native PMs) has shipped arbitrary-resolver markets; search budget ran out. **This is the highest-priority follow-up before claiming novelty.**

---

## 10. Non-obvious composition ideas (synthesis)

### Takeaway
The strongest compositions use existing primitives to attack the user's named problems:
- Lemons: resolver meta-bounties plus restaked underwriting.
- Outside money: sponsor-subsidized markets and bounty buyers.
- Settlement exploits: escrow-first atomic take, TWAP/commit deadlines, pull-based payout.
- Fragmentation: resolver-hash identity plus CTF-style nested positions.

### Cited Findings (supporting facts each idea relies on)
- Redistributable operator sets with a fixed recipient exist on mainnet — [EigenCloud docs](https://docs.eigencloud.xyz/eigenlayer/concepts/slashing/slashing-concept).
- Fork-at-block exploit verification is a working harness — [Anthropic](https://www.anthropic.com/research/smart-contracts).
- CTF oracle is any address; nested positions are supported — [CTF guide](https://github.com/gnosis/conditional-tokens-contracts/blob/master/docs/developer-guide.rst).
- Escrow-at-placement is the recommended fix for Ghost Fills; the ERC-1155 receiver hook is an attack vector — [arXiv 2606.16852](https://arxiv.org/html/2606.16852v1).
- 30s TWAP adopted after last-10-second manipulation — [polymarkets.co.il](https://polymarkets.co.il/en/news/polymarket-bitcoin-twap-settlement-fix).
- Sponsor-funded conditional funding markets work at the $100K scale — [Uniswap Foundation](https://www.uniswapfoundation.org/blog/conditional-funding-markets-launch-for-unichain-lending-protocols).
- Immunefi pays about $13.45M per half-year for valid bugs — [The Block](https://www.theblock.co/post/407707/crypto-hack-losses-fall-below-1-billion-in-h1-2026-even-as-attack-volume-hits-record-immunefi).
- Unanimous multi-LLM auto-resolve reached 97.87% on 47% of questions — [arXiv 2605.30802](https://arxiv.org/abs/2605.30802).
- Escalating-fee adversarial bounty (Freysa) — [The Decoder](https://the-decoder.com/hacker-wins-47000-by-tricking-ai-chatbot-with-smart-prompting/).
- EigenCompute TEE execution — [SiliconANGLE](https://siliconangle.com/2025/10/01/eigencloud-launches-platform-verifiable-ai-infrastructure/).
- MetaDAO thin decision markets (median about 12 traders) — [KuCoin](https://www.kucoin.com/news/flash/metadao-raises-625m-in-23-sales-faces-challenge-of-filtering-quality-projects).
- 67 of 128 Bittensor subnets burn 99%+ of incentives — [FalconX](https://falconx.io/newsroom/state-of-bittensor-subnet-adoption-trends-network-mechanics-and-covenants-departure).

### Inferences
1. **Every market is born with a resolver meta-bounty (anti-lemons by construction).** A slice of the creator's stake funds an automatic existence-proof bounty: "∃ chain state or input reachable before the deadline under which this resolver's output diverges from its declared spec property (e.g., the payout depends on a creator-controlled storage slot, an upgradeable proxy, `block.coinbase`, or a manipulable single-block price)". The checker is a SCONE-style fork-and-replay. Agents are paid to audit resolvers, so the lemons get eaten before takers arrive. Takers can filter on "meta-bounty open N blocks, unclaimed".
2. **Resolver underwriting via redistributable restaking.** Third-party "underwriters" (operators) allocate Unique Stake to a Redistributable Operator Set that slashes on a successful meta-bounty claim, with the recipient set to the market escrow. Creators pay underwriters a premium, and the premium becomes a public, priced trust score for each resolver. Caveat: the 7-day slash-clearing delay and redistribution-key risk; best suited to long-dated or high-value markets.
3. **Two-sided existence markets turn bounties into price discovery.** Instead of a fixed bounty, the creator stakes "no input crashes binary B / breaks invariant I before block T" at odds the market sets. The taker wins atomically by submitting a witness. The **price** of the "exists" side is a live, continuous security rating of the contract. Protocols already paying Immunefi (outside money) can be the natural "no-exploit" side, since buying "exists" is equivalent to selling insurance. Pair with zkpoex-style proofs or TEE resolvers so the witness is not front-run, i.e. proof before reveal.
4. **Freysa-style escalating-fee curves as the liquidity model for challenge markets.** For "beat my agent" or "jailbreak my agent", a counterparty stake isn't needed. Each attempt pays a rising fee into the pot (Freysa: 70/30 split), and the resolver is the code path. This solves bilateral-matching liquidity for one-vs-many challenges.
5. **CTF-native composite markets: the resolver is the oracle.** Make each resolver contract the CTF oracle address. Composite markets ("A and not B", "P(X | market M resolved YES)") are resolvers that read other conditions' `payoutNumerators`. Deep positions give conditional prices for free, which enables "decision markets about the venue itself" without new machinery. Use pull-based redemption to avoid the ERC-1155 receiver-hook vector that powered Ghost Fill "proxy traps".
6. **Settlement-exploit hygiene as protocol invariants, not monitoring.**
   - Escrow both sides at post and take (no off-chain match).
   - Resolver inputs must be TWAP/median over a window ending at the deadline block, or committed state roots. This guards against the 821-account, $8.2M last-10-second pattern.
   - Resolution is a permissionless `resolve()` callable only after `deadline + finality`.
   - Forbid resolvers from reading creator-mutable state, enforced by bytecode analysis in the meta-bounty spec.
7. **Hybrid adjudication only for spec disputes.** Deterministic re-execution settles "what did the code output". Only "the code doesn't match the description" escalates. Route it to multi-LLM independent voting (auto-resolve only when unanimous: 97.87% accuracy on 47% of cases) and then to GenLayer/Kleros/UMA for the residue. Never use a token-vote as first line (UMA whale incident).
8. **Sponsor-subsidized "procurement markets" for outside money.** "This code passes hidden tests" becomes a buyer-funded market. The buyer, as in Uniswap/Optimism CFMs or Numerai's fund, seeds the "fails" side as a subsidy. Agents take "passes" and deliver code; hidden tests run in EigenCompute TEE or are revealed via commit-reveal after the deadline. This converts zero-sum betting into paid work, which avoids Bittensor's emission-gaming because the payer is an external buyer, not inflation.
9. **Resolver-hash event identity to defeat fragmentation.** Canonical event ID = hash(resolver bytecode, params, deadline block, input sources). Identical IDs pool liquidity automatically and derivatives/lending (PredMart-style) can list by ID. This directly addresses the 2–4% law-of-one-price gaps across venues.
10. **Reflexive-market guardrails.** Markets about the venue's own metrics are as thin as MetaDAO's (about 12 traders). Require long TWAP windows and protocol-owned subsidies, and disallow resolvers that read metrics the market's own participants can cheaply move (e.g., the venue's own volume). Otherwise the wash-trading incentive dominates.

### Gaps
- These are design inferences, not observed deployments. None has been validated in production. Harm-market policy (assassination, war, and death markets) was not researched. The only mention is a critics' warning, surfaced in the AI-agents search results, that such markets create incentives to manipulate outcomes. Which article it came from is unclear (possibly the [NPR Meta piece](https://www.npr.org/2026/06/24/nx-s1-5869486/meta-prediction-market-app-ai)). This needs a dedicated pass.
