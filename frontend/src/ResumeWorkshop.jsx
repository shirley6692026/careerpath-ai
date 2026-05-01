import { useState, useRef } from 'react';
import { API_BASE } from './services/api';

// Resume Workshop v3 — 基于用户反馈深度优化
// 优化点:
// 1. 支持目标岗位JD输入
// 2. 简历模块化解析展示
// 3. 10分制评分
// 4. 诊断不重复评分
// 5. 优化后10分制评分 + "AI生成新简历"按钮
// 6. 对比效果改为"AI生成新简历"

const SECTIONS = [
  { id: 'upload', label: '📄 上传简历' },
  { id: 'score', label: '📊 初评评分' },
  { id: 'diagnose', label: '🔍 AI诊断' },
  { id: 'optimize', label: '✨ AI优化' },
  { id: 'newresume', label: '📝 AI生成新简历' },
];

// 模块名称映射
const MODULE_NAMES = {
  personal: '👤 个人信息',
  education: '🎓 教育经历',
  honors: '🏆 所获荣誉',
  skills: '💡 专业技能',
  work: '💼 工作经历',
  projects: '🚀 项目经验',
  evaluation: '📝 个人评价',
  raw: '📄 简历内容'
};

export default function ResumeWorkshop() {
  const [activeTab, setActiveTab] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [parsedInfo, setParsedInfo] = useState(null);
  const [modules, setModules] = useState(null);
  const [targetJob, setTargetJob] = useState('');
  const [jobJd, setJobJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results
  const [initialScore, setInitialScore] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [newScore, setNewScore] = useState(null);

  const fileInputRef = useRef(null);

  // ========== 上传简历 ==========
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      setError('仅支持 .docx 格式');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResumeText(data.text);
        setParsedInfo(data.parsed);
        setModules(data.modules);
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 初评评分 ==========
  const handleScore = async () => {
    if (!resumeText) { setError('请先上传简历'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/resume/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_text: resumeText, 
          target_job: targetJob,
          job_jd: jobJd
        }),
      });
      const data = await res.json();
      setInitialScore(data);
      setActiveTab('score');
    } catch (err) {
      setError('评分失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== AI诊断 ==========
  const handleDiagnose = async () => {
    if (!resumeText) { setError('请先上传简历'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/resume/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_text: resumeText, 
          target_job: targetJob,
          job_jd: jobJd,
          initial_score: initialScore
        }),
      });
      const data = await res.json();
      setDiagnosisResult(data);
      setActiveTab('diagnose');
    } catch (err) {
      setError('诊断失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== AI优化 ==========
  const handleOptimize = async () => {
    if (!resumeText) { setError('请先上传简历'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/resume/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_text: resumeText, 
          target_job: targetJob,
          job_jd: jobJd,
          diagnosis_result: diagnosisResult,
          initial_score: initialScore,
          user_notes: ''
        }),
      });
      const data = await res.json();
      setOptimizeResult(data);
      setNewScore(data.new_score);
      setActiveTab('optimize');
    } catch (err) {
      setError('优化失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 生成PDF ==========
  const handleGeneratePDF = async () => {
    if (!optimizeResult?.optimized_text) { setError('请先优化简历'); return; }
    
    try {
      const res = await fetch(`${API_BASE}/api/resume/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_text: optimizeResult.optimized_text,
          title: `${targetJob || '优化'}简历`
        }),
      });
      const data = await res.json();
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(data.html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      setError('PDF生成失败: ' + err.message);
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📄 简历工坊</h1>
        <p className="text-gray-600">基于AI+HR研究成果的专业简历优化系统</p>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition whitespace-nowrap ${
              activeTab === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI处理中...</p>
        </div>
      )}

      {/* ========== 上传页面 ========== */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* 上传区域 */}
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">上传你的简历</h3>
            <p className="text-gray-500 mb-6">支持 .docx 格式，AI将自动解析并模块化展示</p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".docx"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              选择简历文件
            </button>
          </div>

          {/* 模块化解析展示 — 放在目标岗位信息上面 */}
          {modules && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">📋 简历模块化解析</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(modules).map(([key, content]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{MODULE_NAMES[key] || key}</h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {content.slice(0, 300)}{content.length > 300 ? '...' : ''}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 目标岗位信息 */}
          {resumeText && (
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="text-lg font-semibold">🎯 目标岗位信息</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标岗位名称</label>
                <input
                  type="text"
                  value={targetJob}
                  onChange={e => setTargetJob(e.target.value)}
                  placeholder="例如：前端开发工程师、产品经理..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标岗位JD（岗位要求）</label>
                <textarea
                  value={jobJd}
                  onChange={e => setJobJd(e.target.value)}
                  placeholder="粘贴目标岗位的职位描述（JD），AI将根据JD精准优化你的简历..."
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">💡 填写JD后，AI能更精准地匹配关键词和优化简历</p>
              </div>
            </div>
          )}

          {/* 查看初评评分按钮 — 放在最底下 */}
          {resumeText && (
            <button
              onClick={handleScore}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
            >
              📊 查看初评评分
            </button>
          )}
        </div>
      )}

      {/* ========== 初评评分 ========== */}
      {activeTab === 'score' && (
        <div className="space-y-4">
          {!initialScore?.overall_score ? (
            <div className="text-center py-8">
              <p className="text-gray-500">请先上传简历并填写目标岗位信息</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                去上传简历
              </button>
            </div>
          ) : (
            <>
              {/* 6维度评分 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📊 六维度评分 (10分制)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {initialScore.six_dimensions && Object.entries(initialScore.six_dimensions).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {key === 'format' ? '格式规范' :
                           key === 'content' ? '内容质量' :
                           key === 'skills' ? '技能匹配' :
                           key === 'experience' ? '经历描述' :
                           key === 'potential' ? '发展潜力' :
                           key === 'ai_literacy' ? 'AI素养' : key}
                        </span>
                        <span className="text-sm font-bold">{value.score}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            value.score >= 8 ? 'bg-green-500' :
                            value.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value.score * 10}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{value.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 综合评分 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">综合评分</h3>
                    <p className="text-gray-500">基于AI招聘系统和HR专家标准</p>
                  </div>
                  <div className={`text-5xl font-bold ${
                    initialScore.overall_score >= 8 ? 'text-green-600' :
                    initialScore.overall_score >= 6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {initialScore.overall_score}
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      initialScore.overall_score >= 8 ? 'bg-green-500' :
                      initialScore.overall_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${initialScore.overall_score * 10}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-4 text-center">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">ATS评分</div>
                    <div className="text-xl font-bold">{initialScore.ats_score}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">HR评分</div>
                    <div className="text-xl font-bold">{initialScore.hr_score}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">匹配度</div>
                    <div className="text-xl font-bold">{initialScore.match_score}</div>
                  </div>
                </div>
              </div>

              {/* 优先改进项 */}
              {initialScore.improvement_areas?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-orange-600">🎯 优先改进项</h3>
                  <ul className="space-y-2">
                    {initialScore.improvement_areas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">{i + 1}</span>
                        <span className="text-gray-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleDiagnose}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
              >
                🔍 开始AI深度诊断
              </button>
            </>
          )}
        </div>
      )}

      {/* ========== AI诊断 ========== */}
      {activeTab === 'diagnose' && (
        <div className="space-y-4">
          {!diagnosisResult ? (
            <div className="text-center py-8">
              <button
                onClick={handleDiagnose}
                disabled={!resumeText || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
              >
                🔍 开始AI深度诊断
              </button>
            </div>
          ) : (
            <>
              {/* 初评分数展示 (只展示，不重新评分) */}
              {initialScore && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 初评分数</h3>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">综合评分</div>
                      <div className={`text-3xl font-bold ${
                        initialScore.overall_score >= 8 ? 'text-green-600' :
                        initialScore.overall_score >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {initialScore.overall_score}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">ATS</div>
                      <div className="text-2xl font-bold">{initialScore.ats_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">HR</div>
                      <div className="text-2xl font-bold">{initialScore.hr_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">匹配度</div>
                      <div className="text-2xl font-bold">{initialScore.match_score}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 问题列表 */}
              {diagnosisResult.issues?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ 发现的问题</h3>
                  <div className="space-y-3">
                    {diagnosisResult.issues.map((issue, i) => (
                      <div key={i} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 rounded-r-lg">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            issue.severity === '高' ? 'bg-red-100 text-red-700' :
                            issue.severity === '中' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{issue.category}</span>
                          {issue.priority && (
                            <span className="text-xs text-gray-500">优先级 #{issue.priority}</span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{issue.description}</p>
                        <p className="text-blue-600 text-sm mt-1">💡 {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HAIC分析 */}
              {diagnosisResult.haic_analysis && Object.keys(diagnosisResult.haic_analysis).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-purple-600">🧠 HAIC 人机协作能力分析</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(diagnosisResult.haic_analysis).map(([key, value]) => (
                      <div key={key} className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">{value.score || '?'}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {key === 'ai_cognition' ? 'AI认知力' :
                           key === 'prompt_engineering' ? '提示工程力' :
                           key === 'workflow_reconstruction' ? '工作流重构力' :
                           key === 'quality_judgment' ? '质量判断力' :
                           key === 'ethical_decision' ? '伦理决策力' : key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 优化方案 */}
              {diagnosisResult.optimization_plan?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">📋 优化方案</h3>
                  <div className="space-y-3">
                    {diagnosisResult.optimization_plan.map((plan, i) => (
                      <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-lg p-3">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">{plan.step}</span>
                        <div>
                          <p className="font-medium text-gray-800">{plan.action}</p>
                          <p className="text-sm text-gray-600">预期效果: {plan.expected_impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold"
              >
                ✨ 基于诊断结果进行AI优化
              </button>
            </>
          )}
        </div>
      )}

      {/* ========== AI优化 ========== */}
      {activeTab === 'optimize' && (
        <div className="space-y-4">
          {!optimizeResult ? (
            <div className="text-center py-8">
              <button
                onClick={handleOptimize}
                disabled={!resumeText || loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold"
              >
                ✨ 基于诊断结果进行AI优化
              </button>
            </div>
          ) : (
            <>
              {/* 改动说明 */}
              {optimizeResult.changes?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">📝 核心改动说明</h3>
                  <div className="space-y-2">
                    {optimizeResult.changes.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{c.type}</span>
                        <span className="text-gray-700">{c.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 优化后简历 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">✨ 优化后的简历</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{optimizeResult.optimized_text}</pre>
                </div>
              </div>

              {/* 优化后评分 */}
              {newScore && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 优化后评分 (10分制)</h3>
                  <div className="flex items-center gap-8 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">优化前</div>
                      <div className="text-3xl font-bold text-gray-600">{initialScore?.overall_score || '?'}</div>
                    </div>
                    <div className="text-2xl">→</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">优化后</div>
                      <div className="text-3xl font-bold text-green-600">{newScore.new_overall_score || '?'}</div>
                    </div>
                    {newScore.score_change > 0 && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500">提升</div>
                        <div className="text-xl font-bold text-green-600">+{newScore.score_change}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveTab('newresume')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
              >
                📝 AI生成新简历
              </button>
            </>
          )}
        </div>
      )}

      {/* ========== AI生成新简历 ========== */}
      {activeTab === 'newresume' && (
        <div className="space-y-4">
          {!optimizeResult ? (
            <div className="text-center py-8">
              <p className="text-gray-500">请先完成AI优化</p>
              <button
                onClick={() => setActiveTab('optimize')}
                className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                去优化简历
              </button>
            </div>
          ) : (
            <>
              {/* 分数对比 */}
              {newScore && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">⚖️ 优化前后对比</h3>
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">优化前</div>
                      <div className="text-4xl font-bold text-gray-600">{initialScore?.overall_score || '?'}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">优化后</div>
                      <div className="text-4xl font-bold text-green-600">{newScore.new_overall_score || '?'}</div>
                      {newScore.score_change > 0 && (
                        <div className="text-sm text-green-600 mt-1">+{newScore.score_change} 分 ↑</div>
                      )}
                    </div>
                  </div>

                  {/* 6维度对比 */}
                  {newScore.six_dimensions && (
                    <div>
                      <h4 className="font-semibold mb-3">六维度提升</h4>
                      <div className="space-y-3">
                        {Object.entries(newScore.six_dimensions).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-4">
                            <span className="w-24 text-sm text-gray-600">
                              {key === 'format' ? '格式规范' :
                               key === 'content' ? '内容质量' :
                               key === 'skills' ? '技能匹配' :
                               key === 'experience' ? '经历描述' :
                               key === 'potential' ? '发展潜力' :
                               key === 'ai_literacy' ? 'AI素养' : key}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-sm text-gray-500 w-8">{value.old}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${value.old * 10}%` }} />
                              </div>
                              <span className="text-lg">→</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{ width: `${value.new * 10}%` }} />
                              </div>
                              <span className="text-sm font-bold text-green-600 w-8">{value.new}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 新简历预览 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📝 新简历预览</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{optimizeResult.optimized_text}</pre>
                </div>
                
                <button
                  onClick={handleGeneratePDF}
                  className="mt-4 w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                >
                  📄 生成PDF简历
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
