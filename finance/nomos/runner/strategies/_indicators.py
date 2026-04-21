"""Pure-pandas indicator helpers. No ta-lib dependency."""

from __future__ import annotations

import numpy as np
import pandas as pd


def ohlcv_to_df(ohlcv: list) -> pd.DataFrame:
    df = pd.DataFrame(ohlcv, columns=["ts", "open", "high", "low", "close", "volume"])
    df["ts"] = pd.to_datetime(df["ts"], unit="ms", utc=True)
    return df


def ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.ewm(alpha=1 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    m = ema(series, fast) - ema(series, slow)
    s = ema(m, signal)
    return m, s, m - s


def adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df["high"], df["low"], df["close"]
    plus_dm = high.diff()
    minus_dm = -low.diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
    minus_dm = minus_dm.where((minus_dm > plus_dm.where(plus_dm > 0, 0)) & (minus_dm > 0), 0.0)
    tr = pd.concat(
        [
            (high - low).abs(),
            (high - close.shift(1)).abs(),
            (low - close.shift(1)).abs(),
        ],
        axis=1,
    ).max(axis=1)
    atr = tr.ewm(alpha=1 / period, adjust=False).mean()
    plus_di = 100 * (plus_dm.ewm(alpha=1 / period, adjust=False).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(alpha=1 / period, adjust=False).mean() / atr)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    return dx.ewm(alpha=1 / period, adjust=False).mean()


def fit_ode_on_returns(returns_segment: np.ndarray) -> dict:
    n = len(returns_segment)
    if n < 6:
        return {"p": np.nan, "q": np.nan, "r_squared": np.nan}
    r = returns_segment[1:-1]
    rp = (returns_segment[2:] - returns_segment[:-2]) / 2.0
    rpp = returns_segment[2:] - 2 * returns_segment[1:-1] + returns_segment[:-2]
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


HOLD = {"action": "HOLD", "meta": {}}
