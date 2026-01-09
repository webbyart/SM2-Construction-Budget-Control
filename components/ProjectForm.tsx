
import React, { useState, useEffect } from 'react';
import { Project, Network, NetworkDefinition } from '../types';
import { StorageService } from '../services/storage';
import { Save, Plus, Trash2, Loader2, Briefcase, Percent, Database, ChevronDown, AlertCircle, RefreshCw, PenTool, FileText, Calendar, Hash } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onSave: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [wbs, setWbs] = useState('');
  const [name, setName] = useState('');
  const [worker, setWorker] = useState('');
  const [maxBudgetPercent, setMaxBudgetPercent] = useState(80);
  const [approvalNumber, setApprovalNumber] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [networkDefs, setNetworkDefs] = useState<NetworkDefinition[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (project) {
      setWbs(project.wbs);
      setName(project.name);
      setWorker(project.worker);
      setMaxBudgetPercent(project.maxBudgetPercent);
      setApprovalNumber(project.approvalNumber || '');
      
      // Format date for <input type="date"> (YYYY-MM-DD)
      if (project.approvalDate) {
        try {
          const date = new Date(project.approvalDate);
          if (!isNaN(date.getTime())) {
            setApprovalDate(date.toISOString().split('T')[0]);
          } else {
            setApprovalDate('');
          }
        } catch (e) {
          setApprovalDate('');
        }
      }
      setNetworks(project.networks || []);
    } else {
      addNetwork();
    }
  }, [project]);

  const loadMasterData = async () => {
    setIsRefreshing(true);
    try {
      const defs = await StorageService.getNetworkDefinitions();
      setNetworkDefs(defs || []);
      setIsDataLoaded(true);
    } catch (e) {
      console.error("Error loading master data:", e);
      setIsDataLoaded(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const addNetwork = () => {
    const newNet: Network = {
      networkCode: '',
      networkName: '',
      labor_full: 0, supervise_full: 0, transport_full: 0, misc_full: 0,
      labor_balance: 0, supervise_balance: 0, transport_balance: 0, misc_balance: 0
    };
    setNetworks([...networks, newNet]);
  };

  const removeNetwork = (index: number) => {
    if (networks.length <= 1) return;
    setNetworks(networks.filter((_, i) => i !== index));
  };

  const handleNetworkChange = (index: number, field: keyof Network, value: string | number) => {
    const updated = [...networks];
    const net = { ...updated[index] };
    
    if (typeof value === 'number' || (typeof value === 'string' && field.endsWith('_full'))) {
      const num = parseFloat(value.toString()) || 0;
      (net as any)[field] = num;
      
      // For new projects, initialize balance to full budget
      if (!project && field.endsWith('_full')) {
        const balanceField = field.replace('_full', '_balance');
        (net as any)[balanceField] = num;
      }
    } else {
      (net as any)[field] = value;
    }
    
    updated[index] = net;
    setNetworks(updated);
  };

  // Logic: User selects name from dropdown. Code remains manual.
  const onSelectNetworkFromDropdown = (index: number, name: string) => {
    const updated = [...networks];
    const def = networkDefs.find(d => d.name === name);
    updated[index] = { 
      ...updated[index], 
      networkName: name,
      // If found in master data, we can suggest the code, but user can still change it
      networkCode: def ? def.code : updated[index].networkCode
    };
    setNetworks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wbs.trim() || !name.trim() || !worker.trim() || networks.some(n => !n.networkCode.trim())) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนและระบุเลขที่โครงข่ายทุกรายการ');
      return;
    }

    setIsLoading(true);
    try {
      const payload: Project = {
        wbs: wbs.trim().toUpperCase(), 
        name: name.trim(), 
        worker: worker.trim(), 
        maxBudgetPercent: Number(maxBudgetPercent),
        approvalNumber: approvalNumber.trim(),
        approvalDate: approvalDate,
        networks: networks.map(n => ({ 
          ...n,
          networkCode: n.networkCode.trim(),
          networkName: n.networkName || '',
          labor_balance: n.labor_balance !== undefined && project ? n.labor_balance : n.labor_full,
          supervise_balance: n.supervise_balance !== undefined && project ? n.supervise_balance : n.supervise_full,
          transport_balance: n.transport_balance !== undefined && project ? n.transport_balance : n.transport_full,
          misc_balance: n.misc_balance !== undefined && project ? n.misc_balance : n.misc_full
        }))
      };
      await StorageService.saveProject(payload);
      onSave();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const totalFullAll = networks.reduce((acc, n) => acc + (Number(n.labor_full) || 0) + (Number(n.supervise_full) || 0) + (Number(n.transport_full) || 0) + (Number(n.misc_full) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="purple-gradient p-10 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{project ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}</h2>
            <p className="text-white/60 text-sm mt-1 font-medium">จัดการข้อมูลโครงการและโครงข่ายงบประมาณ</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
               type="button" 
               onClick={loadMasterData}
               disabled={isRefreshing}
               className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all text-white/80"
               title="โหลดข้อมูลรหัสโครงข่ายใหม่"
             >
               <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
             </button>
             <div className="hidden md:block bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60">Total Estimated</p>
                <p className="text-2xl font-black">{totalFullAll.toLocaleString()} ฿</p>
             </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Project ID / WBS</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none disabled:opacity-50 uppercase"
                  value={wbs}
                  onChange={e => setWbs(e.target.value)}
                  disabled={!!project}
                  placeholder="C-XX-XXXXX-XX-X"
                />
              </div>
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ชื่องาน</label>
              <input
                type="text"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ชื่อโครงการ"
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ผู้คุมงาน (ช่าง)</label>
              <div className="relative">
                <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white outline-none"
                  value={worker}
                  onChange={e => setWorker(e.target.value)}
                  placeholder="ระบุชื่อช่าง"
                />
              </div>
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Control Pool (%)</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="number"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-purple-700 focus:bg-white outline-none"
                  value={maxBudgetPercent}
                  onChange={e => setMaxBudgetPercent(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Approval Info */}
          <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-4">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <FileText className="w-4 h-4 text-purple-600" />
               ข้อมูลการอนุมัติ (Approval Info)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">เลขที่อนุมัติ</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
                      value={approvalNumber}
                      onChange={e => setApprovalNumber(e.target.value)}
                      placeholder="ระบุเลขที่อนุมัติ"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">วันที่อนุมัติ</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all"
                      value={approvalDate}
                      onChange={e => setApprovalDate(e.target.value)}
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Networks Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <Database className="w-4 h-4 text-purple-600" />
                 รายการโครงข่าย (Networks Selection)
               </h3>
               <button 
                 type="button" 
                 onClick={addNetwork}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm"
               >
                 <Plus className="w-3 h-3" /> Add Row
               </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-[24px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4 w-96">ชื่องานโครงข่าย (Select)</th>
                    <th className="px-6 py-4 w-48">เลขที่โครงข่าย (Code)</th>
                    <th className="px-6 py-4">ค่าแรง (100%)</th>
                    <th className="px-6 py-4">คุมงาน (100%)</th>
                    <th className="px-6 py-4">ขนส่ง (100%)</th>
                    <th className="px-6 py-4">เบ็ดเตล็ด (100%)</th>
                    <th className="px-6 py-4 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {networks.map((net, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select 
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs appearance-none focus:ring-2 focus:ring-purple-500 outline-none pr-8 truncate"
                              value={net.networkName || ""}
                              onChange={e => onSelectNetworkFromDropdown(idx, e.target.value)}
                            >
                              <option value="">-- เลือกชื่องานจากฐานข้อมูล --</option>
                              {networkDefs.map(def => (
                                <option key={def.code} value={def.name}>
                                  {def.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                            <input 
                              type="text"
                              className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-black text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none"
                              placeholder="กรอกเลขที่"
                              value={net.networkCode}
                              onChange={e => handleNetworkChange(idx, 'networkCode', e.target.value.toUpperCase())}
                            />
                          </div>
                        </td>
                        {['labor_full', 'supervise_full', 'transport_full', 'misc_full'].map(field => (
                          <td key={field} className="px-4 py-3">
                            <input 
                              type="number"
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                              placeholder="0.00"
                              value={(net as any)[field] || ''}
                              onChange={e => handleNetworkChange(idx, field as keyof Network, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button 
                            type="button"
                            onClick={() => removeNetwork(idx)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20"
                            disabled={networks.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {!isDataLoaded && !isRefreshing && (
              <div className="p-8 text-center text-slate-400 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase">Initializing Master Data...</p>
              </div>
            )}
            
            {isDataLoaded && networkDefs.length === 0 && (
               <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 text-amber-700">
                  <AlertCircle className="w-6 h-6 shrink-0" /> 
                  <div className="text-xs">
                    <p className="font-black uppercase tracking-tight">Data Not Found</p>
                    <p className="font-medium opacity-80">กรุณาเพิ่มรหัสโครงข่ายในเมนู "จัดการโครงข่าย (Detail)" หรือกดปุ่มรีเฟรชด้านบนเพื่อดึงข้อมูลใหม่</p>
                  </div>
               </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-4">
             <button 
               type="submit" 
               disabled={isLoading}
               className="px-12 py-5 purple-gradient text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 transition-all hover:scale-[1.02] shadow-purple-900/20"
             >
               {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
               {project ? 'บันทึกการแก้ไขโครงการ' : 'สร้างโครงการพร้อมโครงข่าย'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
