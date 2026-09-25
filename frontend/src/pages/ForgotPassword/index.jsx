import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/authService';
import { validators, getPasswordStrength } from '../../utils/validators';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Steps: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form handlers
  const emailForm = useForm();
  const otpForm = useForm();
  const passwordForm = useForm();

  // Watch password for strength check
  const newPasswordValue = passwordForm.watch('password', '');
  const strength = getPasswordStrength(newPasswordValue);

  // Step 1: Submit Email to send OTP
  const handleEmailSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit OTP to verify
  const handleOtpSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      const res = await authService.verifyResetOtp({
        email: submittedEmail,
        otp: data.otp.trim(),
      });
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep(3);
      } else {
        setServerError('Invalid reset response from server.');
      }
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setServerError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: submittedEmail });
      alert(`A new verification OTP has been sent to ${submittedEmail}`);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Failed to resend OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handlePasswordSubmit = async (data) => {
    if (!resetToken) return;
    setServerError('');
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: resetToken,
        password: data.password,
      });
      setStep(4);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Failed to reset password. The session may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-warning-500/10 border border-warning-500/30 flex items-center justify-center mb-5">
                <span className="text-2xl">🔑</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
              <p className="text-dark-300 text-sm">
                Enter your registered email address to receive a 6-digit verification OTP code.
              </p>
            </div>

            {serverError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger mb-5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {serverError}
              </motion.div>
            )}

            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5" noValidate>
              <div className="form-group">
                <label htmlFor="forgot-email" className="form-label font-mono text-xs text-dark-300">EMAIL ADDRESS</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">📧</span>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`form-input pl-10 ${emailForm.formState.errors.email ? 'form-input-error' : ''}`}
                    {...emailForm.register('email', validators.email)}
                  />
                </div>
                {emailForm.formState.errors.email && <span className="form-error">⚠ {emailForm.formState.errors.email.message}</span>}
              </div>

              <button
                id="send-otp-btn"
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending OTP...
                  </>
                ) : 'Send Verification OTP'}
              </button>
            </form>

            <div className="divider mt-6">
              <span>Remember your password?</span>
            </div>
            <Link to="/login" className="btn btn-ghost w-full mt-4">Back to Sign In</Link>
          </motion.div>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-5">
                <span className="text-2xl">✉️</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Enter OTP Code</h1>
              <p className="text-dark-300 text-sm">
                We sent a 6-digit verification OTP code to:
              </p>
              <p className="text-primary-400 font-semibold font-mono text-sm mt-1">{submittedEmail}</p>
            </div>

            {serverError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger mb-5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {serverError}
              </motion.div>
            )}

            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-5" noValidate>
              <div className="form-group">
                <label htmlFor="otp-input" className="form-label font-mono text-xs text-dark-300">6-DIGIT VERIFICATION CODE</label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={`form-input text-center font-mono text-2xl tracking-[0.4em] ${otpForm.formState.errors.otp ? 'form-input-error' : ''}`}
                  {...otpForm.register('otp', {
                    required: 'OTP code is required',
                    pattern: { value: /^\d{6}$/, message: 'Please enter a 6-digit numeric code' },
                  })}
                />
                {otpForm.formState.errors.otp && <span className="form-error">⚠ {otpForm.formState.errors.otp.message}</span>}
              </div>

              <button
                id="verify-otp-btn"
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying OTP...
                  </>
                ) : 'Verify OTP'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-6 text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-primary-400 hover:text-primary-300 hover:underline transition-colors"
              >
                Didn't get code? Resend OTP
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setServerError(''); }}
                className="text-dark-400 hover:text-dark-200 transition-colors"
              >
                Change Email
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Set New Password */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary-500/10 border border-secondary-500/30 flex items-center justify-center mb-5">
                <span className="text-2xl">🔒</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
              <p className="text-dark-300 text-sm">
                OTP verified successfully! Create a new strong password for your account.
              </p>
            </div>

            {serverError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger mb-5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {serverError}
              </motion.div>
            )}

            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-5" noValidate>
              {/* New Password */}
              <div className="form-group">
                <label htmlFor="new-password" className="form-label font-mono text-xs text-dark-300">NEW PASSWORD</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className={`form-input pr-11 ${passwordForm.formState.errors.password ? 'form-input-error' : ''}`}
                    {...passwordForm.register('password', validators.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {newPasswordValue && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-dark-600'}`} />
                      ))}
                    </div>
                    {strength.label && <p className="text-xs text-dark-400">Strength: <span className="font-medium text-dark-200">{strength.label}</span></p>}
                  </div>
                )}
                {passwordForm.formState.errors.password && <span className="form-error">⚠ {passwordForm.formState.errors.password.message}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label font-mono text-xs text-dark-300">CONFIRM NEW PASSWORD</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  className={`form-input ${passwordForm.formState.errors.confirmPassword ? 'form-input-error' : ''}`}
                  {...passwordForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === newPasswordValue || 'Passwords do not match',
                  })}
                />
                {passwordForm.formState.errors.confirmPassword && <span className="form-error">⚠ {passwordForm.formState.errors.confirmPassword.message}</span>}
              </div>

              <button
                id="reset-password-btn"
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating Password...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-success-500/10 border border-success-500/30 flex items-center justify-center"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-3">Password Reset Complete!</h2>
            <p className="text-dark-300 text-sm mb-6">
              Your password has been reset successfully. You can now log in using your new credentials.
            </p>

            <Link to="/login" className="btn btn-primary w-full btn-lg">
              Sign In Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;
