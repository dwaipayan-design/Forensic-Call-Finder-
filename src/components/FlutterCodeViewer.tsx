import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FolderTree,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES } from '../lib/flutterCode';
import { FlutterCodeFile } from '../types';
import { DownloadApkModal } from './DownloadApkModal';

interface FlutterCodeViewerProps {
  onOpenApkModal?: () => void;
}

export const FlutterCodeViewer: React.FC<FlutterCodeViewerProps> = ({ onOpenApkModal }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterCodeFile>(FLUTTER_PROJECT_FILES[2]); // Default to main.dart
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showInternalApkModal, setShowInternalApkModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      FLUTTER_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.code);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'truecaller_local_flutter_project.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0087FF]/20 text-[#0087FF] flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Flutter Dart & Android Source Code
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                100% Offline
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Material 3 · SQLite Shadow Database (`sqflite`) · CallLog SDK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onOpenApkModal) {
                onOpenApkModal();
              } else {
                setShowInternalApkModal(true);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download / Build APK</span>
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="px-3 py-1.5 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isZipping ? 'Zipping...' : 'Project ZIP'}
          </button>
        </div>
      </div>

      {/* Offline Verification Callout */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Strict Privacy: <strong className="text-slate-200">Zero INTERNET Permissions</strong> in AndroidManifest.xml.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          File: {selectedFile.path}
        </span>
      </div>

      {/* Main Workspace: File Tree on left, Code on right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* File Navigator */}
        <div className="w-full md:w-60 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-2 overflow-y-auto shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 flex items-center gap-1.5">
            <FolderTree className="w-3 h-3" />
            Project Files
          </div>
          <div className="space-y-0.5 mt-1">
            {FLUTTER_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#0087FF]/20 text-[#0087FF] font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] uppercase text-slate-600 font-sans">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* File Action Bar */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400 font-sans truncate">
              {selectedFile.description}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadFile}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Download single file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed selection:bg-[#0087FF]/40">
            <pre className="tab-2">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {showInternalApkModal && (
        <DownloadApkModal onClose={() => setShowInternalApkModal(false)} />
      )}
    </div>
  );
};
