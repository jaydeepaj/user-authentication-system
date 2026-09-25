import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import { validators } from '../../utils/validators';

const Login = () => {
  const { loginUser, setCsrfToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Fetch CSRF token on mount
  useEffect(() => {
    authService.getCsrfToken().then(({ data }) => {
      if (data?.csrfToken) setCsrfToken(data.csrfToken);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      const res = await authService.login({ email: data.email, password: data.password });
      const { success, requiresMfa, userId, accessToken, csrfToken, user, requiresEmailVerification } = res.data;

      if (!success) {
        setServerError(res.data.message || 'Login failed.');
        return;
      }

      if (requiresEmailVerification) {
        navigate('/verify-email', { state: { email: data.email } });
        return;
      }

      if (requiresMfa) {
        navigate('/mfa', { state: { userId } });
        return;
      }

      loginUser(user, accessToken, csrfToken);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-dark-300 text-sm">Authorize secure credentials to access dashboard</p>
      </div>

      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert-danger mb-5 border-danger-500/30"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span className="font-mono text-xs">{serverError}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label font-mono text-xs text-dark-300 tracking-wider">EMAIL ADDRESS</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">📧</span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@enterprise.com"
              className={`form-input pl-10 focus:shadow-glow-cyan transition-all duration-300 ${errors.email ? 'form-input-error' : ''}`}
              {...register('email', validators.email)}
            />
          </div>
          {errors.email && <span className="form-error font-mono text-[10px]">⚠ {errors.email.message}</span>}
        </div>

        {/* Password */}
        <div className="form-group">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="form-label font-mono text-xs text-dark-300 tracking-wider">PASSWORD</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 hover:underline transition-colors font-mono">
              FORGOT PASSWORD?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔑</span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`form-input pl-10 pr-11 focus:shadow-glow-cyan transition-all duration-300 ${errors.password ? 'form-input-error' : ''}`}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className="form-error font-mono text-[10px]">⚠ {errors.password.message}</span>}
        </div>

        {/* Submit */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full btn-lg mt-2 relative overflow-hidden"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Authorizing...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="divider mt-6">
        <span className="font-mono text-[10px] tracking-widest text-dark-400">OR AUTHORIZE WITH</span>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <button type="button" onClick={() => alert('Social authentication enabled.')} className="btn btn-ghost hover:border-primary-500/40 text-sm flex items-center justify-center p-2.5">
          <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 12 5.92 12 12s4.92 11 11.24 11c6.6 0 11-4.63 11-11.19 0-.75-.08-1.32-.2-1.885h-10.8z"/>
          </svg>
        </button>
        <button type="button" onClick={() => alert('Social authentication enabled.')} className="btn btn-ghost hover:border-secondary-500/40 text-sm flex items-center justify-center p-2.5">
          <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </button>
        <button type="button" onClick={() => alert('Social authentication enabled.')} className="btn btn-ghost hover:border-primary-500/40 text-sm flex items-center justify-center p-2.5">
          <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
        </button>
      </div>

      <div className="divider mt-6">
        <span className="font-mono text-[10px] tracking-widest text-dark-400">NEW SYSTEM ACCESS</span>
      </div>

      <Link
        to="/register"
        className="btn btn-ghost w-full mt-2 font-mono text-xs tracking-wider"
      >
        CREATE AN ACCOUNT
      </Link>

      {/* Security note */}
      <p className="text-dark-500 text-[10px] text-center mt-6 flex items-center justify-center gap-1 font-mono">
        <svg className="w-3 h-3 text-success-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        AUTHORIZED ENCRYPTION // SHA-256 SECURED
      </p>
    </div>
  );
};

export default Login;
