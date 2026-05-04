/**
 * @file Feedback service for handling user feedback submissions
 * 
 * This service provides functionality to submit user feedback to Supabase,
 * including bugs, feature requests, improvements, and other feedback types.
 */

import { supabase } from '@/lib/supabaseClient';
import type { FeedbackFormData } from '@/components/FeedbackDialog';

export interface FeedbackSubmission extends FeedbackFormData {
  user_id?: string;
  status?: 'new' | 'reviewed' | 'resolved';
  created_at?: string;
  updated_at?: string;
}

/**
 * Submit user feedback to Supabase
 * 
 * @param feedbackData - The feedback data to submit
 * @returns Promise that resolves when feedback is successfully submitted
 * @throws Error if submission fails
 */
export async function submitFeedback(feedbackData: FeedbackFormData): Promise<void> {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      logErrorToSentry(authError, { context: 'feedback_auth' });
      throw new Error('Authentication failed. Please sign in and try again.');
    }

    if (!user) {
      throw new Error('You must be signed in to submit feedback.');
    }

    // Validate feedback data
    if (!feedbackData.message || feedbackData.message.trim().length < 10) {
      throw new Error('Feedback message must be at least 10 characters long.');
    }

    if (feedbackData.message.trim().length > 1000) {
      throw new Error('Feedback message must not exceed 1000 characters.');
    }

    const validTypes = ['bug', 'feature', 'improvement', 'other'];
    if (!validTypes.includes(feedbackData.type)) {
      throw new Error('Invalid feedback type.');
    }

    // Prepare feedback submission
    const submission: any = {
      user_id: user.id,
      type: feedbackData.type,
      message: feedbackData.message.trim(),
      page: feedbackData.page,
      user_agent: feedbackData.userAgent,
      status: 'new',
    };

    // Submit to Supabase
    const { error: insertError } = await (supabase as any)
      .from('feedback')
      .insert([submission]);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      logErrorToSentry(insertError, { 
        context: 'feedback_submission',
        feedbackType: feedbackData.type,
        page: feedbackData.page,
      });
      throw new Error('Failed to submit feedback. Please try again later.');
    }

    // Log successful submission for analytics
    console.log('Feedback submitted successfully:', {
      type: feedbackData.type,
      page: feedbackData.page,
    });

  } catch (error) {
    // Log error to Sentry
    if (error instanceof Error) {
      logErrorToSentry(error, {
        context: 'feedback_service',
        feedbackType: feedbackData.type,
      });
    }
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Log error to Sentry (or console if Sentry is not configured)
 * 
 * @param error - The error to log
 * @param context - Additional context information
 */
function logErrorToSentry(error: Error | unknown, context?: Record<string, unknown>): void {
  // TODO: Integrate with Sentry when available
  // For now, log to console with context
  console.error('Error logged:', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  });

  // When Sentry is configured, use:
  // import * as Sentry from '@sentry/react';
  // Sentry.captureException(error, {
  //   contexts: {
  //     feedback: context,
  //   },
  // });
}

/**
 * Get user's feedback history
 * 
 * @param limit - Maximum number of feedback items to retrieve
 * @returns Promise that resolves with user's feedback history
 */
export async function getUserFeedback(limit: number = 10): Promise<FeedbackSubmission[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await (supabase as any)
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logErrorToSentry(error, { context: 'get_user_feedback' });
      throw new Error('Failed to retrieve feedback history');
    }

    return data || [];
  } catch (error) {
    logErrorToSentry(error, { context: 'get_user_feedback' });
    throw error;
  }
}
