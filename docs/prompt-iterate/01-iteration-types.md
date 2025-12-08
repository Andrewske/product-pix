# Task 01: Create Iteration Types

## Objective
Create the core type definitions for the prompt iteration system.

## File to Create
`prompt-bench/core/iteration-types.ts`

## Context
The prompt-bench system uses:
- Zod schemas for validation (see `prompt-bench/core/types.ts` for patterns)
- Result type pattern from `prompt-bench/core/errors.ts`
- TemplateData type from `prompt-bench/core/types.ts`

## Requirements

### 1. Mutation Types
```typescript
export const MutationTypeSchema = z.enum([
  'wording',      // Change phrasing while keeping intent
  'addition',     // Add new descriptive elements
  'removal',      // Simplify by removing elements
  'substitution', // Replace one concept with another
  'emphasis',     // Strengthen or weaken an aspect
  'wild'          // Experimental/creative variation
]);
```

### 2. Variation Source
```typescript
export const VariationSourceSchema = z.enum([
  'mutation',     // Single parent mutation
  'crossover',    // Two parent combination
  'wild',         // Random exploration
  'user'          // User-provided custom variation
]);
```

### 3. PromptVariation Schema
Fields:
- `id`: string (uuid)
- `parentIds`: string[] (empty for initial, 1 for mutation, 2 for crossover)
- `source`: VariationSource
- `mutationType`: MutationType (optional)
- `templateData`: TemplateData (import from types.ts)
- `rationale`: string (why this variation might improve)
- `confidence`: number 0-1 (AI confidence in improvement)
- `approved`: boolean (optional, human approval status)
- `score`: number (optional, evaluation score once tested)

### 4. StructuredInsight Schema
Extends the concept from `insights.ts` InsightResult:
- `keyFindings`: string[]
- `recommendations`: string[]
- `nextSteps`: string[]
- `proposedVariations`: PromptVariation[]
- `successPatterns`: Array<{ pattern: string, component: string, frequency: number, avgScore: number }>
- `failurePatterns`: Array<{ pattern: string, component: string, frequency: number, avgScore: number }>
- `tokensUsed`: number
- `costUsd`: number

### 5. IterationState Schema
Session state persisted between runs:
- `sessionId`: string (uuid)
- `templateSlug`: string
- `templateVersion`: number
- `createdAt`: string (datetime)
- `updatedAt`: string (datetime)
- `generations`: Array of generation records
- `currentPopulation`: Array<{ variationId: string, fitness: number, generation: number }>
- `scoreHistory`: Array<{ generation: number, best: number, mean: number, stdDev: number }>
- `config`: IterationConfig

### 6. IterationConfig Schema
- `populationSize`: number (default 8)
- `eliteCount`: number (default 2)
- `mutationRate`: number (default 0.6)
- `crossoverRate`: number (default 0.3)
- `wildRate`: number (default 0.1)
- `convergenceThreshold`: number (default 0.05)
- `maxGenerations`: number (default 10)

### 7. Generation Record Schema
- `generation`: number
- `batchLabel`: string
- `variations`: PromptVariation[]
- `bestScore`: number (optional)
- `meanScore`: number (optional)
- `completedAt`: string datetime (optional)

### 8. IterationProposal Schema
For human-in-the-loop approval:
- `generation`: number
- `sessionId`: string
- `baselineScore`: number
- `proposedVariations`: PromptVariation[]
- `insights`: StructuredInsight

## Export Requirements
- Export all Zod schemas with `Schema` suffix
- Export all inferred types using `z.infer<>`
- Follow patterns from `prompt-bench/core/types.ts`

## Validation
- All schemas should be strict (no `.passthrough()` except where needed)
- Use discriminated unions where appropriate
- Include JSDoc comments for complex types
