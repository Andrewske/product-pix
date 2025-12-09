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
          fallback_used: boolean | null
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
          fallback_used?: boolean | null
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
          fallback_used?: boolean | null
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
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
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
          slug: string
          status: string
          template_data: Json
          variables_schema: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          status?: string
          template_data: Json
          variables_schema: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          status?: string
          template_data?: Json
          variables_schema?: Json
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
          inputs: Json
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
          inputs: Json
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
          inputs?: Json
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
      users: {
        Row: {
          created_at: string
          credit_balance: number
          display_name: string | null
          email: string
          id: string
          preferences: Json | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          display_name?: string | null
          email: string
          id: string
          preferences?: Json | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          display_name?: string | null
          email?: string
          id?: string
          preferences?: Json | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      create_generation_job: {
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_prompt_test_status: {
        Args: {
          p_error_code?: string
          p_error_message?: string
          p_new_status: Database["public"]["Enums"]["prompt_test_status"]
          p_test_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
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
      transaction_type:
        | "purchase"
        | "generation"
        | "refund"
        | "bonus"
        | "expiration"
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
      job_status: ["pending", "processing", "completed", "failed", "cancelled"],
      prompt_test_status: [
        "pending",
        "generating",
        "evaluating",
        "completed",
        "failed",
      ],
      transaction_type: [
        "purchase",
        "generation",
        "refund",
        "bonus",
        "expiration",
      ],
      user_tier: ["free", "pro", "business"],
    },
  },
} as const

