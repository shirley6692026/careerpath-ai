// 求职战报组件
import { useState, useEffect } from 'react';

export default function JobBattleReport() {
  const [stats, setStats] = useState({
    applications: 12,
    interviews: 3,
    offers: 1,
    rejections: 2,
    pending: 6
  });

  const [weeklyData, setWeeklyData] = useState([
    { week: '第1周', applications: 5, interviews: 1 },
    { week: '第2周', applications: 7, interviews: 2 },
    { week: '第3周', applications: 12, interviews: 3 }
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 求职战报</h2>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.applications}</div>
          <div className="text-sm text-gray-600">总投递</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.interviews}</div>
          <div className="text-sm text-gray-600">面试中</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.offers}</div>
          <div className="text-sm text-gray-600">Offer</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.rejections}</div>
          <div className="text-sm text-gray-600">被拒</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">待回复</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">面试进度</h3>
        <div className="space-y-4">
          {[
            { company: '字节跳动', stage: 'HR面', progress: 60 },
            { company: '阿里巴巴', stage: '技术二面', progress: 80 },
            { company: '腾讯', stage: '初筛', progress: 20 }
          ].map((job, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{job.company}</span>
                <span className="text-sm text-gray-500">{job.stage}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 周报 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 周报趋势</h3>
        <div className="space-y-3">
          {weeklyData.map((week, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-16 font-medium">{week.week}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-sm text-gray-500">投递 {week.applications}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${(week.applications / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-500">面试 {week.interviews}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
