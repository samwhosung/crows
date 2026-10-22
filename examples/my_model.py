#!/usr/bin/env python3
"""A minimal crows bot strategy. Run it with:

    crows bot --strategy cmd:"python3 examples/my_model.py" --stake 1

crows sends the market on stdin as JSON:
    {"asset": "ETH", "now": <unix>, "price": 2441.2, "windowStart": <unix>, "windowEnd": <unix>,
     "history": [{"time": <unix>, "price": <float>}, ...]}   # feed rounds, oldest first, ~24h

and expects one JSON object on stdout:
    {"direction": "up" | "down" | "skip", "call": <price at windowEnd>, "reason": "<one line>"}

This one bets on mean reversion: if the last hour moved more than the day's typical hourly move, it bets
the move partly reverses.
"""
import json
import statistics
import sys

m = json.load(sys.stdin)
hist = m["history"]
price = m["price"]
hour_ago = next((h["price"] for h in reversed(hist) if h["time"] <= m["now"] - 3600), None)
if hour_ago is None or len(hist) < 10:
    print(json.dumps({"direction": "skip", "call": price, "reason": "Not enough history."}))
    sys.exit()

moves = [b["price"] - a["price"] for a, b in zip(hist, hist[1:])]
typical = statistics.pstdev(moves) * max(1, len(moves) / 24) ** 0.5  # rough hourly scale
last = price - hour_ago
if abs(last) > typical:
    direction = "down" if last > 0 else "up"
    call = price - 0.3 * last
    reason = f"Last hour moved {last:+.2f}, more than the usual {typical:.2f}; expecting a partial reversal."
else:
    direction, call, reason = "skip", price, "Nothing unusual; no bet."
print(json.dumps({"direction": direction, "call": round(call, 2), "reason": reason}))
