"""Remizov ODE Trend v2 — 1h timeframe (port from Freqtrade 4h).

Fits r'' + p*r' + q*r = 0 to log-return rolling window of 30 bars.
BUY when damping p>0.1 (or R2>0.78) + positive slope + close>EMA50.
SELL when p<0 OR slope<0 (ODE regime reversal).
"""

from __future__ import annotations

import numpy as np

from . import _indicators as ind

TIMEFRAME = "1h"

ODE_WINDOW = 30
P_ENTRY_THRESHOLD = 0.1
P_ENTRY_R2_TIER = 0.05
SLOPE_ENTRY_THRESHOLD = 0.0005
R2_ENTRY_THRESHOLD = 0.6
R2_HIGH_THRESHOLD = 0.78


def signal(ohlcv: list) -> dict:
    if len(ohlcv) < ODE_WINDOW + 55:
        return ind.HOLD
    df = ind.ohlcv_to_df(ohlcv)
    df["ema50"] = ind.ema(df["close"], 50)

    close = df["close"].values.astype(np.float64)
    log_close = np.log(np.maximum(close, 1e-8))
    log_returns = np.zeros_like(log_close)
    log_returns[1:] = np.diff(log_close)

    seg = log_returns[-ODE_WINDOW:]
    if len(seg) < ODE_WINDOW:
        return ind.HOLD
    ode = ind.fit_ode_on_returns(seg)
    p_val, q_val, r2_val = ode["p"], ode["q"], ode["r_squared"]

    log_seg = log_close[-ODE_WINDOW:]
    x = np.arange(len(log_seg))
    slope = float(np.polyfit(x, log_seg, 1)[0])

    last = df.iloc[-1]
    above_ema50 = last["close"] > last["ema50"]
    vol_ok = last["volume"] > 0

    meta = {
        "p": round(float(p_val), 4) if not np.isnan(p_val) else None,
        "q": round(float(q_val), 4) if not np.isnan(q_val) else None,
        "r2": round(float(r2_val), 4) if not np.isnan(r2_val) else None,
        "slope": round(slope, 6),
        "ema50": round(float(last["ema50"]), 2),
    }

    if np.isnan(p_val) or np.isnan(r2_val):
        return {"action": "HOLD", "meta": meta}

    tier_a = (
        p_val > P_ENTRY_THRESHOLD
        and slope > SLOPE_ENTRY_THRESHOLD
        and r2_val > R2_ENTRY_THRESHOLD
        and above_ema50
        and vol_ok
    )
    tier_b = (
        r2_val > R2_HIGH_THRESHOLD
        and slope > SLOPE_ENTRY_THRESHOLD
        and p_val > P_ENTRY_R2_TIER
        and above_ema50
        and vol_ok
    )
    if tier_a:
        return {"action": "BUY", "meta": {**meta, "reason": "damped_trend"}}
    if tier_b:
        return {"action": "BUY", "meta": {**meta, "reason": "high_r2_trend"}}

    if (p_val < 0 or slope < 0) and vol_ok:
        return {"action": "SELL", "meta": {**meta, "reason": "ode_regime_exit"}}

    return {"action": "HOLD", "meta": meta}
