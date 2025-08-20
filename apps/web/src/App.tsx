import '@/App.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SigninPage from '@/pages/SigninPage';
import SignupPage from '@/pages/SignupPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResumeTailorPage from '@/pages/ResumeTailorPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import LandingPage from '@/pages/LandingPage';
import RootLayout from '@/components/RootLayout';
import AppLayout from '@/components/AppLayout';
import InstallExtensionPage from '@/pages/InstallExtensionPage';
import Settings from '@/pages/Settings';

import { ThemeProvider } from '@/components/ThemeProvider';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
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
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
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
              </Route>
            </Routes>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
