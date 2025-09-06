import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeftIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import apiClient from '../config/axios';

export default function BotDetail() {
  const { botId } = useParams();
  const [selectedRun, setSelectedRun] = useState(null);

  const { data: botData, isLoading: botLoading } = useQuery(['bot', botId], () =>
    apiClient.get('/api/bots').then(res => res.data.bots.find(bot => bot.id === botId))
  );

  const { data: runsData, isLoading: runsLoading } = useQuery(['bot-runs', botId], () =>
    apiClient.get(`/api/bot-runs?botId=${botId}`).then(res => res.data)
  );

  const bot = botData;
  const runs = runsData?.runs || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (botLoading || runsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Bot not found</h3>
        <p className="mt-1 text-sm text-gray-500">The bot you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            to="/bots"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Bots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/bots"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{bot.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {bot.type.replace('_', ' ')} • {bot.project?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(bot.status)}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bot.status)}`}>
            {bot.status}
          </span>
        </div>
      </div>

      {/* Bot Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bot Information</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{bot.type.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Project</dt>
            <dd className="mt-1 text-sm text-gray-900">{bot.project?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Repository</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <a href={bot.project?.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                {bot.project?.repositoryUrl}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(bot.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Bot Runs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Execution History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {runs.length > 0 ? (
            runs.map((run) => (
              <div key={run.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Run #{run.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Started {new Date(run.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                    <button
                      onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      {selectedRun?.id === run.id ? 'Hide' : 'View'} Details
                    </button>
                  </div>
                </div>
                
                {selectedRun?.id === run.id && (
                  <div className="mt-4 space-y-4">
                    {run.logs && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Execution Logs</h4>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {run.logs}
                        </pre>
                      </div>
                    )}
                    
                    {run.results && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Results</h4>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(run.results, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No runs yet</h3>
              <p className="mt-1 text-sm text-gray-500">This bot hasn't been executed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}