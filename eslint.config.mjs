// @ts-check
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    name: "eslint/recommended",
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommended,
  {
    name: "typescript-eslint/tsconfig",
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  {
    name: "react/recommended",
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: { version: "detect" },
    },
  },
  {
    name: "react/jsx-runtime",
    ...reactPlugin.configs.flat["jsx-runtime"],
  },
  {
    name: "react-hooks/recommended",
    ...hooksPlugin.configs.flat.recommended,
  },
  {
    name: "prettier/config",
    ...prettierConfig,
  },
  {
    name: "custom/ignores",
    ignores: [".wxt/", ".output/", "node_modules/"],
  },
  {
    name: "custom/rules",
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
    },
  },
);
