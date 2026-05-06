export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          title: string
          company: string
          status: ApplicationStatus
          date_applied: string
          url: string | null
          source: string | null
          industry: string | null
          job_description: string | null
          jata_score: number | null
          final_resume_text: string | null
          selected_resume_id: string | null
          capture_source: string | null
          capture_method: string | null
          capture_status: string | null
          parse_status: string | null
          score_status: string | null
          duplicate_status: string | null
          duplicate_of_application_id: string | null
          capture_raw_input: Json
          capture_parsed_payload: Json
          capture_score_result: Json | null
          capture_dedupe_result: Json | null
          capture_action_log: Json
          archived_at: string | null
          promoted_at: string | null
          pack_requested_at: string | null
          parsed_at: string | null
          scored_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          company: string
          status?: ApplicationStatus
          date_applied: string
          url?: string | null
          source?: string | null
          industry?: string | null
          job_description?: string | null
          jata_score?: number | null
          final_resume_text?: string | null
          selected_resume_id?: string | null
          capture_source?: string | null
          capture_method?: string | null
          capture_status?: string | null
          parse_status?: string | null
          score_status?: string | null
          duplicate_status?: string | null
          duplicate_of_application_id?: string | null
          capture_raw_input?: Json
          capture_parsed_payload?: Json
          capture_score_result?: Json | null
          capture_dedupe_result?: Json | null
          capture_action_log?: Json
          archived_at?: string | null
          promoted_at?: string | null
          pack_requested_at?: string | null
          parsed_at?: string | null
          scored_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          company?: string
          status?: ApplicationStatus
          date_applied?: string
          url?: string | null
          source?: string | null
          industry?: string | null
          job_description?: string | null
          jata_score?: number | null
          final_resume_text?: string | null
          selected_resume_id?: string | null
          capture_source?: string | null
          capture_method?: string | null
          capture_status?: string | null
          parse_status?: string | null
          score_status?: string | null
          duplicate_status?: string | null
          duplicate_of_application_id?: string | null
          capture_raw_input?: Json
          capture_parsed_payload?: Json
          capture_score_result?: Json | null
          capture_dedupe_result?: Json | null
          capture_action_log?: Json
          archived_at?: string | null
          promoted_at?: string | null
          pack_requested_at?: string | null
          parsed_at?: string | null
          scored_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          filename: string
          content: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          content: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          content?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id?: string | null
          created_at?: string | null
          updated_at: string | null
          full_name: string | null
          email?: string | null
          avatar_url: string | null
          professional_summary?: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          has_completed_onboarding: boolean
        }
        Insert: {
          id: string
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          professional_summary?: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          has_completed_onboarding?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          professional_summary?: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          has_completed_onboarding?: boolean
        }
        Relationships: []
      }
      scrape_configs: {
        Row: {
          id: number
          user_id: string
          domain?: string
          field?: string
          selector?: string
          platform?: string
          keywords?: string[]
          location?: string | null
          remote_only?: boolean
          active?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          domain?: string
          field?: string
          selector?: string
          platform?: string
          keywords?: string[]
          location?: string | null
          remote_only?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          domain?: string
          field?: string
          selector?: string
          platform?: string
          keywords?: string[]
          location?: string | null
          remote_only?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          professional_summary: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          drive_folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          professional_summary?: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          drive_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          professional_summary?: string | null
          skills?: string[] | null
          experience_level?: string | null
          industry?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          phone?: string | null
          drive_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_recent_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          applications_submitted: number
          interviews_landed: number
          average_response_time_days: number | null
        }
      }
      get_application_time_series: {
        Args: Record<PropertyKey, never>
        Returns: {
          date: string
          applications: number
          interviews: number
          offers: number
        }[]
      }
      get_application_insights: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]
