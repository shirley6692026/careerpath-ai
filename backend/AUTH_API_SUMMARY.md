# CareerPath AI 认证系统 API 文档

## 系统概述

完整的用户认证与数据同步系统，支持邮箱验证码登录、JWT令牌认证、用户数据持久化。

## 技术栈

- **框架**: FastAPI
- **数据库**: SQLite3
- **认证**: JWT (PyJWT)
- **验证**: 邮箱验证码 (6位数字)

---

## API 端点

### 认证相关

#### 1. 发送验证码
```
POST /api/auth/send-code
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "验证码已发送",
  "code": "123456",      // 测试环境返回，生产环境应隐藏
  "expires_in": 300      // 5分钟有效期
}
```

#### 2. 用户注册
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "name": "User Name"     // 可选
}

Response:
{
  "success": true,
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-05-05T09:00:00"
  }
}
```

#### 3. 用户登录
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-05-05T09:00:00"
  }
}
```

#### 4. 获取当前用户
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2026-05-05T09:00:00",
    "last_login": "2026-05-05T10:00:00"
  }
}
```

### 数据相关

#### 5. 保存模块数据
```
POST /api/auth/data/{module}
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "key": "value",
  "any_data": "can_be_stored"
}

Response:
{
  "success": true,
  "message": "数据保存成功",
  "module": "resume"
}
```

#### 6. 获取模块数据
```
GET /api/auth/data/{module}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "module": "resume",
    "data": { ... },
    "updated_at": "2026-05-05T10:00:00"
  }
}
```

#### 7. 批量同步数据
```
POST /api/auth/sync
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "resume": { ... },
  "jd": { ... },
  "interview": { ... }
}

Response:
{
  "success": true,
  "message": "同步成功",
  "modules": ["resume", "jd", "interview"]
}
```

#### 8. 获取所有数据
```
GET /api/auth/data
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {"module": "resume", "data": { ... }, "updated_at": "..."},
    {"module": "jd", "data": { ... }, "updated_at": "..."}
  ],
  "count": 2
}
```

---

## 数据库结构

### users 表
| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | INTEGER | 主键 |
| email | TEXT | 邮箱，唯一 |
| name | TEXT | 用户名 |
| created_at | TIMESTAMP | 创建时间 |
| last_login | TIMESTAMP | 最后登录 |
| is_active | BOOLEAN | 是否激活 |

### verify_codes 表
| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | INTEGER | 主键 |
| email | TEXT | 邮箱 |
| code | TEXT | 验证码 |
| created_at | TIMESTAMP | 创建时间 |
| expires_at | TIMESTAMP | 过期时间 |
| used | BOOLEAN | 是否已使用 |

### user_data 表
| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID |
| module | TEXT | 模块名 |
| data | TEXT | JSON数据 |
| version | INTEGER | 版本号 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 安全特性

1. **JWT认证**: 24小时有效期，自动过期
2. **验证码机制**: 6位数字，5分钟有效期，一次性使用
3. **权限验证**: 所有数据API需要有效Token
4. **数据隔离**: 用户只能访问自己的数据

---

## 测试状态

✅ 全部10项测试通过
- 发送验证码
- 用户注册
- 用户登录
- 获取用户信息
- 保存用户数据
- 获取用户数据
- 批量同步
- 获取所有数据
- 未授权访问阻止
- 错误Token阻止

---

*文档版本: v1.0 | 日期: 2026-05-05 | 状态: 生产就绪*
