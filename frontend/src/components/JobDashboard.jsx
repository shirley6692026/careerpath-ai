import { useAppContext } from '../context/AppContext';
// 求职仪表盘组件 - v2.0 with Real API
import { useState, useEffect } from 'react';
import { API_BASE } from '../services/api';

export default function JobDashboard() {
  const { resumeData, interviewData, skillRadarData, userProfile } = useAppContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addRecord = async (action, record = {}) => {
    await fetch(`${API_BASE}/api/dashboard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, record: { ...record, date: new Date().toISOString().slice(0, 10) } })
    });
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>;

  const stats = data || { applications: 0, interviews: 0, offers: 0, rejection_rate: 0, interview_rate: 0, offer_rate: 0, recent_apps: [], active_interviews: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"><div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 求职仪表盘</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.applications}</div>
          <div className="text-sm text-gray-600">总投递</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.interview_rate}%</div>
          <div className="text-sm text-gray-600">面试转化率</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.offers}</div>
          <div className="text-sm text-gray-600">Offer数</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.offer_rate}%</div>
          <div className="text-sm text-gray-600">Offer率</div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-8">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => {
            const company = prompt('公司名？');
            if (company) addRecord('add_application', { company, position: prompt('岗位？') || '' });
          }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">+ 投递记录</button>
          <button onClick={() => {
            const company = prompt('公司名？');
            if (company) addRecord('add_interview', { company, stage: prompt('面试阶段？(HR面/技术面/终面)') || '初面' });
          }} className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm">+ 面试记录</button>
          <button onClick={() => {
            const company = prompt('公司名？');
            if (company) addRecord('add_offer', { company, salary: prompt('薪资？') || '' });
          }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">+ Offer记录</button>
        </div>
      </div>

      {stats.active_interviews?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 进行中的面试</h3>
          <div className="space-y-3">
            {stats.active_interviews.map((iv, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="font-medium">{iv.company}</div>
                  <div className="text-sm text-gray-500">{iv.stage} · {iv.date}</div>
                </div>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">进行中</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.recent_apps?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📋 最近投递</h3>
          <div className="space-y-2">
            {stats.recent_apps.map((app, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                <span className="font-medium">{app.company}</span>
                <span className="text-gray-500">{app.position}</span>
                <span className="text-gray-400 text-xs">{app.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
      </div>
  );
}