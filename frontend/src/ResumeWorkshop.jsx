import { useState, useRef } from 'react';
import { API_BASE } from './services/api';

// Resume Workshop — ASC层核心功能
// 支持: 上传解析 / AI诊断 / AI优化 / 简历评分

const SECTIONS = [
  { id: 'upload', label: '📄 上传简历', icon: '📄' },
  { id: 'diagnose', label: '🔍 AI诊断', icon: '🔍' },
  { id: 'optimize', label: '✨ AI优化', icon: '✨' },
  { id: 'score', label: '📊 简历评分', icon: '📊' },
];

export default function ResumeWorkshop() {
  const [activeTab, setActiveTab] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [parsedInfo, setParsedInfo] = useState(null);
  const [targetJob, setTargetJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);

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
        setActiveTab('diagnose');
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
        body: JSON.stringify({ resume_text: resumeText, target_job: targetJob }),
      });
      const data = await res.json();
      setDiagnosisResult(data);
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
        body: JSON.stringify({ resume_text: resumeText, target_job: targetJob, focus: 'general' }),
      });
      const data = await res.json();
      setOptimizeResult(data);
    } catch (err) {
      setError('优化失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 简历评分 ==========
  const handleScore = async () => {
    if (!resumeText) { setError('请先上传简历'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/resume/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, job_description: targetJob }),
      });
      const data = await res.json();
      setScoreResult(data);
    } catch (err) {
      setError('评分失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">📄 简历工坊</h1>
      <p className="text-gray-600 mb-6">AI驱动的简历诊断、优化与评分系统</p>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">目标岗位（可选）</label>
        <input
          type="text"
          value={targetJob}
          onChange={e => setTargetJob(e.target.value)}
          placeholder="例如：前端开发工程师、产品经理..."
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
          <p className="text-gray-500 mb-6">支持 .docx 格式，AI将自动解析内容</p>

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
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-blue-600 font-semibold">{parsedInfo.education?.length || 0}</div>
                    <div className="text-sm text-gray-600">教育经历</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-purple-600 font-semibold">{parsedInfo.skills?.length || 0}</div>
                    <div className="text-sm text-gray-600">技能项</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-orange-600 font-semibold">{parsedInfo.experience?.length || 0}</div>
                    <div className="text-sm text-gray-600">项目/工作经历</div>
                  </div>
                </div>
              )}
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
                🔍 开始AI诊断
              </button>
              {!resumeText && <p className="mt-2 text-gray-500">请先上传简历</p>}
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
                  <div className={`text-4xl font-bold ${
                    diagnosisResult.overall_score >= 80 ? 'text-green-600' :
                    diagnosisResult.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {diagnosisResult.overall_score}
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      diagnosisResult.overall_score >= 80 ? 'bg-green-500' :
                      diagnosisResult.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${diagnosisResult.overall_score}%` }}
                  />
                </div>
              </div>

              {/* 问题列表 */}
              {diagnosisResult.issues?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ 发现的问题</h3>
                  <div className="space-y-3">
                    {diagnosisResult.issues.map((issue, i) => (
                      <div key={i} className="border-l-4 border-red-400 pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            issue.severity === '高' ? 'bg-red-100 text-red-700' :
                            issue.severity === '中' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{issue.category}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{issue.description}</p>
                        <p className="text-blue-600 text-sm mt-1">💡 {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 优势 */}
              {diagnosisResult.strengths?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-600">✅ 简历优势</h3>
                  <ul className="space-y-2">
                    {diagnosisResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 关键词匹配 */}
              {diagnosisResult.keywords_match && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">🎯 关键词匹配度</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">已有关键词</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnosisResult.keywords_match.matched?.map((k, i) => (
                          <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">建议补充</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnosisResult.keywords_match.missing?.map((k, i) => (
                          <span key={i} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-lg font-semibold">
                    匹配率: <span className="text-blue-600">{diagnosisResult.keywords_match.match_rate}</span>
                  </p>
                </div>
              )}
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
              {!resumeText && <p className="mt-2 text-gray-500">请先上传简历</p>}
              {resumeText && !targetJob && <p className="mt-2 text-gray-500">请填写目标岗位</p>}
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
                <button
                  onClick={() => navigator.clipboard?.writeText(optimizeResult.optimized_text)}
                  className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  📋 复制优化后简历
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 简历评分 ========== */}
      {activeTab === 'score' && (
        <div>
          {!scoreResult ? (
            <div className="text-center py-8">
              <button
                onClick={handleScore}
                disabled={!resumeText || loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                📊 开始简历评分
              </button>
              {!resumeText && <p className="mt-2 text-gray-500">请先上传简历</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 三维度评分 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{scoreResult.ats_score}</div>
                  <div className="text-sm text-gray-500 mt-1">AI筛选系统</div>
                  <div className="text-xs text-gray-400">ATS Score</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">{scoreResult.hr_score}</div>
                  <div className="text-sm text-gray-500 mt-1">HR人工评分</div>
                  <div className="text-xs text-gray-400">Human Review</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{scoreResult.match_score}</div>
                  <div className="text-sm text-gray-500 mt-1">岗位匹配度</div>
                  <div className="text-xs text-gray-400">Job Match</div>
                </div>
              </div>

              {/* 详细维度 */}
              {scoreResult.details && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">📈 详细评分维度</h3>
                  <div className="space-y-4">
                    {Object.entries(scoreResult.details).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {key === 'format' ? '格式规范' :
                             key === 'content' ? '内容质量' :
                             key === 'keywords' ? '关键词匹配' :
                             key === 'experience' ? '经历描述' :
                             key === 'potential' ? '发展潜力' : key}
                          </span>
                          <span className="text-sm font-semibold">{value.score}/100</span>
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
                        <p className="text-sm text-gray-500 mt-1">{value.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 筛选结果 */}
              <div className={`rounded-xl border p-6 text-center ${
                scoreResult.screening_result === '通过' ? 'bg-green-50 border-green-200' :
                scoreResult.screening_result === '待定' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="text-2xl font-bold mb-2">
                  {scoreResult.screening_result === '通过' ? '✅ 通过筛选' :
                   scoreResult.screening_result === '待定' ? '⏳ 待定' : '❌ 未通过'}
                </div>
                <p className="text-gray-600">{scoreResult.hr_feedback}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
