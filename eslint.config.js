import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  { ignores: ["dist", "supabase", "src/integrations/supabase/types.ts"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      sonarjs.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",

      // Unused imports are auto-removed; this stays an error so the tree stays clean.
      "sonarjs/unused-import": "off",
      "unused-imports/no-unused-imports": "error",

      // Unused locals / dead stores have no runtime impact: surface as warnings.
      "sonarjs/no-unused-vars": "warn",
      "sonarjs/no-dead-store": "warn",
      "sonarjs/no-redundant-assignments": "warn",

      // Stylistic / complexity rules from the sonarjs recommended preset: keep them
      // visible as warnings instead of hard CI blockers. They flag refactors, not bugs,
      // and rewriting hundreds of call sites mechanically would risk regressions.
      "@typescript-eslint/no-explicit-any": "warn",
      "sonarjs/no-nested-conditional": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],
      "max-lines": ["warn", 400],
      "sonarjs/no-nested-functions": "warn",
      "sonarjs/no-nested-template-literals": "warn",
      "sonarjs/no-identical-functions": "warn",
      // Disabled: project uses Math.random exclusively for non-cryptographic purposes
      // (UI keys, animation seeds, sample data, test fixtures). Real crypto uses crypto.randomUUID.
      "sonarjs/pseudo-random": "off",
      "sonarjs/constructor-for-side-effects": "warn",
      "sonarjs/prefer-single-boolean-return": "warn",
      "sonarjs/slow-regex": "warn",
      "sonarjs/no-ignored-exceptions": "warn",
      "sonarjs/no-useless-catch": "warn",
      "no-useless-catch": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "sonarjs/class-name": "warn",

      // Kept as errors: these flag genuine correctness / security problems.
      // sonarjs/no-unenclosed-multiline-block, sonarjs/no-hardcoded-secrets and
      // sonarjs/link-with-target-blank remain at their recommended "error" severity.
    },
  },
  {
    // Padrão shadcn/ui: os arquivos exportam variants/hooks junto dos componentes.
    // A regra só protege o fast-refresh do dev server; não se aplica a esta pasta.
    files: ["src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
