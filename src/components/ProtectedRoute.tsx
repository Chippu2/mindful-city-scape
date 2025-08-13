import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-sky flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin">
            <div className="w-12 h-12 rounded-full bg-gradient-magic p-2">
              <div className="w-full h-full rounded-full bg-background"></div>
            </div>
          </div>
          <p className="text-muted-foreground">Loading your magical city...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;