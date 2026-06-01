import React from 'react';
import { User, Award, X, Save } from 'lucide-react';

export default function EditInternshipModal({ editingItem, setEditingItem, editForm, setEditForm, handleSaveEdit, user, settings }) {
  if (!editingItem) return null;
  
  const minStartDate = settings?.project_start_date || "2026-05-18";
  const maxProjectEndDate = settings?.project_end_date || "2026-07-31";
  const minDurationDays = parseInt(settings?.min_duration_days || "28");

  const calculateDateOffset = (dateStr, days) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  const minEndDate = calculateDateOffset(editForm.start_date, minDurationDays) || minStartDate;
  const maxEndDate = maxProjectEndDate;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-200 overflow-hidden shadow-2xl animate-scaleUp">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-amber-100 border border-white/20 px-3 py-1 rounded-full">Record Modification Studio</span>
            <h3 className="text-xl font-extrabold mt-3">Edit Record: {editingItem.intern?.intern_name}</h3>
            <p className="text-xs text-amber-100 mt-1">Make structural changes to student details or project specifications.</p>
          </div>
          <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider col-span-full border-b pb-1 flex items-center"><User size={13} className="mr-1 text-amber-600" /><span>1. Student Profile Data</span></h4>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Student Full Name *</label>
            <input type="text" value={editForm.intern_name} onChange={(e) => setEditForm({...editForm, intern_name: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Institutional Email *</label>
            <input type="email" value={editForm.intern_email} onChange={(e) => setEditForm({...editForm, intern_email: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
            <input type="text" value={editForm.intern_phone} onChange={(e) => setEditForm({...editForm, intern_phone: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">College Name</label>
            <input type="text" value={editForm.college_name} onChange={(e) => setEditForm({...editForm, college_name: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
            <input type="text" value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider col-span-full border-b pb-1 pt-2 flex items-center"><Award size={13} className="mr-1 text-amber-600" /><span>2. Project Specifications</span></h4>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Internship Work Title * <span className="text-[10px] font-normal text-gray-400">(to fit: "...carried out the internship work titled...")</span>
            </label>
            <input type="text" value={editForm.internship_title} onChange={(e) => setEditForm({...editForm, internship_title: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required />
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Technology Domain *</label><input type="text" value={editForm.internship_domain} onChange={(e) => setEditForm({...editForm, internship_domain: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required /></div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Internship Mode</label>
            <select
              value="Offline"
              disabled
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 cursor-not-allowed font-semibold text-gray-600"
            >
              <option value="Offline">Offline Only</option>
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label><input type="date" min={minStartDate} value={editForm.start_date} onChange={(e) => setEditForm({...editForm, start_date: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required /></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label><input type="date" min={minEndDate} max={maxEndDate} value={editForm.end_date} onChange={(e) => setEditForm({...editForm, end_date: e.target.value})} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" required /></div>
          <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-700 mb-1">Remarks & Details</label><textarea value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} className="w-full h-20 rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Additional student accomplishments..." /></div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Number</label>
            <input 
              type="text" 
              value={editForm.transaction_number || ''} 
              onChange={(e) => setEditForm({...editForm, transaction_number: e.target.value})} 
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" 
            />
          </div>
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-2 pt-5">
              <input 
                type="checkbox" 
                id="is_paid" 
                checked={editForm.is_paid || false} 
                onChange={(e) => setEditForm({...editForm, is_paid: e.target.checked})} 
                className="h-4 w-4 rounded border-gray-350 text-indigo-600 focus:ring-indigo-500" 
              />
              <label htmlFor="is_paid" className="text-xs font-bold text-gray-800 cursor-pointer">
                Mark as Verified Paid
              </label>
            </div>
          )}
        </div>
        <div className="bg-gray-50 border-t border-gray-150 p-5 px-6 flex justify-end space-x-3">
          <button onClick={() => setEditingItem(null)} className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer">Discard Changes</button>
          <button onClick={handleSaveEdit} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/10 transition-all cursor-pointer flex items-center space-x-1"><Save size={13} /><span>Save Modification</span></button>
        </div>
      </div>
    </div>
  );
}
