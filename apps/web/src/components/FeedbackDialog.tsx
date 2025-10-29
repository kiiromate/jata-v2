import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

export interface FeedbackFormData {
  type: FeedbackType;
  message: string;
  page: string;
  userAgent: string;
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
}

const FeedbackDialog = ({ open, onOpenChange, onSubmit }: FeedbackDialogProps) => {
  const location = useLocation();
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ message?: string; type?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { message?: string; type?: string } = {};

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (message.trim().length > 1000) {
      newErrors.message = 'Message must not exceed 1000 characters';
    }

    if (!type) {
      newErrors.type = 'Please select a feedback type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackFormData = {
        type,
        message: message.trim(),
        page: location.pathname,
        userAgent: navigator.userAgent,
      };

      await onSubmit(feedbackData);

      // Reset form on success
      setMessage('');
      setType('bug');
      setErrors({});
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setMessage('');
        setType('bug');
        setErrors({});
      }
    }
  };

  const characterCount = message.length;
  const characterLimit = 1000;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Help us improve JATA by sharing your thoughts, reporting bugs, or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as FeedbackType)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="feedback-type" className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              placeholder="Describe your feedback in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              className={`min-h-[120px] resize-none ${errors.message ? 'border-red-500' : ''}`}
              maxLength={characterLimit}
            />
            <div className="flex justify-between items-center">
              <div>
                {errors.message && (
                  <p className="text-sm text-red-500">{errors.message}</p>
                )}
              </div>
              <p className={`text-xs ${characterCount > characterLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                {characterCount}/{characterLimit}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
