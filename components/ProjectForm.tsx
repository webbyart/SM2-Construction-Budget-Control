
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { StorageService } from '../services/storage';
import { Save, XCircle, Info, Loader2, Briefcase, User, Percent, Wallet } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onSave: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Project>({
    wbs: '',
    name: '',
    worker: '',
    labor_full: 0,
    supervise_full: 0,
    transport_full: 0,
    misc_full: 0,
    labor_balance: 0,
    supervise_balance: 0,
    transport_balance: 0,
    misc_balance: 0,
    maxBudgetPercent: 80
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (project) {
      setFormData(project);
    }
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'maxBudgetPercent' || name.includes('_full')) ? (parseFloat(value) || 0) : value
    }));
  };

  const validate = async () => {
    const errs = [];
    if (!formData.wbs.trim()) errs.push('กรุณาระบุรหัส WBS');
    if (!formData.name.trim()) errs.push('กรุณาระบุชื่องาน');
    if (!formData.worker.trim()) errs.push('กรุณาระบุชื่อช่าง');
    if (formData.maxBudgetPercent < 0 || formData.maxBudgetPercent > 100) errs.push('เปอร์เซ็นต์คุมงบต้องอยู่ระหว่าง 0-100%');
    
    if (!project) {
      try {
        const projects = await StorageService.getProjects();
        const existing = projects.find(p => StorageService.normalizeWBS(p.wbs) === StorageService.normalizeWBS(formData.wbs));
        if (existing) errs.push('รหัส WBS นี้มีอยู่ในระบบแล้ว');
      } catch (e) {
        console.warn("Could not check WBS uniqueness", e);
      }
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;
    
    setIsLoading(true);
    try {
      // หากเป็นโครงการใหม่ ให้ตั้งค่า Balance เริ่มต้นเท่ากับ Full Budget
      const dataToSave = { ...formData };
      if (!project) {
        dataToSave.labor_balance = dataToSave.labor_full;
        dataToSave.supervise_balance = dataToSave.supervise_full;
        dataToSave.transport_balance = dataToSave.transport_full;
        dataToSave.misc_balance = dataToSave.misc_full;
      }
      
      await StorageService.saveProject(dataToSave);
      onSave();
    } catch (err: any) {
      setErrors([err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล']);
    } finally {
      setIsLoading(false);
    }
  };

  const totalFull = formData.labor_full + formData.supervise_full + formData.transport_full + formData.misc_full;
  const limitTotal = totalFull * (formData.maxBudgetPercent / 100);

  return (
    <div className="max-w-4xl mx-auto py-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="purple-gradient p-10 text-white relative">
          <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <h2 className="text-3xl font-black tracking-tight">{project ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}</h2>
          <p className="text-white/60 text-sm mt-2 font-medium">ตั้งค่าข้อมูลโครงการและงบประมาณเพื่อเริ่มการควบคุมค่าใช้จ่าย</p>
        </div>

        <div className="p-10 space-y-10">
          {errors.length > 0 && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-3xl animate-in shake duration-500">
              <div className="flex items-center gap-3 text-rose-800 font-black mb-2 uppercase tracking-widest text-xs">
                <XCircle className="w-5 h-5" /> ตรวจพบข้อผิดพลาด
              </div>
              <ul className="list-disc list-inside text-rose-700 text-sm font-medium space-y-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">รหัส WBS (Unique ID)</label>
              <div className="relative group">
                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  name="wbs"
                  disabled={!!project}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold disabled:opacity-50"
                  value={formData.wbs}
                  onChange={handleInputChange}
                  placeholder="เช่น 8000XXXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ชื่องาน / โครงการ</label>
              <input
                type="text"
                name="name"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="ระบุชื่องานก่อสร้าง"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">วิศวกรคุมงาน (Worker)</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  name="worker"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold"
                  value={formData.worker}
                  onChange={handleInputChange}
                  placeholder="ชื่อ-นามสกุล ช่าง/วิศวกร"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                เปอร์เซ็นต์คุมงบสูงสุด
                <Info className="w-4 h-4 text-slate-300 cursor-help" />
              </label>
              <div className="relative group">
                <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="number"
                  name="maxBudgetPercent"
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-black text-purple-700 text-xl"
                  value={formData.maxBudgetPercent}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
              </div>
            </div>
          </div>

          {/* Budget Allocation */}
          <div className="pt-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-slate-100"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Budget Allocation (100%)</h3>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'ค่าแรง', name: 'labor_full', icon: '👷' },
                { label: 'ควบคุมงาน', name: 'supervise_full', icon: '📋' },
                { label: 'ค่าขนส่ง', name: 'transport_full', icon: '🚚' },
                { label: 'เบ็ดเตล็ด', name: 'misc_full', icon: '📦' },
              ].map((field) => (
                <div key={field.name} className="space-y-3 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:border-purple-200 transition-colors group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-base grayscale group-hover:grayscale-0 transition-all">{field.icon}</span>
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name={field.name}
                      className="w-full bg-transparent border-none text-2xl font-mono font-black text-slate-800 focus:ring-0 p-0 placeholder-slate-200"
                      value={(formData as any)[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                    <div className="text-[10px] text-slate-300 font-black uppercase mt-1">บาท</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 flex items-start gap-6">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <Wallet className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-amber-900 font-black uppercase tracking-widest text-xs mb-1">สรุปงบประมาณที่ต้องการควบคุม</h4>
              <p className="text-amber-800/80 text-sm font-medium leading-relaxed">
                งบประมาณเต็มทั้งหมดคือ <strong className="text-amber-950">{totalFull.toLocaleString()} ฿</strong> <br />
                แต่ระบบจะอนุญาตให้เบิกได้รวมทุกหมวดหมู่ไม่เกิน <strong className="text-purple-800 text-lg font-black">{limitTotal.toLocaleString()} ฿</strong> ({formData.maxBudgetPercent}%)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
            <button 
              type="button" 
              onClick={onSave} 
              className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-12 py-5 purple-gradient text-white font-black rounded-[24px] shadow-2xl shadow-purple-900/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:scale-100"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {project ? 'UPDATE PROJECT' : 'CREATE PROJECT'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
