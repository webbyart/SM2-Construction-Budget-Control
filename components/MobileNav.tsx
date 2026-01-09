
import React from 'react';
import { View } from '../App';
import { 
  LayoutDashboard, 
  Eye, 
  ClipboardList, 
  PlusCircle, 
  History,
  Scissors
} from 'lucide-react';

interface MobileNavProps {
  activeView: View;
  onNavigate: (v: View) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'overview', label: 'ภาพรวม', icon: Eye },
    { id: 'job-details', label: 'งาน', icon: ClipboardList },
    { id: 'add-project', label: 'เพิ่ม', icon: PlusCircle },
    { id: 'history', label: 'ประวัติ', icon: History },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-lg bg-white/90">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as View)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
            activeView === item.id || (item.id === 'job-details' && activeView === 'cut-budget')
              ? 'text-purple-700 bg-purple-50' 
              : 'text-slate-400'
          }`}
        >
          <item.icon className={`w-6 h-6 mb-1 ${
            activeView === item.id || (item.id === 'job-details' && activeView === 'cut-budget')
              ? 'scale-110' 
              : ''
          }`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {item.label}
          </span>
          {(activeView === item.id || (item.id === 'job-details' && activeView === 'cut-budget')) && (
            <div className="w-1 h-1 bg-purple-700 rounded-full mt-1"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
