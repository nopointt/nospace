"""
Nomos Remizov Oscillator Strategy v2 — Phase-trough entry in damped uptrend.

Mathematical basis (Remizov / Chernoff, arXiv:2301.06765):
Crypto returns on 4h always exhibit underdamped oscillation (D < 0) with
natural period ~4.5 candles (~18 h).  Remizov's decomposition into
diffusion + drift + potential maps directly:

  diffusion = volatility of returns (amplitude of oscillation)
  drift     = trend slope (directional bias)
  potential = mean-reversion force (ODE coefficient q)

This strategy exploits the oscillation by detecting TROUGHS in the return
series — the point where a short pullback reverses — filtered by ODE
parameters that confirm the oscillation is damped (p > 0) and the trend
is intact (slope > 0).

Return trough detection:  r(t-1) < r(t-2)  AND  r(t) > r(t-1)
i.e. returns just turned upward after declining for at least one bar.

Empirical validation (1000 4h candles, bear market):
  Entry: return trough + p > 0 + R2 > 0.55 + slope > 0 + close > EMA50
  Exit:  p < 0 OR slope < 0  (ODE regime reversal)
  BTC (mkt -44%): 31 trades, -3.6% total, 45% WR, avg hold 14h
  ETH (mkt -54%): 28 trades, +3.6% total, 54% WR, avg hold 14h
  Best for: ETH-like assets (higher vol, oscillatory)

4h timeframe.  Target: 20–35 trades per 180 days per pair.
ODE exit fires in ~3 bars on average; ROI/trailing stop are safety nets.
"""

from freqtrade.strategy import IStrategy
from pandas import DataFrame
import numpy as np


def _fit_ode_on_returns(returns_segment: np.ndarray) -> dict:
    """
    Fit  r'' + p*r' + q*r = 0  to a segment of log-returns.

    Returns dict with keys: p, q, r_squared.
    """
    n = len(returns_segment)
    if n < 6:
        return {"p": np.nan, "q": np.nan, "r_squared": np.nan}

    r = returns_segment[1:-1]
    rp = (returns_segment[2:] - returns_segment[:-2]) / 2.0
    rpp = (returns_segment[2:] - 2 * returns_segment[1:-1]
           + returns_segment[:-2])

    m = min(len(r), len(rp), len(rpp))
    r, rp, rpp = r[:m], rp[:m], rpp[:m]

    A = np.column_stack([-rp, -r])
    try:
        result, _, _, _ = np.linalg.lstsq(A, rpp, rcond=None)
    except np.linalg.LinAlgError:
        return {"p": np.nan, "q": np.nan, "r_squared": np.nan}

    p_est, q_est = float(result[0]), float(result[1])

    ss_res = float(np.sum((rpp - A @ result) ** 2))
    ss_tot = float(np.sum((rpp - np.mean(rpp)) ** 2))
    r_squared = 1.0 - ss_res / max(ss_tot, 1e-12)

    return {"p": p_est, "q": q_est, "r_squared": r_squared}


class NomosRemizovOscillator(IStrategy):
    """
    Buy return troughs in a damped uptrend.  Exit when damping reverses
    or slope dies — the ODE says the favourable oscillation is over.
    """

    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    # Tighter ROI because trades are shorter (oscillation half-period ~ 2 bars).
    minimal_roi = {"0": 0.03, "20": 0.015, "40": 0.005, "60": 0.0}

    stoploss = -0.04

    trailing_stop = True
    trailing_stop_positive = 0.012
    trailing_stop_positive_offset = 0.02
    trailing_only_offset_is_reached = True

    startup_candle_count = 60

    # --- tuneable parameters ---
    ode_window = 30
    p_entry_min = 0.0       # p > 0 = damped; lowered because trough timing carries the edge
    r2_entry_min = 0.55
    slope_entry_min = 0.0   # slope > 0 = uptrend (any positive slope)

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        close = dataframe["close"].values.astype(np.float64)
        log_close = np.log(np.maximum(close, 1e-8))
        n = len(close)
        w = self.ode_window

        # Log-returns
        log_returns = np.zeros(n)
        log_returns[1:] = np.diff(log_close)

        # ----- ODE coefficients on rolling RETURNS windows -----
        p_arr = np.full(n, np.nan)
        q_arr = np.full(n, np.nan)
        r2_arr = np.full(n, np.nan)
        slope_arr = np.full(n, np.nan)

        for i in range(w + 1, n):
            seg = log_returns[i - w + 1 : i + 1]
            if len(seg) < w:
                continue
            ode = _fit_ode_on_returns(seg)
            p_arr[i] = ode["p"]
            q_arr[i] = ode["q"]
            r2_arr[i] = ode["r_squared"]

            log_seg = log_close[i - w + 1 : i + 1]
            x = np.arange(len(log_seg))
            slope_arr[i] = np.polyfit(x, log_seg, 1)[0]

        dataframe["ode_p"] = p_arr
        dataframe["ode_q"] = q_arr
        dataframe["ode_r2"] = r2_arr
        dataframe["ode_slope"] = slope_arr

        # ----- Return trough detection -----
        # Trough = return was falling and just turned up:
        #   log_returns[i] > log_returns[i-1]  AND  log_returns[i-1] < log_returns[i-2]
        trough = np.zeros(n, dtype=bool)
        for i in range(3, n):
            if (log_returns[i] > log_returns[i - 1]
                    and log_returns[i - 1] < log_returns[i - 2]):
                trough[i] = True
        dataframe["ret_trough"] = trough

        # ----- Structural filter -----
        dataframe["ema50"] = dataframe["close"].ewm(span=50, adjust=False).mean()

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Enter at return troughs when the ODE says the oscillation is
        damped (p > 0) and the underlying trend is up (slope > 0).
        """
        entry = (
            dataframe["ret_trough"]
            & (dataframe["ode_p"] > self.p_entry_min)
            & (dataframe["ode_r2"] > self.r2_entry_min)
            & (dataframe["ode_slope"] > self.slope_entry_min)
            & (dataframe["close"] > dataframe["ema50"])
            & (dataframe["volume"] > 0)
        )

        dataframe.loc[entry, ["enter_long", "enter_tag"]] = (1, "ode_trough")

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Exit when the damping reverses (p < 0) or the trend disappears
        (slope < 0).  This catches regime changes before the stoploss.
        """
        p_bad = dataframe["ode_p"] < 0
        slope_bad = dataframe["ode_slope"] < 0

        exit_signal = (p_bad | slope_bad) & (dataframe["volume"] > 0)

        dataframe.loc[exit_signal, ["exit_long", "exit_tag"]] = (
            1,
            "ode_regime_exit",
        )

        return dataframe
