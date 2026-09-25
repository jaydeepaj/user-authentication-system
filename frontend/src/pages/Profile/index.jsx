import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { validators } from '../../utils/validators';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logoutUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogoutAccount = async () => {
    await logoutUser();
    navigate('/login', { replace: true });
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await userService.updateProfile(data);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Profile</h1>
        <p className="section-subtitle">Manage your personal information and account details</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-dark-900 text-3xl font-black shadow-glow-cyan">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success-500 border-2 border-dark-800" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-dark-400 text-sm mt-1">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <span className={`badge ${user?.role === 'Admin' ? 'badge-secondary' : 'badge-primary'}`}>
                {user?.role === 'Admin' ? '🛡️' : '👤'} {user?.role}
              </span>
              {user?.isVerified ? (
                <span className="badge badge-success">✓ Email Verified</span>
              ) : (
                <span className="badge badge-danger">✗ Unverified</span>
              )}
              {user?.mfaEnabled ? (
                <span className="badge badge-success">🔐 MFA Active</span>
              ) : (
                <span className="badge badge-warning">⚠ MFA Disabled</span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            id="profile-edit-btn"
            onClick={() => { setEditMode((v) => !v); setError(''); setSuccess(''); reset(); }}
            className={`btn btn-sm flex-shrink-0 ${editMode ? 'btn-ghost' : 'btn-outline'}`}
          >
            {editMode ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {/* Success/Error alerts */}
      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-success">
          ✅ {success}
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-danger">
          ⚠ {error}
        </motion.div>
      )}

      {/* Edit Form */}
      {editMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-white mb-5">Edit Personal Information</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="profile-firstname" className="form-label">First Name</label>
                <input
                  id="profile-firstname"
                  type="text"
                  className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                  {...register('firstName', validators.firstName)}
                />
                {errors.firstName && <span className="form-error">⚠ {errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="profile-lastname" className="form-label">Last Name</label>
                <input
                  id="profile-lastname"
                  type="text"
                  className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                  {...register('lastName', validators.lastName)}
                />
                {errors.lastName && <span className="form-error">⚠ {errors.lastName.message}</span>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button id="profile-save-btn" type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => { setEditMode(false); reset(); }} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Account Details */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-5">Account Information</h3>
        <div className="space-y-4">
          {[
            { label: 'Full Name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
            { label: 'Email Address', value: user?.email, mono: true },
            { label: 'Account Role', value: user?.role },
            { label: 'Member Since', value: memberSince },
            { label: 'Email Status', value: user?.isVerified ? 'Verified ✓' : 'Not Verified ✗' },
            { label: 'Two-Factor Auth', value: user?.mfaEnabled ? 'Enabled 🔐' : 'Disabled ⚠' },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-dark-700/30 last:border-0">
              <span className="text-dark-400 text-sm">{label}</span>
              <span className={`text-white text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Account Section */}
      <div className="card p-6 border-danger-500/30 bg-danger-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-danger-400 flex items-center gap-2">
              <span>🚪</span> Logout Account
            </h3>
            <p className="text-dark-300 text-xs mt-1 max-w-md">
              Sign out securely from your current active session. You can log back in anytime with your credentials.
            </p>
          </div>
          <button
            id="profile-logout-account-btn"
            className="btn btn-danger btn-sm flex-shrink-0 font-mono text-xs shadow-glow-red"
            onClick={handleLogoutAccount}
          >
            🚪 Logout Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
