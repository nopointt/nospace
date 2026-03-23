"""
Nomos Basic Strategy — EMA Crossover + RSI Filter
Phase 1B demo strategy for paper trading.

Logic:
- BUY when EMA 20 crosses above EMA 50 AND RSI < 65 (not overbought)
- SELL when EMA 20 crosses below EMA 50 OR RSI > 75

Risk:
- Stop loss: 5%
- Take profit (ROI): 1% @ 120min, 2% @ 60min, 3% @ 30min
- Trailing stop: 2% after 1% profit
"""

from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class NomosBasicStrategy(IStrategy):

    INTERFACE_VERSION = 3

    timeframe = "5m"

    can_short = False

    minimal_roi = {
        "120": 0.01,
        "60": 0.02,
        "30": 0.03,
        "0": 0.04,
    }

    stoploss = -0.05

    trailing_stop = True
    trailing_stop_positive = 0.02
    trailing_stop_positive_offset = 0.03
    trailing_only_offset_is_reached = True

    startup_candle_count = 60

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["ema20"] = ta.EMA(dataframe, timeperiod=20)
        dataframe["ema50"] = ta.EMA(dataframe, timeperiod=50)
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["ema20"] > dataframe["ema50"])
                & (dataframe["ema20"].shift(1) <= dataframe["ema50"].shift(1))
                & (dataframe["rsi"] < 65)
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["ema20"] < dataframe["ema50"])
                | (dataframe["rsi"] > 75)
            )
            & (dataframe["volume"] > 0),
            "exit_long",
        ] = 1
        return dataframe
