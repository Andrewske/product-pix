import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // Relax rules for test files (standard practice)
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
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
