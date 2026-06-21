import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, HardDrive, Trash2, FileText, Layers, AppWindow, 
  Settings as SettingsIcon, Search, ShieldCheck, Sun, Moon, ArrowRight, Activity 
} from 'lucide-react';
import { api, connectProgressWebSocket } from './services/api';
import { Drive, ScanProgress } from './types';

// Page Imports
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import LargeItems from './pages/LargeItems';
import Duplicates from './pages/Duplicates';
import JunkFiles from './pages/JunkFiles';
import Software from './pages/Software';
import CleanupCenter from './pages/CleanupCenter';
import ReportsSettings from './pages/ReportsSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  
  // Progress state
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [categoriesBreakdown, setCategoriesBreakdown] = useState<Record<string, number>>({});
  
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Load drives list
  const loadDrives = async () => {
    try {
      const data = await api.getDrives();
      setDrives(data);
      if (data.length > 0 && !selectedDrive) {
        setSelectedDrive(data[0]);
      }
    } catch (e) {
      console.error("Failed to load drives", e);
    }
  };

  useEffect(() => {
    loadDrives();
    
    // Check initial scan progress in backend
    api.getScanProgress().then(progress => {
      setScanProgress(progress);
    });

    // Establish WebSocket subscription for scanning updates
    const ws = connectProgressWebSocket((progress) => {
      setScanProgress(progress);
      if (progress.categories_breakdown) {
        setCategoriesBreakdown(progress.categories_breakdown);
      }
      // If scan just completed, reload drive information to update usage
      if (!progress.is_scanning && progress.percentage === 100) {
        loadDrives();
      }
    });

    return () => {
      ws.close();
    };
  }, []);

  // Theme application
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleStartScan = async () => {
    if (!selectedDrive) return;
    try {
      await api.startScan(selectedDrive.mountpoint);
      setActiveTab('scanner');
    } catch (e) {
      console.error("Failed to start scan", e);
    }
  };

  const handleStopScan = async () => {
    try {
      await api.stopScan();
    } catch (e) {
      console.error("Failed to cancel scan", e);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const isScanning = scanProgress?.is_scanning || false;

  // Sidebar navigation mapping
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Drive Scanner', icon: HardDrive, tag: isScanning ? 'Active' : undefined },
    { id: 'large-items', label: 'Large Items', icon: FileText },
    { id: 'duplicates', label: 'Duplicate Finder', icon: Layers },
    { id: 'junk-files', label: 'Junk Files', icon: Trash2 },
    { id: 'software', label: 'Installed Software', icon: AppWindow },
    { id: 'cleanup', label: 'Cleanup Center', icon: ShieldCheck },
    { id: 'reports', label: 'Settings & Reports', icon: SettingsIcon },
  ];

  // Selected view router
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            selectedDrive={selectedDrive} 
            drives={drives} 
            onNavigate={setActiveTab}
            categoriesBreakdown={categoriesBreakdown}
          />
        );
      case 'scanner':
        return (
          <Scanner 
            drives={drives} 
            selectedDrive={selectedDrive} 
            onSelectDrive={setSelectedDrive} 
            scanProgress={scanProgress}
            onStartScan={handleStartScan}
            onStopScan={handleStopScan}
          />
        );
      case 'large-items':
        return <LargeItems />;
      case 'duplicates':
        return <Duplicates />;
      case 'junk-files':
        return <JunkFiles />;
      case 'software':
        return <Software />;
      case 'cleanup':
        return <CleanupCenter />;
      case 'reports':
        return <ReportsSettings theme={theme} onThemeChange={handleThemeChange} />;
      default:
        return <div className="text-center py-20">View not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen relative font-sans">
      {/* Background neon blurred mesh */}
      <div className="mesh-bg"></div>

      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        
        {/* Sidebar Header / Logo */}
        <div>
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-glow-blue">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-md tracking-tight">Drive Cleaner Pro</h2>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Local Utility</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="p-4 space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-glow-blue' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-extrabold text-[8px] animate-pulse">
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-400 font-medium">Localhost: Active</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">v1.2.0</span>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-white/5 px-8 flex justify-between items-center sticky top-0 z-20">
          
          {/* Drive selector and search */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold bg-white/5 border border-white/5 rounded-xl px-3 py-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <select
                disabled={isScanning}
                value={selectedDrive?.device || ''}
                onChange={(e) => {
                  const drive = drives.find(d => d.device === e.target.value);
                  if (drive) setSelectedDrive(drive);
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {drives.map(d => (
                  <option key={d.device} value={d.device} className="bg-[#1e293b] text-white">
                    Drive ({d.device})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 max-w-xs text-xs">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search resources..."
                disabled
                className="bg-transparent text-slate-400 placeholder-slate-500 focus:outline-none w-40"
              />
            </div>
          </div>

          {/* Quick scan & Theme switch controls */}
          <div className="flex items-center gap-4">
            {isScanning ? (
              <button
                onClick={handleStopScan}
                className="px-4 py-2 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition duration-150 flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></div>
                Cancel Scan
              </button>
            ) : (
              <button
                onClick={handleStartScan}
                disabled={!selectedDrive}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-glow-blue hover:from-blue-500 hover:to-indigo-500 transition duration-200 flex items-center gap-1.5"
              >
                Scan Target
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick theme button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 border border-white/5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8 flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
