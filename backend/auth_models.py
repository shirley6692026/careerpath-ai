# auth_models.py - 用户认证数据模型
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    code: str

class VerifyCode(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserDataSave(BaseModel):
    module: str
    data: dict

class UserDataResponse(BaseModel):
    module: str
    data: dict
    updated_at: datetime
