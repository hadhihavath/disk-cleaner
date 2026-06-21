import React from 'react';
import { Play, Square, Loader2, HardDrive, AlertCircle } from 'lucide-react';
import { Drive, ScanProgress } from '../types';

interface ScannerProps {
  drives: Drive[];
  selectedDrive: Drive | null;
  onSelectDrive: (drive: Drive) => void;
  scanProgress: ScanProgress | null;
  onStartScan: () => void;
  onStopScan: () => void;
}

export default function Scanner({
  drives,
  selectedDrive,
  onSelectDrive,
  scanProgress,
  onStartScan,
  onStopScan
}: ScannerProps) {

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Estimating...';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isScanning = scanProgress?.is_scanning || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Drive Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform a local diagnostic audit on physical and external drives.
        </p>
      </div>

      {/* Main scanner view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drive selector deck */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select Target Drive</h2>
          
          <div className="space-y-3">
            {drives.map((d) => {
              const isSelected = selectedDrive?.device === d.device;
              return (
                <button
                  key={d.device}
                  disabled={isScanning}
                  onClick={() => onSelectDrive(d)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between glass-panel ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/10 shadow-glow-blue' 
                      : 'border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10'
                  } ${isScanning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Local Drive ({d.device})</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Format: {d.fstype || 'NTFS'}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300">
                      {formatSize(d.free)} free of {formatSize(d.total)}
                    </span>
                    
                    {/* Capacity bar */}
                    <div className="w-28 bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${d.percent > 90 ? 'bg-rose-500' : d.percent > 75 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                        style={{ width: `${d.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scan controller view */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          {/* Neon mesh background highlights */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
          
          {!isScanning && (!scanProgress || scanProgress.percentage === 0) && (
            <div className="text-center space-y-6 flex flex-col items-center">
              <div className="p-5 bg-blue-500/10 rounded-full text-blue-400 shadow-glow-blue border border-blue-500/20">
                <HardDrive className="w-12 h-12" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-bold text-white">Ready to Scan {selectedDrive?.device}</h3>
                <p className="text-sm text-slate-400 mt-2">
                  We'll index directories, search for duplicates, log caches, and compute file size distributions safely.
                </p>
              </div>
              
              <button
                onClick={onStartScan}
                disabled={!selectedDrive}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-glow-blue transition-all duration-300 transform active:scale-95 ${
                  !selectedDrive ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                Start Diagnostic Scan
              </button>
            </div>
          )}

          {isScanning && (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Spinning progress animation */}
              <div className="relative flex items-center justify-center w-48 h-48">
                {/* Outermost spinning glow */}
                <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-spin-slow"></div>
                {/* SVG Progress Circle */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-white/5"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-blue-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - (scanProgress?.percentage || 0) / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
                  />
                </svg>
                {/* Center Percent Info */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white">
                    {scanProgress?.percentage ? Math.floor(scanProgress.percentage) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Scanning</span>
                </div>
              </div>

              {/* Stats display */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-md p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                <div>
                  <span className="text-xs text-slate-400">Files Indexed</span>
                  <p className="text-lg font-bold text-white mt-1">
                    {scanProgress?.files_scanned.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Total Size</span>
                  <p className="text-lg font-bold text-white mt-1">
                    {formatSize(scanProgress?.bytes_scanned || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Time Left</span>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {formatTime(scanProgress?.est_remaining_seconds || 0)}
                  </p>
                </div>
              </div>

              {/* Directory crawler tracker */}
              <div className="w-full text-center space-y-1">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Crawling File System
                </span>
                <p 
                  className="text-xs text-slate-400 max-w-lg mx-auto truncate font-mono bg-black/25 px-3 py-1.5 rounded"
                  title={scanProgress?.current_folder}
                >
                  {scanProgress?.current_folder || 'Initializing walker...'}
                </p>
              </div>

              {/* Stop action button */}
              <button
                onClick={onStopScan}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              >
                <Square className="w-4 h-4 fill-rose-400 stroke-none" />
                Cancel Diagnostic Scan
              </button>
            </div>
          )}

          {/* Finished Scan summary */}
          {!isScanning && scanProgress && scanProgress.percentage === 100 && (
            <div className="text-center space-y-6 flex flex-col items-center">
              <div className="p-5 bg-emerald-500/10 rounded-full text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/20 animate-pulse">
                <ShieldCheckIcon className="w-12 h-12" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-white">Diagnostic Scan Completed!</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Drive {scanProgress.drive} has been analyzed. We found {scanProgress.files_scanned.toLocaleString()} files totaling {formatSize(scanProgress.bytes_scanned)}.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onStartScan}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  Scan Again
                </button>
                <button
                  onClick={() => onSelectDrive(selectedDrive!)} // Triggers dashboard update
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-blue hover:from-blue-500"
                >
                  View Recommendations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
