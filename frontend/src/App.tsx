import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  Bell, 
  FileText, 
  Settings as SettingsIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Zap,
  Activity,
  Cpu,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Menu,
  User,
  LogOut,
  Lock,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Maximize2,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io, Socket } from 'socket.io-client';
import { 
  auth, 
  db, 
  loginWithEmail,
  registerWithEmail,
  logout, 
  handleFirestoreError, 
  OperationType,
  FirebaseUser 
} from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  limit, 
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Utility for Tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type SystemStatus = 'Working' | 'Warning' | 'Shutdown';
type UserRole = 'Admin' | 'User';

interface SystemNode {
  id: string;
  name: string;
  status: SystemStatus;
  cpu: number;
  ram: number;
  storage: number;
  region: string;
  latency: number;
  uptime: string;
  authorUid: string;
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error';
  message: string;
  node: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: string;
}

// Components
const Panel = ({ title, children, icon, className, onExpand }: { title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string; onExpand?: () => void }) => (
  <div className={cn("grafana-panel rounded-sm flex flex-col h-full", className)}>
    <div className="flex items-center justify-between px-3 py-2 border-b border-grafana-border bg-grafana-header">
      <div className="flex items-center gap-2">
        {icon && <span className="text-grafana-blue">{icon}</span>}
        <h3 className="text-[11px] font-bold text-grafana-text uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {onExpand && <Maximize2 size={12} className="text-grafana-text-muted cursor-pointer hover:text-grafana-text" onClick={onExpand} />}
        <MoreVertical size={12} className="text-grafana-text-muted cursor-pointer hover:text-grafana-text" />
      </div>
    </div>
    <div className="flex-1 p-3 overflow-y-auto">
      {children}
    </div>
  </div>
);

const StatPanel = ({ label, value, trend, color, icon, description }: { label: string; value: string; trend?: string; color: string; icon: React.ReactNode; description?: string }) => (
  <div className="grafana-panel rounded-sm p-4 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-grafana-blue/50 transition-all">
    <div className="flex justify-between items-start z-10">
      <div className="p-2 bg-grafana-header rounded-sm border border-grafana-border">
        {React.cloneElement(icon as React.ReactElement, { size: 18, style: { color } })}
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1",
          trend.startsWith('+') ? "bg-grafana-green/10 text-grafana-green" : "bg-grafana-red/10 text-grafana-red"
        )}>
          {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </span>
      )}
    </div>
    <div className="z-10">
      <p className="text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-grafana-text tracking-tight">{value}</h4>
      {description && <p className="text-[9px] text-grafana-text-muted mt-1 italic leading-tight">{description}</p>}
    </div>
    <div className="absolute bottom-0 right-0 w-24 h-24 -mr-8 -mb-8 opacity-5 group-hover:opacity-10 transition-opacity">
      {React.cloneElement(icon as React.ReactElement, { size: 96, style: { color } })}
    </div>
  </div>
);

const Gauge = ({ value, label, color }: { value: number; label: string; color: string }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="var(--color-grafana-header)"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-grafana-text">{Math.round(value)}%</span>
        </div>
      </div>
      <p className="text-[10px] font-bold text-grafana-text-muted uppercase mt-2">{label}</p>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; collapsed: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all border-l-2",
      active 
        ? "bg-grafana-border text-grafana-text border-grafana-blue" 
        : "text-grafana-text border-transparent hover:bg-grafana-panel hover:text-grafana-text"
    )}
  >
    <span className={cn(active ? "text-grafana-blue" : "text-grafana-text-muted")}>{icon}</span>
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
  </div>
);

function DashboardContent() {
  const [view, setView] = useState<'Dashboard' | 'Infrastructure' | 'Analytics' | 'Alerts' | 'Logs' | 'Settings'>('Dashboard');
  const [infraViewMode, setInfraViewMode] = useState<'table' | 'matrix'>('table');
  const [nodes, setNodes] = useState<SystemNode[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [tempUser, setTempUser] = useState<FirebaseUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalData, setModalData] = useState<Partial<SystemNode>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SystemStatus | 'All'>('All');
  const [logSearch, setLogSearch] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<'All' | 'Info' | 'Warning' | 'Error'>('All');
  const [thresholds, setThresholds] = useState({ cpu: 80, ram: 85, storage: 90 });
  const [realtimeMetrics, setRealtimeMetrics] = useState({ cpu: 0, ram: 0, network: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [nodeHistory, setNodeHistory] = useState<Record<string, any[]>>({});
  const [alertedThresholds, setAlertedThresholds] = useState<Record<string, { cpu: boolean; ram: boolean; storage: boolean; cpuNear: boolean; ramNear: boolean; storageNear: boolean }>>({});
  const prevNodesRef = React.useRef<Record<string, SystemStatus>>({});

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{ status: string; timestamp: string } | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('grafana-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('grafana-theme', isDarkMode ? 'dark' : 'light');
    if (!isDarkMode) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [isDarkMode]);

  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Socket.io for real-time metrics
  useEffect(() => {
    const socket = io();
    
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setBackendHealth(data);
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (err) {
        console.error("Backend health check failed:", err);
        setIsBackendConnected(false);
      }
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000); // Check every 30s
    
    socket.on('connect', () => {
      setIsBackendConnected(true);
    });

    socket.on('disconnect', () => {
      setIsBackendConnected(false);
    });

    socket.on('metrics_update', (data) => {
      setRealtimeMetrics(data);
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), ...data }];
        return newData.slice(-20); // Keep last 20 points
      });
    });

    return () => {
      socket.disconnect();
      clearInterval(healthInterval);
    };
  }, []);

  // Firebase Auth & Data Sync
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setAuthLoading(true);
      setNeedsProfileSetup(false);
      setTempUser(null);
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as UserProfile);
          } else {
            console.warn("User profile not found in Firestore for UID:", user.uid);
            setTempUser(user);
            setNeedsProfileSetup(true);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const isAdmin = useMemo(() => {
    return currentUser?.role === 'Admin' || currentUser?.email === 'boomika.ag23@bitsathy.ac.in';
  }, [currentUser]);

  // Sync Nodes and Logs
  useEffect(() => {
    if (!currentUser) {
      setNodes([]);
      setLogs([]);
      return;
    }

    // Sync Nodes
    const nodesRef = collection(db, 'nodes');
    const qNodes = query(nodesRef, orderBy('createdAt', 'desc'));

    const unsubscribeNodes = onSnapshot(qNodes, (snapshot) => {
      const nodesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNode));
      setNodes(nodesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'nodes'));

    // Sync Logs
    const logsRef = collection(db, 'logs');
    const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
      setLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'logs'));

    return () => {
      unsubscribeNodes();
      unsubscribeLogs();
    };
  }, [currentUser, isAdmin]);

  // Alert System: Notify user when node status changes or thresholds are reached
  useEffect(() => {
    if (nodes.length === 0) return;

    // 1. Check for status changes (using ref to avoid re-renders)
    nodes.forEach(node => {
      const prevStatus = prevNodesRef.current[node.id];
      if (prevStatus && prevStatus !== node.status) {
        if (node.status === 'Warning') {
          toast.warning(`Node Alert: ${node.name}`, {
            description: `Status changed to Warning. CPU: ${node.cpu}%, RAM: ${node.ram}%`,
            duration: 5000,
          });
        } else if (node.status === 'Shutdown') {
          toast.error(`Node Critical: ${node.name}`, {
            description: `Status changed to Shutdown! Immediate investigation required.`,
            duration: 8000,
          });
        } else if (node.status === 'Working' && prevStatus !== 'Working') {
          toast.success(`Node Recovered: ${node.name}`, {
            description: `Status returned to Working.`,
            duration: 4000,
          });
        }
      }
    });

    // Update previous nodes ref after checking
    const currentStatuses: Record<string, SystemStatus> = {};
    nodes.forEach(node => {
      currentStatuses[node.id] = node.status;
    });
    prevNodesRef.current = currentStatuses;

    // 2. Check for resource thresholds
    setAlertedThresholds(prev => {
      const newAlertedThresholds = { ...prev };
      let hasAnyAlertChange = false;

      nodes.forEach(node => {
        const nodeAlerts = { ...(newAlertedThresholds[node.id] || { 
          cpu: false, ram: false, storage: false, 
          cpuNear: false, ramNear: false, storageNear: false 
        }) };
        let nodeAlertsChanged = false;

        // CPU Threshold
        if (node.cpu >= thresholds.cpu && !nodeAlerts.cpu) {
          toast.warning(`High CPU Usage: ${node.name}`, {
            description: `CPU usage has reached ${node.cpu}% (Threshold: ${thresholds.cpu}%)`,
            duration: 5000,
          });
          nodeAlerts.cpu = true;
          nodeAlertsChanged = true;
        } else if (node.cpu < thresholds.cpu - 5 && nodeAlerts.cpu) {
          nodeAlerts.cpu = false;
          nodeAlertsChanged = true;
        }

        // CPU Near Threshold
        const cpuNearThreshold = thresholds.cpu - 10;
        if (node.cpu >= cpuNearThreshold && node.cpu < thresholds.cpu && !nodeAlerts.cpuNear) {
          toast.info(`CPU Warning: ${node.name}`, {
            description: `CPU usage is nearing limit: ${node.cpu}% (Threshold: ${thresholds.cpu}%)`,
            duration: 4000,
          });
          nodeAlerts.cpuNear = true;
          nodeAlertsChanged = true;
        } else if (node.cpu < cpuNearThreshold - 5 && nodeAlerts.cpuNear) {
          nodeAlerts.cpuNear = false;
          nodeAlertsChanged = true;
        }

        // RAM Threshold
        if (node.ram >= thresholds.ram && !nodeAlerts.ram) {
          toast.warning(`High RAM Usage: ${node.name}`, {
            description: `RAM usage has reached ${node.ram}% (Threshold: ${thresholds.ram}%)`,
            duration: 5000,
          });
          nodeAlerts.ram = true;
          nodeAlertsChanged = true;
        } else if (node.ram < thresholds.ram - 5 && nodeAlerts.ram) {
          nodeAlerts.ram = false;
          nodeAlertsChanged = true;
        }

        // RAM Near Threshold
        const ramNearThreshold = thresholds.ram - 10;
        if (node.ram >= ramNearThreshold && node.ram < thresholds.ram && !nodeAlerts.ramNear) {
          toast.info(`RAM Warning: ${node.name}`, {
            description: `RAM usage is nearing limit: ${node.ram}% (Threshold: ${thresholds.ram}%)`,
            duration: 4000,
          });
          nodeAlerts.ramNear = true;
          nodeAlertsChanged = true;
        } else if (node.ram < ramNearThreshold - 5 && nodeAlerts.ramNear) {
          nodeAlerts.ramNear = false;
          nodeAlertsChanged = true;
        }

        // Storage Threshold
        if (node.storage >= thresholds.storage && !nodeAlerts.storage) {
          toast.error(`Low Disk Space: ${node.name}`, {
            description: `Storage usage has reached ${node.storage}% (Threshold: ${thresholds.storage}%)`,
            duration: 8000,
          });
          nodeAlerts.storage = true;
          nodeAlertsChanged = true;
        } else if (node.storage < thresholds.storage - 5 && nodeAlerts.storage) {
          nodeAlerts.storage = false;
          nodeAlertsChanged = true;
        }

        // Storage Near Threshold
        const storageNearThreshold = thresholds.storage - 10;
        if (node.storage >= storageNearThreshold && node.storage < thresholds.storage && !nodeAlerts.storageNear) {
          toast.info(`Storage Warning: ${node.name}`, {
            description: `Storage usage is nearing limit: ${node.storage}% (Threshold: ${thresholds.storage}%)`,
            duration: 4000,
          });
          nodeAlerts.storageNear = true;
          nodeAlertsChanged = true;
        } else if (node.storage < storageNearThreshold - 5 && nodeAlerts.storageNear) {
          nodeAlerts.storageNear = false;
          nodeAlertsChanged = true;
        }

        if (nodeAlertsChanged) {
          newAlertedThresholds[node.id] = nodeAlerts;
          hasAnyAlertChange = true;
        }
      });

      return hasAnyAlertChange ? newAlertedThresholds : prev;
    });
  }, [nodes, thresholds]);

  // Track history for each node for individual graphs
  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodeHistory(prev => {
        const newHistory = { ...prev };
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        nodes.forEach(node => {
          if (!newHistory[node.id]) newHistory[node.id] = [];
          
          // Add a tiny bit of jitter to make the graph look "live"
          const jitter = (Math.random() - 0.5) * 2;
          const cpu = Math.max(0, Math.min(100, node.cpu + jitter));
          const ram = Math.max(0, Math.min(100, node.ram + jitter));

          newHistory[node.id] = [
            ...newHistory[node.id],
            { time, cpu, ram }
          ].slice(-15); // Keep last 15 points
        });

        return newHistory;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [nodes]);

  // Filtered Data
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || node.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, searchQuery, statusFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || log.node.toLowerCase().includes(logSearch.toLowerCase());
      const matchesLevel = logLevelFilter === 'All' || log.level === logLevelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [logs, logSearch, logLevelFilter]);

  const allAlertNodes = useMemo(() => {
    const thresholdAlerts = nodes.filter(n => 
      n.cpu >= thresholds.cpu || 
      n.ram >= thresholds.ram || 
      n.storage >= thresholds.storage
    );
    const statusAlerts = nodes.filter(n => n.status !== 'Working');
    return Array.from(new Set([...statusAlerts, ...thresholdAlerts]));
  }, [nodes, thresholds]);

  const totalAlerts = allAlertNodes.length;

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('User');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, displayName, role);
        setIsRegistering(false);
      } else if (needsProfileSetup) {
        const uid = tempUser?.uid || auth.currentUser?.uid;
        if (!uid) throw new Error("No authenticated user found");
        
        // Manual profile creation if missing
        const userRef = doc(db, 'users', uid);
        const profile: UserProfile = {
          uid,
          email: tempUser?.email || auth.currentUser?.email || email,
          displayName: displayName,
          role: role,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, profile);
        setCurrentUser(profile);
        setNeedsProfileSetup(false);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = error.message || "Authentication failed";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password.";
      if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      if (error.code === 'auth/operation-not-allowed') message = "Email/Password auth is not enabled in Firebase Console.";
      setAuthError(message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'nodes', id));
      // Log the event
      await addDoc(collection(db, 'logs'), {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: 'Warning',
        message: `Node ${id} was decommissioned by ${currentUser.displayName}`,
        node: 'System',
        authorUid: currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `nodes/${id}`);
    }
  };

  const handleOpenModal = (mode: 'add' | 'edit', node?: SystemNode) => {
    if (!isAdmin) return;
    setModalMode(mode);
    setModalError(null);
    setModalData(node || { name: '', status: 'Working', cpu: 0, ram: 0, storage: 0, region: 'us-east-1', latency: 0, uptime: '0s' });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setModalError(null);
    setIsModalSubmitting(true);

    try {
      if (modalMode === 'add') {
        const nodeId = Math.random().toString(36).substr(2, 9);
        const newNode = {
          ...modalData,
          id: nodeId,
          authorUid: currentUser.uid,
          createdAt: new Date().toISOString(),
          latency: Math.floor(Math.random() * 50),
          uptime: '0s'
        };
        await setDoc(doc(db, 'nodes', nodeId), newNode);
        
        await addDoc(collection(db, 'logs'), {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          level: 'Info',
          message: `New node ${modalData.name} provisioned by ${currentUser.displayName}`,
          node: modalData.name || 'System',
          authorUid: currentUser.uid
        });
      } else {
        const nodeRef = doc(db, 'nodes', modalData.id!);
        await updateDoc(nodeRef, { ...modalData });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Modal Submit Error:", error);
      let message = "Operation failed. Please check your permissions.";
      try {
        const errJson = JSON.parse(error.message);
        if (errJson.error.includes('insufficient permissions')) {
          message = "Permission denied. Only administrators can perform this action.";
        }
      } catch (e) {
        // Not a JSON error
      }
      setModalError(message);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const renderExpandedPanelContent = () => {
    if (!expandedPanel) return null;
    
    switch (expandedPanel) {
      case "Network Traffic":
        return (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorNetExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-grafana-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-grafana-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                  itemStyle={{ color: 'var(--color-grafana-text)' }}
                />
                <Area type="monotone" dataKey="network" stroke="var(--color-grafana-blue)" fillOpacity={1} fill="url(#colorNetExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case "CPU Trend":
        return (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpuExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-grafana-green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-grafana-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                  itemStyle={{ color: 'var(--color-grafana-text)' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="var(--color-grafana-green)" fillOpacity={1} fill="url(#colorCpuExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case "RAM Trend":
        return (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRamExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-grafana-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-grafana-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-grafana-text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                  itemStyle={{ color: 'var(--color-grafana-text)' }}
                />
                <Area type="monotone" dataKey="ram" stroke="var(--color-grafana-purple)" fillOpacity={1} fill="url(#colorRamExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case "Resource Distribution":
        return (
          <div className="flex flex-col gap-8 items-center justify-center h-[500px]">
            <div className="flex gap-16">
              <Gauge value={realtimeMetrics.cpu} label="CPU" color="var(--color-grafana-blue)" />
              <Gauge value={realtimeMetrics.ram} label="RAM" color="var(--color-grafana-purple)" />
            </div>
            <div className="w-full max-w-2xl space-y-6 mt-8">
              {['Storage', 'Cache', 'Database', 'Network', 'API'].map((item, i) => (
                <div key={item} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-grafana-text-muted">
                    <span>{item}</span>
                    <span>{70 - i * 10}%</span>
                  </div>
                  <div className="w-full h-2 bg-grafana-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-grafana-blue transition-all duration-1000" 
                      style={{ width: `${70 - i * 10}%`, backgroundColor: i === 0 ? 'var(--color-grafana-blue)' : i === 1 ? 'var(--color-grafana-purple)' : i === 2 ? 'var(--color-grafana-green)' : i === 3 ? 'var(--color-grafana-yellow)' : 'var(--color-grafana-red)' }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "System Events":
      case "Log Explorer":
        return (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-4 rounded-sm bg-grafana-panel border border-grafana-border hover:border-grafana-blue/30 transition-all">
                <div className={cn(
                  "w-2 h-12 rounded-full",
                  log.level === 'Info' ? "bg-grafana-blue" : log.level === 'Warning' ? "bg-grafana-yellow" : "bg-grafana-red"
                )} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-grafana-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="text-xs font-bold uppercase text-grafana-text-muted">{log.node}</span>
                  </div>
                  <p className="text-sm text-grafana-text font-medium">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case "Node Management":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-grafana-border">
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Node Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">CPU</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">RAM</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Storage</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Region</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(node => (
                  <tr key={node.id} className="border-b border-grafana-border hover:bg-grafana-bg transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-grafana-text">{node.name}</td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-sm text-[9px] font-bold uppercase",
                        node.status === 'Working' ? "bg-grafana-green/10 text-grafana-green" : 
                        node.status === 'Warning' ? "bg-grafana-yellow/10 text-grafana-yellow" : "bg-grafana-red/10 text-grafana-red"
                      )}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-grafana-blue">{node.cpu}%</td>
                    <td className="px-4 py-4 text-xs font-mono text-grafana-purple">{node.ram}%</td>
                    <td className="px-4 py-4 text-xs font-mono text-grafana-green">{node.storage}%</td>
                    <td className="px-4 py-4 text-xs text-grafana-text-muted">{node.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div className="mt-8 p-12 border border-dashed border-grafana-border rounded-sm flex flex-col items-center justify-center text-center">
            <Activity size={48} className="text-grafana-blue mb-4 opacity-20 animate-pulse" />
            <p className="text-sm text-grafana-text font-bold">Detailed Analytics View</p>
            <p className="text-xs text-grafana-text-muted mt-2 max-w-xs">This panel is currently being rendered in high-fidelity focus mode for deep analysis.</p>
          </div>
        );
    }
  };

  const renderView = () => {
    switch (view) {
      case 'Dashboard':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Professional System Briefing removed */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatPanel 
                label="Total Nodes" 
                value={nodes.length.toString()} 
                trend={nodes.length > 0 ? "+1" : "0"} 
                color="var(--color-grafana-green)" 
                icon={<Server />} 
                description="Active compute instances across all regions."
              />
              <StatPanel 
                label="Avg CPU Load" 
                value={`${Math.round(realtimeMetrics.cpu)}%`} 
                trend={realtimeMetrics.cpu > 50 ? "+2.1%" : "-1.2%"} 
                color="var(--color-grafana-blue)" 
                icon={<Cpu />} 
                description="Aggregated processing demand across the cluster."
              />
              <StatPanel 
                label="Active Alerts" 
                value={nodes.filter(n => n.status === 'Warning').length.toString()} 
                trend="0" 
                color="var(--color-grafana-red)" 
                icon={<AlertTriangle />} 
                description="System deviations requiring immediate attention."
              />
              <StatPanel 
                label="Uptime" 
                value="99.99%" 
                trend="+0.01%" 
                color="var(--color-grafana-yellow)" 
                icon={<Clock />} 
                description="Continuous operational reliability metric."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Network Traffic" icon={<Activity size={14} />} onExpand={() => setExpandedPanel("Network Traffic")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorNetDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-green)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-green)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="network" stroke="var(--color-grafana-green)" fillOpacity={1} fill="url(#colorNetDash)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Global CPU" icon={<Cpu size={14} />} onExpand={() => setExpandedPanel("CPU Trend")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpuDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-blue)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="var(--color-grafana-blue)" fillOpacity={1} fill="url(#colorCpuDash)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Global RAM" icon={<Activity size={14} />} onExpand={() => setExpandedPanel("RAM Trend")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRamDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-purple)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-purple)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="ram" stroke="var(--color-grafana-purple)" fillOpacity={1} fill="url(#colorRamDash)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Resource Distribution" icon={<Database size={14} />} onExpand={() => setExpandedPanel("Resource Distribution")}>
                <div className="flex flex-col gap-4 items-center justify-center py-4">
                  <div className="w-full space-y-3">
                    {['Storage', 'Cache', 'Database'].map((item, i) => (
                      <div key={item} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-grafana-text-muted">
                          <span>{item}</span>
                          <span>{70 - i * 15}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-grafana-bg rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-grafana-blue transition-all duration-1000" 
                            style={{ width: `${70 - i * 15}%`, backgroundColor: i === 0 ? 'var(--color-grafana-blue)' : i === 1 ? 'var(--color-grafana-purple)' : 'var(--color-grafana-green)' }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
              <Panel title="System Events" icon={<FileText size={14} />} onExpand={() => setExpandedPanel("System Events")} className="max-h-[300px]">
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-2 rounded-sm bg-grafana-panel border border-grafana-border hover:border-grafana-blue/30 transition-all">
                      <div className={cn(
                        "w-1.5 h-8 rounded-full",
                        log.level === 'Info' ? "bg-grafana-blue" : log.level === 'Warning' ? "bg-grafana-yellow" : "bg-grafana-red"
                      )} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-grafana-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="text-[10px] font-bold uppercase text-grafana-text-muted">{log.node}</span>
                        </div>
                        <p className="text-[11px] text-grafana-text font-medium">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        );
      case 'Infrastructure':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-grafana-panel p-3 border border-grafana-border rounded-sm">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-grafana-text-muted" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search nodes..." 
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm pl-9 pr-4 py-1.5 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 bg-grafana-input-bg border border-grafana-border rounded-sm p-1">
                  <button 
                    onClick={() => setInfraViewMode('table')}
                    className={cn(
                      "p-1 rounded-sm transition-all",
                      infraViewMode === 'table' ? "bg-grafana-border text-grafana-blue" : "text-grafana-text-muted hover:text-grafana-text"
                    )}
                    title="Table View"
                  >
                    <Menu size={14} />
                  </button>
                  <button 
                    onClick={() => setInfraViewMode('matrix')}
                    className={cn(
                      "p-1 rounded-sm transition-all",
                      infraViewMode === 'matrix' ? "bg-grafana-border text-grafana-blue" : "text-grafana-text-muted hover:text-grafana-text"
                    )}
                    title="Matrix View"
                  >
                    <LayoutDashboard size={14} />
                  </button>
                </div>
                <select 
                  className="bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-1.5 text-[11px] text-grafana-text focus:border-grafana-blue outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Status</option>
                  <option value="Working">Working</option>
                  <option value="Warning">Warning</option>
                  <option value="Shutdown">Shutdown</option>
                </select>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => handleOpenModal('add')}
                  className="bg-grafana-blue hover:bg-grafana-blue/80 text-white text-[11px] font-bold px-4 py-2 rounded-sm flex items-center gap-2 transition-all uppercase tracking-widest"
                >
                  <Plus size={14} /> Provision Node
                </button>
              )}
            </div>

            {infraViewMode === 'table' ? (
              <Panel title="Node Management" icon={<Globe size={14} />} onExpand={() => setExpandedPanel("Node Management")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-grafana-border text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">
                        <th className="px-4 py-3">Node Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Resources (C/R/S)</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Latency</th>
                        <th className="px-4 py-3">Uptime</th>
                        {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {filteredNodes.map(node => (
                        <tr key={node.id} className="border-b border-grafana-border hover:bg-grafana-panel transition-colors group">
                          <td className="px-4 py-3 font-bold text-grafana-text">{node.name}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase",
                              node.status === 'Working' ? "bg-grafana-green/10 text-grafana-green" : 
                              node.status === 'Warning' ? "bg-grafana-yellow/10 text-grafana-yellow" : "bg-grafana-red/10 text-grafana-red"
                            )}>
                              {node.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <span className={cn("px-1 rounded-sm", node.cpu > 80 ? "text-grafana-red" : "text-grafana-text-muted")}>{node.cpu}%</span>
                              <span className="text-grafana-border">/</span>
                              <span className={cn("px-1 rounded-sm", node.ram > 80 ? "text-grafana-red" : "text-grafana-text-muted")}>{node.ram}%</span>
                              <span className="text-grafana-border">/</span>
                              <span className={cn("px-1 rounded-sm", node.storage > 80 ? "text-grafana-red" : "text-grafana-text-muted")}>{node.storage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-grafana-text-muted font-mono">{node.region}</td>
                          <td className="px-4 py-3 text-grafana-text-muted font-mono">{node.latency}ms</td>
                          <td className="px-4 py-3 text-grafana-text-muted font-mono">{node.uptime}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal('edit', node)} className="p-1.5 hover:bg-grafana-border rounded-sm text-grafana-blue transition-colors">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteNode(node.id)} className="p-1.5 hover:bg-grafana-border rounded-sm text-grafana-red transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredNodes.map(node => (
                  <div key={node.id}>
                    <Panel 
                      title={node.name} 
                      icon={<div className={cn("w-2 h-2 rounded-full", node.status === 'Working' ? "bg-grafana-green" : node.status === 'Warning' ? "bg-grafana-yellow" : "bg-grafana-red")} />}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] text-grafana-text-muted uppercase font-bold tracking-tighter">Region: {node.region}</p>
                            <p className={cn("text-[10px] font-bold uppercase", node.status === 'Working' ? "text-grafana-green" : node.status === 'Warning' ? "text-grafana-yellow" : "text-grafana-red")}>{node.status}</p>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <button onClick={() => handleOpenModal('edit', node)} className="p-1 hover:bg-grafana-border rounded-sm text-grafana-blue transition-colors">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDeleteNode(node.id)} className="p-1 hover:bg-grafana-border rounded-sm text-grafana-red transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="h-[100px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={nodeHistory[node.id] || []}>
                              <defs>
                                <linearGradient id={`colorCpu-infra-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-grafana-blue)" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="var(--color-grafana-blue)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id={`colorRam-infra-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-grafana-purple)" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="var(--color-grafana-purple)" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="2 2" stroke="var(--color-grafana-border)" vertical={false} />
                              <XAxis dataKey="time" hide />
                              <YAxis hide domain={[0, 100]} />
                              <Area type="monotone" dataKey="cpu" stroke="var(--color-grafana-blue)" fillOpacity={1} fill={`url(#colorCpu-infra-${node.id})`} strokeWidth={2} isAnimationActive={false} />
                              <Area type="monotone" dataKey="ram" stroke="var(--color-grafana-purple)" fillOpacity={1} fill={`url(#colorRam-infra-${node.id})`} strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-grafana-border">
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">CPU</p>
                            <p className={cn("text-[10px] font-bold", node.cpu > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.cpu}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">RAM</p>
                            <p className={cn("text-[10px] font-bold", node.ram > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.ram}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">Latency</p>
                            <p className="text-[10px] text-grafana-blue font-mono font-bold">{node.latency}ms</p>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'Logs':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-grafana-panel p-3 border border-grafana-border rounded-sm">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-grafana-text-muted" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filter logs..." 
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm pl-9 pr-4 py-1.5 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all"
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-1.5 text-[11px] text-grafana-text focus:border-grafana-blue outline-none"
                  value={logLevelFilter}
                  onChange={e => setLogLevelFilter(e.target.value as any)}
                >
                  <option value="All">All Levels</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                </select>
              </div>
            </div>

            <Panel title="Log Explorer" icon={<FileText size={14} />} onExpand={() => setExpandedPanel("Log Explorer")}>
              <div className="space-y-1 font-mono">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex gap-4 p-2 rounded-sm bg-grafana-panel border border-grafana-border hover:bg-grafana-header transition-colors text-[10px]">
                    <span className="text-grafana-text-muted whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className={cn(
                      "font-bold uppercase w-16",
                      log.level === 'Info' ? "text-grafana-blue" : log.level === 'Warning' ? "text-grafana-yellow" : "text-grafana-red"
                    )}>[{log.level}]</span>
                    <span className="text-grafana-blue font-bold whitespace-nowrap">{log.node}</span>
                    <span className="text-grafana-text flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        );
      case 'Analytics':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Global CPU Utilization" icon={<Cpu size={14} />} onExpand={() => setExpandedPanel("CPU Trend")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-blue)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="var(--color-grafana-blue)" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} animationDuration={300} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Global RAM Utilization" icon={<Activity size={14} />} onExpand={() => setExpandedPanel("RAM Trend")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-purple)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-purple)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="ram" stroke="var(--color-grafana-purple)" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} animationDuration={300} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Global Network Traffic" icon={<Globe size={14} />} onExpand={() => setExpandedPanel("Network Traffic")}>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorNetAnalytic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-grafana-green)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-grafana-green)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                        itemStyle={{ color: 'var(--color-grafana-text)' }}
                      />
                      <Area type="monotone" dataKey="network" stroke="var(--color-grafana-green)" fillOpacity={1} fill="url(#colorNetAnalytic)" strokeWidth={2} animationDuration={300} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="pt-4 border-t border-grafana-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-grafana-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Server size={14} className="text-grafana-blue" />
                  Individual System Performance Matrix
                </h3>
                <span className="text-[10px] text-grafana-text-muted font-mono bg-grafana-panel px-2 py-1 rounded-sm border border-grafana-border">
                  {nodes.length} Active Systems
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {nodes.map(node => (
                  <div key={node.id}>
                    <Panel title={node.name} icon={<div className={cn("w-2 h-2 rounded-full", node.status === 'Working' ? "bg-grafana-green" : node.status === 'Warning' ? "bg-grafana-yellow" : "bg-grafana-red")} />}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] text-grafana-text-muted uppercase font-bold tracking-tighter">Region: {node.region}</p>
                            <p className="text-[10px] text-grafana-text font-bold">{node.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-grafana-text-muted uppercase font-bold tracking-tighter">Latency</p>
                            <p className="text-[10px] text-grafana-blue font-mono font-bold">{node.latency}ms</p>
                          </div>
                        </div>
                        
                        <div className="h-[120px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={nodeHistory[node.id] || []}>
                              <defs>
                                <linearGradient id={`colorCpu-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-grafana-blue)" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="var(--color-grafana-blue)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id={`colorRam-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-grafana-purple)" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="var(--color-grafana-purple)" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="2 2" stroke="var(--color-grafana-border)" vertical={false} />
                              <XAxis dataKey="time" hide />
                              <YAxis hide domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px', fontSize: '10px' }}
                                labelStyle={{ display: 'none' }}
                              />
                              <Area type="monotone" dataKey="cpu" stroke="var(--color-grafana-blue)" fillOpacity={1} fill={`url(#colorCpu-${node.id})`} strokeWidth={2} isAnimationActive={false} />
                              <Area type="monotone" dataKey="ram" stroke="var(--color-grafana-purple)" fillOpacity={1} fill={`url(#colorRam-${node.id})`} strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-grafana-border">
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">CPU</p>
                            <p className={cn("text-[10px] font-bold", node.cpu > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.cpu}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">RAM</p>
                            <p className={cn("text-[10px] font-bold", node.ram > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.ram}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-grafana-text-muted uppercase font-bold">DISK</p>
                            <p className={cn("text-[10px] font-bold", node.storage > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.storage}%</p>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </div>
                ))}
                {nodes.length === 0 && (
                  <div className="col-span-full py-20 text-center border border-dashed border-grafana-border rounded-sm">
                    <p className="text-[11px] text-grafana-text-muted uppercase tracking-widest">No systems provisioned for analysis</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
              <div className="lg:col-span-2">
                <Panel title="Node Distribution by Region" icon={<Globe size={14} />} onExpand={() => setExpandedPanel("Regional Distribution")}>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(nodes.reduce((acc, node) => {
                        acc[node.region] = (acc[node.region] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map(([region, count]) => ({ region, count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grafana-border)" vertical={false} />
                        <XAxis dataKey="region" stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-grafana-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--color-grafana-header)', border: '1px solid var(--color-grafana-border)', borderRadius: '2px' }}
                          itemStyle={{ color: 'var(--color-grafana-text)' }}
                        />
                        <Bar dataKey="count" fill="var(--color-grafana-blue)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
              <Panel title="System Health Summary" icon={<CheckCircle2 size={14} />} onExpand={() => setExpandedPanel("Health Summary")}>
                <div className="space-y-6 flex flex-col justify-center h-full">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-grafana-green">
                      {Math.round((nodes.filter(n => n.status === 'Working').length / (nodes.length || 1)) * 100)}%
                    </p>
                    <p className="text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest mt-2">Overall Availability</p>
                  </div>
                  <div className="space-y-4">
                    {['Working', 'Warning', 'Shutdown'].map(status => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            status === 'Working' ? "bg-grafana-green" : status === 'Warning' ? "bg-grafana-yellow" : "bg-grafana-red"
                          )} />
                          <span className="text-[11px] text-grafana-text-muted">{status}</span>
                        </div>
                        <span className="text-[11px] font-bold text-grafana-text">{nodes.filter(n => n.status === status).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        );
      case 'Alerts':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Panel title="Active System Alerts" icon={<AlertTriangle size={14} />} onExpand={() => setExpandedPanel("Active Alerts")}>
              {allAlertNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-grafana-text-muted">
                  <CheckCircle2 size={48} className="mb-4 text-grafana-green/50" />
                  <p className="text-sm font-medium">All systems operational. No active alerts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAlertNodes.map(node => (
                    <div key={node.id} className="flex items-center justify-between p-4 bg-grafana-panel border border-grafana-border rounded-sm hover:border-grafana-red/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-sm",
                          node.status === 'Warning' ? "bg-grafana-yellow/10 text-grafana-yellow" : "bg-grafana-red/10 text-grafana-red"
                        )}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-grafana-text">{node.name}</h4>
                          <p className="text-[10px] text-grafana-text-muted uppercase font-bold tracking-widest">
                            {node.status} • {node.region} • Latency: {node.latency}ms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                          <p className="text-[10px] text-grafana-text-muted uppercase font-bold">CPU Load</p>
                          <p className={cn("text-sm font-bold", node.cpu > 80 ? "text-grafana-red" : "text-grafana-text")}>{node.cpu}%</p>
                        </div>
                        <button 
                          onClick={() => setView('Infrastructure')}
                          className="px-3 py-1.5 bg-grafana-header border border-grafana-border rounded-sm text-[10px] font-bold text-grafana-text hover:bg-grafana-border transition-all uppercase tracking-widest"
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        );
      case 'Settings':
        return (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
            <Panel title="User Profile" icon={<User size={14} />}>
              <div className="flex items-center gap-6 p-4">
                <img 
                  src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} 
                  alt={currentUser.displayName}
                  className="w-20 h-20 rounded-full border-2 border-grafana-blue p-1"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-grafana-text">{currentUser.displayName}</h3>
                  <p className="text-sm text-grafana-text-muted">{currentUser.email}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-0.5 bg-grafana-blue/10 text-grafana-blue text-[9px] font-bold uppercase rounded-sm border border-grafana-blue/20">
                      {currentUser.role}
                    </span>
                    <span className="px-2 py-0.5 bg-grafana-green/10 text-grafana-green text-[9px] font-bold uppercase rounded-sm border border-grafana-green/20">
                      Verified
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-grafana-red/10 hover:bg-grafana-red/20 text-grafana-red text-[11px] font-bold rounded-sm border border-grafana-red/20 transition-all uppercase tracking-widest"
                >
                  Sign Out
                </button>
              </div>
            </Panel>

            <Panel title="Appearance" icon={<Sun size={14} />}>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-grafana-text">Theme Selection</h4>
                    <p className="text-[10px] text-grafana-text-muted uppercase tracking-widest font-bold">Switch between light and dark modes</p>
                  </div>
                  <div className="flex bg-grafana-header border border-grafana-border rounded-sm p-1">
                    <button 
                      onClick={() => setIsDarkMode(true)}
                      className={cn(
                        "px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                        isDarkMode ? "bg-grafana-blue text-white shadow-lg" : "text-grafana-text-muted hover:text-grafana-text"
                      )}
                    >
                      <Moon size={12} />
                      Dark
                    </button>
                    <button 
                      onClick={() => setIsDarkMode(false)}
                      className={cn(
                        "px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                        !isDarkMode ? "bg-grafana-blue text-white shadow-lg" : "text-grafana-text-muted hover:text-grafana-text"
                      )}
                    >
                      <Sun size={12} />
                      Light
                    </button>
                  </div>
                </div>
              </div>
            </Panel>

            {isAdmin && (
              <Panel title="Threshold Configuration" icon={<SettingsIcon size={14} />}>
                <div className="space-y-6 p-2">
                  {(['cpu', 'ram', 'storage'] as const).map(key => (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-grafana-text uppercase tracking-wider">{key} Warning Threshold</label>
                        <span className="text-[11px] font-mono text-grafana-blue font-bold">{thresholds[key]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={thresholds[key]}
                        onChange={e => setThresholds({...thresholds, [key]: parseInt(e.target.value)})}
                        className="w-full h-1 bg-grafana-header rounded-lg appearance-none cursor-pointer accent-grafana-blue"
                      />
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            <div className="flex justify-end gap-3">
              {isAdmin && (
                <>
                  <button className="px-4 py-1.5 bg-grafana-header border border-grafana-border rounded-sm text-[11px] font-bold text-grafana-text hover:bg-grafana-border transition-all">
                    Reset Defaults
                  </button>
                  <button 
                    onClick={() => alert("Settings saved successfully!")}
                    className="px-4 py-1.5 bg-grafana-blue hover:bg-grafana-blue/80 text-white text-[11px] font-bold rounded-sm transition-all"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grafana-bg">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-grafana-blue animate-spin" />
          <p className="text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grafana-bg p-4 font-sans relative">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-grafana-panel border border-grafana-border rounded-sm text-grafana-text-muted hover:text-grafana-text transition-all shadow-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <div className="grafana-panel p-8 rounded-sm w-full max-w-md border-t-2 border-grafana-blue shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-grafana-blue/10 p-4 rounded-sm mb-4">
              <Zap className="w-10 h-10 text-grafana-blue" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-grafana-text uppercase">OPSMONITOR</h1>
            <p className="text-grafana-text-muted text-[11px] mt-2 uppercase font-bold tracking-widest">Infrastructure Control Plane</p>
          </div>

          <div className="mb-8 p-4 bg-grafana-header border border-grafana-border rounded-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-grafana-blue" />
                <span className="text-[9px] font-bold text-grafana-text-muted uppercase tracking-widest">Access Protocol v4.2</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-grafana-green animate-pulse" />
                <span className="text-[8px] text-grafana-green font-mono uppercase">LIVE</span>
              </div>
            </div>
            <p className="text-[10px] text-grafana-text leading-relaxed">
              Authorized personnel only. All access attempts are logged and monitored via encrypted telemetry streams. 
              Ensure your credentials match the assigned regional security clearance.
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {needsProfileSetup ? (
              <div className="mb-6 p-4 bg-grafana-blue/10 border border-grafana-blue/30 rounded-sm">
                <p className="text-[11px] text-grafana-blue font-bold uppercase tracking-wider mb-2">Profile Setup Required</p>
                <p className="text-[10px] text-grafana-text-muted">You are authenticated, but we need a few more details to set up your dashboard access.</p>
              </div>
            ) : null}

            {(isRegistering || needsProfileSetup) && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Display Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all placeholder-grafana-text-muted/50"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Role</label>
                  <select 
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                  >
                    <option value="User">Normal User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </>
            )}
            
            {!needsProfileSetup && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all placeholder-grafana-text-muted/50"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all placeholder-grafana-text-muted/50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}
            
            {authError && (
              <p className="text-grafana-red text-[10px] font-bold">{authError}</p>
            )}

            <button 
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full bg-grafana-blue hover:bg-grafana-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-sm transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"
            >
              {isAuthSubmitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                needsProfileSetup ? 'Complete Setup' : (isRegistering ? 'Create Account' : 'Sign In')
              )}
            </button>
          </form>

          {!needsProfileSetup && (
            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[11px] text-grafana-blue hover:underline font-bold uppercase tracking-widest"
              >
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </button>
            </div>
          )}

          {needsProfileSetup && (
            <div className="mt-6 text-center">
              <button 
                onClick={() => logout()}
                className="text-[11px] text-grafana-red hover:underline font-bold uppercase tracking-widest"
              >
                Cancel & Sign Out
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-grafana-border">
            <div className="mb-4 flex items-start gap-2 bg-grafana-red/5 p-2 rounded-sm border border-grafana-red/10">
              <AlertTriangle size={12} className="text-grafana-red shrink-0 mt-0.5" />
              <p className="text-[8px] text-grafana-text-muted leading-tight">
                <span className="text-grafana-red font-bold uppercase">Security Notice:</span> Unauthorized access is strictly prohibited under the Federal Information Security Management Act (FISMA). All activities are recorded.
              </p>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-grafana-text-muted uppercase tracking-widest">System Status</span>
                <span className="text-[9px] text-grafana-green font-mono uppercase">ONLINE</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[8px] font-bold text-grafana-text-muted uppercase tracking-widest">Region</span>
                <span className="text-[9px] text-grafana-text font-mono uppercase">GLOBAL-X</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-bold text-grafana-text-muted uppercase tracking-widest">Encryption</span>
                <span className="text-[9px] text-grafana-blue font-mono uppercase">SSL/TLS 1.3</span>
              </div>
            </div>
            <p className="text-[9px] text-grafana-text-muted uppercase font-bold tracking-widest text-center opacity-50">Secure Access Protocol v4.2.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grafana-bg flex text-grafana-text font-sans">
      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="grafana-panel p-6 rounded-sm w-full max-w-md border border-grafana-border shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-grafana-border pb-3">
              <h3 className="text-sm font-bold text-grafana-text uppercase tracking-wider">{modalMode === 'add' ? 'Provision New Node' : 'Edit System Details'}</h3>
              <X className="cursor-pointer text-grafana-text-muted hover:text-grafana-text transition-colors" onClick={() => setIsModalOpen(false)} size={16} />
            </div>
            <form onSubmit={handleSubmitModal} className="space-y-5">
              {modalError && (
                <div className="p-3 bg-grafana-red/10 border border-grafana-red/30 rounded-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-grafana-red" />
                  <p className="text-[10px] text-grafana-red font-bold">{modalError}</p>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Node Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all placeholder-grafana-text-muted/50"
                  placeholder="e.g. Worker-Node-01"
                  value={modalData.name}
                  onChange={e => setModalData({...modalData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Region</label>
                  <select 
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all"
                    value={modalData.region}
                    onChange={e => setModalData({...modalData, region: e.target.value})}
                  >
                    <option value="us-east-1">us-east-1</option>
                    <option value="eu-west-1">eu-west-1</option>
                    <option value="ap-south-1">ap-south-1</option>
                    <option value="us-west-2">us-west-2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-grafana-text-muted uppercase mb-1.5 tracking-wider">Status</label>
                  <select 
                    className="w-full bg-grafana-input-bg border border-grafana-border rounded-sm px-3 py-2 text-[11px] text-grafana-text focus:border-grafana-blue outline-none transition-all"
                    value={modalData.status}
                    onChange={e => setModalData({...modalData, status: e.target.value as SystemStatus})}
                  >
                    <option value="Working">Working</option>
                    <option value="Warning">Warning</option>
                    <option value="Shutdown">Shutdown</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-grafana-border">
                <h4 className="text-[9px] font-bold text-grafana-text-muted uppercase tracking-widest">Resource Allocation</h4>
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-grafana-text-muted uppercase">CPU Load (%)</label>
                      <span className="text-[10px] font-mono text-grafana-blue font-bold">{modalData.cpu}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      className="w-full h-1 bg-grafana-header rounded-lg appearance-none cursor-pointer accent-grafana-blue"
                      value={modalData.cpu}
                      onChange={e => setModalData({...modalData, cpu: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-grafana-text-muted uppercase">RAM Usage (%)</label>
                      <span className="text-[10px] font-mono text-grafana-purple font-bold">{modalData.ram}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      className="w-full h-1 bg-grafana-header rounded-lg appearance-none cursor-pointer accent-grafana-purple"
                      value={modalData.ram}
                      onChange={e => setModalData({...modalData, ram: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-grafana-text-muted uppercase">Storage Usage (%)</label>
                      <span className="text-[10px] font-mono text-grafana-green font-bold">{modalData.storage}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      className="w-full h-1 bg-grafana-header rounded-lg appearance-none cursor-pointer accent-grafana-green"
                      value={modalData.storage}
                      onChange={e => setModalData({...modalData, storage: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-grafana-header border border-grafana-border rounded-sm text-[11px] font-bold text-grafana-text hover:bg-grafana-border transition-all uppercase tracking-widest">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isModalSubmitting}
                  className="flex-1 px-4 py-2 bg-grafana-blue hover:bg-grafana-blue/80 disabled:opacity-50 text-white text-[11px] font-bold rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isModalSubmitting ? <RefreshCw size={12} className="animate-spin" /> : (modalMode === 'add' ? 'Deploy' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Toaster position="top-right" theme={isDarkMode ? 'dark' : 'light'} richColors closeButton />
      <aside className={cn(
        "bg-grafana-header border-r border-grafana-border transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50",
        isSidebarOpen ? "w-56" : "w-16"
      )}>
        <div className="h-12 flex items-center px-4 gap-3 border-b border-grafana-border bg-grafana-panel">
          <div className="w-6 h-6 bg-grafana-blue rounded-sm flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {isSidebarOpen && <span className="text-sm font-bold tracking-tight text-grafana-text">OPSMONITOR</span>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === 'Dashboard'} onClick={() => setView('Dashboard')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Globe size={18} />} label="Infrastructure" active={view === 'Infrastructure'} onClick={() => setView('Infrastructure')} collapsed={!isSidebarOpen} />
          <NavItem icon={<BarChart3 size={18} />} label="Analytics" active={view === 'Analytics'} onClick={() => setView('Analytics')} collapsed={!isSidebarOpen} />
          <NavItem icon={<FileText size={18} />} label="Explore" active={view === 'Logs'} onClick={() => setView('Logs')} collapsed={!isSidebarOpen} />
          <div className="pt-4 pb-2 px-2">
            {!isSidebarOpen ? <div className="h-px bg-grafana-border" /> : <p className="text-[10px] font-bold text-grafana-text-muted uppercase tracking-widest">Configuration</p>}
          </div>
          <NavItem icon={<SettingsIcon size={18} />} label="Settings" active={view === 'Settings'} onClick={() => setView('Settings')} collapsed={!isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-grafana-border bg-grafana-panel">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} 
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-full border border-grafana-border shrink-0"
              referrerPolicy="no-referrer"
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-grafana-text truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-grafana-text-muted truncate">{currentUser.role}</p>
              </div>
            )}
            {isSidebarOpen && <LogOut size={14} className="text-grafana-text-muted cursor-pointer hover:text-grafana-text" onClick={handleLogout} />}
          </div>
        </div>
      </aside>

      {/* Expanded Panel Overlay */}
      {expandedPanel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-h-full max-w-6xl flex flex-col">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setExpandedPanel(null)}
                className="bg-grafana-header border border-grafana-border rounded-full p-2 text-grafana-text hover:bg-grafana-border transition-all shadow-xl"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden rounded-sm border border-grafana-border shadow-2xl bg-grafana-bg">
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <h2 className="text-xl font-bold text-grafana-text mb-6 uppercase tracking-widest border-b border-grafana-border pb-4 flex items-center gap-3 shrink-0">
                  <Maximize2 size={20} className="text-grafana-blue" />
                  {expandedPanel}
                </h2>
                <div className="flex-1 overflow-y-auto pr-2">
                  {renderExpandedPanelContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-56" : "ml-16"
      )}>
        {/* Header */}
        <header className="h-12 bg-grafana-panel border-b border-grafana-border flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Menu size={18} className="text-grafana-text-muted cursor-pointer hover:text-grafana-text" onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="text-grafana-text-muted">Home</span>
              <ChevronRight size={12} className="text-grafana-text-muted" />
              <span className="text-grafana-text">{view}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-grafana-text-muted relative">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 hover:bg-grafana-border rounded-sm transition-all text-grafana-text-muted hover:text-grafana-text"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="relative">
                <Bell 
                  size={16} 
                  className={cn("cursor-pointer hover:text-grafana-text transition-colors", isNotificationsOpen && "text-grafana-text")} 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-grafana-red text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-grafana-panel">
                    {totalAlerts}
                  </span>
                )}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-grafana-panel border border-grafana-border rounded-sm shadow-2xl p-0 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-grafana-border bg-grafana-header flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-grafana-text">Active Alerts</span>
                      <span className="text-[9px] bg-grafana-red/10 text-grafana-red px-1.5 py-0.5 rounded-sm font-bold">{totalAlerts}</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {allAlertNodes.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-grafana-text-muted">No active alerts</div>
                      ) : (
                        allAlertNodes.map(node => (
                          <div key={node.id} className="p-3 border-b border-grafana-border hover:bg-grafana-border transition-colors cursor-pointer" onClick={() => { setView('Alerts'); setIsNotificationsOpen(false); }}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                node.status === 'Working' ? "bg-grafana-yellow" : "bg-grafana-red"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-grafana-text truncate">{node.name}</p>
                                <p className="text-[9px] text-grafana-text-muted truncate">
                                  {node.status !== 'Working' ? node.status : 'Threshold Exceeded'} • CPU: {node.cpu}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-grafana-border text-center">
                      <button onClick={() => { setView('Alerts'); setIsNotificationsOpen(false); }} className="text-[9px] font-bold uppercase tracking-widest text-grafana-blue hover:text-grafana-blue/80 transition-colors">
                        View All Alerts
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search 
                  size={16} 
                  className={cn("cursor-pointer hover:text-grafana-text transition-colors", isSearchOpen && "text-grafana-text")} 
                  onClick={() => setIsSearchOpen(!isSearchOpen)} 
                />
                {isSearchOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-grafana-panel border border-grafana-border rounded-sm shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-grafana-text-muted" />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Global search..." 
                        className="w-full bg-grafana-bg border border-grafana-border rounded-sm pl-8 pr-3 py-1.5 text-[11px] text-grafana-text focus:border-grafana-blue outline-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-grafana-text tracking-tight">{view}</h2>
              <p className="text-xs text-grafana-text-muted mt-1">Real-time infrastructure monitoring and management console.</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-grafana-header border border-grafana-border rounded-sm px-3 py-1.5 flex items-center gap-2">
                <Clock size={12} className="text-grafana-text-muted" />
                <span className="text-[10px] font-bold text-grafana-text">Last 24 Hours</span>
              </div>
              <button className="bg-grafana-panel border border-grafana-border rounded-sm p-1.5 text-grafana-text hover:bg-grafana-border transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DashboardContent />
  );
}
