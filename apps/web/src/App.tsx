import '@/App.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PostHogProvider from './components/PostHogProvider';
import SigninPage from '@/pages/SigninPage';
import SignupPage from '@/pages/SignupPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResumeTailorPage from '@/pages/ResumeTailorPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CoverLetterPage from '@/pages/CoverLetterPage';
import LandingPage from '@/pages/LandingPage';
import RootLayout from '@/components/RootLayout';
import AppLayout from '@/components/AppLayout';
import InstallExtensionPage from '@/pages/InstallExtensionPage';
import Settings from '@/pages/Settings';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import { ThemeProvider } from '@/components/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorPage from '@/pages/ErrorPage';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <PostHogProvider>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <Routes>
                    <Route element={<RootLayout />}>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/signin" element={<SigninPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/update-password" element={<UpdatePasswordPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/auth/confirm" element={<AuthCallbackPage />} />
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
                      <Route path="/cover-letter" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <CoverLetterPage />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/error" element={<ErrorPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </div>
              </Router>
            </PostHogProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
