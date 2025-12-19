import { PRODUCT_ANALYSIS_V1, PRODUCT_ANALYSIS_V2 } from './product-analysis';
import type { AnalysisPrompt } from '@/types/analysis';

export const ANALYSIS_PROMPT_REGISTRY: Record<string, Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'>> = {
  'product-analysis': PRODUCT_ANALYSIS_V2,
};

export const getRegisteredAnalysisPrompt = (slug: string) => ANALYSIS_PROMPT_REGISTRY[slug];
export const getRegisteredAnalysisPromptSlugs = () => Object.keys(ANALYSIS_PROMPT_REGISTRY);
