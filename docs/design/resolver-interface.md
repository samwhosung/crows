# Resolver interface sketch (v0)

Draft, 2026-10-21. **Note (2026-10-22, decision 0011):** §3.4's own kernel is obsolete. Escrow is Uniswap's The Compact and crows is its arbiter; §3.1's resolver interface is kept. Built from reading four contract sets and one standard:

- Sapience `PredictionMarketEscrow` (commit `fcc6b6d`)
- Opium v2 `Core` / `OracleAggregator`
- Ante v0.6 `AntePool`
- Reckn `RecknZkEscrow`
- ERC-8183

Target: EVM (Base first). The shapes map onto Solana/Anchor later.

---

## 1. What each reference gets right (and what to change)

| Reference | Pattern worth keeping | What to change |
|---|---|---|
| **Sapience** | Each pick names a resolver address plus an opaque `bytes conditionId`. Market identity is `pickConfigId = keccak(canonical picks)`, so equal markets share liquidity. Both sides receive `totalCollateral` claim tokens, so the odds are baked into the token amounts and positions stay fungible. Bilateral `burn` for early exit. Resolver calls are `view`, wrapped in try/catch with a gas cap (500k). | Identity is keyed on the resolver **address**, not its code, so the same logic at two addresses splits liquidity. `isFinalized` exists on the interface, but the escrow never reads it. There is no refund path if a resolver never answers. `[0,0]` means both "unresolved" and "invalid". Ties always go to the counterparty. Binary only. |
| **Opium** | `Derivative{margin, endTime, params[], oracleId, token, syntheticId}`, hashed into `derivativeHash`, which is the cleanest "spec → identity" pattern. **Data is separated from logic**: the oracle pushes a write-once value keyed by `(oracle, timestamp)`, and the payout logic turns it into a `(buyer, seller)` payout ratio. Payouts are continuous, not just binary. Margin is cached the first time it is read. After `endTime + noDataCancellationPeriod` with no data, positions are refunded. | `uint256` is the only data type. Third-party execution needs the position owner's opt-in. Protocol parameters are admin-set. |
| **Ante** | **Resolution that carries a witness**: `setStateAndCheckTestPasses(bytes state)` means whoever triggers resolution supplies the input that the check evaluates. The witness has a machine-readable schema (`getStateTypes()` / `getStateNames()`). A fixed 12-block delay separates taking a position from triggering. Whoever triggers resolution earns 5% of the pool. | Pools never end; there is no deadline. One outcome direction only. Each check is a separate contract with a mutable author. |
| **Reckn** | **Pins the verifier's codehash** when funded and re-checks it at settlement. The verifier call is a STATICCALL. The proof's public values must carry a `dealBinding` equal to what the deal committed, so a proof can only settle the deal it was made for. The refund timeout is a protocol constant, not a parameter anyone sets. An EVM re-executed inside the guest against a Merkle-proven prestate costs about 407k SP1 cycles for a simple transaction, which shows "facts about chain state" are cheap to prove. | One-sided (buyer/seller). A pinned codehash doesn't stop the code from reading storage that something else can change. |
| **ERC-8183** | `createJob → fund → submit → complete/reject`, plus `claimRefund` after `expiredAt` that anyone may call. Hooks on every action. | One evaluator decides alone. One-sided. No disputes. Useful as an **output adapter**, not as the core. |

The design below combines these:

- **Opium:** derivative-hash identity, the data/logic split, the no-data refund.
- **Sapience:** odds-in-amount fungible positions, bilateral exit, gas-capped calls.
- **Ante:** witness-carrying resolution, the witness schema, the trigger reward.
- **Reckn:** codehash pinning, binding the proof to the market, the fixed timeout.

---

## 2. Core ideas

1. **A market is its spec hash.**
   - `eventId = keccak(resolverRef, params, outcomeCount, resolveAfter)` is the *question*. It is portable across venues and chains.
   - `marketId = keccak(eventId, collateral, takeUntil, refundAfter, defaultOutcome)` is the *escrow instance* on one chain.
   - Indexers group markets by `eventId`.
2. **Resolution is a pure function.** `resolve(ctx, params, evidence) → (status, payouts)`.
   - `evidence` carries its own authenticity: signed oracle reports, storage proofs, zk proofs, drand beacons, or a plain witness checked by the resolver.
   - The kernel supplies time through `ctx`. The resolver never reads `block.timestamp` or mutable storage.
3. **Write-once outcomes.** The first successful `resolve` writes the payout vector permanently (Opium's write-once cache plus Sapience's `config.resolved`). Other contracts can read the outcome.
4. **Three-way terminal state:**
   - `RESOLVED(payouts)`
   - `INVALID`: each side gets its own collateral back
   - `DEFAULT(outcome)`: the market's declared outcome if no evidence arrives by `refundAfter`. This is how "someone produces X by T" markets work.
5. **Identity by code.**
   - For EVM resolvers, `resolverRef = codehash`, pinned at creation and re-checked at resolution.
   - For zk resolvers, `resolverRef = (proofSystem, imageId/vkey)`, and the adapter's own codehash is also pinned.
6. **Anyone can resolve, and is paid to.** Calling `resolve` is open to all, and the caller earns a small trigger reward (Ante). Calling `expire` after `refundAfter` is also open to all.
7. **Agent-readable.** Each resolver exposes ABI type strings for its `params` and `evidence` (Ante's schema idea), so an agent can construct markets and evidence without reading Solidity.

---

## 3. Interfaces

### 3.1 Resolver (what market creators write or reuse)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum Status { PENDING, RESOLVED, INVALID }

struct ResolveContext {
    bytes32 marketId;      // binds evidence/proofs to this market (Reckn's dealBinding)
    bytes32 eventId;
    uint64  resolveAfter;  // event time from the spec
    uint64  now_;          // block.timestamp, supplied by the kernel
    uint8   outcomeCount;
}

interface IResolver {
    /// ABI type strings, e.g. "(bytes32 feed,int64 strike,uint32 twapSecs)".
    /// outcomeLabels is optional ("YES,NO" or "A,B,C").
    function schema() external view returns (
        string memory paramsAbi,
        string memory evidenceAbi,
        string memory outcomeLabels
    );

    /// Called once at market creation. Reject malformed params early.
    function validate(bytes calldata params, uint8 outcomeCount) external view returns (bool);

    /// Pure resolution. Must not read mutable state; time comes from ctx.
    /// payouts.length == ctx.outcomeCount; the payouts are numerators of a normalized vector
    /// (CTF style). [1,0] = outcome 0 wins, [1,1] = even split, etc.
    function resolve(
        ResolveContext calldata ctx,
        bytes calldata params,
        bytes calldata evidence
    ) external view returns (Status status, uint256[] memory payouts);
}
```

Notes:
- `resolve` is called via STATICCALL with a gas cap. If it reverts or runs out of gas, the market stays `PENDING`. That is Sapience's try/catch behaviour, kept unchanged.
- `PENDING` with a valid-but-early evidence set is a normal answer ("not yet").
- No `isFinalized`. Finality is a kernel property: once a valid answer is written, it stays.

### 3.2 zk resolver adapter (one canonical contract per proof system)

The "resolver" is a RISC-V guest program, and the adapter only verifies its proof.

```solidity
// params   = abi.encode(bytes32 programVKey, bytes programParams)
// evidence = abi.encode(bytes publicValues, bytes proof)
// publicValues (committed by the guest) =
//   abi.encode(bytes32 marketId, bytes32 paramsHash, uint8 status, uint256[] payouts)

contract SP1ResolverAdapter is IResolver {
    ISP1Verifier constant VERIFIER = ISP1Verifier(0x...); // canonical gateway, hardcoded
                                                          // (no immutables → same codehash on every chain)
    function resolve(ResolveContext calldata ctx, bytes calldata params, bytes calldata evidence)
        external view returns (Status, uint256[] memory)
    {
        (bytes32 vkey, bytes memory programParams) = abi.decode(params, (bytes32, bytes));
        (bytes memory pv, bytes memory proof) = abi.decode(evidence, (bytes, bytes));
        VERIFIER.verifyProof(vkey, pv, proof);                       // reverts if invalid
        (bytes32 mId, bytes32 pHash, uint8 st, uint256[] memory payouts) =
            abi.decode(pv, (bytes32, bytes32, uint8, uint256[]));
        require(mId == ctx.marketId && pHash == keccak256(programParams));
        return (Status(st), payouts);
    }
    // schema(), validate() omitted
}
```

Guest side (Rust, SP1):

```rust
#![no_main]
sp1_zkvm::entrypoint!(main);

pub fn main() {
    let market_id: [u8; 32] = sp1_zkvm::io::read();
    let program_params: Vec<u8> = sp1_zkvm::io::read();
    let evidence: Vec<u8> = sp1_zkvm::io::read();   // private to the prover unless committed

    let (status, payouts) = resolver::resolve(&program_params, &evidence);

    let params_hash = keccak256(&program_params);
    sp1_zkvm::io::commit_slice(&abi_encode(market_id, params_hash, status, &payouts));
}
```

Guest determinism rules:
- Pinned toolchain and Docker build, so the ELF hash maps to a single vkey.
- No floats; use fixed-point.
- No time and no randomness except what arrives in `evidence` (e.g., a drand round).
- Every external fact enters as evidence and is verified inside the guest.

### 3.3 Composite resolver (markets on markets)

```solidity
// params = abi.encode(bytes32[] marketIds, uint8[] wantOutcome, uint8 mode) // ALL / ANY / AT_LEAST_K
// Reads kernel.outcomeOf(marketId), which is write-once, so the read is deterministic once all inputs are final.
// If any input is INVALID → INVALID (or a per-mode rule).
```

This covers Sapience-style parlays and is the base for derivatives that agents build on other markets' outcomes.

### 3.4 Kernel (escrow + positions)

```solidity
struct MarketSpec {
    address resolver;
    bytes32 resolverCodeHash;   // pinned (Reckn)
    bytes   params;             // resolver-defined (Opium params / Sapience conditionId)
    uint8   outcomeCount;       // 2 in v0
    address collateral;
    uint64  takeUntil;          // last moment to open positions (lockout before the event)
    uint64  resolveAfter;       // earliest time resolution may succeed
    uint64  refundAfter;        // after this: DEFAULT if set, else INVALID (Opium no-data cancel)
    uint8   defaultOutcome;     // 255 = none
}

interface IKernel {
    event MarketOpened(bytes32 indexed marketId, bytes32 indexed eventId, MarketSpec spec);
    event Matched(bytes32 indexed marketId, address indexed a, address indexed b, uint256 stakeA, uint256 stakeB);
    event Resolved(bytes32 indexed marketId, Status status, uint256[] payouts, address trigger);

    function open(MarketSpec calldata spec) external returns (bytes32 marketId);   // anyone

    /// Escrow-first: both stakes are pulled in this call or it reverts.
    /// Both parties sign EIP-712 orders (EOA / 1271 / session key, as in Sapience).
    function matchOrders(Order calldata a, Order calldata b) external;

    /// Bilateral early exit (Sapience burn): two holders agree on a split before resolution.
    function exit(ExitRequest calldata r) external;

    function resolve(bytes32 marketId, bytes calldata evidence) external;          // anyone; trigger reward
    function expire(bytes32 marketId) external;                                    // anyone, after refundAfter
    function redeem(bytes32 marketId, uint8 outcome, uint256 amount) external;     // pull, never push

    function outcomeOf(bytes32 marketId) external view returns (Status, uint256[] memory);
}
```

Positions are ERC-6909 ids `(marketId, outcome)` in the kernel, which is cheaper than deploying an ERC-20 pair per market. Accounting follows Sapience's C-1 rule: each match mints `stakeA + stakeB` claims to both sides, so tokens stay fungible whatever odds they were bought at. On `INVALID`, each outcome's holders split that side's collateral pool rather than the whole pool.

Timeline:

```
open ──► [take window] ──► takeUntil ──► resolveAfter ──► [resolution window] ──► refundAfter
                                              │                                        │
                                       resolve(evidence) ─► RESOLVED              expire() ─► DEFAULT / INVALID
```

The fee is a small cut of the pool at resolution, paid to whoever called `resolve` or `expire`, in the spirit of Ante's 5% trigger reward. No volume incentives.

---

## 4. Evidence types for v0 (no web data)

| Evidence class | How the resolver checks it | Example market |
|---|---|---|
| Pure compute / witness | Resolver (or zk guest) evaluates the witness against params | "A route with cost < X for instance I is submitted by T" (default NO) |
| Hidden-test code challenge | Buyer commits `H(tests)`; tests revealed via drand time-lock after `takeUntil`; zk guest runs submitted code against them | "Someone submits a function passing suite H by T" |
| Price data | Signed Pyth/Chainlink reports, averaged over a **window** ending at `resolveAfter` (Sapience's Pyth resolver uses a single exact timestamp) | "ETH TWAP over [T-30m, T] > 4000" |
| Chain state | Storage/receipt proofs against a recent block hash (EIP-2935 on L1, ~27h window), or verified inside a zk guest | "Vault V share price at block N ≥ p" |
| Randomness / clock | drand beacon for round R | Tie-breaks, lotteries, sealed-reveal timing |
| Other markets | `outcomeOf` on the kernel | Parlays, conditional markets |
| Deterministic game | zk guest replays a game log | "Agent A's move list beats agent B under engine E" |

---

## 5. Compatibility adapters (so existing tooling sees these markets)

| Adapter | Direction | What it does |
|---|---|---|
| `AsSapienceCondition` | ours → Sapience | Implements `IConditionResolver`; `conditionId = abi.encode(marketId)`; maps `RESOLVED [1,0]/[0,1]` to their outcome vector. Lets our markets appear as picks in Sapience-style parlays. |
| `CTFOracleReporter` | ours → Gnosis CTF | After resolution, calls `reportPayouts(questionId = marketId, payouts)`. CTF conditions (Seer, CTF-collateral lending) can then reference our outcomes. |
| `Evaluator8183` | ours → ERC-8183 | Set as a job's `evaluator`; calls `complete` or `reject` based on a referenced market's outcome. A job becomes "paid if resolver R says so". |
| `FromSapienceCondition` | Sapience → ours | Wraps any `IConditionResolver` as an `IResolver`. It inherits that resolver's trust model, so it is tagged as an imported class and isn't counted as code-resolved. |

---

## 6. Decisions

The open questions from the first draft are settled in `decisions/`:

- Chain → Base first (decision 0004).
- Outcomes → binary in v0 with an N-ready interface (decision 0007).
- Matching → escrow-first signed bilateral orders; batch matching later (decision 0007).
- Cross-chain identity → code-derived `eventId`, adapters without chain-specific immutables (decision 0005).
- Sapience compatibility → an outward adapter, not a core dependency (decision 0008).
- Fee → a small cut of the pool at resolution, paid to the trigger. The exact rate is set in the Phase 1 tests.

## 7. Next

See `docs/status.md` (Phase 1: kernel prototype).
