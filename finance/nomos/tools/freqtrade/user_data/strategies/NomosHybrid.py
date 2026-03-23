"""
Nomos Hybrid Strategy — combines the best of MACD Trend + EMA + DipBuyer.

Tested components (180-day backtest):
- MACD crossover + ADX > 25 + EMA200 filter → +1.97%, 0% DD (but only 2 trades)
- EMA20/50 crossover + ADX > 20 → +1.32%, 0.66% DD (4 trades)
- Dip buyer (drawdown < -5%, RSI < 35, volume spike) → -16.42% (too aggressive)

Hybrid approach:
- THREE entry modes (any one triggers a buy):
  1. TREND: MACD crossover + ADX > 20 (relaxed from 25) + above EMA200
  2. MOMENTUM: EMA20 > EMA50 crossover + RSI < 60 + ADX > 18
  3. DIP: Price drops >4% from 20-bar high + RSI < 38 + above EMA200
- EXIT: MACD bearish crossover OR RSI > 75 OR trailing stop

4h timeframe. Target: 10-20 trades per 90 days.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class NomosHybrid(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    minimal_roi = {
        "720": 0.015,
        "360": 0.03,
        "120": 0.05,
        "0": 0.08,
    }

    stoploss = -0.055

    trailing_stop = True
    trailing_stop_positive = 0.025
    trailing_stop_positive_offset = 0.04
    trailing_only_offset_is_reached = True

    startup_candle_count = 210

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Trend indicators
        dataframe["ema20"] = ta.EMA(dataframe, timeperiod=20)
        dataframe["ema50"] = ta.EMA(dataframe, timeperiod=50)
        dataframe["ema200"] = ta.EMA(dataframe, timeperiod=200)

        # MACD
        macd = ta.MACD(dataframe, fastperiod=12, slowperiod=26, signalperiod=9)
        dataframe["macd"] = macd["macd"]
        dataframe["macdsignal"] = macd["macdsignal"]
        dataframe["macdhist"] = macd["macdhist"]

        # Momentum / Oscillators
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["adx"] = ta.ADX(dataframe, timeperiod=14)
        dataframe["atr"] = ta.ATR(dataframe, timeperiod=14)

        # Dip detection
        dataframe["recent_high"] = dataframe["high"].rolling(window=20).max()
        dataframe["drawdown_pct"] = (
            (dataframe["close"] - dataframe["recent_high"])
            / dataframe["recent_high"]
            * 100
        )

        # Volume
        dataframe["volume_sma"] = dataframe["volume"].rolling(window=20).mean()

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Mode 1: TREND — MACD bullish crossover in trending market
        trend_signal = (
            (dataframe["macd"] > dataframe["macdsignal"])
            & (dataframe["macd"].shift(1) <= dataframe["macdsignal"].shift(1))
            & (dataframe["adx"] > 20)
            & (dataframe["rsi"] > 35)
            & (dataframe["rsi"] < 70)
            & (dataframe["close"] > dataframe["ema200"])
        )

        # Mode 2: MOMENTUM — EMA crossover with momentum confirmation
        momentum_signal = (
            (dataframe["ema20"] > dataframe["ema50"])
            & (dataframe["ema20"].shift(1) <= dataframe["ema50"].shift(1))
            & (dataframe["rsi"] < 60)
            & (dataframe["adx"] > 18)
            & (dataframe["close"] > dataframe["ema200"])
        )

        # Mode 3: DIP — buy significant pullbacks in uptrend
        dip_signal = (
            (dataframe["drawdown_pct"] < -4)
            & (dataframe["rsi"] < 38)
            & (dataframe["close"] > dataframe["ema200"])
            & (dataframe["volume"] > dataframe["volume_sma"] * 1.2)
        )

        dataframe.loc[
            (trend_signal | momentum_signal | dip_signal)
            & (dataframe["volume"] > 0),
            "enter_long",
        ] = 1

        # Tag entries for analysis
        dataframe.loc[trend_signal & (dataframe["volume"] > 0), "enter_tag"] = "trend_macd"
        dataframe.loc[momentum_signal & (dataframe["volume"] > 0), "enter_tag"] = "momentum_ema"
        dataframe.loc[dip_signal & (dataframe["volume"] > 0), "enter_tag"] = "dip_buy"

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (
                    (dataframe["macd"] < dataframe["macdsignal"])
                    & (dataframe["macd"].shift(1) >= dataframe["macdsignal"].shift(1))
                )
                | (dataframe["rsi"] > 75)
            )
            & (dataframe["volume"] > 0),
            "exit_long",
        ] = 1
        return dataframe
