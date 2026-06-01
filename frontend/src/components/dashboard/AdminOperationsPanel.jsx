import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function AdminOperationsPanel() {
  return (
    <div className="bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-900 rounded-3xl p-8 text-white border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mb-32"></div>
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Database Systems & Control Operations</h3>
            <p className="text-xs text-indigo-300 mt-1">Real-time diagnostics and structural configurations for your PostgreSQL database.</p>
          </div>
          <Link href="/faculties" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1">
            <span>Manage Faculty Database</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Migration Engine</span>
            <h4 className="text-sm font-bold">SQL Database Schema</h4>
            <p className="text-xs text-slate-300 leading-relaxed">FastAPI Lifespan migrations are fully active. Structural columns and retrofitting backfills successfully synchronized.</p>
            <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
              <span>Operational & Healthy</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Enforcement Rules</span>
            <h4 className="text-sm font-bold">Global Student Cap</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Maximum of 5 interns per faculty mentor strictly governed. Frontend elements and direct routing guards activated.</p>
            <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
              <span>Limits Enforced</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Security Privileges</span>
            <h4 className="text-sm font-bold">Administrator Override</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Full global access authorization enabled. Bypasses individual faculty scopes to grant complete DB management rights.</p>
            <div className="pt-2 text-xs font-semibold text-pink-400 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-1.5 animate-pulse"></span>
              <span>Override Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
