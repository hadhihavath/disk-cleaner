import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, FileText, Download, Shield, Sliders, Sun, Moon, Database, CheckSquare, Square, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Settings, CleanupLog } from '../types';

interface ReportsSettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export default function ReportsSettings({ theme, onThemeChange }: ReportsSettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [reports, setReports] = useState<{ name: string; path: string; size: number; created_at: string }[]>([]);
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const fetchSettingsAndReports = async () => {
    try {
      setLoading(true);
      const [sData, rData, lData] = await Promise.all([
        api.getSettings(),
        api.getReports(),
        api.getLogs(30)
      ]);
      setSettings(sData);
      setReports(rData);
      setLogs(lData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndReports();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleToggleSetting = async (key: keyof Settings, currentVal: boolean) => {
    if (!settings) return;
    const newVal = !currentVal;
    try {
      await api.updateSetting(key, String(newVal));
      setSettings({ ...settings, [key]: newVal });
      setAlert(`Setting "${key.replace('_', ' ')}" updated successfully.`);
      setTimeout(() => setAlert(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSliderSetting = async (key: keyof Settings, val: number) => {
    if (!settings) return;
    try {
      await api.updateSetting(key, String(val));
      setSettings({ ...settings, [key]: val });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async (format: 'html' | 'csv') => {
    try {
      setLoading(true);
      const res = await api.exportReport(format);
      setAlert(`Report generated successfully: ${res.filepath}`);
      // Refresh reports list
      const rData = await api.getReports();
      setReports(rData);
      setTimeout(() => setAlert(null), 6000);
    } catch (e: any) {
      console.error(e);
      setAlert(`Failed to generate report: ${e.message}`);
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Settings & Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure safety scanner parameters, and export logs or HTML reports.
          </p>
        </div>
        
        <button
          onClick={fetchSettingsAndReports}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{alert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Settings Column */}
        <div className="space-y-6">
          
          {/* Section 1: Themes & General */}
          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Sun className="w-4 h-4 text-blue-400" />
              General Preferences
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-semibold block">Interface Theme</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Toggle between dark mode and light mode</span>
              </div>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`p-1.5 rounded-md transition ${theme === 'dark' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'}`}
                  title="Dark Mode"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onThemeChange('light')}
                  className={`p-1.5 rounded-md transition ${theme === 'light' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'}`}
                  title="Light Mode"
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Scanning & Safety parameters */}
          {settings && (
            <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Safety & Scanning Parameters
              </h2>

              {/* Toggles */}
              <div className="space-y-4">
                {/* Safe Mode Toggle */}
                <div 
                  onClick={() => handleToggleSetting('safe_mode', settings.safe_mode)}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div className="pr-4">
                    <span className="text-xs text-slate-200 font-bold block group-hover:text-white transition">Safe Scan Protection Mode</span>
                    <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                      Blocks access and deletes to Windows directories, System folders, and critical profile paths. Keeps your OS brick-proof.
                    </span>
                  </div>
                  {settings.safe_mode ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Include Hidden Files */}
                <div 
                  onClick={() => handleToggleSetting('include_hidden', settings.include_hidden)}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-xs text-slate-200 font-bold block group-hover:text-white transition">Scan Hidden Folders / Files</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Includes files starting with '.' and Windows hidden attributes.</span>
                  </div>
                  {settings.include_hidden ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Include System Files */}
                <div 
                  onClick={() => handleToggleSetting('include_system', settings.include_system)}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div className="pr-4">
                    <span className="text-xs text-slate-200 font-bold block group-hover:text-white transition">Index Windows System Files</span>
                    <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                      Allows scanner to traverse Program Files/System folders (Will not allow delete under Safe Mode). Can slow down scan.
                    </span>
                  </div>
                  {settings.include_system ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Follow Symlinks */}
                <div 
                  onClick={() => handleToggleSetting('follow_symlinks', settings.follow_symlinks)}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-xs text-slate-200 font-bold block group-hover:text-white transition">Follow Directory Symlinks</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Follow short-cut junctions and symbolic links on the filesystem.</span>
                  </div>
                  {settings.follow_symlinks ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Performance parameters */}
          {settings && (
            <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Performance Parameters
              </h2>
              
              {/* Thread count slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Walk Scan Threads</span>
                  <span className="font-bold text-violet-400">{settings.thread_count} worker threads</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={settings.thread_count}
                  onChange={(e) => handleSliderSetting('thread_count', parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <span className="text-[9px] text-slate-400">Specifies number of thread workers used to run duplicate checking and calculations.</span>
              </div>
            </div>
          )}

        </div>

        {/* Reports Exporter Column */}
        <div className="space-y-6">
          
          {/* Reports generator panel */}
          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Generate Scan Reports
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export data audit reports based on details loaded from the latest scan. Includes file lists, folders distributions, duplicates mapping, and AI suggestions.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExport('html')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-4 border border-white/5 hover:border-blue-500/30 bg-white/5 hover:bg-blue-500/5 rounded-xl transition duration-200"
              >
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mb-2">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Interactive HTML</span>
                <span className="text-[9px] text-slate-400 mt-1">Best for print-to-PDF / sharing</span>
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-4 border border-white/5 hover:border-violet-500/30 bg-white/5 hover:bg-violet-500/5 rounded-xl transition duration-200"
              >
                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 mb-2">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Structured CSV</span>
                <span className="text-[9px] text-slate-400 mt-1">Best for Excel audit analyses</span>
              </button>
            </div>
          </div>

          {/* Exported reports list */}
          <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Download className="w-4 h-4 text-slate-300" />
              Exported Reports History
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {reports.length > 0 ? (
                reports.map((rep) => (
                  <div key={rep.name} className="flex justify-between items-center p-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition duration-150">
                    <div className="min-w-0 pr-4">
                      <span className="font-semibold text-slate-200 block truncate" title={rep.name}>
                        {rep.name}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Created: {rep.created_at} | Size: {formatSize(rep.size)}
                      </span>
                    </div>
                    {/* Native Link mapping to files inside local reports path */}
                    <a
                      href={`file:///${rep.path.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition flex items-center gap-1 font-semibold"
                      title="Open file in browser"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">No reports generated yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Global Deletes action logs overview */}
      <div className="glass-panel rounded-xl p-6 border border-white/5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 mb-4">
          <Database className="w-4 h-4 text-slate-300" />
          Audit Logs history (SQLite Database)
        </h2>

        <div className="overflow-x-auto max-h-[300px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold sticky top-0 z-10">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Target Path</th>
                <th className="p-3 text-right">Reclaimed</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition duration-150">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-300">
                        {log.action_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[280px] truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className="p-3 font-bold text-white text-right">
                      {formatSize(log.reclaimed_size)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.status === 'SUCCESS' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No operational audit logs logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
