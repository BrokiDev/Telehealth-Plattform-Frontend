'use client';

import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Clock, HardDrive, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recording {
  recording_id: string;
  visit_id: string;
  status: 'processing' | 'ready' | 'failed' | 'deleted';
  file_size_bytes?: bigint;
  duration_seconds?: number;
  format?: string;
  resolution?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

interface RecordingsListProps {
  visitId: string;
  userRole: 'provider' | 'patient' | 'admin';
}

export function RecordingsList({ visitId, userRole }: RecordingsListProps) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes?: bigint): string => {
    if (!bytes) return 'Unknown';
    const numBytes = Number(bytes);
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(2)} KB`;
    if (numBytes < 1024 * 1024 * 1024) return `${(numBytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(numBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Load recording
  const loadRecording = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get visit artifacts which includes recordings
      const artifacts = await apiService.getVisitArtifacts(visitId);
      if (artifacts.recordings && artifacts.recordings.length > 0) {
        // Convert to expected format
        const firstRecording = artifacts.recordings[0];
        setRecording({
          recording_id: firstRecording.recording_id,
          visit_id: visitId,
          status: (firstRecording.status as "processing" | "ready" | "failed" | "deleted") || "ready",
          file_size_bytes: BigInt(firstRecording.file_size || 0),
          duration_seconds: firstRecording.duration_seconds,
          format: firstRecording.format,
          created_at: firstRecording.created_at
        });
      } else {
        setRecording(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setRecording(null);
      } else {
        const errorMsg = err.response?.data?.error || err.message || 'Failed to load recording';
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete recording
  const handleDelete = async (hard: boolean = false) => {
    if (!recording) return;

    const confirmMessage = hard
      ? 'Are you sure you want to PERMANENTLY delete this recording? This cannot be undone.'
      : 'Are you sure you want to delete this recording? It can be recovered later.';

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      await apiService.deleteRecording(visitId, recording.recording_id, hard);
      toast.success(hard ? 'Recording permanently deleted' : 'Recording deleted');
      
      // Reload to show updated state
      await loadRecording();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete recording';
      toast.error(errorMsg);
      console.error('❌ Error deleting recording:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Download recording
  const handleDownload = () => {
    if (!recording?.downloadUrl) {
      toast.error('Download URL not available');
      return;
    }

    window.open(recording.downloadUrl, '_blank');
    toast.success('Opening download link...');
  };

  useEffect(() => {
    loadRecording();
    
    // Refresh every 30 seconds if processing
    const interval = setInterval(() => {
      if (recording?.status === 'processing') {
        loadRecording();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [visitId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading recording...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-600 py-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button onClick={loadRecording} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!recording) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <HardDrive className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No recording available for this visit</p>
            <p className="text-sm mt-1">Recording must be enabled during the call</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recording</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Badge */}
        <div className="mb-4">
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            recording.status === 'ready' && 'bg-green-100 text-green-800',
            recording.status === 'processing' && 'bg-yellow-100 text-yellow-800',
            recording.status === 'failed' && 'bg-red-100 text-red-800',
            recording.status === 'deleted' && 'bg-gray-100 text-gray-800'
          )}>
            {recording.status === 'ready' && '✓ Ready'}
            {recording.status === 'processing' && '⏳ Processing...'}
            {recording.status === 'failed' && '✗ Failed'}
            {recording.status === 'deleted' && '🗑️ Deleted'}
          </span>
        </div>

        {/* Recording Details */}
        <div className="space-y-3">
          {recording.duration_seconds !== undefined && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(recording.duration_seconds)}</span>
            </div>
          )}

          {recording.file_size_bytes && (
            <div className="flex items-center text-sm">
              <HardDrive className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700">Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(recording.file_size_bytes)}</span>
            </div>
          )}

          {recording.format && (
            <div className="flex items-center text-sm">
              <span className="text-gray-700">Format:</span>
              <span className="ml-2 font-medium uppercase">{recording.format}</span>
            </div>
          )}

          {recording.resolution && (
            <div className="flex items-center text-sm">
              <span className="text-gray-700">Resolution:</span>
              <span className="ml-2 font-medium">{recording.resolution}</span>
            </div>
          )}

          <div className="flex items-center text-sm">
            <span className="text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">{formatDate(recording.created_at)}</span>
          </div>

          {recording.completed_at && (
            <div className="flex items-center text-sm">
              <span className="text-gray-700">Completed:</span>
              <span className="ml-2 text-gray-600">{formatDate(recording.completed_at)}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {recording.status === 'failed' && recording.error_message && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{recording.error_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Message */}
        {recording.status === 'processing' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⏳ Recording is being processed. This usually takes a few minutes. The page will refresh automatically.
            </p>
          </div>
        )}

        {/* Download URL Expiration */}
        {recording.status === 'ready' && recording.expiresAt && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            Download link expires: {formatDate(recording.expiresAt)}
          </div>
        )}

        {/* Actions */}
        {recording.status === 'ready' && (
          <div className="mt-6 flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Recording
            </Button>
            
            {(userRole === 'provider' || userRole === 'admin') && (
              <Button
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Deleted state with recovery option */}
        {recording.status === 'deleted' && userRole === 'admin' && (
          <div className="mt-4 text-center text-gray-500 text-sm">
            This recording has been soft-deleted and can be recovered by an administrator.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
