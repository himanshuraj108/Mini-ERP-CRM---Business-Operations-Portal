import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: User['role'][];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
