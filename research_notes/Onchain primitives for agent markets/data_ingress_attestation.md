# Data Ingress & Attestation: Primitives That Bring Off-Chain Truth On-Chain (state as of Oct 2026)

Scope note for the report writer: research was done on 2026-10-21. The shared web-search budget ran out partway through. After that, only direct fetches of known primary URLs were possible, so some projects have thinner coverage. Those are flagged in Gaps: Switchboard docs (DNS failure), Lit, Marlin, Secret, zkPass internals, ZK Email status, Randcast, and Supra internals. Labels used throughout: **[MAINNET]** shipped and used in production, **[ANNOUNCED]** announced or beta, **[RESEARCH]** paper or prototype only, **[STALLED/PIVOTED]** where evidence shows it.

---

## Q1. Oracles: what exists, how permissionless are they, and what does a query or update cost?

### Takeaway
Price data is a solved, cheap, mostly free-to-pull commodity: Pyth Core updates cost 0, and Chainlink Data Streams settles Polymarket's 5- and 15-minute markets with more than $7B of volume. Arbitrary queries are moving to programmable DON runtimes (Chainlink CRE, which replaced Functions) and to optimistic/human oracles (UMA, Reality.eth+Kleros). The optimistic ones are permissionless for questions but have proven capturable by token-whale voting. The 2026 exploit wave hit custom and self-run feeds (bad authorization, freshness checks, or thin liquidity), not the major oracle networks' cryptography.

### Cited Findings

**Market structure / TVS (DefiLlama-sourced)**
- DefiLlama TVS for an oracle = sum of TVL of all protocols that would lose funds if that oracle failed — [DefiLlama docs](https://docs.llama.fi/list-your-project/oracles-tvs)
- DefiLlama oracle rankings captured Aug 26, 2026 (secondary aggregator):
  - Chainlink: $39.356B across 526 protocols
  - Chronicle: $7.461B across 13
  - RedStone: $4.167B across 90
  - Pyth: $2.794B across 317
  - Switchboard: $516M across 23
  - UMA: $383M across 9
  - Stork: $255M across 38
  - Supra: $165M across 15
  - Band: $117M across 22
  - DIA: $114M across 51
  - Chainlink share ≈63.1%, or ≈68.8% excluding "Internal"/TWAP. Source: [coinlaw.io, citing DefiLlama](https://coinlaw.io/chainlink-statistics/)
- A May 2026 snapshot from the same source had Chainlink at ~$33.1B across 505 protocols (~59% share) — [coinlaw.io](https://coinlaw.io/chainlink-statistics/)
- Conflicting figures:
  - Chainlink self-reports $110B TVS (Q2 2026) — [Chainlink Q2 2026 review](https://chain.link/blog/quarterly-review-q2-2026)
  - RedStone reportedly reached $9B TVS by Sep 2025 — [BlockEden](https://blockeden.xyz/blog/2026/01/19/blockchain-oracle-wars-chainlink-pyth-redstone-defi-infrastructure/). That is about 2x the DefiLlama Aug-2026 number, so methodologies differ.

**Chainlink**
- **CRE (Chainlink Runtime Environment)** [MAINNET]:
  - Workflows are written in Go or TypeScript and compiled to binaries. A Workflow DON coordinates and calls Capability DONs (HTTP fetch, chain write) — [CRE docs](https://docs.chain.link/cre.md); [Chainlink blog](https://blog.chain.link/introducing-chainlink-runtime-environment)
  - HTTP GET/POST with automatic consensus aggregation across nodes. Workflows must be deterministic (use `runtime.now()`, no `Math.random()`). Secrets come from a Vault DON. 3xx redirects are not followed. Non-idempotent POSTs need `cacheSettings` so they run once across the DON — [CLF→CRE migration guide](https://docs.chain.link/cre/reference/clf-migration-ts)
  - Q1 2026: CRE on 22 mainnets, sign-ups +50% MoM, executions +253%. "Agent Skills for CRE" let AI agents download the SDK, sign up, run the CLI and simulate workflows. "Confidential HTTPS" was named as a CRE hackathon feature. Private workflows were in early rollout — [Chainlink Q1 2026 review](https://chain.link/blog/quarterly-review-q1-2026)
  - Q2 2026: +9 mainnets (Celo, Gnosis, Ink, Linea, Mantle, MegaETH, Plasma, Scroll, Sonic). CRE Connect is in private beta. "Functions and Automation were upgraded from standalone services to CRE workflows" — [Chainlink Q2 2026 review](https://chain.link/blog/quarterly-review-q2-2026)
- **Chainlink Functions** [DEPRECATED]:
  - Primary doc: mainnet shutdown **June 30, 2026**, testnet June 15, 2026 — [migration guide](https://docs.chain.link/cre/reference/clf-migration-ts)
  - Conflict: a search-engine summary of the same doc family gave Sept 1, 2026. Treat June 30, 2026 (directly fetched) as authoritative.
- **Data Streams** [MAINNET], pull-based signed reports:
  - 24/5 US equities on 40+ chains, 24/7 FX, gold and silver — [Q1 2026](https://chain.link/blog/quarterly-review-q1-2026)
  - Powers Polymarket's 5/15-min up/down markets: >$5B volume and 3,000+ algo traders/MMs in Q1, $7B+ by Q2. Ten prediction-market apps use Chainlink, including Predict.fun, Myriad, Limitless and Jupiter Predict — [Q1](https://chain.link/blog/quarterly-review-q1-2026), [Q2](https://chain.link/blog/quarterly-review-q2-2026)
  - Polymarket integration announced Sept 2025: Data Streams (timestamped reports) plus Automation for settlement at preset times, crypto price markets only. Chainlink said it would "test" subjective markets — [The Block](https://www.theblock.co/post/370444/polymarket-turns-to-chainlink-oracles-for-resolution-of-price-focused-bets); [CoinDesk](https://coindesk.com/web3/2025/09/12/polymarket-connects-to-chainlink-to-cut-tampering-risks-in-price-bets)
- **SVR (Smart Value Recapture, i.e. oracle MEV capture)** [MAINNET]: $23M+ recaptured. $880M+ liquidations processed with zero bad debt. Chainlink claims 99% share of oracle-MEV capture — [Q2](https://chain.link/blog/quarterly-review-q2-2026), [Q1](https://chain.link/blog/quarterly-review-q1-2026)
- **Proof of Reserve** [MAINNET]: used by USDW, KRWQ and a Bermuda Monetary Authority initiative; on AWS Marketplace — [Q2 2026](https://chain.link/blog/quarterly-review-q2-2026)
- **Chainlink for Agents** [ANNOUNCED/BETA]:
  - Reported "live in beta" without a formal launch post. Another report gives an Aug 14 launch. It lets agents access data, transact and move assets cross-chain — [edgen.tech](https://www.edgen.tech/news/post/chainlink-launches-agent-platform-as-ai-bots-head-toward-50-billion); [brainsum mirror](https://san-1510.aid.brainsum.com/news/top-news/chainlinks-token-gains-ai-agent-product-draws-attention)
  - Q2 review shows headings only: "Install Skill Bundle for the Agent", "Create an SVA (Signature Verifying Account) for the Agent". Agent Skills were expanded to CCIP, ACE, Data Feeds, Data Streams and VRF — [Q2 2026](https://chain.link/blog/quarterly-review-q2-2026)
- **Tydro** moved to Chainlink after an exploit of its legacy oracle provider — [Q2 2026](https://chain.link/blog/quarterly-review-q2-2026)

**Pyth**
- **Pyth Core** (pull oracle) [MAINNET]:
  - The update fee is **0 on all mainnet EVM chains**. `getUpdateFee` returns 0 and `msg.value=0` is sufficient.
  - **Hermes (the update-fetch API) now requires an API key.** Source: [Pyth current fees](https://docs.pyth.network/price-feeds/core/current-fees)
  - The page does not state Solana fees or Wormhole verification gas.
- **Pyth Pro** (formerly Lazer) [MAINNET]:
  - Institutional subscription launched Sept 2025, with Jump Trading and banks in early access — [BusinessWire](https://www.businesswire.com/news/home/20250923720158/en/Pyth-Network-Launches-Pyth-Pro-a-Next-Generation-Subscription-Service-for-Institutional-Market-Data)
  - 3,000+ feeds across asset classes, tiered pricing — [Pyth blog](https://www.pyth.network/blog/pyth-s-next-chapter-infrastructure-upgrade-and-a-revenue-based-economic-model)
  - DefiLlama shows ~$299K 30-day revenue and ~$1.19M cumulative — [DefiLlama Pyth Pro](https://defillama.com/protocol/pyth-pro)
- **Entropy**: see Q4.

**UMA Optimistic Oracle** [MAINNET], permissionless questions with human-vote backstop
- OOv3 defaults:
  - Default liveness is 2 hours, and the docs advise against shortening it.
  - Minimum bond = final fee, queryable via `getMinimumBond(token)`.
  - A winning disputer gets their bond back plus half the proposer bond; the other half goes to the Store. Example: on a 10k USDC bond, the disputer gets 15k and the Store gets 5k.
  - The docs advise bonds well above the minimum for high-value data. Source: [UMA docs](https://docs.uma.xyz/developers/setting-custom-bond-and-liveness-parameters)
  - Conflict: the OOv3 quick-start example uses 120 s liveness — [UMA quick start](https://docs.uma.xyz/developers/optimistic-oracle-v3/quick-start)
- OOv3 "escalation managers" can replace the DVM with custom logic and whitelist asserters/disputers — [OpenZeppelin audit](https://www.openzeppelin.com/news/uma-optimistic-governor-incremental-audit)
- **MOOV2 (Managed OOv2)** for Polymarket:
  - Approved via UMIP-189 on Aug 6, 2025. Only whitelisted addresses can propose; **anyone can still dispute**.
  - The initial whitelist had 37 addresses: Risk Labs and Polymarket staff, plus users with >20 proposals and >95% accuracy.
  - Rationale: early wrong proposals were delaying markets by up to 4 days. Source: [The Block](https://www.theblock.co/post/366507/polymarket-uma-oracle-update)
  - Secondary claims: the whitelist grew to 177 by Nov 2025 (criteria ≥5 proposals, ≥95% accuracy over 6 months). In the first month, incorrect proposals fell 59% and disputes fell 68% — [polymarkets.co.il guide](https://polymarkets.co.il/en/guide/uma-disputes/) (unofficial, unsourced)
- Polymarket mechanics:
  - $750 USDC.e proposer bond, 2-hour challenge period — [Polymarket Help Center, Jan 11 2026](https://help.polymarket.com/en/articles/13364518-how-are-prediction-markets-resolved)
  - The first dispute resets the proposal and the second goes to a DVM vote: debate 24–48h, commit 24h, reveal 24h. Wrong voters lose 0.1% of staked UMA — [polymarkets.co.il](https://polymarkets.co.il/en/guide/uma-disputes/) (secondary)

**Reality.eth + Kleros** [MAINNET], fully permissionless questions
- Answer mechanics:
  - Anyone answers with a bond. Each new answer must at least **double** the prior bond, and each one resets the timeout.
  - Anyone can pay the per-question arbitrator fee to freeze the question and get a final ruling.
  - Commit-reveal anti-front-running uses a reveal window of 1/8 of the timeout.
  - Cost: ~100k gas to ask plus the first answer, ~50k gas per later answer.
  - Questions can settle to "null/invalid", so consumers must handle that. The whitepaper explicitly warns about "tricksy" questions (ambiguous, self-contradictory, false-premise). Source: [Reality.eth whitepaper](https://realitio.github.io/docs/html/whitepaper.html)
- Seer (on Gnosis Chain and Ethereum) links each market to a Reality.eth question. Escalated disputes go to Kleros jurors — [getblock.io](https://getblock.io/marketplace/projects/seer); [pm.wiki](https://pm.wiki/pt/compare/ringo-vs-seer). A Mar 2026 dossier flags Kleros arbitration cost and low liquidity as risks.

**API3** [MAINNET]: OEV Network is a ZK-rollup that runs order-flow auctions for oracle updates. The off-chain OEV Auctioneer is run by the API3 DAO — [API3 docs](https://docs.api3.org/oev-searchers/in-depth/oev-auctioneer.html); [API3 blog](https://blog.api3.org/oev-network-now-fully-integrated-with-api3s-oracle-stack/). No 2026 recapture numbers were found.

**Switchboard** [MAINNET]:
- Surge offers sub-100 ms WebSocket price delivery that bypasses consensus. Security rests on SAIL (TEE attestation that nodes run authorized code). Surge access is reportedly gated by svSWTCH holdings. Runs on 10+ chains — [Blockworks](https://blockworks.com/news/fastest-oracle-on-solana-launches); [Solana Compass](https://solanacompass.com/projects/Switchboard)
- Confidential-container TEE framework presented at Scale or Die 2025 — [Solana Compass](https://airdrop.solanacompass.com/learn/accelerate-25/scale-or-die-2025-spilling-the-tee-doctorblocks-switchboard)

**2026 oracle exploit wave** (custom and self-operated feeds)
- **Ostium** (Arbitrum, Jul 15 2026), ~$18M USDC drained (other estimates $11.9M–$24M):
  - The attacker used a registered PriceUpKeep forwarder in Ostium's custom RWA feed (Gelato-pushed) to submit **future-dated timestamps**, which made losing trades look profitable — [CoinDesk](https://www.coindesk.com/business/2026/07/15/ostium-suffers-usd18-million-exploit-as-oracle-attack-wave-continues-to-hit-defi); [cryptowire post-mortem summary](https://www.cryptowire.in/blog/ostium-publishes-post-mortem-on-the-24-million-oracle-exploit-that-drained-its-olp-vault/)
- **Summer.fi** ~$6M (attackers gained privileged keeper roles) — [CoinDesk](https://www.coindesk.com/business/2026/07/15/ostium-suffers-usd18-million-exploit-as-oracle-attack-wave-continues-to-hit-defi)
- **Nostra** (Starknet, Sept 2026), ~$3.5M:
  - The NSTR thin-market price was pumped ~8,000x on a Pragma feed. Pragma then flagged 6 Starknet feeds as critical. Sources (secondary): [shattered.io](https://shattered.io/nostra-finance-3-5-million-pragma-oracle-exploit-2026/), [hoge.gg](https://hoge.gg/oracle-manipulation-2026-price-feed-attacks/)
- **Full Sail** (Sui, Aug 2026, ~$91K): the attacker added their own key to the authorized signer set — same secondary sources.
- **Silo** (~$392K): stale-price case — [dev.to](https://dev.to/pavelespitia/oracle-manipulation-how-a-392k-silo-finance-loss-happened-in-2026-2051)
- OWASP SC03:2026 lists spot/TWAP manipulation, stale data and weak deviation handling — [OWASP](https://owasp.org/www-project-smart-contract-top-10/2026/en/src/SC03-price-oracle-manipulation.html)

### Inferences
- **Permissionless arbitrary query vs curated feed**:
  - Curated feeds (consumer chooses a feed, cannot define one): Chainlink Data Feeds/Streams, Pyth Core/Pro, Chronicle, RedStone.
  - Developer-defined jobs: Chainlink CRE (developer-defined workflow, but on Chainlink's DON and billing); Switchboard On-Demand (custom jobs per its historical design; not re-verified because the docs were unreachable).
  - Truly permissionless natural-language questions: UMA OOv3 and Reality.eth. They are also the most attackable, because security = cost to corrupt human voters/arbiters vs. value at stake.
- **For a resolver VM, the cleanest v1 data source** is a *signed, timestamped, pull-verified price report*: Pyth Core (fee 0) or Chainlink Data Streams. The resolver only verifies a signature against a known key set and checks that `publishTime` falls in the deadline window. No oracle needs to "push" anything, and any agent can submit the report. Polymarket's 5/15-minute markets ($7B+) prove the pattern at scale.
- **The Ostium bug (future-dated timestamps) is the exact failure mode a deadline-based resolver must defend against.** The resolver must enforce `report.timestamp ∈ [deadline − ε, deadline]`, reject future timestamps relative to `block.timestamp`, and pin the signer set immutably.
- **UMA's own docs say bond must scale with value at stake.** A permissionless protocol could make "optimistic resolution" a resolver *pattern*: assert, liveness window, bond-doubling escalation (Reality.eth style). The final backstop is either a hard-coded objective resolver or refund/invalid, never a token vote.

### Gaps
- No primary 2026 numbers for Chronicle, RedStone, API3 OEV or Switchboard. Switchboard docs were unreachable (DNS failure).
- Chainlink Data Streams per-report verification cost and pricing are not public in the fetched pages. CRE pricing, timeouts and response-size limits were not found.
- No confirmed status for Chainlink DECO as a product. It appears to remain research and was referenced only as "Chainlink's DECO research".

---

## Q2. zkTLS / web proofs: models, maturity, latency, and can a third party prove a public page at a time?

### Takeaway
"zkTLS" is a misnomer for on-chain purposes. Every deployed design ends in **a notary/attestor signature that the contract trusts**, because ZK proofs over TLS are designated-verifier and the witness must be present live. Proxy mode is now ~1–2 s, MPC mode ~4–15 s, and proofs over responses above 1 MB are now benchmarked. The most prominent production app (Peer/ZKP2P) **abandoned zkTLS for AWS Nitro TEEs** in 2026, taking latency from 30 s to under 1 s. Opacity appears to have pivoted to identity and tokenized securities.

### Cited Findings

**Trust model fundamentals (TLSNotary, June 2026)**
- What on-chain "verification" actually checks:
  - A zkTLS proof "isn't checked by the world. It's checked by whoever trusts the verifier that witnessed it."
  - A client alone can forge a transcript, because client and server share the session key.
  - A third-party witness must be in the session live: "you cannot add that witness after the fact."
  - The ZK proofs are designated-verifier.
  - Smart contracts therefore verify a **notary signature**, i.e. a trusted public key.
- Options for reducing trust: run your own verifier, M-of-N independent notaries, or economically slashable notaries. "TLSNotary alone does not solve the oracle problem." Source: [TLSNotary, "Zero-knowledge ≠ trustless" (Jun 17 2026)](https://tlsnotary.org/blog/2026/06/17/public-verifiability)
- "Web proofs never remove trust; they relocate it":
  - Peer moved payment verification to AWS Nitro Enclaves, cutting latency from ~30 s to <1 s.
  - Peer's previous proxy-zkTLS design had a **single attestor (Peer itself)**, so one compromised operator could sign a fake payment.
  - The TEE design improves integrity but makes privacy rest on attestation: if the Nitro root broke, credentials could be silently redirected.
  - TLSNotary proposes running the zkTLS verifier *inside* a TEE to get both properties. Source: [TLSNotary, "Where does your trust live?" (Jun 23 2026)](https://tlsnotary.org/blog/2026/06/23/where-trust-lives)

**TLSNotary (PSE / Ethereum Foundation)** [RESEARCH→early production; still alpha]
- Releases and status:
  - alpha.14 (Jan 2026) was 8–16% faster than alpha.13. alpha.15 is referenced but its status is unclear.
  - QuickSilver replaced the garbled-circuit proof backend from alpha.8 onward.
  - Proxy Mode was introduced Apr 22 2026. Source: [TLSNotary blog index](https://tlsnotary.org/blog/)
  - Supports TLS 1.2 only, with TLS 1.3 "in progress" on the road to 1.0 — [PSE mastermap](https://pse.dev/mastermap/tlsnotary); [TLSNotary docs](https://tlsnotary.org/docs/intro)
- Benchmarks (May 2026; 1 KB request / 2 KB response; native/browser):

  | Profile | MPC (native) | Proxy (native) | MPC (browser) | Proxy (browser) |
  |---|---|---|---|---|
  | Cable | 14.5 s | 1.6 s | 15.5 s | 2.0 s |
  | 5G | 10.4 s | 1.6 s | 11.4 s | 1.9 s |
  | Fiber | 3.6 s | 1.0 s | 4.8 s | 1.4 s |

  - MPC uploads ~30 MB of garbled-circuit material and needs ~40 rounds. At 5 Mbps MPC takes ~52 s vs proxy ~4 s.
  - For a 51 KB response, browser proxy takes 7.3 s vs native 2.6 s (WASM lacks AES acceleration). Source: [TLSNotary proxy benchmarks (May 10 2026)](https://tlsnotary.org/blog/2026/05/10/blog-proxy-mode)
- Proxy-mode trust model:
  - The verifier forwards and records ciphertext but cannot decrypt.
  - It **assumes the attacker cannot MITM the verifier→server connection** (DNS/BGP hijack is the named risk).
  - With a third-party verifier, a "colluding verifier could attest to fabricated sessions". This applies equally to MPC.
  - Servers may block data-center IPs, and routing via residential proxies "weakens the network security assumption further."
  - MPC is recommended for high-stakes, financial or legal proofs. The design is built around TLS 1.2 + AES-GCM. Source: [TLSNotary, Introducing Proxy Mode (Apr 22 2026)](https://tlsnotary.org/blog/2026/04/22/proxy-mode)
- Formal result on proxying ("Proxying Is Enough", AFT 2025):
  - A pure proxy verifier gives TLS-oracle integrity for HTTPS thanks to HTTP's variable padding, with a 60–90% runtime saving.
  - For fixed, pre-determined responses, integrity needs AEAD "context unforgeability". **ChaCha20-Poly1305 has it; AES-GCM does not.** Source: [ePrint 2024/733](https://eprint.iacr.org/2024/733)

**Reclaim Protocol** [MAINNET apps; proxy/attestor model]
- New formalization (Sept 2026):
  - zkPoPE ("Proof of Protocol Execution"), a UC functionality built on a new 3-party "Distributed-AEAD".
  - Attests a **1,200 KB response in 7.28 s on a lower-mid-range phone**, which the authors say is 2 orders of magnitude beyond prior zkTLS benchmarks.
  - Argues existing zkTLS schemes lack a common security definition. Source: [ePrint 2026/2187](https://eprint.iacr.org/2026/2187)
- Product:
  - Verification takes 2–30 s. The AI Agent integration auto-builds a "provider" for a target site.
  - **zkFetch** makes "authenticated API calls without user login" with an auditable proof. This is the closest thing to "third-party proof of a public endpoint." Source: [Reclaim docs](https://docs.reclaimprotocol.org/)
- Attestor decentralization: attestors stake $MOCA, a Task Contract randomly selects them, and consensus is 51% — [Reclaim docs (via search)](https://docs.reclaimprotocol.org/attestor-decentralization). An older Zellic audit found nodes "currently only operated by CreatorOS Inc." — [Zellic](https://reports.zellic.io/publications/reclaim-protocol/sections/node-centralization-risk-centralization). Current operator count was not found.
- Production use: 3Jane uses Reclaim to pull users' FICO scores for undercollateralized DeFi credit — [BlockEden (secondary)](https://blockeden.xyz/blog/2026/03/19/zktls-zero-knowledge-transport-layer-security-privacy-preserving-identity-web3/)

**Peer (formerly ZKP2P)** [MAINNET; now TEE, not zkTLS]
- v3 "Attestation Service" in AWS Nitro Enclaves signs EIP-712 `PaymentAttestation`s:
  - Buyer-side: the enclave fetches payment-platform data directly.
  - "Seller Autopilot": the seller uploads encrypted platform credentials once.
- Key handling: the signing key is KMS-wrapped and **PCR8-gated**. Clients can fetch `/attestation?nonce=`. A `MultiAttestationVerifier` sits on Base. On-chain nullifiers and amount caps apply. Source: [Peer v3 docs](https://docs.peer.xyz/protocol/v3/v3-overview)

**Opacity** [STALLED/PIVOTED on zkTLS-as-infra]
- Previously billed as the "first zkTLS notary network": MPC-TLS with an EigenLayer AVS, and a design that required TEEs for node operators and slashing — [paragraph.xyz](https://paragraph.xyz/@web3citizenxyz/new-avs-and-ethcc); [Opacity HackMD](https://hackmd.io/SpNwBquVReqrVJzloT_esA)
- $13.4M total funding — [The Block](https://www.theblock.co/post/321160/opacity-network-funding-zk-data-verification)
- opacity.network now redirects to opacitylabs.com, which (Oct 20 2026) positions Opacity as "the TSV [Tokenized Securities Venue] Toolbox": reusable investor credentials, KYC, transfer agent. zkTLS is listed only as one capability — [opacitylabs.com](https://opacitylabs.com/)

**vlayer** [MAINNET since mid-2025]: Mainnet launched May 2025 and v1.0 in June 2025, with Web Proofs, Email Proofs, Time Travel and Teleport (cross-chain/historical storage proofs) — [mpost](https://mpost.io/vlayer-launches-mainnet-advancing-the-utility-of-smart-contracts-at-global-scale/); [communityone](https://communityone.io/servers/1196440523662163999/vlayer/news/vlayer-mainnet-v1-0-live-2025-06-13/). It raised $10M pre-seed — [The Block](https://www.theblock.co/post/324359/vlayer-funding-ethereum-solidity-2-0). Docs describe contracts running off-chain with on-chain verifiers — [vlayer book](https://book.vlayer.xyz/). No 2026 usage data was found.

**Primus (ex-PADO)** [MAINNET SDK; network staging]
- zkTLS SDK verifier contracts are on Linea, BNB and Arbitrum. The network runs in staging with authorized nodes only. No token as of Sept 2026 — [Primus docs](https://docs.primuslabs.xyz/primus-network/understand-primus-network); [coinlaunch](https://coinlaunch.space/projects/primus-labs/)
- Raised $6.5M (led by VanEck) in early 2025. BNB Chain launched a zkTLS verification layer with Primus — [cryptobriefing](https://cryptobriefing.com/bnb-chain-zktls-primus-privacy-verification/)
- **Kaito Pulse** (launched Aug 18 2026): a browser-local zkTLS proof of exchange/Polymarket positions (e.g., "open long on ETH"), displayed on X — [cryptobriefing](https://cryptobriefing.com/kaito-primus-labs-zktls-verification/)

**zkPass** [MAINNET apps]: $12.5M Series A — [BlockEden](https://blockeden.xyz/blog/2026/03/19/zktls-zero-knowledge-transport-layer-security-privacy-preserving-identity-web3/). The docs landing page says it is "currently undergoing updates" — [zkPass docs](https://docs.zkpass.org/). No architecture details were retrievable.

**Pluto**: Web Proofs SDK made public Feb 14 2025 (weak aggregator source) — [Bitget dApp page](https://web3.bitget.com/vi/dapp/pluto-25466). The homepage now says "The API for personal web data", copyright 2025, with no recent dates — [pluto.xyz](https://pluto.xyz/). Status is unclear and possibly quiet.

### Inferences
- **Can a third party (not the data owner) prove a public page at a specific time?**
  - Yes, but only *live*: the prover must run the session with a notary present (TLSNotary), or use Reclaim zkFetch or a DON HTTP fetch (Chainlink CRE).
  - **Retroactive proofs of past web content are impossible** by construction, because the witness cannot be added later.
  - "At a specific time" is only as good as the notary's clock (or the HTTP `Date` header inside the transcript). This is a trust assumption, not a cryptographic fact.
  - For a deadline-based resolver, any agent can fetch at the deadline, but the *content served* can differ by geography, cookies, A/B tests or CDN cache. A resolver must specify the exact endpoint (prefer JSON APIs over HTML) and a tolerance window.
- **Model comparison**:
  - MPC-TLS: notary must not collude with the prover; ~4–15 s.
  - Proxy-TLS: notary must not collude and the network path must not be hijacked; ~1–2 s. AES-GCM context-unforgeability caveats apply.
  - TEE-TLS: hardware vendor root plus physical security; <1 s. See Q3 for physical breaks.
  - **All three end with "trust a key".** For a permissionless protocol, the realistic design is *M-of-N attestor signatures from independent operators*, combined with an optimistic challenge window.
- **The adversarial-prover problem is acute for markets.** The prover is also a counterparty, so a self-chosen notary is worthless. The resolver must pin notary keys (or an M-of-N set) at market creation, visible to both sides.
- Market signal: two flagship zkTLS-infra brands moved away from pure zkTLS in 2026 (Peer to TEE, Opacity to tokenized-securities identity). zkTLS is consolidating into identity/credential use cases, not general-purpose oracles.

### Gaps
- No production evidence was found of DECO (Chainlink) as a shipped product.
- Brevis was not researched (search budget ran out). Brevis is a ZK coprocessor for on-chain history, not zkTLS.
- No data on server TLS key/certificate rotation handling in on-chain zkTLS verifiers, or on DKIM key rotation for ZK Email (fetch returned no content).
- Reclaim's live attestor count and vlayer/zkPass 2026 volumes were not found.

---

## Q3. TEEs as oracles and executors: deployments, on-chain verification cost, and what the 2025–26 breaks mean

### Takeaway
TEE attestation can now be verified on-chain at a few hundred thousand gas (ZK-wrapped DCAP) and is cheaper since Fusaka's P-256 precompile. However, the 2025–26 interposer attacks (WireTap, Battering RAM, TEE.fail, DDRop) showed that **anyone with physical access and under $1,000 of hardware can forge Intel SGX/TDX quotes and break SEV-SNP attestation**. Intel and AMD declared this out of scope and will not patch it. A TEE attestation therefore proves "some machine that someone physically controls ran this," which is not a permissionless-grade trust root for high-value markets.

### Cited Findings

**Attacks**
- **WireTap** (CCS '25), DDR4 Intel SGX on 3rd-gen Xeon Scalable:
  - <$1,000 interposer plus logic analyzer. Recovered the SGX **Quoting Enclave ECDSA attestation key from a single signing op** — [wiretap.fail](https://wiretap.fail/); about 45 min per [The Hacker News](https://thehackernews.com/2025/10/new-wiretap-attack-extracts-intel-sgx.html)
  - Secret Network: on the *test* network, the researchers forged a quote, joined, and got the **consensus seed** (decrypts all txs).
  - Phala: on a local testnet, they got a cluster key and the **master key** via the gatekeeper role.
  - Crust: they claimed storage rewards without storing data.
  - IntegriTEE: they could "return arbitrary results to on-chain oracle queries (TEEracle)".
  - Source: [wiretap.fail](https://wiretap.fail/)
- **Battering RAM** (IEEE S&P 2026; KU Leuven, Birmingham, Durham):
  - **$48 DDR4 interposer**. Breaks SEV-SNP attestation on fully patched systems and allows SGX ciphertext replay. Disclosed Feb 2025, public Sep 30 2025, Pwnie award Aug 2026.
  - Intel and AMD say physical DRAM attacks are out of scope, and a fix needs a memory-encryption redesign.
  - The same site lists **DDRop** (CCS '26), which drops DDR5 writes to break TDX and SEV-SNP (headline only). Source: [batteringram.eu](https://batteringram.eu/)
- **TEE.fail** (Oct 2025; IEEE S&P '26; Georgia Tech, Purdue):
  - DDR5 interposer, <$1,000, briefcase-portable.
  - Extracted Intel's **Provisioning Certification Key** in a fully automated way, enabling **forged SGX and TDX quotes**.
  - Extracted ECDSA keys from SEV-SNP VMs even with Ciphertext Hiding.
  - NVIDIA CC attestation can be "borrowed" from other machines, because GPU attestation isn't bound to the CVM.
  - Demonstrated impact:
    - BuilderNet: decrypt orderflow, access the validator-payment wallet, frontrun.
    - Phala/dstack: run a workload in a non-confidential VM with forged attestation.
    - Secret Network: consensus seed extracted.
  - Affected: Xeon 4th gen+ and EPYC Zen 4/5. Intel advisory dated 2025-10-28; AMD AMD-SB-3040 with no firmware fix planned. Not known to be exploited in the wild. Source: [tee.fail](https://tee.fail/); [SecurityWeek](https://securityweek.com/new-attack-targets-ddr5-memory-to-steal-keys-from-intel-and-amd-tees); [BleepingComputer](https://www.bleepingcomputer.com/news/security/teefail-attack-breaks-confidential-computing-on-intel-amd-nvidia-cpus/amp/)

**Responses**
- **Phala**: ended SGX on Sept 30 2025, with no new SGX workers. Migrating to Intel TDX and NVIDIA CC. The master key is held by a permissioned gatekeeper set — [Phala](https://phala.com/posts/response-to-wiretap-sgx-deprecation). TEE.fail then showed TDX quotes are forgeable too — [tee.fail](https://tee.fail/)
- **Secret Network**: limited node enrollment to trusted operators and rotated the seed — [wiretap.fail](https://wiretap.fail/), [tee.fail](https://tee.fail/)
- **Oasis** claims it is unaffected — [Oasis blog](https://oasis.net/blog/oasis-tee-vulnerabilities)

**Deployments**
- **Phala dstack** [MAINNET]: TDX CVMs plus GPU TEEs. dstack is a Linux Foundation Confidential Computing Consortium project. Phala uses Intel Trust Authority as an alternative to self-run DCAP. SOC 2 Type I / HIPAA in Dec 2025 — [Phala/Intel](https://phala.com/posts/phala-intel)
- **Flashbots BuilderNet** [MAINNET, but TEE status changed]:
  - Public since Nov 26 2024 — [BuilderNet docs](https://buildernet.org/docs/)
  - **The docs now state the network is "currently transitioning to a new security model" and BuilderNet nodes are *not* running in TEEs during this period.** Backrunning and routing services still do — [BuilderNet docs](https://buildernet.org/docs/)
  - Aug 2025: aTLS was removed from the hot path (~2 s handshake with MAA). The stated model assumes no one can break TDX and that "at least one party" (cloud, host or deployer) is incentivized not to physically attack. Trusted time in TEEs was flagged as an open problem — [Flashbots forum](https://collective.flashbots.net/t/moving-away-from-atls/)
- **SUAVE**: no 2026 status found; described only as "under development" by a third party — [mintlify vendor page](https://www.mintlify.com/ethereum/iptf-map/vendors/flashbots). Treat it as stalled/absorbed.
- **Unichain TEE builder** [MAINNET]:
  - The first L2 TEE block builder (TDX) via Rollup-Boost, with priority-fee ordering and revert protection — [Flashbots forum](https://collective.flashbots.net/t/the-first-l2-tee-block-builder-is-live-on-unichain-mainnet/4917); [Uniswap blog](https://blog.uniswap.org/rollup-boost-is-live-on-unichain)
  - Public attestations were still "coming soon" as of May 2025. Flashblocks (200 ms) went live on Base July 2025 — [BlockEden](https://blockeden.xyz/de/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/)
- **Oasis ROFL** [MAINNET Jul 2 2025]: off-chain TEE compute registered on Sapphire. First apps include the WT3 autonomous trading agent and Zeph — [Oasis](https://oasis.net/blog/rofl-mainnet-launch); [The Defiant](https://thedefiant.io/news/press-releases/oasis-protocol-foundation-launches-rofl-mainnet-verifiable-offchain-compute-framework-powering-ai-applications)
- **t1 protocol** [ANNOUNCED]:
  - A TDX TEE rollup with "real-time proving" (ZK-compressed TDX attestation) to Ethereum in <12 s and 1 s blocks.
  - Plans value-at-risk caps and periodic ZK checkpoints as defense in depth. a16z csx-backed.
  - No confirmed mainnet. Source: [t1 substack](https://t1protocol.substack.com/p/introducing-t1-unifying-ethereums-ecosystem); [LinkedIn](https://linkedin.com/company/t1protocol)
- **Switchboard** uses TEE attestation (SAIL) for oracle nodes — see Q1.
- **Peer** uses AWS Nitro (a different trust root: Amazon's Nitro hypervisor and KMS, not Intel/AMD memory encryption) — see Q2.

**On-chain attestation verification cost (Automata DCAP)**
- Raw on-chain verification of a single DCAP quote costs **~3M gas**. A RISC Zero ZK wrapper brings it to **~350K gas**; Automata also cites 10–16x gains.
- DCAP v1.1 uses the P-256 precompile (EIP-7951) to cut ECDSA verification from ~330K to ~6K gas, about 1M gas saved in total. These figures were measured on Sepolia/Hoodi. Source: [Automata blog](https://blog.ata.network/automatas-release-of-dcap-attestation-v1-1-for-agentic-systems-84ae98900370); [Automata DCAP v4](https://blog.ata.network/releasing-dcap-library-v4-a-unified-interface-to-verify-tees-on-chain-2f27538babb4); [Automata/Aligned](https://blog.ata.network/on-verifying-tee-attestations-with-aligned-layer-867822e33380)
- **EIP-7951 (secp256r1 at 0x100)** shipped with Fusaka on Dec 3 2025 — [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement); [Ethereum Magicians](https://ethereum-magicians.org/t/eip-7212-precompiled-for-secp256r1-curve-support/14789?page=7)
- AWS Nitro attestation verified via SP1 ZK: from **63M gas to ~260K gas** — [Espresso docs](https://docs.espressosys.com/network/concepts/rollup-developers/integrating-an-optimistic-rollup/zk-attestation-verification)

### Inferences
- **Security-cost framing for a resolver.** The cost to forge a TDX/SGX attestation is roughly <$1,000 of hardware plus physical access to one qualifying server, plus engineering (the TEE.fail attack is fully automated). If a single forged attestation could resolve a market, the safe bet size per TEE-resolved market is bounded by that cost. Mitigations:
  - (a) require attestations from **multiple vendors** (Intel TDX + AMD SEV-SNP + AWS Nitro), since one interposer per platform raises cost;
  - (b) require **N independent operators**;
  - (c) cap value at risk per attestation (t1's approach);
  - (d) wrap TEE outputs in an optimistic challenge window.
- **TEEs are much better as *executors of deterministic code over public inputs*** (where anyone can re-execute and challenge) than as oracles for *private or ephemeral inputs* (where nobody can check). For LLM-judge resolvers, the strongest pattern is: TEE executes; the inputs (prompt, model hash, seed) are public; anyone can re-run on an open-weights model to dispute.
- GPU TEE (NVIDIA CC) attestation is not bound to the CPU CVM, so "verifiable AI inference" claims from GPU TEEs inherit CPU-TEE breaks.

### Gaps
- Lit Protocol, Marlin Oyster, Secret Network's 2026 status, and AMD SEV-SNP on-chain verifiers were not researched due to the search budget. Lit's status (it historically ran on threshold MPC + TEE) is unverified.
- No independent benchmark of Automata's DCAP verifier gas on mainnet post-Fusaka.
- DDRop details (CCS '26) were retrieved as a headline only.
- Whether Unichain public TEE attestations ever shipped was not confirmed.

---

## Q4. Verifiable randomness: cost, latency, bias/grinding risks

### Takeaway
Three tiers:
- **drand quicknet**: a public threshold-BLS beacon, verifiable on Ethereum L1 for ~131–141K gas post-Pectra. Free, no request/callback, and doubles as a public clock.
- **Request/callback VRFs**: Chainlink VRF v2.5 at ~2 s, priced as a 20–84% premium on callback gas; Pyth Entropy (commit-reveal; the provider can censor outcomes).
- **PREVRANDAO**: free but proposer-biasable (1 bit per slot by withholding).

For adversarial agent markets, drand or VRF with lookahead is the safe default.

### Cited Findings
- **Chainlink VRF v2.5** [MAINNET]:
  - Premium is a % of callback gas. Total cost = gas cost × (100 + premium%)/100 — [VRF billing](https://docs.chain.link/vrf/v2-5/billing)
  - Pay in LINK or native, with native costing more. ~2 s end-to-end latency — [Chainlink VRF v2.5 blog](https://chain.link/blog/introducing-vrf-v2-5)
  - Per-network parameters (max callback gas 2.5M everywhere, max 500 words per subscription request, 10 per direct-funding request):

    | Network | Premium (native / LINK) | Min confirmations |
    |---|---|---|
    | Ethereum | 24% / 20% | 3 |
    | Arbitrum | 60% / 50% | 1 |
    | Base | 60% / 50% | 0 |
    | Polygon | 84% / 70% | 3 |

    Source: [VRF supported networks](https://docs.chain.link/vrf/v2-5/supported-networks)
  - Underfunded subscriptions leave requests pending for up to 24 h — [VRF subscription docs](https://docs.chain.link/vrf/v2-5/overview/subscription)
- **drand / League of Entropy** [MAINNET]:
  - quicknet uses G1 signatures (48 bytes) to cut on-chain cost — [drand quicknet launch](https://docs.drand.love/blog/2023/10/16/quicknet-is-live)
  - On Ethereum L1 after Pectra (EIP-2537 BLS12-381 precompiles), total verification gas is BLS12-381 uncompressed **131,564**, compressed **140,580**, and BN254/evmnet **159,274**. Verified quicknet round #20986100 in block #23188016.
  - The example contract is **unaudited** and "not meant to be used" in production.
  - evmnet (BN254) launched 2024 for chains without BLS12-381 — [drand blog, Aug 2025](https://docs.drand.love/blog/2025/08/26/verifying-bls12-on-ethereum)
  - MegaETH ships a Solidity quicknet verifier (Zodomo/DrandVerifier) as its VRF — [MegaETH docs](https://docs.megaeth.com/developer-docs/vrf)
- **Pyth Entropy** [MAINNET]:
  - Two-party commit-reveal. The provider pre-commits a hash chain, the user supplies `xU`, and the result is r = hash(x_i, x_U).
  - **The provider can compute r before revealing and could withhold (censor) unfavorable results.** It must not front-run or rotate its commitment.
  - If the user's contribution comes from an on-chain PRNG, security depends on validators not colluding with the provider. Source: [Entropy protocol design](https://docs.pyth.network/entropy/protocol-design)
  - v2 adds custom gas limits, provider selection, callback status tracking and the Entropy Explorer for re-requests, and is backward compatible — [Entropy v2](https://docs.pyth.network/entropy/whats-new-entropyv2)
  - Fees vary per chain, randomness arrives "within a few blocks", and Pyth reserves the right to discontinue Entropy — [Entropy docs](https://docs.pyth.network/entropy); [Entropy disclaimer](https://www.pyth.network/legal/disclaimer-for-pyth-network-entropy)
- **PREVRANDAO (EIP-4399)**:
  - Each proposer gains ~1 bit of influence per slot by withholding a block, and proposers can censor a tx into a block with a known mix. ~1% of slots are missed on mainnet.
  - Recommended practice: use a **future** slot's mix with ≥4 epochs of lookahead and a small ε (2–4 slots).
  - Risk grows in repeated games with multi-validator adversaries. Source: [EIP-4399](https://eips.ethereum.org/EIPS/eip-4399)
- **Supra dVRF** [MAINNET]: a threshold signature over (nonce, client input, request-tx blockhash), subscription model where the wallet pays callback gas. Scheme, node count and threshold are not stated — [Supra dVRF docs](https://docs.supra.com/dvrf)

### Inferences
- **For a market protocol, drand is uniquely composable.** It needs no request (no "who paid for the VRF" griefing), and its round number is a deterministic function of time, so it is a **chain-independent timestamp**. A resolver can say "the outcome uses drand round R where R = round_at(deadline)", and any agent can submit the signature.
- **Grinding risks**:
  - Pyth Entropy's provider-withholding risk is fatal if the provider (or a colluder) is a market participant.
  - VRF-callback designs let the *requester* sometimes choose when to request. The resolver must fix the request at market creation.
  - PREVRANDAO should only settle low-value markets with lookahead.
- drand timelock encryption (tlock) is a natural fit for sealed-bid/commit-reveal market creation. Not verified in this research; see Gaps.

### Gaps
- ARPA Randcast status was not researched (budget).
- drand quicknet period and League of Entropy membership/threshold were not in fetched pages.
- Per-request USD cost of VRF/Entropy on specific chains was not computed.

---

## Q5. Novel data classes: social posts, bank/payments, AI API responses, GitHub/CI, email. Which are production-ready?

### Takeaway
Production-ready today:
- **payments and bank data** (Peer, on a TEE);
- **credit/identity credentials** (Reclaim/3Jane FICO, Opacity-style KYC);
- **exchange-position proofs** (Kaito Pulse via Primus);
- **email** (vlayer Email Proofs; ZK Email status unverified).

Not production-ready as resolver inputs: **proofs of public X posts by third parties** and **proofs of LLM API responses**. The latter is conceptually supported (Primus "provable agent execution") but has no verified production deployment. GitHub/CI proofs: no evidence found.

### Cited Findings
- **Payments**: Peer v3 verifies fiat payments (Venmo/Revolut-class platforms) via an AWS Nitro attestation service, with EIP-712 attestations verified on Base, nullifiers and caps — [Peer docs](https://docs.peer.xyz/protocol/v3/v3-overview). TLSNotary calls Peer "a prominent production zkTLS application" (before the TEE move) — [TLSNotary blog](https://tlsnotary.org/blog/2026/06/23/where-trust-lives)
- **Credit/bank**: 3Jane pulls FICO scores via Reclaim — [BlockEden](https://blockeden.xyz/blog/2026/03/19/zktls-zero-knowledge-transport-layer-security-privacy-preserving-identity-web3/). Reclaim markets salary-from-HR-portal and degree-from-university proofs — [Reclaim docs](https://docs.reclaimprotocol.org/)
- **Trading positions → social**: Kaito Pulse (Aug 2026) proves Binance/Polymarket positions locally via Primus zkTLS and shows them on X. **It does not prove X content itself** — [cryptobriefing](https://cryptobriefing.com/kaito-primus-labs-zktls-verification/)
- **Social engagement**: vlayer lists social-media engagement verification for brand deals as a Web Proofs use case — [vlayer book](https://book.vlayer.xyz/). No production volume was found.
- **AI agent / LLM API calls**:
  - Primus describes "provable agent execution": each proof captures the endpoint URL, request fields and response values, and the agent's output is accepted only after the proofs verify. It names no LLM provider and no TLS mode — [Primus docs](http://docs.primuslabs.xyz/implementation-scenarios/provable-agent-execution/)
  - Research alternatives: zkAgent (zkTLS/zkVM subproofs for tool calls) — [ePrint 2026/199](https://eprint.iacr.org/2026/199); DeepProve (full LLM inference in ZK) — [ePrint 2026/1112](https://eprint.iacr.org/2026/1112)
  - Caveat: "proves data provenance … not that the source was truthful, the agent chose the right action" — [Wavect](https://wavect.io/blog/zktls-ai-agents.md)
- **Email**: vlayer Email Proofs have been on mainnet since 2025 — [communityone](https://communityone.io/servers/1196440523662163999/vlayer/news/vlayer-mainnet-v1-0-live-2025-06-13/). The ZK Email site was unretrievable (JS-only), so its status is unknown.
- **Historical/cross-chain state**: vlayer "Time Travel" (historical state) and "Teleport" (cross-chain) shipped with mainnet — [mpost](https://mpost.io/vlayer-launches-mainnet-advancing-the-utility-of-smart-contracts-at-global-scale/)

### Inferences
- **Proof of an LLM API response is a weak resolver primitive even when it works.** LLM outputs are stochastic, so a prover can sample N times and present only the favorable response (selection/grinding). A proof that "the API returned X once" says nothing about "the model's answer is X". Mitigations:
  - fix temperature 0 plus a seed, and require the request to have been *committed before the deadline* (hash in the market);
  - require M independent provers' calls and use majority vote;
  - prefer an **open-weights model executed in a TEE or re-executable by challengers** over closed APIs.
  - Closed APIs can also change model versions silently. The resolver must pin a model snapshot ID, and providers deprecate snapshots.
- **GitHub/CI state**: theoretically reachable via a CRE HTTP fetch or zkTLS against the GitHub REST API (JSON, stable, public). The counterparty can usually *cause* the outcome (merge/commit/CI result), so it suits "did X ship?" markets only when the market maker *is* the actor (commitment devices), never for third-party bets. Not verified by any source here.
- **X/Twitter posts**: third-party public-post proofs are technically possible via a live notary session against X's web/API endpoints, but X blocks data-center IPs (TLSNotary notes the general server-blocking problem) and API access is costly. Posts are trivially *caused* by their author, so they are dangerous as resolution criteria unless the author is the bettor (self-commitment markets).

### Gaps
- No source found for production proofs of GitHub/CI state, third-party X-post proofs, or proofs of OpenAI/Anthropic API responses. These are unverified.
- ZK Email production status and DKIM-rotation handling were not retrieved.

---

## Q6. Harm and manipulation cases with permissionless real-world resolution, and non-curatorial mitigations

### Takeaway
The real failure modes are well documented:
- (1) **harm/insider markets**: death and war markets, with 2026 Iran-strike markets drawing $529M plus documented insider-like profits;
- (2) **oracle governance capture**: UMA whale votes, with top-10 wallets typically holding more than half the vote;
- (3) **ambiguous resolution criteria**: the $280M+ Iran ceasefire dispute and the $16M UFO market;
- (4) **custom-feed authorization/timestamp bugs**: Ostium, ~$18M.

Architectural mitigations exist for (2)–(4). (1) is fundamentally about *which data classes the resolver can read*.

### Cited Findings
- **Assassination markets history**:
  - Jim Bell's "Assassination Politics" (1995–97).
  - The 2013 Tor/bitcoin "Assassination Market" site listed bounties on Obama, Bernanke and Ask; its coins were cashed out in 2018.
  - Mechanism: the payout for predicting a date-of-death makes criminal liability hard to assign — [Wikipedia: Assassination market](https://en.wikipedia.org/wiki/Assassination_market)
- **Augur (July 2018)**: soon after launch, users created "death pools"/assassination markets on famous people. Daily users fell from 265 in early July to 37 by Aug 8 2018 — [Wikipedia: Augur](https://en.wikipedia.org/wiki/Augur_(software))
- **2026 war/death markets**:
  - A Reuters review found **$529M** bet on Polymarket contracts tied to the timing of attacks on Iran and **$150M** on Khamenei's removal.
  - Account "Magamyman" made **$553K** betting just before the strike, and US lawmakers called for banning war bets — [NPR, Mar 1 2026](https://www.npr.org/2026/03/01/nx-s1-5731568/polymarket-trade-iran-supreme-leader-killing); [CP24](https://www.cp24.com/news/world/2026/03/04/prediction-market-bets-on-iran-strikes-stoke-insider-trading-ethics-scrutiny); [Cointelegraph](https://cointelegraph.com/magazine/anger-grows-polymarket-bets-iran-war)
  - Kalshi's $54M Khamenei market was paused after his death under a "death carveout" and fees were refunded. Kalshi says it bans markets "directly tied to death or war or assassination". Polymarket reportedly stopped a nuclear-detonation market after backlash — [Thairath/aggregated](https://en.thairath.co.th/money/tech_innovation/tech_companies/2917471); [Northeastern](https://cssh.northeastern.edu/elections-death-war-where-should-regulators-draw-the-line-with-prediction-markets/)
- **UMA governance capture**:
  - Ukraine minerals market (Mar 2025): a large UMA holder pushed a Yes resolution; Polymarket called it "unprecedented" and refused refunds — [Web3IsGoingGreat](https://web3isgoinggreat.com/single/polymarket-governance-attack); [CoinMarketCap](https://coinmarketcap.com/academy/article/polymarket-reports-unprecedented-governance-attack-by-uma-whale-on-bet-resolution)
  - Secondary detail: ~$7M market, a whale with ~5M UMA (~25% voting power). Fort Knox market ($3.5M) where two addresses held more than half the votes. UFO declassification (Dec 2025, $16M) resolved Yes without documents. Polymarket overrode UMA on Barron/DJT (Jun 2024) — [polymarkets.co.il](https://polymarkets.co.il/en/guide/uma-disputes/)
  - A WSJ-sourced report says >60% of active UMA voters hold Polymarket accounts — [KuCoin flash](https://www.kucoin.com/news/flash/polymarket-disputes-ruled-by-mysterious-uma-token-holders)
- **2026 dispute volume**:
  - >1,150 disputes since the start of 2026 (Betmoar data), more than all of 2025. Polymarket says 0.2% of contracts reach UMA voting. In most votes, the **top 10 wallets cast >50% of votes**.
  - Israel–Lebanon ceasefire ruling: 87% of voters. Iran ceasefire dispute (Apr 2026): $280M+ volume.
  - Sources: [KuCoin](https://www.kucoin.com/news/flash/polymarket-dispute-resolution-system-under-scrutiny-as-uma-voting-raises-fraud-concerns); [Webopedia](https://www.webopedia.com/crypto/learn/polymarkets-uma-oracle-controversy/)
  - A July 2026 Economist investigation (reported secondhand) found a small number of wallets controlled significant voting power, and some held positions in the markets under review — [hokanews](https://www.hokanews.com/2026/07/polymarket-faces-questions-over-betting.html)
- **Existing mitigations in the wild**:
  - UMA MOOV2 proposer whitelist (curatorial at the proposer layer; disputes remain open) — [The Block](https://www.theblock.co/post/366507/polymarket-uma-oracle-update)
  - Polymarket moved price markets to Chainlink Data Streams, a signed objective feed — [CoinDesk](https://coindesk.com/web3/2025/09/12/polymarket-connects-to-chainlink-to-cut-tampering-risks-in-price-bets)
  - Reality.eth: bond doubling, commit-reveal, null/invalid outcomes — [whitepaper](https://realitio.github.io/docs/html/whitepaper.html)
  - UMA: bond sizing vs value at stake — [UMA docs](https://docs.uma.xyz/developers/setting-custom-bond-and-liveness-parameters)
  - Peer: nullifiers plus per-release caps — [Peer docs](https://docs.peer.xyz/protocol/v3/v3-overview)
  - t1: VaR caps plus ZK checkpoints — [t1 LinkedIn](https://linkedin.com/company/t1protocol)
  - TLSNotary: M-of-N notaries / slashable notaries — [TLSNotary](https://tlsnotary.org/blog/2026/06/17/public-verifiability)
  - EIP-4399: future-slot lookahead — [EIP-4399](https://eips.ethereum.org/EIPS/eip-4399)
  - Chainlink SVR / API3 OEV: auction the MEV created by oracle updates instead of leaking it — [Chainlink Q2](https://chain.link/blog/quarterly-review-q2-2026); [API3](https://docs.api3.org/explore/introduction/oracle-extractable-value.html)

### Inferences (non-curatorial, architectural mitigations for the user's protocol)
1. **Data-source allowlist at the VM level, not market curation.** The resolver VM exposes only typed "oracle precompiles":
   - signed price reports (Pyth/Chainlink keys),
   - drand rounds,
   - block headers and storage proofs,
   - M-of-N web attestations for an endpoint *class*.

   Death and violence markets become hard to express because no data source returns "person X is alive." This is curation of *data classes*, not markets, and can be fixed in code. It is the only lever that addresses harm markets without per-market moderation.
2. **Causality filter**: forbid (or haircut) data sources where a single actor can cheaply *cause* the outcome (posts, commits, a single-signer feed, thin-liquidity spot prices). Prefer aggregated, high-liquidity, multi-publisher data.
3. **Timestamp discipline**: reports must be signed with a timestamp in [deadline − ε, deadline]; reject future timestamps; pin signer sets at creation (Ostium-class defense).
4. **No token-vote backstop.** On ambiguity, the resolver returns INVALID and refunds; ambiguity is priced in by takers. UMA's history shows token-vote finality is capturable when voters hold positions.
5. **Bond-scaled optimistic layer** for any non-cryptographic input (zkTLS/TEE): proposer bond ≥ k × open interest, Reality.eth-style doubling escalation, terminating in INVALID instead of a jury.
6. **Value-at-risk caps per trust root**: cap open interest per market by the forgery cost of its weakest input (e.g., TEE attestation ≈ physical access + <$1k).

### Gaps
- No primary Augur post-mortem on how 2018 death markets resolved (Augur's v1 REP reporting/forking flow was not fetched).
- No official Polymarket/UMA post-mortem for 2026 disputes. Dispute counts come from a single third-party terminal.

---

## Q7 (synthesis). Which data-source classes are manipulation-resistant vs dangerous, and what non-obvious compositions exist?

### Takeaway
Ranked by manipulation resistance for an adversarial, agent-native market:
1. **Most resistant:** on-chain state with deep liquidity or no single controller, and public randomness beacons (drand).
2. Multi-publisher signed price/FX/equity reports (Pyth, Chainlink Streams).
3. M-of-N web attestations of large institutional APIs.
4. Single-operator TEE/zkTLS attestations.
5. Optimistic human oracles.
6. **Most dangerous:** anything whose outcome a participant can cause (deaths, violence, posts, commits) or that rests on a single signer or thin market.

The most interesting compositions treat drand as a clock, signed price reports as permissionless pull inputs, and TEE/zkTLS outputs as *bonded claims*, not truths.

### Cited Findings (supporting facts already sourced above)
- Signed price reports can be pulled for free on EVM (Pyth fee = 0) — [Pyth fees](https://docs.pyth.network/price-feeds/core/current-fees); at scale for short-horizon markets — [Chainlink Q2](https://chain.link/blog/quarterly-review-q2-2026)
- drand verification is ~131–141K gas on L1 — [drand blog](https://docs.drand.love/blog/2025/08/26/verifying-bls12-on-ethereum)
- Thin-market manipulation (Nostra ~8,000x price spike) — [shattered.io](https://shattered.io/nostra-finance-3-5-million-pragma-oracle-exploit-2026/); single-signer or authorization failures (Ostium, Full Sail) — [CoinDesk](https://www.coindesk.com/business/2026/07/15/ostium-suffers-usd18-million-exploit-as-oracle-attack-wave-continues-to-hit-defi)
- TEE forgery cost of <$1,000 plus physical access — [tee.fail](https://tee.fail/)
- zkTLS = trust in the notary key — [TLSNotary](https://tlsnotary.org/blog/2026/06/17/public-verifiability)
- Token-vote capture — [KuCoin](https://www.kucoin.com/news/flash/polymarket-dispute-resolution-system-under-scrutiny-as-uma-voting-raises-fraud-concerns)
- Insider-driven war markets — [NPR](https://www.npr.org/2026/03/01/nx-s1-5731568/polymarket-trade-iran-supreme-leader-killing)

### Inferences: classification

| Data class | Manipulation resistance | Main attack | Harm-market risk |
|---|---|---|---|
| On-chain state, deep-liquidity TWAP / multi-block | High | Multi-block MEV, thin pools | Low |
| drand beacon / VRF with fixed request | High | Provider withholding (Entropy), proposer bias (RANDAO) | None |
| Multi-publisher signed prices (Pyth, Chainlink Streams) | High for majors; low for long-tail assets | Thin-market pumps, stale/future timestamps | Low |
| Cross-chain or historical storage proofs (vlayer Teleport/Time Travel, light clients) | High | Reorgs/finality assumptions | Low |
| M-of-N zkTLS attestations of institutional JSON APIs (e.g., official stats, sports data) | Medium | Notary collusion, BGP/DNS, source error or revision | Medium (depends on endpoint) |
| Single-attestor zkTLS / single TEE | Low–medium | Operator key compromise; physical TEE forgery | Medium |
| LLM-judge (closed API) | Low | Sampling/grinding, silent model updates, prompt injection via the judged content | High (can launder any question) |
| LLM-judge (open weights, re-executable, pinned inputs) | Medium | Prompt injection in inputs, ambiguity | Medium–high |
| Optimistic human/token vote | Low at scale | Whale capture, voter-held positions | High (accepts any question) |
| Actor-caused events (deaths, attacks, posts, commits, a person's statements) | Very low | The bettor causes the outcome | Very high |

### Inferences: non-obvious compositions (all speculative and unverified, for design exploration)
1. **drand as a chain-agnostic deadline clock.**
   - Express deadlines as drand round numbers, not `block.timestamp`.
   - Settlement requires a drand signature for round R (proves "time ≥ deadline" without trusting sequencer timestamps) plus a price report with `publishTime ≤ time(R)`.
   - Also gives free tie-breaking randomness from the same signature.
2. **drand timelock (tlock) for sealed resolver parameters or sealed takes**, so agents can't front-run each other's sides. Decryption becomes possible exactly at round R.
3. **Bonded attestation wrapper.** Any zkTLS/TEE output enters the resolver as a *claim* with a bond and liveness window. A challenger submits a conflicting attestation from a *different* trust root (a different notary set, TEE vendor or Nitro vs TDX). Conflicting roots → INVALID/refund.
   - This turns the TEE.fail forgery cost into a lower bound and makes forgery detectable instead of silent.
4. **Multi-vendor TEE quorum.** Require 2-of-3 across Intel TDX (Automata DCAP), AMD SEV-SNP and AWS Nitro (SP1-wrapped, ~260K gas). One interposer does not break all three, since Nitro's trust root differs (Amazon hypervisor + KMS).
5. **"TEE runs the zkTLS verifier" (TLSNotary's proposal).** Integrity from the TEE plus privacy from zkTLS; failure requires breaking both.
6. **Settlement-MEV recapture.** Resolving a market is an oracle update that creates value for whoever submits first (as with liquidations). Following Chainlink SVR / API3 OEV, the protocol could auction the right to submit the resolving report and route proceeds to the losing side or a fee pool, instead of letting agents race.
7. **Re-executable LLM judges.** Pin model weights hash + prompt template + inputs (themselves storage proofs or drand-anchored price reports) + seed. The resolver accepts a TEE attestation of the output optimistically; any agent can dispute by re-running the open-weights model (or a zkML proof such as DeepProve, ePrint 2026/1112). This converts "AI judgment" into "deterministic compute with a fraud proof."
8. **Self-commitment markets on actor-caused data.** Data classes that are dangerous for third-party bets (GitHub commits, posts, payments sent) are *safe and useful* when the actor is the poster of the stake. "I bet I will ship X by T" is a commitment device, and the counterparty agent is effectively insuring. The VM can enforce `resolver_subject == market_creator` for these classes.
9. **Peer-style payment attestations as resolver inputs.** "Pay out if a fiat payment of ≥$X to handle Y is observed before T" enables agent-to-human service contracts (agents paying humans off-chain), with Peer's nullifier and cap design reused.
10. **Storage proofs of other markets.** A resolver can read Polymarket/other on-chain market *outcomes* via storage proofs (vlayer Teleport-like). That inherits their curation and UMA-vote risk, but lets a permissionless protocol build derivatives on curated outcomes without hosting curation itself.

### Gaps
- None of the compositions above were found implemented in production by any cited source. They are design hypotheses.
- No source quantified the drand tlock on-chain cost or a multi-vendor TEE quorum's gas cost in one transaction.
