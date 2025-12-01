// src/types/database.helpers.ts
import type { Database } from './database';

// Table row types
export type User = Database['public']['Tables']['users']['Row'];
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];
export type Upload = Database['public']['Tables']['uploads']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type GeneratedImage = Database['public']['Tables']['generated_images']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UploadInsert = Database['public']['Tables']['uploads']['Insert'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

// Enum types
export type JobStatus = Database['public']['Enums']['job_status'];
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type UserTier = Database['public']['Enums']['user_tier'];

// Function return types
export type CreateJobResult = {
  success: boolean;
  job_id: string | null;
  message: string;
};

export type CreditOperationResult = {
  success: boolean;
  new_balance: number;
};