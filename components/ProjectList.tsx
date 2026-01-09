
import React, { useState, useEffect } from 'react';
import { StorageService, ProjectStats } from '../services/storage';
import { Project } from '../types';
import { Search, Edit3, Scissors, Trash2, AlertCircle, Loader2, Database } from 'lucide-react';

interface ProjectListProps {
  onEdit: (p: Project) => void;
  onCut: (p: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onEdit, onCut }) => {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter(p => 
    (p.wbs || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.worker || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (wbs: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ WBS: ${wbs}? การลบจะรวมถึงข้อมูลโครงข่ายทั้งหมดภายใต้รหัสนี้`)) {
      setLoading(true);
      try {
        await StorageService.deleteProject(wbs);
        await fetchProjects();
      } catch (e) {
        alert("ล้มเหลว: " + e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Project Management</h2>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">แสดงทั้งหมด {filteredProjects.length} โครงการ</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหา WBS, ชื่องาน หรือชื่อช่าง..."
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Project / WBS</th>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Networks</th>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Full Budget</th>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Shared Pool</th>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Remaining</th>
              <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                   <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" />
                </td>
              </tr>
            ) : filteredProjects.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="font-black text-slate-900 group-hover:text-purple-700 transition-colors tracking-tight">{p.wbs}</div>
                  <div className="text-sm text-slate-400 font-bold line-clamp-1">{p.name}</div>
                  <div className="text-[10px] font-black text-slate-300 uppercase mt-1">Engineer: {p.worker}</div>
                </td>
                <td className="px-8 py-6 text-center">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black border border-purple-100">
                      <Database className="w-3 h-3" /> {(p.networks || []).length}
                   </div>
                </td>
                <td className="px-8 py-6 text-center font-mono text-sm text-slate-500 font-bold">
                  {(p.totalFullBudget || 0).toLocaleString()} ฿
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="text-sm font-black text-amber-600">{(p.totalLimitBudget || 0).toLocaleString()} ฿</div>
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{p.maxBudgetPercent}% Limit</div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className={`text-sm font-black ${(p.remainingLimit || 0) > ((p.totalLimitBudget || 0) * 0.1) ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(p.remainingLimit || 0).toLocaleString()} ฿
                  </div>
                  <div className="w-16 mx-auto mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${p.percentUsed > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(100, p.percentUsed || 0)}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex justify-center gap-1">
                    <button 
                      onClick={() => onEdit(p)}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onCut(p)}
                      className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    >
                      <Scissors className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.wbs)}
                      className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;
