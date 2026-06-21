import React, { useEffect, useState } from 'react';
import { Trash2, AlertCircle, CheckCircle, FolderOpen, FileText, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { api } from '../services/api';
import { TempCategory, DownloadsAnalysis } from '../types';

export default function JunkFiles() {
  const [activeSubTab, setActiveSubTab] = useState<'temp' | 'downloads'>('temp');
  
  // Temp Files state
  const [tempCategories, setTempCategories] = useState<Record<string, TempCategory>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Downloads state
  const [downloads, setDownloads] = useState<DownloadsAnalysis | null>(null);
  
  // App state
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Confirm delete modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cleanupAction, setCleanupAction] = useState<{ type: 'temp' | 'downloads'; targets: string[] } | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchJunkData = async () => {
    try {
      setLoading(true);
      if (activeSubTab === 'temp') {
        const data = await api.getTempFiles();
        setTempCategories(data);
        // Pre-select all categories with size > 0
        setSelectedCategories(Object.keys(data).filter(k => data[k].size > 0));
      } else {
        const data = await api.getDownloadsAnalysis();
        setDownloads(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJunkData();
  }, [activeSubTab]);

  const toggleExpand = (cat: string) => {
    if (expandedCategories.includes(cat)) {
      setExpandedCategories(expandedCategories.filter(c => c !== cat));
    } else {
      setExpandedCategories([...expandedCategories, cat]);
    }
  };

  const toggleCategorySelect = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setAlert({ type: 'success', message: 'Path copied to clipboard!' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCleanTempClick = () => {
    if (selectedCategories.length === 0) return;
    setCleanupAction({ type: 'temp', targets: selectedCategories });
    setShowConfirmModal(true);
  };

  const handleCleanDownloadsClick = (paths: string[]) => {
    if (paths.length === 0) return;
    setCleanupAction({ type: 'downloads', targets: paths });
    setShowConfirmModal(true);
  };

  const executeCleanup = async () => {
    if (!cleanupAction) return;
    try {
      setLoading(true);
      if (cleanupAction.type === 'temp') {
        const res = await api.cleanupTemp(cleanupAction.targets);
        setAlert({ 
          type: 'success', 
          message: `Successfully cleared temporary files! Reclaimed ${formatSize(res.bytes_reclaimed)}.`
        });
      } else {
        const res = await api.deleteFiles(cleanupAction.targets);
        const successCount = res.filter(r => r.status === 'SUCCESS').length;
        const bytes = res.reduce((sum, r) => sum + r.bytes_reclaimed, 0);
        setAlert({ 
          type: 'success', 
          message: `Successfully deleted ${successCount} files. Reclaimed ${formatSize(bytes)}.`
        });
      }
      // Refresh
      await fetchJunkData();
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message || 'Cleanup operation failed.' });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setCleanupAction(null);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Calculate size sums for temp select
  const selectedTempSize = Object.keys(tempCategories)
    .filter(k => selectedCategories.includes(k))
    .reduce((sum, k) => sum + tempCategories[k].size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Junk & Cache Analyzer
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform safe deletions of user caches, log metrics, and old installation zip configurations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveSubTab('temp')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition duration-200 ${
            activeSubTab === 'temp' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Temporary Directories
        </button>
        <button
          onClick={() => setActiveSubTab('downloads')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition duration-200 ${
            activeSubTab === 'downloads' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Downloads Folder
        </button>
      </div>

      {/* Alerts */}
      {alert && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Sub tabs content */}
      {activeSubTab === 'temp' ? (
        <div className="space-y-5">
          {/* Action Bar */}
          {selectedCategories.length > 0 && (
            <div className="glass-panel rounded-xl p-4 flex justify-between items-center border border-white/5">
              <span className="text-xs font-semibold text-slate-300">
                Selected {selectedCategories.length} categories ({formatSize(selectedTempSize)})
              </span>
              <button
                disabled={loading}
                onClick={handleCleanTempClick}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Clear Selected Cache ({formatSize(selectedTempSize)})
              </button>
            </div>
          )}

          {/* Categories list */}
          <div className="space-y-4">
            {Object.keys(tempCategories).length > 0 ? (
              Object.keys(tempCategories).map((key) => {
                const cat = tempCategories[key];
                const isSelected = selectedCategories.includes(key);
                const isExpanded = expandedCategories.includes(key);
                
                return (
                  <div key={key} className="glass-panel rounded-xl overflow-hidden border border-white/5">
                    {/* Category Header Grid */}
                    <div className="p-4 flex items-center justify-between hover:bg-white/5 transition duration-150 select-none">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={cat.size === 0}
                          onChange={() => toggleCategorySelect(key)}
                          className="w-4 h-4 rounded text-blue-500 bg-white/5 border-white/10"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{cat.category}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.count.toLocaleString()} files indexed</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <span className={`text-sm font-extrabold ${cat.size > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                          {formatSize(cat.size)}
                        </span>
                        
                        <button
                          onClick={() => toggleExpand(key)}
                          disabled={cat.count === 0}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanding Files List Preview */}
                    {isExpanded && cat.files.length > 0 && (
                      <div className="border-t border-white/5 bg-black/20 p-4 max-h-60 overflow-y-auto space-y-2">
                        {cat.files.map((file, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-white/5 rounded border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-2 min-w-0 pr-4">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-300 truncate" title={file.path}>
                                {file.path}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-400 font-medium">{formatSize(file.size)}</span>
                              <button
                                onClick={() => handleCopyPath(file.path)}
                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                                title="Copy Path"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="glass-panel rounded-xl py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <FolderOpen className="w-12 h-12 text-slate-500 opacity-40" />
                <span className="text-sm font-semibold">No cache categories loaded.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Downloads Analysis Subtab */
        <div className="space-y-6">
          {downloads ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recommendations Card Column */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Recommendations</h2>
                
                {downloads.recommendations.length > 0 ? (
                  downloads.recommendations.map((r, i) => (
                    <div key={i} className="glass-panel rounded-xl p-5 border border-white/10 shadow-glow-blue relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition"></div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        {r.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {r.description}
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-blue-400">{formatSize(r.size)}</span>
                        <button
                          onClick={() => handleCleanDownloadsClick(r.actionable_files)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition duration-150"
                        >
                          Clear Suggestion
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-panel rounded-xl p-5 text-center text-slate-500 text-xs border border-dashed border-white/10">
                    Downloads folder is clean and optimized!
                  </div>
                )}
              </div>

              {/* Downloads Files List Column */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Downloads Contents ({downloads.files.length} items, {formatSize(downloads.total_size)})
                </h2>
                
                <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold sticky top-0 z-10">
                          <th className="p-3">File Name</th>
                          <th className="p-3">Size</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {downloads.files.length > 0 ? (
                          downloads.files.map((file) => (
                            <tr key={file.path} className="hover:bg-white/5 transition duration-150">
                              <td className="p-3 font-semibold text-white max-w-[280px] truncate" title={file.name}>
                                {file.name}
                              </td>
                              <td className="p-3 font-bold text-slate-300">
                                {formatSize(file.size)}
                              </td>
                              <td className="p-3 text-right flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleCopyPath(file.path)}
                                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                                  title="Copy Path"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCleanDownloadsClick([file.path])}
                                  className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition border border-transparent"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center py-16 text-slate-500">
                              No files found in downloads folder.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-xl py-24 text-center text-slate-500">
              Loading Downloads analysis metrics...
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && cleanupAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-glass-card space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Confirm Cache Cleanup
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                You are about to delete cache items. This removes temporary configurations, logs, or select folders permanently.
              </p>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <p className="text-xs text-slate-300">
                Cleanup Target: <span className="font-bold text-white">
                  {cleanupAction.type === 'temp' ? `${cleanupAction.targets.length} cache groups` : `${cleanupAction.targets.length} download files`}
                </span>
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowConfirmModal(false); setCleanupAction(null); }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeCleanup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] transition"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
