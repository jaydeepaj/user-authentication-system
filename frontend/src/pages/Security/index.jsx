import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { validators, getPasswordStrength } from '../../utils/validators';

// ─── MFA Setup Wizard ──────────────────────────────────────────────────────────
const MFASection = ({ user, onUpdate }) => {
  const [step, setStep] = useState('idle'); // idle | setup | backup
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const startSetup = async () => {
    setIsLoading(true); setError('');
    try {
      const res = await userService.setupMfa();
      setQrCode(res.data.qrCode);
      setManualKey(res.data.manualKey);
      setStep('setup');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'MFA setup failed.');
    } finally { setIsLoading(false); }
  };

  const confirmSetup = async () => {
    if (code.length < 6) return;
    setIsLoading(true); setError('');
    try {
      const res = await userService.confirmMfa({ code });
      setBackupCodes(res.data.backupCodes);
      onUpdate({ mfaEnabled: true });
      setStep('backup');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid code. Try again.');
    } finally { setIsLoading(false); }
  };

  const handleDisable = async () => {
    setIsLoading(true); setError('');
    try {
      await userService.disableMfa({ code: disableCode });
      onUpdate({ mfaEnabled: false });
      setShowDisable(false);
      setDisableCode('');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Verification failed.');
    } finally { setIsLoading(false); }
  };

  if (user?.mfaEnabled) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success-500/10 border border-success-500/30 flex items-center justify-center text-xl">🔐</div>
          <div>
            <p className="font-semibold text-white text-sm">MFA is Active</p>
            <p className="text-success-400 text-xs">Your account is protected with TOTP authentication</p>
          </div>
          <span className="ml-auto badge badge-success">Active</span>
        </div>
        {error && <div className="alert alert-danger mb-4 text-sm">{error}</div>}
        {!showDisable ? (
          <button id="mfa-disable-btn" onClick={() => setShowDisable(true)} className="btn btn-danger btn-sm">Disable MFA</button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="alert alert-warning text-sm">⚠ Enter your TOTP code to confirm disabling MFA</div>
            <input
              id="mfa-disable-code-input"
              type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit TOTP code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="form-input font-mono text-center tracking-widest text-lg"
            />
            <div className="flex gap-3">
              <button id="mfa-confirm-disable-btn" onClick={handleDisable} disabled={isLoading || disableCode.length < 6} className="btn btn-danger btn-sm">{isLoading ? 'Disabling...' : 'Confirm Disable'}</button>
              <button onClick={() => { setShowDisable(false); setDisableCode(''); setError(''); }} className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div>
      {step === 'idle' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning-500/10 border border-warning-500/30 flex items-center justify-center text-xl">⚠️</div>
            <div>
              <p className="font-semibold text-white text-sm">MFA Not Enabled</p>
              <p className="text-warning-400 text-xs">Add an extra layer of protection to your account</p>
            </div>
            <span className="ml-auto badge badge-warning">Inactive</span>
          </div>
          {error && <div className="alert alert-danger mb-4 text-sm">{error}</div>}
          <button id="mfa-setup-start-btn" onClick={startSetup} disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Setting up...' : '🔐 Enable Two-Factor Authentication'}
          </button>
        </div>
      )}

      {step === 'setup' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="alert alert-info text-sm">Scan the QR code with Google Authenticator, Authy, or any TOTP app.</div>
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-glow-sm">
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <div className="w-full">
              <p className="text-dark-400 text-xs mb-1">Or enter this key manually:</p>
              <p className="font-mono text-primary-400 bg-dark-800 px-3 py-2 rounded-lg text-sm break-all">{manualKey}</p>
            </div>
          </div>
          {error && <div className="alert alert-danger text-sm">{error}</div>}
          <div className="form-group">
            <label htmlFor="mfa-confirm-code" className="form-label">Enter code from app to confirm setup</label>
            <input
              id="mfa-confirm-code"
              type="text" inputMode="numeric" maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="form-input font-mono text-center tracking-widest text-xl"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button id="mfa-confirm-setup-btn" onClick={confirmSetup} disabled={isLoading || code.length < 6} className="btn btn-primary">{isLoading ? 'Confirming...' : 'Confirm & Enable MFA'}</button>
            <button onClick={() => { setStep('idle'); setCode(''); setError(''); }} className="btn btn-ghost">Cancel</button>
          </div>
        </motion.div>
      )}

      {step === 'backup' && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
          <div className="alert alert-success text-sm">🎉 MFA enabled successfully!</div>
          <div>
            <p className="text-white font-semibold mb-1">Save Your Backup Codes</p>
            <p className="text-dark-400 text-sm mb-4">Store these codes somewhere safe. Each can be used once if you lose access to your authenticator app.</p>
            <div className="grid grid-cols-2 gap-2 p-4 bg-dark-800 rounded-xl border border-dark-600/50">
              {backupCodes.map((c, i) => (
                <code key={i} className="text-primary-300 font-mono text-sm py-1 px-2 bg-dark-700/60 rounded">{c}</code>
              ))}
            </div>
          </div>
          <button id="mfa-done-btn" onClick={() => setStep('idle')} className="btn btn-primary w-full">I've Saved My Backup Codes</button>
        </motion.div>
      )}
    </div>
  );
};

// ─── Change Password Section ───────────────────────────────────────────────────
const ChangePasswordSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPwd = watch('newPassword', '');
  const strength = getPasswordStrength(newPwd);

  const onSubmit = async (data) => {
    setIsLoading(true); setError(''); setSuccess('');
    try {
      await userService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setSuccess('Password changed. Please log in again with your new password.');
      reset();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to change password.');
    } finally { setIsLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {success && <div className="alert alert-success text-sm">✅ {success}</div>}
      {error && <div className="alert alert-danger text-sm">⚠ {error}</div>}
      <div className="form-group">
        <label htmlFor="sec-current-password" className="form-label">Current Password</label>
        <input id="sec-current-password" type="password" className={`form-input ${errors.currentPassword ? 'form-input-error' : ''}`}
          placeholder="Your current password" {...register('currentPassword', validators.currentPassword)} />
        {errors.currentPassword && <span className="form-error">⚠ {errors.currentPassword.message}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="sec-new-password" className="form-label">New Password</label>
        <input id="sec-new-password" type="password" className={`form-input ${errors.newPassword ? 'form-input-error' : ''}`}
          placeholder="New strong password" {...register('newPassword', validators.password)} />
        {newPwd && (
          <div className="mt-2 flex gap-1">
            {[1,2,3,4].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-dark-600'}`} />)}
          </div>
        )}
        {errors.newPassword && <span className="form-error">⚠ {errors.newPassword.message}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="sec-confirm-new-password" className="form-label">Confirm New Password</label>
        <input id="sec-confirm-new-password" type="password" className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
          placeholder="Repeat new password"
          {...register('confirmPassword', { required: 'Required', validate: (v) => v === newPwd || 'Passwords do not match' })} />
        {errors.confirmPassword && <span className="form-error">⚠ {errors.confirmPassword.message}</span>}
      </div>
      <div className="alert alert-info text-xs">
        All active sessions will be terminated after changing your password.
      </div>
      <button id="change-password-btn" type="submit" disabled={isLoading} className="btn btn-secondary btn-sm">
        {isLoading ? 'Changing...' : '🔒 Change Password'}
      </button>
    </form>
  );
};

// ─── Main Security Page ────────────────────────────────────────────────────────
const Security = () => {
  const { user, updateUser } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Security Settings</h1>
        <p className="section-subtitle">Manage MFA, passwords, and account security preferences</p>
      </div>

      {/* Security Score */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Security Score</h2>
          <span className={`text-2xl font-black ${user?.mfaEnabled ? 'text-success-400' : 'text-warning-400'}`}>
            {user?.mfaEnabled ? '95' : '60'}<span className="text-sm font-normal text-dark-400">/100</span>
          </span>
        </div>
        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${user?.mfaEnabled ? 'bg-success-500 w-[95%]' : 'bg-warning-500 w-[60%]'}`}
          />
        </div>
        <p className="text-dark-400 text-xs mt-2">
          {user?.mfaEnabled ? '✓ Great! Your account is well-protected.' : '⚠ Enable MFA to significantly boost your security score.'}
        </p>
      </div>

      {/* MFA Section */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Multi-Factor Authentication</h2>
        <MFASection user={user} onUpdate={updateUser} />
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Change Password</h2>
        <ChangePasswordSection />
      </div>

      {/* Security Checklist */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">Security Checklist</h2>
        <div className="space-y-3">
          {[
            { label: 'Email Verified', done: user?.isVerified },
            { label: 'Strong Password Set', done: true },
            { label: 'MFA Enabled', done: user?.mfaEnabled },
            { label: 'Recent Login Reviewed', done: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-700/30 last:border-0">
              <span className="text-dark-300 text-sm">{item.label}</span>
              <span className={`badge ${item.done ? 'badge-success' : 'badge-warning'}`}>
                {item.done ? '✓ Done' : '⚠ Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Security;
