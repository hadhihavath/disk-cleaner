import React, { useEffect, useState } from 'react';
import { Layers, Copy, Trash2, CheckSquare, Square, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DuplicateGroup, FileItem } from '../types';

export default function Duplicates() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Deletion modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await api.getDuplicates();
      setDuplicateGroups(data);
      setSelectedPaths([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (mtime: number) => {
    return new Date(mtime * 1000).toLocaleString();
  };

  // Checkbox toggle
  const handleToggleSelect = (path: string) => {
    if (selectedPaths.includes(path)) {
      setSelectedPaths(selectedPaths.filter(p => p !== path));
    } else {
      setSelectedPaths([...selectedPaths, path]);
    }
  };

  // Smart Selector: Keep Newest
  const handleKeepNewest = () => {
    const pathsToSelect: string[] = [];
    duplicateGroups.forEach(g => {
      // Find files in group (original + duplicates)
      const allFiles = [g.original, ...g.duplicates];
      // Sort descending by modified date to find the newest one
      const sorted = [...allFiles].sort((a, b) => b.mtime - a.mtime);
      const newest = sorted[0];
      // Select all others to delete
      allFiles.forEach(f => {
        if (f.path !== newest.path) {
          pathsToSelect.push(f.path);
        }
      });
    });
    setSelectedPaths(pathsToSelect);
    setAlert({ type: 'success', message: 'Selected all duplicates except the newest copy in each group.' });
    setTimeout(() => setAlert(null), 3000);
  };

  // Smart Selector: Keep Oldest
  const handleKeepOldest = () => {
    const pathsToSelect: string[] = [];
    duplicateGroups.forEach(g => {
      const allFiles = [g.original, ...g.duplicates];
      // Sort ascending by modified date to find oldest
      const sorted = [...allFiles].sort((a, b) => a.mtime - b.mtime);
      const oldest = sorted[0];
      // Select all others to delete
      allFiles.forEach(f => {
        if (f.path !== oldest.path) {
          pathsToSelect.push(f.path);
        }
      });
    });
    setSelectedPaths(pathsToSelect);
    setAlert({ type: 'success', message: 'Selected all duplicates except the oldest copy in each group.' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSelectAll = () => {
    const pathsToSelect: string[] = [];
    duplicateGroups.forEach(g => {
      // Select all duplicates (excludes original by default)
      g.duplicates.forEach(f => {
        pathsToSelect.push(f.path);
      });
    });
    setSelectedPaths(pathsToSelect);
  };

  const handleClearSelection = () => {
    setSelectedPaths([]);
  };

  const handleDeleteSelectedClick = () => {
    if (selectedPaths.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      const results = await api.deleteFiles(selectedPaths);
      const successCount = results.filter(r => r.status === 'SUCCESS').length;
      const reclaimed = results.reduce((sum, r) => sum + r.bytes_reclaimed, 0);
      
      setAlert({
        type: 'success',
        message: `Successfully deleted ${successCount} files. Reclaimed ${formatSize(reclaimed)}.`
      });
      
      // Reload duplicate groups
      await fetchDuplicates();
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message || 'Error occurred during deletion.' });
    } finally {
      setShowConfirmModal(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Calculate stats
  const totalGroups = duplicateGroups.length;
  const totalRecoverableSpace = duplicateGroups.reduce((acc, g) => acc + (g.duplicates.length * g.size), 0);
  const selectedSize = duplicateGroups.reduce((acc, g) => {
    const allFiles = [g.original, ...g.duplicates];
    const groupSelectedCount = allFiles.filter(f => selectedPaths.includes(f.path)).length;
    // Check if the user selected ALL files in group (dangerous - warn or account)
    // Reclaim size is the sum of sizes of checked files in this group
    return acc + (groupSelectedCount * g.size);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Duplicate Finder
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Locate exact binary duplicates using file-size maps and SHA256 hashes.
          </p>
        </div>
        
        <button
          onClick={fetchDuplicates}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Reload duplicates</span>
        </button>
      </div>

      {/* Alert display */}
      {alert && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Control panel & Smart selection deck */}
      {duplicateGroups.length > 0 && (
        <div className="glass-panel rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleKeepOldest}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-glow-blue transition duration-150"
            >
              Keep Oldest
            </button>
            <button
              onClick={handleKeepNewest}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-glow-purple transition duration-150"
            >
              Keep Newest
            </button>
            <button
              onClick={handleSelectAll}
              className="px-3.5 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Select All Dups
            </button>
            {selectedPaths.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-3.5 py-1.5 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Selected Reclaim</span>
              <span className="text-sm font-extrabold text-blue-400">{formatSize(selectedSize)}</span>
            </div>
            <button
              disabled={selectedPaths.length === 0}
              onClick={handleDeleteSelectedClick}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition duration-200 ${
                selectedPaths.length > 0 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedPaths.length})
            </button>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {duplicateGroups.length > 0 ? (
          duplicateGroups.map((g) => {
            const allFiles = [g.original, ...g.duplicates];
            const checkedCount = allFiles.filter(f => selectedPaths.includes(f.path)).length;
            const isAllChecked = checkedCount === allFiles.length;
            const recoverable = (allFiles.length - 1) * g.size;

            return (
              <div key={g.hash} className="glass-panel rounded-xl p-5 border border-white/5 space-y-4 relative overflow-hidden group">
                {/* Horizontal blue strip for decoration */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/40"></div>
                
                {/* Group Summary Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-white/5 ml-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white max-w-[280px] md:max-w-[400px] truncate" title={g.original.name}>
                        {g.original.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Hash SHA256: {g.hash}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex items-center md:flex-col gap-3 md:gap-0">
                    <span className="text-xs text-slate-400">Recoverable: {formatSize(recoverable)}</span>
                    <span className="text-xs font-extrabold text-slate-300 md:mt-0.5">Unit Size: {formatSize(g.size)}</span>
                  </div>
                </div>

                {/* Sublist of files */}
                <div className="space-y-2.5 ml-2">
                  {allFiles.map((file, idx) => {
                    const isChecked = selectedPaths.includes(file.path);
                    const isOriginal = idx === 0;
                    
                    return (
                      <div 
                        key={file.path} 
                        onClick={() => handleToggleSelect(file.path)}
                        className={`flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border text-xs cursor-pointer transition duration-150 ${
                          isChecked 
                            ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10' 
                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-200 block truncate font-mono text-[11px]" title={file.path}>
                              {file.path}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Modified: {formatDate(file.mtime)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 md:mt-0 shrink-0">
                          {isOriginal ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                              Original Candidate
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                              Duplicate Copy
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel rounded-xl py-24 text-center text-slate-500 border border-white/5 flex flex-col items-center gap-3">
            <Layers className="w-12 h-12 text-slate-500 opacity-40" />
            <div>
              <h3 className="font-bold text-white text-base">No duplicates located</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {duplicateGroups.length === 0 ? "Perform a system scan first to populate duplicates." : "No duplicate files found on the scanned drives."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-glass-card space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Confirm Duplicate Deletion
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                You are about to delete selected duplicate copies permanently. This action is irreversible.
              </p>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <p className="text-xs text-slate-300">
                Number of files to delete: <span className="font-bold text-white">{selectedPaths.length}</span>
              </p>
              <p className="text-xs text-rose-400 font-bold">
                Total size to reclaim: {formatSize(selectedSize)}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSelected}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] transition"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
