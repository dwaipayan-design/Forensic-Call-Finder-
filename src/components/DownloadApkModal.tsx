import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  Github,
  Cloud,
  Check,
  Copy,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES } from '../lib/flutterCode';

interface DownloadApkModalProps {
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ onClose }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0087FF] flex items-center justify-center text-white font-bold text-lg shadow-md">
              APK
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Download & Build Android APK
              </h2>
              <p className="text-xs text-slate-300">
                Generate the installable <code className="text-[#0087FF] font-mono">.apk</code> file for your Android phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          {/* Why an APK needs compiling */}
          <div className="p-4 rounded-2xl bg-[#0087FF]/8 border border-[#0087FF]/20 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#0087FF] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900 text-sm mb-1">
                Step 1: Download the Complete Flutter Source Code
              </div>
              <p className="text-slate-600 leading-relaxed mb-3">
                Android APK files are compiled machine binaries created by the Flutter/Android toolchain. All necessary files (SQLite database helper, call log logic, Material 3 Truecaller UI, and permissions) are bundled and ready to build.
              </p>
              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="px-4 py-2 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isZipping ? 'Generating ZIP...' : 'Download Project ZIP (All Code Included)'}
              </button>
            </div>
          </div>

          {/* 3 Simple Ways to Build the APK */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Step 2: Choose How to Build the APK File
            </h3>

            <div className="space-y-3">
              {/* Method 1: GitHub Actions (Cloud - 0 setup) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Github className="w-4 h-4 text-slate-900" />
                    <span>Method 1: Free Cloud Build via GitHub (No Computer Setup)</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  We have included a pre-configured <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">.github/workflows/build_apk.yml</code> in your ZIP.
                </p>
                <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 pl-1">
                  <li>Create a free repository on GitHub and push/upload the unzipped files.</li>
                  <li>Click on the <strong>Actions</strong> tab in your repository.</li>
                  <li>In ~3 minutes, the build completes and gives you a direct download link for <strong>truecaller-local-release-apk.zip</strong> containing the ready-to-install <code className="font-mono text-slate-800">.apk</code>!</li>
                </ol>
              </div>

              {/* Method 2: Local Command Line */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-2">
                  <Terminal className="w-4 h-4 text-[#0087FF]" />
                  <span>Method 2: One-line Command on Your Computer</span>
                </div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  If you have Flutter installed on your computer, open your terminal inside the project folder:
                </p>

                <div className="p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs flex items-center justify-between">
                  <code>flutter build apk --release</code>
                  <button
                    onClick={() => copyToClipboard('flutter build apk --release', 'local')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                    title="Copy command"
                  >
                    {copiedCommand === 'local' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  The compiled APK will immediately be located at:
                  <br />
                  <code className="text-[#0087FF] font-mono font-medium">
                    build/app/outputs/flutter-apk/app-release.apk
                  </code>
                </p>
              </div>

              {/* Method 3: Cloud Flutter IDEs */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-2">
                  <Cloud className="w-4 h-4 text-purple-600" />
                  <span>Method 3: Cloud Web Builders (Project IDX / Codemagic)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Import the downloaded ZIP into <strong>Google Project IDX</strong> or <strong>Codemagic.io</strong> to build the APK directly in the browser and scan a QR code to install it on your device.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Audited offline APK · 0 INTERNET permissions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isZipping ? 'Downloading...' : 'Download Project Code (.zip)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
