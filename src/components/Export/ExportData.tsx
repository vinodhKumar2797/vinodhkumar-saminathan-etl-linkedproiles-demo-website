import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LinkedInProfile } from '../../types/linkedin';
import { Download, FileJson, FileText } from 'lucide-react';

interface ExportDataProps {
  userId: string;
}

export default function ExportData({ userId }: ExportDataProps) {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [userId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAsJSON = async () => {
    setExporting(true);
    try {
      const dataStr = JSON.stringify(profiles, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linkedin-profiles-${new Date().getISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportAsCSV = async () => {
    setExporting(true);
    try {
      const headers = [
        'linkedin_id',
        'full_name',
        'headline',
        'location',
        'summary',
        'skills',
        'connections_count',
        'profile_url',
        'validation_status',
        'updated_at',
      ];

      const rows = profiles.map(p => [
        p.linkedin_id,
        p.full_name,
        p.headline,
        p.location,
        p.summary,
        p.skills.join(';'),
        p.connections_count,
        p.profile_url,
        p.validation_status,
        p.updated_at,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const dataBlob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linkedin-profiles-${new Date().getISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-600">Loading profiles...</div>;
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No profiles to export yet. Import some data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>{profiles.length}</strong> profiles ready to export
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportAsJSON}
          disabled={exporting}
          className="flex items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileJson className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-slate-900">Export as JSON</div>
            <p className="text-xs text-slate-600">Complete profile data with all fields</p>
          </div>
        </button>

        <button
          onClick={exportAsCSV}
          disabled={exporting}
          className="flex items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <div className="font-medium text-slate-900">Export as CSV</div>
            <p className="text-xs text-slate-600">Spreadsheet-compatible format</p>
          </div>
        </button>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-slate-900 mb-4">Profile Preview</h3>
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {profiles.slice(0, 5).map(profile => (
            <div key={profile.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{profile.full_name}</div>
                  <p className="text-xs text-slate-600">{profile.headline}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                  {profile.validation_status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {profiles.length > 5 && (
          <p className="text-xs text-slate-600 mt-3">
            +{profiles.length - 5} more profiles in export
          </p>
        )}
      </div>
    </div>
  );
}
