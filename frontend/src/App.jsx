import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import CompanySelection from './pages/CompanySelection';
import SkillGap from './pages/SkillGap';
import Roadmap from './pages/Roadmap';
import MockInterview from './pages/MockInterview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col md:flex-row">
          <Navbar />
          <div className="flex-grow min-h-screen md:pl-64 flex flex-col">
            <main className="flex-grow p-4 md:p-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resume"
                  element={
                    <ProtectedRoute>
                      <ResumeUpload />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company"
                  element={
                    <ProtectedRoute>
                      <CompanySelection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/skill-gap"
                  element={
                    <ProtectedRoute>
                      <SkillGap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <ProtectedRoute>
                      <Roadmap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview"
                  element={
                    <ProtectedRoute>
                      <MockInterview />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
