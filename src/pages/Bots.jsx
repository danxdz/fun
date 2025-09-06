import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  CogIcon, 
  PlayIcon, 
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import apiClient from '../config/axios';

export default function Bots() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBot, setNewBot] = useState({
    name: '',
    type: 'module_update',
    description: '',
    projectId: '',
    schedule: '',
    config: {}
  });
  const { data: botsData, isLoading, refetch } = useQuery('bots', () =>
    apiClient.get('/api/bots').then(res => res.data)
  );

  const bots = botsData?.bots || [];

  const handleCreateBot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/api/bots', newBot);
      setShowCreateModal(false);
      setNewBot({
        name: '',
        type: 'module_update',
        description: '',
        projectId: '',
        schedule: '',
        config: {}
      });
      refetch();
    } catch (error) {
      alert('Failed to create bot: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async (botId) => {
    setLoading(true);
    try {
      await apiClient.post('/api/bots', {
        action: 'start',
        botId: botId
      });
      refetch(); // Refresh the bots list
    } catch (error) {
      console.error('Failed to start bot:', error);
      alert('Failed to start bot: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async (botId) => {
    setLoading(true);
    try {
      await apiClient.post('/api/bots', {
        action: 'stop',
        botId: botId
      });
      refetch(); // Refresh the bots list
    } catch (error) {
      console.error('Failed to stop bot:', error);
      alert('Failed to stop bot: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'idle':
        return <ClockIcon className="h-4 w-4" />;
      case 'paused':
        return <StopIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
              Automation Bots
            </h1>
            <p className="mt-2 text-gray-600">
              Streamline your development workflow with intelligent automation
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Bot
          </button>
        </div>
      </div>

      {/* Bots Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner" />
        </div>
      ) : (bots || []).length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CogIcon className="h-8 w-8 text-gray-400" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link to={`/bots/${bot.id}`} className="hover:text-primary-600">
                        {bot.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {bot.type.replace('_', ' ')}
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
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Total Runs</span>
                  <span>{bot.BotRuns?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Last Run</span>
                  <span>
                    {bot.BotRuns?.length > 0 
                      ? new Date(bot.BotRuns[0].createdAt).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => handleStartBot(bot.id)}
                  disabled={bot.status === 'running'}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  {bot.status === 'running' ? 'Running...' : 'Start'}
                </button>
                <button 
                  onClick={() => handleStopBot(bot.id)}
                  disabled={bot.status !== 'running'}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopIcon className="h-4 w-4 mr-1" />
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <CogIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bots yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Create your first automation bot to streamline your development workflow. 
            Choose from module updates, security scans, or custom automation.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Bot
          </button>
        </div>
      )}

      {/* Create Bot Modal */}
      {showCreateModal && (
        <CreateBotModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateBotModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [botData, setBotData] = useState({
    name: '',
    type: 'module_update',
    description: '',
    projectId: '',
    schedule: '',
    config: {}
  });

  const { data: projectsData } = useQuery('projects', () =>
    apiClient.get('/api/projects').then(res => res.data)
  );

  const projects = projectsData?.projects || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/api/bots', botData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create bot:', error);
      setError(error.response?.data?.error || 'Failed to create bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Bot</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Bot Name
              </label>
              <input
                type="text"
                id="name"
                value={botData.name}
                onChange={(e) => setBotData({ ...botData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="My Automation Bot"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Bot Type
              </label>
              <select
                id="type"
                value={botData.type}
                onChange={(e) => setBotData({ ...botData, type: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="module_update">📦 Module Update Bot</option>
                <option value="dependency_update">🔧 Dependency Update Bot</option>
                <option value="security_scan">🔒 Security Scan Bot</option>
                <option value="custom">⚙️ Custom Bot</option>
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                id="projectId"
                value={botData.projectId}
                onChange={(e) => setBotData({ ...botData, projectId: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
                Schedule (Cron Expression)
              </label>
              <input
                type="text"
                id="schedule"
                value={botData.schedule}
                onChange={(e) => setBotData({ ...botData, schedule: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0 0 * * * (daily at midnight)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for manual execution only. Use cron format: minute hour day month weekday
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={botData.description}
                onChange={(e) => setBotData({ ...botData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Describe what this bot does..."
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Bot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}