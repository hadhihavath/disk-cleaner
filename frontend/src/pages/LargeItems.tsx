import React, { useEffect, useState } from 'react';
import { Search, Folder, File, Copy, Trash2, ArrowUpDown, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { FileItem, FolderItem } from '../types';

export default function LargeItems() {
  const [activeTab, setActiveTab] = useState<'files' | 'folders'>('files');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('size');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Deletion modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<FileItem | null>(null);
  
  // Alert banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchItems = async () => {
    try {
      if (activeTab === 'files') {
        const data = await api.getLargeFiles();
        setFiles(data);
      } else {
        const data = await api.getLargeFolders();
        setFolders(data);
      }
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

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

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setAlert({ type: 'success', message: 'Path copied to clipboard!' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteClick = (file: FileItem) => {
    setSelectedFileToDelete(file);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedFileToDelete) return;
    try {
      const results = await api.deleteFiles([selectedFileToDelete.path]);
      const res = results[0];
      if (res.status === 'SUCCESS') {
        setAlert({ 
          type: 'success', 
          message: `Successfully deleted ${selectedFileToDelete.name}. Reclaimed ${formatSize(res.bytes_reclaimed)}.` 
        });
        // Remove from local list
        setFiles(files.filter(f => f.path !== selectedFileToDelete.path));
      } else {
        setAlert({ type: 'error', message: res.error || 'Failed to delete file' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', message: e.message || 'Error occurred during deletion' });
    } finally {
      setShowConfirmModal(false);
      setSelectedFileToDelete(null);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Sorting handler
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Process sorting & searching for files
  const filteredFiles = files
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'mtime') {
        comparison = a.mtime - b.mtime;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

  // Process searching for folders
  const filteredFolders = folders
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path.toLowerCase().includes(searchQuery.toLowerCase()));

  // Paged lists
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Large Storage Items
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pinpoint and inspect the space-consuming structures on your local storage.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { setActiveTab('files'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition duration-200 ${
            activeTab === 'files' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Large Files
        </button>
        <button
          onClick={() => { setActiveTab('folders'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition duration-200 ${
            activeTab === 'folders' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Large Folders
        </button>
      </div>

      {/* Alert display */}
      {alert && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertIcon type={alert.type} />
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'files' ? "Search files by name or path..." : "Search folders..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition duration-150"
          />
        </div>
      </div>

      {/* Results View */}
      {activeTab === 'files' ? (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold">
                    <th className="p-4 cursor-pointer hover:text-white transition select-none" onClick={() => handleSort('name')}>
                      File Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-4">Full Path</th>
                    <th className="p-4">Extension</th>
                    <th className="p-4 cursor-pointer hover:text-white transition select-none" onClick={() => handleSort('size')}>
                      Size <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-4 cursor-pointer hover:text-white transition select-none" onClick={() => handleSort('mtime')}>
                      Last Modified <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedFiles.length > 0 ? (
                    paginatedFiles.map((file) => (
                      <tr key={file.path} className="hover:bg-white/5 transition duration-150">
                        <td className="p-4 font-semibold text-white flex items-center gap-2 max-w-[200px] truncate">
                          <File className="w-4 h-4 text-blue-400 shrink-0" />
                          <span title={file.name}>{file.name}</span>
                        </td>
                        <td className="p-4 text-slate-400 max-w-[300px] truncate font-mono text-xs" title={file.path}>
                          {file.path}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-white/10 rounded uppercase text-[10px] font-bold text-slate-300">
                            {file.ext || 'None'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">
                          {formatSize(file.size)}
                        </td>
                        <td className="p-4 text-slate-400 text-xs">
                          {formatDate(file.mtime)}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyPath(file.path)}
                            title="Copy Path"
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(file)}
                            title="Delete permanently"
                            className="p-1.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition border border-transparent hover:border-rose-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500">
                        {files.length === 0 ? "No scan metrics loaded. Run a system scan first." : "No matching files found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2 py-1">
              <span className="text-xs text-slate-400 font-medium">
                Page {currentPage} of {totalPages} ({filteredFiles.length} files found)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Folders View */
        <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-semibold">
                  <th className="p-4">Folder Name</th>
                  <th className="p-4">Full Path</th>
                  <th className="p-4 text-right">Size</th>
                  <th className="p-4 text-right">Percentage of Drive</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFolders.length > 0 ? (
                  filteredFolders.map((folder) => (
                    <tr key={folder.path} className="hover:bg-white/5 transition duration-150">
                      <td className="p-4 font-semibold text-white flex items-center gap-2 max-w-[200px] truncate">
                        <Folder className="w-4 h-4 text-violet-400 shrink-0" />
                        <span title={folder.name}>{folder.name}</span>
                      </td>
                      <td className="p-4 text-slate-400 max-w-[400px] truncate font-mono text-xs" title={folder.path}>
                        {folder.path}
                      </td>
                      <td className="p-4 font-bold text-white text-right">
                        {formatSize(folder.size)}
                      </td>
                      <td className="p-4 text-slate-400 text-xs text-right font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${folder.percentage}%` }}></div>
                          </div>
                          <span>{folder.percentage.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyPath(folder.path)}
                          title="Copy Path"
                          className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      {folders.length === 0 ? "No scan metrics loaded. Run a system scan first." : "No matching folders found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedFileToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-glass-card space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Confirm Safe Delete
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                You are about to permanently delete a file. This action cannot be undone.
              </p>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <p className="text-xs text-white font-semibold truncate" title={selectedFileToDelete.name}>
                Name: {selectedFileToDelete.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono" title={selectedFileToDelete.path}>
                Path: {selectedFileToDelete.path}
              </p>
              <p className="text-xs text-rose-400 font-bold">
                Reclaim Size: {formatSize(selectedFileToDelete.size)}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowConfirmModal(false); setSelectedFileToDelete(null); }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] transition"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertIcon({ type }: { type: 'success' | 'error' }) {
  if (type === 'success') {
    return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
  }
  return <AlertCircle className="w-5 h-5 text-rose-400" />;
}
