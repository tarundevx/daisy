import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import InterviewSession from './pages/InterviewSession';
import { CodeAssessment } from './pages/CodeAssessment';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-tally-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-tally-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-tally-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/:sessionId" 
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/session/:scenarioId" 
            element={
              <ProtectedRoute>
                <InterviewSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route path="/code" element={<CodeAssessment />} />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
