import React from 'react';
import { Upload, CheckCircle, Eye, Edit2, Mail, Trash2, Calendar, User } from 'lucide-react';
import api from '../../services/api';

export default function InternshipTable({
  isLoading, filteredInternships, getRecordStatus, calculateDuration, handleUpload,
  setPreviewItem, handleEditClick, handlePreviewCertificate, handleSendEmail,
  user, handleDeleteRecord
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-150">
          <thead className="bg-gray-50/75">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Mentor</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Project Duration</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Docs</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Management Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan="5" className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <span className="text-xs text-gray-400">Fetching database records...</span>
                  </div>
                </td>
              </tr>
            )}
            
            {!isLoading && filteredInternships.map((item) => {
              const status = getRecordStatus(item);
              return (
                <tr key={item.internship_id} className="hover:bg-indigo-50/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-xl shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.intern?.college_name || 'N/A'}</div>
                        <span className={`inline-flex text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 ${status === 'not_started' ? 'bg-slate-100 text-slate-700' : status === 'ongoing' ? 'bg-amber-100 text-amber-800' : status === 'pending' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {status === 'not_started' ? 'Not Started' : status === 'ongoing' ? 'Ongoing' : status === 'pending' ? 'Pending Signature' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-800">{item.faculty?.faculty_name || 'Not Assigned'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.faculty?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-indigo-600 leading-tight">{calculateDuration(item.start_date, item.end_date)}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                      <Calendar size={11} className="mr-1" />
                      <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col space-y-2 text-xs font-semibold">
                      <div className="flex space-x-3">
                        <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 hover:underline">
                          <Upload size={14} /><span>Report</span>
                          <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'report')} />
                        </label>
                        <label className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline">
                          <Upload size={14} /><span>Proof</span>
                          <input type="file" className="hidden" onChange={(e) => handleUpload(e, item.internship_id, 'proof')} />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.documents?.map(doc => (
                          <a key={doc.document_id} href={`${api.defaults.baseURL.replace(/\/api\/?$/, '')}/${doc.file_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-[9px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 border border-emerald-150 p-1 px-2 rounded-lg">
                            <CheckCircle size={10} className="mr-1" /><span>{doc.document_type.toUpperCase()}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setPreviewItem(item)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all" title="Preview Details"><Eye size={15} /></button>
                      <button onClick={(e) => handleEditClick(item, e)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all" title="Edit Entire Record"><Edit2 size={15} /></button>
                      {(status === 'complete' || status === 'pending' || user?.role === 'admin') && (
                        <div className="flex space-x-2">
                          <button onClick={(e) => handlePreviewCertificate(item, e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all" title="Preview Certificate"><Eye size={15} /></button>
                          <button onClick={(e) => handleSendEmail(item, e)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all" title="Email Cert to Student"><Mail size={15} /></button>
                        </div>
                      )}
                      <button onClick={(e) => handleDeleteRecord(item.internship_id, e)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all" title="Delete Record">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {!isLoading && filteredInternships.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-450 text-xs italic font-medium">No active student records found matching the selection.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}