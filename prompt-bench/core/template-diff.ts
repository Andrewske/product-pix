/**
 * Template diffing utilities for comparing template versions
 */

import type { PromptTemplate } from '@bench/core/types';
import type { TemplateChange } from '@bench/core/improvement-types';

/**
 * Generate a structured diff between two template versions
 */
export const generateDiff = (
  baseline: PromptTemplate,
  improved: PromptTemplate
): TemplateChange[] => {
  const changes: TemplateChange[] = [];

  // Compare templateData
  const templateDataChanges = diffObject(
    baseline.templateData,
    improved.templateData,
    'templateData'
  );
  changes.push(...templateDataChanges);

  // Compare variablesSchema
  const schemaChanges = diffVariablesSchema(
    baseline.variablesSchema,
    improved.variablesSchema
  );
  changes.push(...schemaChanges);

  // Compare other top-level fields
  if (baseline.slug !== improved.slug) {
    changes.push({
      type: 'modification',
      path: 'slug',
      oldValue: baseline.slug,
      newValue: improved.slug,
      description: `Template slug changed from "${baseline.slug}" to "${improved.slug}"`,
    });
  }

  if (baseline.version !== improved.version) {
    changes.push({
      type: 'modification',
      path: 'version',
      oldValue: baseline.version,
      newValue: improved.version,
      description: `Template version changed from ${baseline.version} to ${improved.version}`,
    });
  }

  if (baseline.status !== improved.status) {
    changes.push({
      type: 'modification',
      path: 'status',
      oldValue: baseline.status,
      newValue: improved.status,
      description: `Template status changed from "${baseline.status}" to "${improved.status}"`,
    });
  }

  return changes;
};

/**
 * Diff two objects recursively
 */
const diffObject = (
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  basePath: string
): TemplateChange[] => {
  const changes: TemplateChange[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = `${basePath}.${key}`;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (!(key in oldObj)) {
      // Addition
      changes.push({
        type: 'addition',
        path,
        newValue,
        description: `Added ${key}: ${formatValue(newValue)}`,
      });
    } else if (!(key in newObj)) {
      // Removal
      changes.push({
        type: 'removal',
        path,
        oldValue,
        description: `Removed ${key}: ${formatValue(oldValue)}`,
      });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // Modification
      if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
        // Recursive diff for nested objects
        if (Array.isArray(oldValue) || Array.isArray(newValue)) {
          changes.push({
            type: 'modification',
            path,
            oldValue,
            newValue,
            description: `${key} changed from ${formatValue(oldValue)} to ${formatValue(newValue)}`,
          });
        } else {
          const nestedChanges = diffObject(
            oldValue as Record<string, unknown>,
            newValue as Record<string, unknown>,
            path
          );
          changes.push(...nestedChanges);
        }
      } else {
        changes.push({
          type: 'modification',
          path,
          oldValue,
          newValue,
          description: `${key} changed from "${formatValue(oldValue)}" to "${formatValue(newValue)}"`,
        });
      }
    }
  }

  return changes;
};

/**
 * Diff variables schema with special handling for variable definitions
 */
const diffVariablesSchema = (
  oldSchema: Record<string, unknown>,
  newSchema: Record<string, unknown>
): TemplateChange[] => {
  const changes: TemplateChange[] = [];
  const allKeys = new Set([...Object.keys(oldSchema), ...Object.keys(newSchema)]);

  for (const key of allKeys) {
    const path = `variablesSchema.${key}`;
    const oldVar = oldSchema[key] as Record<string, unknown> | undefined;
    const newVar = newSchema[key] as Record<string, unknown> | undefined;

    if (!oldVar) {
      // New variable added
      changes.push({
        type: 'addition',
        path,
        newValue: newVar,
        description: `Added variable "${key}": ${formatVariableDef(newVar)}`,
      });
    } else if (!newVar) {
      // Variable removed
      changes.push({
        type: 'removal',
        path,
        oldValue: oldVar,
        description: `Removed variable "${key}": ${formatVariableDef(oldVar)}`,
      });
    } else {
      // Variable modified - check each property
      const varChanges = diffObject(oldVar, newVar, path);
      if (varChanges.length > 0) {
        // Check if it's a logic change (type change, required change, etc.)
        if (oldVar.type !== newVar.type) {
          changes.push({
            type: 'logic_change',
            path,
            oldValue: oldVar,
            newValue: newVar,
            description: `Variable "${key}" type changed from "${oldVar.type}" to "${newVar.type}"`,
          });
        } else if (oldVar.required !== newVar.required) {
          changes.push({
            type: 'logic_change',
            path,
            oldValue: oldVar,
            newValue: newVar,
            description: `Variable "${key}" required status changed from ${oldVar.required} to ${newVar.required}`,
          });
        } else {
          changes.push(...varChanges);
        }
      }
    }
  }

  return changes;
};

/**
 * Format a value for display in change descriptions
 */
const formatValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2).slice(0, 100);
  }
  return String(value);
};

/**
 * Format a variable definition for display
 */
const formatVariableDef = (def: Record<string, unknown> | undefined): string => {
  if (!def) return 'undefined';
  const parts: string[] = [];
  if (def.type) parts.push(`type: ${def.type}`);
  if (def.required !== undefined) parts.push(`required: ${def.required}`);
  if (def.options) parts.push(`options: [${(def.options as string[]).join(', ')}]`);
  if (def.default !== undefined) parts.push(`default: ${def.default}`);
  return `{${parts.join(', ')}}`;
};

