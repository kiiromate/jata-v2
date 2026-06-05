/**
 * @file Contact service for handling contact form submissions
 *
 * This service provides functionality to submit contact form data to Supabase,
 * including rate limiting and validation.
 */

import { supabase } from '@/lib/supabaseClient';
import { logError } from '@/lib/logger';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'support' | 'sales' | 'partnership' | 'other' | '';
}

export interface ContactSubmission extends ContactFormData {
  id?: string;
  status?: 'new' | 'in_progress' | 'resolved';
  created_at?: string;
}

// Rate limiting configuration
const RATE_LIMIT_KEY = 'contact_form_submissions';
const MAX_SUBMISSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if user has exceeded rate limit for contact form submissions
 *
 * @returns true if rate limit exceeded, false otherwise
 */
function checkRateLimit(): boolean {
  try {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);

    if (!storedData) {
      return false;
    }

    const submissions: number[] = JSON.parse(storedData);
    const now = Date.now();

    // Filter out submissions older than the rate limit window
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Update localStorage with filtered submissions
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));

    // Check if rate limit is exceeded
    return recentSubmissions.length >= MAX_SUBMISSIONS_PER_HOUR;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Allow submission if rate limit check fails
  }
}

/**
 * Record a new submission timestamp for rate limiting
 */
function recordSubmission(): void {
  try {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: number[] = storedData ? JSON.parse(storedData) : [];

    submissions.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Error recording submission:', error);
  }
}

/**
 * Validate contact form data
 *
 * @param data - The contact form data to validate
 * @throws Error if validation fails
 */
function validateContactData(data: ContactFormData): void {
  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters long.');
  }
  if (data.name.trim().length > 100) {
    throw new Error('Name must not exceed 100 characters.');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    throw new Error('Please enter a valid email address.');
  }

  // Validate subject
  if (!data.subject || data.subject.trim().length < 2) {
    throw new Error('Subject must be at least 2 characters long.');
  }
  if (data.subject.trim().length > 200) {
    throw new Error('Subject must not exceed 200 characters.');
  }

  // Validate message
  if (!data.message || data.message.trim().length < 20) {
    throw new Error('Message must be at least 20 characters long.');
  }
  if (data.message.trim().length > 2000) {
    throw new Error('Message must not exceed 2000 characters.');
  }

  // Validate category
  const validCategories = ['support', 'sales', 'partnership', 'other'];
  if (!data.category || !validCategories.includes(data.category)) {
    throw new Error('Please select a valid category.');
  }
}

/**
 * Submit contact form data to Supabase
 *
 * @param contactData - The contact form data to submit
 * @returns Promise that resolves when submission is successful
 * @throws Error if submission fails
 */
export async function submitContact(contactData: ContactFormData): Promise<void> {
  try {
    // Check rate limit
    if (checkRateLimit()) {
      throw new Error(
        `You've reached the maximum of ${MAX_SUBMISSIONS_PER_HOUR} submissions per hour. Please try again later.`
      );
    }

    // Validate contact data
    validateContactData(contactData);

    // Prepare submission
    const submission: ContactSubmission = {
      name: contactData.name.trim(),
      email: contactData.email.trim().toLowerCase(),
      subject: contactData.subject.trim(),
      message: contactData.message.trim(),
      category: contactData.category,
      status: 'new',
    };

    // Submit to Supabase
    const { error: insertError } = await (supabase as any)
      .from('contact_submissions')
      .insert([submission as any]);

    if (insertError) {
      logError(insertError, {
        context: 'contact_submission',
        category: contactData.category,
      }, 'contact');
      throw new Error('Failed to submit your message. Please try again later or email us directly at support@jata.app');
    }

    // Record submission for rate limiting
    recordSubmission();

    // Log successful submission for analytics
    console.log('Contact form submitted successfully:', {
      category: contactData.category,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    throw error;
  }
}

/**
 * Get remaining submissions allowed in current rate limit window
 *
 * @returns Number of submissions remaining
 */
export function getRemainingSubmissions(): number {
  try {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);

    if (!storedData) {
      return MAX_SUBMISSIONS_PER_HOUR;
    }

    const submissions: number[] = JSON.parse(storedData);
    const now = Date.now();

    // Filter out submissions older than the rate limit window
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    return Math.max(0, MAX_SUBMISSIONS_PER_HOUR - recentSubmissions.length);
  } catch (error) {
    console.error('Error getting remaining submissions:', error);
    return MAX_SUBMISSIONS_PER_HOUR;
  }
}
