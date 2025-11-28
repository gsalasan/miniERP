module.exports = {
  root: true,
  extends: [
    '../../eslint.config.js'
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Override any specific rules for this service if needed
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.ts'
  ]
};