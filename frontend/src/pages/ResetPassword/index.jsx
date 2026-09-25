import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/authService';
import { validators, getPasswordStrength } from '../../utils/validators';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const pwd = watch('password', '');
  const strength = getPasswordStrength(pwd);

  useEffect(() => {
    if (!token) {
      setServerError('Reset token is missing. Please request a new password reset link.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) return;
    setServerError('');
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, password: data.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setServerError(err.response?.data?.detail || err.response?.data?.message || 'Password reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary-500/10 border border-secondary-500/30 flex items-center justify-center mb-5">
                <span className="text-2xl">🔒</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
              <p className="text-dark-300 text-sm">
                Choose a strong, unique password for your account. All active sessions will be revoked after reset.
              </p>
            </div>

            {serverError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger mb-5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{serverError}</span>
                {!token && (
                  <Link to="/forgot-password" className="ml-2 underline text-danger-300 hover:text-danger-200">
                    Request new link
                  </Link>
                )}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* New Password */}
              <div className="form-group">
                <label htmlFor="reset-password" className="form-label">New Password</label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    disabled={!token}
                    className={`form-input pr-11 ${errors.password ? 'form-input-error' : ''}`}
                    {...register('password', validators.password)}
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
                {pwd && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-dark-600'}`} />
                      ))}
                    </div>
                    {strength.label && <p className="text-xs text-dark-400">Strength: <span className="font-medium text-dark-200">{strength.label}</span></p>}
                  </div>
                )}
                {errors.password && <span className="form-error">⚠ {errors.password.message}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="reset-confirm-password" className="form-label">Confirm New Password</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  disabled={!token}
                  className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === pwd || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <span className="form-error">⚠ {errors.confirmPassword.message}</span>}
              </div>

              {/* Security note */}
              <div className="alert alert-info text-xs">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                After resetting, all active sessions will be terminated for your security.
              </div>

              <button
                id="reset-password-submit-btn"
                type="submit"
                disabled={isLoading || !token}
                className="btn btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Resetting...</>
                ) : 'Reset Password'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-success-500/10 border border-success-500/30 flex items-center justify-center"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-3">Password Reset!</h2>
            <p className="text-dark-300 text-sm mb-6">
              Your password has been reset successfully. You'll be redirected to the login page in a moment.
            </p>
            <Link to="/login" className="btn btn-primary w-full">Sign In Now</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResetPassword;
