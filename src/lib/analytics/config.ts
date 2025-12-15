import { env } from '@/lib/env';

/**
 * Creates PostHog browser configuration object with privacy-first settings
 */
export function createClientConfig(): {
  api_host: string;
  ui_host?: string;
  loaded: (posthog: { __autocapture?: boolean }) => void;
  capture_pageview: boolean;
  capture_pageleave: boolean;
  mask_all_inputs: boolean;
  mask_all_text: boolean;
  mask_all_element_attributes: boolean;
  person_profiles: 'identified_only';
  session_recording: {
    maskTextSelector: '*';
    maskAllInputs: true;
  };
} {
  return {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    loaded: (posthog: { __autocapture?: boolean }) => {
      // Disable autocapture after manual setup
      posthog.__autocapture = false;
    },
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    mask_all_inputs: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    person_profiles: 'identified_only',
    session_recording: {
      maskTextSelector: '*',
      maskAllInputs: true,
    },
  };
}

/**
 * Creates PostHog Node.js configuration object for server-side tracking
 */
export function createServerConfig(): {
  host: string;
  flushAt: number;
  flushInterval: number;
} {
  return {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 20,
    flushInterval: 10000,
  };
}