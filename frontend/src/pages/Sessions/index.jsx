import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../../services/userService';
import Loader from '../../components/Loader/Loader';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await userService.getSessions();
      setSessions(res.data?.sessions || []);
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleTerminate = async (sessionId) => {
    setTerminatingId(sessionId);
    setError(''); setSuccess('');
    try {
      await userService.terminateSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSuccess('Session terminated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to terminate session.');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleTerminateAll = async () => {
    if (!window.confirm('Terminate ALL active sessions? You will be logged out everywhere.')) return;
    setIsTerminatingAll(true);
    setError(''); setSuccess('');
    try {
      await userService.terminateAllSessions();
      setSessions([]);
      setSuccess('All sessions terminated. Please log in again.');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to terminate sessions.');
    } finally {
      setIsTerminatingAll(false);
    }
  };

  const getDeviceIcon = (device, os = '') => {
    if (device === 'mobile') return '📱';
    if (device === 'tablet') return '📱';
    if (os?.toLowerCase().includes('windows')) return '🖥️';
    if (os?.toLowerCase().includes('mac')) return '💻';
    if (os?.toLowerCase().includes('linux')) return '🐧';
    return '💻';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Active Sessions</h1>
          <p className="section-subtitle">Manage all devices currently logged into your account</p>
        </div>
        {sessions.length > 1 && (
          <button
            id="terminate-all-sessions-btn"
            onClick={handleTerminateAll}
            disabled={isTerminatingAll}
            className="btn btn-danger btn-sm flex-shrink-0"
          >
            {isTerminatingAll ? 'Terminating...' : '🚪 Sign Out All'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Sessions list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader size="md" text="Loading sessions..." /></div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-dark-300 font-medium">No active sessions found.</p>
          <p className="text-dark-500 text-sm mt-1">You'll appear here when you log in.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Device icon */}
                  <div className="w-12 h-12 rounded-xl bg-dark-700/60 flex items-center justify-center text-2xl flex-shrink-0">
                    {getDeviceIcon(session.deviceInfo?.device, session.deviceInfo?.os)}
                  </div>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-sm">
                        {session.deviceInfo?.browser || 'Unknown Browser'}
                      </span>
                      <span className="badge badge-success text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-slow" />
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2">
                      <div>
                        <p className="text-dark-500 text-xs">Operating System</p>
                        <p className="text-dark-200 text-xs font-medium">{session.deviceInfo?.os || '—'}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs">IP Address</p>
                        <p className="text-dark-200 text-xs font-mono">{session.ipAddress || '—'}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs">Last Active</p>
                        <p className="text-dark-200 text-xs">{session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : '—'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-dark-500 text-xs">Created</p>
                        <p className="text-dark-200 text-xs">{new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Terminate button */}
                  <button
                    id={`terminate-session-${session.id}`}
                    onClick={() => handleTerminate(session.id)}
                    disabled={terminatingId === session.id}
                    className="btn btn-ghost btn-sm text-danger-400 hover:bg-danger-500/10 hover:text-danger-300 flex-shrink-0"
                  >
                    {terminatingId === session.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        End
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Security tip */}
      <div className="alert alert-info text-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        If you see any sessions you don't recognize, terminate them immediately and change your password.
      </div>
    </div>
  );
};

export default Sessions;
