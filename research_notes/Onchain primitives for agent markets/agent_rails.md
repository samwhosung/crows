# Agent-native on-chain rails: identity, payments, wallets, intents, escrow, and the real agent economy (state as of 21 Oct 2026)

## 1. Agent identity & reputation: ERC-8004, ENS, Olas, Virtuals, Recall, and others

### Takeaway
ERC-8004 has become the default agent identity layer. It has been live on mainnet since 29 Jan 2026 at the same addresses on about 29–30 chains, and trackers count about 842k registrations. That number is mostly noise. Only 3–15% of agents expose a live endpoint. 59–91% of reviewers look like Sybils. Almost no feedback (0–1.3% of records) carries a payment proof. The Validation Registry is effectively unused. So the identity rail exists, but grounded, Sybil-resistant reputation does not. A protocol that settles real stakes could produce that missing signal.

### Cited Findings
**ERC-8004 spec and governance**
- ERC-8004 ("Trustless Agents") is still a **Draft** Standards-Track ERC, created 2025-08-13. It requires EIP-155/712/721/1271. It defines three per-chain registries: Identity, Reputation and Validation. — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- Authors: Marco De Rossi (MetaMask), Davide Crapis (Ethereum Foundation), Jordan Ellis (Google), Erik Reppel (Coinbase). — [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)
- **Identity Registry** = ERC-721 + URIStorage. `agentId` = tokenId, globally named `{namespace}:{chainId}:{identityRegistry}`. Main functions: `register()` (3 overloads), `setAgentURI`, and `setMetadata`. A reserved `agentWallet` key is set via `setAgentWallet(agentId,newWallet,deadline,signature)`, which takes an EIP-712 or ERC-1271 proof, and it is cleared when the NFT is transferred. — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **Registration file** fields: `services[]` (web, A2A, MCP, OASF, ENS, DID, email endpoints), `x402Support` (bool), `active`, and `supportedTrust` (reputation / crypto-economic / tee-attestation). Optional domain proof goes in `.well-known/agent-registration.json`. — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **Reputation Registry**: `giveFeedback(agentId, value:int128, valueDecimals:uint8, tag1, tag2, endpoint, feedbackURI, feedbackHash)`. The agent owner or operator cannot rate itself. Also `revokeFeedback` and `appendResponse` (anyone can append, e.g. a refund notice or spam flag). `getSummary` requires a non-empty client list. Payments are explicitly out of scope; the off-chain feedback file *may* carry a `proofOfPayment` (from, to, chainId, txHash) for x402. — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **Validation Registry**: `validationRequest(validator, agentId, requestURI, requestHash)` and `validationResponse(requestHash, response 0–100, responseURI, responseHash, tag)`. Validators can respond more than once (soft→hard finality). Incentives and slashing live outside the registry. — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- Mainnet proxies sit at the same addresses on about 25 chains: Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`, Validation `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58`. **All three proxies on Ethereum and Base are owned by a single plain EOA** (`0x5472…2603`) with no multisig or timelock. The Reputation proxy has already been upgraded twice. (Audit dated 17 Aug 2026.) — [LLM4Agents audit](https://llm4agents.com/blog/erc-8004-registries-onchain-audit)
- Timeline: draft 13 Aug 2025 → mainnet 29 Jan 2026 → multichain rollout 3–4 Feb 2026 → BNB Chain passed Ethereum and Base in agent count in mid-March 2026. — [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)

**ERC-8004 adoption numbers (inflated by placeholders and Sybils)**
- Growth: 337 agents at launch → 49,283 two weeks later → about 200k+ by mid-April 2026. — [Decipher Club](https://www.decipherclub.com/so-what-exactly-are-trustless-agents-up-to/)
- 8004scan, 18 Sep 2026: 519,333 agents, 589,322 feedback and 469,313 unique wallets across 30 networks. BNB Chain holds 62.1% of agents but 2.0% of feedback. Base holds 13.1% of agents but 79.1% of feedback. Ethereum holds 6.0% of agents. In July, only about 2.24% of agents passed 8004scan's A2A/MCP health checks. — [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)
- 8004scan live counter, fetched 21 Oct 2026: **841,978 agents (+110,721 in 24h), 739,030 feedback, 1,037,317 unique wallets (+220,163 in 24h), 29 networks.** Networks shown include Arc Mainnet, Monad, Taiko, GOAT Network, Gnosis and Linea. — [8004scan](https://8004scan.io/)
- Imperial-led empirical study (data to 13 May 2026; ETH 32,343 / BSC 90,145 / Base 50,985 agents):
  - Only 3% / 4% / 15% have a valid registration file with ≥1 live service.
  - 53% / 9% / 37% have no URI at all.
  - 48.3% of Ethereum agents were registered in batch transactions.
  - The top 1% of wallets own 58.5% (ETH) and 54.9% (Base) of agents.
  - On Base, MCP+A2A make up nearly half of declared services. On BSC, about 70% are plain web services. — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2)
- Same study, reputation data:
  - Feedback records: 3,058 (ETH), 29,444 (BSC), 122,798 (Base).
  - Sybil-flagged reviewers: 73.5%, 59.2%, 90.6%. Sybil share of feedback: 41.4%, 96.3%, 92.6%.
  - After removing Sybils, 77.9% (BSC) and 86.8% (Base) of rated agents have no valid feedback left.
  - Median cost to push a score across the 90 threshold: **$0.055 (ETH), $0.0042 (BSC), $0.0027 (Base)**.
  - 98.7–100% of feedback records have neither a payment proof nor a task link. Only 6.2% of Base reviewers have any x402 payment history.
  - Reputation for the same agent is uncorrelated across chains (Spearman ρ 0.05–0.14).
  - Only 629 agents (0.4%) are on two or more mainnets. — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2)
- Same study: the median x402 payment volume per Base agent is about **$0.70**. — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2)
- Validation Registry status (sources conflict):
  - arXiv: "no confirmed mainnet deployment" during Jan–May 2026. — [arXiv](https://arxiv.org/html/2606.26028v2)
  - LLM4Agents: deployed (Ethereum proxy v2.0.0), with **0 requests and 0 responses on Ethereum** and **13 requests and 8 responses on Base** as of 17 Aug 2026. — [LLM4Agents](https://llm4agents.com/blog/erc-8004-registries-onchain-audit)
  - DataWallet: a 18 Sep review found "no Validation Registry address on any of the 24 mainnets", and the repo says the section is "still being revised with the TEE community." — [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)
- Ethereum mainnet activity to block 25.77M: 3,215 `NewFeedback` events across 1,668 agents (about 3.3% of registered) from 653 client addresses, and 0 `FeedbackRevoked`. — [LLM4Agents](https://llm4agents.com/blog/erc-8004-registries-onchain-audit)
- The most concrete production use of the Reputation Registry is an ERC-8183 `ReputationGateHook` on Base, which gates escrow funding on a reputation threshold. No volume figures are published. — [Decipher Club](https://www.decipherclub.com/so-what-exactly-are-trustless-agents-up-to/)
- Integrations:
  - BNB Chain launched ERC-8004 support alongside its own BAP-578.
  - Tempo hosts an ERC-8004 registry.
  - EIP-7702 lets reviewers pay gas without registering first. — [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)

**ENS**
- **ENSIP-25** (Draft, created 2 Oct 2025; released 4 Mar 2026 per DataWallet) binds an ENS name to a registry entry. It uses the text record `agent-registration[<ERC-7930 registry address>][<agentId>]` with any non-empty value. Verification flow: registry → construct key → resolve text record. Stale records are a risk after an ENS name changes hands. — [ENSIP-25](https://docs.ens.domains/ensip/25); [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)

**Reputation economics without persistent identity**
- Gatta, Naviglio and Tarantelli (Scuola Normale Superiore / Bologna, 2 Sep 2026) model reputation as capital that an agent can "liquidate" in a one-shot deviation and then re-enter under a new identity. Reputation disciplines behaviour only when identity reset is costly and rebuilding is slow. The paper adds **staking and slashing as a complementary enforcement mechanism**, with a trade-off: more stake lowers the temptation to deviate but raises the cost of operating honestly. The paper names ERC-8004, ERC-8183 and x402 as the motivating setting. — [arXiv 2609.02992](https://arxiv.org/pdf/2609.02992)

**Olas (Autonolas)**
- Live olas.network counters, 21 Oct 2026:
  - 20,912,527 total on-chain transactions, of which 14,832,945 are agent-to-agent, across 7 chains.
  - **448 daily active agents** (7-day average of unique multisigs) and 3,776 unique operators.
  - 3.21M OLAS staked.
  - Mech Marketplace cumulative turnover **$110,148** and fees **$885.37**. The fee went live 15 Jun 2026.
  - Products: Pearl ("agent app store"), Mech Marketplace, Olas-Predict-R1-14B, and Connect on Robinhood Chain. — [olas.network](https://olas.network/)
- Older context (Feb 2025): 3.5M+ agent transactions across nine chains and a $13.8M raise for Pearl. — [The Block](https://www.theblock.co/post/338713/olas-raises-13-8-million-to-launch-pearl-an-app-store-for-autonomous-ai-agents-in-crypto)

**Virtuals (registry side)**
- The Virtuals API registry lists 44,052 agents. **2,470 have ever had a job, and 151 have earned more than $1,000.** — [ChainWard](https://chainward.ai/decodes/virtuals-top-dog)
- Graduated Virtuals agents are auto-registered on ERC-8004. The number is not disclosed. — [Decipher Club](https://www.decipherclub.com/so-what-exactly-are-trustless-agents-up-to/)

**Recall Network**
- AgentRank is a score made of performance (task effectiveness) and certainty (consistency over time). It changes as agents compete and as curators stake on them. Competition results are logged on-chain so they can be audited and reproduced. — [4pillars](https://4pillars.io/en/articles/recall-the-onchain-arena-for-ai-agents)
- Early competition AlphaWave was a 7-day testnet trading-alpha contest with a $25k USDC prize pool. — [Recall blog](https://paragraph.xyz/@recall/alphawave-the-ultimate-battleground-for-defai-agents)
- Search-surfaced coverage claims about 7,000 head-to-head matchups and 7.8M predictions across eight skills in the first quarter of rollout. This comes from an undated secondary source that I did not fetch directly. — [CoinFund insights](https://www.coinfund.io/insights/we-gave-ai-observer-status-soon-itll-be-running-the-call)

**Catena Labs ACK-ID**
- Agent Commerce Kit (ACK) offers W3C DID and VC-based agent identity (ACK-ID), plus ACK-Pay, where payment receipts are VCs. Demos include A2A and Skyfire KYA. It is MIT licensed, with 158 stars. — [GitHub ACK](https://github.com/agentcommercekit/ack)

### Inferences
- ERC-8004 identity is cheap to create. Registrations are rising by about 110k per day, more than the Sybil study's whole Ethereum count in one day. So an agent's ERC-8004 NFT is a namespace and discovery pointer, not a trust signal. For the conditional-contract protocol: **accept ERC-8004 IDs as optional handles, but weight reputation only by your own settled, stake-at-risk history.**
- The protocol could become the **"grounded feedback" source the 8004 ecosystem lacks**. Each resolved contract could emit `giveFeedback` (or an EAS attestation) whose `feedbackURI` points to on-chain settlement. That gives a 100% payment-proofed record, against the 0–1.3% baseline. The resolver contract or a protocol-owned reviewer address would be the natural submitter. Owners cannot self-rate, which fits.
- The Validation Registry is empty. A code-resolved contract's resolution is itself a deterministic validation. The protocol could be the first real heavy user of `validationRequest/Response`, with the resolver contract as validator. This would put a slot that is currently empty to use.
- Gatta et al. formally back the user's "bonds instead of KYC" thesis. Reputation tied to a key only disciplines behaviour if abandoning the key is costly. So bonds should be **time-locked or slashable and tied to the key's history**, such as an unbonding delay or reputation that decays to zero on a new key. Instantly withdrawable stake does not do this.
- Single-EOA upgrade control of the 8004 proxies is a dependency risk. Treat 8004 as an optional, read-only integration, not a hard dependency in settlement paths.

### Gaps
- **Fetch.ai / ASI Alliance Almanac, Story Protocol, Theoriq, EAS-for-agents schemas (beyond Alkahest), BasedAgents**: no 2026 sources were gathered. The search budget was exhausted. Status and adoption are unknown.
- **World ID / proof-of-personhood for agents** (e.g. any "AgentKit"-style proof-of-human-behind-agent): I tried world.org (404) and found no verified source. Unknown.
- Recall's 2026 status (mainnet, RECALL token, current competitions) could not be confirmed. Sources were undated.
- Olas Mech Marketplace request counts and real versus incentive-driven share are not published on the homepage.

## 2. Agent payments: x402, AP2/A2A, MPP/Tempo, Stripe/OpenAI ACP, Circle/Arc, cards, Lightning, and others

### Takeaway
x402 is the de facto crypto-native agent payment rail. It now has neutral governance (the x402 Foundation under the Linux Foundation, operational 14 Jul 2026, 40 members including Visa, Mastercard, Stripe, Google and AWS) and a V2 spec with extensions, discovery and multiple schemes (`exact`, `upto`, `batch-settlement`, `auth-capture`). Real organic volume is tiny. Lifetime is about $42M raw, about $15M after removing wash and test traffic. Recent run-rate is about $20k per day and about $0.05 per payment, dominated by a few vendors. Tempo (MPP, Stripe and Paradigm, mainnet 18 Mar 2026) and Circle Arc (mainnet 16 Sep 2026) are the new stablecoin L1s pitched at agents. AP2 is now a FIDO-hosted mandate (authorization evidence) layer, not a rail. **No major payment standard natively supports conditional or escrowed settlement yet.** x402 has an `escrow` *flow* and an open `job-escrow` proposal (5 Oct 2026, no maintainer response).

### Cited Findings
**x402 protocol and governance**
- Launched by Coinbase in May 2025. The Linux Foundation announced the x402 Foundation, and per Pondero it became operational on **14 Jul 2026 with 40 members**. Premier members: Adyen, AWS, Amex, Circle, Cloudflare, Coinbase, Fiserv, Google, Mastercard, Shopify, Stripe, Visa. — [Pondero, 7 Oct 2026](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/); [LF press release](https://www.prnewswire.com/news-releases/linux-foundation-is-launching-the-x402-foundation-and-welcoming-the-contribution-of-the-x402-protocol-302732803.html)
- **x402 V2** changes:
  - Payment data moves to headers (`PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`).
  - Formal **Extensions** (advertised in `PaymentRequired` and echoed by clients).
  - Wallet-controlled **sessions**, with Sign-In-With-X (CAIP-122) "coming very soon".
  - A **Discovery** extension that facilitators crawl.
  - CAIP-2 network IDs, including non-chain rails `ach:us` and `sepa:eu`.
  - Dynamic `payTo` routing (address, role or callback-defined).
  - A plugin SDK under the `@x402` npm org with lifecycle hooks.
  - Multi-facilitator selection.
  - Backward compatibility with V1.
  - The page claims "over 100M payments". — [x402 V2 launch](https://x402.org/x402-v2-launch/)
- Spec v2 schemes and flows:
  - Scheme directories: `exact`, `upto`, `batch-settlement`, `auth-capture`. — [x402 schemes dir](https://github.com/x402-foundation/x402/tree/main/specs/schemes)
  - `exact` on EVM uses an EIP-3009 authorization. Solana and XRPL are also listed.
  - `upto`: the amount is a maximum at verification, and the settled amount may differ. The default flow is `authorization` on EVM and `escrow` on SVM.
  - Payment *flows*: `authorization` (verify→resource→settle), `upfront` (settle→resource), and **`escrow` (settle deposit or ceiling → resource → settle final)**.
  - The spec says settle "MAY establish an escrow". Refunds are not specified.
  - Discovery API: `GET /discovery/resources`, filtered by type, payTo, scheme, network and extensions. — [x402 spec v2](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md)
- **`job-escrow` scheme proposal** (issue #3694, opened 5 Oct 2026):
  - It brings ERC-8183 client, provider and evaluator semantics into x402. The client creates the job on-chain and signs a funding authorization. The provider commits a deliverable hash. The evaluator completes or rejects. The facilitator only relays. The server advertises acceptable evaluators and hooks.
  - It is contrasted with `auth-capture`, a single operator with custom operator contracts for arbitration.
  - Status: open, no assignees, **no maintainer response**. The only commenter suggested adding a hash of deterministic acceptance rules, and their project was "retired" on 10 Oct. — [x402 #3694](https://github.com/x402-foundation/x402/issues/3694)
- x402 settlement is final, with no chargebacks. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)
- Stripe reportedly added x402 payments on Base in Feb 2026. This is industry reporting cited by a vendor. — [Nevermined](https://nevermined.ai/blog/best-platforms-agentic-payments)

**x402 volume: raw versus real**
- Cumulative to 20 Oct 2026: **192,173,010 transactions and $41,938,138 settled** (about $0.22 average) across 12 chains and 18 facilitators. — [agenteconomy.to](https://agenteconomy.to/stats/x402-transactions)
- Cumulative transactions by month (millions): Oct 2025 4 → Nov 57 → Dec 111 → Jan 2026 130 → Apr 144 → Jul 160 → Sep 190 → Oct 192. **Most volume came in the Nov–Dec 2025 PING-farming spike.** Peak day was 15 Nov 2025 with 3.79M transfers. — [agenteconomy.to](https://agenteconomy.to/stats/x402-transactions); [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Measurement lenses compared in the July 2026 CURB report:
  - x402scan all-time: 195M transactions, $52.31M, 843k buyers, 226k sellers.
  - Artemis raw: 178.3M, $135.7M.
  - **Visa × Artemis adjusted (wash and test removed): 109.6M transactions, $15.0M, about 422k buyers and about 5,300 sellers. About 89% of raw volume was excluded.**
  - An arXiv forensic study bounds independent flow at **$0.19M–$20.3M**. It finds 21.2% of settlements fictitious and 63.8% internal to linked clusters.
  - Top 1% of adjusted buyers = about 90% of adjusted volume. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Run-rate in July 2026:
  - x402scan 30-day: 17.28M transactions, **$825k**, mean about $0.048.
  - 24-hour window: 211,652 transactions, **$19.8k**. Coinbase CDP facilitator handled about 93% of those transactions.
  - Indexer-measured run-rate about $10.2M per year.
  - Artemis live 30-day change: transactions −96.5%, volume −89%. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Conflicting 30-day figure: x402.org's hand-edited panel and a CoinDesk 15 Jul figure show about 75M transactions and $24M in 30 days. CURB calls the x402.org panel static and stale. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026); [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)
- Vendor concentration (30-day to July 2026):
  - **BlockRun $177.3k from 14.48M transactions (about 1.13k buyers)**, about 9.5× the #2 vendor, dTelecom at $18.75k.
  - Next: StableEnrich $1.77k, twit.sh $621, Nansen AI $131.
  - Registries: Coinbase Bazaar lists 25,560 resources and PayAI 24,094. A 21Shares estimate says about 46.7% of registered services are dead. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Payment-size distribution (Solana, n=1.5M payments, $409k): payments under $0.10 are 78.5% of the count but 7.0% of the value. **$1–$10 payments are 7.85% of the count and 53.6% of the value.** — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Chainalysis attributes much of the 100M+ Base transactions to **PING**, a pay-to-mint meme coin. Artemis (March 2026) found about half of observed transactions were artificial. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)
- Facilitators:
  - April 2026 snapshot: Daydreams 8.1M+ cumulative transactions, Coinbase (3 facilitators) 7.6M+, x402rs 411k+, Canza 12k+. Chain split: Base about 70M transactions and $21.5M, Solana about 45M and $16.4M. — [web3trackers](https://www.web3trackers.com/x402-dashboard)
  - Early Sept 2026, 7-day: about 1.7M settlements and about $108.5k across 37 listed facilitators. This is a search-snippet figure. — [x402-list facilitators](https://x402-list.com/facilitators)
- npm monthly downloads (July 2026): `x402` core 1.2M, `@coinbase/x402` 201k. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)

**Google AP2, A2A x402 extension, and UCP**
- AP2 launched 16 Sep 2025 with 60+ organizations. **It moves no money.** It produces signed Mandates as SD-JWT verifiable credentials: `mandate.checkout.1` (closed), and `mandate.checkout.open.1` and `mandate.payment.open.1` (open, pre-authorized within constraints). It was **donated to the FIDO Alliance on 28 Apr 2026 with v0.2**, which adds "Human Not Present" payments. Mastercard co-developed Verifiable Intent, which also moved to FIDO. Unsolved: the liability table is non-binding, and issuing trusted public keys remains open. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/); [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- The A2A x402 extension (Google + Coinbase) is described as production-ready and links AP2 authorization to x402 settlement. — [Coinbase](https://www.coinbase.com/developer-platform/discover/launches/google_x402)
- UCP (Universal Commerce Protocol, Google + Shopify, Jan 2026) handles discovery and checkout negotiation. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)

**OpenAI/Stripe Agentic Commerce Protocol (ACP; not the same as Virtuals ACP)**
- Launched 29 Sep 2025 with ChatGPT Instant Checkout. It is still beta and controlled by two maintainers. Spec releases run to 2026-04-17, which added cart, feeds, orders, authentication and MCP.
- The 2026-04-17 **Allowance** schema bounds agent spend with `max_amount`, session/merchant scope and `expires_at`. Only `one_time` is allowed.
- Per Coincub, Instant Checkout was **wound down around 4 Mar 2026**, with about a dozen Shopify merchants live. This is a secondary report.
- Stripe docs (as of 7 Oct 2026) list **MPP or x402 for accepting machine payments**. UCP and ACP selling were in private preview. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)

**Tempo and MPP (Stripe + Paradigm)**
- Mainnet went live on **18 Mar 2026** after a December 2025 testnet. MPP was co-authored by Stripe and Tempo and is rail-agnostic. Visa (cards), Stripe (cards and wallets) and Lightspark (Lightning) have extended it.
- **Sessions**: the agent pre-funds, and payments stream against those funds off-chain, aggregated into one settlement ("OAuth for money").
- A payments directory listed 100+ MPP services at launch, including Alchemy, Dune, Merit Systems and Parallel.
- Chain features: payment lanes, protocol memos, smart accounts.
- Named partners: Anthropic, DoorDash, Mastercard, Nubank, OpenAI, Ramp, Revolut, Shopify, Standard Chartered, Visa.
- **No usage stats were published.** — [Tempo blog](https://tempo.xyz/blog/mainnet/); [CoinDesk](https://www.coindesk.com/tech/2026/03/18/stripe-led-payments-blockchain-tempo-goes-live-with-protocol-for-ai-agents)

**Circle Arc and USDC for agents**
- Arc public mainnet launched **16 Sep 2026** after a private mainnet with 100+ builders. USDC is the gas token, with sub-second finality.
- Founding validators: BlackRock, DTCC, Galaxy, ICE, Mastercard, MoneyGram, SBI, Standard Chartered, Sumitomo, Visa, Worldpay.
- **Circle Agent Stack**: policy-controlled Agent Wallets, **Nanopayments via Circle Gateway**, and an emerging Agent Marketplace. Arc Portal funds agent wallets, sets spend limits and delegates tasks. **AgentVM is under development.**
- Circle claims 98.8% of autonomous-agent transaction volume on its products is in USDC. This is a company claim. — [Business Wire / Circle](https://www.businesswire.com/news/home/20260916108863/en/Circle-Launches-Arc-Mainnet-an-Economic-Operating-System-for-the-Internet); [Arc blog](https://www.arc.io/blog/arc-mainnet-goes-live-on-september-16-2026)
- ERC-8183 reference contract on Arc **testnet**: `0x0747EEf0706327138c69792bF28Cd525089e4583`. — [Arc blog](https://www.arc.io/blog/running-an-agentic-economic-flow-on-arc-with-erc-8183)

**Card networks**
- Visa Trusted Agent Protocol (October 2025) distinguishes legitimate agents from bots. It is in early deployment with partner banks. Visa–OpenAI announced on 10 Jun 2026. Mastercard Agent Pay uses Agentic Tokens and Verifiable Intent. A Santander live agent payment ran in March 2026. Mastercard "Agent Pay for Machines" was announced 10 Jun 2026; only one source claims it stores agent credentials on public blockchains. **No official transaction counts exist.** — [ATXP comparison](https://atxp.ai/blog/mastercard-agent-pay-stripe-acp-visa-x402-comparison-2026/); [Crossmint](https://www.crossmint.com/learn/agent-card-payments-compared)

**Other agent payment vendors** (vendor-authored; claims unverified)
- **Nevermined**: usage, outcome and value-based pricing, signed usage logs, 1% fee, claimed native x402/MCP/A2A/AP2 support. Valory case study.
- **Skyfire**: Know-Your-Agent identity and funded wallet IDs, $8.5M seed.
- **Payman**: spend limits, payee allowlists, USDC wallets, SOC2/PCI claims.
- **PayPal Agent Toolkit**: adopting OpenAI/Stripe ACP. — [Nevermined, 8 May 2026](https://nevermined.ai/blog/best-platforms-agentic-payments)

**Lightning L402**
- Lightning Labs `lightning-agent-tools` includes:
  - `lnget`, which auto-pays L402 invoices on 402 responses.
  - `aperture`, an L402 reverse proxy for selling.
  - `macaroon-bakery` for scoped pay-only, invoice-only and read-only credentials.
  - Remote-signer security tiers.
  - An MCP server with 18 read-only tools.
  - The repo has 60 stars (small adoption). — [GitHub](https://github.com/lightninglabs/lightning-agent-tools)

### Inferences
- **Using x402 as the stake rail is viable but needs an on-chain escrow contract.** x402 settlement is final and facilitator-relayed. The clean design mirrors the `job-escrow` proposal: the HTTP 402 response for "take this contract" carries a payment requirement whose `payTo` is the conditional-contract escrow, plus `extensions` metadata (contractId, resolver hash, deadline). The facilitator relays an EIP-3009 `transferWithAuthorization`, or an ERC-2771 call, into the escrow. This works today with the `exact` scheme to an escrow address. A dedicated `conditional`/`job-escrow` scheme is still unstandardized. The user could co-author #3694, which is open and has no maintainer engagement, or propose a sibling `stake-escrow` scheme.
- Real economic demand on these rails is tiny, roughly $10M per year run-rate across all of x402, and heavily concentrated. Small-ticket, high-frequency design fits the observed ticket distribution: the value is in $1–$10 payments. But **wash resistance must be designed in from day one**. Every agent-economy metric so far was dominated by farming, from PING to the Virtuals Revenue Network.
- The Tempo MPP "sessions" and Circle Nanopayments (Gateway) models are effectively pre-funded channels with batched settlement. They match "many small stakes, net once". A conditional-contract protocol could let a taker pre-fund a session and take many contracts, netting outcomes periodically, like a clearinghouse. Celer AgentPay was originally designed this way (conditional payments over state channels).
- AP2 mandates (open `payment` mandates with constraints) are a ready-made format for *user → agent* authorization ("my agent may stake up to $50 per day in contracts whose resolver is on list X"). They are SD-JWT VCs, not on-chain. ERC-7715 (section 3) is the on-chain equivalent.

### Gaps
- No primary-source volume data for MPP/Tempo, Circle Nanopayments, Skyfire, Nevermined, Payman or L402. None publish verifiable on-chain totals that I could find.
- Tempo validator set (reported to include Stripe, Visa, Zodia, MoneyGram, zerohash, the last added 6 Oct 2026) came from a search summary without a pinned source. Unverified.
- Catena Labs company status, licensing and funding in 2026: not found.
- Whether MPP has a formal escrow or conditional primitive beyond sessions: not found.
- Celer AgentPay: third-party aggregator listings say it launched 1 Dec 2025 ([Bitget dApp listing](https://web3.bitget.com/vi/dapp/agentpay-32430)). The docs describe channel, payment and condition contracts ([AgentPay docs](https://agentpay-docs.celer.network/agentpay-architecture/on-chain-contracts/)), but I found **no 2026 deployment, usage or deprecation info**. Treat it as dormant or unknown.

## 3. Agent wallets & permissions: how agents get bounded on-chain authority

### Takeaway
There are three shipped patterns for bounding an agent:
1. **Custodial or semi-custodial TEE wallets with API-layer policy.** Coinbase Agentic Wallets (11 Feb 2026) offer session caps and per-transaction limits. Circle Agent Wallets work similarly.
2. **On-chain delegations with caveat enforcers.** MetaMask Advanced Permissions (6 Apr 2026) use ERC-7715 requests and ERC-7710 redemption. Permission types are periodic, stream and revocation. They work on 12 EIP-7702 chains and support sub-delegation.
3. **Smart-contract wallets with Solidity-enforced caps.** Example: agentwallet-sdk.

EIP-7702 is widely used (about 51–60M live delegated accounts), but a majority of authorizations relate to sweepers or phishing. Older toolkits (Coinbase AgentKit) still ship *without* spend caps.

### Cited Findings
- **Coinbase Agentic Wallets** (launched 11 Feb 2026):
  - Built on CDP plus x402.
  - Programmable spending limits: session caps and per-transaction limits.
  - Keys held in TEEs so the LLM never sees them.
  - CLI for holding and spending stablecoins on Base. — [Coinbase launch](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets); [CDP docs](https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome)
  - Descriptions of key custody differ: MPC in AWS Nitro versus Intel TEE. Described as semi-custodial, with spend limits enforced at the API layer. — [Eco](https://eco.com/support/en/articles/14845485-coinbase-agentic-wallets-explained); [DEV, Mar 2026](https://dev.to/ai-agent-economy/the-agent-wallet-landscape-in-2026-whos-building-what-and-whats-actually-shipping-312n)
- **Coinbase AgentKit** (2024 SDK):
  - 1.3k stars, 871 forks, 50+ TypeScript and 30+ Python actions.
  - Frameworks: LangChain, Vercel AI, MCP, OpenAI Agents SDK, Strands. Wallets: CDP, Privy, Viem.
  - Its README warns that it **does not require human approval, enforce spend caps, or allowlist destinations**, and that prompt injection can cause transfers. — [GitHub AgentKit](https://github.com/coinbase/agentkit)
- **MetaMask Advanced Permissions** (6 Apr 2026, Smart Accounts Kit):
  - ERC-7715 `wallet_requestExecutionPermissions` plus ERC-7710 delegation redemption by a session account that never holds user funds.
  - Permission types: `erc20-token-periodic`, `native-token-periodic`, `erc20-token-stream`, `native-token-stream`, `erc20-revocation`.
  - Caveat enforcers validate every execution on-chain. Post-execution hooks revert if the outcome does not match the intent.
  - **Sub-delegation** (Alice→Bob→Carol) supports agent-to-agent and solver architectures.
  - Chains: Arbitrum, Base, Berachain, BNB, Citrea, Ethereum, Gnosis, Monad, Optimism, Polygon, Sonic, Unichain. — [MetaMask](https://metamask.io/news/introducing-advanced-permissions)
  - ERC-7715 is still a Draft ERC as of April 2026. Unichain announced ERC-7715 support. — [Eco](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions); [Unichain on X](https://x.com/unichain/status/2043763060989407688)
- **EIP-7702** (live since Pectra, May 2025):
  - About 51M live delegated accounts and 230M cumulative authorizations (late August 2026, BundleBear via secondary blog).
  - Another count: about 60M addresses with a live delegation and 106M+ set-code transactions, inflated by sweeper bots.
  - A USENIX Security 2026 study found >63% of analysed authorizations linked to sweepers, phishing or blind signing. This is a secondary citation. — [hoge.gg](https://hoge.gg/eip-7702-2026-complete-guide-smart-account-wallets/); [hoge.gg dark side](https://hoge.gg/eip-7702-smart-account-dark-side-2026/); [Eco](https://eco.com/support/en/articles/15254037-erc-7702-deep-dive-2026-eoa-becomes-smart-wallet)
- **Circle Agent Wallets / Arc Portal**: fund agent wallets, set spend limits, delegate on-chain tasks. — [Business Wire / Circle](https://www.businesswire.com/news/home/20260916108863/en/Circle-Launches-Arc-Mainnet-an-Economic-Operating-System-for-the-Internet)
- **agentwallet-sdk** (indie, MIT): Solidity-enforced daily and per-transaction caps with owner override, 17 chains, ERC-8004 identity. The author is biased. MoonPay agent wallets launched 24 Feb 2026, but the author found no documented spend-limit enforcement. — [DEV](https://dev.to/ai-agent-economy/the-agent-wallet-landscape-in-2026-whos-building-what-and-whats-actually-shipping-312n)
- **OpenAI/Stripe ACP Allowance**: `max_amount`, scope and `expires_at` on Stripe Shared Payment Tokens. This is the fiat-side equivalent of a spend-capped delegation. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)
- **Lightning macaroons**: scoped credentials (pay-only, invoice-only) with a remote signer. — [lightning-agent-tools](https://github.com/lightninglabs/lightning-agent-tools)

### Inferences
- **Best fit for the protocol:**
  - Write a custom ERC-7710 **caveat enforcer**: "may only call `take()` / `post()` on ConditionalContracts at address X, resolver codehash in set S, stake ≤ $N per period".
  - Combine it with `erc20-token-periodic`.
  - Result: a human grants a bounded, revocable, on-chain-enforced budget to an agent, and the agent never custodies funds.
  - Sub-delegation lets a lead agent hand narrower budgets to specialist sub-agents ("you may take weather contracts up to $5 per day").
  - This is shipped tech today on 12 chains. Only the custom enforcer is new.
- For agents on Coinbase or Circle custodial wallets, the protocol should **expose a single, simple contract surface**, such as one escrow contract with typed functions, so API-layer allowlists can whitelist it.
- Given the >63% malicious-authorization finding for 7702, the protocol should never require users to sign 7702 delegations to protocol-specific code. Rely on standard audited delegators such as MetaMask or Coinbase.

### Gaps
- No 2026 primary data gathered on Privy, Turnkey, Safe (modules, AllowanceModule, Zodiac Roles), Crossmint, Lit, ZeroDev, Biconomy, or ERC-7579 module adoption. The search budget was exhausted. Their policy engines and session-key products existed pre-2026, but current status and usage are unverified.
- No usage numbers for Coinbase Agentic Wallets or MetaMask Advanced Permissions.

## 4. Intents & solvers: is there a generalized "arbitrary condition → payment" solver market?

### Takeaway
No generalized, production intent network lets an agent post "arbitrary condition → payment" and have solvers compete. Intent systems in production (UniswapX, CoW, 1inch Fusion, Across, LI.FI-on-OIF) are swap and bridge-specific. The most interesting development is that **ERC-7683 has been redesigned into a generic "resolver" interface**. An opaque order payload is resolved, through a view call, into `steps`, `variables` (including `Witness` and `Query`), `payments` and `assumptions`. Solvers can therefore evaluate *any* protocol's orders through one interface. That is a natural on-ramp for exposing conditional contracts to the existing solver population. Anoma's general intent machine is still not fully live.

### Cited Findings
- **ERC-7683 (Draft, created 2024-04-11) has been redesigned.**
  - Single entry point: `function resolve(bytes calldata payload) external view returns (ResolvedOrder memory);`
  - `ResolvedOrder` = `steps` (`Call(target, selector, arguments, attributes)`), `variables`, `payments` (`ERC20(token, sender, amountFormula, recipientVarIdx, onStepIdx, estimatedDelaySeconds)`) and `assumptions` (`{string name; bytes data}`).
  - Variable roles include `PaymentRecipient`, `StepCaller`, `ExecutionOutput`, **`Witness(kind, data, variables)`** for off-chain-derived values, **`Query`** (`eth_call` result) and `QueryEvents`.
  - Attributes include `SpendsERC20`, `SpendsGas`, `TimingBounds`, `NeedsStep` and `RevertPolicy` (`ignore`/`abort`).
  - Assumptions are conditions the resolver cannot verify, which solvers must check themselves.
  - Motivation: the old structs forced per-protocol integration, gave loose profit bounds and **assumed per-order escrow, which does not fit resource-lock protocols**. The draft "does not require protocols to use a common escrow, settlement contract, or fill function." — [EIP-7683](https://eips.ethereum.org/EIPS/eip-7683)
- **Open Intents Framework** (February 2025): Ethereum Foundation with Hyperlane and Bootnode, built on ERC-7683. Arbitrum, Polygon, Optimism, ZKsync and Scroll support the standard. — [The Block](https://www.theblock.co/post/342194/ethereum-foundation-collaborates-on-new-framework-to-standardize-buzzy-intents-transactions)
- **LI.FI's intent engine**, built on OIF reference contracts, reportedly went live on 26 May 2026 with Jumper and Rabby. This comes from a competitor's write-up. — [Eco](https://eco.com/support/en/articles/15350485-what-are-li-fi-intents-li-fi-s-intent-based-bridging-explained)
- Approximate solver-set sizes (vendor blog, unverified): Across 40+ relayers, UniswapX about 25 fillers, CoW about 15 batch solvers. — [Eco](https://eco.com/support/en/articles/14799849-the-intent-stack-2026-wallets-solvers-settlement)
- **Anoma**:
  - XAN token and governance went live on Ethereum mainnet on 29 Sep 2025. — [Anoma blog](https://anoma.net/blog/xan-is-live)
  - The protocol adapter was deployed to Ethereum mainnet on 18 Nov 2025. — [Anoma blog](https://anoma.net/blog/anoma-is-now-live-on-ethereum-mainnet)
  - Activation awaited a final audit and governance vote. — [Blockworks](https://blockworks.com/news/anoma-launches-on-ethereum)
  - No source confirms activation or a standalone L1 as of October 2026.
- **MetaMask delegations** explicitly call sub-delegation suitable for "solver architectures". — [MetaMask](https://metamask.io/news/introducing-advanced-permissions)

### Inferences
- **Solvers as natural takers, with caveats.**
  - Solvers today run inventory and arbitrage businesses with near-riskless profit computable at fill time. Taking the other side of a conditional contract is a *risk position*, not arbitrage, so classic swap solvers will not take it by default.
  - Two framings could make it work:
    1. **"Fill = post counter-stake"** as an ERC-7683 resolved order. The `Call` step is `take(contractId)` with `SpendsERC20(stake)`. The `payments` entry is the contingent payout, with `onStepIdx` set to the resolution step. `assumptions` names the resolver codehash and oracle dependencies. `TimingBounds` encodes the deadline.
    2. Solvers as **market makers that hedge elsewhere**. For example, a solver takes a "price > X at T" contract and hedges on a perp DEX.
  - Framing 1 lets any ERC-7683-aware solver infrastructure *see and simulate* the contract for free.
  - Framing 2 is where real liquidity would come from. Unpredictable compositions emerge when solvers bundle conditional contracts with swaps.
- The `Witness(kind, data, variables)` role is effectively a hook for **off-chain-computed resolver outputs**, such as a TEE or zk proof of a resolver program run. This aligns the redesigned ERC-7683 with "code-resolved" semantics more than any other intent standard.
- Anoma remains research or pre-activation. Do not depend on it.

### Gaps
- Whether the redesigned ERC-7683 resolver interface has any production implementations: no data found. The redesign date is also not visible on the EIP page.
- 2026 volumes for UniswapX, CoW, 1inch Fusion and Across: not gathered (search budget).
- Status of Essential, Khalani and other generalized intent or solver networks in 2026: not found. **Possibly stalled.** I could not verify this.
- ERC-7521 (generalized intents for smart contract wallets) status: not checked.

## 5. Escrow / conditional-payment standards: ERC-8183, Alkahest, Virtuals ACP v2, Celer, and others

### Takeaway
The closest live standard to the user's design is **ERC-8183 "Agentic Commerce"** (Draft, 25 Feb 2026, co-authored by Ethereum Foundation dAI lead Davide Crapis and the Virtuals team). It defines a job escrow with a client, a provider and a single **evaluator, which may be a contract** (zk verifier, aggregator), plus `IACPHook` before and after hooks, expiry refunds and a `bytes32` reason feeding ERC-8004 reputation. It is **one-sided**: the client pays the provider, with no counter-stake and no dispute layer. Despite being Virtuals ACP v2's reference implementation, ACP v2 settled only about $2,660 in six months. **Alkahest** (Arkhai) is the more general obligation→arbiter→escrow framework: EAS-based, composable arbiters, Zellic audit June 2026. Its adoption is tiny (11 GitHub stars). It matches the "arbiter, demand / check → bool" idea the user found in ERC-8004 discussions.

### Cited Findings
**ERC-8183 specification**
- Status: Draft. Authors: Davide Crapis, Bryan Lim, Tay Weixiong, Chooi Zuhwa. Created 2026-02-25.
- States: Open → Funded → Submitted → Completed / Rejected / Expired.
- Only the evaluator can complete. The evaluator can reject while Funded or Submitted. The client can reject only while Open.
- After `expiredAt`, *anyone* can call `claimRefund`, which is not hookable.
- Fees are optional basis points, charged on completion only. The reference implementation adds an evaluator fee capped at 10,000 bps combined.
- **"No dispute resolution exists… reject and expiry are final"**. The spec recommends reputation or staking for high-value jobs. — [EIP-8183](https://eips.ethereum.org/EIPS/eip-8183)
- Key signatures:
  - `submit(uint256 jobId, bytes32 deliverable, bytes optParams)`
  - `complete(uint256 jobId, bytes32 reason, bytes optParams)`
  - `reject(...)`
  - `claimRefund(uint256 jobId)`
  - `createJob(provider, evaluator, expiredAt, description, hook)`
- Hooks: `beforeAction(jobId, selector, data)` and `afterAction(...)`. Example hooks: two-phase fund transfer and bidding.
- ERC-2771 meta-transaction extension for x402-style relays.
- The prose spec and the reference implementation disagree (e.g. `fund` with or without `expectedBudget`). — [EIP-8183](https://eips.ethereum.org/EIPS/eip-8183)
- Reference repo `erc-8183/base-contracts`: `ERC8183.sol`, `ERC8183WithAuthorization.sol` (EIP-712 relayed calls), `IDisburser`, `IERC8183Hook`. There is a 1-hour `EVALUATION_GRACE_PERIOD` after expiry for Submitted jobs. 11 stars, 79 commits. — [GitHub](https://github.com/erc-8183/base-contracts)

**ERC-8183 ecosystem and discussion** (Ethereum Magicians, 11–16 Mar 2026)
- ThoughtProof runs a **multi-LLM evaluator** (Claude, GPT-5.4, DeepSeek; default threshold 0.700, tiered 0.50–0.90), deployed on Base mainnet (v1.3.0) with x402 hooks.
- Sentinel proposes a permissionless `executeEvaluation(jobId)` to fix evaluator-liveness risk, and suggests evaluators read ERC-8004.
- clawplaza runs "The Arbiters", an AI-agent dispute panel.
- ERC-8191 (recurring payments) and ERC-8001 (multi-party consent) are proposed as companions.
- **mlegls argues the spec overspecifies state and should standardize an `IArbiter`-style condition interface as the core**, citing Alkahest's `TrustedOracleArbiter` and others. — [Ethereum Magicians p.2](https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902?page=2)

**Virtuals ACP v1 and v2**
- ACP v1 (Base) lifetime: **3,729,274 jobs, about $464M "money in" (throughput, not revenue), about $1.24M platform fees.**
- Monthly jobs: 814k in March 2026 → 214k in April → 26k in May → **about 5–7k per month June–September**. Platform fee in September: **$5.48**.
- ACP v2 (= ERC-8183 reference implementation, from 8 Apr 2026):
  - Base: 81,280 jobs and $2,526.
  - Robinhood Chain: 112 jobs and $131.
  - Arc: 143 jobs and $0.02.
  - Solana: 149 jobs and about $3.
  - **About $2,660 total in six months.** Median Base payment is $0.01, and 64% of Base v2 volume came from two wallets paying each other. — [ChainWard, 30 Sep 2026](https://chainward.ai/decodes/virtuals-top-dog)

**Alkahest (Arkhai)**
- General-purpose conditional P2P escrow for EVM:
  - **Escrow contracts** conditionally guarantee an action.
  - **Arbiter contracts** decide release and compose via `AllArbiter` and `AnyArbiter`, plus `TrustedOracleArbiter`.
  - **Obligation contracts** emit EAS attestations representing fulfilments. Escrows are themselves obligations, so escrows can be chained recursively.
- TypeScript, Rust and Python SDKs. Agent skills for Claude Code and OpenClaw. Zellic audit dated 30 Jun 2026. MIT. **11 stars, 951 commits.** No deployed addresses are listed in the README. — [GitHub Alkahest](https://github.com/arkhai-io/alkahest)
- Arkhai frames the design as statement, validator (arbiter) and escrow, with escalation to arbitration (human, committee or AI). It covers barter, clearing and netting, and compute markets. — [Arkhai blog, Feb 2026](https://www.arkhai.io/blog/two-primitives-machine-native-markets)
- Live apps as of March 2026: a Git Commit Marketplace (escrow pays the first commit that passes verification) and a Simple Compute Market (released May 2026, scalar price only). — [Arkhai, Mar 2026](https://www.arkhai.io/blog/what-you-can-build-today)

**x402 escrow-adjacent pieces**
- `auth-capture` scheme (operator with custom arbitration contracts), the `escrow` flow, and the `job-escrow` proposal. See section 2. — [x402 #3694](https://github.com/x402-foundation/x402/issues/3694); [x402 spec v2](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md)

**Celer AgentPay**
- Docs describe CelerLedger and CelerWallet channel contracts that "bind channels, payments, conditions" on-chain, with versioned ledger migration. No 2026 status was found. — [AgentPay docs](https://agentpay-docs.celer.network/agentpay-architecture/on-chain-contracts/)

### Inferences
- **Mapping the user's design onto ERC-8183:**
  - ERC-8183's evaluator = the user's resolver program.
  - ERC-8183's `claimRefund`-after-expiry = the deadline fallback.
  - The `reason` hash = the resolution proof.
  - **Missing:** (a) a two-sided stake (taker bond), which could be emulated with a hook that pulls a provider bond on `setProvider` and routes it on complete or reject; (b) permissionless resolution, since 8183 has evaluator-only `complete`. A resolver *contract* fixes this because anyone can poke it, which is exactly Sentinel's `executeEvaluation` suggestion.
  - **Recommendation:** build native two-sided contracts, but expose an **ERC-8183-compatible view or facade** (job events, states). ACP v2 tooling, Arc, ThoughtProof and Sentinel indexers, and ERC-8004 reputation pipelines would then index them for free.
- **Alkahest is the closest semantic match** to "stake + resolver program + deadline". A conditional contract = two escrows (maker and taker), each conditioned on an arbiter that runs the resolver. Its `AllArbiter`/`AnyArbiter` combinators and EAS-attested obligations enable **chaining**: contract B's escrow can condition on contract A's resolution attestation. That is exactly the composability the user wants. Using EAS attestations as the resolution output format would make outcomes consumable by any EAS-aware system.
- ACP's collapse is the cautionary tale. **Volume was incentive-driven**: Revenue Network epochs paid about $1.02M and then stopped on 23 Mar 2026. When incentives stopped, organic agent-to-agent commerce turned out to be roughly $100–$500 per month. A conditional-contract protocol should not count on agent-to-agent service commerce for volume. Speculative and hedging use (agents as risk-takers) is a different demand source.

### Gaps
- ERC-6551 (token-bound accounts), Hats Protocol, Request Network, Sablier/Superfluid, OpenZeppelin ConditionalEscrow and UMA's optimistic oracle as an evaluator: **no 2026 data gathered** (search budget). Note that ERC-6551 position NFTs (each side of a contract as a transferable NFT owning its own account) are a design idea, not a researched finding.
- Alkahest mainnet deployments and usage numbers: not published in the sources I found.
- ERC-8191 and ERC-8001 status: only referenced in the forum thread.
- No source confirms any ERC-8183 evaluator that is a fully on-chain deterministic program (zk or re-execution) in production. ThoughtProof is LLM-based and off-chain with on-chain posting.

## 6. MCP and agent frameworks for on-chain action

### Takeaway
The 2024–25 "crypto agent framework" wave has consolidated or receded:
- GOAT SDK is **archived (read-only)**.
- ElizaOS (19.6k stars) **no longer accepts third-party plugins**.
- AgentKit (1.3k stars) and Solana Agent Kit (1.7k stars) are moderately active.

The 2026 pattern is wallet vendors shipping **CLIs, skills and MCP servers** (Coinbase Agentic Wallet CLI, Lightning agent tools MCP, Arkhai skills for Claude Code and OpenClaw), consumed by general-purpose agents (Claude Code, OpenAI Agents SDK, OpenClaw) rather than crypto-specific frameworks.

### Cited Findings
- **GOAT SDK** ("largest agentic finance toolkit"):
  - About 1.0k stars, about 59 plugins listed.
  - Adapters for Vercel AI, LangChain, Mastra, CrewAI, OpenAI Agents, Eliza, GAME and MCP.
  - **The repo is now archived, "no longer actively maintained."** — [GitHub GOAT](https://github.com/goat-sdk/goat)
- **Coinbase AgentKit**: 1.3k stars. Supports MCP, LangChain, Vercel AI, OpenAI Agents and Strands. No spend caps by default. — [GitHub AgentKit](https://github.com/coinbase/agentkit)
- **ElizaOS**: 19.6k stars, 5.8k forks. Describes itself as an "agentic operating system". Optional Eliza Cloud. **No longer accepts third-party plugins or registry items.** The README has no x402 or ERC-8004 mention. — [GitHub ElizaOS](https://github.com/elizaOS/eliza)
- **Solana Agent Kit**: 1.7k stars, 60+ actions, LangChain, Vercel AI and OpenAI integrations, v2 branch. — [GitHub](https://github.com/sendaifun/solana-agent-kit)
- **Lightning agent tools**: skills plus an MCP server, an L402 client and proxy, and scoped macaroons. — [GitHub](https://github.com/lightninglabs/lightning-agent-tools)
- **Arkhai** ships agent skills for Claude Code and OpenClaw for Alkahest. — [GitHub Alkahest](https://github.com/arkhai-io/alkahest)
- ERC-8004 registration files declare MCP and A2A endpoints. On Base, MCP+A2A are about half of declared services. — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2)
- The April 2026 OpenAI/Stripe ACP spec added MCP support. The MPP payments directory lists 100+ services, including Alchemy and Dune. — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/); [Tempo](https://tempo.xyz/blog/mainnet/)

### Inferences
- For "MCP/API-native access", the protocol should ship:
  1. A first-party MCP server with tools such as `list_open_contracts`, `quote`, `post`, `take`, `resolve` and `claim`, plus resources for resolver source code.
  2. An x402-gated HTTP API that mirrors it.
  3. A skill file for Claude Code and OpenClaw-style agents.
  4. An ERC-8004 registration of the protocol's own MCP endpoint.
  Do not build on any single crypto agent framework. They are churning (GOAT archived, Eliza closed to plugins).
- **Discovery**: publish each open contract as an x402 Discovery/Bazaar resource and as an MPP directory entry. Expect about 47% of the Bazaar to be dead listings, so contracts need liveness metadata (deadline, remaining capacity). Then any x402-aware agent crawling the Bazaar finds contracts without protocol-specific integration.

### Gaps
- Official MCP servers from Alchemy, thirdweb and others in 2026, and which agent frameworks dominate on-chain actions by transaction count: no sources gathered (search budget).
- Whether OpenClaw-family agents (viral in 2026) transact meaningfully on-chain: no data.

## 7. The actual on-chain agent economy (October 2026): what agents do, real volume, and hype versus reality

### Takeaway
Real, organic agent-to-agent economic activity remains very small:
- x402 is about $10M per year run-rate, of which an estimated ≥89% of lifetime raw volume is wash or test. One vendor (BlockRun) dominates.
- Virtuals ACP collapsed from about 814k jobs per month in March 2026 to about 6k per month once incentives ended. Fees were $5.48 in September.
- Olas has 448 daily active agents and $110k cumulative Mech Marketplace turnover.
- ERC-8004 has 842k registrations, but only 3–15% are live.

Agent tokens are deep in drawdown: VIRTUAL is about 85% below ATH, and Virtuals fees are about 3% of their January 2025 peak. Agent launchpads are flooded with untraded tokens. **Every headline metric so far was driven by farming incentives.**

### Cited Findings
- **Virtuals**:
  - VIRTUAL at about $0.68–0.80, market cap about $446–526M, **84–87% below the $5.07 ATH**. The snapshot is inconsistent within the page.
  - First-party dashboard: 81,908 agents launched, 2.5M jobs, 35.75k unique active wallets, $481.79M "agentic GDP", $4.5M total revenue. — [CoinStats, Oct 2026](https://coinstats.app/ai/a/investment-analysis-virtual-protocol)
  - DefiLlama protocol fees: about $566k in September 2026, about 3% of the January 2025 peak month ($16.59M). — [ChainWard](https://chainward.ai/decodes/virtuals-top-dog)
  - Revenue Network: 5 weekly epochs, 11 Feb–23 Mar 2026, **$1,022,634 paid**. The top 10 agents took 63–86% of each epoch. No epochs after 23 Mar. — [ChainWard](https://chainward.ai/decodes/virtuals-top-dog); [Virtuals PR](https://www.prnewswire.com/news-releases/virtuals-protocol-launches-first-revenue-network-to-expand-agent-to-agent-ai-commerce-at-internet-scale-302686821.html)
  - Launchpad:
    - 18–25 Mar 2026: 15,484 tokens launched for ACP agents. **In a sample of 150, 3 ever traded.**
    - Robinhood Chain: 25,833 tokens, about 64.5% never traded, 92 graduated.
    - Base: only 5.3% of September launches have more than one holder.
    - **One creator wallet accounts for about 45% of newer launches.** — [ChainWard](https://chainward.ai/decodes/virtuals-top-dog)
  - The promotional framing ("$479M aGDP, 1.77M jobs, 18,000+ agents in Q1 2026") comes from secondary or promotional sources. — [bex.co](https://bex.co/blog/2026/04/04/virtuals-protocol-ai-economic-operating-system-on-chain-agent-economy)
- **x402**: see section 2. Lifetime raw $41.9M; adjusted $15.0M; independent flow bounded at $0.19M–$20.3M; July 2026 30-day $825k; 24-hour about $20k. — [agenteconomy.to](https://agenteconomy.to/stats/x402-transactions); [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- **What paid agent traffic buys**:
  - Data and search APIs (Exa, Serper, Tavily), LLM inference (largest ticket), web automation, chain analytics. — [web3trackers](https://www.web3trackers.com/x402-dashboard)
  - Top vendors: BlockRun (LLM and API routing), dTelecom, StableEnrich, twit.sh, Nansen AI. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- **Olas**: 448 daily active agents (7-day average), 14.8M cumulative A2A transactions, $110k Mech turnover, $885 fees. Prediction-market agents (Olas Predict) are a flagship use. — [olas.network](https://olas.network/)
- **ERC-8004**: 842k registered, +110k per day (21 Oct 2026). Health-check pass rate about 2.24% (July). — [8004scan](https://8004scan.io/); [DataWallet](https://www.datawallet.com/crypto/erc-8004-explained)
- **Card-network agent payments**: "hundreds" of live transactions by late 2025. No official 2026 counts. — [ATXP](https://atxp.ai/blog/mastercard-agent-pay-stripe-acp-visa-x402-comparison-2026/)
- **Stalled or pivoted:**
  - ChatGPT Instant Checkout wound down around March 2026 (secondary report). — [Pondero](https://pondero.ai/agents/guides/x402-vs-acp-vs-ap2-agent-payment-protocols-october-2026/)
  - GOAT SDK archived. — [GitHub](https://github.com/goat-sdk/goat)
  - Virtuals Revenue Network ended. — [ChainWard](https://chainward.ai/decodes/virtuals-top-dog)
  - The ERC-8004 Validation Registry is unused. — [LLM4Agents](https://llm4agents.com/blog/erc-8004-registries-onchain-audit)

### Inferences
- The demand side for agents *buying services* is real but tiny and concentrated in LLM, data and API resale. The demand side for agents *taking risk* (trading, prediction markets: Olas Predict, BasePredictionAgent on Omen) is older and more organic.
- A conditional-contract protocol targeting agents as **risk-takers and price-discoverers** (forecasting, hedging, insuring other agents' job outcomes) is more likely to find organic volume than another agent-hires-agent job board. The data says job boards have so far been incentive-farmed and then collapsed.
- Assume adversarial wash from day one. Any rebate, points or reputation program will be farmed, as with PING, Revenue Network and 8004 Sybil reviewers. Metrics should be stake-weighted and counterparty-diversity-weighted, and fees should make self-dealing strictly negative-EV.

### Gaps
- 2026 state of aixbt, Truth Terminal / GOAT memecoin, ai16z/ELIZA token, and the aggregate AI-agent token market cap: **not gathered**. The search budget was exhausted mid-research.
- Independent counts of "on-chain agents" beyond registries (e.g. an on-chain AI agent census): agenteconomy.to links one, but I did not fetch it.
- Specific agents-hiring-agents examples with verified organic volume (beyond Olas Mech and ACP) were not found. The user's previously identified set (Bounty/trybounty.ai, Moltlaunch, DeskCrew, RentAHuman, BasedAgents) was not re-researched here.

## 8. What's missing in the agent rails stack, and non-obvious composition ideas for a code-resolved conditional-contract protocol

### Takeaway
The stack now has standard identity (ERC-8004), standard HTTP payments (x402 V2, MPP), standard bounded delegation (ERC-7715/7710), a one-sided job escrow (ERC-8183) and a generic solver-facing order interface (the new ERC-7683). It lacks five things:
1. A **two-sided, permissionlessly resolvable conditional-stake primitive**.
2. **Grounded reputation**: reputation backed by stake and payment, not cheap reviews.
3. **Live discovery**: registries are mostly dead or placeholder entries.
4. Any **dispute or appeal layer**.
5. **Organic demand**.

The user's protocol can fill item 1 and, as a by-product, items 2 and 3, because every resolved contract is an unforgeable, stake-weighted performance record.

### Cited Findings
- ERC-8183 has no dispute resolution; reject and expiry are final. — [EIP-8183](https://eips.ethereum.org/EIPS/eip-8183)
- ERC-8183 evaluator-liveness risk; proposal for a permissionless `executeEvaluation`. — [Ethereum Magicians](https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902?page=2)
- 98.7–100% of ERC-8004 feedback lacks a payment proof or task link, and a score can be moved for under $0.06. — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2)
- About 46.7% of registered x402 services are dead. — [CURB](https://curb.numetal.xyz/dispatch/x402-economy-july-2026)
- Staking and slashing complement reputation when identity is cheap. — [Gatta et al.](https://arxiv.org/pdf/2609.02992)
- No x402 maintainer response to the `job-escrow` scheme. — [x402 #3694](https://github.com/x402-foundation/x402/issues/3694)
- The ERC-7683 redesign moves standardization to `resolve()` and drops the per-order escrow assumption. — [EIP-7683](https://eips.ethereum.org/EIPS/eip-7683)
- ERC-7710 sub-delegation is described for agent-to-agent and solver architectures. — [MetaMask](https://metamask.io/news/introducing-advanced-permissions)

### Inferences
**Recommended plug-in map for the protocol**

| Layer | Plug into | How |
|---|---|---|
| Identity | ERC-8004 (optional) + ENSIP-25 | Keys are primary. Link the 8004 `agentId` and `agentWallet` as an optional handle. Never require it. |
| Reputation | Own ledger → export to ERC-8004 Reputation and EAS | Each resolution emits `giveFeedback` with `feedbackURI` = settlement tx (built-in `proofOfPayment`). Weight by stake × counterparty diversity. Unbonding delay makes key-reset costly. |
| Validation | ERC-8004 Validation Registry | Resolver contract = validator. `validationResponse(requestHash, 0/100)` on resolution. This fills an empty slot. |
| Discovery | x402 Discovery/Bazaar + MPP directory + MCP server + 8004 `services[]` | Each open contract = a discoverable paid resource ("take for $X"). |
| Payment and entry | x402 `exact` to the escrow now; co-author `job-escrow` or a new `conditional-stake` scheme | Facilitator relays EIP-3009 or ERC-2771 into the escrow. Server-side `extensions` carry contractId, resolver codehash and deadline. |
| High-frequency | Tempo MPP sessions / Circle Nanopayments / x402 `batch-settlement` | Pre-funded taker sessions, netted per epoch. |
| Escrow semantics | Native two-sided escrow with an ERC-8183-compatible event surface; resolver ≈ Alkahest-style `IArbiter` | Indexers for ACP v2 and 8183 see the jobs. Alkahest-style arbiters allow chaining. |
| Permissions | ERC-7715 periodic allowance + custom ERC-7710 caveat enforcer | "Agent may stake ≤ $N per day only into ConditionalContracts with resolver ∈ S." |
| Execution and takers | ERC-7683 `resolve()` adapter | Exposes contracts to solver infrastructure. `assumptions` lists the resolver and oracle trust. `Witness` carries off-chain resolver proofs. |

**Non-obvious composition ideas**
1. **Contracts that insure ERC-8183 jobs.** Anyone posts a contract whose resolver reads ERC-8183 job state ("job #123 reaches Completed before T"). Providers or third parties take the other side. This creates a **market-priced completion probability** for agent jobs. That is a real-time, stake-backed reputation signal far harder to fake than 8004 reviews. ERC-8183 hooks could even *require* a provider to post such a bond (a `beforeAction` hook on `setProvider`).
2. **Contracts on ERC-8004 metrics.** For example, "agent X's endpoint passes health checks N of M days". The resolver reads an attested uptime feed. Agents with live services earn by taking these; Sybil placeholders cannot.
3. **Resolver programs as discoverable agents.** Register each resolver program as an ERC-8004 agent with an MCP endpoint. Resolvers then accumulate their *own* reputation (disputes, liveness, correctness). Agents choose contracts by resolver reputation, like choosing an oracle.
4. **Chained contracts via attestations.** If resolutions are EAS attestations (Alkahest pattern), contract B can condition on contract A's outcome. This gives parlays, hedges and "if this job completes, fund that one" pipelines, composed by agents without protocol changes.
5. **Solvers as underwriters.** Wrap contracts as ERC-7683 orders whose "fill" is taking the counter-stake. Solvers with hedging venues (perps, prediction markets) become the default liquidity. Delegation sub-chains (ERC-7710) let a fund agent hand capped budgets to many specialist solver sub-agents.
6. **x402 "pay-per-take" with conditional refund.** A data API could price calls as "pay $0.10; get $0.20 back if the data is later shown wrong by resolver R". This is a conditional contract bundled into an x402 resource. It turns quality guarantees into tradeable, code-resolved warranties. No current scheme supports this, which makes it the most natural x402 extension the user could author.
7. **Bond-as-identity.** Instead of KYC, the "account" is a key with a time-locked bond. Reputation = resolved-contract history weighted by bond age. Per Gatta et al., the unbonding delay sets the identity-reset cost and directly tunes honesty incentives.

**Main risks and lessons from the data**
- Every agent-economy metric to date was farmed. Design fees and reputation so that self-dealing is negative-EV, and never pay volume incentives.
- Evaluator or resolver liveness: make resolution permissionless (anyone can trigger resolver execution), with a refund on resolver failure after a grace period. ERC-8183 has a 1-hour grace period plus `claimRefund`.
- Dependency risk: ERC-8004 proxies are upgradeable by one EOA, and x402 is still evolving. Keep settlement self-contained and integrate these as optional surfaces.

### Gaps
- **Research limitation:** the session's shared web-search budget ran out partway through. Sections 1, 3, 4, 5 and 7 have unresearched sub-items, listed in their own Gaps: Fetch.ai/ASI, Story, Theoriq, World ID, Privy, Turnkey, Safe, Crossmint, Lit, ERC-7579, UniswapX/CoW/Across volumes, Khalani, Essential, ERC-7521, ERC-6551, Hats, Request Network, Sablier/Superfluid, aixbt, Truth Terminal and ai16z. Findings above rely on directly fetched primary or near-primary pages where possible.
- No evidence found of any production system offering two-sided, permissionlessly resolved, code-adjudicated conditional stakes for agents. This suggests whitespace, but absence of evidence is weaker given the search limits.
