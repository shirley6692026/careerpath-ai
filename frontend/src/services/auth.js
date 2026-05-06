// services/auth.js - 用户认证服务
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

class AuthService {
  // ========== Token管理 ==========
  getToken() {
    return localStorage.getItem('careerpath_token');
  }
  
  setToken(token) {
    localStorage.setItem('careerpath_token', token);
  }
  
  clearToken() {
    localStorage.removeItem('careerpath_token');
  }
  
  isLoggedIn() {
    return !!this.getToken();
  }
  
  // ========== 认证API ==========
  async login(email, code) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (data.token) {
      this.setToken(data.token);
      // 同步本地数据到服务器
      await this.syncLocalData();
    }
    return data;
  }
  
  async register(email, name) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    return res.json();
  }
  
  async logout() {
    this.clearToken();
    // 可选: 调用服务器登出API
  }
  
  // ========== 数据同步 ==========
  async syncLocalData() {
    if (!this.isLoggedIn()) return;
    
    const modules = [
      'user_profile',
      'resume_data', 
      'jd_data',
      'interview_data',
      'skill_radar',
      'haic_data'
    ];
    
    for (const module of modules) {
      const localData = localStorage.getItem(`careerpath_${module}`);
      if (localData) {
        try {
          await fetch(`${API_BASE}/api/user/data/${module}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getToken()}`
            },
            body: localData
          });
          console.log(`[Sync] ${module} uploaded`);
        } catch (err) {
          console.error(`[Sync] ${module} failed:`, err);
        }
      }
    }
  }
  
  async fetchUserData(module) {
    if (!this.isLoggedIn()) {
      // 返回本地数据
      return localStorage.getItem(`careerpath_${module}`);
    }
    
    const res = await fetch(`${API_BASE}/api/user/data/${module}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      // 更新本地缓存
      localStorage.setItem(`careerpath_${module}`, JSON.stringify(data));
      return data;
    }
    
    // 服务器失败，返回本地数据
    return localStorage.getItem(`careerpath_${module}`);
  }
  
  // ========== 游客模式 ==========
  async migrateGuestData(email, code) {
    // 1. 登录/注册
    const loginResult = await this.login(email, code);
    if (!loginResult.success) return loginResult;
    
    // 2. 同步所有本地数据
    await this.syncLocalData();
    
    // 3. 清除游客标记
    localStorage.removeItem('careerpath_guest_mode');
    
    return { success: true, message: '数据迁移完成' };
  }
  
  // ========== 工具方法 ==========
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
export default authService;
