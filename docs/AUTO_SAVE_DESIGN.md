# CareerPath AI 自动保存与用户登录设计方案

## 一、自动保存方案对比

| 方案 | 实现方式 | 优点 | 缺点 | 适用场景 |
|:---|:---|:---|:---|:---|
| **A. 即时保存** | 每次输入变化立即保存 | 数据最安全 | 性能开销大，频繁写localStorage | 不适合高频输入 |
| **B. 防抖保存** | 停止输入1-2秒后保存 | 平衡安全与性能 | 快速切换页面可能丢失最后输入 | ✅ 推荐 |
| **C. 定时保存** | 每30秒保存一次 | 实现简单 | 可能丢失30秒内数据 | 低频操作 |
| **D. 事件保存** | 失焦/离开页面时保存 | 性能最好 | 浏览器崩溃时丢失数据 | 辅助方案 |

**推荐: B(防抖保存) + D(事件保存) 组合**

---

## 二、具体实现设计

### 2.1 自动保存Hook

```javascript
// hooks/useAutoSave.js
import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(data, saveFn, options = {}) {
  const { delay = 1500, key = 'autosave' } = options;
  const timerRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(data));
  
  // 防抖保存
  useEffect(() => {
    const currentData = JSON.stringify(data);
    
    // 数据未变化，不保存
    if (currentData === lastSavedRef.current) return;
    
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 设置新的防抖定时器
    timerRef.current = setTimeout(() => {
      saveFn(data);
      lastSavedRef.current = currentData;
      console.log(`[AutoSave] ${key} saved at ${new Date().toLocaleTimeString()}`);
    }, delay);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, saveFn, delay, key]);
  
  // 页面离开前强制保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveFn(data);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, saveFn]);
  
  // 手动保存方法
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    saveFn(data);
    lastSavedRef.current = JSON.stringify(data);
  }, [data, saveFn]);
  
  return { saveNow };
}
```

### 2.2 各模块集成

```javascript
// 示例: JDTranslator.jsx
function JDTranslator() {
  const { jdData, updateJdData } = useAppContext();
  const [inputText, setInputText] = useState(jdData.text || '');
  
  // 自动保存
  useAutoSave(
    { text: inputText },
    (data) => updateJdData(data),
    { delay: 1500, key: 'jd-translator' }
  );
  
  return (
    <textarea 
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      placeholder="粘贴JD内容..."
    />
  );
}
```

---

## 三、用户登录方案对比

| 方案 | 技术栈 | 优点 | 缺点 | 开发周期 |
|:---|:---|:---|:---|:---:|
| **A. 无登录(当前)** | localStorage | 零门槛，快速体验 | 数据无法跨设备，无法用户追踪 | - |
| **B. 邮箱+密码** | JWT + SQLite | 传统可靠 | 需要密码重置，用户体验差 | 2天 |
| **C. 手机号+验证码** | SMS API + JWT | 国内用户习惯 | 短信费用，依赖第三方 | 3天 |
| **D. 微信扫码** | OAuth2.0 | 国内最便捷 | 需要企业资质，审核周期长 | 5天+ |
| **E. GitHub/Google** | OAuth2.0 | 开发者友好 | 国内用户覆盖率低 | 2天 |
| **F. 游客+升级** | localStorage → 登录迁移 | 兼顾体验与功能 | 数据迁移逻辑复杂 | 3天 |

**推荐: F(游客+升级) 或 B(邮箱+密码)**

---

## 四、推荐方案: 渐进式用户系统

### 4.1 阶段1: 游客模式 (当前)
- 所有数据存localStorage
- 零门槛使用
- 页面提示: "登录后可跨设备同步"

### 4.2 阶段2: 快速登录 (MVP)
- 邮箱 + 验证码 (无密码)
- 登录后数据自动上传到服务器
- localStorage作为离线缓存

### 4.3 阶段3: 完整账户
- 密码设置
- 多设备同步
- 数据导出/备份

---

## 五、数据库设计

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 用户数据表 (JSON存储各模块数据)
CREATE TABLE user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL,  -- 'resume', 'jd', 'interview', etc.
    data JSON NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, module)
);

-- 操作日志 (用于数据恢复)
CREATE TABLE operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL,
    action TEXT NOT NULL,  -- 'create', 'update', 'delete'
    old_data JSON,
    new_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 六、API设计

```javascript
// 认证相关
POST /api/auth/register      // 注册
POST /api/auth/login         // 登录
POST /api/auth/verify-email  // 邮箱验证
POST /api/auth/refresh       // 刷新token

// 用户数据
GET    /api/user/profile           // 获取用户信息
PUT    /api/user/profile           // 更新用户信息
GET    /api/user/data/:module      // 获取模块数据
POST   /api/user/data/:module      // 保存模块数据
GET    /api/user/data              // 获取所有数据
POST   /api/user/sync              // 批量同步

// 游客数据迁移
POST /api/user/migrate             // 迁移localStorage数据到账户
```

---

## 七、前端集成

```javascript
// services/auth.js
class AuthService {
  async login(email, code) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('careerpath_token', data.token);
      // 同步本地数据到服务器
      await this.syncLocalData();
    }
    return data;
  }
  
  async syncLocalData() {
    const modules = ['user_profile', 'resume_data', 'jd_data', 'interview_data', 'skill_radar'];
    for (const module of modules) {
      const localData = localStorage.getItem(`careerpath_${module}`);
      if (localData) {
        await fetch(`${API_BASE}/api/user/data/${module}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
          },
          body: localData
        });
      }
    }
  }
  
  getToken() {
    return localStorage.getItem('careerpath_token');
  }
  
  isLoggedIn() {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
```

---

## 八、实施计划

| 阶段 | 任务 | 时间 | 优先级 |
|:---:|:---|:---:|:---:|
| **Day 1** | 实现useAutoSave Hook | 4h | 🔴 P0 |
| **Day 1** | 集成到5个核心模块 | 4h | 🔴 P0 |
| **Day 2** | 用户数据库设计 | 2h | 🟡 P1 |
| **Day 2** | 登录API开发 | 4h | 🟡 P1 |
| **Day 3** | 前端登录UI | 4h | 🟡 P1 |
| **Day 3** | 数据同步逻辑 | 4h | 🟡 P1 |
| **Day 4** | 测试与优化 | 4h | 🟢 P2 |

---

## 九、安全考虑

| 风险 | 缓解措施 |
|:---|:---|
| XSS攻击 | 所有用户输入转义，使用DOMPurify |
| CSRF攻击 | 使用JWT，SameSite cookie |
| 数据泄露 | 敏感字段加密存储 |
| 暴力破解 | 登录限流，验证码频率限制 |
| Token被盗 | 短有效期token + refresh机制 |

---

*设计版本: v1.0 | 日期: 2026-05-05 | 作者: Shirley AI*
