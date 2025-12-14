declare global {
  interface Window {
    posthog?: typeof import('posthog-js').default;
    fbq?: {
      (command: 'init', pixelId: string): void;
      (command: 'track', event: string, params?: any): void;
      (command: 'trackCustom', event: string, params?: any): void;
    };
  }
}

export {};