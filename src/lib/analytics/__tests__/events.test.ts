import { describe, it, expect } from 'bun:test';
import type { AnalyticsEvent } from '../events';
import {
  validateAnalyticsEvent,
  generationStartedSchema,
  generationCompletedSchema,
  userSignedUpSchema,
  errorOccurredSchema,
  rateLimitHitSchema,
} from '../events';

describe('Analytics Events', () => {
  describe('TypeScript discriminated union', () => {
    it('should compile without TypeScript errors', () => {
      // This test ensures the discriminated union compiles correctly
      const event: AnalyticsEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1',
          resolution: '2k',
          has_source_image: false,
        },
      };

      expect(event.event).toBe('generation_started');
      expect(event.properties.job_id).toBe('job-123');
    });

    it('should enforce discriminated union properties', () => {
      // TypeScript should prevent invalid combinations
      const validEvent: AnalyticsEvent = {
        event: 'user_signed_up',
        properties: {
          user_id: 'user-123',
          email: 'test@example.com',
          signup_method: 'email',
        },
      };

      expect(validEvent.event).toBe('user_signed_up');
    });
  });

  describe('Zod schema validation', () => {
    describe('generation_started event', () => {
      it('should validate correct properties', () => {
        const validEvent = {
          event: 'generation_started',
          properties: {
            job_id: 'job-123',
            user_id: 'user-456',
            template_slug: 'ecommerce-base',
            aspect_ratio: '1:1' as const,
            resolution: '2k' as const,
            has_source_image: true,
            source_image_count: 2,
          },
        };

        const result = generationStartedSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.properties.job_id).toBe('job-123');
        }
      });

      it('should reject invalid aspect_ratio', () => {
        const invalidEvent = {
          event: 'generation_started',
          properties: {
            job_id: 'job-123',
            user_id: 'user-456',
            template_slug: 'ecommerce-base',
            aspect_ratio: 'invalid',
            resolution: '2k' as const,
            has_source_image: false,
          },
        };

        const result = generationStartedSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
      });

      it('should reject missing required properties', () => {
        const invalidEvent = {
          event: 'generation_started',
          properties: {
            job_id: 'job-123',
            // missing user_id, template_slug, etc.
          },
        };

        const result = generationStartedSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
      });

      it('should reject wrong property types', () => {
        const invalidEvent = {
          event: 'generation_started',
          properties: {
            job_id: 123, // should be string
            user_id: 'user-456',
            template_slug: 'ecommerce-base',
            aspect_ratio: '1:1' as const,
            resolution: '2k' as const,
            has_source_image: false,
          },
        };

        const result = generationStartedSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
      });
    });

    describe('generation_completed event', () => {
      it('should validate correct properties', () => {
        const validEvent = {
          event: 'generation_completed',
          properties: {
            job_id: 'job-123',
            user_id: 'user-456',
            template_slug: 'ecommerce-base',
            image_count: 4,
            processing_time_seconds: 45.2,
            credits_consumed: 8,
          },
        };

        const result = generationCompletedSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject negative image_count', () => {
        const invalidEvent = {
          event: 'generation_completed',
          properties: {
            job_id: 'job-123',
            user_id: 'user-456',
            template_slug: 'ecommerce-base',
            image_count: 0, // should be at least 1
            processing_time_seconds: 45.2,
            credits_consumed: 8,
          },
        };

        const result = generationCompletedSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
      });
    });

    describe('user_signed_up event', () => {
      it('should validate correct properties', () => {
        const validEvent = {
          event: 'user_signed_up',
          properties: {
            user_id: 'user-123',
            email: 'test@example.com',
            signup_method: 'google' as const,
          },
        };

        const result = userSignedUpSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidEvent = {
          event: 'user_signed_up',
          properties: {
            user_id: 'user-123',
            email: 'invalid-email',
            signup_method: 'email' as const,
          },
        };

        const result = userSignedUpSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
      });
    });

    describe('error_occurred event', () => {
      it('should validate with optional user_id', () => {
        const validEvent = {
          event: 'error_occurred',
          properties: {
            error_type: 'validation_error',
            error_message: 'Invalid input provided',
            component: 'GenerationForm',
            url: 'https://app.productpix.com/generate',
          },
        };

        const result = errorOccurredSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });

      it('should validate with user_id present', () => {
        const validEvent = {
          event: 'error_occurred',
          properties: {
            user_id: 'user-123',
            error_type: 'api_error',
            error_message: 'Failed to connect to AI service',
            component: 'GenerationAPI',
            url: 'https://api.productpix.com/generate',
            user_agent: 'Mozilla/5.0...',
          },
        };

        const result = errorOccurredSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });
    });

    describe('rate_limit_hit event', () => {
      it('should validate correct properties', () => {
        const validEvent = {
          event: 'rate_limit_hit',
          properties: {
            limit_type: 'generation_per_hour' as const,
            current_count: 25,
            limit: 20,
          },
        };

        const result = rateLimitHitSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });

      it('should validate with optional user_id', () => {
        const validEvent = {
          event: 'rate_limit_hit',
          properties: {
            user_id: 'user-123',
            limit_type: 'api_requests_per_minute' as const,
            current_count: 65,
            limit: 60,
          },
        };

        const result = rateLimitHitSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateAnalyticsEvent function', () => {
    it('should validate correct events', () => {
      const validEvent = {
        event: 'generation_started',
        properties: {
          job_id: 'job-123',
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1' as const,
          resolution: '2k' as const,
          has_source_image: false,
        },
      };

      expect(validateAnalyticsEvent(validEvent)).toBe(true);
    });

    it('should reject invalid events', () => {
      const invalidEvent = {
        event: 'invalid_event',
        properties: {},
      };

      expect(validateAnalyticsEvent(invalidEvent)).toBe(false);
    });

    it('should reject non-object input', () => {
      expect(validateAnalyticsEvent(null)).toBe(false);
      expect(validateAnalyticsEvent('string')).toBe(false);
      expect(validateAnalyticsEvent(123)).toBe(false);
    });

    it('should reject objects without event property', () => {
      const invalidEvent = {
        properties: {},
      };

      expect(validateAnalyticsEvent(invalidEvent)).toBe(false);
    });

    it('should reject events with invalid properties', () => {
      const invalidEvent = {
        event: 'generation_started',
        properties: {
          job_id: 123, // should be string
          user_id: 'user-456',
          template_slug: 'ecommerce-base',
          aspect_ratio: '1:1' as const,
          resolution: '2k' as const,
          has_source_image: false,
        },
      };

      expect(validateAnalyticsEvent(invalidEvent)).toBe(false);
    });
  });
});
