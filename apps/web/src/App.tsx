import './App.css';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ResumeTailorPage from './pages/ResumeTailorPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import LandingPage from './pages/LandingPage';
import AppLayout from './components/AppLayout';
import InstallExtensionPage from './pages/InstallExtensionPage';

import { ThemeProvider } from './components/ThemeProvider';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Navigate to="/login" />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/install-extension" element={<InstallExtensionPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route
                path="/resume-tailor/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ResumeTailorPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AnalyticsPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
