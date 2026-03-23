"""
Nomos Hybrid Aggressive — more trades, relaxed filters.
1h timeframe for more granularity. Multiple entry modes.

Goal: 20-40 trades per 90 days with positive expectancy.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class NomosHybridAggressive(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "1h"
    can_short = False

    minimal_roi = {
        "360": 0.01,
        "180": 0.02,
        "60": 0.03,
        "0": 0.05,
    }

    stoploss = -0.04

    trailing_stop = True
    trailing_stop_positive = 0.02
    trailing_stop_positive_offset = 0.03
    trailing_only_offset_is_reached = True

    startup_candle_count = 210

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["ema9"] = ta.EMA(dataframe, timeperiod=9)
        dataframe["ema21"] = ta.EMA(dataframe, timeperiod=21)
        dataframe["ema50"] = ta.EMA(dataframe, timeperiod=50)
        dataframe["ema200"] = ta.EMA(dataframe, timeperiod=200)

        macd = ta.MACD(dataframe, fastperiod=12, slowperiod=26, signalperiod=9)
        dataframe["macd"] = macd["macd"]
        dataframe["macdsignal"] = macd["macdsignal"]

        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["adx"] = ta.ADX(dataframe, timeperiod=14)

        stoch = ta.STOCH(dataframe, fastk_period=14, slowk_period=3, slowd_period=3)
        dataframe["slowk"] = stoch["slowk"]
        dataframe["slowd"] = stoch["slowd"]

        bb = ta.BBANDS(dataframe, timeperiod=20, nbdevup=2.0, nbdevdn=2.0)
        dataframe["bb_upper"] = bb["upperband"]
        dataframe["bb_mid"] = bb["middleband"]
        dataframe["bb_lower"] = bb["lowerband"]

        dataframe["volume_sma"] = dataframe["volume"].rolling(window=20).mean()
        dataframe["recent_high"] = dataframe["high"].rolling(window=48).max()
        dataframe["drawdown_pct"] = (
            (dataframe["close"] - dataframe["recent_high"])
            / dataframe["recent_high"]
            * 100
        )

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Mode 1: Fast EMA crossover in trend
        fast_trend = (
            (dataframe["ema9"] > dataframe["ema21"])
            & (dataframe["ema9"].shift(1) <= dataframe["ema21"].shift(1))
            & (dataframe["close"] > dataframe["ema50"])
            & (dataframe["adx"] > 20)
            & (dataframe["rsi"] < 65)
        )

        # Mode 2: MACD + above EMA200
        macd_trend = (
            (dataframe["macd"] > dataframe["macdsignal"])
            & (dataframe["macd"].shift(1) <= dataframe["macdsignal"].shift(1))
            & (dataframe["close"] > dataframe["ema200"])
            & (dataframe["rsi"] > 40)
            & (dataframe["rsi"] < 65)
        )

        # Mode 3: BB lower touch + stochastic oversold
        bb_bounce = (
            (dataframe["close"] <= dataframe["bb_lower"])
            & (dataframe["slowk"] < 25)
            & (dataframe["rsi"] < 35)
        )

        # Mode 4: Dip buy
        dip = (
            (dataframe["drawdown_pct"] < -3)
            & (dataframe["rsi"] < 35)
            & (dataframe["volume"] > dataframe["volume_sma"] * 1.3)
        )

        dataframe.loc[
            (fast_trend | macd_trend | bb_bounce | dip)
            & (dataframe["volume"] > 0),
            "enter_long",
        ] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] > 72)
                | (dataframe["close"] > dataframe["bb_upper"])
                | (
                    (dataframe["ema9"] < dataframe["ema21"])
                    & (dataframe["ema9"].shift(1) >= dataframe["ema21"].shift(1))
                )
            )
            & (dataframe["volume"] > 0),
            "exit_long",
        ] = 1
        return dataframe
