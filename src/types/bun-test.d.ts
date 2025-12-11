// src/types/bun-test.d.ts
declare module 'bun:test' {
  // Basic test functions
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): Matchers<T>;
  export function beforeEach(fn: () => void): void;
  export function afterEach(fn: () => void): void;
  export function mock<T extends object>(obj: T): T;

  interface Mock<T extends object> {
    mockResolvedValue(value: any): void;
    mockRejectedValue(error: any): void;
    mockImplementation(fn: (...args: any[]) => any): void;
  }

  // Extended expect functionality
  interface Expect {
    extend(matchers: Record<string, any>): void;
    anything(): any;
  }

  export const expect: Expect & (<T>(actual: T) => Matchers<T>);

  interface Matchers<T = unknown> {
    // Basic matchers
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeInstanceOf(expected: any): void;
    toContain(expected: any): void;
    toContainEqual(expected: any): void;
    toHaveLength(expected: number): void;
    toHaveProperty(key: string, value?: any): void;
    toMatch(regex: RegExp): void;
    toMatchObject(expected: object): void;
    toThrow(error?: any): void;
    toBeCalled(): void;
    toBeCalledWith(...args: any[]): void;
    toBeCalledTimes(expected: number): void;
    toReturn(): void;
    toReturnWith(expected: any): void;
    toReturnTimes(expected: number): void;
    toHaveBeenCalledTimes(expected: number): void;
    toHaveBeenCalledWith(...args: any[]): void;

    // Jest-DOM matchers from bun-test-setup.ts
    toBeInTheDocument(): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveClass(...classNames: string[]): void;
    toHaveStyle(style: Record<string, string>): void;
    toHaveTextContent(text: string | RegExp): void;
    toHaveFocus(): void;
    toBeVisible(): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toHaveValue(value: string | number): void;
  }
}