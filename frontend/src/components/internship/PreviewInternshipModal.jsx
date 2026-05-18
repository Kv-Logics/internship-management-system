import React from 'react';
import { GraduationCap, Mail, Phone, BookOpen, Clock, Calendar, CheckCircle2, X, Eye } from 'lucide-react';
import api from '../../services/api';

export default function PreviewInternshipModal({ previewItem, setPreviewItem, calculateDuration, getRecordStatus, handlePreviewCertificate, user }) {
  if (!previewItem) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-200 overflow-hidden shadow-2xl animate-scaleUp">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">Internship Profile Registry</span>
            <h3 className="text-xl font-extrabold mt-3">{previewItem.intern?.intern_name}</h3>
            <p className="text-xs text-indigo-200 mt-1 flex items-center"><GraduationCap size={12} className="mr-1" /> {previewItem.intern?.college_name} • {previewItem.intern?.department}</p>
          </div>
          <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide block">Assigned Faculty Mentor</span>
              <strong className="text-sm text-indigo-950 font-bold">{previewItem.faculty?.faculty_name || 'Not Assigned'}</strong>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide block">Contact Email</span>
              <span className="text-xs text-indigo-900 font-semibold">{previewItem.faculty?.email || 'N/A'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Student Particulars</h4>
              <div className="space-y-2 text-xs font-medium text-gray-700">
                <p className="flex items-center"><Mail size={13} className="mr-2 text-gray-400" /> {previewItem.intern?.email}</p>
                <p className="flex items-center"><Phone size={13} className="mr-2 text-gray-400" /> {previewItem.intern?.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Project Particulars</h4>
              <div className="space-y-2 text-xs font-medium text-gray-700">
                <p className="font-bold text-gray-800 leading-snug">{previewItem.internship_title}</p>
                <p className="flex items-center mt-1"><BookOpen size={13} className="mr-2 text-gray-400" /> Domain: {previewItem.internship_domain}</p>
                <p className="flex items-center"><Clock size={13} className="mr-2 text-gray-400" /> Mode: {previewItem.internship_mode || 'Hybrid'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-150 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mentorship Timeline</h4>
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</span><p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.start_date).toLocaleDateString()}</p></div>
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</span><p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.end_date).toLocaleDateString()}</p></div>
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Duration</span><p className="text-xs font-extrabold mt-1 text-indigo-600">{calculateDuration(previewItem.start_date, previewItem.end_date)}</p></div>
            </div>
          </div>
          <div className="border-t border-gray-150 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uploaded Verification Documents</h4>
            <div className="flex flex-wrap gap-2">
              {previewItem.documents && previewItem.documents.length > 0 ? (
                previewItem.documents.map((doc) => (
                  <a key={doc.document_id} href={`${api.defaults.baseURL.replace(/\/api\/?$/, '')}/${doc.file_path}`} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all"><CheckCircle2 size={13} /><span>{doc.document_type.toUpperCase()} PDF</span></a>
                ))
              ) : ( <p className="text-xs italic text-gray-400 font-medium">No files uploaded yet.</p> )}
            </div>
          </div>
          {previewItem.remarks && (
            <div className="border-t border-gray-150 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administrative Remarks</h4>
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 italic leading-relaxed">"{previewItem.remarks}"</p>
            </div>
          )}
        </div>
        <div className="bg-gray-50 border-t border-gray-150 p-5 px-6 flex justify-between items-center space-x-3">
          <div>
            {(getRecordStatus(previewItem) === 'complete' || getRecordStatus(previewItem) === 'pending' || user?.role === 'admin') && (
              <button onClick={(e) => handlePreviewCertificate(previewItem, e)} className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"><Eye size={14} /><span>Preview Cert</span></button>
            )}
          </div>
          <button onClick={() => setPreviewItem(null)} className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer">Close Registry</button>
        </div>
      </div>
    </div>
  );
}