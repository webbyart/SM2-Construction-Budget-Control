
import { Project, CutRecord, User, Worker } from '../types';

// อัปเดต URL เป็นเวอร์ชั่นล่าสุดที่ผู้ใช้แจ้งมา
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyYtLGbRe-MXBaLXQzlEjepp3aFMAQwOpc0nj8S-KYDGhEGzI02qZ8WgOdAYq5kbwT6/exec';

const gas = (window as any).google?.script?.run;

/**
 * ฟังก์ชันกลางสำหรับเรียกใช้ GAS Backend
 * รองรับทั้งแบบ google.script.run (ถ้าเป็น GAS App) และ fetch (ถ้าเป็น External App)
 */
const callGas = <T>(functionName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    // วิธีที่ 1: รันภายใน Google Apps Script Environment
    if (gas && typeof gas[functionName] === 'function') {
      gas
        .withSuccessHandler((res: T) => resolve(res))
        .withFailureHandler((err: any) => {
          const errorMsg = typeof err === 'string' ? err : (err.message || "GAS Connection Error");
          reject(new Error(errorMsg));
        })
        [functionName](...args);
      return;
    }

    // วิธีที่ 2: รันผ่าน Fetch API
    // เพิ่ม t=timestamp เพื่อป้องกัน Browser Caching ในบางกรณี
    const url = `${WEB_APP_URL}?action=${encodeURIComponent(functionName)}&args=${encodeURIComponent(JSON.stringify(args))}&t=${Date.now()}`;
    
    fetch(url, { 
      method: 'GET',
      mode: 'cors', // สำคัญ: ต้องใช้ cors เพื่อให้ fetch ติดตาม redirect (302) ไปยัง googleusercontent.com ได้
      cache: 'no-cache',
      redirect: 'follow'
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Server Response Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.success === false) {
          reject(new Error(data.message || "เซิร์ฟเวอร์แจ้งข้อผิดพลาดในการประมวลผล"));
        } else {
          resolve(data as T);
        }
      })
      .catch(error => {
        console.error(`Network Error [${functionName}]:`, error);
        
        let msg = "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้";
        if (error.message.includes('Failed to fetch')) {
          msg = "การเชื่อมต่อล้มเหลว (Failed to fetch): โปรดตรวจสอบว่าได้เลือก 'Anyone' ในสิทธิ์การเข้าถึง Web App และรหัส Web App ID ถูกต้องแล้ว";
        } else {
          msg = error.message || msg;
        }
        
        reject(new Error(msg));
      });
  });
};

export interface RecordFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectStats extends Project {
  totalFullBudget: number;
  totalBudgetPercent: number;
  totalSpent: number;
  remainingBudgetPercent: number;
  percentUsed: number;
}

export const StorageService = {
  normalizeWBS(wbs: string): string {
    return (wbs || '').toString().trim().toUpperCase();
  },

  async checkConnection(): Promise<boolean> {
    try {
      const data = await callGas<any>('getDashboardData'); 
      return !!data;
    } catch (e) {
      console.error("Health Check Failed:", e);
      return false;
    }
  },

  async getDiagnostics(): Promise<any> {
    return await callGas<any>('getDashboardData');
  },

  async authenticate(username: string, pass: string): Promise<User | null> {
    const response = await callGas<{ success: boolean; username: string; role: string; message: string }>(
      'authenticateUser',
      username,
      pass
    );
    if (response && response.success) {
      return { username: response.username, role: response.role as any };
    }
    return null;
  },

  async getProjects(): Promise<Project[]> {
    const rawProjects = await callGas<any[]>('getAllProjects') || [];
    return rawProjects.map(p => ({
      wbs: p.wbs,
      name: p.name,
      worker: p.worker,
      labor_full: Number(p.labor_full) || 0,
      supervise_full: Number(p.supervise_full) || 0,
      transport_full: Number(p.transport_full) || 0,
      misc_full: Number(p.misc_full) || 0,
      labor_balance: Number(p.labor) || 0,
      supervise_balance: Number(p.supervise) || 0,
      transport_balance: Number(p.transport) || 0,
      misc_balance: Number(p.misc) || 0,
      maxBudgetPercent: Number(p.maxBudgetPercent) || 80,
      rowIndex: p.rowIndex
    }));
  },

  async getProjectsWithStats(): Promise<ProjectStats[]> {
    const projects = await this.getProjects();
    const records = await this.getRecords();
    
    return projects.map(p => {
      const pRecords = records.filter(r => this.normalizeWBS(r.wbs) === this.normalizeWBS(p.wbs));
      const totalFullBudget = p.labor_full + p.supervise_full + p.transport_full + p.misc_full;
      const totalBudgetPercent = totalFullBudget * (p.maxBudgetPercent / 100);
      const totalSpent = pRecords.reduce((acc, r) => acc + r.labor_cut + r.supervise_cut + r.transport_cut + r.misc_cut, 0);
      const remainingBudgetPercent = Math.max(0, totalBudgetPercent - totalSpent);
      const percentUsed = totalBudgetPercent > 0 ? (totalSpent / totalBudgetPercent) * 100 : 0;

      return {
        ...p,
        totalFullBudget,
        totalBudgetPercent,
        totalSpent,
        remainingBudgetPercent,
        percentUsed
      };
    });
  },

  async saveProject(p: Project): Promise<void> {
    const data = {
      wbs: this.normalizeWBS(p.wbs),
      name: p.name,
      worker: p.worker,
      labor_current: Number(p.labor_balance),
      supervise_current: Number(p.supervise_balance),
      transport_current: Number(p.transport_balance),
      misc_current: Number(p.misc_balance),
      labor_full: Number(p.labor_full),
      supervise_full: Number(p.supervise_full),
      transport_full: Number(p.transport_full),
      misc_full: Number(p.misc_full),
      maxBudgetPercent: Number(p.maxBudgetPercent),
      rowIndex: (p as any).rowIndex
    };
    
    const response = await callGas<any>(data.rowIndex ? 'updateProject' : 'addProject', data);
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถบันทึกโครงการได้');
    }
  },

  async deleteProject(wbs: string): Promise<void> {
    const response = await callGas<any>('deleteProject', this.normalizeWBS(wbs));
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถลบโครงการได้');
    }
  },

  async getRecords(filter?: RecordFilter): Promise<CutRecord[]> {
    const allRaw = await callGas<any[]>('getAllCutRecords') || [];
    const all: CutRecord[] = allRaw.map(r => ({
      id: String(r.id),
      timestamp: String(r.date),
      wbs: this.normalizeWBS(r.wbs),
      projectName: r.projectName || 'N/A',
      worker: r.worker || 'N/A',
      detail: r.detail || '',
      labor_cut: Number(r.labor) || 0,
      supervise_cut: Number(r.supervise) || 0,
      transport_cut: Number(r.transport) || 0,
      misc_cut: Number(r.misc) || 0
    }));

    if (!filter) return all;
    let filtered = all;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.wbs.toLowerCase().includes(s) || 
        r.detail.toLowerCase().includes(s) ||
        r.projectName.toLowerCase().includes(s)
      );
    }
    return filtered;
  },

  async getRecordsByWBS(wbs: string): Promise<CutRecord[]> {
    const all = await this.getRecords();
    return all.filter(r => this.normalizeWBS(r.wbs) === this.normalizeWBS(wbs));
  },

  async addRecord(r: CutRecord): Promise<void> {
    const cutData = {
      wbs: this.normalizeWBS(r.wbs),
      detail: r.detail,
      labor: Number(r.labor_cut),
      supervise: Number(r.supervise_cut),
      transport: Number(r.transport_cut),
      misc: Number(r.misc_cut)
    };
    const response = await callGas<any>('addCutRecord', cutData);
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถบันทึกการตัดงบได้ (อาจเกินวงเงินที่กำหนด)');
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const response = await callGas<any>('deleteRecord', id);
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถลบรายการได้');
    }
  },

  async getWorkers(): Promise<Worker[]> {
    const projects = await this.getProjects();
    const uniqueNames = Array.from(new Set(projects.map(p => p.worker)));
    return uniqueNames.map((name, i) => ({ 
      id: String(i), 
      name: name as string, 
      position: 'วิศวกร/ช่างเทคนิคประจำโครงการ' 
    }));
  },

  async addWorker(worker: Worker): Promise<void> {
    console.info("Add worker logic implemented via Project Registration.");
  },

  async getUsers(): Promise<User[]> {
    const users = await callGas<User[]>('getAllUsers');
    return users || [];
  },
  
  async addUser(u: User): Promise<void> {
    const response = await callGas<any>('addUser', u);
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถเพิ่มผู้ใช้ได้');
    }
  },

  async deleteUser(username: string): Promise<void> {
    const response = await callGas<any>('deleteUser', username);
    if (response && response.success === false) {
      throw new Error(response.message || 'ไม่สามารถลบผู้ใช้ได้');
    }
  }
};
