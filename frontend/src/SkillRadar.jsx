import { useState, useEffect } from 'react';
import { useAutoSave } from './hooks/useAutoSave';
import { useAppContext } from './context/AppContext';
import { skillRadar } from './services/api';

const JOB_EXAMPLES = ['产品经理', '前端开发工程师', '数据分析师', 'AI产品经理', '全栈开发'];

export default function SkillRadar() {
  const [skills, setSkills] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userProfile, updateUserProfile } = useAppContext();
  // 从全局Context预填共享信息
  useEffect(() => {
    if (userProfile.targetJob && !targetJob) {
      setTargetJob(userProfile.targetJob);
    }
  }, []);


  const handleAnalyze = async () => {
    if (!skills.trim() || !targetJob.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await skillRadar(skills, targetJob);
      if (res.success) setResult(res);
      else setError(res.error || '分析失败，请重试');
    } catch (e) {
      setError('网络连接失败');
    }
    setLoading(false);
  };

  const d = result?.data;
  const isJson = d && typeof d === 'object' && d.match_score !== undefined;
  const score = d?.match_score ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">🎯 能力雷达</h2>
        <p className="text-slate-500 mt-1">分析你的技能与目标岗位的差距，发现你还没意识到的可迁移能力</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🎯 目标岗位</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {JOB_EXAMPLES.map(job => (
                <button key={job} onClick={() => setTargetJob(job)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    targetJob === job ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}>
                  {job}
                </button>
              ))}
            </div>
            <input value={targetJob} onChange={(e) => setTargetJob(e.target.value)}
              placeholder="输入目标岗位名称..."
              className="w-full p-3 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">💪 你的技能与经历</label>
            {!skills && (
              <div className="bg-amber-50 p-2.5 rounded-lg mb-2 text-xs text-amber-700">
                💡 不仅写技术栈！社团经历、项目经验、兴趣爱好——AI会帮你发现可迁移能力
              </div>
            )}
            <textarea value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder={'例如:\nPython, React, MySQL\n曾运营小红书账号 (5000粉丝)\n组织过50人的校园活动\n会用Figma画原型图'}
              className="w-full h-44 p-3 border border-slate-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <button onClick={handleAnalyze}
            disabled={loading || !skills.trim() || !targetJob.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all transform active:scale-[0.97] ${
              loading ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 shadow-md'
            }`}>
            {loading ? '🎯 豆包正在分析...' : '🎯 开始能力雷达扫描'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm animate-fadeIn">
              ❌ {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 能力分析报告</h3>

          {!result && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4">🎯</div>
              <p>输入技能和目标岗位</p>
              <p className="text-sm mt-2 text-slate-400">Doubao-1.5-pro · 火山引擎 ARK</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>能力分析中...</p>
              <div className="mt-4 w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{width: '45%'}}></div>
              </div>
            </div>
          )}

          {isJson && (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
              <div className="text-center py-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <div className="text-5xl font-bold" style={{color: score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626'}}>
                  {score}%
                </div>
                <p className="text-sm text-slate-500 mt-1">人岗匹配度</p>
                {d.match_analysis && <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">{d.match_analysis}</p>}
              </div>

              {/* Transferable Skills */}
              {d.transferable_skills?.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-green-700 mb-2">🔄 可迁移能力发现</h4>
                  <div className="space-y-2">
                    {d.transferable_skills.map((item, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-green-100 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs flex items-center justify-center font-bold">{i+1}</span>
                          <span className="font-medium text-green-800">{item.skill || item.name}</span>
                          {item.impact && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.impact === '高' ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-700'}`}>{item.impact}影响</span>}
                        </div>
                        {item.from && <p className="text-[11px] text-slate-500 mt-1 ml-7">📎 来源: {item.from}</p>}
                        {item.to && <p className="text-[11px] text-blue-600 mt-0.5 ml-7">→ 迁移到: {item.to}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {d.gaps?.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-orange-700 mb-2">⚠️ 需要提升</h4>
                  <div className="space-y-1.5">
                    {d.gaps.map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-1.5">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          g.priority === '高' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>{g.priority || '中'}</span>
                        <div>
                          <span className="text-slate-700">{g.skill || g.name}</span>
                          {g.reason && <span className="text-slate-400 ml-1">· {g.reason}</span>}
                          {g.fix && <div className="text-[11px] text-blue-600 mt-0.5">💡 {g.fix}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              {d.roadmap && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-blue-700 mb-2">📚 学习路线图</h4>
                  {d.roadmap.month_1 && <Timeline title="1个月" items={d.roadmap.month_1} color="blue" />}
                  {d.roadmap.month_3 && <Timeline title="3个月" items={d.roadmap.month_3} color="indigo" />}
                  {d.roadmap.month_6 && <Timeline title="6个月" items={d.roadmap.month_6} color="purple" />}
                </div>
              )}

              {d.recommendations?.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-slate-600 mb-1.5">💡 综合建议</h4>
                  <ul className="space-y-1">
                    {d.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-blue-500 shrink-0">•</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result && !isJson && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-fadeIn">
              {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({ title, items, color }) {
  const colors = { blue: 'bg-blue-500', indigo: 'bg-indigo-500', purple: 'bg-purple-500' };
  return (
    <div className="mb-2">
      <h5 className="font-medium text-xs mb-1" style={{color: {blue: '#1d4ed8', indigo: '#4338ca', purple: '#7c3aed'}[color]}}>{title}</h5>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-slate-600">
            <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${colors[color]}`}></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
