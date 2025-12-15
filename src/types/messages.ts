export interface MessageAnalysis {
  category: 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  analyzedAt: string; // ISO timestamp
  model: string; // e.g., "claude-haiku-3.5"
}

export interface UserMessage {
  id: string;
  userId: string;
  content: string;
  isFromAdmin: boolean;
  readAt: string | null;
  analysis: MessageAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitMessageParams {
  content: string;
}

export interface SendAdminReplyParams {
  userId: string;
  content: string;
}