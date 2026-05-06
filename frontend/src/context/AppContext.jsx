import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/auth';

// CareerPath AI 全局状态管理
// 打通各模块数据孤岛：简历 → JD → 面试 → 能力雷达

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ========== 用户画像 ==========
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_user_profile');
      return saved ? JSON.parse(saved) : {
        name: '',
        email: '',
        phone: '',
        school: '',
        major: '',
        graduationYear: '',
        targetJob: '',
        targetIndustry: '',
        skills: [],
        haicScore: null,
        createdAt: new Date().toISOString(),
      };
    } catch {
      return {};
    }
  });

  // ========== 简历数据 ==========
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_resume_data');
      return saved ? JSON.parse(saved) : {
        text: '',
        parsed: null,
        modules: null,
        versions: [],
        currentVersionId: null,
      };
    } catch {
      return {};
    }
  });

  // ========== JD数据 ==========
  const [jdData, setJdData] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_jd_data');
      return saved ? JSON.parse(saved) : {
        text: '',
        translated: null,
        keywords: [],
        skills: [],
        salary: null,
        company: '',
        position: '',
      };
    } catch {
      return {};
    }
  });

  // ========== 面试数据 ==========
  const [interviewData, setInterviewData] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_interview_data');
      return saved ? JSON.parse(saved) : {
        history: [],
        currentSession: null,
        scores: [],
        feedback: [],
      };
    } catch {
      return {};
    }
  });

  // ========== 登录状态 ==========
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isLoggedIn());
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_user_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ========== 能力雷达数据 ==========
  const [skillRadarData, setSkillRadarData] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpath_skill_radar');
      return saved ? JSON.parse(saved) : {
        skills: [],
        scores: {},
        targetSkills: [],
        gaps: [],
        lastAssessment: null,
      };
    } catch {
      return {};
    }
  });

  // ========== 全局状态方法 ==========
  
  const updateUserProfile = useCallback((updates) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('careerpath_user_profile', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateResumeData = useCallback((updates) => {
    setResumeData(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('careerpath_resume_data', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateJdData = useCallback((updates) => {
    setJdData(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('careerpath_jd_data', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateInterviewData = useCallback((updates) => {
    setInterviewData(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('careerpath_interview_data', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSkillRadarData = useCallback((updates) => {
    setSkillRadarData(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };

  // ========== 登录方法 ==========
  const login = useCallback(async (email, code) => {
    const result = await authService.login(email, code);
    if (result.success) {
      setIsLoggedIn(true);
      setUser(result.user);
      localStorage.setItem('careerpath_user_info', JSON.stringify(result.user));
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('careerpath_user_info');
  }, []);


      localStorage.setItem('careerpath_skill_radar', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    userProfile,
    resumeData,
    jdData,
    interviewData,
    skillRadarData,
    isLoggedIn,
    user,
    updateUserProfile,
    updateResumeData,
    updateJdData,
    updateInterviewData,
    updateSkillRadarData,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export default AppContext;
