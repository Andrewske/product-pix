declare global {
  interface Window {
    posthog?: typeof import('posthog-js').default;
    fbq?: {
      (command: 'init', pixelId: string): void;
      (command: 'track', event: string, params?: Record<string, unknown>): void;
      (command: 'trackCustom', event: string, params?: Record<string, unknown>): void;
    };
  }
}

export {};