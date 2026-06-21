import React, { useEffect, useState } from 'react';
import { Trash2, ShieldAlert, CheckCircle2, RefreshCw, Sparkles, FolderIcon, LayersIcon, HardDrive, TrashIcon } from 'lucide-react';
import { api } from '../services/api';
import { RecommendationItem } from '../types';

export default function CleanupCenter() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [totalRecoverable, setTotalRecoverable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Confirms
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<{ id: string; title: string; size: number } | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data.recommendations);
      setTotalRecoverable(data.total_recoverable);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCleanClick = (rec: RecommendationItem) => {
    setTargetToDelete({ id: rec.id, title: rec.title, size: rec.size });
    setShowConfirmModal(true);
  };

  const executeCleanup = async () => {
    if (!targetToDelete) return;
    try {
      setLoading(true);
      
      if (targetToDelete.id === 'temp_files') {
        // Temp files cleanup
        const res = await api.getTempFiles();
        const categories = Object.keys(res);
        const result = await api.cleanupTemp(categories);
        setSuccessMessage(`Successfully cleared temporary folders! Reclaimed ${formatSize(result.bytes_reclaimed)}.`);
      } else if (targetToDelete.id === 'duplicates') {
        // Duplicate files cleanup
        const duplicates = await api.getDuplicates();
        const pathsToDelete: string[] = [];
        duplicates.forEach(d => {
          // Add all duplicate copies to delete, keeping the original
          d.duplicates.forEach(f => {
            pathsToDelete.push(f.path);
          });
        });
        
        if (pathsToDelete.length > 0) {
          const results = await api.deleteFiles(pathsToDelete);
          const reclaimed = results.reduce((sum, r) => sum + r.bytes_reclaimed, 0);
          setSuccessMessage(`Successfully removed duplicate files! Reclaimed ${formatSize(reclaimed)}.`);
        } else {
          setSuccessMessage(`No duplicate copies found to delete.`);
        }
      } else if (targetToDelete.id.startsWith('downloads_')) {
        // Downloads cleanup
        const dl = await api.getDownloadsAnalysis();
        const recTitle = targetToDelete.title;
        const matchingRec = dl.recommendations.find(r => r.title === recTitle);
        
        if (matchingRec && matchingRec.actionable_files.length > 0) {
          const results = await api.deleteFiles(matchingRec.actionable_files);
          const reclaimed = results.reduce((sum, r) => sum + r.bytes_reclaimed, 0);
          setSuccessMessage(`Successfully cleared downloads folder target files! Reclaimed ${formatSize(reclaimed)}.`);
        } else {
          setSuccessMessage(`No actionable files found for suggestion.`);
        }
      } else if (targetToDelete.id === 'old_files') {
        // Old files clean
        const largeFiles = await api.getLargeFiles();
        // Clear oldest accessed files (e.g. top 20 old items)
        const oldFilesList = largeFiles.slice(0, 20).map(f => f.path);
        const results = await api.deleteFiles(oldFilesList);
        const reclaimed = results.reduce((sum, r) => sum + r.bytes_reclaimed, 0);
        setSuccessMessage(`Successfully removed oldest files! Reclaimed ${formatSize(reclaimed)}.`);
      }
      
      await fetchRecommendations();
    } catch (e: any) {
      console.error(e);
      setSuccessMessage(`Failed to execute cleanup: ${e.message}`);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setTargetToDelete(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleEmptyRecycleBinClick = async () => {
    try {
      setLoading(true);
      const res = await api.emptyRecycleBin();
      if (res.status === 'SUCCESS') {
        setSuccessMessage('Successfully emptied Windows Recycle Bin!');
      } else {
        setSuccessMessage(res.error || 'Recycle Bin might be already empty.');
      }
      await fetchRecommendations();
    } catch (e: any) {
      setSuccessMessage(`Error emptying Recycle Bin: ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Cleanup Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Reclaim storage capacity safely using heuristics recommendations.
          </p>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Recalculate Suggestions</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reco Dashboard Summary card */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-blue-500/25 relative overflow-hidden group shadow-glow-blue flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl -z-10"></div>
          
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Space Optimizer
            </span>
            <h2 className="text-xl font-extrabold text-white leading-snug">AI Cleanup Suggestions</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We analyzed cached logs, duplicate lists, and unaccessed downloads. Cleaning these items can quickly restore drive speed.
            </p>
          </div>

          <div className="mt-8">
            <span className="text-xs text-slate-400 block">Total Recoverable Space</span>
            <span className="text-3xl font-extrabold text-white block mt-1">
              {formatSize(totalRecoverable)}
            </span>
            
            <button
              onClick={handleEmptyRecycleBinClick}
              disabled={loading}
              className="mt-6 w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-200 rounded-xl transition duration-150 flex items-center justify-center gap-2"
            >
              <TrashIcon className="w-4 h-4 text-slate-400" />
              Empty Recycle Bin
            </button>
          </div>
        </div>

        {/* Detailed Heuristics lists */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Action Recommendations</h2>
          
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <div key={rec.id} className="glass-panel rounded-xl p-5 border border-white/5 flex justify-between items-center group hover:border-white/10 transition duration-150">
                  <div className="flex gap-4 items-start min-w-0 pr-4">
                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 shrink-0 mt-0.5 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition">
                      <RecommendationIcon id={rec.id} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm">{rec.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-3">
                    <span className="text-sm font-extrabold text-blue-400 block">
                      {formatSize(rec.size)}
                    </span>
                    
                    <button
                      onClick={() => handleCleanClick(rec)}
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition duration-150 shadow-glow-blue"
                    >
                      Safe Clean
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel rounded-xl py-20 text-center text-slate-500 border border-dashed border-white/10">
                Congratulations! No cleanups needed.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && targetToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-glass-card space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Execute Deletion Target
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Are you sure you want to clean this category? This deletes corresponding items from the hard drive permanently.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">
                Target: <span className="text-white font-bold">{targetToDelete.title}</span>
              </p>
              <p className="text-slate-400 font-semibold">
                Estimated reclaimed space: <span className="text-blue-400 font-bold">{formatSize(targetToDelete.size)}</span>
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowConfirmModal(false); setTargetToDelete(null); }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeCleanup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] transition"
              >
                Confirm Safe Clean
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationIcon({ id }: { id: string }) {
  if (id === 'temp_files') {
    return <FolderIcon className="w-5 h-5" />;
  }
  if (id === 'duplicates') {
    return <LayersIcon className="w-5 h-5" />;
  }
  return <HardDrive className="w-5 h-5" />;
}
