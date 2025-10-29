import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast({
        title: 'Missing feedback',
        description: 'Please enter your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Store feedback in Supabase
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          message: feedback.trim(),
          email: email.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We appreciate your input.',
      });

      setFeedback('');
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'Unable to submit feedback. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-lg border border-border shadow-xl max-w-md w-full mx-4 p-6 z-10 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-medium mb-2 text-card-foreground">Send Feedback</h2>
        <p className="text-muted-foreground mb-6">
          Help us improve JATA by sharing your thoughts, suggestions, or reporting issues.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="feedback">Your Feedback *</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={5}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll only use this to follow up if needed
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
