import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useDashboardStore } from '../store/dashboardStore';
import CreateApplicationModal from './CreateApplicationModal';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useDashboardStore();

  const handleInstallExtension = () => {
    navigate('/install-extension');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <CreateApplicationModal />
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">👋</span>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to JATA</CardTitle>
          <CardDescription className="text-base">
            Your AI-powered job application tracking assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Get started by adding your first job application. You can either:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-2">
                <div className="text-2xl">🧩</div>
                <h3 className="font-semibold">Install Extension</h3>
                <p className="text-sm text-muted-foreground">
                  Capture job details automatically from any job board
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-2">
                <div className="text-2xl">✍️</div>
                <h3 className="font-semibold">Manual Entry</h3>
                <p className="text-sm text-muted-foreground">
                  Add applications manually with custom details
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
          <Button onClick={handleInstallExtension} size="lg" className="w-full sm:w-auto">
            Install Extension
          </Button>
          <Button variant="outline" onClick={openModal} size="lg" className="w-full sm:w-auto">
            Add Application Manually
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Welcome;
