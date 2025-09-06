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
      <div style={{ padding: '20px', backgroundColor: 'lightblue', minHeight: '100vh' }}>
        <h1>Loading Dashboard...</h1>
        <p>Please wait while we load your data...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your automation projects and bots
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Projects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.projects.total}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {stats.projects.active} active
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bots
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.bots.total}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {stats.bots.running} running
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bot Runs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.runs.total}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {stats.runs.completed} completed
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    GitHub Stars
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.github.totalStars}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {stats.github.totalForks} forks
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Activity Chart */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Activity</h3>
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

        {/* Bot Types */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bot Types</h3>
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
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-sm">No bots created yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity and Projects */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'failed' || activity.status === 'error' ? 'bg-red-100 text-red-800' :
                      activity.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h3>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
            {(projects || []).length === 0 && (
              <p className="text-gray-500 text-sm">No projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/projects"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
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
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
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
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
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
  );
}