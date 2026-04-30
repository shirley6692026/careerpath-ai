import { useState } from 'react';
import { jdTranslate } from './services/api';

const SAMPLES = [
  `【高级前端开发工程师】
岗位职责：
1. 负责核心业务系统的前端架构设计和开发
2. 参与技术方案评审，确保代码质量
3. 与后端、产品团队协作完成项目交付
任职要求：
1. 3年以上前端开发经验
2. 精通React/Vue等主流框架
3. 熟悉Node.js，有全栈经验优先
4. 良好的沟通协作能力`,
  `【产品经理】
岗位职责：
1. 负责产品的需求调研、功能规划和迭代
2. 撰写PRD，跟进研发测试全流程
3. 分析用户数据，驱动产品优化
任职要求：
1. 2年以上互联网产品经验
2. 有数据分析能力和用户洞察
3. 熟悉Axure/Figma等工具
4. 较强的逻辑思维和沟通能力`,
];

export default function JDTranslator() {
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await jdTranslate(jdText);
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

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">📄 JD 翻译官</h2>
        <p className="text-slate-500 mt-1">把招聘 JD 翻译成真实工作日常，看懂企业的真实需求</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-slate-700">粘贴招聘 JD</label>
            {!jdText && <span className="text-xs text-slate-400">试试示例</span>}
          </div>
          
          {!jdText && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => setJdText(s)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                  示例 {i + 1}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="在这里粘贴招聘 JD 文本或链接..."
            className="w-full h-64 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          
          <button
            onClick={handleTranslate}
            disabled={loading || !jdText.trim()}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all ${
              loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                豆包正在分析...
              </span>
            ) : '🔍 开始分析 JD'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 分析结果</h3>
          
          {!result && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4">🔍</div>
              <p>粘贴 JD 并点击分析</p>
              <p className="text-sm mt-2">基于 Doubao-1.5-pro 大模型</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>AI 正在解析 JD...</p>
              <p className="text-sm mt-2">正在分析能力要求、薪资结构、隐藏需求</p>
            </div>
          )}

          {result && typeof result === 'object' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
              {/* Daily Work */}
              <Section title="📋 真实工作日常" color="blue">
                {Array.isArray(result.daily_work) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {result.daily_work.map((item, i) => (
                      <li key={i} className="text-sm text-slate-700">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">{result.daily_work}</p>
                )}
              </Section>

              {/* Skills */}
              <div className="grid grid-cols-2 gap-3">
                {result.hard_skills && (
                  <Section title="🔧 硬技能" color="green">
                    <Tags items={result.hard_skills} />
                  </Section>
                )}
                {result.soft_skills && (
                  <Section title="💬 软技能" color="purple">
                    <Tags items={result.soft_skills} />
                  </Section>
                )}
              </div>

              {/* Hidden */}
              {result.hidden_requirements && (
                <Section title="🔍 隐藏要求" color="orange">
                  <Tags items={result.hidden_requirements} color="orange" />
                </Section>
              )}

              {/* Salary */}
              {result.salary_estimate && (
                <Section title="💰 薪资拆解" color="green">
                  <div className="text-sm space-y-1">
                    {result.salary_estimate.base && <p>基础薪资: {result.salary_estimate.base}</p>}
                    {result.salary_estimate.year_end && <p>年终奖金: {result.salary_estimate.year_end}</p>}
                    {result.salary_estimate.total && <p className="font-semibold text-green-700">预估年薪: {result.salary_estimate.total}</p>}
                  </div>
                </Section>
              )}

              {/* Interview */}
              {result.interview_focus && (
                <Section title="🎯 面试重点" color="red">
                  <Tags items={result.interview_focus} color="red" />
                </Section>
              )}

              {/* Match Advice */}
              {result.match_advice && (
                <Section title="💡 匹配建议" color="blue">
                  <p className="text-sm text-slate-700">{result.match_advice}</p>
                </Section>
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

function Section({ title, color, children }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    red: 'border-red-200 bg-red-50',
  };
  return (
    <div className={`p-4 rounded-lg border ${colors[color] || colors.blue}`}>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Tags({ items, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Array.isArray(items) ? items : [items]).map((item, i) => (
        <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${colors[color] || colors.blue}`}>
          {item}
        </span>
      ))}
    </div>
  );
}
