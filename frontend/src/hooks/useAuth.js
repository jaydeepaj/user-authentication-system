import { useAuthContext } from '../context/AuthContext';

/**
 * Convenience hook — consume auth state and actions.
 * @returns {{ user, accessToken, csrfToken, isLoading, isAuthenticated, isAdmin, loginUser, logoutUser, updateUser }}
 */
const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
