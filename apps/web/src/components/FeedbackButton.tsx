import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackDialog, { FeedbackFormData } from './FeedbackDialog';
import { toast } from '@/hooks/use-toast';
import Tooltip from './Tooltip';

interface FeedbackButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
}

const FeedbackButton = ({ variant = 'icon', className = '', onSubmit }: FeedbackButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (data: FeedbackFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We\'ll review it soon.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Failed to submit feedback',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
        action: (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="text-sm underline"
          >
            Retry
          </button>
        ),
      });
      throw error; // Re-throw to let dialog handle loading state
    }
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setIsDialogOpen(true)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-100 ease-in-out
            ${className}
          `}
          aria-label="Submit Feedback"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="text-sm font-medium">Feedback</span>
        </button>
        <FeedbackDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  // Icon variant (for navigation)
  return (
    <>
      <Tooltip content="Submit Feedback" delay={300}>
        <button
          onClick={() => setIsDialogOpen(true)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-100 ease-in-out
            ${className}
          `}
          aria-label="Submit Feedback"
        >
          <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
          <span className="hidden md:inline text-sm font-medium whitespace-nowrap">
            Feedback
          </span>
        </button>
      </Tooltip>
      <FeedbackDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default FeedbackButton;
