from pydantic import BaseModel
from typing import Optional
import uuid

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    commission_model: str
    commission_value: float
    slippage_bps: float

    class Config:
        from_attributes = True

class UpdateCostsRequest(BaseModel):
    commission_model: str   # "flat" | "per_share" | "percentage"
    commission_value: float
    slippage_bps: float
