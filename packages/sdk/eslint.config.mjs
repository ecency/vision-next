import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // `scripts` holds CommonJS build/validation scripts (.cjs) that legitimately use
    // require(); linting them with the TS recommended rules is a false positive.
    ignores: ["dist", "node_modules", "tsup.config.ts", "scripts"],
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
