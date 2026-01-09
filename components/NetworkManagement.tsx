
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { NetworkDefinition } from '../types';
import { Plus, Trash2, Edit3, Loader2, Database, Save, X, Search } from 'lucide-react';

const NetworkManagement: React.FC = () => {
  const [definitions, setDefinitions] = useState<NetworkDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentDef, setCurrentDef] = useState<NetworkDefinition>({ code: '', name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getNetworkDefinitions();
      setDefinitions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDef.code || !currentDef.name) return;
    setSaving(true);
    try {
      await StorageService.saveNetworkDefinition(currentDef);
      await fetchDefinitions();
      setIsEditing(false);
      setCurrentDef({ code: '', name: '' });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (window.confirm(`ยืนยันการลบโครงข่ายรหัส: ${code}?`)) {
      setLoading(true);
      try {
        await StorageService.deleteNetworkDefinition(code);
        await fetchDefinitions();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filtered = definitions.filter(d => 
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Network Master Data</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">จัดการรหัสโครงข่ายส่วนกลาง (Sheet: Detail)</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrentDef({ code: '', name: '' }); }}
          className="px-6 py-3 purple-gradient text-white font-black rounded-2xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> เพิ่มรหัสโครงข่ายใหม่
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                Network Definition Info
              </h3>
              <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Network Code (รหัสโครงข่าย)</label>
                <input 
                  type="text"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all uppercase"
                  placeholder="เช่น 80002356"
                  value={currentDef.code}
                  onChange={e => setCurrentDef({ ...currentDef, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Network Name (ชื่องาน/รายละเอียด)</label>
                <input 
                  type="text"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  placeholder="เช่น งานติดตั้งเสาไฟ..."
                  value={currentDef.name}
                  onChange={e => setCurrentDef({ ...currentDef, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
               <button 
                 type="submit" 
                 disabled={saving}
                 className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 บันทึกข้อมูล
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">รายการโครงข่ายในระบบ</span>
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text"
                placeholder="Search definitions..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-purple-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4">Network Code</th>
                <th className="px-8 py-4">Network Name</th>
                <th className="px-8 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></td></tr>
              ) : filtered.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 font-black text-purple-700 tracking-tight">{d.code}</td>
                  <td className="px-8 py-4 font-bold text-slate-600">{d.name}</td>
                  <td className="px-8 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { setIsEditing(true); setCurrentDef(d); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(d.code)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={3} className="py-20 text-center text-slate-300 italic">ไม่พบข้อมูลโครงข่าย</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkManagement;
