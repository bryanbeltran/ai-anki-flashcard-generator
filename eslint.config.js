import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "examples/**",
      "docs/screenshots/**",
      "data/**",
    ],
  },
  {
    files: [
      "src/**/*.js",
      "test/**/*.js",
      "scripts/**/*.js",
      "eslint.config.js",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      eqeqeq: ["error", "smart"],
      "no-constant-condition": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": [
        "error",
        { args: "none", caughtErrors: "none", ignoreRestSiblings: true },
      ],
    },
  },
];
