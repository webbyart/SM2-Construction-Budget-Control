
import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Activity, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [diagInfo, setDiagInfo] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await StorageService.authenticate(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ตรวจสอบตัวพิมพ์เล็ก-ใหญ่และช่องว่างใน Spreadsheet)');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(`ข้อผิดพลาดทางเทคนิค: ${err.message || 'โปรดตรวจสอบการ Deploy ใน GAS'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setIsDiagLoading(true);
    setDiagInfo(null);
    try {
      const data = await StorageService.getDiagnostics();
      if (data) {
        setDiagInfo({
          message: `เชื่อมต่อสำเร็จ! พบชีต Projects พร้อมข้อมูล ${data.totalJobs || 0} รายการ`,
          type: 'success'
        });
      } else {
        throw new Error("ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์");
      }
    } catch (err: any) {
      setDiagInfo({
        message: `ล้มเหลว: ${err.message}. โปรดตรวจสอบ ID ของชีตใน code.gs และสิทธิ์การเข้าถึง`,
        type: 'error'
      });
    } finally {
      setIsDiagLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 purple-gradient rounded-3xl shadow-2xl shadow-purple-500/30 mb-4 scale-110">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">SM2 Control</h1>
          <p className="text-slate-500 mt-2 font-medium">Construction Budget Management</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm font-bold flex items-start gap-2 rounded-r-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoFocus
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-semibold"
                  placeholder="เช่น admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-semibold"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 purple-gradient text-white font-black rounded-[24px] shadow-2xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-70 mt-2"
            >
              {isLoading ? 'กำลังประมวลผล...' : 'เข้าสู่ระบบ'} <ArrowRight className="w-6 h-6" />
            </button>
          </form>
          
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-purple-600 transition-colors border border-slate-100 py-3 rounded-2xl"
              >
                <HelpCircle className="w-4 h-4" /> 
                ตั้งค่าชีต
                {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button 
                onClick={runDiagnostics}
                disabled={isDiagLoading}
                className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-emerald-600 transition-colors border border-slate-100 py-3 rounded-2xl disabled:opacity-50"
              >
                {isDiagLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                เช็คการเชื่อมต่อ
              </button>
            </div>

            {diagInfo && (
              <div className={`mt-4 p-3 border rounded-xl text-[11px] font-bold animate-in fade-in ${
                diagInfo.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                {diagInfo.message}
              </div>
            )}

            {showHelp && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left animate-in slide-in-from-top-2">
                <p className="text-[11px] font-bold text-slate-600 uppercase">ขั้นตอนแก้ไขปัญหา (โปรดทำตามลำดับ):</p>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-xs text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 font-bold">1</span>
                    ก๊อปปี้ ID นี้: <code className="bg-white px-1 rounded border text-purple-700 font-bold">1_SdZv-8jhrjl-k-mawppG2oe_3g1QlzUn2Z46Z61t70</code> ไปวางใน <code className="text-slate-700">code.gs</code> ที่บรรทัดแรก
                  </li>
                  <li className="flex gap-2 text-xs text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 font-bold">2</span>
                    ใน Apps Script กดปุ่ม <strong className="text-slate-700">Deploy > Manage Deployments</strong> เลือก Version ล่าสุด (หรือสร้างใหม่) แล้วกด Deploy
                  </li>
                  <li className="flex gap-2 text-xs text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 font-bold">3</span>
                    ต้องมั่นใจว่าชีต <strong className="text-purple-700">Users</strong> มีข้อมูลแถวที่ 2 เป็น <code className="text-slate-700">admin / 1234 / admin</code>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">© 2024 SM2 Construction Solution v2.7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
