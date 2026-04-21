"""MACD Crossover + ADX trend filter. 1h timeframe (port from Freqtrade 4h).

Port of NomosMACDTrend.py:
  BUY:  MACD crosses above signal AND ADX>25 AND 40<RSI<70 AND close>EMA200
  SELL: MACD crosses below signal OR RSI>80
"""

from __future__ import annotations

from . import _indicators as ind

TIMEFRAME = "1h"


def signal(ohlcv: list) -> dict:
    if len(ohlcv) < 210:
        return ind.HOLD
    df = ind.ohlcv_to_df(ohlcv)
    m, s, _ = ind.macd(df["close"], 12, 26, 9)
    df["macd"], df["macdsignal"] = m, s
    df["adx"] = ind.adx(df, 14)
    df["rsi"] = ind.rsi(df["close"], 14)
    df["ema200"] = ind.ema(df["close"], 200)

    prev, last = df.iloc[-2], df.iloc[-1]
    cross_up = prev["macd"] <= prev["macdsignal"] and last["macd"] > last["macdsignal"]
    cross_down = prev["macd"] >= prev["macdsignal"] and last["macd"] < last["macdsignal"]

    meta = {
        "macd": round(float(last["macd"]), 4),
        "signal": round(float(last["macdsignal"]), 4),
        "adx": round(float(last["adx"]), 2),
        "rsi": round(float(last["rsi"]), 2),
        "ema200": round(float(last["ema200"]), 2),
    }

    if (
        cross_up
        and last["adx"] > 25
        and 40 < last["rsi"] < 70
        and last["close"] > last["ema200"]
        and last["volume"] > 0
    ):
        return {"action": "BUY", "meta": {**meta, "reason": "macd_cross_up + adx>25 + trend_up"}}
    if (cross_down or last["rsi"] > 80) and last["volume"] > 0:
        return {"action": "SELL", "meta": {**meta, "reason": "macd_cross_down_or_rsi>80"}}
    return {"action": "HOLD", "meta": meta}
