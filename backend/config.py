"""
config.py — Environment variables and sys.path configuration.

Imported at the very top of main.py so path setup runs at startup,
before any engine or pipeline imports are attempted.

Required environment variables (set in backend/.env):
    DATA_DIR      — Absolute path to pipeline data/ directory
    ENGINE_PATH   — Absolute path to Event-Driven-Backtesting-Engine repo root
    PIPELINE_PATH — Absolute path to Backtester-Oriented-Market-Data-Pipeline repo root

Startup behaviour:
    - Missing .env → RuntimeError with clear message (fail loudly, not at request time)
    - Bad DATA_DIR → RuntimeError at startup
    - Bad ENGINE_PATH → RuntimeError at startup
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Read environment variables — fail loudly if missing
# ---------------------------------------------------------------------------

def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{key}' is not set. "
            f"Create backend/.env with {key}=<path>"
        )
    return value


DATA_DIR      = _require_env("DATA_DIR")
ENGINE_PATH   = _require_env("ENGINE_PATH")
PIPELINE_PATH = _require_env("PIPELINE_PATH")

# ---------------------------------------------------------------------------
# Add both repos to sys.path so engine and pipeline are importable
# ---------------------------------------------------------------------------

if ENGINE_PATH not in sys.path:
    sys.path.insert(0, ENGINE_PATH)

if PIPELINE_PATH not in sys.path:
    sys.path.insert(0, PIPELINE_PATH)

# ---------------------------------------------------------------------------
# Validate paths at startup — fail loudly, not silently at request time
# ---------------------------------------------------------------------------

if not os.path.isdir(DATA_DIR):
    raise RuntimeError(
        f"DATA_DIR does not exist: {DATA_DIR}\n"
        f"Run the pipeline fetch script first to populate data."
    )

if not os.path.isdir(ENGINE_PATH):
    raise RuntimeError(
        f"ENGINE_PATH does not exist: {ENGINE_PATH}"
    )

if not os.path.isdir(PIPELINE_PATH):
    raise RuntimeError(
        f"PIPELINE_PATH does not exist: {PIPELINE_PATH}"
    )
