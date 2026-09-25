import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import OTPInput from '../../components/OTPInput/OTPInput';
import { authService } from '../../services/authService';
import useAuth from '../../hooks/useAuth';

const MFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, setCsrfToken } = useAuth();

  const userId = location.state?.userId;

  const [method, setMethod] = useState('TOTP'); // 'TOTP' | 'EMAIL_OTP'
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [serverError, setServerError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Redirect if no userId state
  useEffect(() => {
    if (!userId) navigate('/login', { replace: true });
  }, [userId]);

  // Auto-submit email OTP when 6 digits entered
  useEffect(() => {
    if (method === 'EMAIL_OTP') {
      const code = otp.join('');
      if (code.length === 6 && !code.includes('')) {
        handleVerify(code);
      }
    }
  }, [otp]);

  const handleVerify = async (code) => {
    setServerError('');
    setIsLoading(true);
    try {
      const res = await authService.verifyMfaLogin({
        userId,
        code: code || totpCode,
        method,
      });
      const { accessToken, csrfToken, user } = res.data;
      loginUser(user, accessToken, csrfToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Invalid MFA code. Please try again.');
      setOtp(Array(6).fill(''));
      setTotpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setIsSendingOtp(true);
    setServerError('');
    try {
      await authService.sendMfaOtp({ userId });
      setOtpSent(true);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const switchToEmail = async () => {
    setMethod('EMAIL_OTP');
    setServerError('');
    setOtp(Array(6).fill(''));
    setTotpCode('');
    await handleSendEmailOtp();
  };

  return (
    <div className="text-center font-mono">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary-500/10 border border-secondary-500/30 flex items-center justify-center shadow-glow-purple"
      >
        <span className="text-4xl">🔐</span>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">System Authorization</h1>
      <p className="text-dark-300 text-xs mb-6 font-mono text-[10px]">
        {method === 'TOTP'
          ? 'PROVIDE THE 6-DIGIT TOTP ACCESS CODE FROM AUTHENTICATOR APP'
          : 'PROVIDE THE 6-DIGIT EMAIL AUTHORIZATION TOKEN SENT TO REGISTERED NODE'}
      </p>

      {/* Method tabs */}
      <div className="flex rounded-xl bg-dark-800/60 border border-dark-600/50 p-1 mb-7">
        {[
          { id: 'TOTP', label: '📱 TOTP AUTH' },
          { id: 'EMAIL_OTP', label: '📧 EMAIL OTP' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== method) {
                setMethod(tab.id);
                setServerError('');
                setOtp(Array(6).fill(''));
                setTotpCode('');
                if (tab.id === 'EMAIL_OTP') handleSendEmailOtp();
              }
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
              method === tab.id
                ? 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {serverError && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="alert alert-danger mb-5 text-left border-danger-500/30">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">{serverError}</span>
        </motion.div>
      )}

      {/* TOTP Input */}
      {method === 'TOTP' && (
        <motion.div key="totp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="form-group text-left">
            <label htmlFor="mfa-totp-code" className="form-label text-center block text-xs text-dark-300">ENTER 6-DIGIT AUTHENTICATOR APP KEY</label>
            <input
              id="mfa-totp-code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="form-input text-center text-2xl font-mono tracking-widest focus:shadow-glow-cyan focus:border-primary-500"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <button
            id="mfa-verify-btn"
            onClick={() => handleVerify(totpCode)}
            disabled={isLoading || totpCode.length < 6}
            className="btn btn-primary w-full btn-lg font-mono text-xs tracking-wider"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> DECRYPTING KEY...</span>
            ) : 'AUTHORIZE GATEWAY'}
          </button>
        </motion.div>
      )}

      {/* Email OTP Input */}
      {method === 'EMAIL_OTP' && (
        <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {otpSent && (
            <div className="alert alert-success text-xs text-left border-success-500/30">
              ✅ SECURE TOKEN DISPATCHED TO NODE EMAIL DESTINATION.
            </div>
          )}
          <div className="py-2">
            <OTPInput value={otp} onChange={setOtp} disabled={isLoading} hasError={!!serverError} />
          </div>
          <button
            id="mfa-email-verify-btn"
            onClick={() => handleVerify(otp.join(''))}
            disabled={isLoading || otp.join('').length < 6}
            className="btn btn-primary w-full btn-lg font-mono text-xs tracking-wider"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> RESOLVING TOKEN...</span>
            ) : 'AUTHORIZE GATEWAY'}
          </button>
          <button
            id="mfa-resend-btn"
            onClick={handleSendEmailOtp}
            disabled={isSendingOtp}
            className="btn btn-ghost w-full text-xs font-mono text-[10px]"
          >
            {isSendingOtp ? 'SENDING NEW TOKEN...' : '🔄 DISPATCH NEW AUTHORIZATION TOKEN'}
          </button>
        </motion.div>
      )}

      <div className="border-t border-dark-700/50 mt-7 pt-5">
        <Link to="/login" className="text-xs text-dark-400 hover:text-primary-400 transition-colors tracking-wide">
          ← BACK TO HOST IDENTITY SELECTION
        </Link>
      </div>
    </div>
  );
};

export default MFA;
