import { LinkedInProfile } from '../types/linkedin';
import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';

interface ProfileListProps {
  profiles: LinkedInProfile[];
}

export default function ProfileList({ profiles }: ProfileListProps) {
  const getValidationBadge = (status?: string) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Valid
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            Invalid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!profiles || profiles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <p className="text-slate-500 text-center">
          No profiles found. Run an ETL to import data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Recent Profiles</h2>
        <p className="text-sm text-slate-600 mt-1">
          Latest {profiles.length} profiles processed
        </p>
      </div>
      <div className="divide-y divide-slate-200">
        {profiles.map((profile) => {
          // --- Normalize validation_errors to an array of { message: string } ---
          const raw = (profile as any)?.validation_errors;
          const errorsArray = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const normalizedErrors = errorsArray.map((e: any) =>
            typeof e === 'string' ? { message: e } : e
          );
          // ----------------------------------------------------------------------

          return (
            <div key={profile.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {profile.full_name}
                    </h3>
                    {getValidationBadge((profile as any)?.validation_status)}
                  </div>

                  {profile.headline && (
                    <p className="text-slate-700 mb-2">{profile.headline}</p>
                  )}

                  {profile.location && (
                    <p className="text-sm text-slate-600 mb-3">{profile.location}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {(profile.connections_count ?? 0) > 0 && (
                      <div>
                        <span className="font-medium">{profile.connections_count}</span>{' '}
                        connections
                      </div>
                    )}
                    {profile.experience && profile.experience.length > 0 && (
                      <div>
                        <span className="font-medium">{profile.experience.length}</span>{' '}
                        experiences
                      </div>
                    )}
                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <span className="font-medium">{profile.skills.length}</span> skills
                      </div>
                    )}
                  </div>

                  {normalizedErrors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Validation Issues:
                      </p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {normalizedErrors.slice(0, 3).map((error: any, idx: number) => (
                          <li key={idx}>• {error?.message ?? String(error)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {profile.profile_url && (
                    <a
                      href={profile.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  <div className="text-xs text-slate-500 text-right">
                    <div>Updated</div>
                    <div>{formatDate(profile.updated_at as any)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
