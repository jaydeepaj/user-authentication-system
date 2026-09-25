import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../../services/userService';
import Loader from '../../components/Loader/Loader';

const LoginHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const LIMIT = 15;

  const fetchHistory = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await userService.getLoginHistory({ page: p, limit: LIMIT });
      setHistory(res.data?.history || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
      setPage(p);
    } catch {
      setError('Failed to load login history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS': return <span className="badge badge-success">✓ Success</span>;
      case 'FAILED': return <span className="badge badge-danger">✗ Failed</span>;
      case 'LOCKED': return <span className="badge badge-warning">🔒 Locked</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Login History</h1>
        <p className="section-subtitle">Complete record of all login attempts to your account ({total} total)</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader size="md" text="Loading history..." /></div>
      ) : history.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-dark-300">No login history found.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Device</th>
                    <th>Browser</th>
                    <th>OS</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <motion.tr
                      key={h._id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td>{getStatusBadge(h.status)}</td>
                      <td>
                        <code className="text-xs text-dark-300 font-mono">{h.ipAddress || '—'}</code>
                      </td>
                      <td>
                        <span className="text-xs capitalize">
                          {h.deviceInfo?.device === 'mobile' ? '📱' : h.deviceInfo?.device === 'tablet' ? '📱' : '💻'}{' '}
                          {h.deviceInfo?.device || 'Desktop'}
                        </span>
                      </td>
                      <td><span className="text-xs">{h.deviceInfo?.browser || '—'}</span></td>
                      <td><span className="text-xs">{h.deviceInfo?.os || '—'}</span></td>
                      <td>
                        <div className="text-xs">
                          <div className="text-dark-200">{new Date(h.createdAt).toLocaleDateString()}</div>
                          <div className="text-dark-500">{new Date(h.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-dark-400 text-sm">
                Page {page} of {totalPages} ({total} records)
              </p>
              <div className="flex gap-2">
                <button
                  id="login-history-prev-btn"
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 1 || isLoading}
                  className="btn btn-ghost btn-sm"
                >
                  ← Previous
                </button>
                <button
                  id="login-history-next-btn"
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page === totalPages || isLoading}
                  className="btn btn-ghost btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Security note */}
      <div className="alert alert-warning text-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        If you see unfamiliar login attempts, immediately change your password and enable MFA.
      </div>
    </div>
  );
};

export default LoginHistory;
