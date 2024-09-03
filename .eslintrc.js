module.exports = {
  env: {
    es6: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    requireConfigFile: false,
  },
  root: true,
  rules: {
    quotes: ["error", "double"],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "all",
        ignoreRestSiblings: false,
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        caughtErrors: "none",
      },
    ],
    "comma-dangle": ["error", "always-multiline"],
    semi: ["error", "never"],
  },
};
