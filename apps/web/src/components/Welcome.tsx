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
    <>
      <CreateApplicationModal />
      <Card className="w-[400px] mx-auto my-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Welcome to JATA</CardTitle>
          <CardDescription className="text-center mt-2">
            Track your applications, tailor your resume, and analyze your job search.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Install the browser extension to capture job details from any job board,
            or add an application manually.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button onClick={handleInstallExtension}>Install Extension</Button>
          <Button variant="outline" onClick={openModal}>Add Application</Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default Welcome;
