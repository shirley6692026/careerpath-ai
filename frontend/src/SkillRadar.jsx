import { useState } from 'react';
import { skillRadar } from './services/api';

const JOB_EXAMPLES = ['前端开发工程师', '产品经理', '数据分析师', '后端开发', 'UI/UX设计师'];
const SKILL_EXAMPLES = 'React, JavaScript, Python, 项目管理, Photoshop, Excel, 小红书运营, 团队协作';

export default function SkillRadar() {
  const [skills, setSkills] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!skills.trim() || !targetJob.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await skillRadar(skills, targetJob);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || '分析失败');
      }
    } catch (e) {
      setError('网络错误，请检查后端服务是否运行');
    }
    setLoading(false);
  };

  const matchPercent = result?.match_score ?? 50;
  const matchColor = matchPercent >= 70 ? 'text-green-600' : matchPercent >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">🎯 能力雷达</h2>
        <p className="text-slate-500 mt-1">分析你的技能与目标岗位的匹配度，发现可迁移能力</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1">目标岗位</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {JOB_EXAMPLES.map(job => (
                <button key={job} onClick={() => setTargetJob(job)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    targetJob === job ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}>
                  {job}
                </button>
              ))}
            </div>
            <input
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="输入目标岗位名称..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1">你的技能</label>
            {!skills && (
              <p className="text-xs text-slate-400 mb-2">💡 提示：可以列举技术栈、项目经历、社团经验、工具使用等</p>
            )}
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={SKILL_EXAMPLES}
              className="w-full h-40 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !skills.trim() || !targetJob.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              loading ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 shadow-md'
            }`}
          >
            {loading ? '🎯 豆包正在分析能力...' : '🎯 开始能力分析'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 能力分析报告</h3>

          {!result && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4">🎯</div>
              <p>输入技能和目标岗位</p>
              <p className="text-sm mt-2">基于 Doubao-1.5-pro 大模型分析</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>正在分析能力匹配度...</p>
              <p className="text-sm mt-2">发现可迁移能力、评估差距</p>
            </div>
          )}

          {result && typeof result === 'object' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
              {/* Match Score */}
              {result.match_score !== undefined && (
                <div className="text-center py-4">
                  <div className="text-5xl font-bold mb-1" style={{color: matchPercent >= 70 ? '#16a34a' : matchPercent >= 40 ? '#ca8a04' : '#dc2626'}}>
                    {result.match_score}%
                  </div>
                  <p className="text-sm text-slate-500">人岗匹配度</p>
                </div>
              )}

              {/* Radar-like visualization */}
              {result.user_skills && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📈 你的技能分布</h4>
                  <div className="space-y-2">
                    {result.user_skills.map((s, i) => (
                      <SkillBar key={i} name={s.name || s.skill} level={s.level || 5} color="blue" />
                    ))}
                  </div>
                </div>
              )}

              {result.required_skills && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📋 岗位要求技能</h4>
                  <div className="space-y-2">
                    {result.required_skills.map((s, i) => (
                      <SkillBar key={i} name={s.name || s.skill} level={s.importance || 5} color="purple" label="重要性" />
                    ))}
                  </div>
                </div>
              )}

              {/* Transferable Skills */}
              {result.transferable_skills && result.transferable_skills.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-green-700 mb-2">🔄 可迁移能力</h4>
                  <div className="space-y-2">
                    {result.transferable_skills.map((item, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg text-sm">
                        <span className="font-medium text-green-700">{item.skill || item.name}</span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.from && <>来源: {item.from} → </>}
                          可应用到: {item.to || targetJob}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {result.gaps && result.gaps.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-orange-700 mb-2">⚠️ 需要提升</h4>
                  <div className="space-y-1.5">
                    {result.gaps.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          g.priority === '高' ? 'bg-red-100 text-red-600' : g.priority === '中' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {g.priority || '中'}
                        </span>
                        <span className="text-slate-700">{g.skill || g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              {result.recommendations && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-700 mb-2">📚 提升建议</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {(result.recommendations || []).map((rec, i) => (
                      <li key={i} className="text-slate-700">{rec}</li>
                    ))}
                    {result.roadmap_1m && <li className="text-blue-600 font-medium">📅 1个月计划: {result.roadmap_1m.join(' → ')}</li>}
                    {result.roadmap_3m && <li className="text-blue-600 font-medium">📅 3个月计划: {result.roadmap_3m.join(' → ')}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result && typeof result === 'string' && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillBar({ name, level, color = 'blue', label }) {
  const colors = {
    blue: { bg: 'bg-blue-100', fill: 'bg-blue-600' },
    purple: { bg: 'bg-purple-100', fill: 'bg-purple-600' },
    green: { bg: 'bg-green-100', fill: 'bg-green-600' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-600">{name}</span>
        <span className="text-slate-400">{level}/10 {label || '水平'}</span>
      </div>
      <div className={`h-2 rounded-full ${c.bg}`}>
        <div className={`h-2 rounded-full ${c.fill} transition-all`} style={{width: `${level * 10}%`}}></div>
      </div>
    </div>
  );
}
