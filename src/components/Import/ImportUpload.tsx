import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ImportService } from '../../services/import';
import { ETLService } from '../../services/etl';
import { auth } from '../../lib/auth';

interface ImportUploadProps {
  onImportComplete: () => void;
}

const importService = new ImportService();
const etlService = new ETLService();

export default function ImportUpload({ onImportComplete }: ImportUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setError('Please select files to import');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const runId = await etlService.startETLRun('incremental');
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const file of files) {
        const text = await file.text();
        let profiles = [];

        if (file.name.endsWith('.csv')) {
          profiles = await importService.parseCSV(text);
        } else if (file.name.endsWith('.json')) {
          profiles = await importService.parseJSON(text);
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        const stats = {
          profiles_processed: 0,
          profiles_added: 0,
          profiles_updated: 0,
          profiles_unchanged: 0,
          images_processed: 0,
          validation_failures: 0,
        };

        for (const profile of profiles) {
          try {
            const result = await etlService.processProfile(profile, runId);
            stats.profiles_processed++;

            if (result === 'added') {
              stats.profiles_added++;
            } else if (result === 'updated') {
              stats.profiles_updated++;
            } else {
              stats.profiles_unchanged++;
            }

            totalSuccess++;
          } catch (err) {
            totalFailed++;
          }
        }

        await importService.logImport(
          user.id,
          file.name.endsWith('.csv') ? 'csv' : 'json',
          file.name,
          profiles.length,
          totalSuccess,
          totalFailed
        );
      }

      await etlService.completeETLRun(runId, {
        profiles_processed: totalSuccess + totalFailed,
        profiles_added: totalSuccess,
        profiles_updated: 0,
        profiles_unchanged: 0,
        images_processed: 0,
        validation_failures: totalFailed,
      });

      setResults({
        success: totalSuccess,
        failed: totalFailed,
        fileName: files.map(f => f.name).join(', '),
      });

      setTimeout(() => {
        setFiles([]);
        onImportComplete();
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Import completed</h3>
            <p className="text-sm text-green-700 mt-1">
              {results.success} profiles imported successfully
              {results.failed > 0 && ` (${results.failed} failed)`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
      <div className="text-center mb-4">
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-900 mb-1">Upload profiles</h3>
        <p className="text-sm text-slate-600">CSV or JSON files accepted</p>
      </div>

      <div className="mb-4">
        <input
          type="file"
          multiple
          accept=".csv,.json"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:px-4 file:py-2 file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-900">Selected files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-700">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                type="button"
                className="text-slate-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || files.length === 0}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? 'Importing...' : 'Import profiles'}
      </button>
    </div>
  );
}
