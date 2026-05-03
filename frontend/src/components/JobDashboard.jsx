// 求职仪表盘组件
import { useState } from 'react';

export default function JobDashboard() {
  const [timeRange, setTimeRange] = useState('week');

  const stats = {
    applications: 24,
    responseRate: 45,
    interviewRate: 25,
    offerRate: 8
  };

  const skills = [
    { name: 'React', level: 85, target: 90 },
    { name: 'TypeScript', level: 70, target: 80 },
    { name: 'Node.js', level: 60, target: 75 },
    { name: 'System Design', level: 50, target: 70 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 求职仪表盘</h2>
      
      {/* 时间范围选择 */}
      <div className="flex gap-2 mb-6">
        {['week', 'month', 'quarter'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === 'week' ? '本周' : range === 'month' ? '本月' : '本季'}
          </button>
        ))}
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">投递量</div>
          <div className="text-2xl font-bold text-blue-700">{stats.applications}</div>
          <div className="text-xs text-green-600">↑ 20%</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">回复率</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.responseRate}%</div>
          <div className="text-xs text-green-600">↑ 5%</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">面试率</div>
          <div className="text-2xl font-bold text-purple-700">{stats.interviewRate}%</div>
          <div className="text-xs text-red-600">↓ 2%</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">Offer率</div>
          <div className="text-2xl font-bold text-green-700">{stats.offerRate}%</div>
          <div className="text-xs text-gray-500">持平</div>
        </div>
      </div>

      {/* 技能雷达 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">技能提升追踪</h3>
        <div className="space-y-4">
          {skills.map((skill, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">
                  {skill.level}/{skill.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full relative"
                  style={{ width: `${(skill.level / skill.target) * 100}%` }}
                >
                  <div 
                    className="absolute right-0 top-0 h-3 w-1 bg-red-400"
                    style={{ left: `${(skill.target / 100) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 漏斗图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">求职漏斗</h3>
        <div className="space-y-3">
          {[
            { stage: '投递简历', count: 100, color: 'bg-blue-500' },
            { stage: 'HR筛选通过', count: 45, color: 'bg-yellow-500' },
            { stage: '技术面试', count: 25, color: 'bg-purple-500' },
            { stage: '终面', count: 12, color: 'bg-pink-500' },
            { stage: 'Offer', count: 8, color: 'bg-green-500' }
          ].map((stage, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">{stage.stage}</div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-full h-8">
                  <div 
                    className={`${stage.color} h-8 rounded-full flex items-center justify-end px-3`}
                    style={{ width: `${stage.count}%` }}
                  >
                    <span className="text-white text-sm font-medium">{stage.count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
