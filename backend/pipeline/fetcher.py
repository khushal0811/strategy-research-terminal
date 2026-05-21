"""
pipeline/fetcher.py — On-demand data fetching bridge.

Called by POST /api/backtest/run before registering a run. For every symbol
requested by the backtest, this module fetches fresh data from Yahoo Finance
via yfinance for the exact date range and interval, then normalizes and saves
it as Parquet — always overwriting any existing file.

Design decisions:
  - Always fetch fresh data — never skip based on file existence. This ensures
    the engine always runs against data matching the requested interval and
    date range (a previous run might have saved daily data, but the new run
    requests 5-minute bars).
  - Fetch errors are raised as ValueError so the route returns HTTP 422 with a
    clear message rather than crashing the server.
  - Dividend data is only fetched for daily ('1d') interval. Intraday intervals
    have no meaningful dividend events.
"""

import os
from typing import List

import config  # noqa: F401 — ensures PIPELINE_PATH is on sys.path

from market_data.ingestion import fetch_symbol, fetch_dividends
from market_data.normalization import normalize_data
from market_data.storage import (
    save_to_parquet,
    save_dividends_to_parquet,
)


def ensure_symbols_available(
    symbols: List[str],
    start_date: str,
    end_date: str,
    interval: str,
    data_dir: str,
    include_dividends: bool = True,
) -> List[str]:
    """
    Fetch fresh data for all requested symbols for the exact date range
    and interval. Always overwrites existing parquet files.

    This ensures the engine always runs against data that matches what
    the user actually requested — correct interval, correct date range.

    Args:
        symbols          : List of uppercase ticker symbols.
        start_date       : Backtest start date as string 'YYYY-MM-DD'.
        end_date         : Backtest end date as string 'YYYY-MM-DD'.
        interval         : yfinance interval string ('1d', '1h', '5m', etc.)
        data_dir         : Absolute path to parquet data directory.
        include_dividends: Fetch dividends too (daily interval only).

    Returns:
        List of all symbols successfully fetched.

    Raises:
        ValueError: If yfinance returns no data for a symbol.
    """
    newly_fetched: List[str] = []
    is_daily = interval == '1d'

    for symbol in symbols:
        # Always fetch — never skip based on file existence
        print(f"[pipeline/fetcher] Fetching {symbol} "
              f"({start_date} → {end_date}, {interval})…")

        raw_df = fetch_symbol(
            symbol,
            start=start_date,
            end=end_date,
            interval=interval,
        )

        if raw_df is None or raw_df.empty:
            raise ValueError(
                f"No data returned for '{symbol}' "
                f"({start_date} → {end_date}, interval={interval}). "
                f"The ticker may be invalid, delisted, or have no trading "
                f"days in the requested range."
            )

        norm_df = normalize_data(raw_df, symbol)

        if norm_df.empty:
            raise ValueError(
                f"Normalization produced empty data for '{symbol}'. "
                f"The raw data may be outside the requested date range."
            )

        # Overwrite — this is intentional, always use fresh data
        save_to_parquet(norm_df, symbol, data_dir)
        print(f"[pipeline/fetcher] Saved {symbol}.parquet "
              f"({len(norm_df)} bars, interval={interval}).")

        # Dividends only for daily data — intraday has no dividend events
        if include_dividends and is_daily:
            div_df = fetch_dividends(symbol, start=start_date, end=end_date)
            if div_df is not None and not div_df.empty:
                save_dividends_to_parquet(div_df, symbol, data_dir)
                print(f"[pipeline/fetcher] Saved {symbol}_dividends.parquet "
                      f"({len(div_df)} records).")
            else:
                # Remove stale dividends from a previous fetch so the engine
                # doesn't read dividends from a different date range
                div_path = os.path.join(data_dir, f"{symbol}_dividends.parquet")
                if os.path.exists(div_path):
                    os.remove(div_path)
                    print(f"[pipeline/fetcher] Removed stale "
                          f"{symbol}_dividends.parquet (no dividends in range).")
        else:
            # Remove stale dividends from a previous fetch if interval is intraday or include_dividends is False
            div_path = os.path.join(data_dir, f"{symbol}_dividends.parquet")
            if os.path.exists(div_path):
                os.remove(div_path)
                print(f"[pipeline/fetcher] Removed stale "
                      f"{symbol}_dividends.parquet (not daily interval or dividends disabled).")

        newly_fetched.append(symbol)

    return newly_fetched
