import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Test files are excluded from this package's tsconfig, so the type-aware
    // parser (projectService) can't resolve them — mirror that exclusion here.
    ignores: ["dist", "node_modules", "tsup.config.ts", "**/*.test.ts", "**/*.test.tsx"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-var": "off",
      "prefer-const": "off",
    },
  }
);
