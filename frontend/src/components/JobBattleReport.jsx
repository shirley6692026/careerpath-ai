import { useAppContext } from '../context/AppContext';
// 求职战报组件 - v3.1 with Salary Map
import { useState, useEffect } from 'react';
import { API_BASE } from '../services/api';

export default function JobBattleReport() {
  const { interviewData, userProfile } = useAppContext();

  const [stats, setStats] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: '', position: '', date: new Date().toISOString().slice(0,10), salary: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchAll = async () => {
    try {
      const [reportRes, salaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/battlereport`),
        fetch(`${API_BASE}/api/salary/map`)
      ]);
      const reportJson = await reportRes.json();
      const salaryJson = await salaryRes.json();
      if (reportJson.success) setStats(reportJson.data);
      if (salaryJson.success) setSalaryData(salaryJson.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const addApplication = async () => {
    if (!form.company) return;
    await fetch(`${API_BASE}/api/dashboard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_application', record: form })
    });
    setForm({ company: '', position: '', date: new Date().toISOString().slice(0,10), salary: '' });
    setShowForm(false);
    fetchAll();
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const barMax = Math.max((stats?.total_applications || 0) * 1.2, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">📊 求职战报</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm">
          + 新投递
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100 animate-slideIn">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="公司名 *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="岗位" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="薪资 (如15-25K)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button onClick={addApplication} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">提交</button>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '总投递', value: stats?.total_applications ?? 0, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: '面试中', value: stats?.total_interviews ?? 0, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Offer', value: stats?.total_offers ?? 0, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: '淘汰', value: (stats?.total_applications ?? 0) - (stats?.total_interviews ?? 0), bg: 'bg-red-50', color: 'text-red-600' },
          { label: '待回复', value: stats?.pending ?? 0, bg: 'bg-slate-50', color: 'text-slate-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 text-center shadow-sm`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 面试进度 */}
      {stats?.active_interviews?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🎯 面试进度</h3>
          <div className="space-y-3">
            {stats.active_interviews.map((job, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-medium text-sm">{job.company}</span>
                  <span className="text-xs text-slate-500">{job.stage}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💰 薪资地图 */}
      {salaryData?.position_stats?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">💰 薪资地图</h3>
          {salaryData.insight && (
            <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2 mb-4">{salaryData.insight}</p>
          )}
          <div className="space-y-4">
            {salaryData.position_stats.map((ps, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700">{ps.position}</span>
                  <span className="text-xs text-slate-400">{ps.count}条数据</span>
                </div>
                <div className="relative h-8 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-20"
                    style={{ left: `${(ps.min / barMax) * 100}%`, right: `${100 - (ps.max / barMax) * 100}%` }}
                  />
                  <div 
                    className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ left: `0%`, width: `${(ps.avg / barMax) * 100}%`, opacity: 0.7 }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{ps.min}K</span>
                  <span className="font-semibold text-blue-600">{ps.avg}K (均)</span>
                  <span>{ps.max}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 周报趋势 */}
      {stats?.weekly_trends?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📈 周报趋势</h3>
          <div className="space-y-3">
            {stats.weekly_trends.map((week, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 font-medium text-sm text-slate-600">{week.week}</div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="w-16 text-xs text-slate-500">投递 {week.applications}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${Math.min((week.applications/15)*100, 100)}%` }} />
                  </div>
                </div>
                <span className="w-20 text-xs text-slate-500">面试 {week.interviews}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!stats?.active_interviews?.length && !stats?.weekly_trends?.length && !salaryData?.position_stats?.length && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-lg font-medium mb-1">还没有求职数据</p>
          <p className="text-sm">点击「+ 新投递」开始记录你的求职进展</p>
        </div>
      )}
    </div>
    </div>
        </div>
    </div>
    </div>
    </div>
  );
}