import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Play,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Plus,
  Flame,
  Check,
  X
} from 'lucide-react';
import { ManualOverride } from '../types';
import { LocalSqliteStorage } from '../lib/storage';

interface SQLiteInspectorProps {
  shadowOverrides: Record<string, ManualOverride>;
  onRefresh: () => void;
  onEditNumber: (number: string) => void;
}

export const SQLiteInspector: React.FC<SQLiteInspectorProps> = ({
  shadowOverrides,
  onRefresh,
  onEditNumber,
}) => {
  const [queryInput, setQueryInput] = useState<string>('SELECT * FROM settings;');
  const [queryOutput, setQueryOutput] = useState<{
    success: boolean;
    rows?: any[];
    message: string;
  } | null>(null);

  const [newNumber, setNewNumber] = useState('');
  const [newIsBusy, setNewIsBusy] = useState(false);
  const [newTalkingTo, setNewTalkingTo] = useState('');
  const [newIsVerified, setNewIsVerified] = useState(true);
  const [showAddRow, setShowAddRow] = useState(false);

  const rows = Object.values(shadowOverrides);
  const busyCount = rows.filter((r) => r.is_busy).length;
  const verifiedCount = rows.filter((r) => r.is_verified).length;

  const runSql = (customQuery?: string) => {
    const q = customQuery || queryInput;
    const res = LocalSqliteStorage.executeSql(q);
    setQueryOutput(res);
    onRefresh();
  };

  const handleInsertRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    LocalSqliteStorage.saveSetting({
      number: newNumber.trim(),
      is_busy: newIsBusy,
      talking_to: newIsBusy ? newTalkingTo.trim() : '',
      is_verified: newIsVerified,
      updated_at: Date.now(),
    });

    setNewNumber('');
    setNewTalkingTo('');
    setNewIsBusy(false);
    setShowAddRow(false);
    onRefresh();
  };

  const handleDelete = (number: string) => {
    LocalSqliteStorage.deleteSetting(number);
    onRefresh();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">SQLite Shadow Database</h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Database: true_local_shadow.db · Table: settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddRow(!showAddRow)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh database view"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Database Schema Stats */}
      <div className="px-4 py-2.5 bg-white/70 border-b border-slate-200/60 flex items-center gap-4 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="font-semibold text-slate-900">{rows.length}</span> Total Overrides
        </div>
        <div className="flex items-center gap-1.5 text-[#EB3349]">
          <Flame className="w-3.5 h-3.5" />
          <span className="font-semibold">{busyCount}</span> Busy ("In a call")
        </div>
        <div className="flex items-center gap-1.5 text-[#0087FF]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold">{verifiedCount}</span> Verified Badges
        </div>
      </div>

      {/* Form to insert row directly into SQLite */}
      {showAddRow && (
        <form
          onSubmit={handleInsertRow}
          className="m-4 p-4 bg-white rounded-2xl border border-purple-200 shadow-sm space-y-3 animate-in fade-in duration-150 shrink-0"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Direct SQLite INSERT Into `settings`
            </span>
            <button
              type="button"
              onClick={() => setShowAddRow(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                number (TEXT PRIMARY KEY)
              </label>
              <input
                type="text"
                required
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="+1 415 234 5678"
                className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                talking_to (TEXT)
              </label>
              <input
                type="text"
                value={newTalkingTo}
                onChange={(e) => setNewTalkingTo(e.target.value)}
                placeholder="CEO / Mom / Team"
                disabled={!newIsBusy}
                className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newIsBusy}
                onChange={(e) => setNewIsBusy(e.target.checked)}
                className="rounded text-[#EB3349] focus:ring-[#EB3349]"
              />
              is_busy (1 / 0)
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newIsVerified}
                onChange={(e) => setNewIsVerified(e.target.checked)}
                className="rounded text-[#0087FF] focus:ring-[#0087FF]"
              />
              is_verified (1 / 0)
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Check className="w-3.5 h-3.5" />
            Commit INSERT
          </button>
        </form>
      )}

      {/* SQL Query Console */}
      <div className="mx-4 mt-3 bg-slate-900 rounded-2xl p-3 text-white font-mono text-xs shadow-md shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Interactive SQL Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQueryInput('SELECT * FROM settings WHERE is_busy = 1;');
                runSql('SELECT * FROM settings WHERE is_busy = 1;');
              }}
              className="text-[10px] text-purple-300 hover:underline"
            >
              Filter Busy
            </button>
            <button
              onClick={() => {
                setQueryInput('SELECT * FROM settings WHERE is_verified = 1;');
                runSql('SELECT * FROM settings WHERE is_verified = 1;');
              }}
              className="text-[10px] text-purple-300 hover:underline"
            >
              Filter Verified
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold select-none">&gt;</span>
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSql();
            }}
            placeholder="SELECT * FROM settings;"
            className="flex-1 bg-transparent border-none text-emerald-300 font-mono focus:outline-none text-xs"
          />
          <button
            onClick={() => runSql()}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-sans font-semibold flex items-center gap-1 transition"
          >
            <Play className="w-3 h-3 fill-current" /> Run
          </button>
        </div>

        {queryOutput && (
          <div
            className={`mt-2 pt-2 border-t border-slate-800 text-[11px] ${
              queryOutput.success ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {queryOutput.message}
          </div>
        )}
      </div>

      {/* Table Data View */}
      <div className="flex-1 overflow-auto m-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3">number</th>
              <th className="p-3">is_busy</th>
              <th className="p-3">talking_to</th>
              <th className="p-3">is_verified</th>
              <th className="p-3">custom_name</th>
              <th className="p-3 text-right">actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 font-sans">
                  No records in table `settings`. Use Profile Editor to add manual overrides.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.number} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">{r.number}</td>
                  <td className="p-3">
                    {r.is_busy ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-[#EB3349]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EB3349]" /> 1 (BUSY)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 0 (FREE)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 font-sans">
                    {r.talking_to ? (
                      <span className="font-semibold text-slate-800">{r.talking_to}</span>
                    ) : (
                      <span className="text-slate-300 italic">NULL</span>
                    )}
                  </td>
                  <td className="p-3">
                    {r.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[#0087FF] font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 1 (YES)
                      </span>
                    ) : (
                      <span className="text-slate-400">0 (NO)</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 font-sans">
                    {r.custom_name || <span className="text-slate-300 italic">NULL</span>}
                  </td>
                  <td className="p-3 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditNumber(r.number)}
                        className="px-2 py-1 text-[11px] font-semibold text-[#0087FF] hover:bg-[#0087FF]/10 rounded transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.number)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Delete from SQLite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
