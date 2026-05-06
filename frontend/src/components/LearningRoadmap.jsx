// 学习路线图组件 - v2.0 with Real AI
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { API_BASE } from '../services/api';

export default function LearningRoadmap() {
  const { skillRadarData, userProfile } = useAppContext();

  const [position, setPosition] = useState('');
  const [skills, setSkills] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!position.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/career/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, skills })
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || '生成失败');
    } catch { setError('网络连接失败'); }
    setLoading(false);
  };

  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
  const typeIcons = { course: '📚', book: '📖', project: '🚀', certificate: '🏆' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"><div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 学习路线</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标岗位 *</label>
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="如：全栈开发工程师"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前技能（可选）</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="如：HTML, CSS, JavaScript基础"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={generate} disabled={loading || !position.trim()}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition-all">
          {loading ? '📚 生成中...' : '🎯 生成学习路线'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          {result.overview && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <div className="text-xl font-bold text-gray-800 mb-1">{result.position}</div>
              <div className="text-gray-600">{result.overview}</div>
              {result.total_duration && <div className="text-sm text-gray-500 mt-2">⏱ 总时长: {result.total_duration}</div>}
            </div>
          )}

          {result.phases?.map((phase, pi) => (
            <div key={pi} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">{phase.phase}</h3>
                <span className="text-sm text-gray-500">⏱ {phase.duration}</span>
              </div>
              <div className="space-y-3">
                {phase.items?.map((item, ii) => (
                  <div key={ii} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{typeIcons[item.type] || '📌'}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[item.priority] || ''}`}>
                        {item.priority === 'high' ? '高优' : item.priority === 'medium' ? '中优' : '低优'}
                      </span>
                    </div>
                    {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {item.estimated_hours && <span>🕐 {item.estimated_hours}小时</span>}
                      {item.type && <span className="bg-gray-100 px-2 py-0.5 rounded">{item.type}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {result.practice_projects?.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="font-medium text-blue-800 mb-2">🚀 推荐实战项目</div>
              <ul className="space-y-1">
                {result.practice_projects.map((p, i) => <li key={i} className="text-sm text-blue-700">{p}</li>)}
              </ul>
            </div>
          )}

          {result.certifications?.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="font-medium text-yellow-800 mb-2">🏆 推荐证书</div>
              <ul className="space-y-1">
                {result.certifications.map((c, i) => <li key={i} className="text-sm text-yellow-700">{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
      </div>
  );
}