import {
  compileTemplate,
  applyDefaults,
  substituteVariables,
  generateIdempotencyKey,
  extractVariableNames,
  assemblePrompt,
stripEmptyVariables,
  getTemplateVariables,
  validateTemplateVariables,
} from '@bench/core/compiler';
import { isOk, isErr } from '@bench/core/errors';
import type { TemplateData, VariablesSchema } from '@bench/core/types';

describe('compiler module', () => {
  describe('substituteVariables', () => {
    it('replaces single variable', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('Hello {name}', { name: 'World' });

      expect(result).toBe('Hello World');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('replaces multiple different variables', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('{a} and {b}', { a: 'X', b: 'Y' });

      expect(result).toBe('X and Y');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('replaces same variable multiple times', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('{x} plus {x}', { x: '1' });

      expect(result).toBe('1 plus 1');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('leaves unmatched variables unchanged', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('{known} {unknown}', { known: 'X' });

      expect(result).toBe('X {unknown}');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles empty template', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('', { name: 'value' });

      expect(result).toBe('');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles empty variables object', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('Hello {name}', {});

      expect(result).toBe('Hello {name}');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles variables with underscores', () => {
      const result = substituteVariables('{product_name} in {background_color}', {
        product_name: 'Mug',
        background_color: 'white',
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      });

      expect(result).toBe('Mug in white');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles variables with numbers', () => {
      const result = substituteVariables('{item1} and {item2}', {
        item1: 'First',
        item2: 'Second',
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      });

      expect(result).toBe('First and Second');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles template with no variables', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('No variables here', { name: 'ignored' });

      expect(result).toBe('No variables here');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('preserves whitespace', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = substituteVariables('  {name}  ', { name: 'test' });

      expect(result).toBe('  test  ');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
  });

  describe('applyDefaults', () => {
    it('uses provided values over defaults', () => {
      const schema: VariablesSchema = {
        color: { type: 'string', required: false, default: 'red' },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables } = applyDefaults(schema, { color: 'blue' });

      expect(variables.color).toBe('blue');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('applies default when variable not provided', () => {
      const schema: VariablesSchema = {
        color: { type: 'string', required: false, default: 'red' },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables, defaultsApplied } = applyDefaults(schema, {});

      expect(variables.color).toBe('red');
      expect(defaultsApplied).toContain('color');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('applies empty string for optional without default', () => {
      const schema: VariablesSchema = {
        optional: { type: 'string', required: false },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables, defaultsApplied } = applyDefaults(schema, {});

      expect(variables.optional).toBe('');
      expect(defaultsApplied).not.toContain('optional');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('converts non-string values to strings', () => {
      const schema: VariablesSchema = {
        count: { type: 'string', required: true },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables } = applyDefaults(schema, { count: 42 });

      expect(variables.count).toBe('42');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('does not include required variables without value', () => {
      const schema: VariablesSchema = {
        required: { type: 'string', required: true },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables } = applyDefaults(schema, {});

      expect('required' in variables).toBe(false);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles multiple variables with mixed defaults', () => {
      const schema: VariablesSchema = {
        a: { type: 'string', required: true },
        b: { type: 'string', required: false, default: 'default-b' },
        c: { type: 'string', required: false },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables, defaultsApplied } = applyDefaults(schema, { a: 'value-a' });

      expect(variables.a).toBe('value-a');
      expect(variables.b).toBe('default-b');
      expect(variables.c).toBe('');
      expect(defaultsApplied).toEqual(['b']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles empty schema', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const { variables, defaultsApplied } = applyDefaults({}, { extra: 'ignored' });

describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      expect(variables).toEqual({});
      expect(defaultsApplied).toEqual([]);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
  });

  describe('assemblePrompt', () => {
    it('assembles subject only', () => {
      const templateData: TemplateData = {
        subject: 'A red mug',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A red mug');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('assembles subject with background', () => {
      const templateData: TemplateData = {
        subject: 'A red mug',
        background: 'white studio background',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A red mug, white studio background');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('skips empty string components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '',
        lighting: 'soft',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, soft');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('skips whitespace-only components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '   ',
        lighting: 'soft',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, soft');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('trims whitespace from components', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        background: '  white  ',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug, white');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('does not include negative in assembled prompt', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'blurry, low quality',
      };
      const result = assemblePrompt(templateData);

      expect(result).toBe('A mug');
      expect(result).not.toContain('blurry');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(basicTemplateData, basicSchema, { product: 'mug' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('A mug in red, white background');
        expect(result.data.usedVariables.product).toBe('mug');
        expect(result.data.usedVariables.color).toBe('red');
        expect(result.data.defaultsApplied).toContain('color');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('compiles with provided optional variable', () => {
      const result = compileTemplate(basicTemplateData, basicSchema, {
        product: 'cup',
        color: 'blue',
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toContain('A cup in blue');
        expect(result.data.defaultsApplied).not.toContain('color');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('fails for missing required variable', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(basicTemplateData, basicSchema, {});

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('product');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('fails for invalid enum value', () => {
      const enumSchema: VariablesSchema = {
        style: { type: 'enum', required: true, options: ['minimal', 'bold'] },
      };
      const templateData: TemplateData = {
        subject: 'Photo with {style} style',
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(templateData, enumSchema, { style: 'invalid' });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('invalid');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('fails for unresolved variables in final prompt', () => {
      // Template has variable not in schema
      const templateData: TemplateData = {
        subject: 'A {product} with {unknown}',
      };
      const schema: VariablesSchema = {
        product: { type: 'string', required: true },
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(templateData, schema, { product: 'mug' });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe('COMPILATION_ERROR');
        expect(result.error.message).toContain('{unknown}');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('skips validation with skipValidation option', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(basicTemplateData, basicSchema, {}, { skipValidation: true });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Variables will be unresolved but no error
        expect(result.data.prompt).toContain('{product}');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(templateData, schema, { product: 'mug' }, { includeNegative: true });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.negative).toBe('blurry, low resolution');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('does not include negative by default', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'blurry',
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(templateData, {}, {});

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.negative).toBeUndefined();
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('validates negative prompt for unresolved variables', () => {
      const templateData: TemplateData = {
        subject: 'A mug',
        negative: 'no {unresolved}',
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const result = compileTemplate(templateData, {}, {}, { includeNegative: true });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('negative prompt');
        expect(result.error.message).toContain('{unresolved}');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toContain('A coffee mug');
        expect(result.data.prompt).toContain('white background');
        expect(result.data.prompt).toContain('soft lighting');
        expect(result.data.defaultsApplied).toContain('light_style');
        expect(result.data.defaultsApplied).toContain('lens');
      }
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
  });

  describe('generateIdempotencyKey', () => {
    it('generates key with template and version', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key = generateIdempotencyKey('product-photo', 1, {});

      expect(key).toBe('product-photo::v1::');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('generates consistent keys regardless of variable order', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key1 = generateIdempotencyKey('test', 1, { a: 'x', b: 'y', c: 'z' });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key2 = generateIdempotencyKey('test', 1, { c: 'z', a: 'x', b: 'y' });

      expect(key1).toBe(key2);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('includes batch label when provided', () => {
      const key = generateIdempotencyKey('test', 1, { a: 'x' }, 'batch-1');

      expect(key).toContain('batch-1');
      expect(key).toBe('test::v1::a=x::batch-1');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles empty variables', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key = generateIdempotencyKey('test', 2, {});

      expect(key).toBe('test::v2::');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('converts variable values to strings', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key = generateIdempotencyKey('test', 1, { num: 42, bool: true });

      expect(key).toContain('num=42');
      expect(key).toContain('bool=true');
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('generates different keys for different versions', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key1 = generateIdempotencyKey('test', 1, { a: 'x' });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key2 = generateIdempotencyKey('test', 2, { a: 'x' });

      expect(key1).not.toBe(key2);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('generates different keys for different variables', () => {
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key1 = generateIdempotencyKey('test', 1, { a: 'x' });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const key2 = generateIdempotencyKey('test', 1, { a: 'y' });

      expect(key1).not.toBe(key2);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
  });

  describe('extractVariableNames', () => {
    it('extracts single variable name', () => {
      const names = extractVariableNames('Hello {name}');

      expect(names).toEqual(['name']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('extracts multiple variable names', () => {
      const names = extractVariableNames('Hello {name}, your {item} is ready');

      expect(names).toEqual(['name', 'item']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('deduplicates variable names', () => {
      const names = extractVariableNames('{x} and {x} again');

      expect(names).toEqual(['x']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles template with no variables', () => {
      const names = extractVariableNames('No variables here');

      expect(names).toEqual([]);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles empty string', () => {
      const names = extractVariableNames('');

      expect(names).toEqual([]);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles variables with underscores and numbers', () => {
      const names = extractVariableNames('{var_1} and {var_2}');

      expect(names).toEqual(['var_1', 'var_2']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('preserves order of first occurrence', () => {
      const names = extractVariableNames('{b} {a} {c} {a}');

      expect(names).toEqual(['b', 'a', 'c']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('deduplicates across components', () => {
      const templateData: TemplateData = {
        subject: 'A {color} product',
        background: '{color} background',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toEqual(['color']);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('handles template with no variables', () => {
      const templateData: TemplateData = {
        subject: 'A static product photo',
      };
      const names = getTemplateVariables(templateData);

      expect(names).toEqual([]);
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });

    it('returns null for template with no variables', () => {
      const templateData: TemplateData = {
        subject: 'Static photo',
      };
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
      const error = validateTemplateVariables(templateData, {});

      expect(error).toBeNull();
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
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
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
    });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
  });
describe('stripEmptyVariables', () => {
    it('removes middle empty variables', () => {
      expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
    });

    it('removes trailing empty variables', () => {
      expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
    });

    it('removes leading empty variables after first element', () => {
      expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
    });

    it('handles multiple consecutive spaces', () => {
      expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
    });

    it('preserves text with no empty variables', () => {
      expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
    });

    it('handles empty string', () => {
      expect(stripEmptyVariables('')).toBe('');
    });
  });

  describe('compileTemplate with empty variables', () => {
    it('strips empty color and material from prompt', () => {
      const template = {
        subject: 'Photo of {product}, {color}, {material}',
      };

      const schema = {
        product: { type: 'string', required: true },
        color: { type: 'string', required: false, default: '' },
        material: { type: 'string', required: false, default: '' }
      };

      const result = compileTemplate(template, schema, { product: 'bag' });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.prompt).toBe('Photo of bag');
      }
    });
  });
});