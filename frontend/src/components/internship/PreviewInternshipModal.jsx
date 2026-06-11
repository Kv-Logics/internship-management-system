import React from 'react';
import { GraduationCap, Mail, Phone, BookOpen, Clock, Calendar, CheckCircle2, X, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PreviewInternshipModal({ previewItem, setPreviewItem, calculateDuration, getRecordStatus, handlePreviewCertificate, user, onEnterTxn }) {
  if (!previewItem) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-none w-full max-w-2xl border border-gray-200 overflow-hidden shadow-none animate-scaleUp">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-none">Internship Profile Registry</span>
            <h3 className="text-xl font-extrabold mt-3">{previewItem.intern?.intern_name}</h3>
            <p className="text-xs text-indigo-200 mt-1 flex items-center"><GraduationCap size={12} className="mr-1" /> {previewItem.intern?.college_name} • {previewItem.intern?.department}</p>
          </div>
          <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-white/10 rounded-none text-white/80 hover:text-white transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-indigo-50/50 rounded-none p-4 border border-indigo-100 flex items-center justify-between">
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
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-none border border-gray-200">
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</span><p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.start_date).toLocaleDateString()}</p></div>
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">End Date</span><p className="text-xs font-bold mt-1 text-gray-700">{new Date(previewItem.end_date).toLocaleDateString()}</p></div>
              <div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Duration</span><p className="text-xs font-extrabold mt-1 text-indigo-600">{calculateDuration(previewItem.start_date, previewItem.end_date)}</p></div>
            </div>
          </div>
          <div className="border-t border-gray-150 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</h4>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-none flex flex-col space-y-3">
              <div className="flex items-center space-x-8">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
                  {previewItem.is_paid ? (
                    <span className="inline-flex text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 p-1 px-2.5 rounded-none mt-1">Verified Paid</span>
                  ) : previewItem.transaction_number ? (
                    <span className="inline-flex text-xs font-bold text-amber-700 bg-amber-50 border border-amber-150 p-1 px-2.5 rounded-none mt-1">Verification Pending</span>
                  ) : (
                    <span className="inline-flex text-xs font-bold text-rose-700 bg-rose-50 border border-rose-150 p-1 px-2.5 rounded-none mt-1">Unpaid</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Transaction Number</span>
                  <p className="text-xs font-mono font-bold mt-1 text-gray-700">
                    {previewItem.transaction_number || <span className="italic text-gray-450 font-normal">None Entered</span>}
                  </p>
                </div>
                {!previewItem.is_paid && user?.role === 'faculty' && (
                  <div className="flex-1 text-right">
                    <button
                      onClick={() => onEnterTxn(previewItem)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-none text-xs font-bold transition-all cursor-pointer"
                    >
                      {previewItem.transaction_number ? 'Edit Txn Ref' : 'Enter Transaction ID'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Highlight decline reason explicitly under payments */}
              {previewItem.remarks && previewItem.remarks.includes("Payment Declined:") && (
                <div className="border-t border-rose-100 pt-3 mt-1 flex items-start text-xs text-rose-700 bg-rose-50/50 p-2.5 rounded-none border border-rose-100">
                  <span className="font-extrabold mr-1 text-rose-800">Decline Reason:</span>
                  <span className="font-semibold text-rose-700">{previewItem.remarks.replace("Payment Declined:", "").trim()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Internship Report Section */}
          <div className="border-t border-gray-150 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Internship Report</h4>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-none gap-4">
              <div className="flex items-center space-x-3">
                {previewItem.documents?.some(doc => doc.document_type === 'report') ? (
                  <>
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Report Stored on Server</span>
                      <a
                        href={`${api.defaults.baseURL?.replace('/api', '')}/${previewItem.documents?.find(doc => doc.document_type === 'report')?.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline mt-0.5 block"
                      >
                        Download/View Report File
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="text-rose-500" size={20} />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">No Report Uploaded</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Please upload the official internship report.</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-none text-xs font-bold shadow-none cursor-pointer transition-all flex items-center space-x-1.5">
                  <span>Upload Report</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('document_type', 'report');
                      const loadId = toast.loading('Uploading internship report...');
                      try {
                        await api.post(`/documents/upload/${previewItem.internship_id}`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        toast.success('Internship report uploaded successfully!', { id: loadId });
                        if (typeof window !== 'undefined') window.location.reload();
                      } catch (err) {
                        toast.error('Upload failed. Please try again.', { id: loadId });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          {previewItem.remarks && (
            <div className="border-t border-gray-150 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administrative Remarks</h4>
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-none p-3.5 italic leading-relaxed">"{previewItem.remarks}"</p>
            </div>
          )}
        </div>
        <div className="bg-gray-50 border-t border-gray-150 p-5 px-6 flex justify-between items-center space-x-3">
          <div>
            {(getRecordStatus(previewItem) === 'complete' || getRecordStatus(previewItem) === 'pending' || user?.role === 'admin') && user?.role !== 'faculty' && (
              <button onClick={(e) => handlePreviewCertificate(previewItem, e)} className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"><Eye size={14} /><span>Preview Cert</span></button>
            )}
          </div>
          <button onClick={() => setPreviewItem(null)} className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-none text-xs font-bold text-gray-700 transition-all cursor-pointer">Close Registry</button>
        </div>
      </div>
    </div>
  );
}
