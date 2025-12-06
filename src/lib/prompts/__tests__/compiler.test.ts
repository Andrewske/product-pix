import {
  compileTemplate,
  applyDefaults,
  substituteVariables,
  generateIdempotencyKey,
  extractVariableNames,
  assemblePrompt,
  getTemplateVariables,
  validateTemplateVariables,
} from '../compiler';
import { isOk, isErr } from '../errors';
import type { TemplateData, VariablesSchema } from '../types';

describe('compiler module', () => {
  describe('substituteVariables', () => {
    it('replaces single variable', () => {
      const result = substituteVariables('Hello {name}', { name: 'World' });

      expect(result).toBe('Hello World');
    });

    it('replaces multiple different variables', () => {
      const result = substituteVariables('{a} and {b}', { a: 'X', b: 'Y' });

      expect(result).toBe('X and Y');
    });

    it('replaces same variable multiple times', () => {
      const result = substituteVariables('{x} plus {x}', { x: '1' });

      expect(result).toBe('1 plus 1');
    });

    it('leaves unmatched variables unchanged', () => {
      const result = substituteVariables('{known} {unknown}', { known: 'X' });

      expect(result).toBe('X {unknown}');
    });

    it('handles empty template', () => {
      const result = substituteVariables('', { name: 'value' });

      expect(result).toBe('');
    });

    it('handles empty variables object', () => {
      const result = substituteVariables('Hello {name}', {});

      expect(result).toBe('Hello {name}');
    });

    it('handles variables with underscores', () => {
      const result = substituteVariables('{product_name} in {background_color}', {
        product_name: 'Mug',
        background_color: 'white',
      });

      expect(result).toBe('Mug in white');
    });

    it('handles variables with numbers', () => {
      const result = substituteVariables('{item1} and {item2}', {
        item1: 'First',
        item2: 'Second',
      });

      expect(result).toBe('First and Second');
    });

    it('handles template with no variables', () => {
      const result = substituteVariables('No variables here', { name: 'ignored' });

      expect(result).toBe('No variables here');
    });

    it('preserves whitespace', () => {
      const result = substituteVariables('  {name}  ', { name: 'test' });

      expect(result).toBe('  test  ');
    });
  });

  describe('applyDefaults', () => {
    it('uses provided values over defaults', () => {
      const schema: VariablesSchema = {
        color: { type: 'string', required: false, default: 'red' },
      };
      const { variables } = applyDefaults(schema, { color: 'blue' });

      expect(variables.color).toBe('blue');
    });

    it('applies default when variable not provided', () => {
      const schema: VariablesSchema = {
        color: { type: 'string', required: false, default: 'red' },
      };
      const { variables, defaultsApplied } = applyDefaults(schema, {});

      expect(variables.color).toBe('red');
      expect(defaultsApplied).toContain('color');
    });

    it('applies empty string for optional without default', () => {
      const schema: VariablesSchema = {
        optional: { type: 'string', required: false },
      };
      const { variables, defaultsApplied } = applyDefaults(schema, {});

      expect(variables.optional).toBe('');
      expect(defaultsApplied).not.toContain('optional');
    });

    it('converts non-string values to strings', () => {
      const schema: VariablesSchema = {
        count: { type: 'string', required: true },
      };
      const { variables } = applyDefaults(schema, { count: 42 });

      expect(variables.count).toBe('42');
    });

    it('does not include required variables without value', () => {
      const schema: VariablesSchema = {
        required: { type: 'string', required: true },
      };
      const { variables } = applyDefaults(schema, {});

      expect('required' in variables).toBe(false);
    });

    it('handles multiple variables with mixed defaults', () => {
      const schema: VariablesSchema = {
        a: { type: 'string', required: true },
        b: { type: 'string', required: false, default: 'default-b' },
        c: { type: 'string', required: false },
      };
      const { variables, defaultsApplied } = applyDefaults(schema, { a: 'value-a' });

      expect(variables.a).toBe('value-a');
      expect(variables.b).toBe('default-b');
      expect(variables.c).toBe('');
      expect(defaultsApplied).toEqual(['b']);
    });

    it('handles empty schema', () => {
      const { variables, defaultsApplied } = applyDefaults({}, { extra: 'ignored' });

      expect(variables).toEqual({});
      expect(defaultsApplied).toEqual([]);
    });
  });

  describe('assemblePrompt', () => {
    it('assembles subject only', () => {
      const templateData: TemplateData = {
        subject: 'A red mug',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A red mug');
    });

    it('assembles subject with background', () => {
      const templateData: TemplateData = {
        subject: 'A red mug',
        background: 'white studio background',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A red mug, white studio background');
    });

    it('assembles all optional components', () => {
      const templateData: TemplateData = {
        subject: 'A red mug',
        background: 'white background',
        lighting: 'soft lighting',
        camera: '85mm lens',
        style: 'minimalist',
        quality: '8K resolution',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A red mug, white background, soft lighting, 85mm lens, minimalist, 8K resolution');
    });

    it('skips empty string components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '',
        lighting: 'soft',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, soft');
    });

    it('skips whitespace-only components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '   ',
        lighting: 'soft',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, soft');
    });

    it('trims whitespace from components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '  white  ',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, white');
    });

    it('does not include negative in assembled prompt', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'blurry, low quality',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug');
      expect(result).not.toContain('blurry');
    });
  });

  describe('compileTemplate', () => {
    const basicTemplateData: TemplateData = {
      subject: 'A {product} in {color}',
      background: 'white background',
    };
    const basicSchema: VariablesSchema = {
      product: { type: 'string', required: true },
      color: { type: 'string', required: false, default: 'red' },
    };

    it('compiles valid template with all required variables', () => {
      const result = compileTemplate(basicTemplateData, basicSchema, { product: 'mug' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('A mug in red, white background');
        expect(result.data.usedVariables.product).toBe('mug');
        expect(result.data.usedVariables.color).toBe('red');
        expect(result.data.defaultsApplied).toContain('color');
      }
    });

    it('compiles with provided optional variable', () => {
      const result = compileTemplate(basicTemplateData, basicSchema, {
        product: 'cup',
        color: 'blue',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toContain('A cup in blue');
        expect(result.data.defaultsApplied).not.toContain('color');
      }
    });

    it('fails for missing required variable', () => {
      const result = compileTemplate(basicTemplateData, basicSchema, {});

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('product');
      }
    });

    it('fails for invalid enum value', () => {
      const enumSchema: VariablesSchema = {
        style: { type: 'enum', required: true, options: ['minimal', 'bold'] },
      };
      const templateData: TemplateData = {
        subject: 'Photo with {style} style',
      };
      const result = compileTemplate(templateData, enumSchema, { style: 'invalid' });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('invalid');
      }
    });

    it('fails for unresolved variables in final prompt', () => {
      // Template has variable not in schema
      const templateData: TemplateData = {
        subject: 'A {product} with {unknown}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
      };
      const result = compileTemplate(templateData, schema, { product: 'mug' });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('COMPILATION_ERROR');
        expect(result.error.message).toContain('{unknown}');
      }
    });

    it('skips validation with skipValidation option', () => {
      const result = compileTemplate(basicTemplateData, basicSchema, {}, { skipValidation: true });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Variables will be unresolved but no error
        expect(result.data.prompt).toContain('{product}');
      }
    });

    it('includes negative prompt when requested', () => {
      const templateData: TemplateData = {
        subject: 'A {product}',
        negative: 'blurry, {bad_quality}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
        bad_quality: { type: 'string', required: false, default: 'low resolution' },
      };
      const result = compileTemplate(templateData, schema, { product: 'mug' }, { includeNegative: true });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.negative).toBe('blurry, low resolution');
      }
    });

    it('does not include negative by default', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'blurry',
      };
      const result = compileTemplate(templateData, {}, {});

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.negative).toBeUndefined();
      }
    });

    it('validates negative prompt for unresolved variables', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'no {unresolved}',
      };
      const result = compileTemplate(templateData, {}, {}, { includeNegative: true });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('negative prompt');
        expect(result.error.message).toContain('{unresolved}');
      }
    });

    it('handles complex template with all fields', () => {
      const templateData: TemplateData = {
        subject: 'A {product}',
        background: '{bg_type} background',
        lighting: '{light_style} lighting',
        camera: '{lens}mm lens',
        style: '{style} style',
        quality: '8K {resolution}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
        bg_type: { type: 'enum', required: true, options: ['white', 'black'] },
        light_style: { type: 'string', required: false, default: 'soft' },
        lens: { type: 'string', required: false, default: '85' },
        style: { type: 'string', required: false, default: 'minimal' },
        resolution: { type: 'string', required: false, default: 'HDR' },
      };
      const result = compileTemplate(templateData, schema, {
        product: 'coffee mug',
        bg_type: 'white',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toContain('A coffee mug');
        expect(result.data.prompt).toContain('white background');
        expect(result.data.prompt).toContain('soft lighting');
        expect(result.data.defaultsApplied).toContain('light_style');
        expect(result.data.defaultsApplied).toContain('lens');
      }
    });
  });

  describe('generateIdempotencyKey', () => {
    it('generates key with template and version', () => {
      const key = generateIdempotencyKey('product-photo', 1, {});

      expect(key).toBe('product-photo::v1::');
    });

    it('generates consistent keys regardless of variable order', () => {
      const key1 = generateIdempotencyKey('test', 1, { a: 'x', b: 'y', c: 'z' });
      const key2 = generateIdempotencyKey('test', 1, { c: 'z', a: 'x', b: 'y' });

      expect(key1).toBe(key2);
    });

    it('includes batch label when provided', () => {
      const key = generateIdempotencyKey('test', 1, { a: 'x' }, 'batch-1');

      expect(key).toContain('batch-1');
      expect(key).toBe('test::v1::a=x::batch-1');
    });

    it('handles empty variables', () => {
      const key = generateIdempotencyKey('test', 2, {});

      expect(key).toBe('test::v2::');
    });

    it('converts variable values to strings', () => {
      const key = generateIdempotencyKey('test', 1, { num: 42, bool: true });

      expect(key).toContain('num=42');
      expect(key).toContain('bool=true');
    });

    it('generates different keys for different versions', () => {
      const key1 = generateIdempotencyKey('test', 1, { a: 'x' });
      const key2 = generateIdempotencyKey('test', 2, { a: 'x' });

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different variables', () => {
      const key1 = generateIdempotencyKey('test', 1, { a: 'x' });
      const key2 = generateIdempotencyKey('test', 1, { a: 'y' });

      expect(key1).not.toBe(key2);
    });
  });

  describe('extractVariableNames', () => {
    it('extracts single variable name', () => {
      const names = extractVariableNames('Hello {name}');

      expect(names).toEqual(['name']);
    });

    it('extracts multiple variable names', () => {
      const names = extractVariableNames('Hello {name}, your {item} is ready');

      expect(names).toEqual(['name', 'item']);
    });

    it('deduplicates variable names', () => {
      const names = extractVariableNames('{x} and {x} again');

      expect(names).toEqual(['x']);
    });

    it('handles template with no variables', () => {
      const names = extractVariableNames('No variables here');

      expect(names).toEqual([]);
    });

    it('handles empty string', () => {
      const names = extractVariableNames('');

      expect(names).toEqual([]);
    });

    it('handles variables with underscores and numbers', () => {
      const names = extractVariableNames('{var_1} and {var_2}');

      expect(names).toEqual(['var_1', 'var_2']);
    });

    it('preserves order of first occurrence', () => {
      const names = extractVariableNames('{b} {a} {c} {a}');

      expect(names).toEqual(['b', 'a', 'c']);
    });
  });

  describe('getTemplateVariables', () => {
    it('extracts variables from subject', () => {
      const templateData: TemplateData = {
        subject: 'A {product} in {color}',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toContain('product');
      expect(names).toContain('color');
    });

    it('extracts variables from all components', () => {
      const templateData: TemplateData = {
        subject: 'A {product}',
        background: '{bg_type} background',
        lighting: '{light} lighting',
        camera: '{lens}mm',
        style: '{style}',
        quality: '{resolution}',
        negative: 'no {bad}',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toContain('product');
      expect(names).toContain('bg_type');
      expect(names).toContain('light');
      expect(names).toContain('lens');
      expect(names).toContain('style');
      expect(names).toContain('resolution');
      expect(names).toContain('bad');
    });

    it('deduplicates across components', () => {
      const templateData: TemplateData = {
        subject: 'A {color} product',
        background: '{color} background',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toEqual(['color']);
    });

    it('handles template with no variables', () => {
      const templateData: TemplateData = {
        subject: 'A static product photo',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toEqual([]);
    });
  });

  describe('validateTemplateVariables', () => {
    it('returns null when all template variables are defined', () => {
      const templateData: TemplateData = {
        subject: 'A {product} in {color}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false },
      };
      const error = validateTemplateVariables(templateData, schema);

      expect(error).toBeNull();
    });

    it('returns error for undefined variable', () => {
      const templateData: TemplateData = {
        subject: 'A {product} with {unknown}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
      };
      const error = validateTemplateVariables(templateData, schema);

      expect(error).not.toBeNull();
      expect(error?.code).toBe('VALIDATION_ERROR');
      expect(error?.message).toContain('unknown');
    });

    it('returns error listing all undefined variables', () => {
      const templateData: TemplateData = {
        subject: 'A {a} with {b} and {c}',
      };
      const schema: VariablesSchema = {};
      const error = validateTemplateVariables(templateData, schema);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('a');
      expect(error?.message).toContain('b');
      expect(error?.message).toContain('c');
    });

    it('returns null for template with no variables', () => {
      const templateData: TemplateData = {
        subject: 'Static photo',
      };
      const error = validateTemplateVariables(templateData, {});

      expect(error).toBeNull();
    });

    it('returns null when schema has extra variables not used in template', () => {
      const templateData: TemplateData = {
        subject: 'A {product}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
        unused: { type: 'string', required: false },
      };
      const error = validateTemplateVariables(templateData, schema);

      expect(error).toBeNull();
    });
  });
});