import {
  TemplateDataSchema,
  VariableDefSchema,
  StringVariableDefSchema,
  EnumVariableDefSchema,
  VariablesSchemaSchema,
  BatchFileSchema,
  TestCaseSchema,
  ScoreSchema,
  TemplateStatusSchema,
  PromptTemplateSchema,
  TestStatusSchema,
  EvaluatorTypeSchema,
  EvaluationDetailsSchema,
  RunCommandOptionsSchema,
  EvaluateCommandOptionsSchema,
  CompareCommandOptionsSchema,
} from '@bench/core/types';

describe('types schemas', () => {
  describe('TemplateDataSchema', () => {
    it('validates minimal valid template data', () => {
      const data = { subject: 'A product photo' };

      expect(() => TemplateDataSchema.parse(data)).not.toThrow();
      const parsed = TemplateDataSchema.parse(data);
      expect(parsed.subject).toBe('A product photo');
    });

    it('validates complete template data', () => {
      const data = {
        subject: 'A {product}',
        background: 'white background',
        lighting: 'soft lighting',
        camera: '85mm lens',
        style: 'minimalist',
        quality: '8K',
        negative: 'blurry, low quality',
      };

      expect(() => TemplateDataSchema.parse(data)).not.toThrow();
      const parsed = TemplateDataSchema.parse(data);
      expect(parsed.subject).toBe('A {product}');
      expect(parsed.negative).toBe('blurry, low quality');
    });

    it('rejects empty subject', () => {
      const data = { subject: '' };

      expect(() => TemplateDataSchema.parse(data)).toThrow();
    });

    it('rejects missing subject', () => {
      const data = { background: 'white' };

      expect(() => TemplateDataSchema.parse(data)).toThrow();
    });

    it('allows optional fields to be undefined', () => {
      const data = {
        subject: 'A photo',
        background: undefined,
      };

      expect(() => TemplateDataSchema.parse(data)).not.toThrow();
    });
  });

  describe('StringVariableDefSchema', () => {
    it('validates required string variable', () => {
      const def = { type: 'string', required: true };

      expect(() => StringVariableDefSchema.parse(def)).not.toThrow();
    });

    it('validates optional string with default', () => {
      const def = {
        type: 'string',
        required: false,
        default: 'default value',
        description: 'A helpful description',
      };

      expect(() => StringVariableDefSchema.parse(def)).not.toThrow();
      const parsed = StringVariableDefSchema.parse(def);
      expect(parsed.default).toBe('default value');
    });

    it('rejects non-string type', () => {
      const def = { type: 'number', required: true };

      expect(() => StringVariableDefSchema.parse(def)).toThrow();
    });
  });

  describe('EnumVariableDefSchema', () => {
    it('validates enum variable with options', () => {
      const def = {
        type: 'enum',
        required: true,
        options: ['red', 'blue', 'green'],
      };

      expect(() => EnumVariableDefSchema.parse(def)).not.toThrow();
      const parsed = EnumVariableDefSchema.parse(def);
      expect(parsed.options).toEqual(['red', 'blue', 'green']);
    });

    it('validates enum with default from options', () => {
      const def = {
        type: 'enum',
        required: false,
        options: ['small', 'medium', 'large'],
        default: 'medium',
      };

      expect(() => EnumVariableDefSchema.parse(def)).not.toThrow();
    });

    it('rejects enum without options', () => {
      const def = { type: 'enum', required: true };

      expect(() => EnumVariableDefSchema.parse(def)).toThrow();
    });

    it('rejects empty options array', () => {
      const def = { type: 'enum', required: true, options: [] };

      expect(() => EnumVariableDefSchema.parse(def)).toThrow();
    });
  });

  describe('VariableDefSchema (discriminated union)', () => {
    it('parses string variable', () => {
      const def = { type: 'string', required: true };

      const parsed = VariableDefSchema.parse(def);
      expect(parsed.type).toBe('string');
    });

    it('parses enum variable', () => {
      const def = { type: 'enum', required: true, options: ['a', 'b'] };

      const parsed = VariableDefSchema.parse(def);
      expect(parsed.type).toBe('enum');
    });

    it('rejects unknown type', () => {
      const def = { type: 'number', required: true };

      expect(() => VariableDefSchema.parse(def)).toThrow();
    });
  });

  describe('VariablesSchemaSchema', () => {
    it('validates empty schema', () => {
      expect(() => VariablesSchemaSchema.parse({})).not.toThrow();
    });

    it('validates schema with multiple variables', () => {
      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'enum', required: false, options: ['red', 'blue'] },
      };

      expect(() => VariablesSchemaSchema.parse(schema)).not.toThrow();
    });

    it('rejects invalid variable definition', () => {
      const schema = {
        product: { type: 'invalid', required: true },
      };

      expect(() => VariablesSchemaSchema.parse(schema)).toThrow();
    });
  });

  describe('TestCaseSchema', () => {
    it('validates test case with variables', () => {
      const testCase = { variables: { x: 1, y: 'test' } };

      expect(() => TestCaseSchema.parse(testCase)).not.toThrow();
    });

    it('validates test case with notes', () => {
      const testCase = {
        variables: { product: 'mug' },
        notes: 'Testing edge case',
      };

      expect(() => TestCaseSchema.parse(testCase)).not.toThrow();
      const parsed = TestCaseSchema.parse(testCase);
      expect(parsed.notes).toBe('Testing edge case');
    });

    it('validates test case with empty variables', () => {
      const testCase = { variables: {} };

      expect(() => TestCaseSchema.parse(testCase)).not.toThrow();
    });

    it('rejects missing variables field', () => {
      const testCase = { notes: 'No variables' };

      expect(() => TestCaseSchema.parse(testCase)).toThrow();
    });
  });

  describe('BatchFileSchema', () => {
    it('validates batch file with single test', () => {
      const batch = { tests: [{ variables: { x: 1 } }] };

      expect(() => BatchFileSchema.parse(batch)).not.toThrow();
    });

    it('validates batch file with label', () => {
      const batch = {
        label: 'my-batch',
        tests: [{ variables: { a: 'test' } }],
      };

      expect(() => BatchFileSchema.parse(batch)).not.toThrow();
      const parsed = BatchFileSchema.parse(batch);
      expect(parsed.label).toBe('my-batch');
    });

    it('validates batch with multiple tests', () => {
      const batch = {
        tests: [
          { variables: { color: 'red' } },
          { variables: { color: 'blue' } },
          { variables: { color: 'green' }, notes: 'Test note' },
        ],
      };

      expect(() => BatchFileSchema.parse(batch)).not.toThrow();
      const parsed = BatchFileSchema.parse(batch);
      expect(parsed.tests).toHaveLength(3);
    });

    it('rejects empty tests array', () => {
      const batch = { tests: [] };

      expect(() => BatchFileSchema.parse(batch)).toThrow();
    });

    it('rejects missing tests', () => {
      const batch = { label: 'no-tests' };

      expect(() => BatchFileSchema.parse(batch)).toThrow();
    });
  });

  describe('ScoreSchema', () => {
    it('accepts valid integer scores', () => {
      expect(() => ScoreSchema.parse(1)).not.toThrow();
      expect(() => ScoreSchema.parse(5)).not.toThrow();
      expect(() => ScoreSchema.parse(10)).not.toThrow();
    });

    it('accepts valid decimal scores', () => {
      expect(() => ScoreSchema.parse(1.5)).not.toThrow();
      expect(() => ScoreSchema.parse(5.5)).not.toThrow();
      expect(() => ScoreSchema.parse(9.9)).not.toThrow();
    });

    it('rejects scores below minimum', () => {
      expect(() => ScoreSchema.parse(0)).toThrow();
      expect(() => ScoreSchema.parse(0.5)).toThrow();
      expect(() => ScoreSchema.parse(-1)).toThrow();
    });

    it('rejects scores above maximum', () => {
      expect(() => ScoreSchema.parse(11)).toThrow();
      expect(() => ScoreSchema.parse(10.1)).toThrow();
      expect(() => ScoreSchema.parse(100)).toThrow();
    });

    it('rejects non-number values', () => {
      expect(() => ScoreSchema.parse('5')).toThrow();
      expect(() => ScoreSchema.parse(null)).toThrow();
    });
  });

  describe('TemplateStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(() => TemplateStatusSchema.parse('draft')).not.toThrow();
      expect(() => TemplateStatusSchema.parse('active')).not.toThrow();
      expect(() => TemplateStatusSchema.parse('archived')).not.toThrow();
    });

    it('rejects invalid status', () => {
      expect(() => TemplateStatusSchema.parse('invalid')).toThrow();
      expect(() => TemplateStatusSchema.parse('pending')).toThrow();
    });
  });

  describe('TestStatusSchema', () => {
    it('accepts valid test statuses', () => {
      expect(() => TestStatusSchema.parse('pending')).not.toThrow();
      expect(() => TestStatusSchema.parse('generating')).not.toThrow();
      expect(() => TestStatusSchema.parse('evaluating')).not.toThrow();
      expect(() => TestStatusSchema.parse('completed')).not.toThrow();
      expect(() => TestStatusSchema.parse('failed')).not.toThrow();
    });

    it('rejects invalid test status', () => {
      expect(() => TestStatusSchema.parse('running')).toThrow();
      expect(() => TestStatusSchema.parse('success')).toThrow();
    });
  });

  describe('EvaluatorTypeSchema', () => {
    it('accepts valid evaluator types', () => {
      expect(() => EvaluatorTypeSchema.parse('llm')).not.toThrow();
      expect(() => EvaluatorTypeSchema.parse('human')).not.toThrow();
    });

    it('rejects invalid evaluator type', () => {
      expect(() => EvaluatorTypeSchema.parse('ai')).toThrow();
      expect(() => EvaluatorTypeSchema.parse('automated')).toThrow();
    });
  });

  describe('EvaluationDetailsSchema', () => {
    it('validates complete evaluation details', () => {
      const details = {
        composition: 8,
        lighting: 7.5,
        productVisibility: 9,
        backgroundQuality: 8,
        professionalQuality: 8.5,
        promptAdherence: 9,
        reasoning: 'Good overall quality',
        suggestions: ['Improve lighting', 'Add shadows'],
      };

      expect(() => EvaluationDetailsSchema.parse(details)).not.toThrow();
    });

    it('validates partial evaluation details', () => {
      const details = {
        composition: 7,
        reasoning: 'Basic evaluation',
      };

      expect(() => EvaluationDetailsSchema.parse(details)).not.toThrow();
    });

    it('validates empty details', () => {
      expect(() => EvaluationDetailsSchema.parse({})).not.toThrow();
    });

    it('allows additional fields (passthrough)', () => {
      const details = {
        composition: 8,
        customField: 'custom value',
      };

      const parsed = EvaluationDetailsSchema.parse(details);
      expect(parsed.customField).toBe('custom value');
    });

    it('rejects invalid score values', () => {
      const details = {
        composition: 15, // Out of range
      };

      expect(() => EvaluationDetailsSchema.parse(details)).toThrow();
    });
  });

  describe('PromptTemplateSchema', () => {
    it('validates minimal single template', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'product-photo',
        version: 1,
        status: 'draft',
        templateData: { subject: 'A {product}' },
        variablesSchema: { product: { type: 'string', required: true } },
        createdAt: new Date(),
        type: 'single',
      };

      expect(() => PromptTemplateSchema.parse(template)).not.toThrow();
    });

    it('validates collection template', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'multi-angle-collection',
        version: 1,
        status: 'active',
        templateData: { subject: 'A {product}' },
        variablesSchema: { product: { type: 'string', required: true } },
        createdAt: new Date(),
        type: 'collection',
        outputCount: 5,
        varietyStrategy: 'hybrid',
      };

      expect(() => PromptTemplateSchema.parse(template)).not.toThrow();
    });

    it('validates template with createdBy', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-template',
        version: 2,
        status: 'active',
        templateData: { subject: 'Test' },
        variablesSchema: {},
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date(),
        type: 'single',
      };

      expect(() => PromptTemplateSchema.parse(template)).not.toThrow();
    });

    it('rejects invalid slug format', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'Invalid Slug',
        version: 1,
        status: 'draft',
        templateData: { subject: 'Test' },
        variablesSchema: {},
        createdAt: new Date(),
        type: 'single',
      };

      expect(() => PromptTemplateSchema.parse(template)).toThrow();
    });

    it('rejects non-positive version', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test',
        version: 0,
        status: 'draft',
        templateData: { subject: 'Test' },
        variablesSchema: {},
        createdAt: new Date(),
        type: 'single',
      };

      expect(() => PromptTemplateSchema.parse(template)).toThrow();
    });

    it('rejects invalid UUID', () => {
      const template = {
        id: 'not-a-uuid',
        slug: 'test',
        version: 1,
        status: 'draft',
        templateData: { subject: 'Test' },
        variablesSchema: {},
        createdAt: new Date(),
        type: 'single',
      };

      expect(() => PromptTemplateSchema.parse(template)).toThrow();
    });

    it('rejects collection template without required fields', () => {
      const template = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test',
        version: 1,
        status: 'draft',
        templateData: { subject: 'Test' },
        variablesSchema: {},
        createdAt: new Date(),
        type: 'collection',
        // missing outputCount and varietyStrategy
      };

      expect(() => PromptTemplateSchema.parse(template)).toThrow();
    });
  });

  describe('RunCommandOptionsSchema', () => {
    it('validates with required fields', () => {
      const opts = {
        template: 'my-template',
        batch: 'batch.json',
      };

      expect(() => RunCommandOptionsSchema.parse(opts)).not.toThrow();
      const parsed = RunCommandOptionsSchema.parse(opts);
      expect(parsed.version).toBe('latest');
      expect(parsed.dryRun).toBe(false);
    });

    it('validates with all fields', () => {
      const opts = {
        template: 'my-template',
        version: 2,
        batch: 'batch.json',
        label: 'test-run',
        dryRun: true,
      };

      expect(() => RunCommandOptionsSchema.parse(opts)).not.toThrow();
      const parsed = RunCommandOptionsSchema.parse(opts);
      expect(parsed.version).toBe(2);
      expect(parsed.dryRun).toBe(true);
    });

    it('accepts "latest" as version', () => {
      const opts = {
        template: 'test',
        version: 'latest',
        batch: 'batch.json',
      };

      expect(() => RunCommandOptionsSchema.parse(opts)).not.toThrow();
    });

    it('rejects empty template', () => {
      const opts = {
        template: '',
        batch: 'batch.json',
      };

      expect(() => RunCommandOptionsSchema.parse(opts)).toThrow();
    });

    it('rejects empty batch', () => {
      const opts = {
        template: 'test',
        batch: '',
      };

      expect(() => RunCommandOptionsSchema.parse(opts)).toThrow();
    });
  });

  describe('EvaluateCommandOptionsSchema', () => {
    it('validates with required fields', () => {
      const opts = { label: 'my-batch' };

      expect(() => EvaluateCommandOptionsSchema.parse(opts)).not.toThrow();
      const parsed = EvaluateCommandOptionsSchema.parse(opts);
      expect(parsed.model).toBe('claude-sonnet-4-20250514');
    });

    it('validates with custom model', () => {
      const opts = {
        label: 'my-batch',
        model: 'claude-3-opus',
      };

      expect(() => EvaluateCommandOptionsSchema.parse(opts)).not.toThrow();
      const parsed = EvaluateCommandOptionsSchema.parse(opts);
      expect(parsed.model).toBe('claude-3-opus');
    });

    it('rejects empty label', () => {
      const opts = { label: '' };

      expect(() => EvaluateCommandOptionsSchema.parse(opts)).toThrow();
    });
  });

  describe('CompareCommandOptionsSchema', () => {
    it('validates with required fields', () => {
      const opts = {
        baseline: 'batch-v1',
        candidate: 'batch-v2',
      };

      expect(() => CompareCommandOptionsSchema.parse(opts)).not.toThrow();
    });

    it('rejects empty baseline', () => {
      const opts = {
        baseline: '',
        candidate: 'batch-v2',
      };

      expect(() => CompareCommandOptionsSchema.parse(opts)).toThrow();
    });

    it('rejects empty candidate', () => {
      const opts = {
        baseline: 'batch-v1',
        candidate: '',
      };

      expect(() => CompareCommandOptionsSchema.parse(opts)).toThrow();
    });
  });
});