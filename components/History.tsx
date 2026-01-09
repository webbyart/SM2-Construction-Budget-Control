
import React, { useState, useEffect } from 'react';
import { StorageService, RecordFilter } from '../services/storage';
import { CutRecord } from '../types';
import { Search, Filter, Calendar, X, History as HistoryIcon, Loader2 } from 'lucide-react';

const History: React.FC = () => {
  const [filter, setFilter] = useState<RecordFilter>({
    search: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<CutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getRecords(filter);
      setRecords(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({ search: '', startDate: '', endDate: '' });
  };

  const totalSum = records.reduce((acc, r) => acc + r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut, 0);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString('th-TH');
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-50 rounded-2xl">
                <HistoryIcon className="w-6 h-6 text-purple-700" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Budget Cut History</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">สรุปการเบิกจ่ายโครงการทั้งหมด</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาตาม WBS, งาน, ช่าง, หรือรายละเอียด..."
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
             <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3.5 rounded-2xl transition-all border ${
                showFilters || filter.startDate || filter.endDate 
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/20' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            {(filter.search || filter.startDate || filter.endDate) && (
              <button 
                onClick={clearFilters}
                className="p-3.5 text-rose-600 bg-white border border-rose-200 rounded-2xl hover:bg-rose-50 transition-all"
                title="ล้างการค้นหา"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Start Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold text-slate-700"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> End Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold text-slate-700"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Project Info</th>
                <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Detail</th>
                <th className="px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" /></td></tr>
              ) : records.map((r, i) => {
                const totalCut = r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(r.timestamp)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-sm tracking-tight">{r.projectName}</div>
                      <div className="text-[10px] font-black text-purple-600 uppercase mt-0.5">WBS: {r.wbs} • {r.worker}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-slate-700 font-bold text-sm">{r.detail}</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        {[
                          r.labor_cut > 0 && 'ค่าแรง',
                          r.supervise_cut > 0 && 'ควบคุมงาน',
                          r.transport_cut > 0 && 'ขนส่ง',
                          r.misc_cut > 0 && 'เบ็ดเตล็ด'
                        ].filter(Boolean).join(', ')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-mono font-black text-slate-900 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-sm">
                        {totalCut.toLocaleString()} ฿
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center text-slate-400 italic font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-14 h-14 opacity-10" />
                      <p className="font-black uppercase tracking-widest text-[10px]">ไม่พบประวัติข้อมูลตามเงื่อนไข</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between items-center px-8 py-6 bg-slate-900 rounded-[32px] text-white shadow-xl shadow-slate-900/20">
        <div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Total Expenditure</p>
           <h4 className="text-sm font-bold text-slate-300">ยอดสรุปรายการเบิกที่แสดง</h4>
        </div>
        <div className="text-right">
           <p className="text-3xl font-black tracking-tight">{totalSum.toLocaleString()} <span className="text-sm font-bold text-slate-500 uppercase">THB</span></p>
        </div>
      </div>
    </div>
  );
};

export default History;
