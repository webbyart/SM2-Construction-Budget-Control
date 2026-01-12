
import { Project, CutRecord, User, Worker, Network, NetworkDefinition } from '../types';

/** 
 * IMPORTANT: หลังแก้โค้ด backend (code.gs) 
 * ต้องกด Deploy > New Deployment ใน Google Apps Script 
 * แล้วนำ URL ใหม่มาวางที่นี่ทุกครั้ง
 */
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwixDmTZV01D6OT7PSSEr820ZguOlwPLleQ2Fwwra9dIQ_pJ5peY4qiKAknU4buogJn/exec';

const gas = (window as any).google?.script?.run;

const callGas = <T>(functionName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (gas && typeof gas[functionName] === 'function') {
      gas
        .withSuccessHandler((res: any) => {
          if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
            if (res.success) resolve(res.data as T);
            else reject(new Error(res.message || "GAS Function Error"));
          } else {
            resolve(res as T);
          }
        })
        .withFailureHandler((err: any) => reject(new Error(err.message || "GAS Connection Error")))
        [functionName](...args);
      return;
    }

    const url = `${WEB_APP_URL}?action=${encodeURIComponent(functionName)}&args=${encodeURIComponent(JSON.stringify(args))}&t=${Date.now()}`;
    
    fetch(url, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow'
    })
      .then(res => res.ok ? res.json() : Promise.reject("Network response was not ok"))
      .then(data => {
        if (data && data.success === false) reject(new Error(data.message));
        else resolve(data.data !== undefined ? data.data : data);
      })
      .catch(error => reject(error));
  });
};

export interface ProjectStats extends Project {
  totalFullBudget: number;
  totalLimitBudget: number;
  totalSpent: number;
  remainingLimit: number;
  percentUsed: number;
}

export interface RecordFilter {
  search: string;
  startDate: string;
  endDate: string;
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
      return false;
    }
  },

  async authenticate(username: string, pass: string): Promise<User | null> {
    const res = await callGas<any>('authenticateUser', username, pass);
    if (res && (res.success || res.username)) {
      return { username: res.username || username, role: res.role || 'user' };
    }
    return null;
  },

  async getProjects(): Promise<Project[]> {
    const res = await callGas<Project[]>('getAllProjects');
    return res || [];
  },

  async getProjectsWithStats(): Promise<ProjectStats[]> {
    const projects = await this.getProjects();
    const records = await this.getRecords();
    
    return projects.map(p => {
      const pRecords = records.filter(r => this.normalizeWBS(r.wbs) === this.normalizeWBS(p.wbs));
      const networks = p.networks || [];
      
      let totalFullBudget = 0;
      networks.forEach(n => {
        totalFullBudget += (Number(n.labor_full || 0) + Number(n.supervise_full || 0) + Number(n.transport_full || 0) + Number(n.misc_full || 0));
      });
      
      const totalLimitBudget = totalFullBudget * (p.maxBudgetPercent / 100);
      const totalSpent = pRecords.reduce((acc, r) => acc + (r.labor_cut || 0) + (r.supervise_cut || 0) + (r.transport_cut || 0) + (r.misc_cut || 0), 0);
      const remainingLimit = Math.max(0, totalLimitBudget - totalSpent);
      const percentUsed = totalLimitBudget > 0 ? (totalSpent / totalLimitBudget) * 100 : 0;

      return {
        ...p,
        networks,
        totalFullBudget,
        totalLimitBudget,
        totalSpent,
        remainingLimit,
        percentUsed
      };
    });
  },

  async saveProject(p: Project): Promise<void> {
    await callGas<any>('saveProject', p);
  },

  async deleteProject(wbs: string): Promise<void> {
    await callGas('deleteProject', this.normalizeWBS(wbs));
  },

  async getRecords(filter?: RecordFilter): Promise<CutRecord[]> {
    const raw = await callGas<any[]>('getAllCutRecords') || [];
    let records: CutRecord[] = raw.map(r => ({
      id: r.id,
      timestamp: r.date,
      wbs: r.wbs,
      networkCode: r.networkCode,
      projectName: r.projectName,
      worker: r.worker,
      detail: r.detail,
      labor_cut: Number(r.labor) || 0,
      supervise_cut: Number(r.supervise) || 0,
      transport_cut: Number(r.transport) || 0,
      misc_cut: Number(r.misc) || 0
    }));

    if (filter) {
      if (filter.search) {
        const s = filter.search.toLowerCase();
        records = records.filter(r => 
          r.wbs.toLowerCase().includes(s) || 
          r.projectName.toLowerCase().includes(s) || 
          r.worker.toLowerCase().includes(s) || 
          r.detail.toLowerCase().includes(s)
        );
      }
      if (filter.startDate) {
        records = records.filter(r => new Date(r.timestamp) >= new Date(filter.startDate));
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        records = records.filter(r => new Date(r.timestamp) <= end);
      }
    }

    return records;
  },

  async getRecordsByWBS(wbs: string): Promise<CutRecord[]> {
    const all = await this.getRecords();
    return all.filter(r => this.normalizeWBS(r.wbs) === this.normalizeWBS(wbs));
  },

  async addRecord(r: CutRecord): Promise<void> {
    await callGas<any>('addCutRecord', {
      wbs: r.wbs,
      networkCode: r.networkCode,
      detail: r.detail,
      labor: r.labor_cut,
      supervise: r.supervise_cut,
      transport: r.transport_cut,
      misc: r.misc_cut
    });
  },

  async updateRecord(id: string, r: CutRecord): Promise<void> {
    await callGas<any>('updateCutRecord', id, {
      wbs: r.wbs,
      networkCode: r.networkCode,
      detail: r.detail,
      labor: r.labor_cut,
      supervise: r.supervise_cut,
      transport: r.transport_cut,
      misc: r.misc_cut
    });
  },

  async deleteRecord(id: string): Promise<void> {
    await callGas('deleteRecord', id);
  },

  async getWorkers(): Promise<Worker[]> {
    const res = await callGas<Worker[]>('getAllWorkers');
    return res || [];
  },

  async addWorker(worker: Worker): Promise<void> {
    await callGas('saveWorker', worker);
  },

  async deleteWorker(id: string): Promise<void> {
    await callGas('deleteWorker', id);
  },

  async getUsers(): Promise<User[]> {
    const res = await callGas<User[]>('getAllUsers');
    return res || [];
  },
  
  async addUser(u: User): Promise<void> {
    await callGas('addUser', u);
  },

  async deleteUser(username: string): Promise<void> {
    await callGas('deleteUser', username);
  },

  async getDiagnostics(): Promise<any> {
    return await callGas<any>('getDashboardData');
  },

  async getNetworkDefinitions(): Promise<NetworkDefinition[]> {
    const res = await callGas<NetworkDefinition[]>('getNetworkDefinitions');
    return res || [];
  },

  async saveNetworkDefinition(def: NetworkDefinition): Promise<void> {
    await callGas<any>('saveNetworkDefinition', def);
  },

  async deleteNetworkDefinition(code: string): Promise<void> {
    await callGas<any>('deleteNetworkDefinition', code);
  }
};
