# On-chain Privacy & Sealed-Information Primitives for Agent-Native Conditional Contracts (state as of 21 Oct 2026)

Research-process note: The session's shared web-search budget ran out partway through. Items marked as gaps below (Partisia, Penumbra, Railgun, Namada, Aleo, Octra, Mind Network, Freysa, witness-encryption state of the art, Angstrom metrics) could not be checked with primary sources. Every claim below is cited; anything from memory is labeled as inference or listed under Gaps. "Secondary" marks aggregator or exchange-blog sources.

---

## Q1. FHE: Zama, Fhenix (CoFHE), Inco, Octra, Sunscreen, Mind Network. Throughput, cost, key holders, production use

### Takeaway
Zama is the only FHE system with real money on mainnet, and only on Ethereum: live since about 30 Dec 2025, about 20 TPS on CPUs, a 13-node threshold-MPC KMS whose nodes run inside AWS Nitro enclaves, fees in USD paid in $ZAMA, and about $90M shielded TVL by Oct 2026. Fhenix CoFHE was scheduled to reach Ethereum and Arbitrum mainnet today (21 Oct 2026), but its signals conflict. Inco Lightning is live on Base, but it is TEE-based, not FHE. The FHE-plus-MPC "Atlas" has not shipped. FHE is now usable for small encrypted-state logic: balances, bids, comparisons, thresholds. It cannot run arbitrary hidden programs.

### Cited Findings
**Zama Confidential Blockchain Protocol**
- Architecture: a cross-chain confidentiality layer, not a new L1 or L2. Host chains run an FHEVM Executor plus an ACL contract. **5 coprocessors** run the FHE and reach majority consensus. A **Gateway** runs on a dedicated Arbitrum rollup. The **KMS** has **13 nodes** with a 2/3 majority and is robust to up to 1/3 malicious nodes. Each KMS node must run its MPC inside **AWS Nitro Enclaves** as defense in depth. — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- Throughput went from 0.2 TPS to "over 20 TPS on CPU". The projection is **500–1000 TPS per chain on GPUs by end of 2026**, and 100,000+ TPS per chain on a dedicated FHE ASIC (longer term). — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- Messari says the plan was a GPU testnet in June 2026 and GPU mainnet integration in Q3 2026. I found no confirmation that the GPU mainnet has shipped as of Oct 2026. Zama's 2026 blog listing has no GPU or throughput milestone post. — [Messari (secondary)](https://messari.io/report/understanding-zama-a-comprehensive-overview); [Zama blog listing](https://www.zama.org/blog)
- Security: 128-bit security, p-fail 2^-128, FHE described as post-quantum. The ZKPoK is not yet post-quantum. More than 34 audit-weeks (Trail of Bits, Zenith). — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- Fees are priced in USD and paid in $ZAMA. ZKPoK input verification costs $0.5 down to $0.005, decryption $0.1 down to $0.001, and bridging $1 down to $0.01. **FHE compute itself is not charged.** A typical confidential transfer costs about $0.008–$0.8 depending on discount. Subscriptions cut fees by up to 99%. — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper). A secondary source cites "$0.13" per confidential tx. — [MEXC blog (secondary)](https://blog.mexc.com/news/ethereums-privacy-breakthrough-zama-mainnet-delivers-confidential-transactions/)
- Operators: **18 genesis operators** (5 FHE plus 13 KMS). New operators stake ≥0.5% of circulating $ZAMA. Inflation is 5%, rewards are pro-rata to √stake, unbonding is 7 days, and fees are burned. — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- Mainnet DKG ran 25–28 Nov 2025: 13 independent parties, tolerating 4 offline or malicious, about 55 h total, **10.5 TB sent per party**, each MPC node inside an AWS Nitro Enclave with key shares sealed in AWS KMS and released only to attested enclaves. — [Zama DKG post](https://www.zama.org/post/decentralized-key-generation-for-zama-mainnet-has-successfully-completed)
- Chains: Ethereum mainnet is live. Other EVMs were planned for H1 2026 and **Solana for H2 2026**. The Sep 2026 "$ZAMA on Solana via Sunrise" item is token trading, not a host chain. — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper); [Zama blog listing](https://www.zama.org/blog)
- Usage: the Zama Public Auction, a **sealed-bid token sale run on the protocol itself**, became the most-used app on Ethereum on 24 Jan 2026. Total Value Shielded passed $100M within 3 days. — [plushcap summary of Zama Jan 2026 posts (secondary)](https://www.plushcap.com/companies/zama/blog/summaries/2026/01). $ZAMA launched in Feb 2026 via a Dutch auction. — [Crypto Briefing](https://cryptobriefing.com/usdt-live-zama-confidential-transactions/)
- Oct 1 2026 newsletter: shielded TVL is **>$90M** (up from $40M+ in June), with **$68M+ in confidential vaults** and **16 confidential Morpho vaults** across 5 curators (Steakhouse, Wintermute's Armitage, Flowdesk, RockawayX, Bitwise). Assets: cUSDC, cUSDT, cWBTC, cAUSD, cTGBP. DefiLlama puts "confidential DeFi" at $197.6M TVL, up 170% in 18 months. — [Zama Sept newsletter](https://www.zama.org/post/zama-newsletter-september-recap-confidential-defi-at-scale-the-defillama-report-zama-on-solana-and-more)
- cUSDT (ERC-7984 wrapper, two-transaction wrap): **$131.3M cumulative shielded volume** and **$7.7M TVL** as of mid-Sep 2026. — [Crypto Briefing, 15 Sep 2026](https://cryptobriefing.com/usdt-live-zama-confidential-transactions/). Protocol-wide, $415M+ shielded volume and about 11k wallets holding confidential assets (unverified AI summary). — [CoinMarketCap AI (secondary)](https://coinmarketcap.com/cmc-ai/zama/latest-updates/)
- Dfns integrated ERC-7984 natively for 400+ enterprise clients. — [Zama/Dfns post](https://www.zama.org/post/shielded-report-dfns-partnership-and-new-zama-sdk)
- **Freeze incident:** on 29 May 2026 a US court (N.D. Cal., in a dispute over the unrelated Overnight Finance) ordered Circle to freeze the USDC held by Zama's **cUSDC wrapper contract**. A single ~$12.5M deposit (>99% of cUSDC TVS) triggered it. The freeze was lifted around 1 June. Zama's response: confidential tokens will now **mirror the underlying asset's compliance actions**, plus a "compliance council" for legal requests. Zama states it is "not a mixer": addresses stay attributable and only amounts and balances are encrypted. — [Zama freeze post](https://www.zama.org/post/the-freeze-on-zamas-cusdc-contract-has-been-lifted-and-all-systems-are-back-to-normal)

**Fhenix (CoFHE)**
- CoFHE is an off-chain FHE coprocessor for EVM chains, imported as `@fhenixprotocol/cofhe-contracts/FHE.sol`, and runs "without trusted hardware" (no TEE). Testnets: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia. — [Fhenix homepage](https://www.fhenix.io/)
- Mainnet: Incrypted (2 Oct 2026) reports a launch on **21 Oct 2026 on Ethereum + Arbitrum** with 5 retail dApps chosen from about 60, a "Dual-Mode Token Standard" (public and private balance in one token), and $22M raised. The FHE Liar's Dice testnet game did **>8M encryption/decryption ops in one day**. The **Sunscreen team was acquired by Fhenix in July 2026**. — [Incrypted](https://incrypted.com/en/fhenix-will-launch-its-mainnet-with-support-for-confidential-tokens-on-october-21/)
- Conflict: when fetched today, Fhenix's homepage still showed "MAINNET COMING SOON" with no date. A trade outlet flagged a homepage-banner vs. FAQ mismatch. A cofhesdk PR adding Ethereum and Arbitrum mainnet URLs is dated 6 Oct 2026. — [Fhenix homepage](https://www.fhenix.io/); [The Industry Spread](https://theindustryspread.com/fhenix-homepage-names-october-21-faq-does-not/); [GitHub PR #391](https://github.com/FhenixProtocol/cofhesdk/pull/391)
- Threshold decryption research (Zyskind, Zarchy, Leibovich, Peikert; ACM CCS'25): it removes noise via MPC rounding instead of noise flooding and is UC-secure. It can run with abort against a dishonest majority or with guaranteed output delivery under an honest majority. Results: **64,319 decryptions/s, 8.48 ms latency**, about 20,000× the throughput of prior state of the art. These are research numbers, not production. — [ePrint 2025/1781](https://eprint.iacr.org/2025/1781); [Fhenix homepage](https://www.fhenix.io/)

**Inco**
- **Inco Lightning uses TEEs** (vendor not named on the page). It is live on **Base mainnet** and Base Sepolia, with Solana devnet in beta, and ships as a Solidity library with private types and ACLs. — [Inco docs](https://docs.inco.org/introduction)
- **Inco Atlas** (FHE plus MPC) has no mainnet evidence and is described as "under continuous development". — [WebSearch summary of Inco sources](https://www.inco.org/blog/confidential-onchain-games)

**Octra, Mind Network, Sunscreen**
- Sunscreen's team was acquired by Fhenix in July 2026, so Sunscreen is no longer independent. — [Incrypted](https://incrypted.com/en/fhenix-will-launch-its-mainnet-with-support-for-confidential-tokens-on-october-21/); [Fhenix homepage bio](https://www.fhenix.io/)
- Octra's homepage only says "universal encrypted compute" and links a litepaper, explorer, and FHE sandbox. It gives no status or performance. — [octra.org](https://octra.org/)

### Inferences
- For a conditional-contract protocol, Zama is the only production option for **encrypted state on Ethereum L1**. That covers hidden stake sizes (ERC-7984), sealed bids, encrypted strike or threshold parameters, and encrypted comparisons. At about 20 TPS shared across all Zama apps, one popular agent venue could saturate it. Design for coarse batches, not per-tick updates.
- The decryption trust root is **13 operators with a 2/3 quorum plus AWS Nitro**. Collusion of about 9 of 13 KMS operators, or a combined Nitro and operator failure, would expose sealed data. This is a committee assumption, not math-only privacy.
- FHE hides **data**, not **code**: contract logic is public bytecode. "Encrypted resolver" in FHE means public logic with encrypted parameters, such as an encrypted threshold, encrypted hidden-test expected outputs (small), or encrypted bids. Hiding the resolver program itself would require a universal-circuit encoding, and that is too expensive at about 20 TPS.
- The cUSDC freeze shows a key risk for pooled escrow: a confidential wrapper pools every holder's underlying tokens in one contract. One tainted deposit can freeze everyone. A permissionless agent market that escrows stakes in a single confidential wrapper of a freezable stablecoin inherits that shared-fate risk.
- Because Zama explicitly keeps addresses attributable, copy-trading by address is still possible. Hiding position sizes does not hide who is active.

### Gaps
- No primary confirmation of Zama GPU-coprocessor mainnet or current measured TPS in Oct 2026, and no per-op HCU/gas limits pulled from Zama docs.
- Fhenix mainnet status on launch day is unconfirmed. Its threshold-decryption committee size and operators were not found.
- Inco's TEE vendor, latency, and costs were not found. Atlas timeline unknown.
- Octra's HFHE claims and mainnet status, and Mind Network's status, were not verified: search budget exhausted.

---

## Q2. MPC networks: Arcium, Nillion, Partisia, Lit, Ika, Fairblock. Sealed bids, private order books, dark pools

### Takeaway
Arcium is the most relevant MPC network for "sealed computation as a service". It reached Solana Mainnet Alpha on 2 Feb 2026 with dishonest-majority MPC: privacy holds if ≥1 node is honest, but any fault aborts the computation. It ships sealed-bid (first-price and Vickrey), voting, and hidden-state game examples. In August 2026 Nillion pivoted to "Encrypted Markets / Covenants", described as encrypted instructions that decrypt themselves when a condition is met. That is almost exactly an "encrypted resolver revealed at deadline" primitive, but it is days or weeks old and not yet slashable. Lit has become a TEE-based programmable-key runtime ("Chipotle"). Ika provides 2PC-MPC dWallets controlled by Sui logic. Fairblock does threshold IBE for sealed auctions.

### Cited Findings
**Arcium (Solana)**
- **Mainnet Alpha went live on Solana on 2 Feb 2026.** The first app, Umbra (shielded transfers and encrypted swaps), launched with **about 100 new users/week and a $500 deposit cap**. Melee, Vanish, and Anonmesh are integrating. — [The Block](https://www.theblock.co/post/387564/arcium-launches-privacy-preserving-mainnet-alpha-on-solana-as-umbra-debuts-shielded-finance-layer)
- Early mainnet runs "with managed nodes operated by Arcium and select industry-trusted validators". ARX TGE was scheduled for Q1 2026. — [SpendNode (secondary)](https://www.spendnode.io/blog/arcium-umbra-solana-privacy-mainnet-feb-2026/)
- By May 2026, more than a dozen ecosystem apps had raised $7.5M. Encrypted AI was still in development, and C-SPL (confidential SPL tokens) was near completion. — [BlockEden (secondary)](https://blockeden.xyz/blog/2026/05/07/arcium-mpc-supercomputer-decentralized-encrypted-computation/); [Messari](https://messari.io/report/arcium-bringing-privacy-to-solana-with-umbra)
- Protocol: **Cerberus**, "a dishonest-majority, detect-and-abort protocol". **Privacy holds if at least one cluster member is honest.** It uses authenticated secret shares and offline preprocessing. On a detected fault the computation aborts, so completion requires all nodes to be available and to have preprocessing material. — [Arcium docs: MPC protocols](https://docs.arcium.com/multi-party-execution-environments-mxes/mpc-protocols.md)
- Solana programs call MXEs (MPC eXecution Environments) via CPI, with results returned by callback. — [Messari](https://messari.io/report/arcium-bringing-privacy-to-solana-with-umbra)
- Fees: per-cluster computation units (CUs). Nodes vote the base price each epoch, priority fees are optional, a callback reserve scales with node count, and **queued computations expire after 180 slots**. — [Arcium docs: pricing](https://docs.arcium.com/computations/pricing-and-incentives.md)
- Example apps: **sealed-bid auction (first-price and Vickrey)**, voting with encrypted accumulation, rock-paper-scissors (hidden moves), blackjack (hidden deck), coinflip, medical-record re-encryption, and **threshold Ed25519 signing**. No dark-pool example is listed. — [Arcium docs: examples](https://docs.arcium.com/developers/examples.md)

**Nillion**
- Alpha Mainnet went live on 24 Mar 2025 with the NIL token. — [Nillion](https://nillion.com/news/nillion-alpha-mainnet-is-live); [The Block](https://www.theblock.co/post/347691/nillion-network-launches-on-mainnet-providing-privacy-focused-blind-computation-for-dapps)
- 2025 stack: nilDB, nilCC (TEE general compute), nilAuth. — [Nillion 2025 roadmap](https://nillion.com/news/nillions-product-roadmap-2025)
- **12 Aug 2026 pivot to "Encrypted Markets"**: a **Covenant is "an encrypted instruction that decrypts itself when a condition is met"** (trades, orders, bids, predictions, payments). The pitch is that on-chain stop-losses and triggers get front-run. "No single operator holds the key." The scheme is not specified for Phase 1. — [Nillion: Road to Encrypted Markets](https://nillion.com/news/the-road-to-encrypted-markets/)
- Roadmap: **Dusk** (Aug–Nov 2026, Ethereum L1: Sepolia 28 Aug, mainnet 28 Sep, stake-weighted permissionless nodes, **agent-oriented SDK**). **Darkfall** (Nov 2026–Feb 2027, multi-EVM, jailing and slashing). **Skyglow** (cross-chain, Solana/Move/Monero). **Nightside** (any attested data feed, BLS/FROST). **Neon** (Aug–Oct 2027, Covenants language/VM, **conditions private to nodes, slashable misbehaviour**). **Aurora** (post-quantum hybrid, FHE coprocessors). **Moonshine** (blobs, ZK-verified reveals, to Feb 2028). — [Nillion](https://nillion.com/news/the-road-to-encrypted-markets/)
- Reportedly migrated away from its Cosmos L1 toward Ethereum in Jan 2026. — [Yellow.com (secondary)](https://yellow.com/ru/asset/nil)

**Lit Protocol**
- The current production platform is **"Chipotle"**. Lit "runs JavaScript inside a chain-secured TEE". **"Keys never leave the enclave, and the code that's allowed to use them is governed on-chain."** Programmable Key Pairs (PKPs) are bound to permitted Lit Action CIDs. Docs give examples of conditional signing (price thresholds, sanctions screens) and encrypting secrets to a single immutable action. There is also a "Lit Agent Keychain". — [Lit developer docs](https://developer.litprotocol.com/)

**Ika (Sui)**
- 2PC-MPC: "no party, not even the network, can sign without user consent". Sui smart-contract logic controls signing on any chain. A Solana pre-alpha is live. — [Ika docs](https://docs.ika.xyz/)

**Fairblock**
- FairyRing is a threshold-IBE confidentiality layer. The **DeBid** auction engine has validators decrypt bids with MPC plus threshold IBE. Fairates lending runs on Arbitrum, and Fairblock uses Arbitrum Stylus. — [Arbitrum blog](https://blog.arbitrum.io/how-fairblock-is-unlocking-confidential-payments-and-auctions-on-arbitrum/); [Arbitrum blog: Stylus](https://blog.arbitrum.io/how-stylus-enables-privacy-innovation-on-fairblock/); [Ethereum IPTF vendor page](https://iptf.ethereum.org/vendors/fairblock/)
- Earlier design (2023): a decryption key is released once a threshold of keyshares for a given block height is received. This is effectively "decrypt at block N". — [Celestia forum](https://forum.celestia.org/t/fairblock-rollkit-shared-sequencer-with-threshold-ibe/1009)

### Inferences
- Arcium's trust model is the strongest of these for privacy (1-of-n honest) and the weakest for liveness: one faulty or malicious node aborts the computation. For a market that must resolve by a deadline, every Arcium-sealed resolver needs a timeout path, such as refund or fallback reveal, or a griefing node can block payouts.
- Nillion Covenants map directly onto "encrypted resolver/bid that reveals when condition X is met". Until Phase 2 jailing and Phase 5 slashing exist, it is an honest-committee system. Watch it, but don't depend on it in 2026.
- The new Lit and Inco Lightning are TEE systems. Their privacy reduces to TEE trust, which matters given TEE.fail (see Q5).
- Ika-style dWallets let a Sui (or other) contract hold a native BTC/ETH key. A resolver could pay out in native assets across chains without a bridge. This is a payout-rail primitive rather than a privacy one.

### Gaps
- Arcium: measured latency per MXE computation, current node count, and whether node entry is permissionless in Oct 2026 were not found.
- Nillion: whether the 28 Sep 2026 Covenants mainnet actually launched is unconfirmed.
- Partisia Blockchain: no 2026 data gathered (search budget exhausted).
- Ika mainnet date, validator count, and signing throughput were not found in fetched docs. Lit's node count and whether threshold cryptography is still used alongside TEEs are unclear from the docs page.
- Fairblock's 2026 mainnet status (and "Stabletrust") is unverified.

---

## Q3. Threshold / timelock encryption and encrypted mempools: drand tlock, Shutter, Fairblock, LUCID/EIP-8105, Primev, SUAVE. Can a contract encrypt something to "unlock at block N" trustlessly today?

### Takeaway
No. Nothing can unlock at block N with no trust assumption. Every production option rests on a threshold committee: drand's League of Entropy, Shutter keypers, Zama's KMS, or Fairblock validators. drand tlock is the most neutral and cheapest. Anyone can encrypt to a future round offline, and Ethereum can verify a drand quicknet beacon for about 140k gas since Pectra (EIP-2537). Ethereum's protocol-level encrypted mempool (LUCID EIP-8184 and EIP-8105) is a draft and unscheduled. The Shutter×Primev out-of-protocol encrypted mempool reached only a Hoodi testnet PoC in what I found.

### Cited Findings
**drand tlock**
- tlock is Boneh–Franklin IBE with **round numbers as identities**. The drand network's BLS signature for round N is the IBE private key for that round. The network needs no changes, and decryption is offline. — [ePrint 2023/189](https://eprint.iacr.org/2023/189); [drand docs](https://docs.drand.love/docs/timelock-encryption)
- Quicknet launched with **18 organizations running 22 nodes**. If a threshold of nodes turns malicious they could compute future keys and **decrypt early**. tlock is **not quantum-resistant**. If the League of Entropy shuts down and deletes its keys, future ciphertexts become undecryptable. Kudelski Security audited the scheme. Libraries: tlock (Go), tlock-js, dee (Rust), timevault. — [drand docs](https://docs.drand.love/docs/timelock-encryption)
- On-chain verification: after Pectra shipped EIP-2537 (BLS12-381 precompiles), a quicknet beacon verifies on Ethereum for **139,812 gas** (compressed points, about 140,580 with calldata), with a mainnet PoC library at randa-mu/bls-solidity. — [drand blog, Aug 2025](https://docs.drand.love/blog/2025/08/26/verifying-bls12-on-ethereum). MegaETH ships a stateless drand quicknet verifier contract. — [MegaETH docs](https://docs.megaeth.com/developer-docs/vrf)

**Shutter Network**
- Gnosis Chain has a live threshold-encrypted mempool, supported by Nethermind and Erigon validators, that has processed "thousands of encrypted transactions" as of Dec 2025. Encrypted flows were also validated on a Sepolia OP Stack testnet. — [Shutter EIP-8105 post](https://blog.shutter.network/introducing-the-universal-enshrined-encrypted-mempool-eip/)
- **Shutter API** is "live and deployed on Gnosis Chain". It is a commit-registry service with **time-based key release** and **event-based release** (reveal when an on-chain event occurs, verified by keypers). Listed uses: sealed bids, sealed RFPs, private voting, parimutuel betting, fair games. Caveats: the keyper network "is still small", the software is early-stage, and it is "not for high-value assets". — [Shutter API docs](https://docs.shutter.network/docs/protocol/api)
- Shutter×Primev (mev-commit) encrypted PBS mempool. Design: builders commit to encrypted transactions, then keypers release keys. PoC used **3-of-5 keypers** with encryption in about 50 ms, decryption **about 2–5 s** after the threshold, and about 12–15 s end to end (one L1 slot). Slashing equals the bid. **Limitations**: the RPC sees plaintext briefly, enforcement is retroactive (front-running is possible if MEV exceeds stake), and colluding keypers can decrypt early. Status: Hoodi testnet PoC. A July 2026 reply asking for published results got no answer in the thread. — [ethresear.ch, 2 Dec 2025](https://ethresear.ch/t/threshold-encrypted-mempools-with-mev-commit-preconfirmations/23588). The earlier target was mainnet in Dec 2025/Jan 2026, and I found no launch confirmation. — [Shutter blog](https://blog.shutter.network/the-first-encrypted-mempool-is-coming-to-pbs-on-ethereum/)

**Ethereum protocol proposals**
- **EIP-8105, "Universal Enshrined Encrypted Mempool"** (Shutter, 17 Dec 2025): an encrypted transaction type with a visible gas-paying envelope, an **on-chain registry where anyone can register as a key provider** (threshold, MPC, TEE, delay, FHE), and an ePBS-inspired sub-slot key-recording mechanism. Proposed for Hegotá. Adds less than one slot of overhead. — [Shutter blog](https://blog.shutter.network/introducing-the-universal-enshrined-encrypted-mempool-eip/)
- **EIP-8184, LUCID** (Elowsson, Florentine, Ma; created 4 Mar 2026; Draft; **requires FOCIL EIP-7805**). Sealed transactions pay a base fee, a key-publication fee, a priority fee, and a capped top-of-block (ToB) fee. Builders commit to them in an expanded `ExecutionPayloadBid`. Keys are released after the beacon block. Decrypted transactions execute at the **start of the next payload**, and ToB execution is capped at gas_limit/8. **Self-reveal by the sender is allowed for single transactions.** Known issues: PTC (payload timeliness committee) bribery, builder reveal optionality, and ECDSA-only (not post-quantum). — [EIP-8184](https://eips.ethereum.org/EIPS/eip-8184)
- Neither proposal is scheduled for a fork, and both are tied to Hegotá discussions. — [EtherWorld](https://etherworld.co/ethereum-encrypted-mempool-progress-challenges-the-road-to-hegota/); [Encrypt the Mempool coalition](https://encryptedmempool.org/)
- **SoK (Passerat-Palmbach, Flashbots; AFT 2026)**. Designs converge on four axes: batched decryption, silent setup (no DKG), epochless encryption, and collision-free encoding. Central critique: **blind ordering plus binary decryption suppresses not only toxic MEV but also same-block auctions** that return value to users. — [ePrint 2026/1643](https://eprint.iacr.org/2026/1643)
- **Batched threshold encryption** (Choudhuri, Garg, Piet, Policharla): each committee member sends **80 bytes per batch** regardless of transaction count, and encryption takes under 6 ms. For about 500 transactions per block, each member needs about 2.8 s for a partial decryption, and decrypting the full block takes about 3.5 s single-threaded. — [ePrint 2024/669](https://eprint.iacr.org/2024/669)

**SUAVE**
- The SUAVE chain was archived in May 2025 and Flashbots shifted to BuilderNet. — [BlockEden, May 2026 (secondary)](https://blockeden.xyz/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/)

### Inferences
- **What you can do today:**
  - **(a)** Encrypt a secret to drand round R, where R is the round whose timestamp is ≥ the time of block N. Anyone decrypts after R. The contract can check on-chain that round R's signature was published (~140k gas).
  - **(b)** Register with Shutter API for time- or event-based release on Gnosis.
  - **(c)** In Zama, write ACL logic of the form "make this ciphertext publicly decryptable once block.number ≥ N". This trusts the 13-node KMS.
  - **(d)** Fairblock's per-block-height threshold IBE.
  - All four are committee-trust. They are "trustless" only in that no single party can decrypt early.
- Verifying on-chain that a revealed plaintext matches a tlock ciphertext is not straightforward. My understanding is that the EIP-2537 pairing precompile returns only a pairing-product check, not a GT element to hash, so Boneh–Franklin decryption cannot simply be recomputed on-chain. The practical pattern is to post H(plaintext) alongside the ciphertext. Ideally the poster also submits a ZK proof at posting time that the ciphertext encrypts H's preimage, so posters can't grief by encrypting garbage. This is my inference and should be verified.
- **tlock removes the "free option" in commit-reveal.** In plain commit-reveal, a committer who sees they are losing can simply not reveal. Encrypting to a future round (or Shutter time release) forces disclosure regardless of the committer's later wishes. This matters for sealed predictions and bids in an agent market.
- If LUCID or EIP-8105 ships (Hegotá at the earliest; date unknown), L1 contracts would get native sealed transactions, and any agent venue on L1 could use self-reveal or key-provider encryption for "take" transactions. Until then, front-running protection must be built into the app (see Q7).
- The SoK critique cuts both ways for agent markets. Blind ordering removes latency races, which is good for fairness among agents. It also removes the ability to auction position, so the venue cannot capture or redistribute MEV internally.

### Gaps
- drand quicknet's round period (believed to be 3 s) and threshold were not confirmed on the fetched pages.
- Shutter keyper set size and threshold for Gnosis mainnet and the API were not stated.
- No primary confirmation of any production tlock-decryption-verifying Solidity contract.
- **Truly trustless timelocks** (Rivest–Shamir–Wagner time-lock puzzles, VDF-based) and **witness encryption** were not researched due to the search limit. My background understanding, unverified this session, is that general witness encryption remains impractical, while special-purpose forms (e.g., for signatures or KZG openings) exist in research.

---

## Q4. ZK / commit-reveal privacy: Aztec, Aleo, Penumbra, Railgun, Privacy Pools, Namada; ZK proofs of a solution or exploit without revealing it

### Takeaway
Aztec, the flagship programmable-privacy L2, is live in "Alpha V5" (21 Jul 2026), with private token transfers under $0.05 and about 2.5 s native client-side proving. Six days later it disclosed a critical proving-system soundness bug that cannot be ruled out as exploited, so V5 funds are treated as exposed pending V6. ZK proofs of real-world vulnerabilities, where you prove you know an exploit input without revealing it, have been demonstrated in research (Cheesecloth: Heartbleed, FFmpeg). This is the key ingredient for "exploit stays secret until paid".

### Cited Findings
**Aztec**
- The Ignition chain went live on Ethereum in Nov 2025 as consensus only, with **no transactions or apps**. It had 72-s blocks, a 500-validator launch trigger, and a 200k AZTEC stake per validator. — [The Block](https://www.theblock.co/post/379592/aztec-launches-ignition-chain-mainnet); [Bankless](https://x.com/Bankless/status/1995494736300236823); [Gate (secondary)](https://www.gate.com/news/detail/16066164)
- **Alpha V5 went live on 21 Jul 2026** via token-holder governance. Private-transfer client proving takes **about 2.5 s native and about 6.8 s in the browser (WASM)** on an M2, versus 5.2 s and 12.5 s on V4. Average block time fell from 14 s to 6 s. A fully private token transfer costs **under $0.05**. Gas is paid in "Fee Juice" bridged from $AZTEC, and fees can be private. Apps: Nyx (private Aave yield), Azguard and Nethermind wallets, Shield/TRAIN/RavenHouse bridges, and Dark Forest Aztec, a hidden-information game whose state is stored as Poseidon2 hashes. — [Aztec: Introducing Alpha V5](https://aztec.network/blog/introducing-alpha-v5)
- **Critical V5 vulnerability** (identified 27 Jul 2026 via **internal AI-assisted auditing**, disclosed 7 Aug): an attacker may construct a proof that passes verification for a transaction that should be rejected. Contributors **cannot determine whether it was exploited**. "Treat funds and applications on V5 as exposed." New deployments are paused, and the fix is due in V6 "later in 2026". — [Aztec vulnerability post](https://aztec.network/blog/alpha-v5-proving-system-vulnerability)
- The Post-Quantum Aztec roadmap (15 Oct 2026) targets hardened libraries in Feb 2027 and full PQ migration by 2030. — [Aztec homepage/blog](https://aztec.network/)

**Privacy Pools (0xbow)**
- ZK deposit and withdraw with **Association Set Providers (ASPs)** that approve deposit labels. It supports partial withdrawals, and a **ragequit** lets depositors exit publicly if not approved. — [Privacy Pools docs](https://docs.privacypools.com/)

**ZK proofs of exploit knowledge**
- **Cheesecloth** (Cuéllar, Harris, Parker, Pernsteiner, Tromer; arXiv Jan 2023) is a proof-statement compiler that lets an analyst "prove that they know a vulnerability in a program, without revealing the details of the vulnerability or the inputs that exploit it". Demonstrated on **OpenSSL Heartbleed** and an **FFmpeg memory bug**. — [arXiv 2301.01321](https://arxiv.org/abs/2301.01321)

### Inferences
- **"This code passes hidden tests" and "I have an input that crashes this program"** are both NP statements: ∃ witness w such that Program(w) has property P. Any general-purpose zkVM or circuit can prove them, and Cheesecloth shows it works for real C code. Proving cost is the constraint. Program-specific circuits are heavy, and proving times for large programs were not found.
- Aztec's incident is directly relevant to the user's design in two ways.
  - **(1)** It was found by AI-assisted auditing: evidence that agents can find critical bugs in ZK circuits, which is exactly the "hidden exploit bounty" market type.
  - **(2)** Privacy prevented post-hoc detection of exploitation. Resolvers that rely on private state can be silently corrupted, and nobody can audit afterward.
- For "private positions so agents can't copy each other", Aztec-style note privacy hides both address linkage and amounts. Zama hides amounts only. Aztec's maturity (alpha, soundness incident) is the blocker for using it in 2026.

### Gaps
- Aleo, Penumbra, Railgun, and Namada 2026 status (including any pivots or shutdowns) were not verified because the search budget was exhausted.
- Privacy Pools chains, launch date, and usage were not in the fetched docs page.
- Proof sizes and times for Cheesecloth were not on the abstract page. No production "ZK proof of exploit" bounty platform was confirmed.
- Witness-encryption research state for 2025–26 was not verified.

---

## Q5. Confidential execution via TEE: Oasis Sapphire/ROFL, Secret, Phala, Flashbots/BuilderNet, Lit, Inco Lightning. Trust after the 2025 TEE attacks

### Takeaway
TEEs are the cheapest and most expressive way to run arbitrary hidden code: hidden test suites, private agent logic, sealed resolvers. But the Oct 2025 **TEE.fail** attack (IEEE S&P '26) extracts Intel SGX/TDX attestation keys and AMD SEV-SNP keys with a **<$1,000 DDR5 bus interposer**. Intel and AMD consider this out of scope. BuilderNet and Secret Network responded by restricting operators to trusted parties. Treat TEE privacy as "trust the physical operator" unless combined with threshold or crypto layers.

### Cited Findings
- **TEE.fail**: a DDR5 memory-bus interposer (<$1,000, briefcase-portable) exploits deterministic AES-XTS memory encryption. It extracts **Intel's Provisioning Certification Key** (ECDSA attestation key from the PCE) from a single signing, which allows forging SGX/TDX quotes. It extracts ECDSA keys from AMD SEV-SNP VMs, even with Ciphertext Hiding. Nvidia GPU CC attestations can be relayed because they aren't bound to the CVM. Affected: Xeon Scalable gen 4+ and EPYC Zen 4/5. Requires physical access and root. — [tee.fail](https://tee.fail/); [The Hacker News](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)
- Named blockchain impacts:
  - **BuilderNet**: a malicious operator could decrypt confidential orderflow and access the validator-payment wallet. BuilderNet is "now permissioned".
  - **Secret Network**: the consensus seed was extracted, which allows decryption of confidential transactions. Secret restricted operators to trusted parties.
  - **Phala's dstack**: a provider can run workloads outside a CVM while forging attestation.
  - Vendors: Intel (advisory 2025-10-28) and AMD (AMD-SB-3040) consider interposers **out of scope**, so no fix is coming.
  — [tee.fail](https://tee.fail/)
- WireTap and Battering RAM (2025) preceded it but worked only on DDR4. — [The Hacker News](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)
- **Oasis ROFL**: TEE apps on Intel SGX/TDX, managed via Sapphire (a confidential EVM). A permissionless pool of ROFL nodes, a built-in KMS that derives app keys in the TEE, and Sapphire contracts can verify a ROFL app's origin. Example uses: private trading bots, trustless AI agents, price oracles. — [Oasis ROFL docs](https://docs.oasis.io/build/rofl/)
- **Flashtestations** (on-chain TEE attestation registry with a DCAP verifier) were initially built for **Unichain to prove priority-fee ordering**. As of Oct–Nov 2025 they were "not yet production-ready". — [Flashbots forum](https://collective.flashbots.net/t/beyond-flashtestations/5342)
- BuilderNet: launched Nov 2024 by Flashbots, Beaverbuild, and Nethermind, with TDX VMs that attest each other before sharing orderflow (aTLS). — [BuilderNet blog](https://buildernet.org/blog/introducing-buildernet); [Blockworks](https://blockworks.com/news/flashbots-block-building-network-mev)
- Lit (Chipotle) and Inco Lightning are TEE-based (see Q2 and Q1). — [Lit docs](https://developer.litprotocol.com/); [Inco docs](https://docs.inco.org/introduction)
- Zama runs KMS MPC **inside AWS Nitro Enclaves as defense-in-depth on top of threshold MPC**. — [Zama DKG post](https://www.zama.org/post/decentralized-key-generation-for-zama-mainnet-has-successfully-completed). AWS Nitro is not named among TEE.fail targets. — [tee.fail](https://tee.fail/)

### Inferences
- In a permissionless market, the TEE operator may be a counterparty: a node runner who also trades. TEE.fail means a sophisticated operator with physical access can read sealed bids and hidden tests. Use TEEs for things that are cheap to leak or are also protected by a threshold layer: "TEE AND threshold", never "TEE OR".
- The useful pattern is Zama's: threshold crypto as the security boundary, TEE as an extra hurdle. Applied to hidden tests: encrypt test cases to a threshold key, and run tests only inside attested TEEs held by several independent operators. Leaking then requires both breaking a TEE and colluding past the threshold.
- Attestation-based "provable agent" claims (Q6) inherit the same weakness. An attacker with an extracted PCK can forge a quote that says "agent runs code X".

### Gaps
- Oasis, Phala, and Secret 2026 mitigations or architecture changes post-TEE.fail were not found beyond the tee.fail page notes.
- No data was found on whether AWS Nitro or Arm CCA are affected by analogous interposer attacks.

---

## Q6. Key encumbrance & Dark DAOs: Liquefaction, TEE-held agent keys (tee_hee_he, Freysa, Nous)

### Takeaway
TEE key encumbrance is demonstrated technology. A key generated inside an enclave can be bound to a policy, such as "only sign X" or "release after 7 days", and anyone can verify via attestation that no human holds it. Liquefaction (Juels et al., Dec 2024) shows the dark side: the same machinery lets one address be secretly rented, shared, or pooled, which breaks every mechanism that assumes "one address = one controller" (locked or soulbound tokens, airdrops, DAO and quadratic votes). For agent markets this both enables provable agent commitments and invalidates address-based identity and anti-collusion.

### Cited Findings
- **Liquefaction** (Austgen, Fábrega, Kelkar, Vilardell, Allen, Babel, Yu, Juels; arXiv 2412.02634, 3 Dec 2024, v1 preprint): a TEE wallet platform that attaches "rich, multi-user policies" to private keys, so a single address's credentials and assets can be **rented, shared, or pooled without on-chain traces**. It undermines locked tokens, DAO voting, airdrops, loyalty points, soulbound tokens, and quadratic voting. Constructive uses: privacy-preserving, cost-efficient DAOs and an anti-dusting countermeasure. It also describes an existing TEE-based tool apps can use as a countermeasure. — [arXiv 2412.02634](https://arxiv.org/abs/2412.02634)
- Secondary coverage says Liquefaction's implementation uses Oasis Sapphire SGX TEEs. — [DEV Community (secondary)](https://dev.to/dc600/liquefaction-a-paradigm-shift-for-programmable-control-of-digital-assets-5e76)
- **TEE_HEE / @tee_hee_he** (Teleport, a Flashbots project, with Nous Research; Oct 2024): an autonomous agent with **exclusive control of its X account, email, and an ETH wallet whose key is generated in the TEE**. It ran on **Intel TDX in a dstack CVM** with no root, SSH, or admin inspection. The attestation quote includes the VM measurement and the Twitter username in report-data, so it can only be produced after the AI takes ownership. Credentials were **time-locked to print after 7 days** for recovery. Stated limitations: trust in OpenRouter to run the model faithfully, a single machine ("pull the power plug"), and trust in Intel TDX. — [Nous/Teleport "Setting your pet rock free"](https://nousresearch.com/setting-your-pet-rock-free/)
- Lit's current platform binds keys to on-chain-governed code ("Keys never leave the enclave"), with a "Lit Agent Keychain" product. — [Lit docs](https://developer.litprotocol.com/)

### Inferences
- **Provable agent commitments.** An agent can post a stake from a TEE-encumbered key whose policy is public: for example, "this key can only sign `take()` for markets whose resolver hash is in set S", or "cannot withdraw stake before deadline", or "always posts the counter-position its model outputs". Counterparties can then price the agent's behavior as code, not reputation. This is a market type in itself: wagers on agent behavior where the agent provably cannot defect.
- **Provably not copying.** A TEE agent can attest that it never received other agents' plaintext orders. That only means something if the order data was encrypted to the TEE in the first place, and TEE.fail weakens it.
- **Threat: Dark-DAO-style collusion against resolvers.** Any resolver that includes a vote, a committee, or "first N agents to attest" can be bribed via encumbered keys, with enforceable bribes and no on-chain trace. Purely code-resolved resolvers (deterministic program, zk-verified) are immune to vote-buying. That is a selling point for the user's design over UMA- or Kleros-style human resolution.
- **Threat: sybil/identity.** Per-address limits, "one agent, one entry" rules, and reputation tied to addresses can be liquefied, meaning rented out. Reputation must be priced as transferable.

### Gaps
- Freysa's 2025–26 TEE "sovereign agent" experiments, Andrew Miller's later Dark DAO demos, and the "Complete Knowledge" countermeasure paper were not fetched because the search budget was exhausted.
- Liquefaction's peer-reviewed venue (if any) is unconfirmed: arXiv lists only v1.

---

## Q7. Front-running / MEV protection for fast agent markets: batch auctions, encrypted order flow, Flashbots Protect/BuilderNet, CoW, Angstrom, Unichain, preconfirmations

### Takeaway
On Ethereum L1, most DeFi flow already avoids the public mempool through private RPCs and OFAs. Sandwich extraction fell about 75% from late 2024 to Oct 2025. Protocol-level sealed transactions don't exist yet. For an agent-dense venue, the robust protections are **in-app**: (1) commit-reveal or sealed bids with forced reveal (tlock/Shutter) or FHE/MPC sealing, and (2) **uniform-price batch settlement** per window (the CoW/Angstrom model), so ordering inside a batch doesn't matter. L2 venues like Unichain give about 200 ms preconfirmations but still use priority ordering, which turns front-running into a fee auction rather than removing it.

### Cited Findings
- About 80% of Ethereum DeFi flow reportedly bypasses the public mempool (undated). Flashbots Protect handles about 3M tx/month, about 7% of Ethereum transactions. MEV Blocker rebates 90% of backrun MEV. **EigenPhi: monthly sandwich extraction peaked near $10M in late 2024 and fell to about $2.5M by Oct 2025.** About 70% of sandwiches are attributed to jaredfromsubway.eth. — [BlockEden, May 2026 (secondary)](https://blockeden.xyz/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/)
- **CoW Protocol**: orders collect for about 30 s, solvers compete to settle, **uniform clearing price per token pair per batch**, and coincidences of wants are matched first. The design inspired UniswapX, 1inch Fusion, and Bebop. — [BlockEden (secondary)](https://blockeden.xyz/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/)
- **Angstrom** (Sorella Labs, Uniswap v4 hook): app-specific sequencing. **All trades in a block clear at a uniform price**, removing priority-fee races. A top-of-block auction's proceeds go to LPs. Audited by Spearbit/Cantina. — [Nansen research (secondary)](https://research.nansen.ai/articles/1852); [QuillAudits (secondary)](https://www.quillaudits.com/research/uniswap-development/uniswap-v4/hooks-ecosystem); [Cantina](https://cantina.xyz/portfolio/c2fe4e46-66a3-416e-ab26-40dd4b437ff6)
- **Unichain**: 1 s blocks, **about 200 ms Flashblocks preconfirmations** (out-of-protocol), and a Stage 1 rollup with permissionless fault proofs. — [Uniswap developer docs](http://developers.uniswap.org/llms.mdx/docs/unichain). TEE attestation (Flashtestations) was built to prove its priority-fee ordering but was not production-ready as of late 2025. — [Flashbots forum](https://collective.flashbots.net/t/beyond-flashtestations/5342)
- **BuilderNet** consolidated all Flashbots building, orderflow, and refunds as of 5 Dec 2024. It is now permissioned after TEE.fail. — [BlockEden (secondary)](https://blockeden.xyz/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/); [tee.fail](https://tee.fail/)
- **Preconfirmations plus encryption**: in Primev's mev-commit, builders commit to encrypted transactions under stake, and slashing is retroactive. — [ethresear.ch](https://ethresear.ch/t/threshold-encrypted-mempools-with-mev-commit-preconfirmations/23588)
- The ePBS (EIP-7732, Glamsterdam) timing was inconsistently reported (H1 vs H2 2026). — [BlockEden (secondary)](https://blockeden.xyz/blog/2026/05/02/mempool-privacy-mev-blocker-flashbots-suave-cowswap-defi-protection/)

### Inferences
- **What gets front-run in a code-resolved conditional-contract market:**
  - **(a)** "Take" transactions on mispriced offers. Bots race agents to the best side.
  - **(b)** Resolver inputs. When a resolver's outcome becomes predictable (e.g., an oracle update lands in the mempool), bots snipe the remaining open offers before resolution.
  - **(c)** Solution submissions. A bot copies a submitted solution or exploit from calldata and resubmits it with higher gas.
  - **(d)** Cancellations. A poster's cancel is front-run by a taker.
- **Defenses by type:**
  - **(c)** needs commit-reveal, or better, ZK proof of a valid solution with no plaintext ever on-chain (Q4).
  - **(a)** and **(d)** are best handled by **frequent batch auctions in the contract**: takes accumulate as sealed commitments in epoch E, reveal in E+1 (forced by tlock), and settle at uniform odds with pro-rata fill.
  - **(b)** needs a **"trading halt" window**: no new takes for k blocks before any resolver-relevant oracle update. Alternatively, resolve off a value committed before the window opens.
- Sub-second preconfirmation L2s (Unichain, Base Flashblocks) favor the fastest agents with priority-fee bidding. That is a design choice: if the venue *wants* latency competition, use them; if it wants model-quality competition, use batch windows.

### Gaps
- Angstrom launch date and volume, current CoW volume, and current Flashbots Protect and BuilderNet shares were not found from primary sources.
- No 2026 primary data on preconfirmation adoption (Commit-Boost, ETHGas, mev-commit).

---

## Q8. Non-obvious compositions for code-resolved conditional contracts

### Takeaway
The best combinations pair a **forced-reveal clock** (drand tlock or Shutter time release, which is cheap and neutral) with a **sealed-evaluation layer** (FHE for small encrypted parameters, MPC for sealed bids, a zkVM for "∃ secret input with property P"). Settlement then happens in uniform-price batches. Each component above is live or near-live, but the combinations are untested. Trust always reduces to a threshold committee (drand LoE, Zama KMS 13/2-3, Arcium 1-of-n privacy but all-of-n liveness) plus optionally a TEE as an extra hurdle.

### Cited Findings (building blocks, each sourced above)
- Forced reveal at a future time: drand tlock (18 orgs/22 nodes; beacon verifiable on-chain for about 140k gas). — [drand docs](https://docs.drand.love/docs/timelock-encryption); [drand blog](https://docs.drand.love/blog/2025/08/26/verifying-bls12-on-ethereum)
- Event-triggered reveal: Shutter API on Gnosis. — [Shutter API docs](https://docs.shutter.network/docs/protocol/api). Nillion Covenants ("decrypts itself when a condition is met"). — [Nillion](https://nillion.com/news/the-road-to-encrypted-markets/)
- Encrypted state and comparisons on Ethereum: Zama (about 20 TPS, decryption $0.1 to $0.001). — [Zama litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- Sealed-bid (first-price and Vickrey) MPC: Arcium. — [Arcium examples](https://docs.arcium.com/developers/examples.md). The production precedent is Zama's own FHE sealed-bid token auction in Jan 2026. — [plushcap (secondary)](https://www.plushcap.com/companies/zama/blog/summaries/2026/01)
- ZK proof of an exploit without revealing it: Cheesecloth. — [arXiv 2301.01321](https://arxiv.org/abs/2301.01321)
- TEE-encumbered keys with time-locked release: tee_hee_he. — [Nous/Teleport](https://nousresearch.com/setting-your-pet-rock-free/). Liquefaction. — [arXiv 2412.02634](https://arxiv.org/abs/2412.02634)
- Confidential yield-bearing collateral: Zama confidential Morpho vaults ($68M+). — [Zama Sept newsletter](https://www.zama.org/post/zama-newsletter-september-recap-confidential-defi-at-scale-the-defillama-report-zama-on-solana-and-more)

### Inferences (composition ideas, all speculative designs)
1. **Hidden-test challenge ("my code passes your hidden tests").**
   - The poster encrypts the test suite T to drand round R(deadline) and posts H(T), ideally with a ZK proof that the ciphertext opens to H's preimage.
   - Solvers post commitments H(code‖salt) before R, so nobody can overfit or copy.
   - After R, anyone decrypts T. Solvers reveal code, and the resolver verifies a zkVM proof (or optimistic re-execution with a challenge period) that the code passes T.
   - The earliest valid commitment wins.
   - Trust: drand threshold. No TEE required.
   - Variant for "tests stay secret forever": the solver submits code to an MPC (Arcium) or FHE program that evaluates tiny tests. That is only practical for very small programs.
2. **Exploit escrow with atomic disclosure.**
   - The hunter submits a ZK proof of: ∃ input x such that TargetProgram(x) breaks invariant I, AND ciphertext c = Enc(pk_payer, x).
   - The contract pays on verification, and the payer can decrypt x.
   - This is fair exchange with no escrow agent: zero-knowledge contingent payment applied to bugs.
   - Add a tlock "timed full disclosure": also encrypt x to round R+30d, so the exploit becomes public if unpatched, which forces the payer to act.
   - The Aztec V5 soundness bug, found by AI-assisted audit, is exactly the target class.
3. **Commit-reveal without the free option.** Sealed predictions and sealed bids encrypted to tlock or Shutter time release cannot be withheld by a losing committer. Every sealed position reveals at the deadline, which kills selective-reveal strategies and "last-look" agents.
4. **Encrypted resolver parameters.** Public resolver code with FHE-encrypted thresholds, such as "pays if metric > θ" with θ encrypted (Zama `euint`). Agents can't game the boundary, and θ is publicly decrypted at the deadline via KMS ACL. Stronger variant: Nillion Covenants as "the whole resolver instruction is sealed until condition X". Phase 5 (2027) promises conditions private to nodes.
5. **Sealed counterparty auction.** Instead of first-come-first-served "take the other side", run an FHE or MPC Vickrey auction for the right to take, say a 1-block window, with the best odds winning and paying the second price. This removes latency races entirely and captures surplus for the poster. Arcium has a Vickrey example, and Zama has run a large sealed-bid auction in production.
6. **Copy-proof agent books.** Use ERC-7984 confidential stakes (Zama) for hidden size, plus fresh addresses via a privacy pool or Aztec for hidden identity. Zama alone leaves addresses attributable, so copiers can still follow wallets.
7. **Provable-behavior agents as a market primitive.** Agents trade from TEE-encumbered keys with public policies, such as "never withdraws before resolution" or "always hedges with resolver R". Counterparties can then offer tighter terms to provably-bound agents. Meta-markets ("will agent A's policy key ever sign X?") resolve on-chain from the attested key's behavior. Caveat: TEE.fail lets a physically capable operator forge attestations, so bond the agent's stake to make forgery uneconomic.
8. **Dual-lock sealing (defense in depth vs TEE.fail).** Encrypt secrets so decryption needs both a threshold-committee share (drand, Shutter, Zama KMS) and a TEE-held share, ideally with each component run by different operator sets. Leaking requires breaking the hardware and colluding past the threshold.
9. **Dead-man's-switch reveal.** Event-triggered early reveal (Shutter event release or Covenant condition) with a tlock fallback at deadline+Δ guarantees disclosure even if the poster disappears or the event oracle stalls. This fixes Arcium-style abort liveness by having a forced public fallback path.
10. **In-contract frequent batch auctions as the anti-MEV layer.** Collect sealed takes per N-block epoch, decrypt via tlock at epoch end, and clear at a uniform price (the CoW/Angstrom logic, but for odds). Combined with a pre-resolution trading halt, this removes most front-running classes without waiting for LUCID or EIP-8105.
11. **Confidential, yield-bearing stake.** Escrowed stakes sit in confidential vaults (Zama/Morpho-style) during long-dated contracts, so stake size is hidden and capital earns yield. **Caveat from the cUSDC freeze**: never pool all market escrow in a single wrapper of a freezable asset. Segregate per market or use non-freezable collateral.
12. **Anti-sybil reality check.** Since Liquefaction makes address-ownership claims unenforceable, design every per-agent limit, reputation, or airdrop as if addresses are rentable. Code-resolved (non-vote) resolution is the structural defense against Dark-DAO bribery of resolvers.

### Gaps
- None of these compositions have been found deployed. Cost estimates (zkVM proof cost for test suites, FHE op costs for parameterized resolvers, gas for on-chain batch clearing) were not researched.
- ZKCP and fair-exchange literature and current zkVM proving costs were not fetched this session (search budget exhausted).
