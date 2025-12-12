// Type declarations for custom Bun test matchers
declare module 'bun:test' {
  interface Matchers<T = unknown> {
    // Custom DOM matchers (defined in bun-test-setup.ts)
    toBeInTheDocument(): void;
    toHaveAttribute(name: string, value?: string): void;
    toHaveClass(...classNames: string[]): void;
    toHaveTextContent(text: string | RegExp): void;
    toBeVisible(): void;
    toHaveStyle(styles: Record<string, string>): void;
    toHaveFocus(): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toHaveAccessibleName(name?: string): void;
  }
}

// Augment global jest namespace for @testing-library/react compatibility
declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveAttribute(name: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toHaveStyle(styles: Record<string, string>): R;
      toHaveFocus(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAccessibleName(name?: string): R;
    }
  }
}

export {};
