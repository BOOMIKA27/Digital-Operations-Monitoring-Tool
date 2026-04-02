export type SystemStatus = 'Working' | 'Warning' | 'Shutdown';

export interface System {
  id: string;
  name: string;
  cpu: number; // percentage
  ram: number; // percentage
  storage: number; // percentage
  network: number; // Mbps
  latency: number; // ms
  uptime: string;
  status: SystemStatus;
  lastUpdated: string;
  region: string;
}

export interface Log {
  id: string;
  systemId: string;
  systemName: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface Thresholds {
  cpu: number;
  ram: number;
  storage: number;
  latency: number;
}

export type Role = 'Admin' | 'User';

export type View = 'Dashboard' | 'Infrastructure' | 'Analytics' | 'Alerts' | 'Logs' | 'Settings';
