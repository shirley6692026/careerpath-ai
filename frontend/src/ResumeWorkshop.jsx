import { useState, useRef } from 'react';
import { API_BASE } from './services/api';

// Resume Workshop v2 — ASC层核心功能 (升级版)
// 基于AI+HR研究成果的知识驱动简历优化系统

const SECTIONS = [
  { id: 'upload', label: '📄 上传简历', icon: '📄' },
  { id: 'score', label: '📊 初评评分', icon: '📊' },
  { id: 'diagnose', label: '🔍 AI诊断', icon: '🔍' },
  { id: 'optimize', label: '✨ AI优化', icon: '✨' },
  { id: 'compare', label: '⚖️ 对比效果', icon: '⚖️' },
];

export default function ResumeWorkshop() {
  const [activeTab, setActiveTab] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [parsedInfo, setParsedInfo] = useState(null);
  const [targetJob, setTargetJob] = useState('');
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
        setInitialScore(data.initial_score);
        setActiveTab('score');
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
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
    if (!targetJob) { setError('请填写目标岗位'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/resume/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_text: resumeText, 
          target_job: targetJob,
          diagnosis_result: diagnosisResult,
          focus: 'general',
          user_notes: ''
        }),
      });
      const data = await res.json();
      setOptimizeResult(data);
      setNewScore(data.new_score);
      setActiveTab('compare');
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
      
      // 创建新窗口显示HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.write(data.html);
      printWindow.document.close();
      
      // 自动触发打印
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
        <h1 className="text-3xl font-bold mb-2">📄 简历工坊 v2</h1>
        <p className="text-gray-600">基于AI+HR研究成果的专业简历优化系统</p>
        <div className="mt-2 flex gap-2 text-sm">
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">McKinsey 2025</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Deloitte 2025</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Gartner 2025</span>
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">WEF 2025</span>
        </div>
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

      {/* 目标岗位输入 */}
      <div className="mb-4 bg-white rounded-lg p-4 shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-1">🎯 目标岗位（用于精准匹配和优化）</label>
        <input
          type="text"
          value={targetJob}
          onChange={e => setTargetJob(e.target.value)}
          placeholder="例如：前端开发工程师、产品经理、数据分析师..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
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
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">上传你的简历</h3>
          <p className="text-gray-500 mb-2">支持 .docx 格式，AI将自动解析并初评</p>
          <p className="text-sm text-blue-600 mb-6">基于 McKinsey/Deloitte/Gartner/WEF 2025 研究标准</p>

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

          {resumeText && (
            <div className="mt-6 text-left">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                ✅ 简历已上传并解析成功！共 {resumeText.length} 字
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{resumeText.slice(0, 500)}...</pre>
              </div>
              {parsedInfo && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-blue-600 font-semibold text-xl">{parsedInfo.education?.length || 0}</div>
                    <div className="text-sm text-gray-600">教育经历</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-purple-600 font-semibold text-xl">{parsedInfo.skills?.length || 0}</div>
                    <div className="text-sm text-gray-600">技能项</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-orange-600 font-semibold text-xl">{parsedInfo.experience?.length || 0}</div>
                    <div className="text-sm text-gray-600">项目/工作经历</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setActiveTab('score')}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                查看初评评分 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== 初评评分 ========== */}
      {activeTab === 'score' && (
        <div>
          {!initialScore?.overall_score ? (
            <div className="text-center py-8">
              <p className="text-gray-500">请先上传简历获取初评</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                去上传简历
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 总分 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">综合评分</h3>
                    <p className="text-gray-500">基于AI招聘系统和HR专家标准</p>
                  </div>
                  <div className={`text-5xl font-bold ${
                    initialScore.overall_score >= 80 ? 'text-green-600' :
                    initialScore.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {initialScore.overall_score}
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      initialScore.overall_score >= 80 ? 'bg-green-500' :
                      initialScore.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${initialScore.overall_score}%` }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    initialScore.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                    initialScore.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {initialScore.overall_score >= 80 ? '优秀' :
                     initialScore.overall_score >= 60 ? '合格' : '需改进'}
                  </span>
                </div>
              </div>

              {/* 6维度评分 */}
              {initialScore.six_dimensions && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 六维度评分</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(initialScore.six_dimensions).map(([key, value]) => (
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
                          <span className="text-sm font-bold">{value.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              value.score >= 80 ? 'bg-green-500' :
                              value.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${value.score}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{value.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="flex gap-4">
                <button
                  onClick={handleDiagnose}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  🔍 开始AI深度诊断
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== AI诊断 ========== */}
      {activeTab === 'diagnose' && (
        <div>
          {!diagnosisResult ? (
            <div className="text-center py-8">
              <button
                onClick={handleDiagnose}
                disabled={!resumeText || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                🔍 开始AI深度诊断
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 诊断分数对比 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📊 诊断评分</h3>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">初评</div>
                    <div className="text-2xl font-bold text-gray-600">{diagnosisResult.initial_score?.overall_score || '?'}</div>
                  </div>
                  <div className="text-2xl">→</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">诊断评分</div>
                    <div className={`text-2xl font-bold ${
                      diagnosisResult.overall_score >= 80 ? 'text-green-600' :
                      diagnosisResult.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {diagnosisResult.overall_score}
                    </div>
                  </div>
                  {diagnosisResult.score_change !== 0 && (
                    <div className="text-center">
                      <div className="text-sm text-gray-500">变化</div>
                      <div className={`text-xl font-bold ${
                        diagnosisResult.score_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {diagnosisResult.score_change > 0 ? '+' : ''}{diagnosisResult.score_change}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                ✨ 基于诊断结果进行AI优化
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== AI优化 ========== */}
      {activeTab === 'optimize' && (
        <div>
          {!optimizeResult ? (
            <div className="text-center py-8">
              <button
                onClick={handleOptimize}
                disabled={!resumeText || !targetJob || loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                ✨ AI优化简历
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 改动说明 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📝 改动说明</h3>
                <div className="space-y-2">
                  {optimizeResult.changes?.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{c.type}</span>
                      <span className="text-gray-700">{c.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 优化后简历 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">✨ 优化后的简历</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{optimizeResult.optimized_text}</pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigator.clipboard?.writeText(optimizeResult.optimized_text)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    📋 复制
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    📄 生成PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 对比效果 ========== */}
      {activeTab === 'compare' && (
        <div>
          {!optimizeResult ? (
            <div className="text-center py-8">
              <p className="text-gray-500">请先完成AI优化</p>
              <button
                onClick={() => setActiveTab('optimize')}
                className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                去优化
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 分数对比 */}
              {newScore && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">⚖️ 优化前后对比</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">优化前</div>
                      <div className="text-3xl font-bold text-gray-600">
                        {diagnosisResult?.initial_score?.overall_score || initialScore?.overall_score || '?'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">优化后</div>
                      <div className="text-3xl font-bold text-green-600">
                        {newScore.new_overall_score || '?'}
                      </div>
                      {newScore.score_change > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          +{newScore.score_change} 分 ↑
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6维度对比 */}
                  {newScore.six_dimensions && (
                    <div className="mt-6">
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
                                <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${value.old}%` }} />
                              </div>
                              <span className="text-lg">→</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{ width: `${value.new}%` }} />
                              </div>
                              <span className="text-sm font-bold text-green-600 w-8">{value.new}</span>
                              {value.change > 0 && (
                                <span className="text-xs text-green-600">+{value.change}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 优化后简历预览 */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📄 优化后简历预览</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{optimizeResult.optimized_text}</pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigator.clipboard?.writeText(optimizeResult.optimized_text)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    📋 复制文本
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    📄 生成PDF下载
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
