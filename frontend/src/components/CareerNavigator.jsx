// 职业导航仪组件
import { useState } from 'react';

const CAREER_PATHS = {
  '前端工程师': {
    current: ['HTML/CSS', 'JavaScript', 'React'],
    target: ['TypeScript', 'Node.js', '微前端'],
    salary: { current: '15-20K', target: '25-35K' },
    timeline: '6-12个月'
  },
  '产品经理': {
    current: ['需求分析', '原型设计', '数据分析'],
    target: ['战略规划', '商业化', '团队管理'],
    salary: { current: '20-30K', target: '40-60K' },
    timeline: '12-24个月'
  },
  '数据分析师': {
    current: ['Excel', 'SQL', 'Python基础'],
    target: ['机器学习', '数据工程', '业务洞察'],
    salary: { current: '18-25K', target: '30-45K' },
    timeline: '6-18个月'
  }
};

export default function CareerNavigator() {
  const [selectedPath, setSelectedPath] = useState('前端工程师');
  const path = CAREER_PATHS[selectedPath];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧭 职业导航仪</h2>
      
      {/* 路径选择 */}
      <div className="flex gap-3 mb-8">
        {Object.keys(CAREER_PATHS).map(path => (
          <button
            key={path}
            onClick={() => setSelectedPath(path)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPath === path
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {path}
          </button>
        ))}
      </div>

      {/* 路径图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{selectedPath} 发展路径</h3>
        
        <div className="flex items-center gap-4">
          {/* 当前技能 */}
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2">当前技能</div>
            <div className="space-y-2">
              {path.current.map((skill, i) => (
                <div key={i} className="bg-blue-50 rounded-lg p-2 text-sm text-blue-800">
                  {skill}
                </div>
              ))}
            </div>
          </div>
          
          {/* 箭头 */}
          <div className="text-3xl text-gray-400">→</div>
          
          {/* 目标技能 */}
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2">目标技能</div>
            <div className="space-y-2">
              {path.target.map((skill, i) => (
                <div key={i} className="bg-purple-50 rounded-lg p-2 text-sm text-purple-800">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 薪资对比 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-xl p-6">
          <div className="text-sm text-gray-600 mb-1">当前薪资</div>
          <div className="text-2xl font-bold text-green-700">{path.salary.current}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-6">
          <div className="text-sm text-gray-600 mb-1">目标薪资</div>
          <div className="text-2xl font-bold text-purple-700">{path.salary.target}</div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        预计转型周期: {path.timeline}
      </div>
    </div>
  );
}
