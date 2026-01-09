
export type Role = 'admin' | 'user';

export interface User {
  username: string;
  password?: string;
  role: Role;
}

export interface Project {
  wbs: string;
  name: string;
  worker: string;
  // ยอดเต็ม 100%
  labor_full: number;
  supervise_full: number;
  transport_full: number;
  misc_full: number;
  // ยอดคงเหลือปัจจุบัน (ยอดที่ยังไม่ได้ตัด)
  labor_balance: number;
  supervise_balance: number;
  transport_balance: number;
  misc_balance: number;
  maxBudgetPercent: number; // เช่น 80
}

export interface CutRecord {
  id: string;
  timestamp: string;
  wbs: string;
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
