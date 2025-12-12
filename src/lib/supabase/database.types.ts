// Temporary database types until migration is applied
export interface Database {
  public: {
    Tables: {
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          status: 'pending' | 'read' | 'responded' | 'archived';
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          status?: 'pending' | 'read' | 'responded' | 'archived';
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
          status?: 'pending' | 'read' | 'responded' | 'archived';
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}