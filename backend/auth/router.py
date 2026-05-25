from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import User
from auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UpdateCostsRequest
from auth.utils import hash_password, verify_password, create_token, get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

ACCESS_TOKEN_MINUTES  = 15
REFRESH_TOKEN_MINUTES = 60 * 24 * 7  # 7 days


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check username not taken
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Username already taken")

    # Check email not taken
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        username=req.username,
        email=req.email,
        password=hash_password(req.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(401, "Invalid username or password")

    return TokenResponse(
        access_token  = create_token(str(user.id), ACCESS_TOKEN_MINUTES),
        refresh_token = create_token(str(user.id), REFRESH_TOKEN_MINUTES),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/costs", response_model=UserResponse)
async def update_costs(
    req: UpdateCostsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update transaction cost settings for the authenticated user."""
    valid_models = {"flat", "per_share", "percentage"}
    if req.commission_model not in valid_models:
        raise HTTPException(400, f"commission_model must be one of {valid_models}")
    if req.commission_value < 0:
        raise HTTPException(400, "commission_value must be >= 0")
    if req.slippage_bps < 0:
        raise HTTPException(400, "slippage_bps must be >= 0")

    current_user.commission_model = req.commission_model
    current_user.commission_value = req.commission_value
    current_user.slippage_bps     = req.slippage_bps
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
