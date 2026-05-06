// 竞品深度分析报告 — CareerPath AI v3.1
// 从后端API获取数据，支持动态更新
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function CompetitiveAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('compare');

  useEffect(() => {
    fetch(`${API_BASE}/api/competitive/analysis`)
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          setError('数据加载失败');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-5xl mb-4">⏳</div>
        <p className="text-slate-500">正在加载竞品分析数据...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          重试
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { competitors, dimensions, advantages, market_position } = data;
  const careerpath = competitors.find(c => c.id === 'careerpath');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">📊 竞品深度分析报告</h2>
          <p className="text-sm text-slate-500">
            基于 Gartner Magic Quadrant 方法论 · 6维能力对比 · 覆盖 4 大赛道
          </p>
          <p className="text-xs text-slate-400 mt-1">
            数据更新时间: {new Date(data.generated_at).toLocaleString('zh-CN')}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setView('compare')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'compare' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            对比视图
          </button>
          <button onClick={() => setView('advantage')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'advantage' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            优势分析
          </button>
          <button onClick={() => setView('quadrant')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'quadrant' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            市场定位
          </button>
        </div>

        {/* Compare View */}
        {view === 'compare' && (
          <div className="space-y-6">
            {/* Competitor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map(comp => (
                <div key={comp.id} 
                  className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all hover:shadow-md ${comp.highlight ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-100'}`}
                  onClick={() => setSelected(selected === comp.id ? null : comp.id)}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{comp.logo}</span>
                    <div>
                      <h3 className="font-bold text-slate-800">{comp.name}</h3>
                      <p className="text-xs text-slate-400">{comp.category}</p>
                    </div>
                  </div>
                  
                  {/* Score Bars */}
                  <div className="space-y-2">
                    {dimensions.map(dim => (
                      <div key={dim.key} className="flex items-center gap-2">
                        <span className="text-xs w-16 text-slate-500">{dim.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${comp.scores[dim.key]}%`,
                              backgroundColor: comp.highlight ? '#3b82f6' : '#94a3b8'
                            }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{comp.scores[dim.key]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expanded Detail */}
                  {selected === comp.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-600 mb-3">{comp.desc}</p>
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-green-600">优势:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comp.strengths.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-red-600">劣势:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comp.weaknesses.map((w, i) => (
                            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">{w}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4">📈 六维能力对比表</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3">竞品</th>
                      {dimensions.map(dim => (
                        <th key={dim.key} className="text-center py-2 px-3">{dim.icon} {dim.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map(comp => (
                      <tr key={comp.id} className={`border-b border-slate-100 ${comp.highlight ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 px-3 font-medium">{comp.logo} {comp.name}</td>
                        {dimensions.map(dim => {
                          const score = comp.scores[dim.key];
                          let color = 'text-slate-600';
                          if (score >= 80) color = 'text-green-600 font-bold';
                          else if (score >= 60) color = 'text-blue-600';
                          else if (score >= 40) color = 'text-yellow-600';
                          else if (score > 0) color = 'text-red-600';
                          return (
                            <td key={dim.key} className={`text-center py-2 px-3 ${color}`}>
                              {score > 0 ? score : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Advantage View */}
        {view === 'advantage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4">🚀 CareerPath AI 核心优势</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advantages.map((adv, i) => (
                  <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-800">{adv.dimension}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{adv.significance}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{adv.careerpath_score}</div>
                        <div className="text-xs text-slate-500">CareerPath</div>
                      </div>
                      <div className="text-slate-300">vs</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-400">{adv.market_avg}</div>
                        <div className="text-xs text-slate-500">市场平均</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{adv.gap}</div>
                        <div className="text-xs text-slate-500">领先</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlight Card */}
            {careerpath && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">⭐ {careerpath.name} — {careerpath.category}</h3>
                <p className="text-blue-100 mb-4">{careerpath.desc}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {careerpath.strengths.map((s, i) => (
                    <div key={i} className="bg-white/20 rounded-lg p-3 text-sm">{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quadrant View */}
        {view === 'quadrant' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">📍 Gartner Magic Quadrant 定位</h3>
            <div className="relative h-96 bg-slate-50 rounded-lg p-4">
              {/* Axes */}
              <div className="absolute inset-x-4 top-1/2 h-px bg-slate-300" />
              <div className="absolute inset-y-4 left-1/2 w-px bg-slate-300" />
              
              {/* Labels */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-500">领导者</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500">利基玩家</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 -rotate-90">挑战者</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 rotate-90">远见者</span>
              
              {/* Axis Names */}
              <span className="absolute bottom-2 right-4 text-xs text-slate-400">{market_position.x_axis} →</span>
              <span className="absolute top-4 left-2 text-xs text-slate-400">↑ {market_position.y_axis}</span>
              
              {/* CareerPath Position */}
              <div className="absolute" style={{
                left: `${market_position.careerpath.x}%`,
                top: `${100 - market_position.careerpath.y}%`,
                transform: 'translate(-50%, -50%)'
              }}>
                <div className="w-4 h-4 bg-blue-600 rounded-full shadow-lg animate-pulse" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  CareerPath AI
                </div>
              </div>
              
              {/* Other competitors */}
              {competitors.filter(c => c.id !== 'careerpath').map((comp, i) => (
                <div key={comp.id} className="absolute" style={{
                  left: `${comp.scores.ai}%`,
                  top: `${100 - (comp.scores.matching + comp.scores.interview + comp.scores.resume + comp.scores.career) / 4}%`,
                  transform: 'translate(-50%, -50%)'
                }}>
                  <div className="w-3 h-3 bg-slate-400 rounded-full" />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-500">
                    {comp.name}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">{market_position.insight}</p>
          </div>
        )}
      </div>
    </div>
      </div>
    </div>
    </div>
    </div>
    </div>
);
}