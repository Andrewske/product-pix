import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  roots: ['<rootDir>/src', '<rootDir>/prompt-bench'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@bench/(.*)$': '<rootDir>/prompt-bench/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  collectCoverageFrom: [
    'src/lib/ai/**/*.ts',
    '!src/lib/ai/**/*.test.ts',
    '!src/lib/ai/index.ts',

    'src/lib/prompts/**/*.ts',
    '!src/lib/prompts/**/*.test.ts',
    '!src/lib/prompts/index.ts',
    'prompt-bench/**/*.ts',
    '!prompt-bench/**/*.test.ts',
    '!prompt-bench/**/index.ts',
    '!prompt-bench/fixtures/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;