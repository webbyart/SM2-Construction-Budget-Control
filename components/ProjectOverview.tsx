
import React, { useState, useEffect } from 'react';
import { StorageService, ProjectStats } from '../services/storage';
import { BarChart3, TrendingUp, AlertTriangle, Loader2, Search } from 'lucide-react';

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await StorageService.getProjectsWithStats();
        setProjects(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.wbs.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.worker.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Loading Project Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
         <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Live Project Overview</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานะงบประมาณและภาระงานล่าสุด</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
               <input 
                 type="text"
                 placeholder="ค้นหาโครงการ..."
                 className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 w-64 shadow-sm"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connected</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.map(p => (
          <div key={p.wbs} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-all group">
            <div className="w-full md:w-1/3">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">{p.wbs}</h3>
               </div>
               <p className="text-sm text-slate-500 font-bold line-clamp-1">{p.name}</p>
               <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase border border-slate-100">
                    <TrendingUp className="w-3 h-3 text-purple-600" /> Engineer: {p.worker}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase border border-purple-100">
                    Limit: {p.maxBudgetPercent}%
                  </div>
               </div>
            </div>
            
            <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Full 100%</p>
                  <p className="text-base font-black text-slate-800 tracking-tight">{p.totalFullBudget.toLocaleString()} ฿</p>
               </div>
               <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                  <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1">Limit Target</p>
                  <p className="text-base font-black text-amber-600 tracking-tight">{p.totalLimitBudget.toLocaleString()} ฿</p>
               </div>
               <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
                  <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-1">Total Cut</p>
                  <p className="text-base font-black text-rose-600 tracking-tight">{p.totalSpent.toLocaleString()} ฿</p>
               </div>
               <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-base font-black text-emerald-600 tracking-tight">{p.remainingLimit.toLocaleString()} ฿</p>
               </div>
            </div>

            <div className="w-full md:w-1/5 flex flex-col gap-2">
               <div className="flex justify-between items-center text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    {p.percentUsed > 90 ? <AlertTriangle className="w-3 h-3 text-rose-500" /> : <BarChart3 className="w-3 h-3 text-purple-600" />}
                    Usage
                  </span>
                  <span className={p.percentUsed > 90 ? 'text-rose-600' : 'text-purple-600'}>{p.percentUsed.toFixed(1)}%</span>
               </div>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[2px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${p.percentUsed > 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-purple-600'}`}
                    style={{ width: `${Math.min(100, p.percentUsed)}%` }}
                  ></div>
               </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && !loading && (
          <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-200 text-center shadow-inner">
            <BarChart3 className="w-20 h-20 text-slate-100 mx-auto mb-6" />
            <h4 className="text-xl font-black text-slate-300 uppercase tracking-tighter">No Active Projects Found</h4>
            <p className="text-slate-400 font-medium mt-2">ไม่พบโครงการตามที่ค้นหา หรือกรุณาเพิ่มโครงการใหม่</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
