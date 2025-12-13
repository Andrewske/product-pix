/**
 * Safely stringify an object, handling circular references and non-serializable data
 */
export function safeStringify(obj: unknown, indent = 2): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }

    // Handle non-serializable values
    if (typeof value === 'function') {
      return '[Function]';
    }

    if (value instanceof Error) {
      return `[Error: ${value.message}]`;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle undefined values
    if (value === undefined) {
      return '[undefined]';
    }

    return value;
  }, indent);
}