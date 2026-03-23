"""
Nomos EMA 4h — Same EMA crossover logic but on 4h timeframe.
Hypothesis: less noise = fewer false signals.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class NomosEMA4h(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    minimal_roi = {"360": 0.02, "180": 0.03, "60": 0.05, "0": 0.08}
    stoploss = -0.06
    trailing_stop = True
    trailing_stop_positive = 0.025
    trailing_stop_positive_offset = 0.04
    trailing_only_offset_is_reached = True
    startup_candle_count = 60

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["ema20"] = ta.EMA(dataframe, timeperiod=20)
        dataframe["ema50"] = ta.EMA(dataframe, timeperiod=50)
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["adx"] = ta.ADX(dataframe, timeperiod=14)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["ema20"] > dataframe["ema50"])
                & (dataframe["ema20"].shift(1) <= dataframe["ema50"].shift(1))
                & (dataframe["rsi"] < 65)
                & (dataframe["adx"] > 20)
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["ema20"] < dataframe["ema50"])
                | (dataframe["rsi"] > 78)
            )
            & (dataframe["volume"] > 0),
            "exit_long",
        ] = 1
        return dataframe
