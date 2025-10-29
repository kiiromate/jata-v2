import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Puzzle, FileText, BarChart2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const DashboardWelcomeCard: React.FC = () => {
  const { openModal } = useDashboardStore();

  return (
    <Card className="mb-md">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back!</CardTitle>
        <CardDescription>
          Quick actions to help you manage your job search
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 gap-2"
            onClick={openModal}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Add Application</span>
          </Button>
          
          <Link to="/install-extension">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 gap-2 w-full"
            >
              <Puzzle className="h-5 w-5" />
              <span className="text-sm">Install Extension</span>
            </Button>
          </Link>
          
          <Link to="/cover-letter">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 gap-2 w-full"
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Generate Cover Letter</span>
            </Button>
          </Link>
          
          <Link to="/analytics">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 gap-2 w-full"
            >
              <BarChart2 className="h-5 w-5" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardWelcomeCard;
