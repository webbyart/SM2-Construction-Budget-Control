
import React, { useState, useMemo, useEffect } from 'react';
import { Project, CutRecord, BudgetCategory, Network } from '../types';
import { StorageService } from '../services/storage';
import { 
  ChevronLeft, 
  PlusCircle, 
  Trash2, 
  Edit3,
  Loader2,
  Wallet,
  CheckCircle2,
  Database,
  Info,
  X
} from 'lucide-react';

interface BudgetCutProps {
  project: Project;
  onBack: () => void;
}

const BudgetCut: React.FC<BudgetCutProps> = ({ project, onBack }) => {
  const [records, setRecords] = useState<CutRecord[]>([]);
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [selectedNetworkCode, setSelectedNetworkCode] = useState<string>((project.networks && project.networks[0])?.networkCode || '');
  const [category, setCategory] = useState<BudgetCategory>('labor');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // State สำหรับการแก้ไข
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [project.wbs]);

  const loadRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const list = await StorageService.getRecordsByWBS(project.wbs);
      setRecords(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const selectedNetwork = useMemo(() => 
    (project.networks || []).find(n => n.networkCode === selectedNetworkCode), 
  [project, selectedNetworkCode]);

  const totals = useMemo(() => {
    const networks = project.networks || [];
    const totalProjectFull = networks.reduce((acc, n) => 
      acc + (n.labor_full || 0) + (n.supervise_full || 0) + (n.transport_full || 0) + (n.misc_full || 0), 0);
    
    const globalLimit = totalProjectFull * (project.maxBudgetPercent / 100);
    const totalSpent = records.reduce((acc, r) => 
      acc + (r.labor_cut || 0) + (r.supervise_cut || 0) + (r.transport_cut || 0) + (r.misc_cut || 0), 0);
    
    const remainingGlobalLimit = Math.max(0, globalLimit - totalSpent);
    
    return { totalProjectFull, globalLimit, totalSpent, remainingGlobalLimit };
  }, [project, records]);

  // คำนวณยอด 80% (หรือตาม MaxPercent) ของหมวดที่เลือกในโครงข่ายที่เลือก
  const currentCategoryLimit = useMemo(() => {
    if (!selectedNetwork) return 0;
    const fullVal = (selectedNetwork as any)[`${category}_full`] || 0;
    return fullVal * (project.maxBudgetPercent / 100);
  }, [selectedNetwork, category, project.maxBudgetPercent]);

  const handleAddOrUpdateCut = async () => {
    if (!detail.trim() || amount <= 0 || !selectedNetwork) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ในกรณีแก้ไข ต้องหักยอดเก่าออกก่อนตรวจสอบ limit (logic นี้ฝั่ง server จัดการแต่ฝั่ง client แจ้งเตือนคร่าวๆ)
    let checkAmount = amount;
    if (editingRecordId) {
      const oldRec = records.find(r => r.id === editingRecordId);
      const oldTotal = oldRec ? (oldRec.labor_cut + oldRec.supervise_cut + oldRec.transport_cut + oldRec.misc_cut) : 0;
      if (checkAmount > (totals.remainingGlobalLimit + oldTotal + 0.1)) {
        alert(`ยอดเบิกเกินวงเงินรวมคงเหลือของโครงการที่คุมไว้ ${project.maxBudgetPercent}%`);
        return;
      }
    } else {
      if (checkAmount > totals.remainingGlobalLimit + 0.1) {
        alert(`ยอดเบิกเกินวงเงินรวมของโครงการที่คุมไว้ ${project.maxBudgetPercent}% (คงเหลือรวม: ${totals.remainingGlobalLimit.toLocaleString()} ฿)`);
        return;
      }
    }

    if (!window.confirm(`ยืนยันการ${editingRecordId ? 'แก้ไข' : 'บันทึก'}การตัดงบ\nโครงข่าย: ${selectedNetworkCode}\nหมวด: ${categoryLabel(category)}\nจำนวน: ${amount.toLocaleString()} ฿`)) return;

    setIsSaving(true);
    try {
      const recordData: CutRecord = {
        id: editingRecordId || "TEMP",
        timestamp: new Date().toISOString(),
        wbs: project.wbs,
        networkCode: selectedNetworkCode,
        projectName: project.name,
        worker: project.worker,
        detail: detail.trim(),
        labor_cut: category === 'labor' ? amount : 0,
        supervise_cut: category === 'supervise' ? amount : 0,
        transport_cut: category === 'transport' ? amount : 0,
        misc_cut: category === 'misc' ? amount : 0,
      };

      if (editingRecordId) {
        await StorageService.updateRecord(editingRecordId, recordData);
      } else {
        await StorageService.addRecord(recordData);
      }
      
      setSaveSuccess(true);
      setTimeout(() => onBack(), 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (r: CutRecord) => {
    setEditingRecordId(r.id);
    setDetail(r.detail);
    setSelectedNetworkCode(r.networkCode);
    
    // หาหมวดที่มีค่า
    if (r.labor_cut > 0) { setCategory('labor'); setAmount(r.labor_cut); }
    else if (r.supervise_cut > 0) { setCategory('supervise'); setAmount(r.supervise_cut); }
    else if (r.transport_cut > 0) { setCategory('transport'); setAmount(r.transport_cut); }
    else if (r.misc_cut > 0) { setCategory('misc'); setAmount(r.misc_cut); }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setDetail('');
    setAmount(0);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('ยืนยันการลบรายการ? ยอดงบประมาณจะถูกคืนเข้าสู่โครงข่ายโดยอัตโนมัติ')) {
      await StorageService.deleteRecord(id);
      loadRecords();
    }
  };

  function categoryLabel(cat: string) {
    switch(cat) {
      case 'labor': return 'ค่าแรง';
      case 'supervise': return 'ควบคุมงาน';
      case 'transport': return 'ขนส่ง';
      case 'misc': return 'เบ็ดเตล็ด';
      default: return cat;
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('th-TH');
    } catch (e) {
      return "N/A";
    }
  };

  if (saveSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
        <h2 className="text-2xl font-black">บันทึกสำเร็จ!</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><ChevronLeft /></button>
        <div>
          <h2 className="text-xl font-black">{project.name} (WBS: {project.wbs})</h2>
          <p className="text-xs font-bold text-slate-400">คุมงบโครงการ {project.maxBudgetPercent}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shared Pool Card */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
             <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Project Pool Usage ({project.maxBudgetPercent}%)</p>
                <div className="text-3xl font-black text-slate-900">{totals.totalSpent.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ {totals.globalLimit.toLocaleString()} ฿</span></div>
                <div className="mt-4 w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                   <div className="bg-purple-600 h-full" style={{ width: `${(totals.totalSpent / (totals.globalLimit || 1)) * 100}%` }}></div>
                </div>
             </div>
             <div className="md:w-1/3 purple-gradient rounded-2xl p-6 text-white text-center">
                <Wallet className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-[10px] font-bold opacity-60 uppercase">คงเหลือรวมเบิกได้</p>
                <div className="text-xl font-black">{totals.remainingGlobalLimit.toLocaleString()}</div>
             </div>
          </div>

          {/* Form */}
          <div className={`bg-white p-8 rounded-[32px] shadow-sm border-2 transition-all ${editingRecordId ? 'border-amber-400 ring-4 ring-amber-400/10' : 'border-slate-100'} space-y-6 relative`}>
             {editingRecordId && (
               <div className="absolute top-4 right-8 flex items-center gap-2">
                 <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">กำลังแก้ไขรายการ</span>
                 <button onClick={cancelEdit} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-4 h-4 text-slate-400" /></button>
               </div>
             )}
             <h3 className="font-black text-slate-800 flex items-center gap-2">
                <PlusCircle className="text-purple-600 w-5 h-5" /> {editingRecordId ? 'แก้ไขรายการเบิก' : 'บันทึกการตัดงบใหม่'}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกโครงข่าย</label>
                   <select 
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                     value={selectedNetworkCode}
                     onChange={e => setSelectedNetworkCode(e.target.value)}
                   >
                     {(project.networks || []).map(n => (
                       <option key={n.networkCode} value={n.networkCode}>โครงข่าย: {n.networkCode}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมวดค่าใช้จ่าย</label>
                   <select 
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                     value={category}
                     onChange={e => setCategory(e.target.value as BudgetCategory)}
                   >
                     <option value="labor">ค่าแรง (คงเหลือ: {(selectedNetwork?.labor_balance || 0).toLocaleString()})</option>
                     <option value="supervise">ควบคุมงาน (คงเหลือ: {(selectedNetwork?.supervise_balance || 0).toLocaleString()})</option>
                     <option value="transport">ขนส่ง (คงเหลือ: {(selectedNetwork?.transport_balance || 0).toLocaleString()})</option>
                     <option value="misc">เบ็ดเตล็ด (คงเหลือ: {(selectedNetwork?.misc_balance || 0).toLocaleString()})</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียด</label>
                   <input 
                     type="text" 
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                     value={detail}
                     onChange={e => setDetail(e.target.value)}
                     placeholder="ระบุรายละเอียดการตัดงบ"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                     <span>จำนวนเงิน (฿)</span>
                     <span className="text-purple-600">เพดาน {project.maxBudgetPercent}%: {currentCategoryLimit.toLocaleString()} ฿</span>
                   </label>
                   <input 
                     type="number" 
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-purple-700 text-lg outline-none focus:ring-2 focus:ring-purple-500"
                     value={amount || ''}
                     onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                   />
                </div>
             </div>
             
             <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold text-purple-800 leading-relaxed uppercase tracking-tight">
                  ยอดเบิกที่ใส่จะต้องไม่ทำให้ยอดเบิกสะสมทั้งโครงการเกิน {project.maxBudgetPercent}% ({totals.globalLimit.toLocaleString()} ฿) 
                  และต้องไม่เกินยอดคงเหลือในหมวดของโครงข่ายนั้นๆ
                </div>
             </div>

             <button 
               onClick={handleAddOrUpdateCut}
               disabled={isSaving}
               className={`w-full py-4 ${editingRecordId ? 'bg-amber-500 hover:bg-amber-600' : 'purple-gradient'} text-white font-black rounded-xl shadow-lg flex justify-center items-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50`}
             >
               {isSaving ? <Loader2 className="animate-spin" /> : editingRecordId ? <Edit3 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
               {editingRecordId ? 'ยืนยันการแก้ไขข้อมูล' : 'บันทึกการตัดงบโครงข่าย'}
             </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-50 font-black uppercase text-xs tracking-widest text-slate-400">ประวัติการตัดงบเฉพาะโครงการนี้</div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-6 py-4">วันที่</th>
                        <th className="px-6 py-4">โครงข่าย</th>
                        <th className="px-6 py-4">รายละเอียด</th>
                        <th className="px-6 py-4 text-right">ยอดเบิก</th>
                        <th className="px-6 py-4 text-center">จัดการ</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {records.map(r => (
                        <tr key={r.id} className={editingRecordId === r.id ? 'bg-amber-50' : ''}>
                           <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{formatDate(r.timestamp)}</td>
                           <td className="px-6 py-4 font-black text-purple-600">{r.networkCode}</td>
                           <td className="px-6 py-4 font-bold">{r.detail}</td>
                           <td className="px-6 py-4 text-right font-mono font-black">
                             {(r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut).toLocaleString()} ฿
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => handleEditClick(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteRecord(r.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                      {records.length === 0 && !isLoadingRecords && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">ไม่มีประวัติการตัดงบ</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">สถานะรายโครงข่าย (Balance)</h4>
              <div className="space-y-6">
                 {(project.networks || []).map(n => {
                   const nFull = (n.labor_full || 0) + (n.supervise_full || 0) + (n.transport_full || 0) + (n.misc_full || 0);
                   const nBal = (n.labor_balance || 0) + (n.supervise_balance || 0) + (n.transport_balance || 0) + (n.misc_balance || 0);
                   const perc = nFull > 0 ? (nBal / nFull) * 100 : 0;
                   return (
                     <div key={n.networkCode} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span>{n.networkCode}</span>
                           <span className={perc < 20 ? 'text-rose-500' : 'text-slate-400'}>{perc.toFixed(0)}% Left</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                           <div className={`h-full ${perc < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${perc}%` }}></div>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCut;
