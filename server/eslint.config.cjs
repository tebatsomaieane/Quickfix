// ESLint flat config for the QuickFix API server (CommonJS + Node).
// Pragmatic baseline: real errors fail the build, style nits warn only.
const globals = require("globals");

module.exports = [
    {
        files: ["**/*.js"],
        ignores: ["node_modules/**", "uploads/**"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["error", { argsIgnorePattern: "^_", args: "none" }],
            eqeqeq: ["warn", "smart"],
            "no-var": "warn",
            "prefer-const": "warn",
            "no-dupe-keys": "error",
            "no-dupe-args": "error",
            "no-unreachable": "error",
            "no-constant-condition": "error",
            "no-prototype-builtins": "warn"
        }
    }
];