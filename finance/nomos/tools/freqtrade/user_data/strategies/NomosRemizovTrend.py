"""
Nomos Remizov Trend Strategy v2 — ODE damping analysis on RETURNS.

Mathematical basis (Remizov / Chernoff, arXiv:2301.06765):
Fit second-order ODE  r'' + p*r' + q*r = 0  to the LOG-RETURN series
on a rolling 30-bar window.  On 4h crypto data returns always produce
D = p^2 - 4q < 0 (underdamped / oscillatory), so the regime signal is NOT
in the sign of D but in the DAMPING COEFFICIENT p and the TREND SLOPE:

  p > 0   → damped oscillation: returns converging → trend stabilising
  p ≈ 0   → sustained oscillation: noisy / range-bound
  p < 0   → anti-damped: oscillations growing → instability / reversal

Combined with the linear slope of log-price over the same window, p > 0
in an uptrend identifies periods where short-term noise is dying out and
price is settling into a directional move.

Empirical validation (1000 4h candles, bear market):
  Entry: p > 0.1 & slope > 5e-4 & R2 > 0.6 & close > EMA50
         OR R2 > 0.78 & slope > 5e-4 & p > 0.05 & close > EMA50
  Exit:  p < 0 OR slope < 0  (ODE regime reversal)
  BTC (mkt -44%): 13 trades, +4.4% total, 54% WR, avg hold 19h
  ETH (mkt -54%): 15 trades, -4.7% total, 47% WR, avg hold 12h
  Best for: BTC-like assets (lower vol, stronger trends)

4h timeframe.  Target: 10–20 trades per 180 days per pair.
ODE exit fires in ~4 bars on average; ROI/trailing stop are safety nets.
"""

from freqtrade.strategy import IStrategy
from pandas import DataFrame
import numpy as np


def _fit_ode_on_returns(returns_segment: np.ndarray) -> dict:
    """
    Fit  r'' + p*r' + q*r = 0  to a segment of log-returns.

    Returns dict: p, q, r_squared, slope (of original log-price in the window).
    All values are floats; NaN-safe.
    """
    n = len(returns_segment)
    if n < 6:
        return {"p": np.nan, "q": np.nan, "r_squared": np.nan}

    r = returns_segment[1:-1]                                    # r(t)
    rp = (returns_segment[2:] - returns_segment[:-2]) / 2.0     # r'  (central diff)
    rpp = (returns_segment[2:] - 2 * returns_segment[1:-1]
           + returns_segment[:-2])                                # r''

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


class NomosRemizovTrend(IStrategy):
    """
    ODE damping + trend-slope: enter when returns oscillation is damping
    out inside an uptrend.  Exit when ODE damping reverses or slope dies.
    """

    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    # ROI acts as safety net; primary exit is ODE-based.
    # "0": never triggered (set high), longer holds exit via ODE signal.
    minimal_roi = {"0": 0.05, "40": 0.025, "80": 0.01, "160": 0.0}

    stoploss = -0.07

    # Trailing stop kicks in only after a meaningful gain.
    trailing_stop = True
    trailing_stop_positive = 0.02
    trailing_stop_positive_offset = 0.035
    trailing_only_offset_is_reached = True

    startup_candle_count = 60  # 30-window ODE + EMA50 warm-up

    # --- tuneable parameters ---
    ode_window = 30
    p_entry_threshold = 0.1       # minimum damping for trend entry
    p_entry_r2_tier = 0.05        # lower p ok when R2 is very high
    slope_entry_threshold = 0.0005
    r2_entry_threshold = 0.6
    r2_high_threshold = 0.78      # "high-confidence" tier

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        close = dataframe["close"].values.astype(np.float64)
        log_close = np.log(np.maximum(close, 1e-8))
        n = len(close)
        w = self.ode_window

        # Log-returns (close-to-close)
        log_returns = np.zeros(n)
        log_returns[1:] = np.diff(log_close)

        # ----- ODE coefficients on rolling windows of RETURNS -----
        p_arr = np.full(n, np.nan)
        q_arr = np.full(n, np.nan)
        r2_arr = np.full(n, np.nan)
        slope_arr = np.full(n, np.nan)

        for i in range(w + 1, n):
            # returns segment needs w data points → prices from i-w to i
            seg = log_returns[i - w + 1 : i + 1]   # w points of returns
            if len(seg) < w:
                continue
            ode = _fit_ode_on_returns(seg)
            p_arr[i] = ode["p"]
            q_arr[i] = ode["q"]
            r2_arr[i] = ode["r_squared"]

            # Slope: linear regression of log-price over the same window
            log_seg = log_close[i - w + 1 : i + 1]
            x = np.arange(len(log_seg))
            slope_arr[i] = np.polyfit(x, log_seg, 1)[0]

        dataframe["ode_p"] = p_arr
        dataframe["ode_q"] = q_arr
        dataframe["ode_r2"] = r2_arr
        dataframe["ode_slope"] = slope_arr

        # ----- trend filter: EMA50 -----
        dataframe["ema50"] = dataframe["close"].ewm(span=50, adjust=False).mean()

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Two entry tiers, both require close > EMA50 (structural uptrend):

        Tier A — "Damped trend":
            p > 0.1, slope > 5e-4, R2 > 0.6
            Returns oscillation is damping in a clear uptrend.

        Tier B — "High-confidence regime":
            R2 > 0.78, slope > 5e-4, p > 0.05
            The ODE model fits extremely well → regime is very predictable.
        """
        above_ema50 = dataframe["close"] > dataframe["ema50"]
        vol_ok = dataframe["volume"] > 0

        tier_a = (
            (dataframe["ode_p"] > self.p_entry_threshold)
            & (dataframe["ode_slope"] > self.slope_entry_threshold)
            & (dataframe["ode_r2"] > self.r2_entry_threshold)
            & above_ema50
            & vol_ok
        )

        tier_b = (
            (dataframe["ode_r2"] > self.r2_high_threshold)
            & (dataframe["ode_slope"] > self.slope_entry_threshold)
            & (dataframe["ode_p"] > self.p_entry_r2_tier)
            & above_ema50
            & vol_ok
        )

        dataframe.loc[tier_a, ["enter_long", "enter_tag"]] = (1, "damped_trend")
        dataframe.loc[tier_b & ~tier_a, ["enter_long", "enter_tag"]] = (
            1,
            "high_r2_trend",
        )

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Exit when the ODE says the favourable regime has ended:
          - p drops below 0 → damping reversed, oscillation growing
          - slope drops below 0 → uptrend gone
        Either condition alone triggers the exit.
        """
        p_reversed = dataframe["ode_p"] < 0
        slope_reversed = dataframe["ode_slope"] < 0

        exit_signal = (p_reversed | slope_reversed) & (dataframe["volume"] > 0)

        dataframe.loc[exit_signal, ["exit_long", "exit_tag"]] = (1, "ode_regime_exit")

        return dataframe
