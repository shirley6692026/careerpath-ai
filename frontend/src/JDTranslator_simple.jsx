// JD翻译官 - 简化测试版
import { useState } from 'react';

export default function JDTranslator() {
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    
    // 模拟分析结果
    setTimeout(() => {
      setResult({
        data: {
          company: '示例公司',
          position: '前端工程师',
          salary: '15-25K',
          requirements: ['React', 'TypeScript', 'Node.js'],
          skills: ['前端开发', '性能优化', '团队协作']
        }
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">📄 JD 翻译官</h2>
        <p className="text-slate-500 mt-1">粘贴职位描述 → AI分析真实需求</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="粘贴职位描述到这里..."
          className="w-full h-40 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !jdText.trim()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? '分析中...' : '🔍 AI分析'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">分析结果</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-slate-500">公司</div>
              <div className="font-medium">{result.data.company}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-slate-500">职位</div>
              <div className="font-medium">{result.data.position}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-slate-500">薪资</div>
              <div className="font-medium">{result.data.salary}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-slate-500">技能要求</div>
              <div className="font-medium">{result.data.requirements.join(' · ')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
