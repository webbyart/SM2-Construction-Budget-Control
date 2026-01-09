
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { View } from '../App';
import { Briefcase, Users as UsersIcon, Wallet, Percent, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  onNavigate: (v: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    uniqueWorkers: 0,
    totalBudget100: 0,
    totalBudgetLimit: 0,
    totalCuts: 0,
    remainingLimit: 0,
    workerCounts: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const projects = await StorageService.getProjects();
        const records = await StorageService.getRecords();
        
        let totalBudget100 = 0;
        let totalBudgetLimit = 0;
        let totalCuts = 0;
        const workerCounts: Record<string, number> = {};

        projects.forEach(p => {
          const pTotal = p.labor_full + p.supervise_full + p.transport_full + p.misc_full;
          totalBudget100 += pTotal;
          totalBudgetLimit += pTotal * (p.maxBudgetPercent / 100);
          workerCounts[p.worker] = (workerCounts[p.worker] || 0) + 1;
        });

        records.forEach(r => {
          totalCuts += r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut;
        });

        setStats({
          totalJobs: projects.length,
          uniqueWorkers: Object.keys(workerCounts).length,
          totalBudget100,
          totalBudgetLimit,
          totalCuts,
          remainingLimit: Math.max(0, totalBudgetLimit - totalCuts),
          workerCounts
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  const cards = [
    { title: 'จำนวนงานทั้งหมด', value: stats.totalJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'จำนวนช่าง', value: stats.uniqueWorkers, icon: UsersIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'งบประมาณรวม (100%)', value: stats.totalBudget100.toLocaleString() + ' ฿', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'งบที่ตัดได้จริง (Limit)', value: stats.totalBudgetLimit.toLocaleString() + ' ฿', icon: Percent, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'ยอดที่เบิกไปแล้ว', value: stats.totalCuts.toLocaleString() + ' ฿', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'คงเหลือที่เบิกได้', value: stats.remainingLimit.toLocaleString() + ' ฿', icon: Wallet, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className={`p-4 rounded-2xl ${card.bg}`}>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
            <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{card.title}</h3>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="text-purple-600" />
            Project Load per Engineer
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Engineer Name</th>
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Projects</th>
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Workload Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(stats.workerCounts).map(([worker, count], idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 font-bold text-slate-800">{worker}</td>
                  <td className="py-5 text-slate-600 font-medium">{count} งาน</td>
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${(count / (stats.totalJobs || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{Math.round((count / (stats.totalJobs || 1)) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {Object.keys(stats.workerCounts).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-300 italic font-medium">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    ไม่มีข้อมูลภาระงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
