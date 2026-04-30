import { useState } from 'react';

const API_BASE = 'http://localhost:8000';
const COMPANIES = ['字节跳动', '阿里巴巴', '腾讯', '华为', '比亚迪', '不限'];
const DOMAINS = [
  { id: '互联网', label: '💻 互联网/IT' },
  { id: '机械', label: '⚙️ 机械/制造' },
  { id: '能源', label: '🔋 能源/动力' },
  { id: '金融', label: '💰 金融/证券' },
  { id: '教育', label: '📚 教育/培训' },
  { id: '医疗', label: '🏥 医疗/医药' },
  { id: '其他', label: '📌 其他' },
];

export default function Interview() {
  const [step, setStep] = useState('setup');
  const [position, setPosition] = useState('');
  const [domain, setDomain] = useState('');
  const [company, setCompany] = useState('');
  const [mode, setMode] = useState('practice');
  const [skills, setSkills] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeInfo, setResumeInfo] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [history, setHistory] = useState([]);

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/resume/parse`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResumeText(data.text);
        const edu = data.education?.join(', ') || '';
        const ski = data.skills?.join(', ') || '';
        const exp = data.experience?.join(', ') || '';
        setResumeInfo(`📋 ${edu} | 🔧 ${ski.slice(0,100)} | 📝 ${exp.slice(0,100)}`);
      } else {
        setError('简历解析失败: ' + (data.error || ''));
      }
    } catch (e) { setError('上传失败'); }
    setLoading(false);
  };

  const startInterview = async () => {
    if (!position.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/interview/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, domain, company, mode, skills, resume_text: resumeText })
      });
      const data = await res.json();
      if (data.success && data.data?.questions) {
        setQuestions(data.data.questions);
        setCurrentQ(0); setAnswer(''); setFeedback(null); setHistory([]);
        setStep('questioning');
        if (mode !== 'practice') startTimer(data.data.questions[0]?.time_limit || 180);
      } else if (data.success && typeof data.data === 'string') {
        setQuestions([{ question: data.data, id: 1, type: '通用', difficulty: '中等', tips: '', time_limit: 180 }]);
        setStep('questioning');
      } else {
        setError(data.error || '生成面试题失败');
      }
    } catch (e) { setError('网络连接失败'); }
    setLoading(false);
  };

  const startTimer = (sec) => {
    setTimer(sec); setTimerRunning(true);
    const iv = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(iv); setTimerRunning(false); return 0; } return t - 1; });
    }, 1000);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true); setError(''); setTimerRunning(false);
    try {
      const q = questions[currentQ];
      const res = await fetch(`${API_BASE}/api/interview/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position, domain, company,
          question: q.question, question_type: q.type || '通用',
          answer, resume_context: resumeText.slice(0, 1000)
        })
      });
      const d = await res.json();
      if (d.success) {
        setFeedback(d.data);
        setHistory(prev => [...prev, { q: currentQ, question: q.question, answer, feedback: d.data }]);
      } else setError(d.error || '评分失败');
    } catch (e) { setError('网络连接失败'); }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(p => p + 1); setAnswer(''); setFeedback(null);
      const next = questions[currentQ + 1];
      if (mode !== 'practice' && next?.time_limit) startTimer(next.time_limit);
    } else setStep('setup');
  };

  const q = questions[currentQ];
  const timerColor = timer > 60 ? 'text-slate-600' : timer > 30 ? 'text-orange-500' : 'text-red-500 animate-pulse';

  // ===== Setup View =====
  if (step === 'setup') {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">🤖 AI 模拟面试</h2>
          <p className="text-slate-500 text-sm mt-1">上传简历 → AI根据简历内容出题 → 答题 → 获取专业评分</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Resume Upload */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">📄 上传简历（推荐）</label>
            <div onClick={() => document.getElementById('resumeInput').click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                resumeFile ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300'
              }`}>
              <input id="resumeInput" type="file" accept=".docx" className="hidden"
                onChange={(e) => e.target.files[0] && handleResumeUpload(e.target.files[0])} />
              {resumeFile ? (
                <div>
                  <span className="text-2xl">✅</span>
                  <p className="text-sm text-green-700 font-medium">{resumeFile.name}</p>
                  {resumeInfo && <p className="text-[11px] text-slate-500 mt-1">{resumeInfo.slice(0, 120)}</p>}
                </div>
              ) : (
                <div>
                  <span className="text-2xl">📎</span>
                  <p className="text-sm text-slate-500">点击上传简历 (.docx)</p>
                  <p className="text-xs text-slate-400 mt-0.5">AI会根据简历内容出针对性题目</p>
                </div>
              )}
            </div>
          </div>

          {/* Domain Selection */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🏭 行业领域</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DOMAINS.map(d => (
                <button key={d.id} onClick={() => setDomain(d.id)}
                  className={`text-xs px-2 py-2 rounded-lg text-center transition-all ${
                    domain === d.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-blue-50'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🎯 目标岗位</label>
            <input value={position} onChange={e => setPosition(e.target.value)}
              placeholder="例：机械设计师、能源工程师、产品经理"
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          {/* Company */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🏢 目标公司（可选）</label>
            <div className="flex gap-1.5 flex-wrap">
              {COMPANIES.map(c => (
                <button key={c} onClick={() => setCompany(c === company ? '' : c)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${company === c ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🎮 面试模式</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'practice', label: '🟢 练习', desc: '有答题提示' },
                { key: 'real', label: '🔴 实战', desc: '限时作答' },
                { key: 'pressure', label: '🟡 压力', desc: '追问质疑' },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${mode === m.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={startInterview} disabled={loading || !position.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
            {loading ? '⏳ AI正在生成面试题...' : '🎬 开始面试'}
          </button>

          {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm animate-fadeIn">❌ {error}</div>}
        </div>
      </div>
    );
  }

  // ===== Interview View =====
  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">🤖 AI 模拟面试</h2>
        <p className="text-slate-500 text-sm mt-1">
          {position} · {domain || '不限'} · {company || ''} · {mode === 'practice' ? '🟢 练习' : mode === 'real' ? '🔴 实战' : '🟡 压力'}
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-xs text-slate-400">问题 {currentQ + 1}/{questions.length}</span>
          {mode !== 'practice' && <span className={`text-sm font-mono font-bold ${timerColor}`}>⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>}
          <button onClick={() => setStep('setup')} className="text-xs px-3 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">重新开始</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {q && (
            <div className="animate-slideIn">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  q.type === '压力' ? 'bg-red-100 text-red-600' : q.type === '技术' || q.type === '专业' ? 'bg-purple-100 text-purple-600' : q.type === '行为' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>{q.type || '通用'}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${q.difficulty === '困难' ? 'bg-red-50 text-red-500' : q.difficulty === '中等' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{q.difficulty || '中等'}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 leading-relaxed">{q.question}</h3>
              {mode === 'practice' && q.tips && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                  <p className="text-xs text-blue-700 font-medium mb-1">💡 答题思路提示</p>
                  <p className="text-sm text-blue-600">{q.tips}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="font-semibold text-sm text-slate-700 block mb-2">📝 你的回答</label>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="输入你的回答..."
              className="w-full h-36 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div className="flex gap-3 mt-3">
            {!feedback ? (
              <button onClick={submitAnswer} disabled={loading || !answer.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                {loading ? '⏳ AI正在评分...' : '📊 提交并获取评分'}
              </button>
            ) : (
              <button onClick={nextQuestion}
                className="flex-1 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md transition-all">
                {currentQ + 1 < questions.length ? '➡️ 下一题' : '✅ 完成面试'}
              </button>
            )}
          </div>
          {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">❌ {error}</div>}
        </div>

        {/* Feedback Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 面试反馈</h3>

          {!feedback && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4">🤖</div>
              <p>提交回答后获取专业评分</p>
              <p className="text-sm mt-2 text-slate-400">Doubao-1.5-think-pro 深度分析</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>AI 正在评估回答...</p>
              <p className="text-sm mt-2 text-slate-400">分析专业度 · 逻辑性 · 沟通表达 · 岗位匹配</p>
              <div className="mt-4 w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '45%'}}></div>
              </div>
            </div>
          )}

          {feedback && typeof feedback === 'object' && (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar animate-fadeIn">
              {/* Score */}
              <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-5xl font-bold" style={{color: (feedback.score || 5) >= 7 ? '#16a34a' : feedback.score >= 4 ? '#ca8a04' : '#dc2626'}}>
                  {feedback.score || '?'}/10
                </div>
                <p className="text-sm text-slate-500 mt-1">综合评分</p>
                {feedback.overall && <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto">{feedback.overall}</p>}
              </div>

              {/* 4-dimension scores */}
              {feedback.dimensions && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(feedback.dimensions).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{({'professional':'专业能力','communication':'沟通表达','logic':'逻辑思维','fit':'岗位匹配'})[k] || k}</span>
                        <span className={`font-semibold ${(v.score||5)>=7?'text-green-600':'text-orange-600'}`}>{v.score}/10</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width:`${(v.score||5)*10}%`}}></div>
                      </div>
                      {v.comment && <p className="text-[10px] text-slate-500 mt-1">{v.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-2">
                {feedback.strengths?.length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <h4 className="font-semibold text-xs text-green-700 mb-1.5">✅ 优点</h4>
                    <ul className="space-y-1">
                      {feedback.strengths.map((s, i) => <li key={i} className="flex gap-1.5 text-xs text-green-700"><span>✓</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.weaknesses?.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <h4 className="font-semibold text-xs text-orange-700 mb-1.5">⚠️ 可改进</h4>
                    <ul className="space-y-1">
                      {feedback.weaknesses.map((w, i) => <li key={i} className="flex gap-1.5 text-xs text-orange-700"><span>!</span>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Improved Answer */}
              {feedback.improved_answer && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-blue-700 mb-1.5">💡 参考答案</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">{feedback.improved_answer}</p>
                </div>
              )}

              {feedback.next_question_hint && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-purple-700 mb-1">🎯 面试官可能追问</h4>
                  <p className="text-xs text-purple-600">{feedback.next_question_hint}</p>
                </div>
              )}
            </div>
          )}

          {feedback && typeof feedback === 'string' && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{feedback}</div>
          )}
        </div>
      </div>
    </div>
  );
}
