# Task 04: Create Evolution Engine

## Objective
Implement evolutionary operators: selection, mutation, crossover, and wild variation generation.

## File to Create
`prompt-bench/core/evolution.ts`

## Context
- Uses types from `prompt-bench/core/iteration-types.ts`
- Uses Result type from `prompt-bench/core/errors.ts`
- Uses Anthropic SDK for Claude API calls
- TemplateData from `prompt-bench/core/types.ts`

## Required Functions

### 1. Tournament Selection
```typescript
export const selectParents = (
  population: IterationState['currentPopulation'],
  count: number,
  tournamentSize?: number  // default 3
): string[]
```
- Tournament selection: pick `tournamentSize` random, take highest fitness
- Return array of variationIds
- Used for selecting parents for mutation/crossover

### 2. Generate Mutation
```typescript
export const generateMutation = async (
  parent: TemplateData,
  mutationType: MutationType,
  context: {
    successPatterns: string[];
    failurePatterns: string[];
  }
): Promise<Result<PromptVariation>>
```

Claude prompt should:
- Take parent templateData
- Apply specified mutation type
- Reinforce success patterns, avoid failure patterns
- Return new templateData with rationale

### 3. Generate Crossover
```typescript
export const generateCrossover = async (
  parent1: TemplateData,
  parent2: TemplateData,
  weights: { p1: number; p2: number }  // scores for weighting
): Promise<Result<PromptVariation>>
```

Claude prompt should:
- Combine components from both parents
- Weight by relative scores (favor higher-scoring parent)
- Create coherent combination
- Return new templateData with rationale

### 4. Generate Wild Variation
```typescript
export const generateWild = async (
  baseTemplate: TemplateData,
  avoidPatterns: string[]
): Promise<Result<PromptVariation>>
```

Claude prompt should:
- Create creative/experimental variation
- Explicitly avoid known failure patterns
- Try novel approaches not yet tested
- Return new templateData with rationale

### 5. Main Evolution Function
```typescript
export const evolvePopulation = async (
  state: IterationState,
  insights: StructuredInsight,
  config: IterationConfig
): Promise<Result<PromptVariation[]>>
```

Algorithm:
1. **Elite Selection**: Keep top `eliteCount` unchanged
2. **Calculate Counts**:
   - mutations = floor(remaining * mutationRate)
   - crossovers = floor(remaining * crossoverRate)
   - wilds = remaining - mutations - crossovers
3. **Generate Mutations**:
   - Select parents via tournament
   - Random mutation type for each
   - Call generateMutation
4. **Generate Crossovers**:
   - Select pairs of parents
   - Call generateCrossover
5. **Generate Wilds**:
   - Use base template
   - Call generateWild
6. Return all variations (elites + new)

### 6. Helper: Get Variation TemplateData
```typescript
export const getVariationTemplateData = (
  variationId: string,
  state: IterationState
): TemplateData | null
```
- Look up templateData for a variation ID from state

## Claude Prompts

### Mutation Prompt Template
```
You are an expert AI prompt engineer. Mutate this e-commerce product photo prompt.

Mutation Type: {mutationType}
- wording: Change phrasing while keeping intent
- addition: Add new descriptive elements
- removal: Simplify by removing elements
- substitution: Replace concepts with alternatives
- emphasis: Strengthen or weaken aspects

Current Template:
{JSON of parent templateData}

Success Patterns to Reinforce: {patterns}
Failure Patterns to Avoid: {patterns}

Return JSON only:
{
  "templateData": { subject, background, lighting, camera, style, quality, negative },
  "rationale": "Why this mutation should improve scores",
  "confidence": 0.0-1.0
}
```

### Crossover Prompt Template
```
You are an expert AI prompt engineer. Combine these two successful prompts.

Parent 1 (Score: {score1}):
{JSON of parent1 templateData}

Parent 2 (Score: {score2}):
{JSON of parent2 templateData}

Create a child that combines the best elements. Weight toward Parent {higher_scoring}.

Return JSON only:
{
  "templateData": { subject, background, lighting, camera, style, quality, negative },
  "rationale": "Why this combination should improve scores",
  "confidence": 0.0-1.0
}
```

### Wild Prompt Template
```
You are an expert AI prompt engineer. Create an experimental variation.

Base Template (for reference):
{JSON of base templateData}

Patterns to AVOID (known failures): {patterns}

Create something novel and creative that hasn't been tried. Be bold but professional.

Return JSON only:
{
  "templateData": { subject, background, lighting, camera, style, quality, negative },
  "rationale": "Why this experimental approach might work",
  "confidence": 0.0-1.0
}
```

## Implementation Notes
- Use Claude Sonnet (`claude-sonnet-4-20250514`) for generation
- Track token usage and costs
- Generate UUIDs for new variation IDs
- Handle API errors gracefully with Result type
- Rate limit API calls (1 second between requests)
