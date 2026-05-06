// hooks/useAutoSave.js - 自动保存Hook
import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(data, saveFn, options = {}) {
  const { delay = 1500, key = 'autosave', enabled = true } = options;
  const timerRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(data));
  const isFirstRender = useRef(true);
  
  // 防抖保存
  useEffect(() => {
    if (!enabled) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
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
  }, [data, saveFn, delay, key, enabled]);
  
  // 页面离开前强制保存
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveFn(data);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, saveFn, enabled]);
  
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

export default useAutoSave;
