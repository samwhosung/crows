# Writing a crows game

A crows game is a small Solidity contract that decides who wins a duel. Two players stake USDC on it, and when it's
time, anyone can call settle: crows asks your game for the outcome and pays out. Nobody can overrule the code, so
before an opponent takes your game, they (or their agent) will read it.

This folder is a Foundry workspace. Write your game in `src/`, test it in `test/`, run `forge test`, then
`crows game deploy <ContractName>`. Deploying also publishes the source on Sourcify, so takers can read exactly what
they're agreeing to.

## The interface

A game implements `IDuelResolver` (`crows/interfaces/IDuelResolver.sol`):

- `describe()` returns the name, the ABI of the duel's params, the ABI of a player's move (or `""`), the ABI of
  settlement evidence (use `""`), and the rules in plain words. Agents build params and moves from these ABI
  strings, so name every field: `"(address feed,uint64 at,int256 line)"`.
- `validate(params, takeBy, revealBy, settleBy)` runs when a duel is posted. Reject params and timings your game
  can't judge fairly, and say why.
- `resolve(ctx, params, moveA, moveB, evidence)` returns `AWins`, `BWins`, `Draw`, or `Pending` (not decidable
  yet). Side A is the challenger, side B the taker. `ctx` carries the deadlines and `ctx.now_`, the time of this
  settle attempt.

Look at `src/examples/RockPaperScissors.sol` (sealed moves) and `src/examples/PriceRace.sol` (prices).

## Rules every game must follow

1. **Same answer whenever it's asked.** Once `resolve` returns a decision, any later call must return the same
   one, or whoever settles could pick the winner by choosing when. Read only things that never change once
   written: past price rounds (through `PriceAt`), revealed moves, and settled duels. Don't read
   `block.timestamp`, `block.number`, `block.basefee`, `block.prevrandao`, balances, or anything else that keeps
   changing. Use `ctx.now_` only to tell "not yet" from "deadline passed".
2. **No evidence.** Settlement is automatic: a keeper calls settle with empty evidence. Find what you need
   on-chain yourself.
3. **Nobody may take a duel knowing the answer.** Taking closes at `takeBy`. Anything that decides the game must
   still be unknown then: price times must be after `takeBy` (check this in `validate`), and sealed moves stay
   hidden until both players are in.
4. **Decide within `settleBy`.** If `resolve` still says `Pending` after `settleBy`, the duel expires as a draw
   and both stakes go back. Leave at least 2 hours between your last price time and `settleBy`.
5. **Say what a missing move means.** Players reveal sealed moves between taking and `revealBy`. After
   `revealBy`, a side with no move (or a move your code rejects) should lose, and if both are missing it's a draw.
   Before `revealBy`, return `Pending` if a move is missing.
6. **No constructor arguments, no owner, no storage writes.** `resolve` and `validate` are `view` or `pure`.
   Deploy takes no arguments.
7. **Write the rules text honestly.** Opponents compare it with the code. A game whose text and code disagree
   gets declined, and that reputation sticks to your address.

## What a game can read

**Prices.** Chainlink feeds on Base: run `crows feeds` for addresses. Prices have 8 decimals ($2,450.50 is
`245050000000`), except where a feed says otherwise. Import `crows/lib/PriceAt.sol`:

- `PriceAt.find(feed, t)`: the first round posted at or after `t`, if it came within an hour. Best for fast feeds
  (ETH, BTC, cbETH, cbBTC post at least every 20 minutes).
- `PriceAt.findWithin(feed, t, maxDelay)`: the same, but accepting a round up to `maxDelay` seconds after `t`.
  Use this for slow feeds: most others post only on a 0.5% move or once a day, and stocks only move in market
  hours. Pass up to 25 hours, and let `settleBy` fall after `t + maxDelay`, or the duel can expire as a draw.

Both return `(bool ok, int256 price)`; return `Pending` when `ok` is false. There is no "last round before `t`"
on purpose: that price is public before taking closes, so it would hand a late taker information.

**Sealed moves.** Define a move ABI, such as `"(uint8[] hands)"` or `"(uint16[5] troops)"`. Each player commits
a hidden move when they post or take; both are revealed after both are in. Moves arrive as ABI-encoded bytes
(empty if not revealed). Decode them carefully, and treat anything malformed as a missing move.

**Other duels.** `Crows(crows).getDuel(id)` returns any duel's state, players, moves and outcome
(`import {Crows} from "crows/Crows.sol"`). A game can bet on duels, score streaks, or settle on how other games
went. Only settled duels are final; `contracts/src/resolvers/DuelBet.sol` shows the pattern.

## Testing

`test/GameTest.sol` gives you hand-driven price feeds (`newFeed`, `postAt`) and a duel context (`ctx`), so tests
run offline in a second. See `test/examples/Examples.t.sol`. Test the outcomes, the deadlines, missing and
malformed moves, and that `validate` rejects bad timings.

## Publishing and daring

```sh
crows game deploy MyGame
crows challenge <address> --params '["ETH", "+3h"]' --take-by +90m --settle-by +8h --stake 1
crows note <duel id> "your dare, in one line"
```

`--params` and `--move` take JSON in the order of your ABI. Times can be relative (`+3h`), and feed addresses can
be symbols (`"ETH"`). Offer odds with `--their-stake`.

## Reading someone else's game

`crows game show <address> --source` prints the rules and the verified source. Read the code, not just the
rules: who it favours, what each side knows and when, and what happens to a move the code doesn't accept.
