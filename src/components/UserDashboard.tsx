import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/auth';
import { ETLService } from '../services/etl';
import { ImportService } from '../services/import';
import { ETLRun, LinkedInProfile } from '../types/linkedin';
import { LogOut, Settings, Download, Upload } from 'lucide-react';
import ETLDashboard from './ETLDashboard';
import ImportUpload from './Import/ImportUpload';
import ExportData from './Export/ExportData';

interface User {
  id: string;
  email: string;
}

interface UserProfile {
  full_name: string;
  organization: string;
}

const etlService = new ETLService();
const importService = new ImportService();

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProfiles: 0,
    totalRuns: 0,
    totalImports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      setUser({
        id: currentUser.id,
        email: currentUser.email || '',
      });

      const profile = await auth.getUserProfile(currentUser.id);
      setUserProfile(profile);

      await loadStats(currentUser.id);
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      const [profilesData, runsData, importsData] = await Promise.all([
        supabase
          .from('linkedin_profiles')
          .select('count', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('etl_runs')
          .select('count', { count: 'exact' })
          .eq('user_id', userId),
        importService.getUserImports(userId),
      ]);

      setStats({
        totalProfiles: profilesData.count || 0,
        totalRuns: runsData.count || 0,
        totalImports: importsData.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleImportComplete = async () => {
    if (user) {
      await loadStats(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Authentication required</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-900">ETL Pipeline</h1>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-2">Total Profiles</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalProfiles}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-2">ETL Runs</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalRuns}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-2">Imports</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalImports}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && <ETLDashboard />}
            {activeTab === 'import' && <ImportUpload onImportComplete={handleImportComplete} />}
            {activeTab === 'export' && user && <ExportData userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
