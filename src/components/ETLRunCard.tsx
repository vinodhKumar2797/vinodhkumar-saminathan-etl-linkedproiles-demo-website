import { ETLRun } from '../types/linkedin';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface ETLRunCardProps {
  run: ETLRun;
}

export default function ETLRunCard({ run }: ETLRunCardProps) {
  const getStatusIcon = () => {
    switch (run.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (run.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    if (!run.completed_at) return 'In progress...';
    const start = new Date(run.started_at).getTime();
    const end = new Date(run.completed_at).getTime();
    const seconds = Math.round((end - start) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm capitalize">{run.run_type} ETL</span>
        </div>
        <span className="text-xs text-slate-600">{formatDate(run.started_at)}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-600 mb-1">Processed</div>
          <div className="font-semibold">{run.profiles_processed}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Added
          </div>
          <div className="font-semibold text-green-700">{run.profiles_added}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Updated
          </div>
          <div className="font-semibold text-blue-700">{run.profiles_updated}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-200">
        <span>{run.profiles_unchanged} unchanged</span>
        <span>Duration: {getDuration()}</span>
      </div>

      {run.validation_failures > 0 && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          {run.validation_failures} validation failures
        </div>
      )}
    </div>
  );
}
