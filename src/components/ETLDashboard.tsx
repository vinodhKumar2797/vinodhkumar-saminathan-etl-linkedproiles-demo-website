import { useState, useEffect } from 'react';
import { ETLService } from '../services/etl';
import { ETLRun, LinkedInProfile } from '../types/linkedin';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/auth';
import { Play, Database, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import ETLRunCard from './ETLRunCard';
import ProfileList from './ProfileList';
import StatsCards from './StatsCards';

const etlService = new ETLService();

interface ETLDashboardProps {
  onDataRefresh?: () => void;
}

export default function ETLDashboard({ onDataRefresh }: ETLDashboardProps) {
  const [etlRuns, setEtlRuns] = useState<ETLRun[]>([]);
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    validProfiles: 0,
    invalidProfiles: 0,
    pendingProfiles: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [runsData, profilesData, statsData] = await Promise.all([
        etlService.getETLRuns(10),
        loadProfiles(),
        loadStats(),
      ]);
      setEtlRuns(runsData);
      setProfiles(profilesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as LinkedInProfile[];
  };

  const loadStats = async () => {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('validation_status')
      .eq('user_id', user.id);

    if (error) throw error;

    const stats = {
      totalProfiles: data.length,
      validProfiles: data.filter(p => p.validation_status === 'valid').length,
      invalidProfiles: data.filter(p => p.validation_status === 'invalid').length,
      pendingProfiles: data.filter(p => p.validation_status === 'pending').length,
    };

    return stats;
  };

  const runETL = async () => {
    setIsRunning(true);
    try {
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const sampleProfiles = generateSampleProfiles();
      const runId = await etlService.startETLRun('incremental');

      const stats = {
        profiles_processed: 0,
        profiles_added: 0,
        profiles_updated: 0,
        profiles_unchanged: 0,
        images_processed: 0,
        validation_failures: 0,
      };

      for (const profile of sampleProfiles) {
        const result = await etlService.processProfile(profile, runId);
        stats.profiles_processed++;

        if (result === 'added') {
          stats.profiles_added++;
        } else if (result === 'updated') {
          stats.profiles_updated++;
        } else {
          stats.profiles_unchanged++;
        }
      }

      await supabase
        .from('etl_runs')
        .update({ user_id: user.id })
        .eq('id', runId);

      await etlService.completeETLRun(runId, stats);
      await loadData();
      onDataRefresh?.();
    } catch (error) {
      console.error('ETL run failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const generateSampleProfiles = () => {
    return [
      {
        linkedin_id: `linkedin-${Date.now()}-1`,
        full_name: 'John Doe',
        headline: 'Senior Software Engineer at Tech Corp',
        location: 'San Francisco, CA',
        summary: 'Experienced software engineer with 10+ years in full-stack development.',
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Software Engineer',
            start_date: '2020-01',
            description: 'Leading development of cloud-native applications',
            location: 'San Francisco, CA',
          },
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'BS',
            field_of_study: 'Computer Science',
            start_year: 2008,
            end_year: 2012,
          },
        ],
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        connections_count: 1500,
        profile_url: 'https://linkedin.com/in/johndoe',
        profile_image_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      },
      {
        linkedin_id: `linkedin-${Date.now()}-2`,
        full_name: 'Jane Smith',
        headline: 'Product Manager | AI & Machine Learning',
        location: 'New York, NY',
        summary: 'Passionate about building products that make a difference.',
        experience: [
          {
            company: 'AI Innovations',
            title: 'Product Manager',
            start_date: '2019-06',
            location: 'New York, NY',
          },
        ],
        education: [
          {
            school: 'MIT',
            degree: 'MBA',
            start_year: 2015,
            end_year: 2017,
          },
        ],
        skills: ['Product Management', 'AI', 'Machine Learning', 'Strategy'],
        connections_count: 2300,
        profile_url: 'https://linkedin.com/in/janesmith',
        profile_image_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600">
          Monitor your ETL pipeline and profile processing
        </p>
      </div>

        <StatsCards stats={stats} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                ETL Operations
              </h2>
              <p className="text-slate-600 text-sm">
                Run incremental ETL to process new and updated profiles
              </p>
            </div>
            <button
              onClick={runETL}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Incremental ETL
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Recent ETL Runs
            </h2>
            <div className="space-y-3">
              {etlRuns.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  No ETL runs yet. Click "Run Incremental ETL" to start.
                </p>
              ) : (
                etlRuns.map(run => <ETLRunCard key={run.id} run={run} />)
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Key Features
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Incremental Loading
                  </h3>
                  <p className="text-sm text-slate-600">
                    Only processes changed data, reducing full reloads by 70%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Change Detection
                  </h3>
                  <p className="text-sm text-slate-600">
                    SHA-256 hashing to identify modified profiles efficiently
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Data Validation
                  </h3>
                  <p className="text-sm text-slate-600">
                    Automated validation reducing manual effort by 40%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProfileList profiles={profiles} />
    </div>
  );
}
