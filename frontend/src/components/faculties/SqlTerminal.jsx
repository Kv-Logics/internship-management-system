import React from 'react';
import { UserCheck, AlertCircle, RefreshCw, Play, CheckCircle2, Database, Columns, HelpCircle } from 'lucide-react';

export default function SqlTerminal({ sqlQuery, setSqlQuery, handleExecuteQuery, executingQuery, queryError, queryResult, dbSchema }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
      
      {/* Main SQL Console Panel */}
      <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold font-mono text-slate-400 ml-2">postgresql_engine@nitt.local</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full flex items-center">
            <UserCheck size={12} className="mr-1 animate-pulse" />
            <span>Root Administrator</span>
          </span>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold text-slate-400">Write SQL Statement</label>
          <div className="relative">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full h-36 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-sm text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 leading-relaxed shadow-inner"
              placeholder="SELECT * FROM internships;"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 leading-snug max-w-md">
            <AlertCircle size={12} className="inline mr-1 text-amber-500" />
            <strong className="text-amber-500">Warning:</strong> Executing raw SQL statements bypassed standard application models and applies changes instantly inside the PostgreSQL records.
          </p>
          <button onClick={handleExecuteQuery} disabled={executingQuery} className="flex items-center space-x-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-650/10 cursor-pointer">
            {executingQuery ? (<><RefreshCw size={14} className="animate-spin" /><span>Processing...</span></>) : (<><Play size={14} fill="white" /><span>Execute SQL</span></>)}
          </button>
        </div>

        {queryError && (
          <div className="bg-rose-950/40 border border-rose-900 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 font-mono text-xs animate-shake">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-1">SQL Compilation / Execution Error</strong>
              <span>{queryError}</span>
            </div>
          </div>
        )}

        {queryResult && (
          <div className="space-y-3 pt-4 border-t border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 flex items-center">
                <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" />
                <span>Query Results Output ({queryResult.type === 'select' ? `${queryResult.rows.length} rows returned` : `Mutation finished`})</span>
              </h4>
            </div>
            {queryResult.type === 'select' ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden w-full">
                <div className="max-h-[600px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-xs font-mono"><thead className="bg-slate-900"><tr>{queryResult.columns.map((col, idx) => (<th key={idx} className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 whitespace-nowrap">{col}</th>))}</tr></thead><tbody className="divide-y divide-slate-800/50">{queryResult.rows.length > 0 ? (queryResult.rows.map((row, rowIdx) => (<tr key={rowIdx} className="hover:bg-slate-900/50 transition-colors">{queryResult.columns.map((col, colIdx) => (<td key={colIdx} className="px-6 py-3.5 text-slate-300 whitespace-nowrap" title={String(row[col])}>{row[col] !== null ? String(row[col]) : <em className="text-slate-600">null</em>}</td>))}</tr>))) : (<tr><td colSpan={queryResult.columns.length} className="text-center py-8 text-slate-500 italic">Result set is empty.</td></tr>)}</tbody></table>
                </div>
              </div>
            ) : (<div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-indigo-300"><span className="text-slate-500 mr-2">$</span><span>Database Mutation Statement complete. Rows affected: </span><strong className="text-indigo-400 font-bold">{queryResult.rowcount}</strong></div>)}
          </div>
        )}
      </div>

      {/* Database Schema Navigator Sidebar */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-5 lg:col-span-1 h-fit">
        <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
          <Database className="text-indigo-600" size={18} />
          <div>
            <h4 className="text-sm font-bold text-gray-800">Schema Schema</h4>
            <p className="text-[10px] text-gray-400 font-medium">Core PostgreSQL Tables</p>
          </div>
        </div>
        <div className="space-y-4">
          {dbSchema.map((table, idx) => (
            <div key={idx} className="space-y-2 bg-gray-50/50 border border-gray-150 p-3.5 rounded-2xl"><div className="flex items-center justify-between"><span onClick={() => setSqlQuery(`SELECT * FROM ${table.name} LIMIT 10;`)} className="text-xs font-mono font-bold text-indigo-650 hover:underline cursor-pointer flex items-center" title="Generate quick query"><span>{table.name}</span></span><Columns size={12} className="text-gray-400" /></div><p className="text-[10px] text-gray-400 italic leading-snug">{table.description}</p><div className="pt-2 border-t border-gray-200/50 space-y-1">{table.columns.map((col, cidx) => (<div key={cidx} className="text-[10px] font-mono text-gray-500 flex items-center"><span className="w-1 h-1 bg-indigo-500 rounded-full mr-1.5"></span><span>{col}</span></div>))}</div></div>
          ))}
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-[10px] text-indigo-700 leading-relaxed font-semibold"><HelpCircle size={14} className="inline mr-1 text-indigo-600 shrink-0" /><span>Click on any blue table name to auto-populate the terminal with a quick preview query!</span></div>
      </div>
    </div>
  );
}