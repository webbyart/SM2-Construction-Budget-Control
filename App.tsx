
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, Project } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import BudgetCut from './components/BudgetCut';
import History from './components/History';
import UsersManagement from './components/UsersManagement';
import WorkerManagement from './components/WorkerManagement';
import ProjectOverview from './components/ProjectOverview';
import NetworkManagement from './components/NetworkManagement';
import { Database, Wifi, ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export type View = 'dashboard' | 'overview' | 'job-details' | 'add-project' | 'edit-project' | 'cut-budget' | 'history' | 'users' | 'workers' | 'network-types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'success' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    const initApp = async () => {
      const progressInterval = setInterval(() => {
        setBootProgress(prev => (prev < 90 ? prev + Math.random() * 15 : prev));
      }, 200);

      try {
        const connected = await StorageService.checkConnection();
        if (connected) {
          setBootProgress(100);
          setConnectionStatus('success');
          
          setTimeout(() => {
            const saved = localStorage.getItem('sm2_current_user');
            if (saved) setUser(JSON.parse(saved));
            setIsBootstrapping(false);
          }, 800);
        } else {
          setConnectionStatus('error');
          setErrorMessage('ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ โปรดตรวจสอบการ Deploy Web App และสิทธิ์การเข้าถึง Sheet');
        }
      } catch (e: any) {
        setConnectionStatus('error');
        setErrorMessage(e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
      } finally {
        clearInterval(progressInterval);
      }
    };

    initApp();
  }, []);

  const navigate = (view: View, project?: Project) => {
    if (project) setSelectedProject(project);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sm2_current_user');
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen purple-gradient flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 rounded-full blur-[100px]"></div>

        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl p-10 rounded-[40px] border border-white/20 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative inline-block">
            <div className={`p-6 rounded-3xl bg-white shadow-2xl transition-all duration-500 ${connectionStatus === 'error' ? 'text-rose-500' : 'text-purple-700'}`}>
              {connectionStatus === 'connecting' && <Database className="w-12 h-12 animate-pulse" />}
              {connectionStatus === 'success' && <ShieldCheck className="w-12 h-12 text-emerald-500" />}
              {connectionStatus === 'error' && <AlertTriangle className="w-12 h-12" />}
            </div>
            {connectionStatus === 'connecting' && (
              <div className="absolute top-[-10px] right-[-10px]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">SM2 Control System</h1>
            <p className="text-white/60 text-sm font-medium mt-1 px-4">
              {connectionStatus === 'connecting' && "Establishing connection to Google Sheets..."}
              {connectionStatus === 'success' && "Connection Established Successfully"}
              {connectionStatus === 'error' && errorMessage}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
              <span>Status: {connectionStatus}</span>
              <span>{Math.round(bootProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-[2px] border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${connectionStatus === 'error' ? 'bg-rose-500' : 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'}`}
                style={{ width: `${bootProgress}%` }}
              ></div>
            </div>
          </div>

          {connectionStatus === 'error' && (
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Retry Connection
            </button>
          )}

          <div className="pt-4">
             <div className="flex items-center justify-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
                <Wifi className="w-3 h-3" /> Secure Gateway Active
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('sm2_current_user', JSON.stringify(u)); }} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeView={currentView} onNavigate={navigate} onLogout={handleLogout} userRole={user.role} />
      
      <main className="flex-1 p-4 md:p-8 lg:ml-64 pb-24 lg:pb-8 transition-all">
        <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-xl">
               <Database className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">SM2 Control System</h1>
                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-100 hidden sm:flex">
                   <CheckCircle2 className="w-3 h-3" /> Success
                </div>
              </div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Role: {user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user.username}</p>
             </div>
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full border-2 border-purple-100 shadow-sm" alt="avatar" />
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {currentView === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {currentView === 'overview' && <ProjectOverview />}
          {currentView === 'job-details' && <ProjectList onEdit={(p) => navigate('edit-project', p)} onCut={(p) => navigate('cut-budget', p)} />}
          {currentView === 'add-project' && <ProjectForm onSave={() => navigate('job-details')} />}
          {currentView === 'edit-project' && <ProjectForm project={selectedProject || undefined} onSave={() => navigate('job-details')} />}
          {currentView === 'cut-budget' && selectedProject && <BudgetCut project={selectedProject} onBack={() => navigate('job-details')} />}
          {currentView === 'history' && <History />}
          {currentView === 'users' && <UsersManagement />}
          {currentView === 'workers' && <WorkerManagement />}
          {currentView === 'network-types' && <NetworkManagement />}
        </div>
      </main>

      <MobileNav activeView={currentView} onNavigate={navigate} />
    </div>
  );
};

export default App;
