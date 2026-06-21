import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { HardDrive, Trash2, ShieldCheck, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Drive, CleanupLog, ScanHistory } from '../types';

interface DashboardProps {
  selectedDrive: Drive | null;
  drives: Drive[];
  onNavigate: (tab: string) => void;
  categoriesBreakdown: Record<string, number>;
}

export default function Dashboard({ selectedDrive, drives, onNavigate, categoriesBreakdown }: DashboardProps) {
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [recoverableSize, setRecoverableSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [recsData, logsData, historyData] = await Promise.all([
        api.getRecommendations(),
        api.getLogs(8),
        api.getScanHistory(5)
      ]);
      setRecoverableSize(recsData.total_recoverable);
      setLogs(logsData);
      setHistory(historyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedDrive]);

  // Storage usage values
  const total = selectedDrive?.total || 0;
  const used = selectedDrive?.used || 0;
  const free = selectedDrive?.free || 0;
  const percent = selectedDrive ? parseFloat(selectedDrive.percent.toFixed(1)) : 0;

  // Recharts data formatters
  const usagePieData = [
    { name: 'Used Space', value: used, color: '#0078d4' },
    { name: 'Free Space', value: free, color: '#10b981' }
  ];

  // Category breakdown chart data
  const hasBreakdown = Object.values(categoriesBreakdown).some(val => val > 0);
  
  const categoryChartData = hasBreakdown 
    ? Object.entries(categoriesBreakdown).map(([name, value]) => ({
        name,
        size: parseFloat((value / (1024 * 1024 * 1024)).toFixed(2)), // in GB
        bytes: value
      })).sort((a, b) => b.bytes - a.bytes)
    : [
        { name: 'Videos', size: 0 },
        { name: 'Images', size: 0 },
        { name: 'Documents', size: 0 },
        { name: 'Archives', size: 0 },
        { name: 'Software', size: 0 },
        { name: 'System Files', size: 0 },
        { name: 'Other', size: 0 }
      ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308', '#10b981', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System overview and drive health metrics.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh metrics</span>
        </button>
      </div>

      {/* Main Grid stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Total Capacity</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">
              {selectedDrive ? formatSize(total) : 'Select Drive'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Total physical size</p>
          </div>
        </div>

        {/* Card 2: Used */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Used Space</span>
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">
              {selectedDrive ? formatSize(used) : 'Select Drive'}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <div className="w-full bg-white/10 rounded-full h-1.5 mr-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full" 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-slate-300">{percent}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Free */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">Free Space</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">
              {selectedDrive ? formatSize(free) : 'Select Drive'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Available for storage</p>
          </div>
        </div>

        {/* Card 4: Recoverable */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group border border-blue-500/20 shadow-glow-blue">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-400 font-semibold">Recoverable Space</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-rose-400">
              {formatSize(recoverableSize)}
            </h3>
            <button 
              onClick={() => onNavigate('cleanup')}
              className="mt-2 text-xs flex items-center text-blue-400 hover:text-blue-300 font-medium transition duration-200"
            >
              Clean Center <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie usage chart */}
        <div className="glass-panel rounded-xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Storage Split</h2>
            <p className="text-slate-400 text-xs mt-0.5">Used vs Free capacity allocation</p>
          </div>
          <div className="h-64 mt-4 relative flex items-center justify-center">
            {selectedDrive ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usagePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usagePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatSize(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">Please select a drive first</div>
            )}
            {selectedDrive && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{percent}%</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Used</span>
              </div>
            )}
          </div>
          <div className="flex justify-around mt-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#0078d4] rounded-full"></div>
              <span>Used: {selectedDrive ? formatSize(used) : '0 GB'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
              <span>Free: {selectedDrive ? formatSize(free) : '0 GB'}</span>
            </div>
          </div>
        </div>

        {/* Categories Bar chart */}
        <div className="glass-panel rounded-xl p-6 lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold text-white">File Type Distribution</h2>
            <p className="text-slate-400 text-xs mt-0.5">Space consumed by file categories (GB)</p>
          </div>
          <div className="h-64 mt-6">
            {hasBreakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" GB" />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      formatSize(props.payload.bytes), 
                      'Total Size'
                    ]}
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                  <Bar dataKey="size" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500 border border-dashed border-white/10 rounded-lg">
                <Trash2 className="w-8 h-8 opacity-40" />
                <span className="text-sm">Scan a drive to populate type breakdown details</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History and logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Operations Log */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Activity and Cleanup Logs</h2>
          <p className="text-slate-400 text-xs mt-0.5">History of safe cleanups and logs</p>
          
          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition duration-150">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white max-w-[280px] truncate" title={log.path}>
                      {log.action_type === 'empty_recycle_bin' ? 'Emptied Recycle Bin' : `Deleted ${log.path.split('\\').pop()}`}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.status === 'SUCCESS' ? `+ ${formatSize(log.reclaimed_size)}` : 'Failed'}
                    </span>
                    {log.error_message && (
                      <span className="text-[10px] text-rose-300/80 max-w-[120px] truncate" title={log.error_message}>
                        {log.error_message}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">No cleanup actions logged yet.</div>
            )}
          </div>
        </div>

        {/* Scan History */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Scan History</h2>
          <p className="text-slate-400 text-xs mt-0.5">Previous scan tasks on this machine</p>
          
          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {history.length > 0 ? (
              history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition duration-150">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      Drive Partition {h.drive}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(h.scanned_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-400">
                      {formatSize(h.total_size)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {h.total_files.toLocaleString()} files scanned
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">No scans run yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
