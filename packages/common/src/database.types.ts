export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          company: string
          created_at: string
          date_applied: string
          id: number
          industry: string | null
          job_description: string | null
          source: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          date_applied?: string
          id?: number
          industry?: string | null
          job_description?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          date_applied?: string
          id?: number
          industry?: string | null
          job_description?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          resume_name: string
          resume_text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resume_name: string
          resume_text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resume_name?: string
          resume_text?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          professional_summary: string | null
          skills: string[] | null
          experience_level: string | null
          industry: string | null
          location: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scrape_configs: {
        Row: {
          id: number
          user_id: string
          platform: string
          keywords: string[]
          location: string | null
          remote_only: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          platform: string
          keywords: string[]
          location?: string | null
          remote_only?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          platform?: string
          keywords?: string[]
          location?: string | null
          remote_only?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          professional_summary: string | null
          skills: string[] | null
          experience_level: string | null
          industry: string | null
          location: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          phone: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
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
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
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
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_analytics: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_applications: number
          applications_last_7_days: number
          applications_last_30_days: number
          response_rate: number
          interview_rate: number
          most_active_industry: string
          most_common_status: string
          average_response_days: number
          recent_activity: Json[]
        }[]
      }
      get_recent_activity: {
        Args: {
          user_uuid: string
          days_limit?: number
        }
        Returns: {
          id: number
          company: string
          title: string
          status: string
          date_applied: string
          created_at: string
          source: string
        }[]
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
