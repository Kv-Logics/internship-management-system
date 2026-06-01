import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, Send, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function TransactionInputModal({ isOpen, onClose, onSubmit, initialValue = '', isAdmin = false }) {
  const [txn, setTxn] = useState('');
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTxn(initialValue);
      setDeclineMode(false);
      setDeclineReason('');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (declineMode) {
      if (!declineReason.trim()) return;
      onSubmit('', { isDecline: true, remarks: `Payment Declined: ${declineReason.trim()}` });
    } else {
      if (!txn.trim()) return;
      onSubmit(txn.trim(), { isDecline: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md border border-gray-200 overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className={`p-5 text-white flex justify-between items-center bg-gradient-to-r ${
          declineMode 
            ? 'from-rose-800 to-rose-950'
            : (isAdmin ? 'from-emerald-800 to-emerald-950' : 'from-indigo-900 to-indigo-950')
        }`}>
          <div className="flex items-center space-x-2.5">
            {declineMode ? (
              <AlertTriangle size={18} className="text-rose-300" />
            ) : (
              <CreditCard size={18} className={isAdmin ? 'text-emerald-300' : 'text-indigo-300'} />
            )}
            <h3 className="text-sm font-extrabold tracking-tight">
              {declineMode 
                ? 'Decline Payment Verification' 
                : (isAdmin ? 'Verify Payment Transaction' : 'Payment Verification')
              }
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {declineMode ? (
            /* Decline Mode Workflow */
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Decline Reason
              </label>
              <p className="text-[11px] text-gray-400 leading-normal mb-1">
                Provide a reason explaining why the payment verification is declined. This message will be shown to the faculty mentor.
              </p>
              <textarea
                autoFocus
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs font-semibold transition-all h-24 resize-none"
                placeholder="e.g. Transaction number does not match banking records, or incorrect payment amount."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                required
              />
            </div>
          ) : (
            /* Normal Verification View */
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Transaction ID / Reference Number
              </label>
              <p className="text-[11px] text-gray-400 leading-normal mb-3">
                {isAdmin 
                  ? 'Review the submitted payment reference below before verifying or declining.'
                  : 'Please enter the payment receipt or transaction ID to submit the internship for verification.'
                }
              </p>
              
              {/* Admin preview highlight box */}
              {isAdmin && txn.trim() && (
                <div className="bg-emerald-50/50 border border-emerald-150 p-3.5 rounded-xl flex items-center justify-between mb-3.5 animate-fadeIn">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Submitted Reference</span>
                    <span className="text-sm font-mono font-black text-emerald-900">{txn}</span>
                  </div>
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                    <CheckCircle2 className="text-emerald-600 h-5 w-5" />
                  </div>
                </div>
              )}

              {!isAdmin && (
                <input
                  type="text"
                  autoFocus
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold transition-all font-mono"
                  placeholder="e.g. TXN987654321"
                  value={txn}
                  onChange={(e) => setTxn(e.target.value)}
                  required
                />
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            {declineMode ? (
              /* Rejection Actions */
              <>
                <button
                  type="button"
                  onClick={() => setDeclineMode(false)}
                  className="flex items-center space-x-1 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={!declineReason.trim()}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <AlertTriangle size={13} />
                  <span>Confirm Decline</span>
                </button>
              </>
            ) : (
              /* Regular Actions */
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeclineMode(true)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!txn.trim()}
                    className={`flex items-center space-x-1.5 px-5 py-2.5 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all ${
                      isAdmin 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Verify & Mark Paid</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
