
import React, { useState, useMemo, useEffect } from 'react';
import { Project, CutRecord, BudgetCategory } from '../types';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { 
  ChevronLeft, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  Sparkles,
  PieChart,
  History as HistoryIcon,
  Loader2,
  Wallet,
  ArrowDownCircle,
  CheckCircle2
} from 'lucide-react';

interface BudgetCutProps {
  project: Project;
  onBack: () => void;
}

const BudgetCut: React.FC<BudgetCutProps> = ({ project, onBack }) => {
  const [records, setRecords] = useState<CutRecord[]>([]);
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<BudgetCategory>('labor');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [project.wbs]);

  const loadRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const list = await StorageService.getRecordsByWBS(project.wbs);
      setRecords(list || []);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const totals = useMemo(() => {
    // ยอด 100% ทั้งหมด
    const sumFull = project.labor_full + project.supervise_full + project.transport_full + project.misc_full;
    // เพดานที่เบิกได้รวม (เช่น 80% ของยอดเต็มทั้งหมด)
    const globalLimit = sumFull * (project.maxBudgetPercent / 100);
    // ยอดรวมที่ตัดไปแล้วทั้งหมด
    const sumCuts = records.reduce((acc, r) => acc + r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut, 0);
    // ยอดคงเหลือที่ตัดได้ในภาพรวม (Global Pool)
    const remainingGlobalLimit = Math.max(0, globalLimit - sumCuts);
    
    // Category balances (Actual remaining in each category)
    const catBalances = {
      labor: project.labor_balance,
      supervise: project.supervise_balance,
      transport: project.transport_balance,
      misc: project.misc_balance
    };

    return { sumFull, globalLimit, sumCuts, remainingGlobalLimit, catBalances };
  }, [project, records]);

  const handleAddCut = async () => {
    if (!detail.trim() || amount <= 0) {
      alert('กรุณากรอกรายละเอียดและจำนวนเงินที่ต้องการตัด');
      return;
    }

    // กฎธุรกิจ: ตัดงบในหมวดหมู่ใดก็ได้ ห้ามเกินภาพรวมเปอร์เซ็นต์ที่กำหนด (Global Limit)
    // และห้ามเบิกเกินเงินที่มีในหมวดนั้นจริงๆ (Physical Balance)
    
    if (amount > totals.remainingGlobalLimit) {
      alert(`ไม่สามารถตัดงบได้เกินวงเงินคงเหลือในภาพรวม ${project.maxBudgetPercent}% (${totals.remainingGlobalLimit.toLocaleString()} ฿)`);
      return;
    }

    const currentCatBalance = totals.catBalances[category];
    if (amount > currentCatBalance) {
      alert(`ยอดเงินในหมวดนี้ไม่เพียงพอ (คงเหลือในหมวด: ${currentCatBalance.toLocaleString()} ฿)`);
      return;
    }

    setIsSaving(true);
    try {
      const newRecord: CutRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        wbs: project.wbs,
        projectName: project.name,
        worker: project.worker,
        detail: detail.trim(),
        labor_cut: category === 'labor' ? amount : 0,
        supervise_cut: category === 'supervise' ? amount : 0,
        transport_cut: category === 'transport' ? amount : 0,
        misc_cut: category === 'misc' ? amount : 0,
      };

      await StorageService.addRecord(newRecord);
      setDetail('');
      setAmount(0);
      alert('บันทึกการตัดงบสำเร็จ');
      onBack(); 
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('ยืนยันการลบประวัติการตัดงบนี้? วงเงินจะถูกคืนเข้าสู่ระบบ')) {
      await StorageService.deleteRecord(id);
      loadRecords();
    }
  };

  const handleGetAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const summary = await GeminiService.analyzeBudget(project, records);
      setAiAnalysis(summary || "ไม่สามารถวิเคราะห์ได้ในขณะนี้");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categoryLabel = (cat: string) => {
    switch(cat) {
      case 'labor': return 'ค่าแรง';
      case 'supervise': return 'ควบคุมงาน';
      case 'transport': return 'ขนส่ง';
      case 'misc': return 'เบ็ดเตล็ด';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 border border-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">โครงการ {project.wbs}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-slate-500 font-bold">{project.name}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-xs font-black text-purple-600 uppercase tracking-wider">ช่าง: {project.worker}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-2xl border border-purple-100">
          <PieChart className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-black text-purple-700 uppercase tracking-widest">
            Control Limit: {project.maxBudgetPercent}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Pool Usage</p>
                   <span className="text-xs font-black text-slate-900">{((totals.sumCuts / totals.globalLimit) * 100).toFixed(1)}%</span>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{totals.sumCuts.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ {totals.globalLimit.toLocaleString()} ฿</span></div>
              </div>
              <div className="mt-6">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${totals.sumCuts / totals.globalLimit > 0.9 ? 'bg-rose-500' : 'bg-purple-600'}`}
                    style={{ width: `${Math.min(100, (totals.sumCuts / totals.globalLimit) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-purple-600">เบิกไปแล้ว {totals.sumCuts.toLocaleString()}</span>
                  <span className="text-slate-400">Limit {totals.globalLimit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="purple-gradient p-8 rounded-[32px] shadow-xl shadow-purple-900/20 text-white flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <Wallet className="w-8 h-8 mb-4 text-yellow-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">วงเงินคงเหลือที่ตัดได้</p>
              <div className="text-4xl font-black tracking-tight">{totals.remainingGlobalLimit.toLocaleString()} ฿</div>
              {totals.remainingGlobalLimit < totals.globalLimit * 0.1 && totals.remainingGlobalLimit > 0 && (
                <div className="mt-4 px-3 py-1 bg-rose-500/20 text-rose-200 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Budget Critical
                </div>
              )}
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl">
                <ArrowDownCircle className="w-5 h-5 text-purple-600" />
              </div>
              บันทึกการตัดงบใหม่
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หมวดงบประมาณ</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                >
                  <option value="labor">👷 ค่าแรง (เหลือ {totals.catBalances.labor.toLocaleString()})</option>
                  <option value="supervise">📋 ควบคุมงาน (เหลือ {totals.catBalances.supervise.toLocaleString()})</option>
                  <option value="transport">🚚 ค่าขนส่ง (เหลือ {totals.catBalances.transport.toLocaleString()})</option>
                  <option value="misc">📦 เบ็ดเตล็ด (เหลือ {totals.catBalances.misc.toLocaleString()})</option>
                </select>
              </div>
              <div className="md:col-span-5 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียดรายการ</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-medium transition-all"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="เช่น เบิกค่าแรงช่างประจำเดือน..."
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">จำนวนเงิน (฿)</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-mono font-bold text-slate-900 transition-all"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <button 
              onClick={handleAddCut}
              disabled={isSaving}
              className="mt-8 w-full py-5 purple-gradient text-white font-black rounded-2xl shadow-xl shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:scale-100"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-6 h-6" />}
              ยืนยันการตัดงบโครงการ
            </button>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <HistoryIcon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">ประวัติการตัดงบโครงการ</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{records.length} รายการ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-5">วันที่เบิก</th>
                    <th className="px-8 py-5">รายละเอียด</th>
                    <th className="px-8 py-5">หมวด</th>
                    <th className="px-8 py-5 text-right">ยอดเบิก</th>
                    <th className="px-8 py-5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">{new Date(r.timestamp).toLocaleDateString('th-TH')}</td>
                      <td className="px-8 py-5 font-bold text-slate-800">{r.detail}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                          r.labor_cut > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          r.supervise_cut > 0 ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          r.transport_cut > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {categoryLabel(r.labor_cut > 0 ? 'labor' : r.supervise_cut > 0 ? 'supervise' : r.transport_cut > 0 ? 'transport' : 'misc')}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-black text-slate-900">
                        {(r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut).toLocaleString()} ฿
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && !isLoadingRecords && (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 italic font-medium">ยังไม่มีประวัติการเบิกงบในระบบ</td></tr>
                  )}
                  {isLoadingRecords && (
                    <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI & Side Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl border border-white/5 flex flex-col h-[400px] relative overflow-hidden group">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-purple-600/20 rounded-full blur-3xl transition-all duration-1000 group-hover:bg-purple-600/40"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black tracking-tight">AI Analysis</h3>
              </div>

              {!aiAnalysis && !isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-slate-400 text-sm font-medium">ให้ Gemini AI ช่วยวิเคราะห์สถานะงบประมาณและภาพรวมการใช้จ่ายของโครงการนี้</p>
                  </div>
                  <button 
                    onClick={handleGetAIAnalysis}
                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-white/5"
                  >
                    เริ่มการวิเคราะห์
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin shadow-2xl shadow-purple-500/50"></div>
                  <p className="text-purple-400 font-black uppercase tracking-[0.2em] animate-pulse">Processing...</p>
                </div>
              )}

              {aiAnalysis && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-slate-200 text-sm leading-relaxed whitespace-pre-line italic shadow-inner">
                      "{aiAnalysis}"
                    </div>
                  </div>
                  <button 
                    onClick={handleGetAIAnalysis}
                    className="mt-6 text-[10px] text-purple-400 hover:text-purple-300 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors border border-white/10 py-3 rounded-xl"
                  >
                    <Sparkles className="w-3 h-3" /> Re-Analyze
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Budget Category Status (100%)</h4>
            <div className="space-y-6">
              {[
                { label: 'ค่าแรง', balance: totals.catBalances.labor, full: project.labor_full, color: 'bg-blue-500', icon: '👷' },
                { label: 'ควบคุมงาน', balance: totals.catBalances.supervise, full: project.supervise_full, color: 'bg-purple-500', icon: '📋' },
                { label: 'ขนส่ง', balance: totals.catBalances.transport, full: project.transport_full, color: 'bg-amber-500', icon: '🚚' },
                { label: 'เบ็ดเตล็ด', balance: totals.catBalances.misc, full: project.misc_full, color: 'bg-slate-400', icon: '📦' },
              ].map((cat, i) => {
                const percUsed = cat.full > 0 ? ((cat.full - cat.balance) / cat.full) * 100 : 0;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                         <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{cat.icon} {cat.label}</span>
                         <p className="text-[10px] font-bold text-slate-400 mt-0.5">คงเหลือ {cat.balance.toLocaleString()} ฿</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-900">{percUsed.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-100/50">
                      <div 
                        className={`${cat.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(100, percUsed)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
               </div>
               <p className="text-[10px] text-slate-500 font-medium leading-tight">ระบบอนุญาตให้เบิกข้ามหมวดหมู่ได้ ตราบใดที่ยอดรวมไม่เกิน {project.maxBudgetPercent}% ของงบรวมทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCut;
