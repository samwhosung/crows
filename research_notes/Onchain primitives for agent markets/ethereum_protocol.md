# Ethereum Protocol & Standards Developments Relevant to an Agent-Native Conditional-Contract Protocol (state as of Oct 21, 2026)

Scope note: this file goes deep on Ethereum L1 and the ERC/standards layer. Cross-chain comparisons are covered elsewhere. Most facts come from primary sources: EF blog posts, the EIP/ERC registry, and raw spec text in ethereum/EIPs and ethereum/ERCs. Snapshots of the registry index pages ([core](https://eips.ethereum.org/core), [ERC](https://eips.ethereum.org/erc)) were taken Oct 21, 2026. The web-search budget ran out after 5 queries, so a few ecosystem items (preconf vendors, Aligned/zkVerify, fast withdrawals) could not be re-verified. They are listed under Gaps.

Status legend: **SHIPPED** = live on mainnet; **SCHEDULED** = in a fork's SFI list or activated on testnets; **SFI/CFI/PFI/DFI** = Scheduled / Considered / Proposed / Declined For Inclusion in a fork; **DRAFT/RESEARCH** = spec or research only.

---

## 1. Hard forks: what shipped, what's scheduled, what's next (Pectra → Fusaka → Glamsterdam → Hegotá → I*…L*), plus gas limit, slot time and finality trajectory

### Takeaway
Two forks shipped in 2025. **Pectra** (May 7, 2025) added EIP-7702 smart EOAs, the BLS12-381 precompile and EIP-2935 block-hash history in state. **Fusaka** (Dec 3, 2025) added PeerDAS, the P-256 precompile, the CLZ opcode, a 2^24 per-transaction gas cap and a 60M default gas limit. EOF was dropped. **Glamsterdam** brings ePBS, block-level access lists, large gas repricings, 64 KiB contracts and a SLOTNUM opcode. It went live on Sepolia Oct 6, 2026, goes to Hoodi Oct 26, 2026, and has no mainnet date yet; EF Protocol plans around December 2026. Testnets run at 200M gas. **Hegotá** (expected 2027) has two locked headliners: **FOCIL** (censorship-resistant inclusion) and **Frame Transactions** (native account abstraction). After Hegotá, the EF "Strawmap" moves toward fast finality, mandatory zk proofs and post-quantum (PQ) security by December 2029.

### Cited Findings

**Pectra: SHIPPED May 7, 2025 (epoch 364032, 10:05:11 UTC)**
- Included EIPs: 2537 (BLS12-381 precompile), 2935 (historical block hashes in state), 6110, 7002, 7251, 7549, 7623, 7685, 7691, 7702, 7840 — [EF Pectra announcement](https://blog.ethereum.org/en/2025/04/23/pectra-mainnet)
- EIP-7702 lets an EOA sign an authorization that delegates to contract code, enabling batching, sponsorship and custom authentication. The delegation can be revoked or replaced — [EF Pectra announcement](https://blog.ethereum.org/en/2025/04/23/pectra-mainnet)
- EIP-7691 raised blobs from 3 target / 6 max to 6 target / 9 max. Blobs are pruned after 4096 epochs (~18 days) — [EF Pectra announcement](https://blog.ethereum.org/en/2025/04/23/pectra-mainnet)
- EIP-7251 raised the max effective balance from 32 to 2048 ETH. EIP-6110 cut the deposit-processing delay from ~9 hours to ~13 minutes — [EF Pectra announcement](https://blog.ethereum.org/en/2025/04/23/pectra-mainnet)
- EIP-2935 stores the last 8191 block hashes in a system contract at `0x0000F90827F1C53a10cb7A02335B175320002935`. The `BLOCKHASH` opcode still serves only 256 blocks — [EIP-2935 spec](https://eips.ethereum.org/EIPS/eip-2935)
- One BLS12-381 operation is the pairing check at precompile `0x0f` — [EIP-2537 spec](https://eips.ethereum.org/EIPS/eip-2537)

**Fusaka: SHIPPED Dec 3, 2025 (slot 13,164,544 / epoch 411392, 21:49:11 UTC)**
- Core EIPs: 7594 PeerDAS, 7823 MODEXP bounds, 7825 tx gas cap, 7883 ModExp repricing, 7917 deterministic proposer lookahead, 7918 blob base fee floor, 7934 10MB RLP block-size limit, 7939 CLZ, 7951 secp256r1. Also 7642 eth/69, 7892 BPO forks, 7910 eth_config and 7935 60M default gas limit — [EF Fusaka mainnet announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)
- BPO schedule: BPO1 on 2025-12-09 set blobs to 10 target / 15 max. BPO2 on 2026-01-07 set 14 target / 21 max — [EF Fusaka mainnet announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement). Both activated as planned; "Ethereum now targets 14 blobs per [block]". A third BPO was deprioritized until blob usage rises — [EF Checkpoint #8, Jan 2026](https://blog.ethereum.org/en/2026/01/20/checkpoint-8)
- Blobs were only "~30% full" as of March 2026 — [EF Platform post](https://blog.ethereum.org/en/2026/03/23/l1-l2-ethereum)
- **EIP-7825 per-transaction gas cap = 2^24 = 16,777,216 gas.** Before it, one tx could use the whole block (~45M gas at the time) — [EF gas-cap update](https://blog.ethereum.org/en/2025/10/21/fusaka-gascap-update)
- **EIP-7951 `P256VERIFY` precompile at address `0x100`, 6900 gas.** It enables Apple Secure Enclave, Android Keystore and FIDO2/WebAuthn signers — [EIP-7951 spec](https://eips.ethereum.org/EIPS/eip-7951); [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)
- **EIP-7939 `CLZ` opcode (`0x1e`).** The fastest Solidity equivalent costs ~184 gas. The EF cites math, compression, PQ signature schemes and cheaper ZK proving as uses — [EIP-7939 spec](https://eips.ethereum.org/EIPS/eip-7939); [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)
- **EIP-7917** stores a deterministic `proposer_lookahead` in beacon state. This makes the next-epoch proposer schedule "accessible to the application layer via the beacon root and a simple Merkle proof". The stated motivation is based-preconfirmation protocols — [EIP-7917 spec](https://eips.ethereum.org/EIPS/eip-7917)
- **EOF is effectively dead for now.** EOF EIPs (7620, 7698, 7873, 7830, 7957) are "Stagnant" in the core registry. EIP-7834 (EOF metadata) and 7880 sit in Review, and 7960/7961 are Draft — [EIP core index](https://eips.ethereum.org/core). EOF is not in the Fusaka list — [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)

**Gas limit trajectory (validator-signalled, no fork needed until EIP-8261)**
- Mainnet went from 30M to 60M across 2025, "the first significant increase since 2021" — [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026). The limit was ~45M in Oct 2025 — [EF gas-cap update](https://blog.ethereum.org/en/2025/10/21/fusaka-gascap-update)
- 2026 goal: "Continuing to raise the gas limit toward and beyond 100M, supported by Block-level Access Lists (EIP-7928)" — [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026)
- At Soldøgn interop (Svalbard, late April 2026) core devs aligned on a **"credible 200M post-Glamsterdam gas limit floor"**. It rests on three things: ePBS giving execution more time in the slot, BAL parallelism, and EIP-8037 state-growth pricing — [EF Soldøgn recap](https://blog.ethereum.org/en/2026/05/02/soldogn-interop-recap); [EF Protocol update May 2026](https://blog.ethereum.org/en/2026/05/11/protocol-update-may-26)
- After Glamsterdam, Prysm and Teku still default to 60M. Validators must opt in to 200M. Sepolia and Hoodi move to 200M at fork activation — [EF Glamsterdam testnet announcement](https://blog.ethereum.org/2026/09/17/glamsterdam-testnet-announcement); [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement)
- EIP-8261 "Gas Limit Schedule" (informational, in Glamsterdam's meta list) adds an epoch-keyed `GAS_LIMIT_SCHEDULE` to CL config, so increases can be coordinated at set epochs like BPO forks. It changes no consensus rules — [EIP-8261 spec](https://eips.ethereum.org/EIPS/eip-8261)
- Strawmap north star: "gigagas L1: 1 gigagas/sec (10K TPS) at L1, via zkEVMs and real-time proving" — [strawmap.org](https://strawmap.org)

**Glamsterdam (Gloas + Amsterdam): SCHEDULED, mainnet TBD**
- Testnets: Sepolia activated 2026-10-06 13:53:36 UTC (epoch 353,024). Hoodi is set for 2026-10-26 17:42:48 UTC (epoch 132,352). **Mainnet: TBD**, to be announced after Hoodi — [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement)
- EF Protocol's plan assumes "Shipping Glamsterdam in December 2026" — [EF Protocol: Current and Emerging Priorities, Sep 7 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities). The original H1 2026 target was missed — [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026); [EF Checkpoint #9](https://blog.ethereum.org/en/2026/04/10/checkpoint-9)
- The 18 scheduled EIPs are 2780, 7688, 7708, 7732, 7778, 7843, 7928, 7954, 7976, 7981, 7997, 8024, 8037, 8038, 8045, 8061, 8246 and 8282. Supporting EIPs: 7975, 8070, 8136, 8159, 8189, 7904, 8261 — [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement)
- **EIP-7732 ePBS:** "A proposer includes a builder's commitment to an execution payload, and the builder subsequently reveals that payload. The protocol handles payment to the proposer." A payload timeliness committee (PTC) attests to timely payload and blob reveal — [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement). PTC_SIZE = 512. Builders are a new staked entity "staked for as little as 1 ETH" with in-protocol trustless payment to proposers. An honest builder may withhold its payload if its bid's beacon block was not timely — [EIP-7732 spec](https://eips.ethereum.org/EIPS/eip-7732)
- **EIP-7928 BALs** record the accounts and storage touched in a block plus post-transaction state changes. This enables parallel disk reads, parallel validation and faster state roots — [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement)
- **EIP-7843 SLOTNUM (`0x4b`, 2 gas)** returns the current slot number. Its motivation is that deriving slot from timestamp "hardcodes the slot length", and that proving it via EIP-4788 is gas-expensive. It "paves the way for future changes to the slot length". Last Call deadline 2026-11-01 — [EIP-7843 spec](https://eips.ethereum.org/EIPS/eip-7843)
- **EIP-7954** raises max contract code from 24,576 to 65,536 bytes and initcode from 49,152 to 131,072 bytes — [EIP-7954 spec](https://eips.ethereum.org/EIPS/eip-7954). Ecosystem devs were "constructively vocal" in pushing for it — [EF Checkpoint #9](https://blog.ethereum.org/en/2026/04/10/checkpoint-9)
- **EIP-7708: every nonzero ETH transfer emits an ERC-20-style `Transfer` log** from `0xff…fe`. This covers txs, CALL, SELFDESTRUCT and CREATE — [EIP-7708 spec](https://eips.ethereum.org/EIPS/eip-7708)
- **EIP-7997** makes the CREATE2 factory at `0x4e59b44847b379578588920cA78FbF26c0B4956C` a formal requirement, so contracts deploy to identical addresses across EVM chains — [EIP-7997 spec](https://eips.ethereum.org/EIPS/eip-7997)
- **EIP-8037/8038 repricing:** state creation (new accounts, slots, bytecode) gets a separately metered fixed cost-per-state-byte (CPSB). State access (SSTORE, SLOAD, cold access, EXTCODE*) gets more expensive. The schedule targets "roughly a 3x increase in base throughput". Breakage risks are hardcoded gas such as 2,300-gas `transfer/send` stipends, `gasleft()` branching and presigned fixed-gas txs — [EF repricing guide](https://blog.ethereum.org/en/2026/08/24/glamsterdam-repricing-testing). A plain ETH transfer is no longer always 21,000 gas: sending to a non-existent account adds state gas — [EF Platåberget testnet post](https://blog.ethereum.org/en/2026/08/17/plataberget-testnet)
- ePBS was the main source of delay: "Every part of the stack has to reason about 'partial blocks' and two-party coordination" — [EF Checkpoint #9](https://blog.ethereum.org/en/2026/04/10/checkpoint-9)
- Commit-Boost 0.12.0-rc1 is the listed builder/validator sidecar for Glamsterdam on Hoodi — [EF Hoodi announcement](https://blog.ethereum.org/en/2026/10/16/glamsterdam-hoodi-announcement). Commit-Boost describes itself as a sidecar for "MEV-Boost and other proposer commitments protocols, such as preconfirmations and inclusion lists" — [Commit-Boost README](https://github.com/Commit-Boost/commit-boost-client)

**Hegotá (Heze + Bogotá): scoping, expected 2027**
- **Headliners:** EIP-7805 FOCIL (CL) and EIP-8141 Frame Transactions (EL). "They must ship together safely." Appetite for extra CL scope is "close to zero unless an addition directly supports post-quantum readiness" — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- History: FOCIL was cut from Glamsterdam to reduce scope — [EF Checkpoint #8](https://blog.ethereum.org/en/2026/01/20/checkpoint-8). It was chosen as CL headliner at ACDC #175 ([EIPsInsight Hegotá](https://eipsinsight.com/upgrade/hegota)). In April 2026 EIP-8141 was only CFI as a non-headliner after a "heated debate" — [EF Checkpoint #9](https://blog.ethereum.org/en/2026/04/10/checkpoint-9). By September it was the S-tier "Locked-in EL headliner" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips). EIPsInsight lists both 7805 and 8141 as SFI, with a 2027 scoping target and EIP-8081 as the meta EIP — [EIPsInsight Hegotá](https://eipsinsight.com/upgrade/hegota)
- Vitalik calls Hegotá "the fork planned for next year" and "likely to be Ethereum's last 'normal' fork" — [Vitalik, "The cryptographic world computer", Sep 27 2026](https://vitalik.eth.limo/general/2026/09/27/the_cryptographic_world_computer.html)
- EF tier list (62 EIPs graded; 2 S, 15 A, 8 B, 7 C, 28 DFI, 2 TBD) — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips):
  - **S:** 7805 FOCIL, 8141 Frames.
  - **A (expected to ship), CL:** 8369 VOPS profiles for FOCIL eligibility, 8015, 8365 BLS withdrawal credential retirement, 8383, 8334, 8025 Optional Execution Proofs.
  - **A, EL:** 3298 refund removal, **8250 Keyed Nonces**, **5920 PAY opcode**, **8272 Recent Roots**, 8279 and 8131 worst-case bounding floors, **7906 Transaction Assertions**, 8298 SETCODEFROM, 8151 restricted ecRecover, 4758 deactivate SELFDESTRUCT.
  - **B:** 8146, 8237, **8198 Quick Slots**, 8321 hash-chain RANDAO, 8253, 8077, 8374, **7709 BLOCKHASH from storage**.
  - **DFI (notable):** **8182 Private ETH/ERC-20 transfers** ("the Frames-based path delivers the same goal with less protocol surface"), **8304 Trustless Log Index**, 8115, 8188, 7862, 7819/7851 (alternative AA), 8375 ePBS mandatory burn and 8363 tapered issuance burn (issuance is "not the right venue"), 8142 Block-in-Blobs.
- FOCIL design decisions at Soldøgn: FOCIL is disabled during 2-epoch non-finality, and an index-based bookmark keeps it compatible with frame transactions and 7702 — [EF Soldøgn recap](https://blog.ethereum.org/en/2026/05/02/soldogn-interop-recap)

**Beyond Hegotá: Strawmap (I*, J*, K*, L*)**
- The Strawmap is "a strawman L1 roadmap by EF Protocol", maintained by EF Architecture (listed only as "Justin, Thomas, Toni, Vitalik"). It sketches "seven forks by 2029 based on a rough cadence of one fork every six months". Its five north stars: fast L1 (inclusion and finality in seconds), gigagas L1, teragas L2 (1 GB/s, 10M TPS), post-quantum L1 and private L1 ("L1 shielded transfers") — [strawmap.org](https://strawmap.org)
- **Post-quantum north star:** "Ethereum L1 to be quantum-resistant across all three layers… by December 2029". It is treated as non-negotiable at least until a January 2027 reassessment. Milestones: a PQ public-key registry in I*; a minimum-viable PQ L1 (PQ CL heartbeat, leanDA sampling, leanSPHINCS txs) in J*; full PQ in L* (or K* if reordered) — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- **Fast finality arc:** "decouples finality from block production… around an available chain and a finality gadget". "Decoupled consensus is the leading headliner candidate" for I* — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- **zkEVM arc:** execution proofs move from "available and optional, to expected, to mandatory". Mandatory proofs land in K*, or L* if swapped with PQ attestations — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- **State arc:** trie migration and state-growth design "expected to begin in I*" — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)

**Slot time and finality**
- Today: 12 s slots. Full finality takes ~13–19 min; the Fast Confirmation Rule targets "fast and strong L1 confirmations in 15-30 seconds" — [EF Protocol Update 003](https://blog.ethereum.org/en/2025/08/29/protocol-update-003)
- **EIP-7782 (6 s slots):** still Draft and not on the Hegotá list — [EIP core index](https://eips.ethereum.org/core); [EIPsInsight Hegotá](https://eipsinsight.com/upgrade/hegota). The EF's 2025 UX plan aimed "initially" at 12→6 s — [EF Protocol Update 003](https://blog.ethereum.org/en/2025/08/29/protocol-update-003)
- **EIP-8198 Quick Slots (12→10 s), created 2026-03-17.** It adds a `SLOT_DURATION_SCHEDULE`, rescales rewards by 5/6, sets the base-fee max change to 5/48, and proposes provisional blobs of 12 target / 18 max. Estimated finality goes from ~13 to ~10.7 min. The EIP-4788 lookback shrinks from ~27.3 h to ~22.8 h, and "L2 challenge periods and bridge delays measured in L1 blocks also get shorter" — [EIP-8198 spec](https://eips.ethereum.org/EIPS/eip-8198). It is **B-tier** for Hegotá: R&D rated it S/A but delivery engineers rated it D. It needs full specs, a prototype, an ecosystem impact assessment and sign-off that it fits decoupled consensus — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
- Lean Consensus targets "4-second block times". pq-devnet-0 (Oct 2025) ran "4s slots, QUIC, Gossipsub". pq-devnets 1–3 completed Dec 2025–Feb 2026 with leanSig (XMSS hash-based signatures) integrated — [leanroadmap.org](https://leanroadmap.org)
- Vitalik's 2030 projection: "~4-8s for a slot, ~8-32s for finality" and "guaranteed real-time transaction inclusion (via FOCIL)" — [Vitalik, Sep 2026](https://vitalik.eth.limo/general/2026/09/27/the_cryptographic_world_computer.html)

**zkEVM on L1 and real-time proving**
- The EF plan is that validators optionally verify multiple zkVM proofs instead of re-executing. "Realtime" means ≤10 s for P99 of mainnet blocks, ≤10 kW, ≤$100k on-prem capex, and 128-bit security (100-bit accepted at first). Once all validators verify proofs, "the same proofs can also be used by an EXECUTE precompile for native zk-rollups" — [EF "Shipping an L1 zkEVM #1"](https://blog.ethereum.org/en/2025/07/10/realtime-proving)
- Security milestones: soundcalc integration by end of Feb 2026; 100-bit provable security and ≤600 KiB proofs by end of May 2026; 128-bit provable by end of 2026 — [EF "Shipping an L1 zkEVM #2"](https://blog.ethereum.org/en/2025/12/18/zkevm-security-foundations)
- Ethproofs snapshot (Oct 21, 2026): phase 2 of 5, the "security sprint", working on "M2: 100-bit provable / 600 KiB". Later phases are delayed proving, mandatory proving and enshrined proofs. In the real-time-proving cohort, AntChain zkDTVM on 4×RTX 5090 scores 99.45% performance / 99.96% liveness at ~$0.0030 per proof. ZisK on 4 GPUs scores 99.27% / 99.31% at ~$0.0029. 2 of 8 evaluated provers are eligible — [ethproofs.org](https://ethproofs.org)
- **EIP-8025 Optional Execution Proofs** (Draft, 2025-09-17): "altruistic proof-generating nodes" gossip execution proofs on the CL p2p network. Verification is "stateless and constant time" and consensus rules are unchanged. A-tier for Hegotá — [EIP-8025 spec](https://eips.ethereum.org/EIPS/eip-8025); [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)

**Native and based rollups**
- **EIP-8079 Native rollups** (Draft, 2025-11-13, Donno & Drake): "Expose Ethereum's STF as a precompile" (`EXECUTE`). The address and many fields are still TBD — [EIP-8079 spec](https://eips.ethereum.org/EIPS/eip-8079)
- **EIP-8357 EVM Verification Key Registry** (Draft, 2026-07-30): a system contract mapping each fork's EVM verification-key hash to a stateless input schema. A native rollup can then "follow L1 EVM upgrades automatically or deliberately remain on a historical EVM fork" — [EIP-8357 spec](https://eips.ethereum.org/EIPS/eip-8357)
- EF Platform: "Becoming a native rollup (allowing L2s to get rid of their security councils)". The EF is "investing R&D towards… 'native rollups'" — [EF Platform post](https://blog.ethereum.org/en/2026/03/23/l1-l2-ethereum)

### Inferences
- **Deadline semantics must survive slot-time changes.** Slot time may move 12→10 s (8198), or 4–8 s under lean consensus. Under ePBS a slot can also have a beacon block but no payload. So `block.number` is a poor clock for resolver deadlines. Use `block.timestamp` or SLOTNUM (Glamsterdam). Never hardcode "N blocks ≈ T seconds". The blockhash and beacon-root lookback windows shrink in wall-clock time if slots shorten.
- **Resolver compute is capped per transaction, not per block.** The 16.78M gas cap (EIP-7825) applies even when blocks reach 200M gas. Heavier resolvers must split work across txs, verify a proof instead (zk or optimistic), or run on L2. The 64 KiB contract limit (EIP-7954) lets a much richer resolver live in one immutable contract.
- **Glamsterdam repricing hits escrow-style protocols directly.** Per-position fresh storage slots and new accounts get costlier under EIP-8037. `transfer/send`-based payouts are flagged breakage risks. Pull-payments and the proposed PAY opcode (5920, Hegotá A-tier) are the robust patterns.
- **FOCIL is the protocol feature that most changes the design of time-sensitive settlement.** It is not expected on mainnet before 2027 (Hegotá). Until then, settlement windows should be sized for builder-censorship risk; that is the regime of the next ~12+ months.

### Gaps
- No official Glamsterdam mainnet date or Hegotá fork date exists yet. "December 2026" is EF Protocol's planning assumption, not a client-team decision.
- Live mainnet gas limit on Oct 21, 2026: sources say 60M ([EF Checkpoint #9](https://blog.ethereum.org/en/2026/04/10/checkpoint-9)), and a secondary article summarized via search says mainnet "runs a 60 million gas limit today" ([CCN](https://www.ccn.com/news/crypto/ethereum-glamsterdam-upgrade-testnet-200m-gas-limit/)). I did not verify against a block explorer.
- I could not confirm whether the Fast Confirmation Rule has shipped as a default RPC feature in consensus clients. The Feb 2026 post says only that implementations "progressed".
- Status of ePBS-era MEV research (execution tickets, APS, MEV burn) beyond the DFI on 8375 was not verified: [ethresear.ch](https://ethresear.ch) could not be searched and there was no EF post on it.

---

## 2. EF strategy, clusters and initiatives in 2025–2026: Protocol tracks, privacy/Kohaku, Trillion Dollar Security, interop (OIF, EIL, interoperable addresses), native AA, post-quantum

### Takeaway
EF Protocol has moved from 2025's "Scale L1 / Scale Blobs / Improve UX" to 2026's "Scale / Improve UX / Harden the L1". As of Sep 2026 its single binding goal is post-quantum readiness by Dec 2029, carried by five research arcs: fast finality, PQ, privacy, state and zkEVM. Native AA is now concentrated in **EIP-8141 Frame Transactions**; 7701 and RIP-7560 are superseded. Privacy is pursued via Frames plus keyed nonces and recent roots rather than an enshrined pool. Interop runs on the Open Intents Framework (in production), the EIL proposal and the ERC-7930/7828 address standards. Trillion Dollar Security is producing protocol features, notably transaction assertions.

### Cited Findings

**Protocol cluster structure**
- "Announcing Protocol" (June 2, 2025) set three initiatives: Scale L1, Scale Blobs, Improve UX — [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026)
- The 2026 tracks are:
  - **Scale** (Dietrichs, van der Wijden, Kripalani): gas limit to 100M+, ePBS, the zkEVM attester client "from prototype toward production readiness", binary trees and statelessness.
  - **Improve UX** (Monnot, Garnett): native AA and interop.
  - **Harden the L1** (Svantes, Jayanthi, Thiery): 1TS, "post-execution transaction assertions and trustless RPCs", FOCIL, VOPS, CR metrics.
  - Source: [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026)
- Leadership changed in May 2026. The new cluster coordinators are Will Corcoran, Kev Wedderburn (zkEVM lead) and Fredrik Svantes (security/1TS). Barnabé Monnot and Tim Beiko are leaving the EF and Alex Stokes is on sabbatical — [EF Protocol update May 2026](https://blog.ethereum.org/en/2026/05/11/protocol-update-may-26)
- Post-Glamsterdam priority ladder:
  - P0: keep mainnet safe.
  - P1: ship the critical components of Hegotá, I* and J* (the path to MV-PQ).
  - P2: capacity for K* and L*.
  - P3: research for fast finality, privacy, state and zkEVM, with formal verification as cross-cutting tooling.
  - Source: [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- Hegotá commitments are mapped to "CROPS" (Censorship resistance, Open source, Privacy, Security). CR = FOCIL + VOPS. P = keyed nonces + recent roots. S = Frames, assertions, k1-key retirement (8298 + 8151) and the bounding floors — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)

**Native account abstraction: EIP-8141 Frame Transactions (Hegotá headliner)**
- EIP-8141 (Draft, created 2026-01-29). Authors: Vitalik, lightclient, Felix Lange, Yoav Weiss, Forshtat, Tirosh, Nacson, Chiang, Wahrstätter, Vlachakis.
  - It is a new tx type `0x06` made of frames in DEFAULT, VERIFY or SENDER mode.
  - A validation prefix ends at the frame that sets the payer, via `APPROVE` (`0xaa`).
  - New opcodes: `TXPARAM`, `FRAMEDATALOAD/COPY` (read another frame's calldata), `FRAMEPARAM` (read another frame's target, mode, status and gas used), `SIGPARAM/SIGDATACOPY`.
  - An `ARBITRARY` signature scheme allows PQ or custom schemes.
  - ERC-20 paymasters work "without a centralized relayer".
  - `ATOMIC_BATCH_FLAG` makes consecutive frames all-or-nothing, and EOAs can use frames via default code.
  - Source: [EIP-8141 spec](https://eips.ethereum.org/EIPS/eip-8141)
- EIP-7701 is "Superseded by EIP-8141" (Withdrawn) — [EIP core index](https://eips.ethereum.org/core)
- Soldøgn native-AA requirements session: "alternative signature schemes, aggregation, batching, recovery, gas sponsorship, flexible nonces, and keystore wallets", constrained by public-mempool compatibility, statelessness and L2 DoS resistance — [EF Soldøgn recap](https://blog.ethereum.org/en/2026/05/02/soldogn-interop-recap)
- Frames companions:
  - **EIP-8250 Keyed Nonces** (A-tier): independent nonce domains in a `NONCE_MANAGER` system contract. Txs with non-overlapping keys are "replay-independent" — [EIP-8250 spec](https://eips.ethereum.org/EIPS/eip-8250)
  - **EIP-8272 Recent Roots** (A-tier): a VERIFY frame checks 1–16 `(source_id, slot, root)` tuples against a shared contract that "root sources write to". Examples: privacy tree roots, wallet authorization roots — [EIP-8272 spec](https://eips.ethereum.org/EIPS/eip-8272)
  - **EIP-8266 Expiring Nonces** (Draft): replay protection "bounded by a short transaction deadline", with `MAX_EXPIRY_SECS = 60`. Intended for "atomic intents, time-boxed sponsorships" — [EIP-8266 spec](https://eips.ethereum.org/EIPS/eip-8266)
  - **EIP-8209 Commit-Reveal Transaction Frames** (Draft, 2026-04-01): COMMIT frames in block N-1 serve as "an inclusion guarantee"; REVEAL executes in block N. This gives front-running protection without enshrined cryptography — [EIP-8209 spec](https://eips.ethereum.org/EIPS/eip-8209)
  - **EIP-8130 Keystore Accounts** (Draft, Coinbase's Chris Hunter): an on-chain keystore of "actors" with authenticator contracts, "per-actor scope, expiry, and optional policy". Usable via plain calls, 4337, 8141 or native AA — [EIP-8130 spec](https://eips.ethereum.org/EIPS/eip-8130)
  - **EIP-8397 Frame Authenticator Signatures** (Draft, 2026-08-26): bounded, state-independent custom authentication proofs — [EIP-8397 spec](https://eips.ethereum.org/EIPS/eip-8397)

**Trillion Dollar Security (1TS) and transaction assertions**
- 1TS launched May 14, 2025, co-chaired by Fredrik Svantes and Josh Stark, with stewards samczsun, Mehdi Zerouali and Zach Obront. Goal: "Companies, institutions or governments are comfortable storing more than 1 trillion dollars of value inside a single contract" — [EF 1TS announcement](https://blog.ethereum.org/en/2025/05/14/trillion-dollar-security)
- **EIP-7906 Transaction Assertions** (Draft, A-tier for Hegotá). It adds an `ASSERT`/POST_TX frame at the end of a frame tx. `TXTRACE` enumerates net state diffs and events, `TXDIFF` reads start and end values for specific slots, and `EVENTDATACOPY` copies event data. If an assertion fails, the execution body reverts, but the tx stays included and gas is charged — [EIP-7906 spec](https://eips.ethereum.org/EIPS/eip-7906); [EF transaction assertions post, Oct 5 2026](https://blog.ethereum.org/en/2026/10/05/transaction-assertions)
  - Proposed narrowing: arbitrary storage reads removed, keeping assertions over emitted events and BAL-touched slots — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
  - EF explicitly names agent delegation: "When you let an agent act on your behalf… Assertions could add rules for the outcome of each transaction". Also: "A protocol's protected function must verify that the call comes from a frame transaction containing the exact required assertion", and "In solver execution, the protocol could specify the required outcome while leaving the solver free to choose the route" — [EF transaction assertions post](https://blog.ethereum.org/en/2026/10/05/transaction-assertions)

**Privacy cluster / PSE / Kohaku / zkAPI**
- The Privacy cluster was formed Oct 2025. It has 47 people, is coordinated by Igor Barinov, and PSE is led by Andy. Initiatives: Private Reads & Writes, Private Proving, Private Identities, Privacy Experience, the Institutional Privacy Task Force and **Kohaku** (privacy wallet SDK and reference wallet) — [EF Privacy commitment](https://blog.ethereum.org/en/2025/10/08/privacy-commitment). Kohaku is led by Nicolas Consigny and Vitalik — [EF Protocol Update 003](https://blog.ethereum.org/en/2025/08/29/protocol-update-003)
- The Kohaku repo has packages for Railgun ("under maintenance") and Tornado Cash ("✅") shielded pools, marked "NOT READY FOR PRODUCTION USE… UNAUDITED" — [Kohaku GitHub](https://github.com/ethereum/kohaku)
- Privacy arc: "native, trustless, censorship resistant private transactions on Ethereum L1" starting in Hegotá. Encrypted mempools come later — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- **EIP-8182** (shielded-pool system contract for ETH/ERC-20, Review) was DFI'd by EF Protocol for Hegotá — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips). A secondary source described 8182 as "considered for Hegotá" per a privacy roadmap updated July 27, 2026 — [CryptoDaily, Aug 2026](https://cryptodaily.co.uk/2026/08/hegota-focil-frame-transactions-l1-privacy). The later EF tier list (Sep 7) supersedes that.
- **zkAPI** has been live on mainnet since Oct 2026 and was built by the Open Anonymity Project with the EF. Users deposit ETH or USDC into a vault and spend via Groth16/BN254 proofs over Poseidon commitments in a 32-level Merkle tree, with nullifiers. The server mints short-lived dollar-capped API keys. Exits are on-chain, so funds don't depend on server honesty. Listed uses include "AI chat and agents" and "Machine-to-machine services: per-task spend, agents pay without an account". It implements the "ZK API usage credits" design by Davide Crapis and Vitalik — [EF zkAPI post](https://blog.ethereum.org/en/2026/10/01/introducing-zkapi)

**Interop**
- The Open Intents Framework (OIF) "reached production" in 2025. ERC-7930 + ERC-7828 (interoperable addresses and names) and ERC-7888 (Crosschain Broadcaster) "moved forward" — [EF Protocol Priorities Update 2026](https://blog.ethereum.org/en/2026/02/18/protocol-priorities-update-2026)
- OIF covers origination, fulfillment, settlement and rebalancing. ERC-7683 was revised by contributors from Across, Uniswap, LI.FI and OpenZeppelin to support "Resource Locks and direct-to-filler transfers". Supporting standards: 7828/7930, 7811 asset discovery, 5792 multicall — [EF Protocol Update 003](https://blog.ethereum.org/en/2025/08/29/protocol-update-003)
- Registry status: ERC-7683 Draft, ERC-7930 Review, ERC-7828 Review, ERC-7786 Cross-Chain Messaging Gateway **Final**, ERC-7888 Draft — [ERC index](https://eips.ethereum.org/erc)
- **EIL (Ethereum Interop Layer)** is a Nov 2025 proposal from the AA team, built on ERC-4337. Users "sign once for a cross-chain transaction" and "trustless liquidity providers supply funds but never interact directly with users". It is not consensus EF policy — [EF EIL post](https://blog.ethereum.org/en/2025/11/18/eil)
- Interop speed metrics: L1 time-to-inclusion, time-to-strong-confirmation, time-to-finality, L2 time-to-settlement. Finality path: shorter slots → 7–10 min; beacon changes → 1–2 min; a new consensus → seconds — [EF Protocol Update 003](https://blog.ethereum.org/en/2025/08/29/protocol-update-003)

**Post-quantum**
- See §1 for the Dec 2029 target. On the execution layer, "native account abstraction lets signature schemes be swapped without a hard fork per scheme. Frames provides that property" — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)
- PQ-related EIPs:
  - EIP-8051 ML-DSA precompile (Draft) — [EIP-8051](https://eips.ethereum.org/EIPS/eip-8051)
  - EIP-8355 ML-DSA precompiles, rated **C** as "premature standardization" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
  - EIP-8164 Native Key Delegation (EOA → ML-DSA-44 via a `0xef0101` designator) — [EIP-8164](https://eips.ethereum.org/EIPS/eip-8164)
  - EIP-8292 PQ attestation aggregators — [EIP-8292](https://eips.ethereum.org/EIPS/eip-8292)
  - EIP-8321 hash-chain RANDAO (B-tier) — [EIP-8321](https://eips.ethereum.org/EIPS/eip-8321)
  - EIP-8365 BLS withdrawal credential retirement (A-tier) — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
- "Lean Ethereum" (Justin Drake, Jul 31 2025) uses hash-based crypto everywhere:
  - lean consensus is "beacon chain 2.0… finality in seconds; formerly branded as 'beam chain'".
  - lean data is "blobs 2.0… granular blob sizing for a calldata-like developer experience".
  - lean execution is "EVM 2.0: a minimal, SNARK-friendly instruction set (possibly RISC-V)".
  - Source: [EF lean Ethereum](https://blog.ethereum.org/en/2025/07/31/lean-ethereum)

### Inferences
- Native AA (Frames) plus assertions is the EF's chosen substrate for "agents acting under constraints". The EF names agent delegation as a use case for assertions. A conditional-contract protocol that requires takers to use frame txs with protocol-specified ASSERT frames could enforce outcome invariants on the taker's side, for example "my net exposure after this take ≤ X". That is a Hegotá-era (2027+) capability.
- The EF is betting against enshrined privacy pools (8182 DFI) and on Frames + keyed nonces + recent roots. Shared-sender privacy apps would get FOCIL inclusion guarantees. Private stakes or positions in a conditional-contract protocol would likely be built as an app-level shielded pool that reads its own roots via EIP-8272.
- Interop standards (7930 addresses, 7683 intents, 7786 messaging) are mostly Draft or Review except 7786 (Final). Building on them now is reasonable but carries interface-churn risk.
- PQ by 2029 implies today's ECDSA agent keys have a shelf life. Protocols should verify signatures via ERC-1271 or ERC-7913 rather than raw `ecrecover`. EIP-8151 explicitly plans to reject `ecrecover`-based auth once an account has real code.

### Gaps
- Could not verify EIL deployment status after the Nov 2025 proposal, or production metrics for OIF.
- Could not find the URL or text of the "Ethereum privacy roadmap updated July 27, 2026" cited by CryptoDaily.
- No data on "fast L1↔L2 withdrawals" deployments (OP Succinct, fast-finality bridges) in 2026; search was unavailable.

---

## 3. Standards (ERCs) that open new design space for agents and conditional contracts

### Takeaway
2025–2026 produced a dense cluster of agent ERCs. The one closest to the user's primitive is **ERC-8183 "Agentic Commerce"** (Feb 2026). Its authors are Davide Crapis (who co-designed with Vitalik the ZK API credits behind the EF's zkAPI) and three authors with Virtuals-affiliated GitHub handles. It defines an escrowed job whose single **evaluator** (an address, so possibly a contract) alone decides complete vs. reject, with timeout refunds and per-job hooks. **ERC-8004** identity, reputation and validation registries are live on mainnet (Jan 29, 2026) but empirically thin. **ERC-8033** standardizes agent-council oracles (commit, reveal, judge, with bonds). Verification-oriented standards (7992 ZKML, 8084 ZK metadata, 7913 signature verifiers, 7969 DKIM, 8002 Bitcoin SPV) provide ready-made resolver input formats. Account and permission standards (7579, 7710/7715, 7739) are still Draft.

### Cited Findings

**Agent-specific standards (registry statuses as of Oct 21, 2026, from the [ERC index](https://eips.ethereum.org/erc))**
- **ERC-8183 Agentic Commerce** (Draft, created 2026-02-25; authors Davide Crapis, Bryan Lim (@ai-virtual-b), Tay Weixiong (@twx-virtuals), Chooi Zuhwa). The Virtuals affiliation is inferred from GitHub handles, and Crapis's EF team role was not verified in sources read.
  - A job has client, provider, evaluator, description, budget, `expiredAt` and an optional `hook`.
  - States: Open → Funded → Submitted → Completed / Rejected / Expired.
  - "When status is Submitted, only the evaluator MAY call complete or reject". After `expiredAt`, "anyone may trigger refund".
  - `submit(jobId, deliverable bytes32)` and `complete/reject(jobId, reason bytes32)` produce attestation hashes intended for "composition with reputation (e.g. ERC-8004)".
  - Optional `IACPHook.beforeAction/afterAction(jobId, selector, data)` around each core function.
  - The provider can be zero at creation to allow bidding. `fund(jobId, expectedBudget)` protects against front-running.
  - Source: [ERC-8183 spec](https://eips.ethereum.org/EIPS/eip-8183)
- **ERC-8004 Trustless Agents** (Draft): an Identity Registry (ERC-721 + URIStorage), a Reputation Registry (feedback signals) and a Validation Registry ("stakers re-running the job, zkML verifiers, TEE oracles, trusted judges") — [ERC-8004 spec](https://eips.ethereum.org/EIPS/eip-8004)
  - Registries went live on Ethereum mainnet Jan 29, 2026 — [Forbes, Feb 5 2026](https://www.forbes.com/sites/digital-assets/2026/02/05/ai-agents-gain-trust-via-ethereum-erc-8004-on-mainnet/)
  - An on-chain audit reports the Identity Registry at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` and the Validation Registry at `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58`. On mainnet one registry had 50,082 records, one 3,215, and "one has never been called" — [LLM4Agents audit](https://llm4agents.com/blog/erc-8004-registries-onchain-audit) (secondary, via search summary)
  - An academic study found only 3–15% of identities expose a valid registration file with a service endpoint, and concluded the deployed Reputation Registry "cannot function as a trust signal" — [arXiv 2606.26028](https://arxiv.org/html/2606.26028v2) (via search summary)
- **ERC-8033 Agent Council Oracles** (Draft, 2025-09-28). A requester opens a query with N infoAgents, a commit deadline and reward/bond amounts. Bonded agents commit hashes, then reveal. A judgeAgent picks correct answers, winners split the reward, and wrong agents lose their bond. Target uses include "resolving prediction markets" — [ERC-8033 spec](https://eips.ethereum.org/EIPS/eip-8033)
- **ERC-8001 Agent Coordination Framework** (**Final**, 2025-08-02). An initiator posts an intent; participants sign EIP-712 acceptance attestations (1271-compatible). It becomes executable once all are present and fresh. Privacy, bonding and thresholds are left to modules — [ERC-8001 spec](https://eips.ethereum.org/EIPS/eip-8001)
- **ERC-8017 Payout Race** (Draft, 2025-08-31): a bucket that sends its entire balance to the first caller paying a fixed price, "analogous to a Dutch auction" — [ERC-8017 spec](https://eips.ethereum.org/EIPS/eip-8017)
- **ERC-8126 AI Agent Verification** (**Final**, 2026-01-15): multi-layer verification of 8004 agents (token, media, Solidity code, web app, wallet) with ZK-backed private results and a 0–100 risk score. Can post to the 8004 Validation Registry — [ERC-8126 spec](https://eips.ethereum.org/EIPS/eip-8126)
- **ERC-8273 Attestation-Gated Agentic Actions** (Draft): an attestation registry with transaction-scoped consumption via transient storage (EIP-1153). Scope is given as `capability` plus `actionDigest` — [ERC-8273 spec](https://eips.ethereum.org/EIPS/eip-8273)
- **ERC-8354 Confidential Agent Policy Verdicts** (Draft, 2026-07-16): a ZK proof that an agent action satisfies an undisclosed committed policy. It is bound to an 8004 identity, an ERC-7812 policy root, an action commitment, an executor, an expiry and a nullifier — [ERC-8354 spec](https://eips.ethereum.org/EIPS/eip-8354)
- **ERC-8410 Portable Execution Plan Artifact** (Draft, 2026-09-04): agents pass wallets a reference to a plan (location, length, digest) instead of raw calldata — [ERC-8410 spec](https://eips.ethereum.org/EIPS/eip-8410)
- **ERC-8436 Agent Collective Decision Framework** (Draft, 2026-10-04): immutable content-addressed decision policies, issues bound to a "relying contract" consumer, and a state machine with "procedural finality" — [ERC-8436 spec](https://eips.ethereum.org/EIPS/eip-8436)
- **ERC-8257 Agent Tool Registry** (Draft, 2026-04-17), with predicate-gated invocation — [ERC-8257 spec](https://eips.ethereum.org/EIPS/eip-8257). **ERC-8122 Minimal Agent Registry** (Draft; built on 6909 + 7930) — [ERC-8122 spec](https://eips.ethereum.org/EIPS/eip-8122)
- Further titles in the registry, not read in detail: 8196 AI Agent Authenticated Wallet (Final), 8217 Agent NFT Identity Bindings, 8226 Regulated Agent Mandate, 8259 AI Agent Identity & Threat Registry, 8350 Agent Memory State Registry, 8444 Agentic Resource Discovery, 8107 ENS Trust Registry for Agent Coordination (Review), 7857 AI Agents NFT with Private Metadata (Final), 8152 Content-Addressable Logic Modules (Review) — [ERC index](https://eips.ethereum.org/erc)

**Conditional, escrow and oracle standards**
- **ERC-7573 Conditional-upon-Transfer-Decryption for DvP** (Draft): delivery-versus-payment across two chains. A transfer on one chain is made conditional on a transfer on another, using a stateless "decryption oracle" — [ERC-7573 spec](https://eips.ethereum.org/EIPS/eip-7573)
- **ERC-7796 Conditional send transaction RPC** (Review): `eth_sendRawTransactionConditional` lets users state preconditions for inclusion to builders and sequencers — [ERC-7796 spec](https://eips.ethereum.org/EIPS/eip-7796)
- **ERC-7726 Common Quote Oracle** (Draft): a standard quote interface that uses explicit token amounts instead of price factors — [ERC-7726 spec](https://eips.ethereum.org/EIPS/eip-7726)
- Stagnant core EIPs in the same space: EIP-7793 Conditional Transactions (valid only at a given slot and index, with a `TXINDEX` opcode) and EIP-7833 Scheduled function calls (`OFFERCALL`, where contracts pay block producers to run them) — [EIP core index](https://eips.ethereum.org/core); [EIP-7793](https://eips.ethereum.org/EIPS/eip-7793); [EIP-7833](https://eips.ethereum.org/EIPS/eip-7833)

**Verification and evidence standards (resolver input formats)**
- **ERC-7992 Verifiable ML Model Inference (ZKML)** (Draft, 2025-07-23): a registry gives each `ModelCommitment` (weights/architecture hash, circuit, verifying key, `proofSystemId`) a `modelId`. `verifyInference(modelId, inputCommitment, output, proof)` reverts on mismatch — [ERC-7992 spec](https://eips.ethereum.org/EIPS/eip-7992)
- **ERC-8084 ZK proof metadata** (Draft): exposes proof-system id, circuit id and version, public-input schema hash/URI and VK URI — [ERC-8084 spec](https://eips.ethereum.org/EIPS/eip-8084)
- **ERC-7913 Signature Verifiers** (**Final**): verifies signatures from "address-less keys" such as non-Ethereum curves, hardware devices or "even email addresses" — [ERC-7913 spec](https://eips.ethereum.org/EIPS/eip-7913)
- **ERC-7969 DKIM Registry** (Draft): on-chain DKIM public-key hashes per domain for "trustless email ownership verification" — [ERC-7969 spec](https://eips.ethereum.org/EIPS/eip-7969)
- **ERC-8002 Bitcoin SPV Gateway** (Draft): a singleton where anyone submits BTC headers; tx inclusion is checked by Merkle proof (the address is still "0xTODO") — [ERC-8002 spec](https://eips.ethereum.org/EIPS/eip-8002)
- **ERC-7812 ZK Identity Registry** (Review), used as the "Evidence Registry" by 8354 — [ERC index](https://eips.ethereum.org/erc); [ERC-8354 spec](https://eips.ethereum.org/EIPS/eip-8354)
- **EAS** mainnet contracts: EAS `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587`, SchemaRegistry `0xA7b39296258348C78294F95B872b282326A97BDF`. OP-stack predeploys sit at `0x4200…0021` and `0x4200…0020` — [EAS contracts README](https://github.com/ethereum-attestation-service/eas-contracts)

**Account, permission, vault and token standards (status check)**
- Final: 4337, 1271, 6492, 2771, 4626, **7540 async vaults**, 7575, **6909 multi-token**, 7201 namespaced storage, **7208 on-chain data containers**, **5564 stealth addresses**, 7786, 7913, 8001, 8126.
- Review: 6551 token-bound accounts, 7930, 7828.
- Draft: **7579 modular accounts**, 6900, **7710 delegation**, **7715 wallet permissions**, 7739, 7683, 8004, 8183.
- Related vault work: ERC-7887 (cancellation for 7540, Draft) and **ERC-8161 Transferable Tokenized Vault Requests** (Final).
- Source: [ERC index](https://eips.ethereum.org/erc)
- Newer AA standards: ERC-8286 "Modular Accounts for Frame Transactions" (Draft) and ERC-8199 "Sandboxed Smart Wallet" (Draft) — [ERC index](https://eips.ethereum.org/erc)

### Inferences
- **ERC-8183 is effectively the standards-track version of the user's primitive, minus permissionless resolvers.** Its "evaluator" is a single address set at job creation. If that address is a deterministic resolver contract, the user's design fits inside it. Exposing a code-resolved market as 8183 jobs (evaluator = resolver contract, hook = protocol logic) could give instant discoverability to agent frameworks targeting 8183/8004. The main divergences: 8183 is client/provider work-for-pay, not two-sided stakes; it has a single payment token; and it has no taker-posts-collateral flow. A hook or wrapper could bridge these.
- ERC-8033's commit → reveal → judge → slash pattern is a ready template for **subjective-question resolvers**: a resolver program that calls an agent council for fuzzy inputs, with bonds as the anti-lazy-answer mechanism.
- Resolver "input adapters" are already standardized or in progress for:
  - ZKML inference (7992)
  - arbitrary ZK proofs (8084 metadata + VK registries)
  - emails (7969 DKIM + zkEmail)
  - non-Ethereum signatures such as P-256 devices and news-org keys (7913 + the P-256 precompile)
  - Bitcoin transactions (8002)
  - on-chain attestations (EAS, 8004 Validation Registry)
  - agent-policy proofs (8354).

  A resolver ABI that accepts "(standard id, payload)" pairs could make these plug-and-play.
- ERC-8004 adoption is thin and gameable (empirical study above). A protocol should treat 8004 reputation as a weak hint, not a resolver input. The protocol's own resolution history could become the stronger reputation signal and be posted back to 8004.

### Gaps
- No ERC specific to prediction markets or binary outcome tokens surfaced in 2025–2026 titles, aside from 8033 mentioning prediction markets. I did not read every 8xxx ERC body.
- x402 (HTTP-402 agent payments) is not an ERC in the registry snapshot I parsed, so I could not verify its standards status here.
- Could not verify the current costs or status of shared proof-verification layers (Aligned Layer, zkVerify). The Aligned README fetched had no cost figures, and search was unavailable.

---

## 4. Historical and state access without oracles: EIP-2935, EIP-4788, proposer lookahead, history expiry, state expiry, log indexes

### Takeaway
On mainnet today a contract can trustlessly anchor to any of the last **8191 execution block hashes** (EIP-2935, ~27.3 h) and **8191 beacon block roots** (EIP-4788, ~27 h, queried by timestamp). With Merkle proofs against those anchors it can prove arbitrary past state, transactions, receipts, logs and beacon-state facts from that window, including the next epoch's proposer schedule (EIP-7917). Going further back requires chained proofs or ZK historical proofs. Pre-Merge history has been dropped from default nodes (partial EIP-4444, Jul 2025). Proposals to make logs cheaply provable (7745, 8304) and to serve BLOCKHASH from storage (7709) are not yet scheduled. State-expiry research shows ~80% of state is untouched for >1 year, which matters for long-dated escrows.

### Cited Findings
- EIP-2935: `HISTORY_SERVE_WINDOW = 8191` hashes in a ring buffer at `0x0000F90827F1C53a10cb7A02335B175320002935`. It "allows building/validating proofs related to last HISTORY_SERVE_WINDOW ancestors directly against the current state". `BLOCKHASH` itself still serves only 256 — [EIP-2935 spec](https://eips.ethereum.org/EIPS/eip-2935). SHIPPED in Pectra — [EF Pectra announcement](https://blog.ethereum.org/en/2025/04/23/pectra-mainnet)
- EIP-4788: `BEACON_ROOTS_ADDRESS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02`, `HISTORY_BUFFER_LENGTH = 8191`. Callers pass a timestamp, and the call reverts if the timestamp doesn't match the stored one — [EIP-4788 spec](https://eips.ethereum.org/EIPS/eip-4788). That is ~27.3 h at 12 s slots and would be ~22.8 h at 10 s — [EIP-8198 spec](https://eips.ethereum.org/EIPS/eip-8198)
- EIP-7917 (Fusaka): the proposer schedule is provable "via the beacon root and a simple Merkle proof" — [EIP-7917 spec](https://eips.ethereum.org/EIPS/eip-7917)
- SLOTNUM exists because proving the slot via EIP-4788 is "gas-expensive" — [EIP-7843 spec](https://eips.ethereum.org/EIPS/eip-7843)
- **EIP-7709** (read BLOCKHASH from the 2935 contract and update its cost) is B-tier for Hegotá, with "real value for the history-expiry direction" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips); [EIP-7709 spec](https://eips.ethereum.org/EIPS/eip-7709)
- **EIP-7745 / EIP-8304 Trustless log and transaction index**: a Merkle-tree index of logs, tx and block markers in a system contract, "to allow efficient trustless proofs of log and transaction lookups" — [EIP-8304 spec](https://eips.ethereum.org/EIPS/eip-8304); [EIP-7745 spec](https://eips.ethereum.org/EIPS/eip-7745). 8304 was **DFI** for Hegotá: "belongs with the history and logs work" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
- **Partial history expiry** (Jul 8, 2025): all EL clients support dropping pre-Merge blocks, saving 300–500 GB. History is retrievable from institutional providers, torrents and P2P peers. "Full, rolling history expiry is ongoing" — [EF partial history expiry](https://blog.ethereum.org/en/2025/07/08/partial-history-exp). Fusaka's eth/69 (EIP-7642) "adds an explicit history serving window for nodes to advertise" — [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)
- **State:** "roughly 80% of the state has not been touched for more than 1 year". Directions under study: "mark, expire, revive" and "multi-era expiry" with revival proofs. Statelessness may centralize state serving, and if "L1 state access becomes fragile… [L2 force-inclusion] safety valves become much harder to use" — [EF "The Future of Ethereum's State"](https://blog.ethereum.org/en/2025/12/16/future-of-state)
- Related drafts:
  - EIP-8125 Temporary Contract Storage (`TMPSTORE/TMPLOAD`, cleared on a fixed schedule) — [EIP-8125 spec](https://eips.ethereum.org/EIPS/eip-8125)
  - EIP-8188 last-written-block metadata (DFI for Hegotá) — [EIP-8188 spec](https://eips.ethereum.org/EIPS/eip-8188)
  - EIP-8295 State Tiering by Periods (writes to inactive state cost more) — [EIP-8295 spec](https://eips.ethereum.org/EIPS/eip-8295)
  - EIP-7864 unified binary tree — [EIP-7864 spec](https://eips.ethereum.org/EIPS/eip-7864)
- The state arc's major migration work begins in I* — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)

### Inferences
- **"Did X happen on L1 in the last ~27 hours?" is natively resolvable today with no oracle.** Examples: a transfer, a log, a storage value at block B, a beacon-chain fact such as a validator being slashed, a balance, or the proposer of slot S. A resolver verifies MPT or SSZ proofs against `blockhash`-from-2935 or a 4788 beacon root. The resolve-or-lose window must close within ~27 h of the fact (~22.8 h if 10 s slots ship), or someone must checkpoint the hash/root into storage earlier.
- **Resolvers over older history** need either a header-chain accumulator maintained by the protocol (cheap: store a 2935 hash every <27 h) or a ZK coprocessor proof. Pre-Merge data is no longer guaranteed from every peer, so off-chain proof generation for old blocks depends on archive and torrent providers.
- **Logs are not EVM-readable.** Proving a log needs a receipts-trie proof (heavy) until a trustless log index ships; it was DFI'd for Hegotá. A resolver that depends on "event E emitted" will be more expensive than one depending on a storage value. Prefer resolvers that read state roots and storage. Inside a single tx, EIP-7906 assertions can inspect events, but only for that tx's own events.
- **Long-dated contracts face state-expiry risk** if a mark-expire-revive or multi-era design ships (not before I*, realistically late 2027+). Positions with deadlines >1 year may need revival proofs or periodic "touches". EIP-8125-style temporary storage could make short-lived positions much cheaper if it advances.

### Gaps
- I did not verify current gas costs for a full MPT storage proof plus 2935 lookup after the Glamsterdam repricing.
- Portal Network status in 2026: the partial-expiry post lists only institutional, torrent and P2P retrieval and does not mention Portal. I could not confirm whether Portal was deprecated or is still being pursued.
- Could not confirm whether `historical_summaries`-based proofs of arbitrary-age beacon blocks are commonly used by on-chain verifiers; this rests on domain knowledge only.

---

## 5. Research frontier: inclusion lists, MEV and ePBS, encrypted mempools, randomness, minimal/lean Ethereum, Vitalik's 2025–2026 writing

### Takeaway
Censorship resistance (FOCIL + VOPS) is the near-term frontier, landing in Hegotá. Encrypted mempools (EIP-8105, LUCID EIP-8184) and commit-reveal frames (EIP-8209) are drafts aimed at a later fork. MEV-burn-style issuance changes were explicitly pushed out of fork scoping. Randomness hardening (VRF RANDAO, hash-chain RANDAO) is drafted but waits for the full PQ consensus design. Vitalik frames post-Hegotá Ethereum as a "cryptographic world computer": a SNARK-verified, PQ, multi-party-built chain where how a computation is structured (parallelizable, pre-aggregated) increasingly determines its cost.

### Cited Findings

**FOCIL, EIP-7805 (Hegotá S-tier)**
- Each slot, an IL committee builds and gossips inclusion lists from the mempool. The next slot's proposer or builder must include IL transactions, and attesters "only vote for the proposer's block if it includes transactions from all stored ILs" — [EIP-7805 spec](https://eips.ethereum.org/EIPS/eip-7805)
- Parameters: `IL_COMMITTEE_SIZE = 16`, `MAX_BYTES_PER_INCLUSION_LIST = 8 KiB`. IL members build lists at slot N, t=0–8 s; there is a view-freeze at t=9 s; inclusion happens in slot N+1 — [EIP-7805 spec](https://eips.ethereum.org/EIPS/eip-7805)
- Builders may omit an IL tx only if it "is invalid when appended to the payload or the payload does not have enough remaining gas" — [EIP-8369 spec](https://eips.ethereum.org/EIPS/eip-8369)
- EIP-8369 VOPS profiles define eligibility. Profile 1 covers legacy, 2930, 1559 and 7702 txs. Profile 2 covers frame txs whose validation stays within a fixed AA-VOPS state surface; it is "weaker when another transaction can move a validation dependency within the block" — [EIP-8369 spec](https://eips.ethereum.org/EIPS/eip-8369)
- "FOCIL gives any user a path to include an eligible transaction without relying on centralised builders" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
- Related draft: EIP-8046 "Uniform price auction over inclusion lists" — [EIP core index](https://eips.ethereum.org/core)

**ePBS and MEV**
- ePBS (Glamsterdam): staked builders, trustless proposer payment, slot deadlines for construction, payload reveal and attestations — [EIP-7732 spec](https://eips.ethereum.org/EIPS/eip-7732); [EF Soldøgn recap](https://blog.ethereum.org/en/2026/05/02/soldogn-interop-recap)
- EIP-8375 "ePBS Mandatory Burn of Execution Rewards" and EIP-8363 "Tapered Issuance Burn" were unanimously DFI'd. Issuance policy "belongs to a broader ecosystem process" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)
- Other MEV drafts: EIP-8099 MEVless Protocol (blind sequencing by tx hash, then execution) — [EIP-8099](https://eips.ethereum.org/EIPS/eip-8099); EIP-8115 batch priority fees at end of block (DFI) — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)

**Encrypted mempools and commit-reveal**
- **EIP-8105 Universal Enshrined Encrypted Mempool** (Draft, 2025-12-17). It is scheme-agnostic (threshold, MPC, TEE, delay encryption, FHE key providers) and "progression of the chain is guaranteed even if decryption key providers fail" — [EIP-8105 spec](https://eips.ethereum.org/EIPS/eip-8105)
- **EIP-8184 LUCID** (Draft, 2026-03-04; Elowsson, Florentine, Ma): commit-before-reveal encrypted txs through the public inclusion pipeline. It "broadens the practical censorship resistance of inclusion lists" and allows "trustless self-decryption" — [EIP-8184 spec](https://eips.ethereum.org/EIPS/eip-8184)
- **EIP-8209 Commit-Reveal Frames** — see §2 — [EIP-8209 spec](https://eips.ethereum.org/EIPS/eip-8209)
- EF priorities place encrypted mempools in "later work" of the privacy arc — [EF Protocol priorities, Sep 2026](https://blog.ethereum.org/en/2026/09/07/protocol-priorities)

**Randomness**
- EIP-7998 makes `randao_reveal` a per-slot BLS VRF that is "unpredictable across epochs even for the revealer itself" — [EIP-7998 spec](https://eips.ethereum.org/EIPS/eip-7998)
- EIP-8321 Hash-Chain RANDAO (PQ) — [EIP-8321 spec](https://eips.ethereum.org/EIPS/eip-8321). It is B-tier: "Sound direction, wrong sequencing" — [EF Hegotá tier list](https://blog.ethereum.org/en/2026/09/07/protocol-hegota-eips)

**Vitalik's 2025–2026 posts** (index: [vitalik.eth.limo](https://vitalik.eth.limo/))
- "The cryptographic world computer" (Sep 27 2026):
  - Verification is moving from "download and re-execute" to "PeerDAS sample and verify a SNARK", and block construction to "multi-party".
  - "the same amount of computation will cost you much more if you shove it all into one inscrutable serially-executed transaction, and much less if you put it into well-encapsulated dependencies that can be parallelized or pruned".
  - It predicts "programming patterns where information directly related to describing non-commutative state changes and ordering is posted onchain, and everything else is aggregated before it even gets included".
  - It flags that weak obfuscation (iO) could matter for encrypted mempools.
  - Source: [Vitalik, Sep 2026](https://vitalik.eth.limo/general/2026/09/27/the_cryptographic_world_computer.html)
- Other 2025–2026 titles: "Obfuscation" Parts I–III (Jun–Aug 2026), "A shallow dive into formal verification" (May 2026), "My self-sovereign / local / private / secure LLM setup" (Apr 2026), "Plinko PIR tutorial" (Nov 2025), "Galaxy brain resistance" (Nov 2025), "A GKR Tutorial" (Oct 2025), "Memory access is O(N^[1/3])" (Oct 2025), "Low-risk defi can be for Ethereum what search was for Google" (Sep 2025), "Simplifying the L1" (May 2025), "AI as the engine, humans as the steering wheel" (Feb 2025), "Reasons to have higher L1 gas limits even in an L2-heavy Ethereum" (Feb 2025) — [vitalik.eth.limo index](https://vitalik.eth.limo/)
- The EF is using AI agents in protocol security work ("The triage is the product: running AI agents against Ethereum's protocol code", Jul 2026). Agentic collaboration is also used for hash-based SNARK security benchmarks (Aug 2026) — [EF blog feed](https://blog.ethereum.org/en/feed.xml)

### Inferences
- For a conditional-contract protocol, **front-running of the "take" is the key MEV risk**. Examples: sniping mispriced offers, or taking just before a resolver input becomes public. Near-term mitigations are app-level: commit-reveal takes, batch auctions, ERC-7796 conditional sends on L2s. Protocol-level help (8209 commit-reveal frames, LUCID, 8105) is a later-fork prospect, not 2027-certain.
- **Do not use PREVRANDAO as a resolver input for high-value outcomes.** RANDAO hardening is deferred until the PQ consensus design is complete. drand (BLS12-381, verifiable via the 2537 precompile) or commit-reveal among counterparties are better randomness sources.
- Vitalik's "structure of computation" thesis points toward resolver designs that are pure functions of committed inputs. Proofs or aggregation can be done off-chain, so only the verdict plus a succinct proof goes on-chain. Positions should be storage-disjoint so BAL-based parallel execution can schedule them independently, rather than one hot global mapping.

### Gaps
- Execution tickets and attester-proposer separation (APS): there is no 2026 primary-source status in the material I could access. These are not in Hegotá's list, and their placement in the Strawmap image could not be read (it is a Google Drawing).
- App-specific sequencing on L1 and based-preconfirmation vendor status (Taiko, ETHGas, Primev mev-commit, Puffer UniFi) could not be checked. Search was exhausted and the only verified facts are EIP-7917 and Commit-Boost's role.

---

## 6. Overlooked capabilities a protocol designer could exploit (synthesis for an agent-native, code-resolved conditional-contract protocol)

### Takeaway
Many under-noticed mainnet primitives are already usable today: 2935 and 4788 anchors, P-256 and BLS12-381 precompiles, 7702 smart EOAs, the deterministic CREATE2 factory, and the 16.7M per-tx gas budget. Glamsterdam, likely around December 2026, adds SLOTNUM, ETH-transfer logs, 64 KiB contracts and repricing. Hegotá (2027) adds the most important new guarantees for this use case: FOCIL inclusion, Frames-native agent accounts, keyed and expiring nonces, outcome assertions and PAY. The standards layer already has an escrow-with-evaluator shape (ERC-8183) and an agent-council oracle shape (ERC-8033) to align with.

### Cited Findings (capability → status → source)
1. **Trustless "did it happen on L1" resolver inputs** for any fact provable from a block in the last 8191 blocks or beacon slots (~27 h). SHIPPED — [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935); [EIP-4788](https://eips.ethereum.org/EIPS/eip-4788)
2. **Proposer schedule provable on-chain** (next epoch). Use it to price inclusion risk near deadlines or to integrate based preconfs. SHIPPED — [EIP-7917](https://eips.ethereum.org/EIPS/eip-7917)
3. **P-256 verification at 6900 gas** for passkey-, Secure Enclave- and WebAuthn-signed inputs. SHIPPED — [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951)
4. **BLS12-381 pairing precompiles.** SHIPPED in Pectra — [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537)
5. **Same resolver address on every EVM chain** via the canonical CREATE2 factory, formally required in Glamsterdam — [EIP-7997](https://eips.ethereum.org/EIPS/eip-7997)
6. **Slot-length-agnostic clock** (`SLOTNUM`, 2 gas) — Glamsterdam — [EIP-7843](https://eips.ethereum.org/EIPS/eip-7843)
7. **Uniform ETH payout observability**: every ETH transfer emits an ERC-20-style `Transfer` log — Glamsterdam — [EIP-7708](https://eips.ethereum.org/EIPS/eip-7708)
8. **64 KiB contracts / 128 KiB initcode** for richer immutable resolvers — Glamsterdam — [EIP-7954](https://eips.ethereum.org/EIPS/eip-7954)
9. **Censorship-resistant settlement**: eligible txs force-included within about a slot (16 IL members × 8 KiB) — Hegotá — [EIP-7805](https://eips.ethereum.org/EIPS/eip-7805); [EIP-8369](https://eips.ethereum.org/EIPS/eip-8369)
10. **Agent-native accounts:** programmable validation, ERC-20 gas via paymasters, atomic batches, arbitrary or PQ signatures, and cross-frame introspection (`FRAMEDATALOAD`, `FRAMEPARAM`) — Hegotá — [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141)
11. **Parallel nonce lanes** (keyed nonces) so one agent can run many independent positions without nonce blocking — Hegotá A-tier — [EIP-8250](https://eips.ethereum.org/EIPS/eip-8250)
12. **Self-expiring offers** (expiring nonces, ≤60 s deadline, no permanent state) — Draft — [EIP-8266](https://eips.ethereum.org/EIPS/eip-8266)
13. **Outcome-enforced transactions** (ASSERT/POST_TX frames over net state diffs and events). A protocol can require callers' frame txs to carry a specific assertion — Hegotá A-tier — [EIP-7906](https://eips.ethereum.org/EIPS/eip-7906); [EF assertions post](https://blog.ethereum.org/en/2026/10/05/transaction-assertions)
14. **Shared recent-roots contract** that any "root source" writes to, verifiable in tx validation (FOCIL-compatible) — Hegotá A-tier — [EIP-8272](https://eips.ethereum.org/EIPS/eip-8272)
15. **Reentrancy-free value transfer** (`PAY`, `0xfc`) — Hegotá A-tier — [EIP-5920](https://eips.ethereum.org/EIPS/eip-5920)
16. **Commit-reveal takes at protocol level** (COMMIT in block N-1 as an inclusion guarantee, REVEAL in N) — Draft — [EIP-8209](https://eips.ethereum.org/EIPS/eip-8209)
17. **Optional L1 execution proofs gossiped by the network**, plus a real-time-proving industry at ~$0.003 per block proof on 4 GPUs — Hegotá A-tier / live — [EIP-8025](https://eips.ethereum.org/EIPS/eip-8025); [ethproofs.org](https://ethproofs.org)
18. **EVM-execution verification as a primitive** (`EXECUTE` precompile + fork VK registry) — Draft — [EIP-8079](https://eips.ethereum.org/EIPS/eip-8079); [EIP-8357](https://eips.ethereum.org/EIPS/eip-8357)
19. **Private metered API payments for agents** (zkAPI vault on mainnet) — live — [EF zkAPI](https://blog.ethereum.org/en/2026/10/01/introducing-zkapi)
20. **Standard shapes to align with:** ERC-8183 job escrow + evaluator + hooks — [ERC-8183](https://eips.ethereum.org/EIPS/eip-8183); ERC-8033 bonded agent councils — [ERC-8033](https://eips.ethereum.org/EIPS/eip-8033); ERC-8001 multi-party EIP-712 coordination (Final) — [ERC-8001](https://eips.ethereum.org/EIPS/eip-8001); ERC-7992 ZKML verification — [ERC-7992](https://eips.ethereum.org/EIPS/eip-7992); ERC-7913 address-less key verification (Final) — [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913)
21. **Per-tx compute ceiling of 16,777,216 gas** regardless of block size — SHIPPED — [EF gas-cap update](https://blog.ethereum.org/en/2025/10/21/fusaka-gascap-update)

### Inferences (design moves; author's synthesis, not sourced claims)
- **Resolver = ERC-8183 evaluator contract.** Make each position an 8183-compatible job whose evaluator is the immutable resolver deployed via the EIP-7997 factory, so the address commits to the code across chains. Use the 8183 hook for two-sided collateral. Agents already integrating 8183/8004 could discover the markets with no new integration.
- **"Proof-carrying resolution" over a ~27 h anchor.** Resolution transactions carry Merkle proofs against 2935 or 4788 roots, so any L1 fact becomes a resolver input without an oracle. Add a permissionless "checkpoint" function that stores a block hash before the window expires, to support longer-dated resolutions.
- **Timing guarantees as a product parameter.** Before Hegotá, set settlement and dispute windows to absorb builder-censorship and last-slot MEV; use multi-slot grace periods and SLOTNUM-based deadlines. After Hegotá, the protocol could offer "tight deadline" market types whose claim/settle txs are FOCIL-eligible (Profile 1, or frame txs within VOPS Profile 2). Window length could become a fee or risk tier.
- **Taker-side safety via assertions (2027+).** Let agents attach an ASSERT frame such as "after this take my max loss ≤ X and no approvals changed". The protocol can demand a canonical assertion for high-risk market types, which reduces drained-agent incidents.
- **Agent ergonomics via Frames.** Use keyed nonces per market, expiring-nonce offers that vanish within 60 s (no cancel txs), and paymasters so agents can stake stablecoins without holding ETH. Signature agnosticism (P-256 or PQ) future-proofs against the 2029 PQ migration.
- **Resolver input menu as standards adapters.** Candidate input types:
  - L1 state proofs (2935/4788)
  - Bitcoin SPV (8002)
  - DKIM email (7969)
  - signed data from P-256 devices or address-less keys (7951/7913)
  - ZKML inference (7992)
  - agent councils for subjective questions (8033)
  - EAS attestations
  - another chain's state via ERC-7786/7888 messaging
  - eventually `EXECUTE` (8079)

  Each adapter is a small verified library, and markets declare which adapter set their resolver uses.
- **Cost hygiene for the post-Glamsterdam schedule.** Avoid fresh-slot-per-position storage where possible (EIP-8037 CPSB). Avoid 2,300-gas stipend sends; use pull payments now and PAY later. Keep resolvers under the 16.7M gas tx cap. Keep position storage disjoint to benefit from BAL parallelism.
- **Randomness-resolved markets** should use drand-style BLS beacons (verifiable via 2537) or counterparty commit-reveal, not PREVRANDAO.
- **Long-dated markets** should plan for possible future state expiry or tiering, and for the 2029 PQ key migration. Store minimal state, let positions be "touched" or renewed, and verify signatures via 1271/7913 rather than ecrecover.

### Gaps
- None of the Hegotá features (FOCIL, Frames, 7906, 8250, 8272, 5920) are final. A-tier items can still be cut, and Hegotá's date depends on Glamsterdam shipping.
- I could not quantify post-Glamsterdam gas costs for typical resolver operations (proof verification, storage writes). Exact CPSB values were finalized at Soldøgn but not captured in the sources I read.
- I could not verify the 2026 production status of based preconfirmations or fast-withdrawal systems that would let an L1 resolver read L2 outcomes quickly.
