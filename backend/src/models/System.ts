export interface System {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
}
