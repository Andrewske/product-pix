import type { ReactNode } from 'react';

// Experiment Runner Types
export interface BatchFileMetadata {
  filename: string;
  label: string;
  description?: string;
  testCount: number;
}

export interface TemplateMetadata {
  slug: string;
  version: number;
  status: 'active' | 'draft' | 'deprecated';
}

export interface ProgressEvent {
  phase: 'sync' | 'run' | 'evaluate' | 'report' | 'batch_label' | 'complete';
  current: number;
  total: number;
  message: string;
  timestamp?: number;
}

export type SSEEvent = ProgressEvent | { done: true } | { error: string };

// Notebook Types
export interface NotebookRun {
  id: string;
  phase_run_number: number;
  created_at: string;
  inputs: Record<string, unknown>;
  debug_metadata?: Record<string, unknown>;
}

export interface AnalysisRun extends NotebookRun {
  debug_metadata: {
    thinking: string | null;
    tokens: { input: number; output: number };
    model: string;
    cost: number;
    duration_ms: number;
    raw_prompt: string;
    raw_response: unknown;
  };
}

export interface GenerationRun extends NotebookRun {
  parent_run_id: string;
  final_prompt: string;
  debug_metadata: {
    thinking: string | null;
    tokens: { input: number; output: number };
    model: string;
    cost: number;
    duration_ms: number;
    image_urls: string[];
    angle_prompts?: string[];  // One prompt per generated image
    angle_plan?: {             // Plan for which angles to generate
      assignments: Array<{
        targetAngle: string;
        sourceImageIndex: number;
        matchType: 'exact' | 'similar' | 'primary-fallback';
      }>;
    };
  };
}

export interface EvaluationRun extends NotebookRun {
  parent_run_id: string;
  prompt_evaluations?: Array<{
    score_overall: number;
    details: Record<string, unknown>;
  }>;
  debug_metadata?: {
    tokens: { input: number; output: number };
    model?: string;
    cost?: number;
    duration_ms?: number;
  };
}

// Component Prop Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export interface SelectProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password';
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export interface TableProps {
  headers: string[];
  rows: Array<Record<string, ReactNode>>;
  className?: string;
}

// Add more prop types as needed during component extraction

// Human Review Types
export interface UnreviewedImage {
  id: string;
  imageUrl: string;
  imageUrls?: string[];  // Multi-image runs
  finalPrompt: string;
  sourceImageUrl: string | null;
  llmScore: number;
  llmDetails: Record<string, unknown>;
  createdAt: string;
}

export interface HumanRating {
  testId: string;
  imageIndex?: number;
  score: number;
  notes?: string;
}