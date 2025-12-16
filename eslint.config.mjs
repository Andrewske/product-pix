import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        }
      ],
    },
  },
  // Relax rules for test files (standard practice)
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        }
      ],
      "@next/next/no-img-element": "off",  // Allow img tags in test mocks
    },
  },
  // Relax rules for shadcn/ui components (library code)
  {
    files: ["src/components/ui/**"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    // Require explicit return types at module boundaries (lib + API routes)
    files: [
      "src/lib/**/*.ts",           // Library utilities
      "src/app/api/**/route.ts",   // API route handlers
      "src/hooks/**/*.ts",         // Custom hooks
    ],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,                               // Allow inline callbacks
          allowTypedFunctionExpressions: true,                  // Allow typed factory functions
          allowHigherOrderFunctions: true,                      // Allow HOFs
          allowDirectConstAssertionInArrowFunctions: true,      // Allow `as const` pattern
        },
      ],
    },
   },
    // Ban console.error in API routes and lib code (allow warn/info for structured logging)
    {
      files: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
      rules: {
        "no-console": ["error", { "allow": ["warn", "info"] }]
      }
    },
    // Allow console.error in logging library (centralized logging system)
    {
      files: ["src/lib/logging/index.ts"],
      rules: {
        "no-console": ["error", { "allow": ["warn", "info", "error"] }]
      }
    },
   globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "prompt-bench/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
