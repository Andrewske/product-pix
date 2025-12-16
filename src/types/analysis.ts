import type { Json } from '@/types/database';

export interface AnalysisPrompt {
  id: string;
  slug: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  promptText: string;
  responseSchema: Json;
  createdBy: string | null;
  createdAt: Date;
}

export interface ProductAnalysis {
  product: string;
  color: string;
  material: string;
  shape: string;
  features: string[];
}

export type MergedAnalysis = ProductAnalysis;
