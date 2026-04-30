import { useState, useCallback } from 'react';
import { jdTranslate, jdFromImage } from './services/api';

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
    const textToAnalyze = showOcr ? ocrText : jdText;
    if (!textToAnalyze.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await jdTranslate(textToAnalyze);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || '分析失败，请重试');
      }
    } catch (e) {
      setError('网络连接失败，请确认后端服务在运行');
    }
    setLoading(false);
  };

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await jdFromImage(file);
      if (data.success) {
        // Set OCR text for editing
        setOcrText(data.ocr_text || '');
        setJdText(data.ocr_text || '');
        setShowOcr(true);
        // If OCR text is too short, warn
        if ((data.ocr_text || '').length < 30) {
          setError('⚠️ OCR识别文字较少，建议检查图片清晰度后重试，或直接手工输入JD文字');
        }
        // If we already have analysis result alongside OCR text, show it
        if (data.data) {
          setResult({ success: true, data: data.data, raw: data.raw, model_used: data.model_used });
        }
      } else {
        setError(data.error || '图片识别失败，建议直接粘贴文字JD');
      }
    } catch (e) {
      setError('上传失败，请确认后端服务在运行');
    }
    setLoading(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  }, [handleImageUpload]);

  const d = result?.data;
  const isJson = d && typeof d === 'object' && !Array.isArray(d) && d.daily_work;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">📄 JD 翻译官</h2>
        <p className="text-slate-500 mt-1">粘贴文字 或 上传截图 → AI分析企业真实需求</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Image Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('imgInput')?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4 ${
              dragOver ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <input id="imgInput" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])} />
            <div className="text-3xl mb-1">📸</div>
            <p className="text-sm text-slate-500 font-medium">上传脉脉/JD截图</p>
            <p className="text-xs text-slate-400 mt-0.5">支持 PNG / JPG / WebP — 拖拽或点击上传</p>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">或直接粘贴 JD 文字</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => { setJdText(s); setShowOcr(false); setError(''); }}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all">
                示例 {i + 1}
              </button>
            ))}
          </div>

          <textarea
            value={showOcr ? ocrText : jdText}
            onChange={(e) => {
              const val = e.target.value;
              if (showOcr) setOcrText(val);
              setJdText(val);
            }}
            placeholder="粘贴招聘 JD 文本..."
            className={`w-full h-44 p-4 border rounded-lg resize-none focus:outline-none transition-all text-sm ${
              showOcr ? 'border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
            }`}
          />

          {showOcr && (
            <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-green-700 font-medium">✅ OCR已识别 ({ocrText.length}字)</span>
                <div className="flex gap-2">
                  <button onClick={() => { setShowOcr(false); setJdText(ocrText); }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                    使用识别文字
                  </button>
                  <button onClick={() => { setShowOcr(false); setJdText(''); setOcrText(''); }}
                    className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200">
                    清除
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-green-600">💡 建议检查识别结果，修正错别字后再分析</p>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={loading || !((showOcr ? ocrText : jdText) || '').trim()}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-[0.97] ${
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
            ) : showOcr ? '🔍 分析图片中的 JD' : '🔍 AI 分析 JD'}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm animate-fadeIn">
              {error}
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">📊 分析结果</h3>
          
          {!result && !loading && (
            <div className="text-center py-16 text-slate-300">
              <div className="text-5xl mb-4">🔍</div>
              <p>粘贴 JD 或上传截图开始分析</p>
              <p className="text-sm mt-2 text-slate-400">Doubao-1.5-pro · 火山引擎 ARK</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-slate-400">
              <div className="animate-spin text-5xl mb-4">⏳</div>
              <p>AI 正在解析...</p>
              <p className="text-sm mt-2 text-slate-400">分析能力要求 · 拆解薪资 · 识别隐藏需求</p>
              <div className="mt-4 w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          )}

          {isJson && (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
              {/* Daily Work */}
              <Section icon="🏢" title="真实工作日常">
                <ul className="space-y-1.5">
                  {(d.daily_work || []).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                      {typeof item === 'object' ? (item.content || item.name || '') : item}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Skills Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Section icon="🔧" title="硬技能" color="blue" compact>
                  <div className="flex flex-wrap gap-1">
                    {(d.hard_skills || []).map((s, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${
                        typeof s === 'object' && s.level === '精通' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {typeof s === 'object' ? s.name : s}
                      </span>
                    ))}
                  </div>
                </Section>
                <Section icon="💬" title="软技能" color="purple" compact>
                  <div className="flex flex-wrap gap-1">
                    {(d.soft_skills || []).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {typeof s === 'object' ? s.name : s}
                      </span>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Hidden Requirements */}
              {d.hidden_requirements?.length > 0 && (
                <Section icon="🔍" title="隐藏要求" color="orange">
                  <div className="flex flex-wrap gap-1">
                    {(d.hidden_requirements || []).map((hr, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                        {typeof hr === 'object' ? hr.name : hr}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Salary */}
              {d.salary_info && (
                <Section icon="💰" title="薪资拆解" color="green">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {d.salary_info.base && <div><span className="text-xs text-slate-500">Base</span><br/><span className="font-semibold text-green-700">{d.salary_info.base}</span></div>}
                    {d.salary_info.year_end && <div><span className="text-xs text-slate-500">年终</span><br/><span className="font-semibold text-green-700">{d.salary_info.year_end}</span></div>}
                    {d.salary_info.total_annual && <div><span className="text-xs text-slate-500">年薪</span><br/><span className="font-semibold">{d.salary_info.total_annual}</span></div>}
                  </div>
                </Section>
              )}

              {/* Interview Focus */}
              {d.interview_focus?.length > 0 && (
                <Section icon="🎯" title="面试重点" color="red">
                  <div className="flex flex-wrap gap-1">
                    {(d.interview_focus || []).map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                        {typeof f === 'object' ? f.name : f}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Career Path + Advice */}
              <div className="grid grid-cols-2 gap-2">
                {d.career_path && (
                  <Section icon="🛤️" title="职业路径" color="indigo" compact>
                    <p className="text-sm text-slate-700">{d.career_path}</p>
                  </Section>
                )}
                {d.match_advice && (
                  <Section icon="💡" title="匹配建议" color="blue" compact>
                    <p className="text-sm text-slate-700">{d.match_advice}</p>
                  </Section>
                )}
              </div>
            </div>
          )}

          {/* Fallback for text output */}
          {result && !isJson && typeof result.data === 'string' && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-fadeIn">
              {result.data}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color = 'blue', compact, children }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    red: 'border-red-200 bg-red-50',
    indigo: 'border-indigo-200 bg-indigo-50',
  };
  return (
    <div className={`rounded-lg border ${colors[color] || colors.blue} ${compact ? 'p-3' : 'p-4'} animate-fadeIn`}>
      <h4 className="font-semibold text-xs mb-1.5 text-slate-600">{icon} {title}</h4>
      {children}
    </div>
  );
}
