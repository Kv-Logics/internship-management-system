import React from 'react';
import { Upload, CheckCircle, Eye, Edit2, Trash2, Calendar, User, AlertTriangle, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function InternshipTable({
  isLoading, filteredInternships, getRecordStatus, calculateDuration, handleUpload,
  setPreviewItem, handleEditClick, handlePreviewCertificate,
  user, handleDeleteRecord, onEnterTxn, settings
}) {
  return (
    <div className="bg-white rounded-none border border-gray-150 shadow-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-150">
          <thead className="bg-gray-50/75">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
              {user?.role !== 'faculty' && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Mentor</th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Project Duration</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Management Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={user?.role === 'faculty' ? 3 : 4} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-none border-4 border-indigo-600 border-t-transparent"></div>
                    <span className="text-xs text-gray-400">Fetching database records...</span>
                  </div>
                </td>
              </tr>
            )}
            
            {!isLoading && filteredInternships.map((item) => {
              const status = getRecordStatus(item);
              const reportDoc = item.documents?.find(doc => doc.document_type === 'report');
              return (
                <tr key={item.internship_id} className="hover:bg-indigo-50/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-none shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.intern?.college_name || 'N/A'}</div>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`inline-flex text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider ${status === 'not_started' ? 'bg-slate-100 text-slate-700' : status === 'ongoing' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {status === 'not_started' ? 'Not Started' : status === 'ongoing' ? 'Ongoing' : 'Completed'}
                          </span>
                          
                          {/* Payment status badge */}
                          {item.is_paid ? (
                            <span className="inline-flex text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider bg-emerald-50 text-emerald-750 border border-emerald-150">
                              Paid
                            </span>
                          ) : item.transaction_number ? (
                            <span className="inline-flex text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider bg-amber-50 text-amber-750 border border-amber-150">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex text-[9px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider bg-rose-50 text-rose-750 border border-rose-150">
                              Unpaid
                            </span>
                          )}
                        </div>

                        {/* Transaction display or entry button for faculty */}
                        {!item.is_paid && user?.role === 'faculty' && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEnterTxn(item);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-none text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <span>{item.transaction_number ? 'Edit Txn Ref' : 'Enter Txn ID'}</span>
                            </button>
                          </div>
                        )}

                        {/* Decline Reason Display */}
                        {item.remarks && item.remarks.includes("Payment Declined:") && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 p-1.5 px-2 rounded-none mt-2 leading-relaxed flex items-start max-w-[240px] whitespace-normal">
                            <AlertTriangle size={12} className="mr-1 mt-0.5 shrink-0 text-rose-600" />
                            <span><span className="font-extrabold text-rose-800 mr-1">Declined:</span>{item.remarks.replace("Payment Declined:", "").trim()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {user?.role !== 'faculty' && (
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{item.faculty?.faculty_name || 'Not Assigned'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.faculty?.email || 'N/A'}</div>
                    </td>
                  )}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-indigo-600 leading-tight">{calculateDuration(item.start_date, item.end_date)}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                      <Calendar size={11} className="mr-1" />
                      <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setPreviewItem(item)} className="p-1.5 text-gray-550 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-none transition-all" title="Preview Details"><Eye size={15} /></button>
                      {(user?.role !== 'faculty' || settings?.allow_faculty_edit !== 'false') && (
                        <button onClick={(e) => handleEditClick(item, e)} className="p-1.5 text-gray-550 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-none transition-all" title="Edit Entire Record"><Edit2 size={15} /></button>
                      )}
                      
                      {/* Report Action Button */}
                            <div className="flex items-center space-x-1.5">
                              {reportDoc && (
                                <a
                                  href={`${api.defaults.baseURL?.replace('/api', '')}/${reportDoc.file_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-emerald-655 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-none transition-all"
                                  title="Download/View Report"
                                >
                                  <CheckCircle size={15} />
                                </a>
                              )}
                              <label className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-100 rounded-none transition-all cursor-pointer" title={reportDoc ? "Re-upload Report" : "Upload Report"}>
                                <Upload size={15} />
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => handleUpload(e, item.internship_id, 'report')}
                                />
                              </label>
                            </div>

                        {(status === 'complete' || user?.role === 'admin') && user?.role !== 'faculty' && (
                          <button onClick={(e) => handlePreviewCertificate(item, e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-none transition-all" title="Preview Certificate"><Eye size={15} /></button>
                        )}
                      
                      <button onClick={(e) => handleDeleteRecord(item.internship_id, e)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-none transition-all" title="Delete Record">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {!isLoading && filteredInternships.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'faculty' ? 3 : 4} className="text-center py-12 text-gray-450 text-xs italic font-medium">No active student records found matching the selection.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
