// 职业导航仪组件 - v2.0 with Real AI
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { API_BASE } from '../services/api';

export default function CareerNavigator() {
  const { skillRadarData, userProfile } = useAppContext();

  const [position, setPosition] = useState('');
  const [skills, setSkills] = useState('');
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!position.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/career/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, skills, domain })
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || '分析失败');
    } catch { setError('网络连接失败'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"><div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧭 职业导航仪</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标岗位 *</label>
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="如：前端工程师"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前技能</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="如：React, JavaScript"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">行业领域</label>
            <select value={domain} onChange={e => setDomain(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">不限</option>
              <option value="互联网">互联网</option>
              <option value="金融">金融</option>
              <option value="医疗">医疗</option>
              <option value="教育">教育</option>
              <option value="制造">制造</option>
              <option value="能源">能源</option>
            </select>
          </div>
        </div>
        <button onClick={analyze} disabled={loading || !position.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition-all">
          {loading ? '🧭 分析中...' : '🚀 生成职业导航'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-500">技能匹配率</div>
              <div className="text-3xl font-bold text-blue-600">{result.skill_gap_analysis?.match_rate ?? '?'}%</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-500">当前薪资</div>
              <div className="text-xl font-bold text-green-600">{result.salary_projection?.current ?? '-'}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-500">目标薪资</div>
              <div className="text-xl font-bold text-purple-600">{result.salary_projection?.target ?? '-'}</div>
            </div>
          </div>

          {result.skill_gap_analysis && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 技能差距分析</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-green-700 mb-2">✅ 已匹配</div>
                  {(result.skill_gap_analysis.matched || []).map((s, i) => (
                    <span key={i} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-1 mb-1">{s}</span>
                  ))}
                </div>
                <div>
                  <div className="font-medium text-red-700 mb-2">⚠️ 待补充</div>
                  {(result.skill_gap_analysis.missing || []).map((s, i) => (
                    <span key={i} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-1 mb-1">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.path_steps?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🗺️ 发展路径</h3>
              <div className="space-y-4">
                {result.path_steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{step.step}</div>
                      {i < result.path_steps.length - 1 && <div className="w-0.5 h-full bg-blue-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="font-bold text-gray-800">{step.title}</div>
                      <div className="text-sm text-gray-500 mb-2">⏱ {step.duration}</div>
                      <div className="flex flex-wrap gap-1">
                        {(step.skills_to_acquire || []).map((s, j) => (
                          <span key={j} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.industry_insights?.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="font-medium text-yellow-800 mb-2">💡 行业洞察</div>
              <ul className="space-y-1">
                {result.industry_insights.map((s, i) => <li key={i} className="text-sm text-yellow-700">{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
      </div>
    </div>
  );
}