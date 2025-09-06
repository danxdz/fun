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
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
              🎉 App Component is Rendering!
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
}

export default App;