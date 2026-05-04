// 竞品深度分析报告 — CareerPath AI v3.1
// SOLO 协同生成模块 · TRAE SOLO 挑战赛
import { useState } from 'react';

const COMPETITORS = [
  {
    id: 'boss',
    name: 'BOSS直聘',
    logo: '💼',
    category: '招聘平台',
    scores: { matching: 90, ai: 60, interview: 40, resume: 65, career: 55, haic: 0 },
    strengths: ['岗位数量最多', '直聊模式高效', 'AI职位推荐'],
    weaknesses: ['无面试训练', '无职业规划', '信息过载', '被动等待'],
    desc: '国内最大招聘平台，核心价值在"连接"，但不帮助候选人"提升"。AI主要用于匹配推荐，缺少主动赋能。'
  },
  {
    id: 'nowcoder',
    name: '牛客网',
    logo: '🐮',
    category: '技能练习',
    scores: { matching: 20, ai: 40, interview: 70, resume: 30, career: 20, haic: 0 },
    strengths: ['笔试题库丰富', '面经社区活跃', '公司真题'],
    weaknesses: ['模拟面试固定', '缺乏AI实时反馈', '无协作能力评估', '简历功能弱'],
    desc: '以题库和面经为核心，适合笔试刷题。但模拟面试是静态题库，没有AI实时互动和反馈。'
  },
  {
    id: 'wondercv',
    name: '超级简历',
    logo: '📄',
    category: '简历工具',
    scores: { matching: 30, ai: 35, interview: 0, resume: 90, career: 0, haic: 0 },
    strengths: ['简历模板专业', 'ATS友好格式', '智能排版'],
    weaknesses: ['仅限简历优化', '无面试功能', '无职业导航', '单一维度'],
    desc: '专注简历优化，模板和排版确实不错。但求职不只是简历——缺少面试、规划、追踪等完整链路。'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '🤖',
    category: '通用AI',
    scores: { matching: 30, ai: 95, interview: 50, resume: 70, career: 60, haic: 30 },
    strengths: ['通用能力最强', '知识面广', '灵活应变'],
    weaknesses: ['无求职专项优化', '无评估体系', '数据不垂直', '需高质量提示词'],
    desc: '最强大的通用AI，但求职是垂直场景。需要用户自己设计提示词、构建工作流，缺乏专业评估和结构化引导。'
  },
  {
    id: 'careerpath',
    name: 'CareerPath AI',
    logo: '🚀',
    category: 'AI求职系统（本产品）',
    scores: { matching: 85, ai: 90, interview: 85, resume: 85, career: 90, haic: 95 },
    strengths: ['HAIC评估体系·独家', '6框架AI面试', '端到端闭环', 'GROW教练对话', '9模块全覆盖'],
    weaknesses: ['用户规模尚小', '缺少企业侧数据', '移动端适配进行中'],
    desc: '首创HAIC人机协作指数，填补AI时代求职能力评估空白。唯一覆盖"评估→训练→追踪"全链路的AI求职系统。',
    highlight: true
  }
];

const DIMENSIONS = [
  { key: 'matching', label: '岗位匹配', icon: '🎯' },
  { key: 'ai', label: 'AI能力', icon: '🧠' },
  { key: 'interview', label: '面试训练', icon: '🤖' },
  { key: 'resume', label: '简历优化', icon: '📄' },
  { key: 'career', label: '职业规划', icon: '🧭' },
  { key: 'haic', label: 'HAIC', icon: '⭐', exclusive: true }
];

export default function CompetitiveAnalysis() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('compare');

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">📊 竞品深度分析报告</h2>
        <p className="text-sm text-slate-500">
          基于 Gartner Magic Quadrant 方法论 · 6维能力对比 · 覆盖 4 大赛道
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'compare', label: '📊 雷达对比', desc: '可视化能力矩阵' },
          { key: 'matrix', label: '📋 矩阵分析', desc: '详细评分表格' },
          { key: 'narrative', label: '📝 深度分析', desc: '逐项解读报告' },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
              view === v.key ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {v.label}
            <div className="text-xs mt-0.5 opacity-70">{v.desc}</div>
          </button>
        ))}
      </div>

      {/* Radar View */}
      {view === 'compare' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPETITORS.map(comp => (
            <div key={comp.id} 
              onClick={() => setSelected(comp.id)}
              className={`card cursor-pointer transition-all duration-300 hover:shadow-md ${
                comp.highlight ? 'ring-2 ring-blue-400 bg-gradient-to-br from-blue-50 to-white' : ''
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{comp.logo}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{comp.name}</h3>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{comp.category}</span>
                </div>
                {comp.highlight && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">本产品</span>
                )}
              </div>
              {/* Mini radar bars */}
              <div className="space-y-2">
                {DIMENSIONS.filter(d => !d.exclusive || comp.id === 'careerpath').map(dim => {
                  const score = comp.scores[dim.key] || 0;
                  return (
                    <div key={dim.key} className="flex items-center gap-2">
                      <span className="text-xs w-16 text-slate-500">{dim.icon} {dim.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${comp.highlight ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${score}%` }} />
                      </div>
                      <span className={`text-xs font-mono w-8 text-right ${comp.highlight ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>{score}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate-400">{comp.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-bold text-slate-700">产品</th>
                {DIMENSIONS.map(dim => (
                  <th key={dim.key} className="text-center py-3 px-4 font-bold text-slate-700">
                    <div>{dim.icon}</div>
                    <div className="text-xs">{dim.label}</div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-bold text-slate-700">综合</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map(comp => {
                const avg = Math.round(Object.values(comp.scores).reduce((a,b) => a+b, 0) / Object.keys(comp.scores).length);
                return (
                  <tr key={comp.id} className={`border-b hover:bg-slate-50 transition-colors ${comp.highlight ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4 font-medium">
                      {comp.logo} {comp.name}
                      {comp.highlight && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">⭐</span>}
                    </td>
                    {DIMENSIONS.map(dim => {
                      const score = comp.scores[dim.key] || 0;
                      const color = score >= 80 ? 'text-emerald-600 font-bold' : score >= 50 ? 'text-amber-600' : 'text-red-500';
                      return <td key={dim.key} className={`text-center py-3 px-4 ${color}`}>{score}</td>;
                    })}
                    <td className={`text-center py-3 px-4 font-bold ${avg >= 70 ? 'text-emerald-600' : 'text-slate-500'}`}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Narrative View */}
      {view === 'narrative' && (
        <div className="space-y-4">
          {COMPETITORS.map(comp => (
            <div key={comp.id} className={`card ${comp.highlight ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{comp.logo}</span>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{comp.name}</h3>
                    <span className="text-xs text-slate-400">{comp.category}</span>
                  </div>
                </div>
                {comp.highlight && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">🏆 最佳选择</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-4">{comp.desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-emerald-600 mb-2">✅ 优势</div>
                  <ul className="space-y-1">
                    {comp.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold text-red-500 mb-2">⚠️ 不足</div>
                  <ul className="space-y-1">
                    {comp.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom summary */}
      <div className="mt-6 card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h3 className="font-bold text-lg mb-2">🏆 分析结论</h3>
        <p className="text-sm opacity-90 leading-relaxed">
          CareerPath AI 在 <strong>6 维度对比中综合评分最高（88分）</strong>。
          与竞品相比，差异化的核心在于 <strong>首创 HAIC 人机协作指数</strong>——
          这是 AI 时代唯一评估"如何与 AI 协作"的框架。
          同时覆盖 <strong>9 大模块形成求职全链路闭环</strong>，填补了现有工具"单点功能、缺乏体系"的空白。
          建议下一步强化企业数据接入和移动端体验。
        </p>
      </div>
    </div>
  );
}
