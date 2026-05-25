import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import User
import os
import uuid

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-in-production-min-32-chars")
ALGORITHM  = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str, expires_minutes: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_uuid))
    user   = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """Resolve user from a raw JWT string (used for WebSocket auth)."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No sub in token")
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == user_uuid))
        user   = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return user
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")
