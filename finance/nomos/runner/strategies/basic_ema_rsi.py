"""Basic EMA Crossover + RSI filter. 5m timeframe.

Port of NomosBasicStrategy.py (Freqtrade):
  BUY:  EMA20 crosses above EMA50 AND RSI < 65
  SELL: EMA20 crosses below EMA50 OR RSI > 75
"""

from __future__ import annotations

from . import _indicators as ind

TIMEFRAME = "5m"


def signal(ohlcv: list) -> dict:
    if len(ohlcv) < 60:
        return ind.HOLD
    df = ind.ohlcv_to_df(ohlcv)
    df["ema20"] = ind.ema(df["close"], 20)
    df["ema50"] = ind.ema(df["close"], 50)
    df["rsi"] = ind.rsi(df["close"], 14)

    prev, last = df.iloc[-2], df.iloc[-1]
    cross_up = prev["ema20"] <= prev["ema50"] and last["ema20"] > last["ema50"]
    cross_down = prev["ema20"] >= prev["ema50"] and last["ema20"] < last["ema50"]

    meta = {
        "ema20": round(float(last["ema20"]), 4),
        "ema50": round(float(last["ema50"]), 4),
        "rsi": round(float(last["rsi"]), 2),
    }

    if cross_up and last["rsi"] < 65 and last["volume"] > 0:
        return {"action": "BUY", "meta": {**meta, "reason": "ema_cross_up + rsi<65"}}
    if cross_down or last["rsi"] > 75:
        if last["volume"] > 0:
            return {"action": "SELL", "meta": {**meta, "reason": "ema_cross_down_or_rsi>75"}}
    return {"action": "HOLD", "meta": meta}
