import { useState, useEffect } from 'react';
import { auth } from './lib/auth';
import AuthPage from './components/Auth/AuthPage';
import UserDashboard from './components/UserDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await auth.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <UserDashboard />
  ) : (
    <AuthPage onAuthSuccess={checkAuth} />
  );
}

export default App;
