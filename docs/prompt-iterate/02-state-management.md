# Task 02: Create State Management Module

## Objective
Create session persistence for iteration state using JSON files.

## File to Create
`prompt-bench/core/state.ts`

## Directory to Create
`prompt-bench/sessions/` (with `.gitkeep`)

## Context
- Uses types from `prompt-bench/core/iteration-types.ts` (Task 01)
- Uses Result type from `prompt-bench/core/errors.ts`
- Sessions stored as JSON files in `prompt-bench/sessions/`

## Required Functions

### 1. createSession
```typescript
export const createSession = (
  templateSlug: string,
  templateVersion: number,
  config?: Partial<IterationConfig>
): IterationState
```
- Generate UUID for sessionId
- Set createdAt/updatedAt to current ISO datetime
- Initialize empty generations, currentPopulation, scoreHistory
- Merge provided config with defaults

### 2. loadSession
```typescript
export const loadSession = async (
  sessionId: string
): Promise<Result<IterationState>>
```
- Read from `prompt-bench/sessions/{sessionId}.json`
- Validate with Zod schema
- Return error if file not found or invalid

### 3. saveSession
```typescript
export const saveSession = async (
  state: IterationState
): Promise<Result<void>>
```
- Update `updatedAt` timestamp
- Write to `prompt-bench/sessions/{sessionId}.json`
- Use atomic write pattern (write to temp, then rename)
- Ensure sessions directory exists

### 4. listSessions
```typescript
export const listSessions = async (): Promise<Result<SessionSummary[]>>
```
- List all `.json` files in sessions directory
- Return summary: sessionId, templateSlug, createdAt, generationCount, lastScore

### 5. deleteSession
```typescript
export const deleteSession = async (
  sessionId: string
): Promise<Result<void>>
```
- Remove session file
- Return error if not found

### 6. getLatestSession
```typescript
export const getLatestSession = async (
  templateSlug?: string
): Promise<Result<IterationState | null>>
```
- Find most recent session (optionally filtered by template)
- Return null if none found

## Helper Types
```typescript
interface SessionSummary {
  sessionId: string;
  templateSlug: string;
  createdAt: string;
  generationCount: number;
  lastBestScore: number | null;
}
```

## Constants
```typescript
const SESSIONS_DIR = 'prompt-bench/sessions';

const DEFAULT_CONFIG: IterationConfig = {
  populationSize: 8,
  eliteCount: 2,
  mutationRate: 0.6,
  crossoverRate: 0.3,
  wildRate: 0.1,
  convergenceThreshold: 0.05,
  maxGenerations: 10,
};
```

## Implementation Notes
- Use `node:fs/promises` for async file operations
- Use `node:path` for path construction
- Use `node:crypto` randomUUID for session IDs
- Handle concurrent access gracefully (atomic writes)
- Validate JSON on load with Zod schema
