# Testing Guide

Testing patterns and examples for ProductPix.

## Test Organization

```
src/
├── app/
│   └── __tests__/          # Integration tests for pages
├── lib/
│   ├── ai/__tests__/       # AI provider tests
│   ├── auth/__tests__/     # Auth utility tests
│   ├── db/__tests__/       # Database query tests
│   ├── pricing/__tests__/  # Pricing calculation tests
│   └── r2/__tests__/       # R2 storage tests

prompt-bench/
└── __tests__/              # prompt-bench unit tests
    ├── compiler.test.ts
    ├── evaluator.test.ts
    └── statistics.test.ts
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific file
bun test src/lib/pricing/__tests__/models.test.ts

# Watch mode
bun test:watch

# Coverage report
bun test:coverage

# Run prompt-bench tests only
bun test prompt-bench/__tests__
```

## Testing Patterns

### Unit Tests (Pure Functions)

For pure functions like pricing calculations:

```typescript
// src/lib/pricing/__tests__/models.test.ts

import { describe, test, expect } from 'bun:test'
import { calculateCost } from '../models'

describe('calculateCost', () => {
  test('calculates cost for known model', () => {
    const cost = calculateCost({
      model: 'imagen-3.0-generate-001',
      inputTokens: 1000,
      outputTokens: 0
    })

    expect(cost).toBe(0.04)
  })

  test('throws error for unknown model', () => {
    expect(() => {
      calculateCost({
        model: 'unknown-model',
        inputTokens: 1000,
        outputTokens: 0
      })
    }).toThrow('Unknown model')
  })

  test('handles zero tokens', () => {
    const cost = calculateCost({
      model: 'claude-sonnet-4-20250514',
      inputTokens: 0,
      outputTokens: 0
    })

    expect(cost).toBe(0)
  })
})
```

### Integration Tests (Database)

For database queries (requires test database):

```typescript
// src/lib/db/__tests__/credits.test.ts

import { describe, test, expect, beforeEach } from 'bun:test'
import { getUserCredits, addCredits } from '../credits'
import { getAdminClient } from '@/lib/supabase/admin'

describe('Credit system', () => {
  const supabase = getAdminClient()
  let testUserId: string

  beforeEach(async () => {
    // Create test user
    const { data } = await supabase
      .from('users')
      .insert({ email: 'test@example.com', credits: 100 })
      .select()
      .single()

    testUserId = data.id
  })

  test('getUserCredits returns current balance', async () => {
    const credits = await getUserCredits(testUserId)
    expect(credits).toBe(100)
  })

  test('addCredits increases balance', async () => {
    await addCredits(testUserId, 50, 'test')

    const newBalance = await getUserCredits(testUserId)
    expect(newBalance).toBe(150)
  })

  test('addCredits creates transaction record', async () => {
    await addCredits(testUserId, 50, 'test')

    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    expect(data.amount).toBe(50)
    expect(data.type).toBe('test')
  })
})
```

### API Route Tests

For testing API endpoints:

```typescript
// src/app/api/generate/__tests__/route.test.ts

import { describe, test, expect } from 'bun:test'
import { POST } from '../route'

describe('POST /api/generate', () => {
  test('returns 401 when not authenticated', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'test prompt'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  test('validates request body', async () => {
    // Mock authenticated request
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required 'prompt' field
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toContain('prompt')
  })
})
```

### Mocking External Services

For AI providers and external APIs:

```typescript
// src/lib/ai/__tests__/gemini.test.ts

import { describe, test, expect, mock } from 'bun:test'
import { geminiProvider } from '../providers/gemini'

describe('Gemini provider', () => {
  test('generates image from prompt', async () => {
    // Mock the Gemini API call
    const mockGenerate = mock(() => Promise.resolve({
      images: ['base64-encoded-image-data']
    }))

    // Replace the actual API call with mock
    geminiProvider._generateInternal = mockGenerate

    const result = await geminiProvider.rawPrompt({
      prompt: 'test prompt',
      model: 'imagen-3.0-generate-001'
    })

    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(result.images).toHaveLength(1)
  })

  test('handles API errors gracefully', async () => {
    const mockGenerate = mock(() => Promise.reject(
      new Error('API quota exceeded')
    ))

    geminiProvider._generateInternal = mockGenerate

    await expect(
      geminiProvider.rawPrompt({
        prompt: 'test',
        model: 'imagen-3.0-generate-001'
      })
    ).rejects.toThrow('API quota exceeded')
  })
})
```

### Result Type Testing (prompt-bench)

Testing the Result type error handling:

```typescript
// prompt-bench/__tests__/compiler.test.ts

import { describe, test, expect } from 'bun:test'
import { compilePrompt } from '../core/compiler'
import { ok, err } from '../core/errors'

describe('compilePrompt', () => {
  test('compiles valid template with variables', () => {
    const result = compilePrompt(
      'Generate an image of {{product}} on {{background}}',
      { product: 'laptop', background: 'white desk' }
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toBe('Generate an image of laptop on white desk')
    }
  })

  test('returns error for missing variables', () => {
    const result = compilePrompt(
      'Generate an image of {{product}} on {{background}}',
      { product: 'laptop' }  // missing 'background'
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('background')
    }
  })

  test('handles empty template', () => {
    const result = compilePrompt('', {})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toBe('')
    }
  })
})
```

## Test Data Management

### Test Fixtures

Store test data in fixtures:

```typescript
// src/__tests__/fixtures/users.ts

export const testUsers = {
  withCredits: {
    id: 'test-user-1',
    email: 'user@example.com',
    credits: 100
  },
  withoutCredits: {
    id: 'test-user-2',
    email: 'broke@example.com',
    credits: 0
  }
}

// src/__tests__/fixtures/templates.ts

export const testTemplates = {
  simple: {
    slug: 'simple-test',
    template: 'Generate {{product}}',
    variables: ['product']
  },
  complex: {
    slug: 'complex-test',
    template: 'Generate {{product}} on {{background}} with {{style}} style',
    variables: ['product', 'background', 'style']
  }
}
```

### Database Seeding for Tests

```typescript
// src/__tests__/helpers/seed.ts

import { getAdminClient } from '@/lib/supabase/admin'

export async function seedTestData() {
  const supabase = getAdminClient()

  // Clean up existing test data
  await supabase.from('users').delete().like('email', '%@test.com')

  // Insert test users
  const { data: users } = await supabase
    .from('users')
    .insert([
      { email: 'user1@test.com', credits: 100 },
      { email: 'user2@test.com', credits: 0 }
    ])
    .select()

  return { users }
}

export async function cleanupTestData() {
  const supabase = getAdminClient()

  // Delete all test data
  await supabase.from('users').delete().like('email', '%@test.com')
  await supabase.from('jobs').delete().is('metadata->test', true)
}
```

## Coverage Targets

Aim for 70-80% coverage:

```bash
# Run with coverage
bun test:coverage

# View HTML report
open coverage/index.html
```

**Focus coverage on**:
- Business logic (pricing, credits)
- Data transformations
- Error handling paths
- Edge cases

**Lower priority for coverage**:
- Simple getters/setters
- Type definitions
- UI components (use E2E tests instead)

## E2E Testing (Future)

For full user flows, consider Playwright:

```typescript
// e2e/generation.spec.ts (example)

import { test, expect } from '@playwright/test'

test('user can generate image', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to generation
  await page.goto('/generate')

  // Fill prompt
  await page.fill('[name="prompt"]', 'A red apple')

  // Submit
  await page.click('button:has-text("Generate")')

  // Wait for result
  await page.waitForSelector('img[alt="Generated image"]')

  // Verify image appeared
  const image = page.locator('img[alt="Generated image"]')
  await expect(image).toBeVisible()
})
```

## Test Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ Bad
test('it works', () => { ... })

// ✅ Good
test('calculates cost for Gemini model with 1000 tokens', () => { ... })
```

### 2. Test One Thing Per Test

```typescript
// ❌ Bad - testing multiple behaviors
test('credit system', async () => {
  await addCredits(userId, 50, 'test')
  expect(await getUserCredits(userId)).toBe(150)

  await consumeCredits(userId, 30)
  expect(await getUserCredits(userId)).toBe(120)

  await refundCredits(userId, 10, jobId)
  expect(await getUserCredits(userId)).toBe(130)
})

// ✅ Good - separate tests
test('addCredits increases balance', async () => { ... })
test('consumeCredits decreases balance', async () => { ... })
test('refundCredits increases balance', async () => { ... })
```

### 3. Arrange-Act-Assert Pattern

```typescript
test('compiles template with variables', () => {
  // Arrange - set up test data
  const template = 'Generate {{product}}'
  const variables = { product: 'laptop' }

  // Act - perform the operation
  const result = compilePrompt(template, variables)

  // Assert - verify the outcome
  expect(result.success).toBe(true)
  expect(result.value).toBe('Generate laptop')
})
```

### 4. Clean Up After Tests

```typescript
import { afterEach } from 'bun:test'

afterEach(async () => {
  // Clean up test data
  await cleanupTestData()
})
```

### 5. Use Test Helpers

```typescript
// src/__tests__/helpers/assertions.ts

export function expectSuccessResult<T>(result: Result<T>) {
  expect(result.success).toBe(true)
  if (!result.success) {
    throw new Error('Expected success result')
  }
  return result.value
}

export function expectErrorResult<T>(result: Result<T>) {
  expect(result.success).toBe(false)
  if (result.success) {
    throw new Error('Expected error result')
  }
  return result.error
}

// Usage in tests
test('returns success for valid input', () => {
  const result = compilePrompt(template, variables)
  const value = expectSuccessResult(result)
  expect(value).toBe('compiled prompt')
})
```

## Testing prompt-bench

### Running prompt-bench Tests

```bash
# All prompt-bench tests
bun test prompt-bench/__tests__

# Specific test file
bun test prompt-bench/__tests__/compiler.test.ts

# With coverage
bun test --coverage prompt-bench/__tests__
```

### Testing Templates

```typescript
// prompt-bench/__tests__/templates.test.ts

import { describe, test, expect } from 'bun:test'
import { templates } from '../templates/registry'
import { compilePrompt } from '../core/compiler'

describe('Template registry', () => {
  test('all templates have required fields', () => {
    templates.forEach(template => {
      expect(template.slug).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.template).toBeTruthy()
      expect(Array.isArray(template.variables)).toBe(true)
    })
  })

  test('template variables match placeholders', () => {
    templates.forEach(template => {
      // Extract {{variable}} placeholders
      const placeholders = template.template.match(/\{\{(\w+)\}\}/g) || []
      const placeholderNames = placeholders.map(p => p.slice(2, -2))

      // Verify all placeholders are in variables array
      placeholderNames.forEach(name => {
        expect(template.variables).toContain(name)
      })
    })
  })
})
```

### Testing Evaluation

```typescript
// prompt-bench/__tests__/evaluator.test.ts

import { describe, test, expect } from 'bun:test'
import { evaluateImage } from '../core/evaluator'

describe('Image evaluator', () => {
  test('returns score between 0 and 100', async () => {
    const result = await evaluateImage({
      imageUrl: 'https://example.com/test.png',
      criteria: 'Product visibility and appeal'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.score).toBeGreaterThanOrEqual(0)
      expect(result.value.score).toBeLessThanOrEqual(100)
    }
  })

  test('handles invalid image URL', async () => {
    const result = await evaluateImage({
      imageUrl: 'invalid-url',
      criteria: 'Test criteria'
    })

    expect(result.success).toBe(false)
  })
})
```

## Debugging Failing Tests

### 1. Run Single Test

```bash
# Run only the failing test
bun test -t "specific test name"
```

### 2. Add Debug Logging

```typescript
test('failing test', () => {
  const result = someFunction(input)

  // Add temporary logging
  console.log('Input:', input)
  console.log('Result:', result)
  console.log('Result type:', typeof result)

  expect(result).toBe(expected)
})
```

### 3. Check Test Isolation

```typescript
// Ensure tests don't depend on each other
beforeEach(() => {
  // Reset state before each test
})

afterEach(() => {
  // Clean up after each test
})
```

### 4. Verify Test Environment

```bash
# Check environment variables are loaded
echo $NODE_ENV  # Should be "test"
echo $SUPABASE_URL  # Should point to test instance

# Verify test database is accessible
bun run scripts/test-db-connection.ts
```

## CI/CD Integration

For automated testing in CI:

```yaml
# .github/workflows/test.yml (example)

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```
