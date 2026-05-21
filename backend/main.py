"""
main.py — FastAPI application entry point for the Strategy Research Terminal backend.

Start with:
    cd backend && uvicorn main:app --reload --port 8000

Routes:
    GET  /health                    — Health check
    GET  /api/data/info/{symbol}    — Symbol data availability
    GET  /api/data/symbols          — List all available symbols
    POST /api/backtest/run          — Launch a backtest, receive run_id
    WS   /ws/backtest/{run_id}      — Stream live results
"""

# config.py import MUST come first — adds engine and pipeline to sys.path
import config  # noqa: F401

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(
    title="Strategy Research Terminal",
    description="FastAPI backend for the AI-assisted quantitative research platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health", tags=["health"])
def health():
    """Health check — confirms the server is running and paths are valid."""
    return {"status": "ok"}


@app.websocket("/ws/backtest/{run_id}")
async def websocket_backtest(websocket: WebSocket, run_id: str):
    """
    WebSocket endpoint — streams live backtest results.

    Flow:
      1. Client POSTs /api/backtest/run to receive a run_id.
      2. Client connects here with that run_id.
      3. Engine runs in thread pool; messages are forwarded via asyncio.Queue.
      4. Connection closes automatically on 'complete' or 'error' message.

    Note: get_run_config and run_and_stream are imported here (not at module top)
    so the app starts cleanly even if these modules have not been loaded yet.
    """
    # Lazy imports — avoid circular import at module load time
    from api.routes import get_run_config
    from websocket.manager import run_and_stream

    await websocket.accept()
    try:
        req = get_run_config(run_id)
        await run_and_stream(websocket, req)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        # Catch any HTTPExceptions or general execution errors
        detail = getattr(exc, "detail", str(exc))
        try:
            await websocket.send_json({"type": "error", "message": detail})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed
