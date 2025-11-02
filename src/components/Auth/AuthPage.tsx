import { useState } from 'react';
import { Database, LogIn, UserPlus } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">ETL Pipeline</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-600 text-sm">
              {isLogin
                ? 'Sign in to manage your LinkedIn profiles'
                : 'Get started with LinkedIn profile ETL'}
            </p>
          </div>

          {isLogin ? (
            <LoginForm onSuccess={onAuthSuccess} />
          ) : (
            <SignupForm onSuccess={onAuthSuccess} />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">Import Profiles</div>
                  <p>Upload LinkedIn profiles via CSV or JSON</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">Automatic Validation</div>
                  <p>Data is validated and deduplicated automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">Track Changes</div>
                  <p>Monitor all profile updates and modifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-slate-400 text-sm mt-8">
          <p>© 2024 LinkedIn ETL Pipeline. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
