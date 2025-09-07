import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeftIcon,
  FolderIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CodeBracketIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import apiClient from '../config/axios';

export default function ProjectDetail() {
  const { id: projectId } = useParams();
  const [showGithubInfo, setShowGithubInfo] = useState(false);

  const { data: projectData, isLoading } = useQuery(['project-detail', projectId, showGithubInfo], () =>
    apiClient.get(`/api/project-detail?projectId=${projectId}&action=${showGithubInfo ? 'github-info' : 'basic'}`).then(res => res.data)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!projectData?.project) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const { project, githubInfo, bots } = projectData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {project.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {project.status}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
          {project.repositoryType === 'github' && (
            <button
              onClick={() => setShowGithubInfo(!showGithubInfo)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {showGithubInfo ? 'Hide' : 'Show'} GitHub Info
            </button>
          )}
        </div>
        
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Repository Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{project.repositoryType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Repository URL</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 flex items-center">
                <LinkIcon className="h-3 w-3 mr-1" />
                {project.repositoryUrl}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(project.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(project.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {project.githubData && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">GitHub Statistics</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-lg font-semibold text-gray-900">{project.githubData.stars || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Stars</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <CodeBracketIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-lg font-semibold text-gray-900">{project.githubData.forks || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Forks</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-1" />
                  <span className="text-lg font-semibold text-gray-900">{project.githubData.openIssues || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Issues</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <CodeBracketIcon className="h-4 w-4 text-blue-400 mr-1" />
                  <span className="text-lg font-semibold text-gray-900">{project.githubData.language || 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-500">Language</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GitHub Information */}
      {showGithubInfo && githubInfo && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Branches */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Branches</h3>
            <div className="space-y-2">
              {githubInfo.branches.slice(0, 5).map((branch) => (
                <div key={branch.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <CodeBracketIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                    {branch.protected && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Protected
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {branch.commit.sha.slice(0, 7)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Commits */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Commits</h3>
            <div className="space-y-3">
              {githubInfo.commits.slice(0, 5).map((commit) => (
                <div key={commit.sha} className="border-l-4 border-primary-200 pl-4">
                  <p className="text-sm text-gray-900">{commit.message}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>{commit.author.name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(commit.author.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bots */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Automation Bots</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {bots && bots.length > 0 ? (
            bots.map((bot) => (
              <div key={bot.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {bot.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bot.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{bot.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bot.status === 'running' ? 'bg-green-100 text-green-800' :
                      bot.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      bot.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bot.status}
                    </span>
                    <Link
                      to={`/bots/${bot.id}`}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
                
                {bot.runs && bot.runs.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Recent runs:</p>
                    <div className="mt-1 space-y-1">
                      {bot.runs.slice(0, 3).map((run) => (
                        <div key={run.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Run #{run.id.slice(-8)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            run.status === 'completed' ? 'bg-green-100 text-green-800' :
                            run.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {run.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bots yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create automation bots for this project.</p>
              <div className="mt-4">
                <Link
                  to={`/bots?projectId=${projectId}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create Bot
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}