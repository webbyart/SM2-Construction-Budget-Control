
import React from 'react';
import { View } from '../App';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  LogOut,
  Scissors,
  ClipboardList,
  UserPlus,
  Eye,
  Settings,
  Database
} from 'lucide-react';

interface SidebarProps {
  activeView: View;
  onNavigate: (v: View) => void;
  onLogout: () => void;
  userRole: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onLogout, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ (Dashboard)', icon: LayoutDashboard },
    { id: 'overview', label: 'ภาพรวม', icon: Eye },
    { id: 'job-details', label: 'รายละเอียดงาน', icon: ClipboardList },
    { id: 'add-project', label: 'เพิ่ม/แก้ไขงาน', icon: PlusCircle },
    { id: 'cut-budget', label: 'ตัดงบโครงการ', icon: Scissors },
    { id: 'history', label: 'ประวัติการตัดงบ', icon: History },
  ];

  const adminItems = [
    { id: 'network-types', label: 'จัดการโครงข่าย (Detail)', icon: Database },
    { id: 'users', label: 'จัดการผู้ใช้', icon: Settings },
    { id: 'workers', label: 'เพิ่มจำนวนช่าง', icon: UserPlus },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 purple-gradient text-white hidden lg:flex flex-col shadow-2xl z-50">
      <div className="p-8 border-b border-white/10">
        <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <Scissors className="text-yellow-400 w-6 h-6" />
          SM2 CONTROL
        </h2>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1 font-bold italic">Engineering Solutions</p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-white/40 uppercase px-4 mb-2 tracking-widest">เมนูหลัก</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-white/20 text-white shadow-lg ring-1 ring-white/20' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-yellow-400' : 'group-hover:text-yellow-400'}`} />
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}

        {userRole === 'admin' && (
          <>
            <p className="text-[10px] font-bold text-white/40 uppercase px-4 mt-8 mb-2 tracking-widest">ผู้ดูแลระบบ</p>
            {adminItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeView === item.id 
                    ? 'bg-white/20 text-white shadow-lg ring-1 ring-white/20' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-yellow-400' : 'group-hover:text-yellow-400'}`} />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
