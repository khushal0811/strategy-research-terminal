from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from db.database import get_db
from db.models import User, BacktestRun
from runs.schemas import RunListItem, RunDetail
from auth.utils import get_current_user
import uuid

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("/", response_model=List[RunListItem])
async def list_runs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(BacktestRun)
        .where(BacktestRun.user_id == current_user.id)
        .order_by(BacktestRun.created_at.desc())
        .limit(limit).offset(offset)
    )
    return result.scalars().all()


@router.get("/{run_id}", response_model=RunDetail)
async def get_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun).where(
            BacktestRun.id == run_id,
            BacktestRun.user_id == current_user.id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@router.delete("/{run_id}", status_code=204)
async def delete_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun).where(
            BacktestRun.id == run_id,
            BacktestRun.user_id == current_user.id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Run not found")
    await db.delete(run)
    await db.commit()


@router.patch("/{run_id}/report", response_model=RunDetail)
async def save_report(
    run_id: uuid.UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save the AI-generated report to a completed run."""
    result = await db.execute(
        select(BacktestRun).where(
            BacktestRun.id == run_id,
            BacktestRun.user_id == current_user.id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(404, "Run not found")
    run.ai_report = body.get("report", "")
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run
