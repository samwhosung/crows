import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeAbiParameters } from "viem";
import { commitmentOf } from "../src/store.ts";
import { parseTime } from "../src/actions.ts";
import { decodeCall } from "../src/duels.ts";
import { flat, trend } from "../src/strategies.ts";

test("sealed-move commitment matches the contract's keccak256(abi.encode(chainid, crows, player, move, salt))", () => {
  // Reference value computed with `cast` from the same inputs.
  const move = encodeAbiParameters([{ type: "int256" }], [244125000000n]);
  const salt = "0x7361000000000000000000000000000000000000000000000000000000000000";
  assert.equal(
    commitmentOf(
      8453,
      "0xB12753BB0b1a84a2b2Fde0A047d8F3Dd64829a83",
      "0x328809Bc894f92807417D2dAD6b7C998c1aFdac6",
      move,
      salt,
    ),
    "0x7544cf4297eddcc2cf4753e9458278abd4f47d38e2784d6b379ea2e1d28a954a",
  );
});

test("parseTime", () => {
  const base = 1_800_000_000n; // 2027-01-15T08:00:00Z
  assert.equal(parseTime("+90m", base), base + 5400n);
  assert.equal(parseTime("+2h", base), base + 7200n);
  assert.equal(parseTime("1800003600", base), 1_800_003_600n);
  assert.equal(parseTime("2027-01-15T09:00:00Z", base), 1_800_003_600n);
  // next-hour: the next full hour at least 15 minutes away
  assert.equal(parseTime("next-hour", base), base + 3600n);
  assert.equal(parseTime("next-hour", base + 2700n), base + 7200n); // 08:45 -> 10:00
  assert.equal(parseTime("next-hour", base + 2600n), base + 3600n); // 08:43:20 -> 09:00
  assert.throws(() => parseTime("tomorrowish", base));
});

test("decodeCall reads a 32-byte int and rejects anything else", () => {
  assert.equal(decodeCall(encodeAbiParameters([{ type: "int256" }], [123n])), 123n);
  assert.equal(decodeCall("0x"), null);
  assert.equal(decodeCall("0x1234"), null);
});

test("built-in strategies", async () => {
  const view = {
    asset: "ETH",
    now: 10_000,
    price: 2400,
    windowStart: 10_600,
    windowEnd: 14_200,
    history: [
      { time: 6_000, price: 2380 },
      { time: 8_000, price: 2390 },
      { time: 10_000, price: 2400 },
    ],
  };
  assert.deepEqual(await flat.decide!(view), { direction: "skip", call: 2400, reason: "The price won't move." });
  const t = await trend.decide!(view);
  assert.equal(t.direction, "up");
  assert.equal(t.call, 2420);
});
