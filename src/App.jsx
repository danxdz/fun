import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
// import { SocketProvider } from './contexts/SocketContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Bots from './pages/Bots.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import BotDetail from './pages/BotDetail.jsx';
import Profile from './pages/Profile.jsx';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, stopRendering: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  stopRendering = () => {
    this.setState({ stopRendering: true });
  }

  render() {
    if (this.state.stopRendering) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⏹️ Rendering Stopped</h2>
              <p className="text-gray-700 mb-4">
                Application rendering has been manually stopped.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
              >
                Restart App
              </button>
              <button
                onClick={() => this.setState({ stopRendering: false })}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Resume Rendering
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">🚨 Application Error</h2>
              <p className="text-gray-700 mb-4">
                Something went wrong. Please refresh the page or contact support.
              </p>
              <details className="text-left text-sm text-gray-600 mb-4">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
              <div className="space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.stopRendering}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Stop Rendering
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  console.log('PrivateRoute: user:', user, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-500 text-white p-4 rounded">
          🔄 Loading authentication... User: {user ? 'present' : 'missing'}
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  console.log('PrivateRoute: User authenticated, rendering children');
  return children;
}

function App() {
  console.log('App component starting to render...');
  
  const [stopRendering, setStopRendering] = React.useState(false);
  
  if (stopRendering) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⏹️ Rendering Stopped</h2>
            <p className="text-gray-700 mb-4">
              Application rendering has been manually stopped.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Restart App
            </button>
            <button
              onClick={() => setStopRendering(false)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Resume Rendering
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="App">
              {/* Emergency Stop Button */}
              <div className="fixed top-4 right-4 z-50">
                <button
                  onClick={() => setStopRendering(true)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-700 shadow-lg"
                >
                  ⏹️ STOP
                </button>
              </div>
              
              {/* Debug Banner */}
              <div className="bg-red-500 text-white p-2 text-center text-sm font-bold">
                🚨 DEBUG MODE - App is rendering successfully
              </div>
              <div className="bg-blue-500 text-white p-2 text-center text-sm">
                ✅ React Query and Auth Provider loaded
              </div>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="bots" element={<Bots />} />
                <Route path="bots/:id" element={<BotDetail />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    );
  } catch (error) {
    console.error('App component error:', error);
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: 'white' }}>
        <h1>🚨 App Error</h1>
        <p><strong>Error:</strong> {error.message}</p>
        <details>
          <summary>Stack Trace</summary>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>{error.stack}</pre>
        </details>
        <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '10px' }}>
          Reload Page
        </button>
      </div>
    );
  }
}

// Wrap App with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;