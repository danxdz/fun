import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  UserIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CodeBracketIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showTokens, setShowTokens] = useState({ cursor: false, github: false });

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    githubUsername: user?.githubUsername || '',
    githubAvatar: user?.githubAvatar || '',
    cursorApiKey: user?.cursorApiKey || '',
    githubToken: user?.githubToken || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Don't send email in profile update - it's managed by auth system
    const { email, ...profileDataToUpdate } = profileData;
    console.log('Updating profile with data:', profileDataToUpdate);
    const result = await updateProfile(profileDataToUpdate);
    console.log('Profile update result:', result);
    
    if (result.success) {
      setMessage('Profile updated successfully!');
    } else {
      let errorMessage = result.error;
      if (result.details) {
        errorMessage += ` (Details: ${result.details})`;
      }
      if (result.hint) {
        errorMessage += ` (Hint: ${result.hint})`;
      }
      setMessage(errorMessage);
    }
    
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setMessage('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setMessage(result.error);
    }
    
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setMessage('');

    const result = await deleteAccount();
    
    if (result.success) {
      setMessage('Account deleted successfully. You will be redirected to the login page.');
      // The AuthContext will handle clearing the user state
    } else {
      setMessage(result.error);
    }
    
    setLoading(false);
  };

  const toggleTokenVisibility = (tokenType) => {
    setShowTokens(prev => ({ ...prev, [tokenType]: !prev[tokenType] }));
  };

  const maskToken = (token) => {
    if (!token) return '';
    return token.length > 8 ? `${token.substring(0, 4)}${'*'.repeat(token.length - 8)}${token.substring(token.length - 4)}` : '****';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="page-header page-header-gradient-purple">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {user?.githubAvatar ? (
                <img
                  src={user.githubAvatar}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-purple-600" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="page-header-title flex items-center">
                <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.githubUsername || 'Profile'
                }
              </h1>
              <p className="page-header-subtitle">
                {user?.githubUsername && `@${user.githubUsername}`}
              </p>
              <div className="flex items-center mt-2">
                <span className="badge badge-success">
                  ✓ Active Account
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Manage your account settings, API keys, and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.includes('successfully') ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'integrations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <KeyIcon className="h-5 w-5" />
                <span>Integrations</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <KeyIcon className="h-5 w-5" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'danger'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Danger Zone</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Information */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email is managed by your GitHub account and cannot be changed here.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* GitHub Integration */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <CodeBracketIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">GitHub Integration</h3>
                      <p className="text-sm text-gray-600">Connected via OAuth - no manual token needed!</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Username
                      </label>
                      <input
                        type="text"
                        value={profileData.githubUsername}
                        onChange={(e) => setProfileData({ ...profileData, githubUsername: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="your-github-username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Avatar URL
                      </label>
                      <input
                        type="url"
                        value={profileData.githubAvatar}
                        onChange={(e) => setProfileData({ ...profileData, githubAvatar: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="https://avatars.githubusercontent.com/u/..."
                      />
                      {profileData.githubAvatar && (
                        <div className="mt-3 flex items-center space-x-3">
                          <img
                            src={profileData.githubAvatar}
                            alt="GitHub Avatar"
                            className="h-12 w-12 rounded-full border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div>
                            <p className="text-sm text-gray-600">Avatar Preview</p>
                            <p className="text-xs text-gray-500">This will be displayed in your profile</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cursor API Key */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <ComputerDesktopIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Cursor API Key</h3>
                      <p className="text-sm text-gray-600">For AI-powered automation features</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cursor API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showTokens.cursor ? 'text' : 'password'}
                        value={profileData.cursorApiKey}
                        onChange={(e) => setProfileData({ ...profileData, cursorApiKey: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your Cursor API key"
                      />
                      <button
                        type="button"
                        onClick={() => toggleTokenVisibility('cursor')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens.cursor ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Get your API key from Cursor settings → Account → API Keys
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Password Management
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Since you're using GitHub OAuth, your password is managed by GitHub. 
                          To change your password, please visit your GitHub account settings.
                        </p>
                      </div>
                      <div className="mt-3">
                        <a
                          href="https://github.com/settings/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                        >
                          Go to GitHub Security Settings →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">GitHub OAuth</p>
                          <p className="text-sm text-gray-600">Securely connected via GitHub</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <KeyIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">GitHub Token</p>
                          <p className="text-sm text-gray-600">
                            {profileData.githubToken ? maskToken(profileData.githubToken) : 'Not configured'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profileData.githubToken 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profileData.githubToken ? 'Configured' : 'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800">
                        Delete Account
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Once you delete your account, there is no going back. Please be certain.
                          This action will permanently delete your account and all associated data.
                        </p>
                      </div>
                      <div className="mt-4">
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-red-800">
                              Are you absolutely sure? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}