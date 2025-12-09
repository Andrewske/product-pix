/**
 * Template file I/O utilities
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname, join } from 'node:path';
import type { Result } from '@bench/core/errors';
import { ok, err, createError } from '@bench/core/errors';
import type { PromptTemplate } from '@bench/core/types';

/**
 * Read a template file and parse it as TypeScript
 * Returns the template object (not the full PromptTemplate with id, etc.)
 */
export const readTemplateFile = async (
  filePath: string
): Promise<Result<Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>>> => {
  const absolutePath = resolve(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    return err(
      createError('VALIDATION_ERROR', `Template file not found: ${absolutePath}`)
    );
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    
    // For now, we'll use a simple approach: require the file
    // In production, you might want to use TypeScript compiler API
    // or a more sophisticated approach
    delete require.cache[absolutePath];
    const module = require(absolutePath);
    
    // Look for exported template object
    // Templates typically export a const like ECOMMERCE_BASE
    const exports = Object.keys(module);
    let template: unknown;
    
    for (const exportName of exports) {
      const exported = module[exportName];
      if (exported && typeof exported === 'object' && 'slug' in exported && 'templateData' in exported) {
        template = exported;
        break;
      }
    }
    
    if (!template) {
      return err(
        createError(
          'VALIDATION_ERROR',
          `No template object found in ${absolutePath}. Expected an export with 'slug' and 'templateData' properties.`
        )
      );
    }

    // Validate it has required fields
    const templateObj = template as Record<string, unknown>;
    if (!templateObj.slug || !templateObj.templateData || !templateObj.variablesSchema) {
      return err(
        createError(
          'VALIDATION_ERROR',
          `Invalid template structure in ${absolutePath}. Missing required fields.`
        )
      );
    }

    return ok(templateObj as Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('VALIDATION_ERROR', `Failed to read template file: ${message}`)
    );
  }
};

/**
 * Write a template to a file
 * Generates TypeScript code for the template
 */
export const writeTemplateFile = (
  template: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>,
  filePath: string
): Result<void> => {
  try {
    const absolutePath = resolve(process.cwd(), filePath);
    const dir = dirname(absolutePath);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      return err(
        createError('VALIDATION_ERROR', `Directory does not exist: ${dir}`)
      );
    }

    // Generate TypeScript code
    const code = generateTemplateCode(template);
    
    writeFileSync(absolutePath, code, 'utf-8');
    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('VALIDATION_ERROR', `Failed to write template file: ${message}`)
    );
  }
};

/**
 * Generate a versioned filename (e.g., ecommerce-base-v2.ts)
 */
export const generateVersionedFilename = (
  originalPath: string,
  version: number
): string => {
  const absolutePath = resolve(process.cwd(), originalPath);
  const dir = dirname(absolutePath);
  const base = basename(absolutePath, extname(absolutePath));
  const ext = extname(absolutePath);
  
  // Remove existing version suffix if present (e.g., ecommerce-base-v2 -> ecommerce-base)
  const baseWithoutVersion = base.replace(/-v\d+$/, '');
  
  return join(dir, `${baseWithoutVersion}-v${version}${ext}`);
};

/**
 * Validate TypeScript code syntax (basic check)
 */
export const validateTemplateCode = (code: string): Result<void> => {
  // Basic validation: check for common syntax errors
  // In production, you might want to use TypeScript compiler API
  
  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return err(
      createError('VALIDATION_ERROR', 'Unbalanced braces in template code')
    );
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return err(
      createError('VALIDATION_ERROR', 'Unbalanced parentheses in template code')
    );
  }

  // Check for export statement
  if (!code.includes('export')) {
    return err(
      createError('VALIDATION_ERROR', 'Template code must include an export statement')
    );
  }

  return ok(undefined);
};

/**
 * Generate TypeScript code for a template
 */
const generateTemplateCode = (
  template: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>
): string => {
  const slugUpper = template.slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_')
    .toUpperCase();

  const lines: string[] = [];
  lines.push("import { type PromptTemplate } from '@bench/core/types';");
  lines.push('');
  lines.push(`/**`);
  lines.push(` * ${template.slug} template (version ${template.version})`);
  lines.push(` */`);
  lines.push(
    `export const ${slugUpper}: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {`
  );
  lines.push(`  slug: ${JSON.stringify(template.slug)},`);
  lines.push(`  version: ${template.version},`);
  lines.push(`  status: ${JSON.stringify(template.status)},`);
  lines.push(`  templateData: ${JSON.stringify(template.templateData, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')},`);
  lines.push(`  variablesSchema: ${JSON.stringify(template.variablesSchema, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')},`);
  lines.push(`};`);

  return lines.join('\n');
};

