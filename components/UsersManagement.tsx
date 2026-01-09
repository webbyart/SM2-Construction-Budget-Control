
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User, Role } from '../types';
import { UserPlus, Shield, User as UserIcon, Lock, Trash2, ShieldAlert } from 'lucide-react';

const UsersManagement: React.FC = () => {
  // Fix: Use state and useEffect for asynchronous user fetching
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<User>({ username: '', password: '', role: 'user' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await StorageService.getUsers();
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.username || !formData.password) return;
      await StorageService.addUser(formData);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">บัญชีผู้ใช้งานระบบ</h2>
          <p className="text-sm text-slate-500">จัดการสิทธิ์และรหัสผ่านสำหรับเจ้าหน้าที่</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 purple-gradient text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
          >
            <UserPlus className="w-5 h-5" /> เพิ่มผู้ใช้ใหม่
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddUser} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">ลงทะเบียนผู้ใช้งานใหม่</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">ยกเลิก</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Role / สิทธิ์การใช้งาน</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
              >
                <option value="user">User (บันทึกข้อมูลทั่วไป)</option>
                <option value="admin">Admin (ผู้ดูแลระบบสูงสุด)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="mt-6 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
            บันทึกข้อมูล
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                {u.role === 'admin' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
              </div>
              <div>
                <div className="font-bold text-slate-900">{u.username}</div>
                <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  {u.role === 'admin' ? (
                    <span className="text-indigo-600 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Administrator
                    </span>
                  ) : (
                    <span className="text-slate-400">Standard User</span>
                  )}
                </div>
              </div>
            </div>
            {u.username !== 'admin' && (
              <button className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;
