// components/LoginModal.jsx - 登录弹窗
import { useState } from 'react';
import { authService } from '../services/auth';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  if (!isOpen) return null;

  const sendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 调用发送验证码API
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setStep('code');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setError('发送验证码失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async () => {
    if (!code || code.length < 4) {
      setError('请输入有效的验证码');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(email, code);
      if (result.success) {
        onLogin?.(result.user);
        onClose();
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">{step === 'email' ? '登录 / 注册' : '输入验证码'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {step === 'email' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && sendCode()}
              />
            </div>
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              未注册邮箱将自动创建账户
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">验证码已发送至 {email}</p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="输入6位验证码"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && verifyLogin()}
              />
            </div>
            <button
              onClick={verifyLogin}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            <div className="flex justify-between text-sm">
              <button 
                onClick={() => setStep('email')} 
                className="text-slate-500 hover:text-slate-700"
              >
                更换邮箱
              </button>
              <button
                onClick={sendCode}
                disabled={countdown > 0}
                className="text-blue-600 hover:text-blue-700 disabled:text-slate-400"
              >
                {countdown > 0 ? `${countdown}秒后重发` : '重新发送'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            登录即表示同意 <a href="#" className="text-blue-600">用户协议</a> 和 <a href="#" className="text-blue-600">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}
