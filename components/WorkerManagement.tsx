
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Worker } from '../types';
import { UserPlus, HardHat, BadgeCheck } from 'lucide-react';

const WorkerManagement: React.FC = () => {
  // Fix: Use state and useEffect for asynchronous worker fetching
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [name, setName] = useState('');
  const [pos, setPos] = useState('');

  useEffect(() => {
    const fetchWorkers = async () => {
      const data = await StorageService.getWorkers();
      setWorkers(data || []);
    };
    fetchWorkers();
  }, []);

  const handleAdd = async () => {
    if (!name || !pos) return;
    // Fix: addWorker is now defined in StorageService
    await StorageService.addWorker({ id: Date.now().toString(), name, position: pos });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
           <UserPlus className="text-purple-600" /> เพิ่มรายชื่อช่าง
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input 
             type="text" 
             placeholder="ชื่อ-นามสกุล ช่าง" 
             className="px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold"
             value={name}
             onChange={e => setName(e.target.value)}
           />
           <input 
             type="text" 
             placeholder="ตำแหน่ง / ความเชี่ยวชาญ" 
             className="px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold"
             value={pos}
             onChange={e => setPos(e.target.value)}
           />
        </div>
        <button 
          onClick={handleAdd}
          className="mt-6 px-10 py-4 purple-gradient text-white font-bold rounded-2xl shadow-lg hover:translate-y-[-2px] transition-all"
        >
          บันทึกรายชื่อช่าง
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workers.map(w => (
          <div key={w.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                <HardHat className="w-8 h-8" />
             </div>
             <div>
                <h3 className="font-black text-slate-800">{w.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-emerald-500" /> {w.position}
                </p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerManagement;
