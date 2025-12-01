export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          balance_after: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          reference_id: string | null
          description: string | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          balance_after: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          reference_id?: string | null
          description?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          balance_after?: number
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          reference_id?: string | null
          description?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      generated_images: {
        Row: {
          id: string
          job_id: string
          user_id: string
          file_key: string
          public_url: string
          width: number | null
          height: number | null
          file_size: number | null
          is_favorite: boolean
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          file_key: string
          public_url: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_favorite?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          file_key?: string
          public_url?: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          is_favorite?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          upload_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          prompt: string
          parameters: Json
          credits_charged: number
          error_message: string | null
          retry_count: number
          max_retries: number
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          upload_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          prompt: string
          parameters?: Json
          credits_charged?: number
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          upload_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          prompt?: string
          parameters?: Json
          credits_charged?: number
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_key: string
          file_size: number
          mime_type: string
          width: number | null
          height: number | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_key: string
          file_size: number
          mime_type: string
          width?: number | null
          height?: number | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_key?: string
          file_size?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          created_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            isOneToMany: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          credit_balance: number
          tier: Database["public"]["Enums"]["user_tier"]
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          credit_balance?: number
          tier?: Database["public"]["Enums"]["user_tier"]
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          credit_balance?: number
          tier?: Database["public"]["Enums"]["user_tier"]
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            isOneToMany: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_description?: string
          p_reference_id?: string
          p_idempotency_key?: string
        }
        Returns: {
          success: boolean
          new_balance: number
          transaction_id: string
        }[]
      }
      consume_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_job_id: string
          p_description?: string
        }
        Returns: {
          success: boolean
          new_balance: number
        }[]
      }
      create_generation_job: {
        Args: {
          p_user_id: string
          p_upload_id: string
          p_prompt: string
          p_parameters?: Json
          p_credits?: number
        }
        Returns: {
          success: boolean
          job_id: string
          message: string
        }[]
      }
      refund_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_job_id: string
          p_description?: string
        }
        Returns: {
          success: boolean
          new_balance: number
        }[]
      }
    }
    Enums: {
      job_status: "pending" | "processing" | "completed" | "failed" | "cancelled"
      transaction_type: "purchase" | "generation" | "refund" | "bonus" | "expiration"
      user_tier: "free" | "pro" | "business"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}