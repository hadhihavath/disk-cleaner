import React, { useEffect, useState } from 'react';
import { AppWindow, Search, Copy, Info, AlertTriangle, ArrowUpDown, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { SoftwareItem } from '../types';

export default function Software() {
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<string>('size');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      const data = await api.getSoftware();
      setSoftware(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown Size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyUninstall = (uninstallString: string) => {
    if (!uninstallString) return;
    navigator.clipboard.writeText(uninstallString);
    setAlert('Uninstall string copied! Open Command Prompt or Run (Win+R) to execute.');
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filter and sort items
  const processedSoftware = software
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.publisher.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'install_date') {
        comparison = a.install_date.localeCompare(b.install_date);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Installed Software Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit installed software on your system using registry endpoints.
          </p>
        </div>
        
        <button
          onClick={fetchSoftware}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Re-scan Registry</span>
        </button>
      </div>

      {/* Copy notification */}
      {alert && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 text-sm">
          <Info className="w-5 h-5 shrink-0" />
          <span>{alert}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search software by name or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition duration-150"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold sticky top-0 z-10">
                <th className="p-4 cursor-pointer hover:text-white transition select-none" onClick={() => handleSort('name')}>
                  Application Name <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                </th>
                <th className="p-4">Publisher</th>
                <th className="p-4">Version</th>
                <th className="p-4 cursor-pointer hover:text-white transition select-none" onClick={() => handleSort('install_date')}>
                  Install Date <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition select-none text-right" onClick={() => handleSort('size')}>
                  Estimated Size <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                </th>
                <th className="p-4 text-right">Uninstall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 text-slate-400">
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      Reading Windows Registry database...
                    </span>
                  </td>
                </tr>
              ) : processedSoftware.length > 0 ? (
                processedSoftware.map((app, index) => {
                  const isHuge = app.size > 1024 * 1024 * 1024; // > 1GB
                  return (
                    <tr key={index} className="hover:bg-white/5 transition duration-150">
                      <td className="p-4 font-semibold text-white flex items-center gap-2 max-w-[240px] truncate" title={app.name}>
                        <AppWindow className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                        <span>{app.name}</span>
                        {isHuge && (
                          <span 
                            title="Giant Application (> 1GB)" 
                            className="p-1 text-amber-500 bg-amber-500/10 rounded flex items-center shrink-0"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 max-w-[150px] truncate" title={app.publisher}>
                        {app.publisher}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {app.version}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {app.install_date}
                      </td>
                      <td className="p-4 font-bold text-white text-right">
                        {formatSize(app.size)}
                      </td>
                      <td className="p-4 text-right">
                        {app.uninstall_string ? (
                          <button
                            onClick={() => handleCopyUninstall(app.uninstall_string)}
                            className="px-2.5 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-slate-300 rounded transition"
                            title={app.uninstall_string}
                          >
                            Copy Command
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">Manual Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    No matching software records found.
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
