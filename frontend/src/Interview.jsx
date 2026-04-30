import { useState, useRef } from 'react';

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

const MODE_DETAILS = {
  practice: {
    label: '🟢 练习模式',
    desc: '不限时，有答题思路提示，注重学习',
    time: 600,
    frameworks: 'STAR行为面试·专业技术深挖·场景案例·岗位认知·情景判断'
  },
  real: {
    label: '🔴 实战模式',
    desc: '较长时间，模拟真实面试节奏',
    time: 300,
    frameworks: 'STAR深度追问·压力追问·案例分析·岗位匹配·优先级排序'
  },
  pressure: {
    label: '🟡 压力模式',
    desc: '限时回应，AI连续质疑挑战',
    time: 120,
    frameworks: '质疑挑战·角色扮演·限时决策·反转提问·否定反馈'
  },
};

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
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Voice input
  const startVoiceInput = () => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('⚠️ 当前浏览器不支持语音输入，请使用 Chrome 或 Edge');
      return;
    }
    // Request microphone permission explicitly
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(function(err) {
        setError('⚠️ 麦克风权限被拒绝。请在浏览器地址栏左侧点击🔒 → 网站设置 → 允许麦克风，然后刷新页面重试。');
        return;
      });
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;    // 不连续模式：一句话说完自动停
    recognition.interimResults = false; // 只拿最终结果，不要中间结果
    
    recognition.onresult = (event) => {
      // 只取最后一条最终结果，避免重复累积
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal) {
        const text = lastResult[0].transcript;
        setAnswer(prev => {
          // 如果当前文本框已有完全一样的内容则不追加
          if (prev.trim().endsWith(text.trim())) return prev;
          return prev ? prev + text : text;
        });
      }
    };
    
    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setError('🎤 麦克风被拒绝！请在浏览器地址栏左侧点击🔒 → 网站设置 → 允许麦克风，然后刷新页面。');
      } else {
        setError('🎤 语音识别出错: ' + event.error + '。请检查麦克风连接，或改用文字输入。');
      }
    };
    
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError('');
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    setError('');
    try {
      const answerData = history.map(h => ({
        question: h.question,
        score: h.feedback?.score || 0,
        strengths: h.feedback?.strengths || [],
        weaknesses: h.feedback?.weaknesses || []
      }));
      const res = await fetch(`${API_BASE}/api/interview/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerData, position, domain })
      });
      const d = await res.json();
      if (d.success) setSummary(d.data);
      else setSummary({ raw_text: d.error || '生成总结失败' });
    } catch (e) { setSummary({ raw_text: '网络错误' }); }
    setSummaryLoading(false);
    setShowSummary(true);
  };

  const loadPreparation = async () => {
    setPrepLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/interview/preparation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, domain, company })
      });
      const d = await res.json();
      if (d.success) setPrepData(d.data);
      else setPrepData({ raw_text: d.error || '获取失败' });
    } catch (e) { setPrepData({ raw_text: '网络错误' }); }
    setPrepLoading(false);
    setShowPrep(true);
  };

  const toggleVoice = () => {
    if (isRecording) stopVoiceInput();
    else startVoiceInput();
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file); setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/resume/parse`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResumeText(data.text);
        const edu = data.education?.join(', ') || '';
        const ski = data.skills?.join(', ') || '';
        const exp = data.experience?.join(', ') || '';
        setResumeInfo(`📋 ${edu} | 🔧 ${ski.slice(0,100)}`);
      } else setError('简历解析失败');
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
        const timeLimit = data.data.questions[0]?.time_limit || MODE_DETAILS[mode].time;
        startTimer(timeLimit);
      } else if (data.success && typeof data.data === 'string') {
        setQuestions([{ question: data.data, id: 1, type: '通用', difficulty: '中等', tips: '', time_limit: MODE_DETAILS[mode].time }]);
        setStep('questioning');
        startTimer(MODE_DETAILS[mode].time);
      } else setError(data.error || '生成失败');
    } catch (e) { setError('网络错误'); }
    setLoading(false);
  };

  const startTimer = (sec) => {
    setTimer(sec); setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); setTimerRunning(false); return 0; } return t - 1; });
    }, 1000);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true); setError('');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    try {
      const q = questions[currentQ];
      const res = await fetch(`${API_BASE}/api/interview/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position, domain, company, mode,
          question: q.question, question_type: q.type || '通用',
          answer, resume_context: resumeText.slice(0, 1000)
        })
      });
      const d = await res.json();
      if (d.success) {
        setFeedback(d.data);
      // If feedback is plain text (not JSON), still display it nicely
      if (typeof d.data === 'string') {
        setFeedback({ raw_text: d.data, _isPlainText: true });
      }
        setHistory(prev => [...prev, { q: currentQ, question: q.question, answer, feedback: d.data }]);
      } else setError(d.error || '评分失败');
    } catch (e) { setError('网络错误'); }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(p => p + 1); setAnswer(''); setFeedback(null);
      const next = questions[currentQ + 1];
      startTimer(next?.time_limit || MODE_DETAILS[mode].time);
    } else setStep('setup');
  };

  const q = questions[currentQ];
  const timerColor = timer > 120 ? 'text-slate-600' : timer > 60 ? 'text-orange-500' : 'text-red-500 animate-pulse';

  // ===== Summary View =====
  if (showSummary) {
    const s = summary;
    const isObj = s && typeof s === 'object' && !s._isPlainText && !s.raw_text;
    return (
      <div className="animate-fadeIn max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📊 面试总结报告</h2>
          <p className="text-slate-500 text-sm mt-1">
            {position} · {domain || '不限'} · {company || ''} · {MODE_DETAILS[mode].label}
          </p>
        </div>

        {summaryLoading && (
          <div className="text-center py-16 text-slate-400">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p>AI 正在生成面试总结...</p>
          </div>
        )}

        {isObj && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-5xl font-bold" style={{color: (s.overall_score || 0) >= 7 ? '#16a34a' : (s.overall_score || 0) >= 4 ? '#ca8a04' : '#dc2626'}}>
                {s.overall_score || 0}/10
              </div>
              <p className="text-sm text-slate-500 mt-1">综合评分（{s.total_questions || history.length}题平均）</p>
              {s.overall_assessment && <p className="text-sm text-slate-600 mt-3 max-w-lg mx-auto">{s.overall_assessment}</p>}
            </div>

            {/* Dimension Averages */}
            {s.dimension_averages && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-700 mb-3">📈 各维度平均分</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(s.dimension_averages).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{({'professional':'专业能力','communication':'沟通表达','logic':'逻辑思维','fit':'岗位匹配'})[k]||k}</span>
                        <span className="font-semibold" style={{color: v >= 7 ? '#16a34a' : '#ca8a04'}}>{v}/10</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${v * 10}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
              {s.top_strengths?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
                  <h3 className="font-semibold text-green-700 mb-2">✅ 整体优势</h3>
                  <ul className="space-y-1.5">
                    {s.top_strengths.map((st, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-green-500">✓</span>{st}</li>)}
                  </ul>
                </div>
              )}
              {s.key_improvements?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
                  <h3 className="font-semibold text-orange-700 mb-2">📈 提升方向</h3>
                  <ul className="space-y-1.5">
                    {s.key_improvements.map((imp, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-orange-500">!</span>{imp}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Plan */}
            {s.action_plan && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-700 mb-3">🎯 改进计划</h3>
                <div className="grid grid-cols-3 gap-3">
                  {s.action_plan.immediate && <PlanCard title="🟢 立即行动" content={s.action_plan.immediate} color="green" />}
                  {s.action_plan.short_term && <PlanCard title="🟡 短期提升(1-2周)" content={s.action_plan.short_term} color="yellow" />}
                  {s.action_plan.long_term && <PlanCard title="🔵 长期发展" content={s.action_plan.long_term} color="blue" />}
                </div>
              </div>
            )}

            {/* Etiquette & Follow-up */}
            <div className="grid grid-cols-2 gap-4">
              {s.etiquette_feedback && (
                <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-5">
                  <h3 className="font-semibold text-purple-700 mb-2">🎩 面试礼仪建议</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.etiquette_feedback}</p>
                </div>
              )}
              {s.follow_up_advice && (
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
                  <h3 className="font-semibold text-blue-700 mb-2">📧 面试后续跟进</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.follow_up_advice}</p>
                </div>
              )}
            </div>

            {/* Score History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-700 mb-3">📝 各题得分</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">{i+1}</span>
                    <span className="text-xs text-slate-600 flex-1 truncate">{h.question.slice(0, 50)}</span>
                    <span className={`text-sm font-bold ${(h.feedback?.score || 0) >= 7 ? 'text-green-600' : 'text-orange-600'}`}>{h.feedback?.score || 0}/10</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => { setShowSummary(false); setStep('setup'); }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all">
                🔄 再来一次
              </button>
              <button onClick={loadPreparation}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition-all">
                📋 面试全流程指南
              </button>
            </div>
          </div>
        )}

        {/* Plain text fallback */}
        {s && (s._isPlainText || s.raw_text) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s.raw_text || JSON.stringify(s, null, 2)}</div>
            <button onClick={() => { setShowSummary(false); setStep('setup'); }}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">🔄 再来一次</button>
          </div>
        )}
      </div>
    );
  }

  // ===== Preparation View =====
  if (showPrep) {
    const p = prepData;
    const isObj = p && typeof p === 'object' && !p._isPlainText && !p.raw_text;
    return (
      <div className="animate-fadeIn max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📋 面试全流程指南</h2>
          <p className="text-slate-500 text-sm mt-1">{position} · {domain || '不限'} · {company || '不限'}</p>
        </div>

        {prepLoading && (
          <div className="text-center py-16 text-slate-400">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p>AI 正在生成面试指南...</p>
          </div>
        )}

        {isObj && (
          <div className="space-y-4">
            {/* Before Interview */}
            {p.before_interview && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
                <h3 className="font-semibold text-blue-700 mb-3">📝 面试前准备</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  {p.before_interview.dress_code && <p><strong>👔 着装建议：</strong>{p.before_interview.dress_code}</p>}
                  {p.before_interview.preparation && <p><strong>📚 准备工作：</strong>{p.before_interview.preparation}</p>}
                  {p.before_interview.company_research && <p><strong>🔍 公司研究：</strong>{p.before_interview.company_research}</p>}
                  {p.before_interview.materials_to_bring && <p><strong>🎒 携带材料：</strong>{p.before_interview.materials_to_bring}</p>}
                  {p.before_interview.common_questions?.length > 0 && (
                    <div><strong>❓ 常见问题：</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {p.before_interview.common_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* During Interview */}
            {p.during_interview && (
              <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
                <h3 className="font-semibold text-green-700 mb-3">🎤 面试中表现</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {p.during_interview.etiquette && <InfoCard title="🎩 礼仪" content={p.during_interview.etiquette} />}
                  {p.during_interview.self_introduction && <InfoCard title="🗣️ 自我介绍" content={p.during_interview.self_introduction} />}
                  {p.during_interview.answering_skills && <InfoCard title="💡 答题技巧" content={p.during_interview.answering_skills} />}
                  {p.during_interview.body_language && <InfoCard title="🧍 肢体语言" content={p.during_interview.body_language} />}
                  {p.during_interview.questions_to_ask && (
                    <div className="col-span-2 bg-blue-50 p-3 rounded-lg">
                      <strong>🙋 可以反问面试官的问题：</strong>
                      <p className="mt-1">{p.during_interview.questions_to_ask}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* After Interview */}
            {p.after_interview && (
              <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-5">
                <h3 className="font-semibold text-purple-700 mb-3">📧 面试后跟进</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {p.after_interview.follow_up && <InfoCard title="📩 跟进方式" content={p.after_interview.follow_up} />}
                  {p.after_interview.thank_you_note && <InfoCard title="✉️ 感谢信" content={p.after_interview.thank_you_note} />}
                  {p.after_interview.next_steps && <InfoCard title="➡️ 后续安排" content={p.after_interview.next_steps} />}
                  {p.after_interview.negotiation && <InfoCard title="💰 谈薪技巧" content={p.after_interview.negotiation} />}
                  {p.after_interview.if_rejected && (
                    <div className="col-span-2 bg-orange-50 p-3 rounded-lg">
                      <strong>😌 被拒后：</strong>
                      <p className="mt-1">{p.after_interview.if_rejected}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {p.common_mistakes?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
                <h3 className="font-semibold text-red-700 mb-2">⚠️ 面试常见错误</h3>
                <ul className="space-y-1">
                  {p.common_mistakes.map((m, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-red-500">•</span>{m}</li>)}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => { setShowPrep(false); }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700">⬅️ 返回结果</button>
              <button onClick={() => { setShowPrep(false); setShowSummary(false); setStep('setup'); }}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700">🔄 开始新面试</button>
            </div>
          </div>
        )}

        {p && (p._isPlainText || p.raw_text) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{p.raw_text || JSON.stringify(p, null, 2)}</div>
          </div>
        )}
      </div>
    );
  }

  // ===== Setup View =====
  if (step === 'setup') {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">🤖 AI 模拟面试</h2>
          <p className="text-slate-500 text-sm mt-1">上传简历 → AI根据简历多框架出题 → 🎤 语音或文字回答 → 专业评分</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Resume Upload */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">📄 上传简历（推荐）</label>
            <div onClick={() => document.getElementById('resumeInput').click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${resumeFile ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300'}`}>
              <input id="resumeInput" type="file" accept=".docx" className="hidden"
                onChange={(e) => e.target.files[0] && handleResumeUpload(e.target.files[0])} />
              {resumeFile ? (
                <div>
                  <span className="text-2xl">✅</span>
                  <p className="text-sm text-green-700 font-medium">{resumeFile.name}</p>
                  {resumeInfo && <p className="text-[11px] text-slate-500 mt-1">{resumeInfo}</p>}
                </div>
              ) : (
                <div>
                  <span className="text-2xl">📎</span>
                  <p className="text-sm text-slate-500">点击上传简历 (.docx)</p>
                  <p className="text-xs text-slate-400 mt-0.5">AI会根据简历内容，使用STAR/案例分析/压力测试等框架出题</p>
                </div>
              )}
            </div>
          </div>

          {/* Domain */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🏭 行业领域</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DOMAINS.map(d => (
                <button key={d.id} onClick={() => setDomain(d.id)}
                  className={`text-xs px-2 py-2 rounded-lg text-center transition-all ${domain === d.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-blue-50'}`}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Position + Company */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">🎯 目标岗位</label>
              <input value={position} onChange={e => setPosition(e.target.value)}
                placeholder="例：机械设计师" className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">🏢 公司</label>
              <div className="flex gap-1 flex-wrap">
                {COMPANIES.map(c => (
                  <button key={c} onClick={() => setCompany(c === company ? '' : c)}
                    className={`text-xs px-2.5 py-1.5 rounded-full transition-all ${company === c ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mb-4">
            <label className="font-semibold text-slate-700 block mb-1.5">🎮 面试模式</label>
            <div className="flex gap-2">
              {Object.entries(MODE_DETAILS).map(([key, val]) => (
                <button key={key} onClick={() => setMode(key)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${mode === key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}>
                  <p className="font-semibold text-sm">{val.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{val.desc}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{val.frameworks}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={startInterview} disabled={loading || !position.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
            {loading ? '⏳ AI正在生成面试题...' : '🎬 开始面试'}
          </button>
          {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">❌ {error}</div>}
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
          {position} · {domain || '不限'} · {company || ''} · {MODE_DETAILS[mode].label}
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-xs text-slate-400">问题 {currentQ + 1}/{questions.length}</span>
          <span className={`text-sm font-mono font-bold ${timerColor}`}>⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
          
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
            {mode === 'practice' ? '🟢 不限时学习' : mode === 'real' ? '🔴 标准时长' : '🟡 限时挑战'}
          </span>
          <button onClick={() => setStep('setup')} className="text-xs px-3 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">
            重新开始
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question + Answer Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {q && (
            <div className="animate-slideIn">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  q.type === '压力' || q.type === 'STAR行为' ? 'bg-purple-100 text-purple-600' : q.type === '专业技术' ? 'bg-blue-100 text-blue-600' : q.type === '场景案例' || q.type === '案例分析' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                }`}>{q.type || '通用'}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${q.difficulty === '困难' ? 'bg-red-50 text-red-500' : q.difficulty === '中等' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{q.difficulty || '中等'}</span>
                {q.framework && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-full">{q.framework}</span>}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 leading-relaxed">{q.question}</h3>
              {mode === 'practice' && q.tips && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                  <p className="text-xs text-blue-700 font-medium mb-1">💡 {q.framework ? `${q.framework} 解题思路` : '答题思路提示'}</p>
                  <p className="text-sm text-blue-600">{q.tips}</p>
                </div>
              )}
            </div>
          )}

          {/* Answer Input with Voice */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-sm text-slate-700">📝 你的回答</label>
              <button onClick={toggleVoice}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {isRecording ? '🔴 点击停止' : '🎤 语音输入'}
              </button>
            </div>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder={isRecording ? '🎤 正在录音... 说话吧' : '输入你的回答，或点击🎤语音输入'}
              className={`w-full h-32 p-3 border rounded-lg resize-none focus:outline-none text-sm transition-all ${
                isRecording ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {isRecording && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>录音中... 说你的回答</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              💡 推荐：先用语音说出完整回答 → 再手动修改补充
            </p>
          </div>

          <div className="flex gap-3 mt-3">
            {!feedback ? (
              <button onClick={submitAnswer} disabled={loading || !answer.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                {loading ? '⏳ AI深度评估...' : '📊 提交评估'}
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
              <p className="text-sm mt-2 text-slate-400">Doubao深度分析 · 4维度评估 · 新知识补充</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>AI深度评估中...</p>
              <p className="text-sm mt-2 text-slate-400">分析专业度 · 逻辑性 · 沟通表达 · 岗位匹配</p>
              <div className="mt-4 w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '45%'}}></div>
              </div>
            </div>
          )}

          {feedback && typeof feedback === 'object' && (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar animate-fadeIn">
              <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-5xl font-bold" style={{color: (feedback.score || 5) >= 7 ? '#16a34a' : feedback.score >= 4 ? '#ca8a04' : '#dc2626'}}>
                  {feedback.score}/10
                </div>
                <p className="text-sm text-slate-500 mt-1">综合评分</p>
                {feedback.overall && <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto">{feedback.overall}</p>}
              </div>

              {feedback.dimensions && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(feedback.dimensions).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{({'professional':'专业能力','communication':'沟通表达','logic':'逻辑思维','fit':'岗位匹配'})[k]||k}</span>
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

              <div className="grid grid-cols-2 gap-2">
                {feedback.strengths?.length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <h4 className="font-semibold text-xs text-green-700 mb-1.5">✅ 亮点</h4>
                    <ul className="space-y-1">
                      {feedback.strengths.map((s, i) => <li key={i} className="flex gap-1.5 text-xs text-green-700"><span>✓</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.weaknesses?.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <h4 className="font-semibold text-xs text-orange-700 mb-1.5">⚠️ 可提升</h4>
                    <ul className="space-y-1">
                      {feedback.weaknesses.map((w, i) => <li key={i} className="flex gap-1.5 text-xs text-orange-700"><span>!</span>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {feedback.improved_answer && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-blue-700 mb-1.5">💡 参考答案（含新视角）</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">{feedback.improved_answer}</p>
                </div>
              )}

              {feedback.next_question_hint && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                  <h4 className="font-semibold text-xs text-purple-700 mb-1">🎯 面试官下一层追问</h4>
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


// Helper components for summary/prep views
function PlanCard({ title, content, color }) {
  const colors = { green: 'border-green-200 bg-green-50', yellow: 'border-yellow-200 bg-yellow-50', blue: 'border-blue-200 bg-blue-50' };
  return (
    <div className={`p-3 rounded-lg border ${colors[color] || colors.blue}`}>
      <h4 className="font-semibold text-xs mb-1">{title}</h4>
      <p className="text-xs text-slate-700 leading-relaxed">{content}</p>
    </div>
  );
}

function InfoCard({ title, content }) {
  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <strong className="text-xs block mb-0.5">{title}</strong>
      <p className="text-xs text-slate-600">{content}</p>
    </div>
  );
}
