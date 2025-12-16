export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      account_deletion_audit: {
        Row: {
          created_at: string
          email: string
          id: string
          r2_files_queued: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          r2_files_queued?: number
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          r2_files_queued?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_feedback: {
        Row: {
          batch_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reasons: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reasons?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reasons?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_feedback_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_feedback_images: {
        Row: {
          batch_feedback_id: string
          image_id: string
        }
        Insert: {
          batch_feedback_id: string
          image_id: string
        }
        Update: {
          batch_feedback_id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_feedback_images_batch_feedback_id_fkey"
            columns: ["batch_feedback_id"]
            isOneToOne: false
            referencedRelation: "batch_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_feedback_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_items: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          generated_image_id: string | null
          id: string
          parameters: Json | null
          product_name: string | null
          prompt: string | null
          sequence_number: number
          source_image_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["batch_item_status"]
          template_id: string | null
          user_id: string
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_id?: string | null
          id?: string
          parameters?: Json | null
          product_name?: string | null
          prompt?: string | null
          sequence_number: number
          source_image_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          template_id?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_id?: string | null
          id?: string
          parameters?: Json | null
          product_name?: string | null
          prompt?: string | null
          sequence_number?: number
          source_image_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_generated_image_id_fkey"
            columns: ["generated_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          completed_at: string | null
          completed_items: number
          created_at: string
          credits_charged: number
          credits_refunded: number
          default_prompt: string | null
          error_message: string | null
          failed_items: number
          gemini_batch_id: string | null
          gemini_file_id: string | null
          id: string
          name: string
          parameters: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["batch_job_status"]
          total_items: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          credits_charged: number
          credits_refunded?: number
          default_prompt?: string | null
          error_message?: string | null
          failed_items?: number
          gemini_batch_id?: string | null
          gemini_file_id?: string | null
          id?: string
          name: string
          parameters?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_job_status"]
          total_items: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          credits_charged?: number
          credits_refunded?: number
          default_prompt?: string | null
          error_message?: string | null
          failed_items?: number
          gemini_batch_id?: string | null
          gemini_file_id?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_job_status"]
          total_items?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_refund_requests: {
        Row: {
          completed_at: string | null
          credits_refunded: number
          id: string
          refund_amount_cents: number
          refund_percentage: number
          requested_at: string
          status: Database["public"]["Enums"]["cash_refund_status"]
          stripe_error: string | null
          stripe_processed_at: string | null
          stripe_purchase_id: string
          stripe_refund_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          credits_refunded: number
          id?: string
          refund_amount_cents: number
          refund_percentage: number
          requested_at?: string
          status?: Database["public"]["Enums"]["cash_refund_status"]
          stripe_error?: string | null
          stripe_processed_at?: string | null
          stripe_purchase_id: string
          stripe_refund_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          credits_refunded?: number
          id?: string
          refund_amount_cents?: number
          refund_percentage?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["cash_refund_status"]
          stripe_error?: string | null
          stripe_processed_at?: string | null
          stripe_purchase_id?: string
          stripe_refund_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_refund_requests_stripe_purchase_id_fkey"
            columns: ["stripe_purchase_id"]
            isOneToOne: true
            referencedRelation: "stripe_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown
          message: string
          name: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          message: string
          name: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          message?: string
          name?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          reference_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          reference_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      critical_errors: {
        Row: {
          context: Json | null
          created_at: string | null
          domain: string
          error_code: string
          error_message: string
          error_name: string
          error_stack: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          domain: string
          error_code: string
          error_message: string
          error_name: string
          error_stack?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          domain?: string
          error_code?: string
          error_message?: string
          error_name?: string
          error_stack?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "critical_errors_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critical_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_key: string
          file_size: number | null
          height: number | null
          id: string
          is_favorite: boolean
          job_id: string
          public_url: string
          refunded_at: string | null
          title: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_key: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean
          job_id: string
          public_url: string
          refunded_at?: string | null
          title?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_key?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean
          job_id?: string
          public_url?: string
          refunded_at?: string | null
          title?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_costs: {
        Row: {
          created_at: string | null
          generated_image_id: string | null
          id: string
          input_cost_usd: number
          input_tokens: number
          job_id: string | null
          model_id: string
          output_cost_usd: number
          output_tokens: number
          provider: string
          total_cost_usd: number
        }
        Insert: {
          created_at?: string | null
          generated_image_id?: string | null
          id?: string
          input_cost_usd: number
          input_tokens: number
          job_id?: string | null
          model_id: string
          output_cost_usd: number
          output_tokens: number
          provider: string
          total_cost_usd: number
        }
        Update: {
          created_at?: string | null
          generated_image_id?: string | null
          id?: string
          input_cost_usd?: number
          input_tokens?: number
          job_id?: string | null
          model_id?: string
          output_cost_usd?: number
          output_tokens?: number
          provider?: string
          total_cost_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "generation_costs_generated_image_id_fkey"
            columns: ["generated_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_costs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      image_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          image_id: string
          reasons: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          image_id: string
          reasons?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          image_id?: string
          reasons?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_feedback_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      image_refund_requests: {
        Row: {
          admin_notes: string | null
          credits_refunded: number
          feedback: string | null
          id: string
          image_id: string
          job_id: string
          processed_at: string | null
          reason: Database["public"]["Enums"]["refund_reason"]
          requested_at: string
          reviewed_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          credits_refunded: number
          feedback?: string | null
          id?: string
          image_id: string
          job_id: string
          processed_at?: string | null
          reason: Database["public"]["Enums"]["refund_reason"]
          requested_at?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          credits_refunded?: number
          feedback?: string | null
          id?: string
          image_id?: string
          job_id?: string
          processed_at?: string | null
          reason?: Database["public"]["Enums"]["refund_reason"]
          requested_at?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_refund_requests_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: true
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_refund_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_refund_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      iteration_costs: {
        Row: {
          cost_details: Json | null
          created_at: string
          evaluation_cost: number
          generation_cost: number
          generation_count: number
          id: string
          insights_cost: number
          session_id: string
          template_slug: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          cost_details?: Json | null
          created_at?: string
          evaluation_cost?: number
          generation_cost?: number
          generation_count?: number
          id?: string
          insights_cost?: number
          session_id: string
          template_slug: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          cost_details?: Json | null
          created_at?: string
          evaluation_cost?: number
          generation_cost?: number
          generation_count?: number
          id?: string
          insights_cost?: number
          session_id?: string
          template_slug?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_charged: number
          error_message: string | null
          id: string
          max_retries: number
          parameters: Json | null
          prompt: string
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          template_id: string | null
          template_slug: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          id?: string
          max_retries?: number
          parameters?: Json | null
          prompt: string
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          template_id?: string | null
          template_slug: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          id?: string
          max_retries?: number
          parameters?: Json | null
          prompt?: string
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          template_id?: string | null
          template_slug?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      observability_failures: {
        Row: {
          created_at: string | null
          error_data: Json
          failure_reason: string
          id: string
          occurred_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_data: Json
          failure_reason: string
          id?: string
          occurred_at: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_data?: Json
          failure_reason?: string
          id?: string
          occurred_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observability_failures_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_evaluations: {
        Row: {
          cost_usd: number | null
          created_at: string
          details: Json | null
          evaluator_model: string | null
          evaluator_type: string
          id: string
          score_overall: number | null
          test_id: string | null
          tokens_used: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          details?: Json | null
          evaluator_model?: string | null
          evaluator_type: string
          id?: string
          score_overall?: number | null
          test_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          details?: Json | null
          evaluator_model?: string | null
          evaluator_type?: string
          id?: string
          score_overall?: number | null
          test_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_evaluations_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "prompt_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          output_count: number | null
          slug: string
          status: string
          template_data: Json
          type: string
          variables_schema: Json
          variety_strategy: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          output_count?: number | null
          slug: string
          status?: string
          template_data: Json
          type?: string
          variables_schema: Json
          variety_strategy?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          output_count?: number | null
          slug?: string
          status?: string
          template_data?: Json
          type?: string
          variables_schema?: Json
          variety_strategy?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_tests: {
        Row: {
          batch_label: string | null
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          final_prompt: string
          id: string
          idempotency_key: string | null
          image_key: string | null
          image_url: string | null
          input_tokens: number | null
          inputs: Json
          output_tokens: number | null
          source_image_key: string | null
          source_image_url: string | null
          status: Database["public"]["Enums"]["prompt_test_status"]
          template_id: string | null
        }
        Insert: {
          batch_label?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          final_prompt: string
          id?: string
          idempotency_key?: string | null
          image_key?: string | null
          image_url?: string | null
          input_tokens?: number | null
          inputs: Json
          output_tokens?: number | null
          source_image_key?: string | null
          source_image_url?: string | null
          status?: Database["public"]["Enums"]["prompt_test_status"]
          template_id?: string | null
        }
        Update: {
          batch_label?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          final_prompt?: string
          id?: string
          idempotency_key?: string | null
          image_key?: string | null
          image_url?: string | null
          input_tokens?: number | null
          inputs?: Json
          output_tokens?: number | null
          source_image_key?: string | null
          source_image_url?: string | null
          status?: Database["public"]["Enums"]["prompt_test_status"]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_credit_ledger: {
        Row: {
          created_at: string
          credits_consumed: number
          credits_granted: number
          credits_refunded_cash: number
          credits_refunded_image: number
          id: string
          stripe_purchase_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_consumed?: number
          credits_granted: number
          credits_refunded_cash?: number
          credits_refunded_image?: number
          id?: string
          stripe_purchase_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_consumed?: number
          credits_granted?: number
          credits_refunded_cash?: number
          credits_refunded_image?: number
          id?: string
          stripe_purchase_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_credit_ledger_stripe_purchase_id_fkey"
            columns: ["stripe_purchase_id"]
            isOneToOne: false
            referencedRelation: "stripe_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sentiment_analysis_queue: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          message_id: string
          processed_at: string | null
          retry_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          message_id: string
          processed_at?: string | null
          retry_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          message_id?: string
          processed_at?: string | null
          retry_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "user_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_purchases: {
        Row: {
          amount_cents: number
          created_at: string | null
          credits_granted: number
          id: string
          metadata: Json | null
          purchase_type: string
          stripe_customer_id: string
          stripe_payment_intent_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          credits_granted: number
          id?: string
          metadata?: Json | null
          purchase_type: string
          stripe_customer_id: string
          stripe_payment_intent_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          credits_granted?: number
          id?: string
          metadata?: Json | null
          purchase_type?: string
          stripe_customer_id?: string
          stripe_payment_intent_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      template_improvement_sessions: {
        Row: {
          config: Json
          current_iteration: number
          current_mean_score: number | null
          initial_mean_score: number | null
          max_iterations: number
          session_id: string
          started_at: string
          status: string
          target_score: number | null
          template_slug: string
          total_cost_usd: number | null
          total_improvement: number | null
          updated_at: string
        }
        Insert: {
          config: Json
          current_iteration?: number
          current_mean_score?: number | null
          initial_mean_score?: number | null
          max_iterations: number
          session_id?: string
          started_at?: string
          status?: string
          target_score?: number | null
          template_slug: string
          total_cost_usd?: number | null
          total_improvement?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json
          current_iteration?: number
          current_mean_score?: number | null
          initial_mean_score?: number | null
          max_iterations?: number
          session_id?: string
          started_at?: string
          status?: string
          target_score?: number | null
          template_slug?: string
          total_cost_usd?: number | null
          total_improvement?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      template_iterations: {
        Row: {
          analysis: Json
          baseline_batch_label: string
          baseline_results: Json
          baseline_template: Json
          changes: Json
          costs: Json
          delta: Json
          id: string
          improved_batch_label: string
          improved_results: Json
          improved_template: Json
          iteration_number: number
          session_id: string
          suggestions: Json
          timestamp: string
          user_modifications: string | null
        }
        Insert: {
          analysis: Json
          baseline_batch_label: string
          baseline_results: Json
          baseline_template: Json
          changes: Json
          costs: Json
          delta: Json
          id?: string
          improved_batch_label: string
          improved_results: Json
          improved_template: Json
          iteration_number: number
          session_id: string
          suggestions: Json
          timestamp?: string
          user_modifications?: string | null
        }
        Update: {
          analysis?: Json
          baseline_batch_label?: string
          baseline_results?: Json
          baseline_template?: Json
          changes?: Json
          costs?: Json
          delta?: Json
          id?: string
          improved_batch_label?: string
          improved_results?: Json
          improved_template?: Json
          iteration_number?: number
          session_id?: string
          suggestions?: Json
          timestamp?: string
          user_modifications?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_iterations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "template_improvement_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_key: string
          file_size: number
          filename: string
          height: number | null
          id: string
          mime_type: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_key: string
          file_size: number
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_key?: string
          file_size?: number
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          properties: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          properties?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          properties?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          analysis: Json | null
          content: string
          created_at: string
          id: string
          is_from_admin: boolean
          read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          content: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          credit_balance: number
          deleted_at: string | null
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          last_active_at: string | null
          original_email: string | null
          preferences: Json | null
          stripe_customer_id: string | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          deleted_at?: string | null
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          last_active_at?: string | null
          original_email?: string | null
          preferences?: Json | null
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          last_active_at?: string | null
          original_email?: string | null
          preferences?: Json | null
          stripe_customer_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_timeline_view: {
        Row: {
          id: string | null
          metadata: Json | null
          subtype: string | null
          timestamp: string | null
          type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_idempotency_key?: string
          p_reference_id?: string
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      consume_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_job_id: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      create_batch_job: {
        Args: {
          p_credits_to_charge: number
          p_default_prompt?: string
          p_name: string
          p_parameters?: Json
          p_total_items: number
          p_user_id: string
        }
        Returns: string
      }
      create_generation_job:
        | {
            Args: {
              p_credits?: number
              p_parameters?: Json
              p_prompt: string
              p_template_slug?: string
              p_upload_id: string
              p_user_id: string
            }
            Returns: {
              job_id: string
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_credits?: number
              p_parameters?: Json
              p_prompt: string
              p_template_id?: string
              p_upload_id: string
              p_user_id: string
            }
            Returns: {
              job_id: string
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_credits?: number
              p_parameters?: Json
              p_prompt: string
              p_upload_id: string
              p_user_id: string
            }
            Returns: {
              job_id: string
              message: string
              success: boolean
            }[]
          }
      deduct_credits_for_cash_refund: {
        Args: {
          p_amount: number
          p_cash_refund_id: string
          p_stripe_purchase_id: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      get_batch_stats: {
        Args: { p_batch_label: string }
        Returns: {
          avg_score: number
          completed_tests: number
          failed_tests: number
          max_score: number
          min_score: number
          total_cost: number
          total_tests: number
        }[]
      }
      get_filtered_user_list: {
        Args: {
          p_created_after?: string
          p_created_before?: string
          p_cursor?: string
          p_has_errors?: boolean
          p_has_messages?: boolean
          p_limit?: number
          p_max_credits?: number
          p_min_credits?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
        }
        Returns: {
          created_at: string
          credit_balance: number
          display_name: string
          email: string
          error_count: number
          id: string
          job_count: number
          last_active_at: string
          message_count: number
        }[]
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      refund_batch_failures: {
        Args: { p_batch_id: string; p_credits_per_item: number }
        Returns: number
      }
      refund_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_job_id: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      refund_credits_for_image: {
        Args: {
          p_amount: number
          p_description?: string
          p_image_id: string
          p_refund_request_id: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      restore_deleted_account: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_batch_progress: {
        Args: { p_batch_id: string; p_completed: number; p_failed: number }
        Returns: undefined
      }
      update_prompt_test_status: {
        Args: {
          p_error_code?: string
          p_error_message?: string
          p_new_status: Database["public"]["Enums"]["prompt_test_status"]
          p_test_id: string
        }
        Returns: undefined
      }
      update_user_preferences: {
        Args: { prefs: Json; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      batch_item_status: "pending" | "processing" | "completed" | "failed"
      batch_job_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "failed"
      cash_refund_status: "pending" | "processing" | "completed" | "failed"
      feedback_type: "positive" | "negative"
      job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      prompt_test_status:
        | "pending"
        | "generating"
        | "evaluating"
        | "completed"
        | "failed"
      refund_reason:
        | "poor_quality"
        | "wrong_style"
        | "technical_issue"
        | "other"
      refund_status: "pending_auto" | "pending_admin" | "approved" | "rejected"
      transaction_type:
        | "purchase"
        | "generation"
        | "refund"
        | "bonus"
        | "expiration"
        | "pack_purchase"
        | "subscription_renewal"
        | "subscription_upgrade"
        | "image_refund"
        | "cash_refund_reversal"
      user_tier: "free" | "pro" | "business"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      batch_item_status: ["pending", "processing", "completed", "failed"],
      batch_job_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      cash_refund_status: ["pending", "processing", "completed", "failed"],
      feedback_type: ["positive", "negative"],
      job_status: ["pending", "processing", "completed", "failed", "cancelled"],
      prompt_test_status: [
        "pending",
        "generating",
        "evaluating",
        "completed",
        "failed",
      ],
      refund_reason: [
        "poor_quality",
        "wrong_style",
        "technical_issue",
        "other",
      ],
      refund_status: ["pending_auto", "pending_admin", "approved", "rejected"],
      transaction_type: [
        "purchase",
        "generation",
        "refund",
        "bonus",
        "expiration",
        "pack_purchase",
        "subscription_renewal",
        "subscription_upgrade",
        "image_refund",
        "cash_refund_reversal",
      ],
      user_tier: ["free", "pro", "business"],
    },
  },
} as const

