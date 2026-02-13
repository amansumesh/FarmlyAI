import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryHistoryItem } from '../../types/voice.types';
import { voiceService } from '../../services/voice.service';
import { AudioPlayer } from './AudioPlayer';

interface QueryHistoryListProps {
  limit?: number;
  showAll?: boolean;
}

export const QueryHistoryList: React.FC<QueryHistoryListProps> = ({ limit = 5, showAll = false }) => {
  const { t } = useTranslation();
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await voiceService.getQueryHistory({ limit: showAll ? 100 : limit });
        setQueries(response.queries);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch query history:', err);
        setError('Failed to load query history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limit, showAll]);

  const getQueryIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'disease_detection':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
    }
  };

  const getQueryTypeLabel = (type: string) => {
    switch (type) {
      case 'voice':
        return t('voice.title') || 'Voice Query';
      case 'disease_detection':
        return t('disease.title') || 'Disease Detection';
      default:
        return 'Query';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 rounded-full p-2 w-9 h-9"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="font-medium mb-1">No queries yet</p>
        <p className="text-sm">Start by using the voice assistant or disease detection</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queries.map((query) => (
        <div
          key={query._id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className={`rounded-full p-2 ${
            query.type === 'voice' ? 'bg-blue-100 text-blue-600' :
            query.type === 'disease_detection' ? 'bg-green-100 text-green-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {getQueryIcon(query.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500">
                {getQueryTypeLabel(query.type)}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(query.createdAt)}
              </p>
            </div>
            {query.input.text && (
              <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                {query.input.text}
              </p>
            )}
            <p className="text-sm text-gray-600 line-clamp-2">
              {query.response.text}
            </p>
            {query.response.audioUrl && (
              <div className="mt-2">
                <AudioPlayer audioUrl={query.response.audioUrl} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
