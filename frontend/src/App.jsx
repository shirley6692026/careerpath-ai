import { useState } from 'react'
import JDTranslator from './JDTranslator'
import SkillRadar from './SkillRadar'
import Interview from './Interview'

function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
          <nav className="flex gap-1.5">
            {[
              { key: 'jd', label: '📄 JD翻译官' },
              { key: 'skill', label: '🎯 能力雷达' },
              { key: 'interview', label: '🤖 AI面试' },
            ].map(item => (
              <button key={item.key} onClick={() => setPage(item.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === item.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'jd' && <JDTranslator />}
        {page === 'skill' && <SkillRadar />}
        {page === 'interview' && <Interview />}
      </main>

      <footer className="text-center py-6 text-sm text-slate-400">
        <p>CareerPath AI v3.0 · 火山引擎 ARK · TRAE SOLO Challenge 2026 · 命题③</p>
      </footer>
    </div>
  );
}

function HomePage({ onNavigate }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
        🏆 TRAE SOLO Challenge 2026 · 命题③
      </div>
      <h2 className="text-4xl font-bold text-slate-800 mb-4">
        AI-Native 大学生<br/>求职导航系统
      </h2>
      <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
        基于 AI-Native 人力资本三支柱框架 + HAIC 人机协作指数
      </p>
      <div className="flex gap-4 justify-center mb-12 flex-wrap">
        <button onClick={() => onNavigate('jd')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all">
          📄 JD 翻译官
        </button>
        <button onClick={() => onNavigate('skill')}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:bg-purple-700 transition-all">
          🎯 能力雷达
        </button>
        <button onClick={() => onNavigate('interview')}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-all">
          🤖 AI 模拟面试
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
          <p className="text-sm text-slate-400 mt-1">职业导航 · 面试训练</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold text-slate-700">ASC 服务集群</h3>
          <p className="text-sm text-slate-400 mt-1">简历工坊 · 学习路径</p>
        </div>
      </div>
    </div>
  );
}

export default App
