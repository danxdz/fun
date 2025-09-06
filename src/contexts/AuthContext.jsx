import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider: Initializing...');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  console.log('AuthProvider: Initial state - user:', user, 'loading:', loading, 'token:', token ? 'present' : 'missing');

  // Token refresh function
  const refreshToken = async () => {
    try {
      console.log('AuthContext: Attempting token refresh...');
      const response = await apiClient.post('/api/auth/refresh');
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        console.log('AuthContext: Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('AuthContext: Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Token is handled by axios interceptor in src/config/axios.js

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Checking authentication...');
      console.log('AuthContext: Token exists:', !!token);
      if (token) {
        try {
          console.log('AuthContext: Making API call to /api/me...');
          const response = await apiClient.get('/api/me');
          console.log('AuthContext: API response:', response.data);
          setUser(response.data.user);
        } catch (error) {
          console.error('AuthContext: Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      const { token: newToken, user: userInfo } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userInfo);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile with data:', profileData);
      const response = await apiClient.put('/api/user/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Profile update failed',
        details: error.response?.data?.details || '',
        hint: error.response?.data?.hint || ''
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiClient.put('/api/users/password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Password change failed' 
      };
    }
  };

  const deleteAccount = async () => {
    try {
      await apiClient.delete('/api/user/profile');
      // Clear local state after successful deletion
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Account deletion failed' 
      };
    }
  };

  const loginWithGitHub = async () => {
    try {
      // Get GitHub OAuth URL from backend
      console.log('Initiating GitHub OAuth...');
      const response = await apiClient.post('/api/auth/github');
      console.log('GitHub OAuth response:', response.data);
      const { url } = response.data;
      
      if (!url) {
        throw new Error('No OAuth URL received from server');
      }
      
      // Redirect to GitHub OAuth URL
      console.log('Redirecting to GitHub OAuth URL:', url);
      window.location.href = url;
      return { success: true };
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'GitHub login failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    loginWithGitHub,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};