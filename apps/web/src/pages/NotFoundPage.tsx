import React from 'react';
import { Link } from 'react-router-dom';
import ErrorDisplay from '../components/ErrorDisplay'; // Assuming relative path
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui button

const NotFoundPage: React.FC = () => {
  return (
    <ErrorDisplay
      title="404 - Page Not Found"
      message="Oops! The page you're looking for doesn't exist or has been moved."
      action={
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      }
    />
  );
};

export default NotFoundPage;
