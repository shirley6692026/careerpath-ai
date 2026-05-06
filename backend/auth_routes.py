# auth_routes.py - 用户认证路由
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta
import random
import string
from auth_models import UserRegister, UserLogin, VerifyCode, TokenResponse, UserResponse, UserDataSave
from auth_db import (
    save_verify_code, verify_code, create_user, get_user_by_email,
    get_user_by_id, update_last_login, save_user_data, get_user_data
)

router = APIRouter(prefix="/api/auth", tags=["认证"])
security = HTTPBearer()

# JWT配置
JWT_SECRET = "careerpath-secret-key-2026-very-secure-32-bytes-long"  # 生产环境应使用环境变量
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

def create_token(user_id: int) -> str:
    """创建JWT令牌"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """验证JWT令牌，返回用户ID"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="无效的令牌")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="令牌已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的令牌")

def generate_code(length: int = 6) -> str:
    """生成随机验证码"""
    return ''.join(random.choices(string.digits, k=length))

# ========== 认证API ==========

@router.post("/send-code")
async def send_code(body: VerifyCode):
    """发送验证码"""
    code = generate_code()
    save_verify_code(body.email, code, expires_minutes=5)
    
    # 实际项目中这里应该调用短信/邮件服务
    # 现在直接返回验证码用于测试
    return {
        "success": True,
        "message": "验证码已发送",
        "code": code,  # 仅用于测试，生产环境应删除
        "expires_in": 300  # 5分钟
    }

@router.post("/register")
async def register(body: UserRegister):
    """用户注册"""
    user = create_user(body.email, body.name)
    if not user:
        raise HTTPException(status_code=400, detail="注册失败")
    
    token = create_token(user["id"])
    
    return {
        "success": True,
        "message": "注册成功",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        }
    }

@router.post("/login")
async def login(body: UserLogin):
    """用户登录"""
    # 验证验证码
    if not verify_code(body.email, body.code):
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    
    # 获取或创建用户
    user = get_user_by_email(body.email)
    if not user:
        user = create_user(body.email)
    
    # 更新最后登录时间
    update_last_login(user["id"])
    
    # 创建令牌
    token = create_token(user["id"])
    
    return {
        "success": True,
        "message": "登录成功",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        }
    }

@router.get("/me")
async def get_current_user(user_id: int = Depends(verify_token)):
    """获取当前用户信息"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    }

# ========== 用户数据API ==========

@router.post("/data/{module}")
async def save_data(
    module: str,
    body: dict,
    user_id: int = Depends(verify_token)
):
    """保存用户数据"""
    try:
        save_user_data(user_id, module, body)
        return {
            "success": True,
            "message": "数据保存成功",
            "module": module
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")

@router.get("/data/{module}")
async def get_module_data(
    module: str,
    user_id: int = Depends(verify_token)
):
    """获取用户数据"""
    data = get_user_data(user_id, module)
    if not data:
        raise HTTPException(status_code=404, detail="数据不存在")
    
    return {
        "success": True,
        "data": data
    }

@router.get("/data")
async def get_all_data(user_id: int = Depends(verify_token)):
    """获取所有用户数据"""
    data = get_user_data(user_id)
    
    return {
        "success": True,
        "data": data,
        "count": len(data)
    }

@router.post("/sync")
async def sync_data(
    body: dict,
    user_id: int = Depends(verify_token)
):
    """批量同步数据"""
    try:
        for module, data in body.items():
            save_user_data(user_id, module, data)
        
        return {
            "success": True,
            "message": "同步成功",
            "modules": list(body.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")

