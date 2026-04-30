import { useState, useCallback } from 'react';
import { jdTranslate } from './services/api';

const API_BASE = 'http://localhost:8000';

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
  `【高级AI产品经理】
岗位职责：
1. 负责AI产品的需求分析、功能规划和迭代管理
2. 深入理解大模型技术能力，将技术与用户需求结合
3. 撰写PRD，协同研发、设计、测试团队推进项目
4. 跟踪行业动态和竞品分析，制定产品策略
任职要求：
1. 3年以上互联网产品经验，有AI产品经验优先
2. 对AI技术有基本理解和学习能力
3. 出色的逻辑分析和数据驱动决策能力
4. 优秀的跨团队沟通协调能力`,
];

export default function JDTranslator() {
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [showOcr, setShowOcr] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleTranslate = async () => {
    if (!jdText.trim()) return;
    setLoading(true); setError(''); setResult(null); setShowOcr(false);
    try {
      const res = await jdTranslate(jdText);
      if (res.success) setResult(res);
      else setError(res.error || '分析失败');
    } catch (e) { setError('网络错误，请检查后端'); }
    setLoading(false);
  };

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/jd-from-image`, {
        method: 'POST', body: formData
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setOcrText(data.ocr_text || '');
        setJdText(data.ocr_text || '');
        if (data.ocr_text) setShowOcr(true);
      } else {
        setError(data.error || '识别失败');
      }
    } catch (e) { setError('上传失败'); }
    setLoading(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  }, [handleImageUpload]);

  const d = result?.data;
  const isJson = d && typeof d === 'object' && !Array.isArray(d);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">📄 JD 翻译官</h2>
        <p className="text-slate-500 mt-1">粘贴文字JD 或 上传图片 → 看懂企业的真实需求</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* 图片上传 */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('imgInput')?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <input id="imgInput" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])} />
            <div className="text-3xl mb-2">📸</div>
            <p className="text-sm text-slate-500">拖拽图片到此处 或 点击上传</p>
            <p className="text-xs text-slate-400 mt-1">支持：脉脉/朋友圈分享的JD截图</p>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">或直接粘贴文字</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => { setJdText(s); setShowOcr(false); }}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all">
                示例 {i + 1}
              </button>
            ))}
          </div>

          <textarea
            value={jdText}
            onChange={(e) => { setJdText(e.target.value); setShowOcr(false); }}
            placeholder="粘贴招聘 JD 文本，或上传图片自动填充..."
            className="w-full h-48 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />

          {showOcr && (
            <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-lg text-xs flex items-center gap-2">
              ✅ OCR已提取 {ocrText.length} 字
              <button onClick={() => setShowOcr(false)} className="text-green-500 hover:text-green-700">隐藏</button>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={loading || !jdText.trim()}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-[0.98] ${
              loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="animate-pulse">豆包正在深度分析...</span>
              </span>
            ) : '🔍 AI 分析 JD'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fadeIn">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 分析结果</h3>
          
          {!result && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4 animate-bounce">🔍</div>
              <p>粘贴 JD 或上传截图开始分析</p>
              <p className="text-sm mt-2 text-slate-400">基于 Doubao-1.5-pro · 火山引擎 ARK</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>AI 正在解析 JD...</p>
              <p className="text-sm mt-2 text-slate-400">分析能力要求 · 拆解薪资 · 识别隐藏需求</p>
              <div className="mt-4 w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          )}

          {/* Structured JSON Output */}
          {isJson && (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
              <AnimatedSection>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-semibold text-sm text-slate-700">真实工作日常</h4>
                </div>
                <ul className="space-y-1.5">
                  {(d.daily_work || []).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                      {typeof item === 'object' ? (item.content || item.name || JSON.stringify(item)) : item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>

              <AnimatedSection delay="100ms">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-xs text-blue-700 mb-1.5">🔧 硬技能</h4>
                    <div className="flex flex-wrap gap-1">
                      {(d.hard_skills || []).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {typeof s === 'object' ? (s.name || JSON.stringify(s)) : s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <h4 className="font-semibold text-xs text-purple-700 mb-1.5">💬 软技能</h4>
                    <div className="flex flex-wrap gap-1">
                      {(d.soft_skills || []).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {typeof s === 'object' ? (s.name || JSON.stringify(s)) : s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {d.hidden_requirements && d.hidden_requirements.length > 0 && (
                <AnimatedSection delay="200ms">
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-xs text-orange-700 mb-1.5">🔍 隐藏要求</h4>
                    <div className="flex flex-wrap gap-1">
                      {d.hidden_requirements.map((hr, i) => (
                        <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {typeof hr === 'object' ? (hr.name || JSON.stringify(hr)) : hr}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {d.salary_info && (
                <AnimatedSection delay="300ms">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-xs text-green-700 mb-1.5">💰 薪资拆解</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {d.salary_info.base && <div><span className="text-slate-500">Base</span><br/><span className="font-semibold text-green-700">{d.salary_info.base}</span></div>}
                      {d.salary_info.year_end && <div><span className="text-slate-500">年终</span><br/><span className="font-semibold text-green-700">{d.salary_info.year_end}</span></div>}
                      {d.salary_info.total_annual && <div><span className="text-slate-500">年薪</span><br/><span className="font-semibold text-green-700">{d.salary_info.total_annual}</span></div>}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {d.interview_focus && d.interview_focus.length > 0 && (
                <AnimatedSection delay="400ms">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-xs text-red-700 mb-1.5">🎯 面试重点</h4>
                    <div className="flex flex-wrap gap-1">
                      {(d.interview_focus || []).map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                          {typeof f === 'object' ? (f.name || JSON.stringify(f)) : f}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {d.career_path && (
                <AnimatedSection delay="500ms">
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-xs text-indigo-700 mb-1">🛤️ 职业发展路径</h4>
                    <p className="text-sm text-slate-700">{d.career_path}</p>
                  </div>
                </AnimatedSection>
              )}

              {d.match_advice && (
                <AnimatedSection delay="600ms">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-xs text-blue-700 mb-1">💡 匹配建议</h4>
                    <p className="text-sm text-slate-700">{d.match_advice}</p>
                  </div>
                </AnimatedSection>
              )}
            </div>
          )}

          {/* Raw text output fallback */}
          {result && !isJson && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimatedSection({ children, delay = '0ms' }) {
  return (
    <div
      className="animate-fadeIn"
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}
