import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, expect } from 'bun:test';

// Register happy-dom globals (replaces jsdom)
GlobalRegistrator.register({
  url: 'http://localhost:3000',
});

// Custom matchers for Bun (jest-dom doesn't work with Bun's test runner)
// These provide the same API as @testing-library/jest-dom but for Bun
expect.extend({
  toBeInTheDocument(element: unknown): { pass: boolean; message: () => string } {
    const pass = element !== null && element !== undefined && element instanceof Element;
    return {
      pass,
      message: () => pass
        ? 'expected element not to be in the document'
        : 'expected element to be in the document',
    };
  },
  toHaveAttribute(element: unknown, name: string, expectedValue?: string): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    const hasAttr = element.hasAttribute(name);
    const actualValue = element.getAttribute(name);
    const pass = expectedValue !== undefined
      ? hasAttr && actualValue === expectedValue
      : hasAttr;
    return {
      pass,
      message: () => pass
        ? `expected element not to have attribute "${name}"${expectedValue !== undefined ? ` with value "${expectedValue}"` : ''}`
        : `expected element to have attribute "${name}"${expectedValue !== undefined ? ` with value "${expectedValue}" but got "${actualValue}"` : ''}`,
    };
  },
  toHaveClass(element: unknown, ...classNames: string[]): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    const missing = classNames.filter(c => !element.classList.contains(c));
    const pass = missing.length === 0;
    return {
      pass,
      message: () => pass
        ? `expected element not to have classes "${classNames.join(', ')}"`
        : `expected element to have classes "${classNames.join(', ')}" but missing "${missing.join(', ')}"`,
    };
  },
  toHaveTextContent(element: unknown, text: string | RegExp): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    const content = element.textContent ?? '';
    const pass = text instanceof RegExp ? text.test(content) : content.includes(text);
    return {
      pass,
      message: () => pass
        ? `expected element not to have text content "${text}"`
        : `expected element to have text content "${text}" but got "${content}"`,
    };
  },
  toBeVisible(element: unknown): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    // Simplified visibility check
    const style = (element as HTMLElement).style;
    const pass = style?.display !== 'none' && style?.visibility !== 'hidden';
    return {
      pass,
      message: () => pass
        ? 'expected element not to be visible'
        : 'expected element to be visible',
    };
  },
  toHaveStyle(element: unknown, styles: Record<string, string>): { pass: boolean; message: () => string } {
    if (!(element instanceof HTMLElement)) {
      return { pass: false, message: () => 'expected an HTMLElement' };
    }
    const computedStyle = element.style;
    const mismatches: string[] = [];
    for (const [prop, expected] of Object.entries(styles)) {
      const actual = computedStyle.getPropertyValue(prop) || (computedStyle as unknown as Record<string, string>)[prop];
      if (actual !== expected) {
        mismatches.push(`${prop}: expected "${expected}" but got "${actual}"`);
      }
    }
    const pass = mismatches.length === 0;
    return {
      pass,
      message: () => pass
        ? 'expected element not to have specified styles'
        : `style mismatches: ${mismatches.join(', ')}`,
    };
  },
  toHaveFocus(element: unknown): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    const pass = element === document.activeElement;
    return {
      pass,
      message: () => pass
        ? 'expected element not to have focus'
        : 'expected element to have focus',
    };
  },
  toBeDisabled(element: unknown): { pass: boolean; message: () => string } {
    if (!(element instanceof HTMLElement)) {
      return { pass: false, message: () => 'expected an HTMLElement' };
    }
    const pass = (element as HTMLButtonElement | HTMLInputElement).disabled === true;
    return {
      pass,
      message: () => pass
        ? 'expected element not to be disabled'
        : 'expected element to be disabled',
    };
  },
  toBeEnabled(element: unknown): { pass: boolean; message: () => string } {
    if (!(element instanceof HTMLElement)) {
      return { pass: false, message: () => 'expected an HTMLElement' };
    }
    const pass = (element as HTMLButtonElement | HTMLInputElement).disabled !== true;
    return {
      pass,
      message: () => pass
        ? 'expected element to be disabled'
        : 'expected element to be enabled',
    };
  },
  toHaveAccessibleName(element: unknown, expectedName?: string): { pass: boolean; message: () => string } {
    if (!(element instanceof Element)) {
      return { pass: false, message: () => 'expected an Element' };
    }
    const accessibleName = element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() || '';
    const pass = expectedName !== undefined
      ? accessibleName === expectedName
      : accessibleName.length > 0;
    return {
      pass,
      message: () => pass
        ? `expected element not to have accessible name${expectedName ? ` "${expectedName}"` : ''}`
        : `expected element to have accessible name${expectedName ? ` "${expectedName}" but got "${accessibleName}"` : ''}`,
    };
  },
});

// Setup test environment variables
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'gemini-3-pro-image-preview';
process.env.ANALYSIS_MODEL = 'gemini-2.0-flash';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY_ID = 'test-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.R2_PUBLIC_URL = 'http://localhost:8787';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.CRON_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_PRICE_PACK_50 = 'price_test_50';
process.env.STRIPE_PRICE_PACK_200 = 'price_test_200';
process.env.STRIPE_PRICE_PACK_500 = 'price_test_500';
process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_test_pro';
process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_test_business';

// Cleanup after each test for React Testing Library
afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});
