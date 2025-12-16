// Shared types for UI
export interface BatchFileMetadata {
  filename: string;
  label: string;
  description?: string;
  testCount: number;
}

export interface TemplateMetadata {
  slug: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
}

export interface ProgressEvent {
  phase: 'sync' | 'run' | 'evaluate' | 'report';
  current: number;
  total: number;
  message: string;
  timestamp: number;
}

export interface RunCompletionEvent {
  done: true;
}

export interface RunErrorEvent {
  error: string;
}

export type SSEEvent = ProgressEvent | RunCompletionEvent | RunErrorEvent;