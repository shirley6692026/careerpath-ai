// 学习路线图组件
import { useState } from 'react';

const ROADMAP_DATA = {
  '前端工程师': [
    {
      phase: '基础阶段',
      duration: '1-2个月',
      items: [
        { name: 'HTML5/CSS3', type: 'course', status: 'completed' },
        { name: 'JavaScript基础', type: 'course', status: 'completed' },
        { name: '响应式设计', type: 'project', status: 'in_progress' }
      ]
    },
    {
      phase: '进阶阶段',
      duration: '2-3个月',
      items: [
        { name: 'React/Vue', type: 'course', status: 'pending' },
        { name: 'TypeScript', type: 'course', status: 'pending' },
        { name: '个人项目', type: 'project', status: 'pending' }
      ]
    },
    {
      phase: '高级阶段',
      duration: '3-6个月',
      items: [
        { name: '性能优化', type: 'course', status: 'pending' },
        { name: '微前端', type: 'course', status: 'pending' },
        { name: '开源贡献', type: 'project', status: 'pending' }
      ]
    }
  ]
};

export default function LearningRoadmap() {
  const [selectedRole, setSelectedRole] = useState('前端工程师');
  const phases = ROADMAP_DATA[selectedRole] || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 学习路线图</h2>
      
      {/* 角色选择 */}
      <div className="flex gap-3 mb-8">
        {Object.keys(ROADMAP_DATA).map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedRole === role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* 路线图 */}
      <div className="space-y-6">
        {phases.map((phase, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{phase.phase}</h3>
              <span className="text-sm text-gray-500">{phase.duration}</span>
            </div>
            
            <div className="space-y-3">
              {phase.items.map((item, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    item.status === 'completed' ? 'bg-green-100 text-green-600' :
                    item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {item.status === 'completed' ? '✓' :
                     item.status === 'in_progress' ? '▶' : '○'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.type === 'course' ? '📖 课程' : '🛠️ 项目'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'completed' ? 'bg-green-100 text-green-700' :
                    item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status === 'completed' ? '已完成' :
                     item.status === 'in_progress' ? '进行中' : '待开始'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
