/**
 * @file Supabase client configuration for the Jata web application.
 *
 * This file initializes and exports the Supabase client instance, making it
 * available for use throughout the frontend application. It retrieves the
 * necessary Supabase URL and anonymous key from environment variables.
 *
 * The client is typed using the generated `Database` types from the
 * common package to ensure end-to-end type safety between the frontend
 * and the Supabase backend.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../packages/common/types/database';

/**
 * The Supabase project URL, retrieved from environment variables.
 *
 * @remarks
 * This variable is essential for connecting to the correct Supabase project.
 * It must be set in the `.env` file as `VITE_SUPABASE_URL`.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * The Supabase anonymous key, retrieved from environment variables.
 *
 * @remarks
 * This key is safe to be publicly exposed and is used for client-side
 * authentication and data fetching. It must be set in the `.env` file as
 * `VITE_SUPABASE_ANON_KEY`.
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The singleton Supabase client instance.
 *
 * @remarks
 * This typed client is used for all interactions with the Supabase backend,
 * providing authentication, database operations, and other Supabase services.
 * It ensures that all operations are type-safe based on the database schema.
 */
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
