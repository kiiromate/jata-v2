import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useDashboardStore } from '../store/dashboardStore';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useDashboardStore();

  const handleAddApplication = () => {
    navigate('/dashboard');
    openModal();
  };

  return (
    <Card className="w-[400px] mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Welcome to JATA!</CardTitle>
        <CardDescription className="text-center mt-2">
          Your ultimate companion for streamlining your job application process.
          Manage resumes, tailor applications, and track your progress with ease.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Get started by installing our browser extension to effortlessly scrape job descriptions,
          or manually add your first application.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
        <Button>Install Browser Extension</Button>
        <Button variant="outline" onClick={handleAddApplication}>Add First Application Manually</Button>
      </CardFooter>
    </Card>
  );
};

export default Welcome;
