import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import OTPInput from '../../components/OTPInput/OTPInput';
import { authService } from '../../services/authService';

const RESEND_DELAY = 60; // seconds

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(RESEND_DELAY);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6 && !code.includes('')) {
      handleVerify(code);
    }
  }, [otp]);

  const handleVerify = async (code) => {
    if (!email) {
      setServerError('Email not found. Please register again.');
      return;
    }
    setServerError('');
    setIsLoading(true);
    try {
      await authService.verifyEmail({ email, otp: code });
      navigate('/login', { state: { verified: true } });
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired OTP.');
      setOtp(Array(6).fill(''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setServerError('');
    try {
      await authService.resendVerification({ email });
      setSuccessMsg('A new verification code has been sent to your email.');
      setCountdown(RESEND_DELAY);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center"
      >
        <span className="text-4xl">📧</span>
      </motion.div>

      <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
      <p className="text-dark-300 text-sm mb-2">
        We sent a 6-digit code to
      </p>
      <p className="text-primary-400 font-semibold mb-8 text-sm font-mono">
        {email || 'your email address'}
      </p>

      {serverError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger mb-5 text-left">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
          {serverError}
        </motion.div>
      )}

      {successMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-success mb-5 text-left">
          ✅ {successMsg}
        </motion.div>
      )}

      {/* OTP Input */}
      <div className="mb-6">
        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
          hasError={!!serverError}
        />
      </div>

      {/* Manual verify button */}
      <button
        id="verify-email-btn"
        onClick={() => handleVerify(otp.join(''))}
        disabled={isLoading || otp.join('').length < 6}
        className="btn btn-primary w-full btn-lg mb-6"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Verifying...
          </>
        ) : 'Verify Email'}
      </button>

      {/* Resend */}
      <div className="text-sm">
        <span className="text-dark-400">Didn't receive the code? </span>
        {countdown > 0 ? (
          <span className="text-dark-500">Resend in {countdown}s</span>
        ) : (
          <button
            id="resend-otp-btn"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>

      <div className="divider mt-6">
        <span>Wrong account?</span>
      </div>
      <Link to="/register" className="btn btn-ghost w-full mt-4">Back to Register</Link>
    </div>
  );
};

export default VerifyEmail;
