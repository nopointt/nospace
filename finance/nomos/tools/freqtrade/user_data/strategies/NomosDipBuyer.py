"""
Nomos Dip Buyer — buy significant dips, ride the recovery.
4h timeframe. Only buys when price drops significantly from recent high.
Hypothesis: crypto recovers from sharp dips; patience = profit.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class NomosDipBuyer(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    minimal_roi = {"720": 0.02, "360": 0.04, "120": 0.06, "0": 0.10}
    stoploss = -0.08
    trailing_stop = True
    trailing_stop_positive = 0.03
    trailing_stop_positive_offset = 0.05
    trailing_only_offset_is_reached = True
    startup_candle_count = 60

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)
        dataframe["ema50"] = ta.EMA(dataframe, timeperiod=50)
        dataframe["atr"] = ta.ATR(dataframe, timeperiod=14)
        dataframe["recent_high"] = dataframe["high"].rolling(window=30).max()
        dataframe["drawdown_pct"] = (dataframe["close"] - dataframe["recent_high"]) / dataframe["recent_high"] * 100
        dataframe["volume_sma"] = dataframe["volume"].rolling(window=20).mean()
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["drawdown_pct"] < -5)
                & (dataframe["rsi"] < 35)
                & (dataframe["volume"] > dataframe["volume_sma"] * 1.5)
                & (dataframe["volume"] > 0)
            ),
            "enter_long",
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["rsi"] > 70)
                | (dataframe["drawdown_pct"] > -1)
            )
            & (dataframe["volume"] > 0),
            "exit_long",
        ] = 1
        return dataframe
