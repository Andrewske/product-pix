// Basic Database type definition
// This will be replaced with generated types from Supabase when the schema is set up
export interface Database {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
}