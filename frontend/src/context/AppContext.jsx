import { createContext, useContext, useState, useCallback } from 'react';

// 全局共享数据模型
const defaultState = {
  // 简历数据
  resume: {
    text: null,
    parsed: null,
    modules: null,
    targetJob: '',
    jobJd: '',
  },
  // 评分数据
  scores: {
    initial: null,     // 初评
    optimized: null,   // 优化后
    skillScores: null, // 技能熟练度
  },
  // 诊断结果
  diagnosis: null,
  // 优化结果
  optimization: {
    text: null,
    changes: [],
  },
  // JD分析结果
  jdAnalysis: null,
  // 能力雷达结果
  skillRadar: null,
  // 面试数据
  interview: {
    history: [],
    results: null,
  },
  // 全局共享的目标岗位
  sharedTargetJob: '',
  sharedJobJd: '',
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);

  // 通用更新器
  const updateState = useCallback((path, value) => {
    setState(prev => {
      if (typeof path === 'string') {
        const parts = path.split('.');
        const newState = { ...prev };
        let obj = newState;
        for (let i = 0; i < parts.length - 1; i++) {
          obj[parts[i]] = { ...obj[parts[i]] };
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
        return newState;
      } else if (typeof path === 'function') {
        return path(prev);
      }
      return { ...prev, ...path };
    });
  }, []);

  // 便捷方法：设置简历数据
  const setResume = useCallback((data) => {
    updateState('resume.text', data.text);
    updateState('resume.parsed', data.parsed);
    updateState('resume.modules', data.modules);
    if (data.targetJob) updateState('resume.targetJob', data.targetJob);
    if (data.jobJd) updateState('resume.jobJd', data.jobJd);
    // 同步到共享字段
    if (data.targetJob) updateState('sharedTargetJob', data.targetJob);
    if (data.jobJd) updateState('sharedJobJd', data.jobJd);
  }, [updateState]);

  // 便捷方法：设置评分数据
  const setScore = useCallback((type, data) => {
    updateState(`scores.${type}`, data);
    if (data?.skill_scores) {
      updateState('scores.skillScores', data.skill_scores);
    }
  }, [updateState]);

  // 便捷方法：设置优化结果
  const setOptimization = useCallback((data) => {
    updateState('optimization.text', data.optimized_text);
    updateState('optimization.changes', data.changes);
    if (data.new_score) updateState('scores.optimized', data.new_score);
    if (data.skill_scores) updateState('scores.skillScores', data.skill_scores);
  }, [updateState]);

  // 重置
  const resetAll = useCallback(() => setState(defaultState), []);

  return (
    <AppContext.Provider value={{
      state,
      updateState,
      setResume,
      setScore,
      setOptimization,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
