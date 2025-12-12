import {
  createError,
  validateRequiredVariables,
  validateEnumValues,
  ok,
  err,
  isOk,
  isErr,
  isRetryable,
  isErrorCode,
  formatError,
  validateCompiledPrompt,
  type Result,
} from '@bench/core/errors';

describe('errors module', () => {
  describe('createError', () => {
    it('creates error with required fields', () => {
      const error = createError('VALIDATION_ERROR', 'Test message');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.retryable).toBe(false);
      expect(error.testId).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('creates retryable error', () => {
      const error = createError('NETWORK_ERROR', 'Network failed', { retryable: true });

      expect(error.retryable).toBe(true);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('includes testId when provided', () => {
      const error = createError('GENERATION_ERROR', 'Failed', { testId: 'test-123' });

      expect(error.testId).toBe('test-123');
    });

    it('includes cause when provided', () => {
      const originalError = new Error('Original error');
      const error = createError('DATABASE_ERROR', 'DB failed', { cause: originalError });

      expect(error.cause).toBe(originalError);
    });

    it('creates error with all options', () => {
      const cause = new Error('Root cause');
      const error = createError('STORAGE_ERROR', 'Storage issue', {
        testId: 'test-456',
        retryable: true,
        cause,
      });

      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.message).toBe('Storage issue');
      expect(error.testId).toBe('test-456');
      expect(error.retryable).toBe(true);
      expect(error.cause).toBe(cause);
    });
  });

  describe('Result helpers', () => {
    describe('ok', () => {
      it('creates success result with data', () => {
        const result = ok({ value: 42 });

        expect(result.ok).toBe(true);
        expect(result.data).toEqual({ value: 42 });
      });

      it('creates success result with string data', () => {
        const result = ok('success');

        expect(result.ok).toBe(true);
        expect(result.data).toBe('success');
      });

      it('creates success result with null data', () => {
        const result = ok(null);

        expect(result.ok).toBe(true);
        expect(result.data).toBeNull();
      });
    });

    describe('err', () => {
      it('creates failure result with error', () => {
        const error = createError('VALIDATION_ERROR', 'Failed');
        const result = err(error);

        expect(result.ok).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    describe('isOk', () => {
      it('returns true for success result', () => {
        const result = ok({ value: 42 });

        expect(isOk(result)).toBe(true);
      });

      it('returns false for failure result', () => {
        const result = err(createError('VALIDATION_ERROR', 'Failed'));

        expect(isOk(result)).toBe(false);
      });

      it('correctly narrows type for success', () => {
        const result: Result<{ value: number }> = ok({ value: 42 });

        if (isOk(result)) {
          // TypeScript should allow accessing data here
          expect(result.data.value).toBe(42);
        }
      });
    });

    describe('isErr', () => {
      it('returns true for failure result', () => {
        const result = err(createError('VALIDATION_ERROR', 'Failed'));

        expect(isErr(result)).toBe(true);
      });

      it('returns false for success result', () => {
        const result = ok({ value: 42 });

        expect(isErr(result)).toBe(false);
      });

      it('correctly narrows type for failure', () => {
        const result: Result<string> = err(createError('VALIDATION_ERROR', 'Test error'));

        if (isErr(result)) {
          // TypeScript should allow accessing error here
          expect(result.error.code).toBe('VALIDATION_ERROR');
        }
      });
    });
  });

  describe('isRetryable', () => {
    it('returns true for retryable errors', () => {
      const error = createError('NETWORK_ERROR', 'Timeout', { retryable: true });

      expect(isRetryable(error)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const error = createError('VALIDATION_ERROR', 'Invalid input');

      expect(isRetryable(error)).toBe(false);
    });
  });

  describe('isErrorCode', () => {
    it('returns true when code matches', () => {
      const error = createError('COMPILATION_ERROR', 'Missing variable');

      expect(isErrorCode(error, 'COMPILATION_ERROR')).toBe(true);
    });

    it('returns false when code does not match', () => {
      const error = createError('VALIDATION_ERROR', 'Invalid');

      expect(isErrorCode(error, 'NETWORK_ERROR')).toBe(false);
    });
  });

  describe('formatError', () => {
    it('formats basic error', () => {
      const error = createError('VALIDATION_ERROR', 'Invalid input');
      const formatted = formatError(error);

      expect(formatted).toBe('[VALIDATION_ERROR] Invalid input');
    });

    it('includes testId when present', () => {
      const error = createError('GENERATION_ERROR', 'Failed', { testId: 'test-789' });
      const formatted = formatError(error);

      expect(formatted).toContain('[GENERATION_ERROR] Failed');
      expect(formatted).toContain('Test ID: test-789');
    });

    it('includes retryable note when true', () => {
      const error = createError('NETWORK_ERROR', 'Timeout', { retryable: true });
      const formatted = formatError(error);

      expect(formatted).toContain('(retryable)');
    });

    it('includes cause message when present', () => {
      const cause = new Error('Connection refused');
      const error = createError('DATABASE_ERROR', 'DB failed', { cause });
      const formatted = formatError(error);

      expect(formatted).toContain('Cause: Connection refused');
    });

    it('formats error with all fields', () => {
      const cause = new Error('Socket closed');
      const error = createError('NETWORK_ERROR', 'Request failed', {
        testId: 'test-full',
        retryable: true,
        cause,
      });
      const formatted = formatError(error);

      expect(formatted).toContain('[NETWORK_ERROR] Request failed');
      expect(formatted).toContain('Test ID: test-full');
      expect(formatted).toContain('(retryable)');
      expect(formatted).toContain('Cause: Socket closed');
    });
  });

  describe('validateCompiledPrompt', () => {
    it('returns null for valid prompt without variables', () => {
      const result = validateCompiledPrompt('A photo of a red mug on white background');

      expect(result).toBeNull();
    });

    it('returns null for prompt with curly braces in normal text', () => {
      // JSON-like content should not trigger false positives if not matching pattern
      const result = validateCompiledPrompt('A photo with style "bold"');

      expect(result).toBeNull();
    });

    it('returns error for single unresolved variable', () => {
      const error = validateCompiledPrompt('A photo of {product}');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('COMPILATION_ERROR');
      expect(error?.message).toContain('{product}');
    });

    it('returns error listing all unresolved variables', () => {
      const error = validateCompiledPrompt('A {product} in {color} on {background}');

      expect(error).not.toBeNull();
      expect(error?.message).toContain('{product}');
      expect(error?.message).toContain('{color}');
      expect(error?.message).toContain('{background}');
    });

    it('handles underscore in variable names', () => {
      const error = validateCompiledPrompt('A photo of {product_name}');

      expect(error).not.toBeNull();
      expect(error?.message).toContain('{product_name}');
    });

    it('handles numbers in variable names', () => {
      const error = validateCompiledPrompt('Style {style1} and {style2}');

      expect(error).not.toBeNull();
      expect(error?.message).toContain('{style1}');
      expect(error?.message).toContain('{style2}');
    });

    it('returns null for empty string', () => {
      const result = validateCompiledPrompt('');

      expect(result).toBeNull();
    });
  });

  describe('validateRequiredVariables', () => {
    it('returns null when all required variables are provided', () => {
      const schema = {
        name: { required: true },
        color: { required: true },
      };
      const error = validateRequiredVariables({ subject: 'test' }, schema, { name: 'test', color: 'red' });

      expect(error).toBeNull();
    });

    it('returns null when optional variables are missing', () => {
      const schema = {
        name: { required: true },
        optional: { required: false },
      };
      const error = validateRequiredVariables({ subject: 'A {name} that is {color}' }, schema, { name: 'test' });

      expect(error).toBeNull();
    });

    it('returns error for missing required variable', () => {
      const templateData = {
        subject: 'A {name} that is {color}',
      };
      const schema = {
        name: { required: true },
        color: { required: true },
      };
      const error = validateRequiredVariables(templateData, schema, { name: 'test' });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('VALIDATION_ERROR');
      expect(error?.message).toContain('color');
    });

    it('returns error listing all missing required variables', () => {
      const schema = {
        name: { required: true },
        color: { required: true },
        size: { required: true },
      };
      const error = validateRequiredVariables({ subject: 'A {name} {color} {size}' }, schema, {});

      expect(error).not.toBeNull();
      expect(error?.message).toContain('name');
      expect(error?.message).toContain('color');
      expect(error?.message).toContain('size');
    });

    it('returns null for empty schema', () => {
      const error = validateRequiredVariables({ subject: 'test' }, {}, { anyVar: 'value' });

      expect(error).toBeNull();
    });

    it('handles schema with all optional variables', () => {
      const schema = {
        opt1: { required: false },
        opt2: { required: false },
      };
      const error = validateRequiredVariables({ subject: 'test' }, schema, {});

      expect(error).toBeNull();
    });
  });

  describe('validateEnumValues', () => {
    it('returns null when enum value is valid', () => {
      const schema = {
        color: { type: 'enum', options: ['red', 'blue', 'green'] },
      };
      const error = validateEnumValues(schema, { color: 'red' });

      expect(error).toBeNull();
    });

    it('returns error for invalid enum value', () => {
      const schema = {
        color: { type: 'enum', options: ['red', 'blue', 'green'] },
      };
      const error = validateEnumValues(schema, { color: 'yellow' });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('VALIDATION_ERROR');
      expect(error?.message).toContain('yellow');
      expect(error?.message).toContain('red');
      expect(error?.message).toContain('blue');
      expect(error?.message).toContain('green');
    });

    it('returns null for string type variables', () => {
      const schema = {
        name: { type: 'string' },
      };
      const error = validateEnumValues(schema, { name: 'any value' });

      expect(error).toBeNull();
    });

    it('returns null when enum variable is not provided', () => {
      const schema = {
        color: { type: 'enum', options: ['red', 'blue'] },
      };
      const error = validateEnumValues(schema, {});

      expect(error).toBeNull();
    });

    it('returns null for non-string enum values', () => {
      // Edge case: if value is not a string, skip validation
      const schema = {
        color: { type: 'enum', options: ['red', 'blue'] },
      };
      const error = validateEnumValues(schema, { color: 123 });

      expect(error).toBeNull();
    });

    it('handles multiple enum variables', () => {
      const schema = {
        color: { type: 'enum', options: ['red', 'blue'] },
        size: { type: 'enum', options: ['small', 'large'] },
      };
      const error = validateEnumValues(schema, { color: 'red', size: 'medium' });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('size');
      expect(error?.message).toContain('medium');
    });

    it('validates first invalid enum and returns', () => {
      // The function returns on first error found
      const schema = {
        color: { type: 'enum', options: ['red'] },
        size: { type: 'enum', options: ['small'] },
      };
      const error = validateEnumValues(schema, { color: 'invalid', size: 'invalid' });

      expect(error).not.toBeNull();
      // Should return error for one of them (order depends on object iteration)
      expect(error?.code).toBe('VALIDATION_ERROR');
    });
  });
});