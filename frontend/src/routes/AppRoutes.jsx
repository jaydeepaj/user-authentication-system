import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Protected route wrappers
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

// Lazy-loaded pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const MFA = lazy(() => import('../pages/MFA'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const Security = lazy(() => import('../pages/Security'));
const Sessions = lazy(() => import('../pages/Sessions'));
const LoginHistory = lazy(() => import('../pages/LoginHistory'));
const Admin = lazy(() => import('../pages/Admin'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Loader fallback
import Loader from '../components/Loader/Loader';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Suspense fallback={<Loader fullScreen />}>
      <Routes>
        {/* Public Home */}
        <Route path="/" element={<Home />} />

        {/* Auth Routes — Redirect to dashboard if already logged in */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mfa" element={<MFA />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/security" element={<Security />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/login-history" element={<LoginHistory />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin-only route */}
          <Route
            path="/admin"
            element={
              isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
