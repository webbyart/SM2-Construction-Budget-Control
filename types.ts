
export type Role = 'admin' | 'user';

export interface User {
  username: string;
  password?: string;
  role: Role;
}

export interface NetworkDefinition {
  code: string;
  name: string;
}

export interface Network {
  networkCode: string;
  networkName?: string;
  // ยอดเต็ม 100%
  labor_full: number;
  supervise_full: number;
  transport_full: number;
  misc_full: number;
  // ยอดคงเหลือปัจจุบัน
  labor_balance: number;
  supervise_balance: number;
  transport_balance: number;
  misc_balance: number;
}

export interface Project {
  wbs: string; // Project ID
  name: string;
  worker: string;
  maxBudgetPercent: number;
  approvalNumber?: string;
  approvalDate?: string;
  networks: Network[];
}

export interface CutRecord {
  id: string;
  timestamp: string;
  wbs: string;
  networkCode: string; 
  projectName: string;
  worker: string;
  detail: string;
  labor_cut: number;
  supervise_cut: number;
  transport_cut: number;
  misc_cut: number;
}

export type BudgetCategory = 'labor' | 'supervise' | 'transport' | 'misc';

export interface Worker {
  id: string;
  name: string;
  position: string;
}
