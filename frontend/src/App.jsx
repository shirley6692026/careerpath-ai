import { useState } from 'react'
import JDTranslator from './JDTranslator'
import SkillRadar from './SkillRadar'

function App() {
  const [page, setPage] = useState('home');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health on mount
  useState(() => {
    fetch('http://localhost:8000/health')
      .then(r => r.json())
      .then(d => setBackendStatus(d.status === 'healthy' ? 'ok' : 'error'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage('home')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              CP
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">CareerPath AI</h1>
              <p className="text-xs text-slate-400">AI-Native 求职导航</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={backendStatus} />
            <nav className="flex gap-2">
              <button
                onClick={() => setPage('jd')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === 'jd' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📄 JD 翻译官
              </button>
              <button
                onClick={() => setPage('skill')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === 'skill' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🎯 能力雷达
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {backendStatus === 'offline' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-700">
          ⚠️ 后端服务未运行 — 请执行 <code className="bg-yellow-100 px-1 rounded">cd backend && python3 main.py</code>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'jd' && <JDTranslator />}
        {page === 'skill' && <SkillRadar />}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400">
        <p>CareerPath AI v3.0 · 火山引擎 ARK (Doubao-1.5-pro) · TRAE SOLO Challenge 2026</p>
      </footer>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = { ok: 'bg-green-500', error: 'bg-red-500', checking: 'bg-yellow-400', offline: 'bg-gray-400' };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`}></div>
      <span className="text-xs text-slate-400">
        {status === 'ok' ? 'Doubao在线' : status === 'offline' ? '离线' : '检查中...'}
      </span>
    </div>
  );
}

function HomePage({ onNavigate }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
        🏆 TRAE SOLO Challenge 2026 · 命题③
      </div>
      <h2 className="text-4xl font-bold text-slate-800 mb-4">
        AI-Native 大学生<br/>求职导航系统
      </h2>
      <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
        基于 AI-Native 人力资本三支柱框架，结合 HAIC 人机协作指数，
        帮助大学生在 AI 时代具备求职竞争力
      </p>
      <div className="flex gap-4 justify-center mb-16">
        <button onClick={() => onNavigate('jd')}
          className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all text-lg">
          🚀 开始 JD 翻译官
        </button>
        <button onClick={() => onNavigate('skill')}
          className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg border border-blue-200 hover:bg-blue-50 transition-all text-lg">
          🎯 能力雷达
        </button>
      </div>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-3">🧠</div>
          <h3 className="font-semibold text-slate-700">AIC 智能中心</h3>
          <p className="text-sm text-slate-400 mt-1">JD分析 · 能力评估 · 市场洞察</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="font-semibold text-slate-700">AHP 人力伙伴</h3>
          <p className="text-sm text-slate-400 mt-1">职业导航 · 面试训练 · HAIC教练</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold text-slate-700">ASC 服务集群</h3>
          <p className="text-sm text-slate-400 mt-1">简历工坊 · 学习路径 · 仪表盘</p>
        </div>
      </div>
    </div>
  );
}

export default App
