import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  PlusIcon, 
  CogIcon, 
  PlayIcon, 
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import apiClient from '../config/axios';

export default function Bots() {
  const [searchParams] = useSearchParams();
  const preSelectedProjectId = searchParams.get('projectId');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedBotLogs, setSelectedBotLogs] = useState(null);
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
      // First start the bot
      await apiClient.post(`/api/bots/${botId}/start`);
      
      // Then execute the bot logic
      const response = await apiClient.post(`/api/bots/${botId}/execute`);
      
      refetch(); // Refresh the bots list
      alert(`Bot executed successfully! Check the logs for details.`);
      
      // Log the execution results
      console.log('Bot execution result:', response.data);
    } catch (error) {
      console.error('Failed to execute bot:', error);
      alert('Failed to execute bot: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async (botId) => {
    setLoading(true);
    try {
      await apiClient.post(`/api/bots/${botId}/stop`);
      refetch(); // Refresh the bots list
      alert('Bot stopped successfully!');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      alert('Failed to stop bot: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async (botId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/bot-runs?botId=${botId}`);
      setSelectedBotLogs(response.data.runs || []);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Failed to fetch bot logs:', error);
      alert('Failed to fetch bot logs: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId, botName) => {
    if (!window.confirm(`Are you sure you want to delete the bot "${botName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(`/api/bots/${botId}`);
      refetch(); // Refresh the bots list
      alert('Bot deleted successfully!');
    } catch (error) {
      console.error('Failed to delete bot:', error);
      alert('Failed to delete bot: ' + (error.response?.data?.error || error.message));
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
      <div className="page-header page-header-gradient-blue">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="page-header-icon">
              <CogIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="page-header-title">Automation Bots</h1>
              <p className="page-header-subtitle">
                Streamline your development workflow with intelligent automation
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-lg"
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
                  {bot.status === 'running' ? 'Running...' : 'Execute'}
                </button>
                <button 
                  onClick={() => handleViewLogs(bot.id)}
                  className="inline-flex justify-center items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📋 Logs
                </button>
                <button 
                  onClick={() => handleDeleteBot(bot.id, bot.name)}
                  disabled={loading}
                  className="inline-flex justify-center items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4" />
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
          preSelectedProjectId={preSelectedProjectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Bot Logs Modal */}
      {showLogsModal && (
        <BotLogsModal
          logs={selectedBotLogs}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedBotLogs(null);
          }}
        />
      )}
    </div>
  );
}

function CreateBotModal({ onClose, onSuccess, preSelectedProjectId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [botData, setBotData] = useState({
    name: '',
    type: 'module_update',
    description: '',
    projectId: preSelectedProjectId || '',
    schedule: '',
    config: {}
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery('projects', () =>
    apiClient.get('/api/projects').then(res => res.data)
  );

  const projects = projectsData?.projects || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!botData.name.trim()) {
      setError('Bot name is required');
      setLoading(false);
      return;
    }
    
    if (!botData.projectId) {
      setError('Please select a project');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/api/bots', botData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create bot:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to create bot';
      setError(errorMessage);
      
      // If the error mentions missing projects, provide helpful guidance
      if (errorMessage.includes('Project not found') || errorMessage.includes('does not belong to user')) {
        setError('No projects available. Please create a project first before creating a bot.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Create New Bot</h3>
              {projects.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Need a project first? <Link to="/projects" className="text-blue-600 hover:text-blue-800">Go to Projects</Link>
                </p>
              )}
            </div>
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
                {preSelectedProjectId && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    (Pre-selected from project page)
                  </span>
                )}
              </label>
              <select
                id="projectId"
                value={botData.projectId}
                onChange={(e) => setBotData({ ...botData, projectId: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  preSelectedProjectId ? 'bg-green-50 border-green-300' : ''
                }`}
                required
                disabled={projectsLoading || projects.length === 0}
              >
                <option value="">
                  {projectsLoading ? 'Loading projects...' : projects.length === 0 ? 'No projects available' : 'Select a project'}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  You need to create a project first. Go to the Projects page to create one.
                </p>
              )}
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

            {/* Bot-specific configuration */}
            {botData.type === 'module_update' && (
              <div>
                <label htmlFor="modules" className="block text-sm font-medium text-gray-700">
                  Modules to Check
                </label>
                <input
                  type="text"
                  id="modules"
                  value={botData.config.modules || ''}
                  onChange={(e) => setBotData({ 
                    ...botData, 
                    config: { ...botData.config, modules: e.target.value.split(',').map(m => m.trim()) }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="react, axios, lodash (comma-separated)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Specify which modules to check for updates
                </p>
              </div>
            )}

            {botData.type === 'security_scan' && (
              <div>
                <label htmlFor="scanLevel" className="block text-sm font-medium text-gray-700">
                  Scan Level
                </label>
                <select
                  id="scanLevel"
                  value={botData.config.scanLevel || 'medium'}
                  onChange={(e) => setBotData({ 
                    ...botData, 
                    config: { ...botData.config, scanLevel: e.target.value }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="low">Low - Basic checks only</option>
                  <option value="medium">Medium - Standard security checks</option>
                  <option value="high">High - Comprehensive security scan</option>
                </select>
              </div>
            )}

            {botData.type === 'custom' && (
              <div>
                <label htmlFor="customScript" className="block text-sm font-medium text-gray-700">
                  Custom Script/Command
                </label>
                <textarea
                  id="customScript"
                  value={botData.config.customScript || ''}
                  onChange={(e) => setBotData({ 
                    ...botData, 
                    config: { ...botData.config, customScript: e.target.value }
                  })}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="npm run test&#10;npm audit&#10;git status"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter commands or scripts to run (one per line)
                </p>
              </div>
            )}

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
                disabled={loading || projects.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : projects.length === 0 ? 'No Projects Available' : 'Create Bot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BotLogsModal({ logs, onClose }) {
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bot Execution Logs</h3>
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

          {logs && logs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((run, index) => (
                <div key={run.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(run.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(run.duration)}
                    </div>
                  </div>
                  
                  {run.logs && run.logs.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Log:</h4>
                      <div className="bg-black text-green-400 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                        {run.logs.map((log, logIndex) => (
                          <div key={logIndex} className="mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {run.results && Object.keys(run.results).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Results:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(run.results, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {run.error && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Error:</h4>
                      <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                        {run.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No execution logs found for this bot.</p>
              <p className="text-sm text-gray-400 mt-1">Execute the bot to see logs here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}