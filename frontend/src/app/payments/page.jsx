'use client';
import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, Search, CheckCircle2, AlertCircle, ShieldAlert,
  Send, RefreshCw, User, Calendar, BookOpen, Clock, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../providers';
import TransactionInputModal from '../../components/internship/TransactionInputModal';

export default function PaymentsPortal() {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'paid' | 'unpaid'

  // Modal State
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnTargetItem, setTxnTargetItem] = useState(null);

  // Fetch all internships once
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['internships', 'all'],
    queryFn: async () => (await api.get('/internships/')).data,
  });

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: ['internships'] });
  };

  const handleEnterTxn = (item) => {
    setTxnTargetItem(item);
    setTxnModalOpen(true);
  };

  const handleSaveTxn = async (txn, options = {}) => {
    if (!txnTargetItem) return;
    const isAdmin = user?.role === 'admin';
    const isDecline = options.isDecline;
    
    const loadId = toast.loading(
      isDecline 
        ? "Declining payment verification..." 
        : (isAdmin ? "Verifying and marking payment as paid..." : "Submitting transaction number...")
    );
    try {
      const payload = {
        internship_title: txnTargetItem.internship_title,
        start_date: txnTargetItem.start_date,
        end_date: txnTargetItem.end_date,
        transaction_number: isDecline ? null : txn,
        is_paid: isDecline ? false : (isAdmin ? true : txnTargetItem.is_paid),
      };
      
      if (isDecline && options.remarks) {
        payload.remarks = options.remarks;
      } else if (!isDecline) {
        // Clear old decline remarks on new submission
        payload.remarks = '';
      }
      
      await api.put(`/internships/${txnTargetItem.internship_id}`, payload);
      toast.success(
        isDecline 
          ? "Payment verification declined." 
          : (isAdmin ? "Payment verified successfully!" : "Transaction number submitted for verification!"), 
        { id: loadId }
      );
      setTxnModalOpen(false);
      refreshList();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to process payment update", { id: loadId });
    }
  };

  // Local filtering based on tabs
  const filtered = internships.filter(item => {
    // Search filter
    const matchesSearch = 
      item.intern?.intern_name.toLowerCase().includes(search.toLowerCase()) ||
      item.internship_title.toLowerCase().includes(search.toLowerCase()) ||
      (item.faculty?.faculty_name || '').toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return item.transaction_number && !item.is_paid;
    } else if (activeTab === 'paid') {
      return item.is_paid;
    } else {
      return !item.transaction_number && !item.is_paid;
    }
  });

  const getCounts = () => {
    const pending = internships.filter(item => item.transaction_number && !item.is_paid).length;
    const paid = internships.filter(item => item.is_paid).length;
    const unpaid = internships.filter(item => !item.transaction_number && !item.is_paid).length;
    return { pending, paid, unpaid };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-850 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Payments Portal</h2>
          <p className="text-xs text-indigo-200 mt-1">
            {user?.role === 'admin' 
              ? 'Verify transaction references submitted by faculty mentors to approve credential issuance.'
              : 'Submit payment transaction codes for validation and track billing status of student mentorships.'
            }
          </p>
        </div>
        <div className="z-10">
          <button 
            onClick={refreshList} 
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold tracking-wider transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Payments</span>
          </button>
        </div>
      </div>

      {/* Search and Tab Selector Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
        
        {/* Sub Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto border border-gray-200 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'pending' 
                ? 'bg-white text-indigo-950 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <AlertCircle size={14} />
            <span>Pending Verification ({counts.pending})</span>
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'paid' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Payment Done ({counts.paid})</span>
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all w-full md:w-auto justify-center ${
              activeTab === 'unpaid' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-rose-600'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Unpaid ({counts.unpaid})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all"
            placeholder="Search by student or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student Profile</th>
                {user?.role !== 'faculty' && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty Mentor</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Project Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={user?.role === 'faculty' ? 4 : 5} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                      <span className="text-xs text-gray-400">Loading payment data...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((item) => (
                <tr key={item.internship_id} className="hover:bg-indigo-50/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100/70 text-indigo-700 flex items-center justify-center rounded-xl shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{item.intern?.intern_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.intern?.college_name || 'N/A'}</div>
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
                    <div className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{item.internship_title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                      <Calendar size={11} className="mr-1" />
                      <span>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {item.is_paid ? (
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center text-[10px] w-max bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-150">
                          Verified Paid
                        </span>
                        {item.transaction_number && (
                          <span className="text-[10px] font-mono text-gray-500">Ref: {item.transaction_number}</span>
                        )}
                      </div>
                    ) : item.transaction_number ? (
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center text-[10px] w-max bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-150">
                          Verification Pending
                        </span>
                        <span className="text-[10px] font-mono text-amber-900 bg-amber-500/10 p-0.5 px-1.5 rounded w-max border border-amber-200">Ref: {item.transaction_number}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center text-[10px] w-max bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded-full border border-rose-150">
                          Unpaid
                        </span>
                        {item.remarks && item.remarks.includes("Payment Declined:") && (
                          <div className="text-[9px] text-rose-600 font-bold max-w-[180px] whitespace-normal mt-0.5 leading-snug flex items-start bg-rose-50 border border-rose-100 p-1 px-1.5 rounded-lg">
                            <AlertTriangle size={11} className="mr-1 mt-0.5 shrink-0" />
                            <span>Declined Reason: {item.remarks.replace("Payment Declined:", "").trim()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-xs font-medium">
                    {/* Action buttons depending on tab and role */}
                    {activeTab === 'pending' && user?.role === 'admin' && (
                      <button
                        onClick={() => handleEnterTxn(item)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow transition-all cursor-pointer"
                      >
                        Verify Reference
                      </button>
                    )}
                    {activeTab === 'unpaid' && user?.role !== 'admin' && (
                      <button
                        onClick={() => handleEnterTxn(item)}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow transition-all cursor-pointer"
                      >
                        Enter Transaction ID
                      </button>
                    )}
                    {activeTab === 'pending' && user?.role !== 'admin' && (
                      <span className="text-gray-400 italic text-[11px] font-normal">Awaiting Admin Verification</span>
                    )}
                    {activeTab === 'paid' && (
                      <span className="text-emerald-600 font-bold text-[11px]">Paid & Cleared</span>
                    )}
                    {activeTab === 'unpaid' && user?.role === 'admin' && (
                      <span className="text-rose-600 font-bold text-[11px]">Awaiting Faculty Reference</span>
                    )}
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'faculty' ? 4 : 5} className="text-center py-12 text-gray-400 text-xs italic font-medium">
                    No records found matching this list selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionInputModal
        isOpen={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        onSubmit={handleSaveTxn}
        initialValue={txnTargetItem?.transaction_number || ''}
        isAdmin={user?.role === 'admin'}
      />

    </div>
  );
}
