import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  const adminOverride = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';

  if (!currentUser && !(adminOnly && adminOverride)) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin access is required and user is not admin
  if (adminOnly && !(isAdmin || adminOverride)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => (
  <ProtectedRoute adminOnly={true}>
    {children}
  </ProtectedRoute>
);
