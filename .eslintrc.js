module.exports = {
  root: true,
  extends: '@react-native-community',
  env: {
    jest: true,
  },
  ignorePatterns: ['dist/**', 'coverage/**', 'src/theme/**'],
  rules: {
    'prettier/prettier': 'error',
    'react-native/no-inline-styles': 'off', // Allow inline styles for dynamic styling

    // Warn against hardcoded hex colors - use theme colors instead
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
        message:
          'Avoid hardcoded hex colors. Use theme colors from @/theme instead (e.g., colors.primary, colors.error).',
      },
    ],
  },
  plugins: ['prettier'],
};
