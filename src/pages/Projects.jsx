import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, FolderIcon, StarIcon, CodeBracketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import apiClient from '../config/axios';

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: projectsData, isLoading, refetch } = useQuery('projects', () =>
    apiClient.get('/api/projects').then(res => res.data)
  );

  const projects = projectsData?.projects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your repositories and automation projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link to={`/projects/${project.id}`} className="hover:text-primary-600">
                      {project.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {project.description || 'No description'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Repository:</span>
                  <span className="text-gray-900 font-medium">{project.repositoryType}</span>
                </div>
                
                {project.githubData && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Language:</span>
                      <span className="text-gray-900 font-medium">{project.githubData.language || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Stars:</span>
                      <div className="flex items-center">
                        <StarIcon className="h-3 w-3 text-yellow-400 mr-1" />
                        <span className="text-gray-900 font-medium">{project.githubData.stars || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Forks:</span>
                      <div className="flex items-center">
                        <CodeBracketIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-gray-900 font-medium">{project.githubData.forks || 0}</span>
                      </div>
                    </div>
                    {project.githubData.openIssues > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Issues:</span>
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-400 mr-1" />
                          <span className="text-gray-900 font-medium">{project.githubData.openIssues}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first project.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
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

function CreateProjectModal({ onClose, onSuccess }) {
  const [createType, setCreateType] = useState('github'); // 'github' or 'import'
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGithubRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await apiClient.get('/api/projects?action=github-repos');
      setGithubRepos(response.data.repositories);
    } catch (error) {
      console.error('Failed to load GitHub repos:', error);
      setError('Failed to load GitHub repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleCreateGithubRepo = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/projects', {
        action: 'create-github',
        ...formData
      });
      
      if (response.data.setupSuccess) {
        alert('Repository created and set up successfully!');
      } else {
        alert('Repository created but setup failed. You can still use it.');
      }
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create repository');
    } finally {
      setLoading(false);
    }
  };

  const handleImportGithubRepo = async (repo) => {
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/projects', {
        action: 'import-github',
        repositoryUrl: repo.url,
        name: repo.name,
        description: repo.description
      });
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Project
                </h3>
                
                {/* Create Type Tabs */}
                <div className="mt-4">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCreateType('github')}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        createType === 'github'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Create New Repo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateType('import');
                        loadGithubRepos();
                      }}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        createType === 'import'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Import Existing
                    </button>
                  </div>
                </div>

                {createType === 'github' ? (
                  <CreateGithubRepoForm onSubmit={handleCreateGithubRepo} loading={loading} />
                ) : (
                  <ImportGithubRepoForm 
                    githubRepos={githubRepos}
                    loadingRepos={loadingRepos}
                    onImport={handleImportGithubRepo}
                    loading={loading}
                  />
                )}
                
                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateGithubRepoForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    templateType: 'basic'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Repository Name
        </label>
        <input
          type="text"
          name="name"
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={formData.name}
          onChange={handleChange}
          placeholder="my-awesome-project"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={formData.description}
          onChange={handleChange}
          placeholder="A brief description of your project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Template Type
        </label>
        <select
          name="templateType"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={formData.templateType}
          onChange={handleChange}
        >
          <option value="basic">Basic (README + .gitignore)</option>
          <option value="react">React App</option>
          <option value="node">Node.js App</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isPrivate"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          checked={formData.isPrivate}
          onChange={handleChange}
        />
        <label className="ml-2 block text-sm text-gray-900">
          Make this repository private
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Repository'}
      </button>
    </form>
  );
}

function ImportGithubRepoForm({ githubRepos, loadingRepos, onImport, loading }) {
  if (loadingRepos) {
    return (
      <div className="mt-4 flex justify-center items-center h-32">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (githubRepos.length === 0) {
    return (
      <div className="mt-4 text-center py-8">
        <p className="text-sm text-gray-500">No GitHub repositories found.</p>
        <p className="text-xs text-gray-400 mt-1">Make sure you have a GitHub token configured.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-3">Select a repository to import:</p>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {githubRepos.map((repo) => (
          <div
            key={repo.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onImport(repo)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{repo.name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {repo.description || 'No description'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span>{repo.language || 'N/A'}</span>
                  <span>⭐ {repo.stars}</span>
                  <span>🍴 {repo.forks}</span>
                  {repo.private && <span className="text-red-500">Private</span>}
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}