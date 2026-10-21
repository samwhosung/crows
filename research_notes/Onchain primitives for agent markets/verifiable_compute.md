# On-chain Verifiable Compute Primitives (state as of Oct 21, 2026) — zkVMs, proof markets, zk coprocessors, verifiable AI, optimistic verification, proofs of exploit

Research note for a permissionless, agent-native protocol for "code-resolved conditional contracts": a poster stakes funds, names a resolver program and a deadline, a taker (usually an AI agent) takes the other side, and the resolver decides payout. Heavy resolvers must be proven or disputed off-chain and settled on-chain.

Method note: the session's shared web-search budget ran out partway through. Later facts came from fetching primary pages directly (docs, blogs, GitHub, arXiv/ePrint, and two PDFs read locally). Some vendor numbers could not be cross-checked, and those are marked. Labels used: **[MAINNET]** shipped in production, **[BETA]**, **[TESTNET]**, **[RESEARCH]**, **[STALLED/PIVOTED/DEAD]**.

---

## 1. zkVMs: maturity, proving cost and latency, real-time Ethereum proving, what programs can run, on-chain verification gas

### Takeaway
General-purpose RISC-V zkVMs are production infrastructure in Oct 2026. SP1 Hypercube has been on mainnet since Feb 2026. OpenVM 2.0 has been in production since Jul 2026, with formally verified RV32IM and Keccak/SHA-2 circuits. RISC Zero powers the Boundless market. Real-time Ethereum block proving works on 4–16 RTX 5090s, and a block proof costs under 1 cent. For a resolver protocol, the useful facts are these: a proof of a single program run of millions to billions of cycles costs cents to about a dollar and takes seconds to minutes; an EVM-verifiable Groth16 proof costs about 270k gas to verify; and the main risks are now soundness bugs and guest-program bugs, not performance.

### Cited Findings

**Real-time Ethereum proving (the forcing function behind the 2025–26 performance gains)**
- Ethproofs launched Jan 28, 2025. In 2025 it onboarded 7 zkVMs and 15 provers and verified about 200k blocks. Latency fell 5× and cost fell 15×. Cost per proof went from $1.69 to under one cent. Four teams reached sub-10s P99 on clusters under $100k capex and 10 kW. Single-GPU proving fell from 16 minutes to under 60 s for most teams. — [Ethproofs 2025 Review & 2026 Roadmap](https://hackmd.io/@willcorcoran/S1A840ZMZg)
- EF north-star targets: P99 ≤10 s, ≤$100k capex, ≤10 kW, 128-bit security, ≤300 KiB proofs. Targets for 2026: P99 <8 s and RTX 5090 as the standard cost unit (more than 90% of clusters are 5090-based). Mandatory proving is the long-term goal, with no dates given. — [Ethproofs review](https://hackmd.io/@willcorcoran/S1A840ZMZg)
- Live Ethproofs snapshot (fetched Oct 21, 2026), "RTP cohort, security sprint phase", working toward "M2: 100-bit provable / 600 KiB". Of 8 provers evaluated, 2 are eligible. 401,824 block slots were evaluated. 62.6% of proofs were sub-10 s against a ≥70% target, and 35.2% of slots were offline. Eligibility by weeks: ZisK 4×5090 69%, Axiom 16×5090 58%. Listed teams include AntChain zkDTVM, ZisK, Axiom, Airbender v3, "Succinct Twin Peaks" (2×5090) and Ziren. Cost fields show about $0.003 (unit not stated). — [ethproofs.org](https://ethproofs.org/)
- A Sep 2, 2026 live cohort had only 39.7% sub-10-second successes across evaluated slots. In that analysis's words, real-time proving works "on specific multi-GPU setups rather than universally". — [Wavect, updated Sep 2, 2026](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- The L1-zkEVM 2026 roadmap (EF, Jan 26, 2026) defines the pipeline as EL ExecutionWitness → zkEVM guest program → zkVM → prover → CL "zkAttester" verification. It includes a zkVM-guest API standardization covering "minimal hardware targets, C headers for precompiles and I/O, memory, panic, unaligned-access rules", and formal verification of guest programs, provers and verifiers. ePBS in Glamsterdam widens the proof window from 1–2 s to 6–9 s. — [Ethereum Magicians L1-zkEVM roadmap 2026](https://ethereum-magicians.org/t/l1-zkevm-roadmap-2026-integrating-zkevm-proofs-into-ethereums-core-protocol/27595)
- EIP-8025 (secondary source only): adds a "zkAttester" validator class and a 3-of-5 proof threshold, meaning multiple independent zkVMs. — [thirdweb explainer](https://blog.thirdweb.com/ethereums-l1-zkevm-how-zk-proofs-will-replace-block-re-execution-in-2026/). Not confirmed from a primary EIP page.

**Per-zkVM status**
- **SP1 Hypercube (Succinct) [MAINNET]**: "SP1 Hypercube Is Now Live on Mainnet", Feb 19, 2026. Optimism chose Succinct (OP Succinct) as a preferred ZK option for the Superchain on Feb 12, 2026. Base (Base Azul) is proving $7.4B of deposits with SP1 (May 4, 2026). Chainlink CCIP 2.0 has a ZK verification option (Sep 28, 2026). SP1 integrated NVIDIA cuPQC (Sep 3, 2026). Succinct also published "VEIL", adding zero-knowledge to hash-based proofs at about 3% prover overhead (May 1, 2026), and "Flock", a SNARK for batches of standard hashes at about 250× native cost (Jun 25, 2026). — [Succinct blog](https://blog.succinct.xyz/)
- SP1 reportedly proved 99.7% of Ethereum blocks in under 12 s on 16 RTX 5090s (Nov 2025). — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- SP1 is audited by Veridise, Cantina, Zellic and KALOS, is "recommended for production use", and is built on Plonky3. — [SP1 GitHub](https://github.com/succinctlabs/sp1)
- SP1 development builds target `riscv32im-succinct-zkvm-elf`. `cargo prove build` "may not produce a reproducible ELF", so use `--docker` with a pinned tag and compare the SHA-512 of the ELF. — [SP1 docs: compiling](https://docs.succinct.xyz/docs/sp1/writing-programs/compiling)
- SP1 local proving needs 16+ cores and 16 GB+ RAM. The Groth16 wrap needs about 14 GB and PLONK about 60 GB. A GPU needs ≥24 GB VRAM (CC 8.0+, Linux only). For non-trivial programs, Succinct "highly recommends" its prover network. — [SP1 hardware requirements](https://docs.succinct.xyz/docs/sp1/getting-started/hardware-requirements)
- **OpenVM (Axiom) [MAINNET]**: production release Mar 31, 2025. OpenVM 2.0 beta (Apr 15, 2026) was called "fastest zkVM on Ethproofs". OpenVM 2.0 production release with proof aggregation shipped Jul 10, 2026. The RV32IM extension was formally verified in Lean by Nethermind (Feb 10, 2026), and the Keccak/SHA-2 circuits were verified in Lean (Aug 19, 2026). It claims 100-bit provable post-quantum security, audits by Cantina and zkSecurity, and "1 GHz on 64 GPUs". Lighter EVM rollup public devnet: Oct 16, 2026. — [axiom.xyz](https://www.axiom.xyz/), [Axiom blog](https://axiom.xyz/blog/)
- OpenVM 2.1 Preview (Jul 29, 2026) on 4× RTX 5090: average 5.0 s, P99 9.7 s over 7,200 blocks from block 24,000,000. On 16× 5090: average 2.4 s, P99 3.7 s, max 4.3 s. 100-bit provable security, proofs under 300 kB. — [Axiom: Proving Ethereum in Real Time on 4 GPUs](https://axiom.xyz/blog/2-1)
- On the Axiom Proving API, OpenVM v1.6.0 is recommended for production as of May 2026, and v1.4.x/1.5.0 were retired on 2026-05-18, so version churn is fast. — [Axiom docs versions](https://docs.axiom.xyz/user-guides/openvm/versions)
- **RISC Zero (R0VM) [MAINNET]**: listed as production and "powering live coprocessors". It paid a $50k bounty for a soundness bug found after prior audits. — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/). Docs are at version 3.0, and remote proving is routed via Boundless. — [RISC Zero docs](https://dev.risczero.com/api/zkvm/). The guest example uses `#![no_std]`/`#![no_main]`, with inputs via `env::read`, public outputs via `env::commit` (the "journal"), and a cycle counter via `env::cycle_count`. — [RISC Zero guest code 101](https://dev.risczero.com/api/zkvm/guest-code-101)
- **ZisK [on Ethproofs; not yet production per repo]**: the repo disclaimer says this version is the "foundation for a future production release", audits are underway, the code is under the 0xPolygonHermez org, and it is dual-licensed Apache/MIT. — [ZisK GitHub](https://github.com/0xPolygonHermez/zisk). Even so, ZisK is the most-eligible prover in the current Ethproofs RTP cohort at 69%. — [ethproofs.org](https://ethproofs.org/)
- **Airbender (ZKsync) [TESTNET for general use]**: integrated in the ZKsync OS developer-preview testnet, "not a generic production zkVM". — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/). Vendor-framed claim: 21.8 M cycles/s on one H100, versus SP1 Turbo 3.45 MHz and RISC Zero 1.1 MHz on the same card. — [BlockEden on Airbender, Jan 2026](https://blockeden.xyz/blog/2026/01/30/zksync-airbender-fastest-risc-v-zkvm-ethereum-proving/)
- **Jolt (a16z) [ALPHA]**: the README says "in alpha and is not suitable for production use". ISA is RV64IMAC. The code is unaudited. Twist & Shout upgrade Aug 18, 2025; 64-bit proving Oct 15, 2025. — [Jolt GitHub](https://github.com/a16z/jolt). Reported >1M cycles/s on a 32-core CPU, ~50 KB proofs, and a critical verifier soundness bug found and fixed in May 2026. — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- **Pico (Brevis)**: Pico Prism claims real-time Ethereum proving with 99.6% coverage and a 6.9 s average (vendor, Oct–Dec 2025). — [Brevis ProverNet press release](https://cryptoslate.com/press-releases/brevis-launches-provernet-mainnet-beta-the-first-decentralized-zk-proving-marketplace-on-chain/). A third-party roadmap targets full real-time proving on 16 consumer GPUs in H1 2026, and FPGA/ASIC work plus "enshrining Pico" in H2 2026; these are plans, not outcomes. — [Binance Research: Brevis](https://www.binance.com/research/projects/brevis)
- **Pico, Nexus, zkWASM**: "earlier-stage or niche". — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- **Magnetar (Microsoft Research, Srinath Setty, Oct 5, 2026) [RESEARCH]**: a transparent, hash-only (SHA-256/SHA-3), post-quantum RV64I zkVM with no Poseidon, curves, lattices or proximity-gap conjecture. At 120 bits of provable security on a 12-P-core M4 Max laptop, it proves 2^22-cycle runs at 7.2–8.7 M cycles/s (optimized: 9.5–12.8 MHz). Proofs are ~600 KiB and verify in 11–13 ms. Across 15 workloads it reports 24–66× the throughput of SP1 Hypercube and 12–37× Jolt-Dory (geometric means of about 39× and 18×). It notes that SP1 Hypercube targets about 100 bits. — [Magnetar paper PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/10/magnetar-1.pdf)
- **Stwo/S-two (StarkWare)**: Axiom's multi-agent "AI auditor" found a soundness bug in `stwo-cairo` in June 2026. `memory_id_to_big.claimed_sum` was not absorbed into the Fiat–Shamir transcript, which allowed forged proofs of invalid Cairo executions. It was reported Jun 5, 2026 and a fix was deployed to Starknet mainnet. No assets were at risk because Starknet proving is permissioned (Starknet holds about $400M). The bug was a regression introduced after the July 2025 zkSecurity-audited commit. — [Axiom: stwo bug](https://axiom.xyz/blog/stwo-bug)
- **Valida/Lita, Nexus specifics**: no 2026 primary-source status found (see Gaps).

**On-chain verification cost**
- SP1 Groth16 proof: ~260 bytes, about 270k gas, trusted setup from Aztec Ignition plus Succinct contributions. PLONK: ~868 bytes, about 300k gas, no new setup. Compressed STARKs are "not for onchain verification". — [SP1 proof types](https://docs.succinct.xyz/docs/sp1/generating-proofs/proof-types)
- Generic BN254 Groth16 cost model: pairing check = 34,000·k + 45,000 gas, so 4 pairings ≈ 181k gas. — [Horizen Labs](https://www.horizenlabs.io/blog/zk-analysis-the-true-cost-of-zk-verification). An alternative estimate is ≈207k + 7.16k × (number of public inputs). — [NEBRA HackMD](https://hackmd.io/@nebra-one/ByoMB8Zf6)
- zkVerify's vendor framing puts Groth16 on Ethereum at 200k–300k gas, "$20–$60 per proof during congestion". — [zkVerify blog, Apr 2026](https://zkverify.io/blog/what-is-zero-knowledge-proof-verification-a-complete-guide)
- Native precompiles: EIP-2537 (BLS12-381) is "Final". Its pairing check costs 32,600·k + 37,700 gas, with 120+ bits of security versus about 80 bits for BN254. — [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537). No EVM precompile for "verify an arbitrary STARK/zkVM proof" was found; zkVM proofs are still wrapped into BN254 Groth16/PLONK for the EVM.
- Boundless amortizes verification: provers batch many requests into a Merkle tree with a single Groth16 at the root, and each request gets a Merkle-inclusion "seal". The `RiscZeroVerifierRouter` accepts both Groth16 and Merkle-inclusion seals. — [Boundless proof lifecycle](https://docs.boundless.network/developers/proof-lifecycle)

**Security incidents relevant to trusting a zkVM as a judge**
- zkFuzz found 85 bugs, including 59 zero-days (39 confirmed), across 452 public circuits. zkEmail regex had eleven constraint bugs. A four-year-old Zcash Orchard soundness flaw forced the NU6.2 emergency upgrade (May 2026). The first in-the-wild ZK exploits targeted mishandled trusted setups. — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/), [zkFuzz arXiv 2504.11961](https://arxiv.org/pdf/2504.11961)
- The zkVM SoK (AsiaCCS 2026) notes that a zkVM soundness bug "can allow malicious actors to forge proofs for arbitrary false statements". — [ePrint 2026/525](https://eprint.iacr.org/2026/525)

### Inferences
- **Proving cost for a typical resolver, worked out.** The Boundless median of $0.04 per 10^9 cycles (Jan 2026, Section 2) gives these rough figures: a 50M-cycle test-suite run is about $0.002; a 1B-cycle run about $0.04; a 100B-cycle run about $4, before the requestor's price premium and before the amortized Groth16 cost. Verification at about 270k gas costs ≈0.00027 ETH at 1 gwei (≈$0.81 at $3,000/ETH). That is illustrative arithmetic, not a quote. On an L2 it is far cheaper, and with Boundless Merkle-inclusion seals the per-request share of the Groth16 cost shrinks further.
- **Latency.** For small resolvers (≤10^9 cycles) on a GPU prover, the floor is plausibly seconds to a few minutes, plus auction lock time and the Groth16 wrap. Deadlines in the contract should budget minutes to an hour, not seconds. The Boundless example uses a 3,600 s timeout.
- **What can run.** Mainstream zkVMs execute statically linked RISC-V ELF guests: rv32im for SP1/OpenVM/RISC Zero, rv64 for Jolt and Magnetar. Programs are mostly Rust, and C/C++ works via cross-compilers. There is no OS, no threads, and I/O happens only through host-provided stdin/journal. Porting a C/C++ target with a fuzz harness to RISC-V is realistic. Running an arbitrary closed-source x86 binary is not directly possible. It would need an x86 interpreter compiled into the guest (large constant-factor overhead) or Cartesi's optimistic RISC-V Linux VM (Section 5).
- **"Crash" must be defined in the guest, not inherited from the OS.** A zkVM has no MMU-based segfault. Out-of-bounds writes inside the address space usually do not trap, and the EF roadmap shows that panic, memory and unaligned-access semantics are still being standardized across zkVMs. A "this input crashes the program" resolver should compile the target with explicit checks: Rust panics/abort, a bounds-checking/ASan-like instrumentation pass, or Cheesecloth-style malloc/free validity tracking (Section 6). The resolver should then commit `crashed=true` plus a crash-site identifier to the journal.
- **Fuzzing workloads.** Proving a fuzzing campaign is pointless. Existential claims only need a proof of one witness execution, so the search (AFL/libFuzzer/LLM agents) runs natively and only the crashing replay is proven. The cost scales with the length of the crash path, not the campaign.
- **Security level.** Production zkVMs currently claim about 100-bit provable security (OpenVM, the Ethproofs M2 target), and 128 bits is still a target. For contracts with very large stakes, consider k-of-n zkVM verification (for example, SP1 plus OpenVM plus RISC Zero proofs of the same Rust guest). This mirrors EIP-8025's multi-proof philosophy and OP's multi-proof plans.
- **EIP-2537 fork.** From background knowledge (not re-verified this session): EIP-2537 shipped in Pectra (May 2025), so BLS12-381 Groth16 verifiers are viable on L1, but the major zkVM wrappers still use BN254.

### Gaps
- No primary source found for SP1 Hypercube's ISA (RV32 vs RV64), its verifier gas after Hypercube, or what "Succinct Twin Peaks" on Ethproofs is.
- No independent, apples-to-apples cycles/s benchmark across SP1 Hypercube, OpenVM 2.x, RISC Zero 3.x, ZisK and Airbender. All figures are vendor- or competitor-reported.
- Status of Nexus zkVM, Valida/Lita and the Cairo/Stwo general-purpose story in 2026 was not verified (search budget exhausted).
- No primary source on per-zkVM memory limits, soft-float cost, or a definitive std/threads support matrix.

---

## 2. Proof markets: how they work, who can request, on-chain settlement, volume

### Takeaway
Three proof markets are live: Boundless (RISC Zero), the Succinct Prover Network (SP1) and Brevis ProverNet (Pico, beta). Boundless is the closest fit for a permissionless on-chain protocol. Its market is a set of contracts on existing chains. It uses a reverse Dutch auction, the prover locks ZKC collateral that is slashed on a missed deadline, and the requester can impose a predicate on the journal and a callback to their contract. A resolver contract can therefore post a proof request and get called back with the verified result. Succinct's auction runs through an off-chain auctioneer that settles to Ethereum by ZK proof. One limitation matters for this design: in all of these markets the requester supplies the input. They fit deterministic resolvers ("run the hidden tests on this code"), not ones where the taker's private witness is the point ("I know a crashing input").

### Cited Findings

**Boundless (RISC Zero) [MAINNET since Sep 2025]**
- Timeline: mainnet beta Jul 14–15, 2025 on Base. Mainnet with Proof of Verifiable Work (PoVW) and the ZKC token Sep 14–15, 2025. NodeInfra partnership adds hundreds of GPUs (Oct 2025). "Boundless For Rollups" (Jan 12, 2026) replaces OP challenge games with ZK fault-proof or validity modes for BOB, SOON and MegaETH. Citrea (Bitcoin ZK rollup) uses Boundless (Jan 26, 2026). Verifier live on Stellar (Feb 10, 2026). XRPL privacy (Apr 13, 2026). "ZKC: The AI Access Coin" (Oct 19, 2026): ZKC stakers get credits for frontier AI models on "Boundless AI". — [Boundless blog](https://boundlessfdn.org/blog/)
- Network metrics (project-reported, Jan 11, 2026): proving capacity 400 trillion cycles/day, 99.9% uptime, median cost $0.04 per billion cycles. — [Boundless blog](https://boundlessfdn.org/blog/), echoed by [Bitget progress report](https://www.bitget.com/amp/news/detail/12560605246223), which also names the explorer prove.wtf
- Beta week 1 (Jul 2025): peak 2.6T cycles/day, 8k orders, 576 provers. — [Boundless on X](https://x.com/boundless_xyz/status/1947673050201157943). Incentivized phase: 0.5% of ZKC supply over 5 weeks, weighted by cycles, success rate and speed. — [Boundless Prover Incentives](https://boundlessfdn.org/blog/boundless-prover-incentives). Secondary reports give about 2,500–2,700 provers in beta. — [bex.co analysis](https://bex.co/blog/2026/01/14/boundless-risc-zero-decentralized-proof-market-zk)
- An aggregator reports a "Surge" upgrade on May 18, 2026 (+25% capacity, up to −50% cost). This is low-reliability and was not confirmed on the Boundless blog. — [CoinMarketCap AI updates](https://coinmarketcap.com/cmc-ai/boundless/latest-updates/)
- **Mechanism**:
  - Requests are submitted on-chain to the market contract, or off-chain via an order-stream server against a prior deposit.
  - A request contains an image URL (the guest ELF), the input (inline or URL), requirements (image ID plus a **predicate on the journal**, an optional **callback**, and a proof-type **selector** of Groth16 or Merkle inclusion) and an offer.
  - Offer example: min 0.001 ETH, max 0.002 ETH, 300 s ramp-up, 2,700 s lock timeout, 3,600 s timeout, 5 ZKC lock collateral.
  - Price rises linearly from min to max (reverse Dutch auction), so the earliest bid gives the lowest price. Provers preflight-execute to count cycles before bidding.
  - Locking requires ZKC collateral. If the locker misses the deadline, the collateral is slashed, which incentivizes other provers to step in. Requesters can disable locking by setting collateral above total supply.
  - On fulfillment the market verifies the aggregated proof, pays the prover, returns the collateral and emits the inclusion proof.
  - Source: [Boundless proof lifecycle](https://docs.boundless.network/developers/proof-lifecycle), [terminology](https://docs.boundless.network/developers/terminology)
- **Steel** (May 2025): "run Solidity code without gas limits", meaning EVM view calls are proven in the zkVM against a block commitment. — [Boundless blog](https://boundlessfdn.org/blog/)
- **OP Kailua [ARCHIVED]**: the repo is archived and read-only and "will receive no further updates, including security fixes". A fork is maintained by the ex-maintainer. Its hybrid mode used ZK fraud proofs, with a worst case of about 100B cycles, roughly $100 on Bonsai and about 1 hour; the dishonest party pays the proving cost. Validity mode claimed 1-hour finality. Veridise audits ran Feb 2025 to Feb 2026. — [Kailua GitHub](https://github.com/boundless-xyz/kailua)

**Succinct Prover Network [MAINNET since Aug 2025]**
- Provers bid in an off-chain sealed-bid auction run by a real-time RPC "auctioneer", and the lowest bid wins. Provers must stake PROVE, and more stake allows more concurrent auctions; delegation is supported. A missed deadline cancels the request and slashes stake. Requesters deposit PROVE to an Ethereum settlement contract and submit (program, deadline, max fee). The auctioneer periodically posts a ZK proof of balance changes, fulfillments and slashes to Ethereum. Users and provers can withdraw without the auctioneer's permission. — [Succinct docs: how it works](https://docs.succinct.xyz/docs/provers/how-it-works/overview)
- Stats (undated, from the homepage, fetched Oct 2026): 7.7M proofs fulfilled, 3,330T compute cycles, $13.5B total value secured, 35+ partners. — [succinct.xyz](https://www.succinct.xyz/). At the Aug 2025 mainnet launch there were more than 5M proofs. — [Yahoo/press](https://finance.yahoo.com/news/succinct-first-decentralized-prover-network-200500829.html)

**Brevis ProverNet [BETA]**
- Mainnet beta Dec 8, 2025. It runs continuous on-chain proof auctions using TODA (Truthful Online Double Auction) to match heterogeneous jobs to provers. Payment is in USDC during the beta, with BREV to replace it later and a future app-specific rollup. Only Pico is named. Brevis claims more than 250M proofs generated across 30+ partners (PancakeSwap, Uniswap, Linea, MetaMask, BNB Chain) on 6 chains. This is sponsored content. — [CryptoSlate press release](https://cryptoslate.com/press-releases/brevis-launches-provernet-mainnet-beta-the-first-decentralized-zk-proving-marketplace-on-chain/). A separate "ProverNet mainnet" is listed for Jan 2026 in a third-party timeline. — [Binance Research](https://www.binance.com/research/projects/brevis)

**Verification layers (cheaper verification, not proving)**
- Aligned Layer claims verification "at least 90% cheaper" and that its mainnet beta handles 1,000 proofs/s. This is a 2024 vendor claim. — [Crowdfund Insider interview, Jun 2024](https://www.crowdfundinsider.com/2024/06/226866-roberto-jose-catalan-co-founder-of-aligned-explains-how-zk-tech-will-onboard-significant-number-of-crypto-and-blockchain-users/). zkVerify (Horizen Labs) claims at least 90% reduction versus L1 verification. — [zkVerify blog](https://zkverify.io/blog/what-is-zero-knowledge-proof-verification-a-complete-guide), [Cointelegraph on mainnet](https://cointelegraph.com/news/zkp-verification-layer1-blockchain-zkverify-mainnet-launch)

### Inferences
- **Boundless already is a primitive conditional contract**: "pay up to X to whoever delivers, by time T, a proof that image I on input D yields a journal satisfying predicate P, then call my contract". A resolver protocol can sit on top of it. The resolver contract posts a Boundless request with image = resolver, input = (committed code, revealed tests) and callback = settlement, and pays the market fee from the stake.
- **Private-witness resolvers do not fit the market model directly.** Boundless and Succinct requests specify the input. For "there exists a crashing input", the taker must generate the proof themselves (locally, or by sending the witness to a prover, which leaks it), then call the verifier router directly. Delegated proving leaks the witness to the prover, which matters for exploit secrecy (zkpoex makes the same point, Section 6). TEE-based private proving would be a partial mitigation, but no 2026 primary source was found for one.
- **Price discovery.** The Boundless median ($0.04/B cycles, Jan 2026) is about 25× below Kailua's earlier Bonsai estimate (~$1/B cycles in 2025). Either prices fell sharply or Bonsai carried a premium. In both cases proving cost is small next to plausible stakes for anything under about 10^11 cycles.
- **Liveness and centralization.** Succinct's auctioneer is a single off-chain service, though it has forced withdrawal. Boundless runs fully on-chain auctions. For a "permissionless, fully on-chain" protocol, Boundless's contract-native design is better aligned. Kailua's archival shows maintenance risk in adjacent tooling.

### Gaps
- No primary 2026 order-volume, prover-count or fee-revenue figures for Boundless or Succinct (no Dune dashboard was reachable). Volume is reported as capacity or cumulative proofs, not paid demand.
- Gevulot, Fermah and the Lagrange Prover Network: no 2026 status found (search budget exhausted, and lagrange.dev returned 403). Treat them as unverified.
- Which chains Boundless market contracts are deployed on in Oct 2026 beyond Base: not confirmed from docs.

---

## 3. zk coprocessors and storage proofs: what historical or cross-chain state a contract can read trustlessly

### Takeaway
Reading historical or cross-chain EVM state trustlessly is a solved, shipped capability, but the vendor landscape has consolidated. Axiom no longer markets its coprocessor and has become an OpenVM/zkVM company. RISC Zero Steel (via Boundless) and SP1-based light clients and contract-call proofs now cover much of the "prove a view call at block N" need. Brevis's coprocessor is the largest by claimed proof count. Herodotus offers storage proofs and a Cairo-based data processor. Space and Time's Proof of SQL is a GPU SQL prover whose EVM verifier is still on its roadmap.

### Cited Findings
- **Axiom**: the homepage now lists only OpenVM and the Axiom Proving API, with no coprocessor product. Its timeline runs OpenVM intro (Dec 2024) → production (Mar 2025) → Proving API private beta (May 13, 2025) → GPU proving (Sep 2, 2025) → OpenVM 2.0/2.1 (2026). — [axiom.xyz](https://www.axiom.xyz/)
- **Brevis**: claims more than 250M proofs and 30+ partners (Uniswap, PancakeSwap and others) for its ZK Data Coprocessor and Pico (vendor, Dec 2025). — [CryptoSlate press release](https://cryptoslate.com/press-releases/brevis-launches-provernet-mainnet-beta-the-first-decentralized-zk-proving-marketplace-on-chain/)
- **Herodotus**: Storage Proofs combine inclusion proofs with proofs of computation. A Storage Proof API needs no circuit writing. "Turbo" is a contract interface. Access directions are L1→L2, L2→L1/L2 and L3→L2/L1. — [Herodotus docs](https://docs.herodotus.dev). The Data Processor (HDP) verifies storage proofs inside a zkVM and runs Cairo 1 modules (for example TWAP or average balance over a block range). It delivers results to contracts or as a raw STARK. — [Herodotus HDP docs](https://docs.herodotus.dev/herodotus-docs/developers/data-processor)
- **Space and Time Proof of SQL**: "sub-second ZK prover" for analytic queries over 1M+ rows. Its Hello World example takes about 467 ms to prove and about 7 ms to verify on a GPU. Supported SQL is SELECT/WHERE/GROUP BY/SUM/COUNT. JOINs and subqueries are on the roadmap, and so is an **EVM (Solidity) verifier**. It is still "undergoing security audits". — [sxt-proof-of-sql GitHub](https://github.com/spaceandtimelabs/sxt-proof-of-sql)
- **Boundless Steel**: proven Solidity view calls without gas limits (May 2025). **The Signal**: open-source ZK Ethereum consensus client (Jul 2025). Wormhole uses a ZK consensus-proof path (Aug 2025). — [Boundless blog](https://boundlessfdn.org/blog/)
- **Succinct**: ZK verification for Chainlink CCIP 2.0 (Sep 28, 2026) and Base deposit proofs (May 2026). — [Succinct blog](https://blog.succinct.xyz/)

### Inferences
- For resolvers that depend on on-chain facts ("did contract X hold ≥Y at block N", "did event E occur on chain C before the deadline"), the cheapest route is to put the state read inside the same zkVM resolver: Steel-style view-call proof plus block-hash commitment checked against `BLOCKHASH`/EIP-2935 history or a ZK light client. That avoids a separate coprocessor dependency, and one proof covers both state access and resolver logic.
- Axiom's pivot means "Axiom V2 coprocessor" should not be designed against. This is inferred from its absence on the current homepage; no explicit deprecation notice was found.

### Gaps
- Lagrange State Committees and the Lagrange ZK Coprocessor: 2026 status unknown (lagrange.dev blocked fetches with 403).
- No concrete 2026 latency or $ figures for Brevis or Herodotus queries.
- Whether Space and Time's SXT chain or EVM verifier shipped by Oct 2026: not confirmed.

---

## 4. Verifiable AI inference (zkML, opML, deterministic re-execution, TEEs): what is provable, at what cost, and can an LLM judge be a credible resolver?

### Takeaway
Full zk proofs of LLM inference exist only for small models. DeepProve proves GPT-2 at about 174 tokens/min and Gemma 3 at about 86 tokens/min (CCS 2026, vendor-authored), so zk-proving a frontier-class judge is not practical in 2026. The credible 2026 pattern for an LLM-judge resolver has three parts: a pinned open-weights model; bit-exact deterministic inference (EigenAI, or Gensyn REE/RepOps); and optimistic re-execution with bonded challengers, optionally behind TEE attestation as a fast path. Gensyn's Delphi has been live since May 2026 with AI-settled markets and is direct prior art. TEE attestations alone are a weaker trust anchor after TEE.fail (Oct 2025) showed that a <$1k DDR5 interposer can extract attestation keys and break NVIDIA GPU confidential-computing attestation.

### Cited Findings

**zkML**
- **DeepProve (Lagrange) [open-source; production claims]**: ePrint 2026/1112 (CCS 2026) gives about 174 tokens/min for GPT-2 and about 86 tokens/min for Gemma 3, up to 1,855 tokens/min distributed, 1–3.7 s verification, and "20–60× faster than state of the art". It proves the correctness of the output sequence. — [ePrint 2026/1112](https://eprint.iacr.org/2026/1112). Vendor claims: 12M+ proofs and 3M+ inferences verified "over the past year". The repo lists GPT-2, Gemma 3 and Llama 2 as "confirmed working", and the product page shows Llama-3 8B/70B entries. — [Lagrange open-source post](https://lagrange.dev/blog/deepprove-is-now-open-source), [deep-prove GitHub](https://github.com/Lagrange-Labs/deep-prove), [DeepProve-1 blog](https://lagrange.dev/blog/deepprove-1)
- Independent framing: "GPT-2 class proven, frontier models not yet". — [hoge.gg zkML toolchain 2026](https://hoge.gg/zkml-toolchain-2026-which-proving-system-ships/). "Independent reproduction is limited" for DeepProve's Llama-3 8B/70B claims. — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- zkML proof generation is roughly 1000× the cost of the underlying compute (secondary claim). — [BlockEden on Gensyn Judge](https://blockeden.xyz/blog/2026/04/29/gensyn-judge-decentralized-verifiable-ai-evaluation-deai-quality-layer/)
- **EZKL [maintained]**: Halo2 backend, EVM verifier generation, Icicle GPU acceleration. v21.0.0 was audited by Trail of Bits. Quantization means outputs differ slightly from Python. — [EZKL GitHub](https://github.com/zkonduit/ezkl)

**Deterministic inference plus optimistic verification**
- **EigenAI (EigenCloud) [company says mainnet; paper Jan 30, 2026]**:
  - Bit-exact LLM inference on fixed GPU SKUs (H100/GH200) via custom GEMM/reduction kernels, no FP atomics, pinned CUDA 12.4/R550, digest-pinned containers, ECC on and a fixed-seed PRNG. Built on llama.cpp with Q4/Q5 quantization.
  - Overhead is 1.8% end-to-end latency and 2.4% for deterministic GEMM, with 100% reproducibility over 10,000 runs.
  - Operators post encrypted logs to EigenDA. During a challenge window Δ, a stake-weighted committee re-executes inside attested TEEs and votes by byte equality (τ = 2/3). Mismatches slash EigenLayer stake.
  - Limits: all operators and verifiers must use identical GPU SKUs (A100 vs H100 matched 0%), some cuBLAS paths are closed-source, and tool-calling agents need transcript recording (future work).
  - The paper explicitly names prediction-market adjudicators and dispute resolution as use cases.
  - Sources: [EigenAI paper](https://arxiv.org/html/2602.00182v1), [EigenCloud blog](https://blog.eigencloud.xyz/deterministic-ai-inference-eigenai/)
- **Gensyn [mainnet live]**:
  - REE (Mar 17, 2026): a containerized inference runtime whose receipt binds (model, prompt, config) to the output. RepOps fixes reduction order and uses correctly rounded math to give cross-hardware reproducibility. 40+ open models are supported. Verification is by independent re-execution. The receipt does not show that the prompt or model is "correct". — [Gensyn REE](https://www.gensyn.ai/news/ree)
  - **Delphi** (May 7, 2026) is "live on Gensyn Mainnet". It is an information market where outcomes are "settled by AI", with three settlement tiers: curated foundation models (no receipts); REE open-source models with re-runnable receipts; and hosted REE. Creators write settlement prompts from templates. Each market is its own non-upgradeable contract, audited by Trail of Bits. Pricing is dynamic pari-mutuel (not LMSR). Contracts treat agents and humans identically, and there is an Agent SDK. **No formal dispute process is described.** — [Building Delphi](https://www.gensyn.ai/news/building-delphi-pricing-settlement-and-agentic-trading), [Gensyn news](https://www.gensyn.ai/news)
  - Judge (announced Aug 27, 2025; production launch reported late Apr 2026, secondary) is built on Verde refereed delegation: on divergence, binary search over the compute graph to the first differing operator. It verifies that an evaluation ran reproducibly, not that the benchmark is meaningful, and redundancy and dispute economics are "unproven". — [BlockEden on Judge](https://blockeden.xyz/blog/2026/04/29/gensyn-judge-decentralized-verifiable-ai-evaluation-deai-quality-layer/), [Gensyn testnet page (search snippet)](https://www.gensyn.ai/testnet)
- **Hyperbolic Proof of Sampling (PoSP/spML)**: a randomized spot-check mechanism with a claimed pure-strategy Nash equilibrium for honesty, "much more efficient than ZK"; latest revision May 31, 2025. — [arXiv 2405.00295](https://arxiv.org/abs/2405.00295)
- Ambient's "Proof-of-Logits" reportedly has about 0.1% overhead on a 600B+ parameter model (secondary, unverified). — [BlockEden](https://blockeden.xyz/blog/2026/04/29/gensyn-judge-decentralized-verifiable-ai-evaluation-deai-quality-layer/)

**TEE-based inference**
- **Phala Confidential AI [MAINNET, commercial]**: H200 at $4.40/GPU-hr and B300 at $8.20/GPU-hr (Intel TDX + NVIDIA CC). It serves 12 confidential models via OpenAI-compatible endpoints (DeepSeek V4.x, GLM 5.x, Qwen3.x, Kimi K3, Gemma 4) with 125.3B confidential tokens/day on 2026-10-20 (OpenRouter chart). It quotes roughly 5–10% TEE overhead and is SOC 2 Type I. **No on-chain attestation verification is mentioned.** — [phala.com](https://phala.com/)
- **TEE.fail (Oct 2025)**: an under-$1,000 DDR5 bus interposer, with physical access plus root, extracts keys, including attestation keys, from fully updated Intel TDX and AMD SEV-SNP machines. "As CVMs are used for the trust anchor in Nvidia's GPU confidential computing, we show how our attack also breaks GPU attestation." Vendors consider physical attacks out of scope. Earlier attacks (WireTap, Battering RAM) hit DDR4. — [The Hacker News](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)

**Stalled, pivoted or unclear**
- **ORA [PIVOTED]**: the site is now "ORA — Optimized Return Agents" (AI funds, a "World Cup" leaderboard), and docs.ora.io did not resolve on Oct 21, 2026. The opML/on-chain AI oracle product is no longer presented. — [ora.io](https://www.ora.io/)
- **Ritual [no mainnet evidence]**: the testnet launched in 2024. — [The Block](https://www.theblock.co/amp/post/327108/decentralized-ai-project-ritual-launches-testnet-to-bring-ai-onchain). The 2025–26 blog consists of research posts: "Introducing Ritual Chain" (Feb 2025), "Privacy-Preserving Mechanisms Enable Cheap Verifiable Inference of LLMs" (Feb 2026), and "Symphony" consensus (Apr 2026). No mainnet or Infernet production announcement was found. — [Ritual blog](https://ritual.net/blog)

### Inferences
- **Can an LLM judge be a credible resolver? Yes, but credibility comes from determinism and disputes, not proofs.** Practical recipe:
  1. The resolver spec pins the weights hash, tokenizer, quantization, prompt template, decoding params and seed, and runtime image digest (and the GPU SKU if EigenAI-style).
  2. An asserter posts the verdict with a bond.
  3. Anyone can re-execute and challenge within a window.
  4. Disputes go to byte-equality re-execution (an EigenAI committee, Verde bisection to the first divergent operator, or a small zkML proof if the judge is GPT-2 or classifier scale).
- **Remaining attack surface is semantic, not computational.** A deterministic judge is still manipulable through prompt injection embedded in the taker's submitted artifact, ambiguous criteria, or leaked tests. Gensyn's own caveat applies: the receipt proves the run, not the truth.
- **zkML is viable for narrow judges.** A distilled classifier or reward model in the ≤100M-parameter class (GPT-2 is about 124M) proven with DeepProve or EZKL could be a fully trustless "model output satisfies X" resolver. At about 174 tokens/min for GPT-2, a 200-token judgement proves in roughly a minute on the paper's (unspecified) hardware.
- **TEE attestation should be a fast-path liveness optimization, not the root of trust.** The physical-access threat model is exactly the one a malicious GPU operator in a permissionless market can satisfy.
- **Delphi is the closest existing analogue to the user's protocol** for AI-judged outcomes. Its lack of a formal dispute mechanism is a gap the user's design could fill.

### Gaps
- No primary 2026 status found for Giza, Modulus Labs, Inference Labs (Omron/DSperse), Atoma or Hyperbolic's production PoSP. These could be stalled or pivoted; verify before citing.
- EigenAI's mainnet claim and challenge-window length were not verified from a primary deployment page. The paper does not specify Δ.
- DeepProve hardware, proof sizes and EVM verification gas were not found in the material fetched.
- No primary source showing on-chain verification of NVIDIA GPU attestation reports in production (some projects reportedly do this; unverified).

---

## 5. Optimistic and interactive verification: BoLD, Cartesi, Truebit, BitVM, OP Cannon/Kona, and is "optimistic resolver plus fraud-proof dispute" cheaper than ZK?

### Takeaway
Interactive fraud proofs are mature for rollups but slow (Arbitrum BoLD: 7-day window, up to 14 days with a last-second dispute) and capital-heavy (3,600 ETH assertion bond on Arbitrum One). Cartesi's PRT can run full RISC-V Linux workloads and is Stage 2 on L2BEAT, though it had a liveness freeze in Oct 2025. Truebit, the original general-purpose interactive-verification project, is effectively dead after a $26M exploit in Jan 2026. The 2025–26 trend is the **hybrid**: optimistic by default, with disputes settled by a single ZK proof (Kailua hybrid mode, now archived; Boundless For Rollups; OP choosing Succinct). For resolvers that a zkVM can prove for under about $1–$100, this hybrid beats pure bisection on both latency (about 1 hour versus days) and complexity. Pure interactive disputes remain the answer only for workloads a zkVM cannot run, such as a full Linux userland or closed binaries (Cartesi).

### Cited Findings
- **Arbitrum BoLD [MAINNET since Feb 2025]**: live on Arbitrum One and Nova. — [The Block](https://www.theblock.co/post/340278/offchain-labs-releases-arbitrum-bold-on-mainnet-for-permissionless-validation)
  - Bonds: 3,600 ETH assertion bond, plus challenge bonds of 555 WETH (big-step) and 79 WETH (small-step).
  - Resource ratio 6.46 (attacker spends $6.46 per $1 for the defender, at 500 gwei worst case).
  - 7-day dispute window, up to 14 days of delay. Disagreement key space up to 2^69.
  - Defenders get a 1% bounty from confiscated bonds, and their gas is refundable by the Foundation.
  - Source: [Arbitrum docs: BoLD economics](https://docs.arbitrum.io/how-arbitrum-works/bold/bold-economics-of-disputes)
  - Bootstrapping the first honest validator required 4,234 ETH from the DAO. — [Arbitrum forum](https://forum.arbitrum.foundation/t/aip-funds-to-bootstrap-the-first-bold-validator/24506)
- **OP Stack fault proofs [MAINNET since Jun 10, 2024]**: Cannon was the initial proof system. Max game depth is 73. Bonds escalate (about 0.08 ETH initial, roughly 14 ETH over 7 days on OP Mainnet params), are held in DelayedWETH, and there is a Security Council backstop. A "multi-proof" design is planned. — [Optimism docs](https://docs.optimism.io/stack/fault-proofs/explainer). Optimism chose Succinct for ZK on the Superchain (Feb 12, 2026). — [Succinct blog](https://blog.succinct.xyz/)
- **ZK fraud proofs (hybrid)**: Kailua hybrid mode needed constant collateral (versus linear in the Cannon bisection game), and the loser pays proving. Worst case was about 100B cycles, about $100 and about 1 h. The repo is now **archived**. — [Kailua GitHub](https://github.com/boundless-xyz/kailua). Boundless For Rollups (Jan 2026) offers "ZK Fault Proof" mode and cuts finality "from seven days to hours". — [Boundless blog](https://boundlessfdn.org/blog/)
- **Cartesi PRT/Dave [MAINNET, Stage 2]**:
  - PRT bisects a computation hash (Merkle over state transitions), moving from sparse to dense hashes until a one-step on-chain state transition settles it.
  - Tournaments eliminate half of the claims each round. The honest party needs one bond, and its work grows logarithmically in the number of Sybils, with settlement time about log² in Sybils. — [Cartesi PRT docs](https://docs.cartesi.io/fraud-proofs/prt/prt-introduction/)
  - Honeypot v2 holds 50,000 CTSI, is unbroken as of Mar 2026, and helped Cartesi reach L2BEAT Stage 2. — [Cartesi Mar 2026 update](https://cartesi.io/blog/ecosystem-updates-march-2026/)
  - An Oct 2025 liveness bug froze the PRT dispute game. Safety held and a fix plus re-audit followed. — [Cartesi postmortem](https://cartesi.io/blog/prt_honeypot_postmortem)
  - A PRT bond mechanism was implemented in 2025. — [Cartesi 2025 recap](https://cartesi.io/blog/goodbye_2025)
- **Truebit [DEAD]**: on Jan 8, 2026, about 8,535 ETH (~$26M) was drained via an integer overflow in a 2021 Solidity <0.8 pricing contract (`getPurchasePrice` returned 0, enabling free mint-and-burn). TRU fell about 99.9%. — [The Block](https://www.theblock.co/post/384861/truebit-26-million-exploit), [Halborn](https://www.halborn.com/blog/post/explained-the-truebit-hack-january-2026)
- **BitVM2**:
  - Citrea's ZK rollup has been on mainnet since Jan 27, 2026, with the Clementine BitVM2 bridge (1-of-N honest challenger, operator collateral slashable). — [Spark research](https://www.spark.money/research/citrea-zk-rollup-bitcoin-layer-2)
  - Citrea uses Boundless for proving. — [Boundless blog](https://boundlessfdn.org/blog/)
  - A worst-case on-chain fraud proof on Bitcoin costs about $16,000. — [Blockworks](https://blockworks.com/news/bitvm3-promises-cheaper-bitcoin-bridges)
  - A full BitVM2 challenge was verified on Bitcoin mainnet. — [ePrint 2025/1158](https://eprint.iacr.org/2025/1158)
  - Bitlayer's BitVM bridge was reportedly discontinued Jun 3, 2026 (single source, unverified). — [Phemex](https://phemex.com/academy/what-is-bitvm-smart-contracts-on-bitcoin)
- **EigenAI** is itself an optimistic re-execution system for LLMs (Section 4). — [EigenAI paper](https://arxiv.org/html/2602.00182v1)

### Inferences
- **Recommended dispute design for heavy resolvers: "assert → bond → challenge → one ZK proof".**
  1. The winning side asserts the resolver's output with a bond.
  2. A challenger counter-bonds.
  3. The contract posts a Boundless request (image = resolver, input = committed data) with a callback.
  4. The proof's journal decides, and the loser's bond pays the proving fee plus a bounty.
- **Cost of the hybrid.** In the common no-dispute case, proving cost is 0. In a dispute it is cents to about $100. Latency is the challenge window plus about 1 hour. This avoids BoLD-style multi-round bisection, which needs a 7–14 day worst case and large bonds.
- **When pure fraud proofs are still worth it.** Use them only if the resolver must run something zkVMs cannot (full Linux, JIT runtimes, closed x86 binaries, GPU inference). Cartesi PRT is the only shipped general-purpose option for full Linux. Its dispute latency is days and the honest party must be online and able to re-run the whole computation.
- **Bond sizing.** Bonds should scale with the contract stake. The BoLD analysis gives a ready framework: resource ratio and delay-attack opportunity cost.
- **Truebit and Kailua as lessons.** Truebit shows that the verification game can be sound while auxiliary token contracts kill the project. Kailua shows how quickly tooling can be abandoned. Both argue for minimal custom dispute logic sitting on maintained, shared verifier contracts.

### Gaps
- No primary 2026 data on Kona/Asterisc deployment status on OP Mainnet.
- No primary source for Cartesi PRT dispute duration in days, or per-step gas.
- No information found on generic "optimistic coprocessors" in production beyond EigenAI and Gensyn.

---

## 6. Proofs of exploit / ZK proofs of vulnerability

### Takeaway
"Prove a bug exists without revealing it" has moved from a 24-hour, designated-verifier academic demo (Cheesecloth, Heartbleed, 2023) to commodity zkVM territory. The work comes from three directions: zkpoex (RISC Zero plus a Rust EVM, alpha) for Solidity exploits; Google's Mar 2026 use of SP1 to prove a secret quantum-cryptanalysis circuit; and AI auditors finding real soundness bugs in proof systems (Axiom, stwo, Jun 2026). The decisive caveat is that Trail of Bits forged a "better" Google proof by exploiting bugs in the guest program (`unsafe` deserialization and register aliasing). The resolver/harness is the attack surface, not the proof system.

### Cited Findings
- **zkpoex [ALPHA/RESEARCH]**: a Rust toolkit that replays a malicious transaction in a Rust EVM inside the RISC Zero zkVM. The statement is "I know calldata that, from a valid initial state, violates the project's spec (for example, totalSupply = Σ balances)". On-chain verification triggers an automatic bounty or pause. Exploit encryption to the project key is "under research" (heavy overhead). The v0.1.0 alpha uses Bonsai for proving, but the post says local proving is needed to avoid leaking the exploit. "Missing condition" claims cannot be auto-paid, and Kleros-style disputes are proposed. It won ETHDenver 2023 and the post is dated Apr 18, 2025. — [zkpoex blog](https://ziemann.me/zkpoex/), [zkpoex GitHub](https://github.com/ziemen4/zkpoex). An ACM paper: "A Framework for Zero-Knowledge Proofs of Exploits in Solidity Smart Contracts". — [ACM DOI 10.1145/3748522.3779811](https://doi.org/10.1145/3748522.3779811) (abstract not retrievable, 403)
- **Cheesecloth (Galois et al., USENIX Security 2023)**: a compiler for ZK proofs of real vulnerabilities in C/C++/Rust via MicroRAM, with memory-safety encoding that tracks only the buggy location (nondeterministic malloc chosen by the prover). The backend is **Diet Mac'n'Cheese (Swanky), an interactive designated-verifier protocol**, so the proofs are not publicly verifiable on-chain. Results:

  | Target | Code | Steps | Mult gates | Time | Communication |
  |---|---|---|---|---|---|
  | GRIT | 3K instrs | 5K | 324M | 2m42s | 416 MB |
  | FFmpeg (gif OOB write) | 24K instrs | 79K | 8.4B | 1h10m | 10 GB |
  | OpenSSL Heartbleed (leak) | 340K instrs | 1.3M | 159.7B | 23h41m | 203 GB |

  Source: [USENIX paper PDF](https://www.usenix.org/system/files/usenixsecurity23-cuellar.pdf), [arXiv 2301.01321](https://arxiv.org/abs/2301.01321)
- **Google Quantum AI × SP1 (Mar 31, 2026)**: Google used SP1 to prove that a secret quantum circuit (private input, a Rust simulator as guest, checked on 9,024 random inputs) performs EC point addition within public resource bounds (≤17M ops, 1,175–1,425 qubits). — [Succinct blog](https://blog.succinct.xyz/), [Trail of Bits](https://blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/)
- **Trail of Bits forgery (Apr 17, 2026)**: a valid proof under Google's unpatched verification key claiming 8.3M ops, 1,164 qubits and 0 Toffolis. It exploited (1) `rkyv::access_unchecked` on untrusted bytes, where an out-of-range op type skipped the Toffoli counter, and (2) a CCX target aliasing its controls. The bugs were found by reverse-engineering the RISC-V guest ELF in Ghidra. Lessons drawn: "a valid proof only shows the program ran", attacker-controlled witnesses need strict validation, and publishing the guest is what made auditing possible. Google patched the guest. — [Trail of Bits](https://blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/)
- **AI finding proof-system bugs**: Axiom's multi-agent AI auditor autonomously found the stwo-cairo Fiat–Shamir soundness bug, validated it with a PoC and got a bounty (Jun 2026). — [Axiom](https://axiom.xyz/blog/stwo-bug). Succinct: "An Experiment in Formal Verification with Claude" (May 20, 2026). — [Succinct blog](https://blog.succinct.xyz/)
- **DARPA AIxCC (final Aug 2025, DEF CON 33)**: Team Atlanta won $4M. Finalists found 54 synthetic vulnerabilities and patched 43, and found 18 real non-synthetic vulnerabilities with 11 viable patches. All 7 CRSs were to be open-sourced, with ARPA-H committing $20M for follow-on. — [DARPA](https://www.darpa.mil/news/2025/aixcc-results), [MeriTalk](https://www.meritalk.com/?p=200433), [Healthcare IT News](https://www.healthcareitnews.com/news/now-available-ai-finds-and-provides-autonomous-patching-scale). The released CRSs were "largely unusable" outside the competition infrastructure. OSS-CRS (GT and Microsoft, Mar 2026) ported Atlantis and found 10 new bugs (3 high-severity) in 8 OSS-Fuzz projects. — [OSS-CRS arXiv 2603.08566](https://arxiv.org/abs/2603.08566). An SoK of AIxCC architectures also exists. — [arXiv 2602.07666](https://arxiv.org/pdf/2602.07666)

### Inferences
- **Feasibility jump.** Heartbleed-scale proofs of vulnerability (about 1.3M execution steps) took about 24 h and 203 GB of interactive communication in 2023. Today's production zkVMs prove whole Ethereum blocks in about 5–10 s on 4 GPUs, and research zkVMs (Magnetar) prove 4.2M-cycle runs in about 0.5 s on a laptop. A non-interactive, publicly verifiable, EVM-checkable proof that "input X makes program P hit a memory-safety violation" is now plausibly seconds to minutes and cents to dollars. MicroRAM steps and RISC-V cycles differ, so this is an order-of-magnitude comparison.
- **Protocol mapping.** The AIxCC "proof of vulnerability" (PoV) blob is exactly the private witness the user's taker agents would hold. OSS-CRS-style systems are the natural off-chain "fuzzer/solver" layer, and a zkVM replay of the PoV under a sanitizer-instrumented harness is the on-chain resolver.
- **The resolver is the attack surface.**
  - Any `unsafe`, unchecked deserialization or unvalidated witness parsing in the resolver lets a taker "prove" false claims. That is the exact Trail of Bits pattern, found by Ghidra on the guest ELF.
  - Posters must publish resolver source with a reproducible build that matches the image ID (SP1 warns builds are not reproducible by default).
  - The protocol should encourage adversarial review of resolvers before stakes lock, for example a resolver-audit bounty market.
- **Secrecy versus delegated proving.** Sending the exploit witness to a proof market leaks it to the prover. Secret-exploit markets need local proving, or a future private-proving mode (not verified to exist).

### Gaps
- Could not retrieve the ACM zkpoex framework paper's abstract, authors or numbers (403).
- No evidence found of a production "proof of exploit" bounty platform paying out on-chain. Immunefi-style platforms appear to remain manual (no primary source checked).
- No public benchmark of proving a sanitizer-instrumented C crash replay in SP1/RISC Zero/OpenVM.

---

## 7. What is genuinely new in 2025–2026 that makes this design possible now, and what non-obvious compositions and hard limits follow

### Takeaway
Six things changed since late 2024:
1. Proving cost and latency for general RISC-V programs fell 15–45× in a year, and real-time proving became routine.
2. Open, on-chain proof markets with collateral and slashing went live (Boundless Sep 2025, Succinct Aug 2025, Brevis Dec 2025).
3. zkVMs gained formal verification and 100-bit provable-security baselines.
4. Bit-exact deterministic GPU inference (EigenAI, Gensyn REE/RepOps) made optimistic LLM judges re-executable, and AI-settled markets shipped (Delphi, May 2026).
5. AI agents demonstrably find real bugs, including in proof systems themselves.
6. Proofs of secret capability went mainstream (Google/SP1).

The hard limits are:
- Only existential (NP-style) claims are provable cheaply.
- Resolver and guest bugs and zkVM soundness bugs are the dominant risk.
- LLM judges are deterministic but not truthful.
- TEEs are not a trust root against operators with physical access.

### Cited Findings
- Proof cost per Ethereum block fell from $1.69 (Jan 2025) to under $0.01 (Dec 2025), and single-GPU proving from 16 min to under 60 s. — [Ethproofs review](https://hackmd.io/@willcorcoran/S1A840ZMZg). The reduction was about 45× in a year. — [Wavect](https://wavect.io/blog/zero-knowledge-proofs-production-2026/)
- SP1 Hypercube mainnet (Feb 2026), OpenVM 2.0 production (Jul 2026), and OpenVM 2.1 at P99 9.7 s on 4× 5090 (Jul 2026). — [Succinct blog](https://blog.succinct.xyz/), [Axiom](https://axiom.xyz/blog/2-1)
- Formally verified RV32IM (Feb 2026) and Keccak/SHA-2 circuits (Aug 2026) for OpenVM. — [Axiom blog](https://axiom.xyz/blog/)
- Proof markets with on-chain collateral and slashing: [Boundless](https://docs.boundless.network/developers/proof-lifecycle), [Succinct](https://docs.succinct.xyz/docs/provers/how-it-works/overview), [Brevis](https://cryptoslate.com/press-releases/brevis-launches-provernet-mainnet-beta-the-first-decentralized-zk-proving-marketplace-on-chain/)
- Deterministic LLM inference at 1.8% overhead, with prediction-market adjudication named as a use case. — [EigenAI](https://arxiv.org/html/2602.00182v1). AI-settled markets live on Gensyn mainnet. — [Gensyn Delphi](https://www.gensyn.ai/news/building-delphi-pricing-settlement-and-agentic-trading)
- LLM-scale zkML (GPT-2, Gemma 3) accepted at CCS 2026. — [ePrint 2026/1112](https://eprint.iacr.org/2026/1112)
- Post-quantum, hash-only zkVMs with order-of-magnitude speedups are appearing in research (Magnetar, Oct 2026). — [Magnetar](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/10/magnetar-1.pdf)
- AI-found bugs: AIxCC ([DARPA](https://www.darpa.mil/news/2025/aixcc-results)), OSS-CRS ([arXiv](https://arxiv.org/abs/2603.08566)), Axiom AI auditor on stwo ([Axiom](https://axiom.xyz/blog/stwo-bug))
- Proof of secret capability: Google/SP1 quantum ECDLP circuit, and its forgery via guest bugs. — [Trail of Bits](https://blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/)
- Confidential GPU inference at scale (125.3B tokens/day on Phala) alongside the TEE.fail attestation break. — [Phala](https://phala.com/), [The Hacker News](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)

### Inferences: non-obvious compositions

1. **The asymmetric "bounty-shaped" contract encodes universal claims.** ZK can only cheaply prove "∃ witness". Encode "this program never crashes on any input" as a poster bet on NO-CRASH-BY-DEADLINE, where the taker wins only by submitting a crash proof. If no proof arrives by the deadline, the poster wins by default. Market odds then price the residual bug probability: an on-chain, agent-traded "bug likelihood" signal per binary.

2. **Sanitizer-in-zkVM resolvers.** Compile the target plus a fuzz harness to rv32im/rv64 with bounds and lifetime checks (ASan-like, or Cheesecloth-style malloc tracking). The journal is `(binary_hash, crash_kind, pc)` and never the input. Off-chain search uses AIxCC/OSS-CRS agents, and on-chain cost is a single replay proof. The image ID binds the exact binary, so posters cannot swap the target.

3. **Hidden-test resolvers by commit-and-reveal plus proof.**
   - The poster commits `H(tests || salt)` at creation.
   - At the deadline the poster must either reveal the tests, in which case anyone (or a Boundless request) proves "code C passes or fails the tests matching H", or prove the result themselves with tests as private input and H public.
   - Failure to act by a reveal deadline forfeits.
   - This keeps tests secret during the trading window (no overfitting by takers) and needs no TEE.

4. **Optimistic-by-default, ZK-on-dispute.** Kailua-style: the asserter bonds, the challenger bonds, and the dispute is resolved by one Boundless request with a callback; the loser pays. This gives near-zero cost in the common case and about 1 h dispute resolution, with no bisection game to build. It reuses a maintained verifier router (Kailua's archival is the cautionary tale about bespoke tooling).

5. **Layered LLM-judge resolver.**
   - Fast path: TEE-attested inference (Phala-class) returns a verdict.
   - Optimistic window: anyone re-executes on a deterministic runtime (EigenAI pinned SKU, or Gensyn REE cross-hardware) and challenges.
   - Final arbiter: a byte-equality committee or Verde bisection. For small judges (≤ GPT-2 class), an outright DeepProve/EZKL proof.
   - Pin model hash, prompt, seed and runtime digest in the contract.

6. **State-aware resolvers in a single proof.** Run Steel-style EVM view calls (historical state) plus arbitrary Rust logic in the same guest, for example "did protocol X's invariant break at any block in [N, M]". This turns on-chain history into resolver input without a separate coprocessor or oracle.

7. **Multi-zkVM "k-of-n" verification for high-stakes markets.** Require proofs of the same Rust resolver from two independent zkVMs (for example SP1 and OpenVM, both production). Gas roughly doubles to about 540k, but a single-zkVM soundness bug can no longer drain the protocol (precedents: RISC Zero bounty, Jolt May 2026, stwo Jun 2026).

8. **A meta-market on resolver correctness.** Because the Trail of Bits forgery came from guest bugs, let agents bet on or bounty "this resolver image can be made to output true on a false claim". Proof: a valid proof with a journal contradicting a reference re-execution or spec. AI auditors (Axiom-style) are natural participants.

9. **Proof markets as compute oracles for agents.** Boundless's journal predicate and callback let a contract outsource any deterministic computation and pay only on a verified result. Agents can use this as "verifiable cloud" to settle sub-bets mid-contract, for example intermediate milestones.

10. **Secret-capability contracts.** In the Google/SP1 pattern, a taker proves "I possess an artifact with property Φ" (an exploit, a faster algorithm, a model hitting a score on a committed test set) without revealing it. Payout releases on proof, and the artifact is optionally escrowed via verifiable encryption to the poster (research-grade overhead per zkpoex).

### Inferences: hard limits
- **Expressiveness.** Universal or negative claims, "best possible" claims and non-deterministic computations (GPU float without RepOps-style determinism, network I/O, wall-clock time) cannot be proven directly. They must be restated as existential witnesses, committed data, or optimistic re-execution.
- **Witness leakage.** Outsourced proving reveals the witness to the prover. Exploit markets need local proving (GPU capex), and this conflicts with "agents rent proving".
- **Soundness surface.**
  - Production zkVMs claim about 100 bits of security, not 128.
  - Soundness bugs keep surfacing (RISC Zero, Jolt, stwo, Zcash Orchard).
  - Groth16 relies on trusted setups (SP1 uses Aztec Ignition plus Succinct contributions).
  - Guest and resolver bugs are the most likely failure.
- **Reproducibility.** Image IDs commit to ELF bytes, but builds are not reproducible by default (SP1 docs). Posters must publish a Docker-pinned build for takers to audit.
- **LLM-judge semantics.** Determinism proves "this model said this", not "this is true". Prompt injection inside submitted artifacts and judge-specific adversarial examples are first-class attacks in a market of AI takers.
- **TEE trust.** Physical-access attacks (TEE.fail) defeat the GPU attestation chain, and vendors consider this out of scope.
- **Latency.** zkVM proofs take seconds to minutes; optimistic disputes take hours to days (Kailua-style about 1 h; BoLD-style 7–14 d). Deadlines and settlement windows must be designed around these, not around block times.

### Gaps
- No source found quantifying soft-float or memory-heavy program costs in zkVMs. These matter for porting real-world C targets with fuzz harnesses.
- No existing protocol was found that combines AIxCC-style automated PoV generation with on-chain ZK settlement. This appears to be an open design space, but absence of evidence was not exhaustively checked because the search budget was exhausted.
