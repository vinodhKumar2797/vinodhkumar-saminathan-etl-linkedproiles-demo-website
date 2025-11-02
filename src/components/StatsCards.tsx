import { Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalProfiles: number;
    validProfiles: number;
    invalidProfiles: number;
    pendingProfiles: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {stats.totalProfiles}
        </div>
        <div className="text-sm text-slate-600">Total Profiles</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {stats.validProfiles}
        </div>
        <div className="text-sm text-slate-600">Valid Profiles</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {stats.invalidProfiles}
        </div>
        <div className="text-sm text-slate-600">Invalid Profiles</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {stats.pendingProfiles}
        </div>
        <div className="text-sm text-slate-600">Pending Validation</div>
      </div>
    </div>
  );
}
