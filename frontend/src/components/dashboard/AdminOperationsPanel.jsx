import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function AdminOperationsPanel() {
  return (
    <div className="bg-white rounded-none p-8 border border-gray-200 shadow-none relative overflow-hidden">
      
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-gray-900">Database Systems & Control Operations</h3>
            <p className="text-xs text-gray-500 mt-1">Real-time diagnostics and structural configurations for your PostgreSQL database.</p>
          </div>
          <Link href="/faculties" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-none shadow-none transition-all flex items-center space-x-1">
            <span>Manage Faculty Database</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-gray-100">
          <div className="bg-gray-50 border border-gray-100 rounded-none p-5 space-y-2 shadow-none transition hover:shadow-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Migration Engine</span>
            <h4 className="text-sm font-bold text-gray-800">SQL Database Schema</h4>
            <p className="text-xs text-gray-600 leading-relaxed">FastAPI Lifespan migrations are fully active. Structural columns and retrofitting backfills successfully synchronized.</p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-none mr-1.5 animate-pulse"></span>
              <span>Operational & Healthy</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-none p-5 space-y-2 shadow-none transition hover:shadow-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Enforcement Rules</span>
            <h4 className="text-sm font-bold text-gray-800">Global Student Cap</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Maximum of 5 interns per faculty mentor strictly governed. Frontend elements and direct routing guards activated.</p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-none mr-1.5 animate-pulse"></span>
              <span>Limits Enforced</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-none p-5 space-y-2 shadow-none transition hover:shadow-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Security Privileges</span>
            <h4 className="text-sm font-bold text-gray-800">Administrator Override</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Full global access authorization enabled. Bypasses individual faculty scopes to grant complete DB management rights.</p>
            <div className="pt-2 text-xs font-semibold text-amber-600 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-none mr-1.5 animate-pulse"></span>
              <span>Override Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
