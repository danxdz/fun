import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FolderIcon, 
  CogIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import apiClient from '../config/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery('dashboard', () =>
    apiClient.get('/api/dashboard').then(res => res.data)
  );


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="empty-state">
          <div className="empty-state-icon">
            <CodeBracketIcon className="h-16 w-16 text-blue-600 animate-pulse" />
          </div>
          <h2 className="empty-state-title">Loading Dashboard</h2>
          <p className="empty-state-description">Preparing your automation overview...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.statistics || {
    projects: { total: 0, active: 0, github: 0 },
    bots: { total: 0, running: 0, completed: 0, failed: 0 },
    runs: { total: 0, completed: 0, failed: 0, running: 0 },
    github: { totalStars: 0, totalForks: 0, totalIssues: 0 }
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const weeklyActivity = dashboardData?.weeklyActivity || [];
  const projects = dashboardData?.projects || [];
  const bots = dashboardData?.bots || [];

  // Prepare chart data with null checks
  const chartData = (weeklyActivity || []).map(day => ({
    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    runs: day.runs || 0,
    completed: day.completed || 0,
    failed: day.failed || 0
  }));

  const botTypeData = Object.entries(stats.bots?.byType || {}).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count || 0
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header page-header-gradient-blue">
        <div className="flex items-center">
          <div className="page-header-icon">
            <CodeBracketIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="page-header-title">Automation Dashboard</h1>
            <p className="page-header-subtitle">
              Monitor your projects, bots, and automation workflows
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-responsive">
        <div className="stats-card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="stats-card-icon">
                <FolderIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4 flex-1">
                <dl>
                  <dt className="stats-card-label">Total Projects</dt>
                  <dd className="stats-card-value">{stats.projects.total}</dd>
                  <dd className="stats-card-subtitle">{stats.projects.active} active</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="stats-card-icon">
                <CogIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4 flex-1">
                <dl>
                  <dt className="stats-card-label">Total Bots</dt>
                  <dd className="stats-card-value">{stats.bots.total}</dd>
                  <dd className="stats-card-subtitle">{stats.bots.running} running</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="stats-card-icon">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4 flex-1">
                <dl>
                  <dt className="stats-card-label">Bot Runs</dt>
                  <dd className="stats-card-value">{stats.runs.total}</dd>
                  <dd className="stats-card-subtitle">{stats.runs.completed} completed</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="stats-card-icon">
                <StarIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4 flex-1">
                <dl>
                  <dt className="stats-card-label">GitHub Stars</dt>
                  <dd className="stats-card-value">{stats.github.totalStars}</dd>
                  <dd className="stats-card-subtitle">{stats.github.totalForks} forks</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Activity Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="runs" stroke="#3b82f6" strokeWidth={2} name="Total Runs" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bot Types */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Bot Types</h3>
          </div>
          <div className="card-body">
            {(botTypeData || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={botTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(botTypeData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p className="text-gray-500 text-sm">No bots created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity and Projects */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {(recentActivity || []).length > 0 ? (
                (recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`status-indicator status-${activity.status}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`badge ${
                        activity.status === 'completed' ? 'badge-success' :
                        activity.status === 'failed' || activity.status === 'error' ? 'badge-danger' :
                        activity.status === 'running' ? 'badge-info' :
                        'badge-gray'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {(projects || []).slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center space-x-3">
                  <FolderIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {project.githubData ? (
                        <span className="flex items-center">
                          <StarIcon className="h-3 w-3 text-yellow-400 mr-1" />
                          {project.githubData.stars || 0} stars
                        </span>
                      ) : (
                        'No GitHub data'
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`badge ${
                      project.status === 'active' ? 'badge-success' : 'badge-gray'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
              {(projects || []).length === 0 && (
                <div className="empty-state">
                  <p className="text-gray-500 text-sm">No projects yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/projects"
              className="relative group bg-white p-6 rounded-xl border border-gray-200 hover:shadow-medium transition-all duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                  <FolderIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Add New Project
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create or import a GitHub repository
                </p>
              </div>
            </Link>

            <Link
              to="/bots"
              className="relative group bg-white p-6 rounded-xl border border-gray-200 hover:shadow-medium transition-all duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-success-50 text-success-700 ring-4 ring-white">
                  <CogIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Create Bot
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Set up AI-powered automation workflows
                </p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="relative group bg-white p-6 rounded-xl border border-gray-200 hover:shadow-medium transition-all duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View Profile
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your account settings and preferences
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}