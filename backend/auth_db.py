# auth_db.py - 用户认证数据库操作
import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "auth.db"

def init_db():
    """初始化数据库"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # 用户表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    """)
    
    # 验证码表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verify_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT 0
        )
    """)
    
    # 用户数据表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module TEXT NOT NULL,
            data TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, module),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ 认证数据库初始化完成")

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

# 验证码操作
def save_verify_code(email: str, code: str, expires_minutes: int = 5):
    """保存验证码"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 清除该邮箱的旧验证码
    cursor.execute("DELETE FROM verify_codes WHERE email = ?", (email,))
    
    # 插入新验证码
    expires_at = datetime.now().timestamp() + (expires_minutes * 60)
    cursor.execute("""
        INSERT INTO verify_codes (email, code, expires_at)
        VALUES (?, ?, ?)
    """, (email, code, datetime.fromtimestamp(expires_at).isoformat()))
    
    conn.commit()
    conn.close()

def verify_code(email: str, code: str) -> bool:
    """验证验证码"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM verify_codes 
        WHERE email = ? AND code = ? AND used = 0 
        AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
    """, (email, code, datetime.now().isoformat()))
    
    result = cursor.fetchone()
    
    if result:
        # 标记为已使用
        cursor.execute("UPDATE verify_codes SET used = 1 WHERE id = ?", (result['id'],))
        conn.commit()
        conn.close()
        return True
    
    conn.close()
    return False

# 用户操作
def create_user(email: str, name: str = None) -> dict:
    """创建用户"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (email, name, last_login)
            VALUES (?, ?, ?)
        """, (email, name, datetime.now().isoformat()))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # 获取用户信息
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        return dict(user)
    except sqlite3.IntegrityError:
        conn.close()
        # 用户已存在，返回现有用户
        return get_user_by_email(email)

def get_user_by_email(email: str) -> dict:
    """通过邮箱获取用户"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    return dict(user) if user else None

def get_user_by_id(user_id: int) -> dict:
    """通过ID获取用户"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    return dict(user) if user else None

def update_last_login(user_id: int):
    """更新最后登录时间"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE users SET last_login = ? WHERE id = ?
    """, (datetime.now().isoformat(), user_id))
    
    conn.commit()
    conn.close()

# 用户数据操作
def save_user_data(user_id: int, module: str, data: dict):
    """保存用户数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    data_json = json.dumps(data, ensure_ascii=False)
    
    # 检查是否已存在
    cursor.execute("""
        SELECT id FROM user_data WHERE user_id = ? AND module = ?
    """, (user_id, module))
    
    existing = cursor.fetchone()
    
    if existing:
        # 更新
        cursor.execute("""
            UPDATE user_data 
            SET data = ?, version = version + 1, updated_at = ?
            WHERE user_id = ? AND module = ?
        """, (data_json, datetime.now().isoformat(), user_id, module))
    else:
        # 插入
        cursor.execute("""
            INSERT INTO user_data (user_id, module, data)
            VALUES (?, ?, ?)
        """, (user_id, module, data_json))
    
    conn.commit()
    conn.close()

def get_user_data(user_id: int, module: str = None):
    """获取用户数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    if module:
        cursor.execute("""
            SELECT * FROM user_data WHERE user_id = ? AND module = ?
        """, (user_id, module))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'module': result['module'],
                'data': json.loads(result['data']),
                'updated_at': result['updated_at']
            }
        return None
    else:
        cursor.execute("""
            SELECT * FROM user_data WHERE user_id = ?
        """, (user_id,))
        results = cursor.fetchall()
        conn.close()
        
        return [{
            'module': r['module'],
            'data': json.loads(r['data']),
            'updated_at': r['updated_at']
        } for r in results]

# 初始化数据库
init_db()
