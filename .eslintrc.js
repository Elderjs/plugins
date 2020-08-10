module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: false,
    es2020: true,
    browser: true,
    'jest/globals': true,
  },
  plugins: ['prettier', 'jest'],
  extends: ['plugin:node/recommended', 'plugin:jest/recommended', 'plugin:prettier/recommended'],

  rules: {
    'prettier/prettier': 'error',
    semi: ['error', 'always'],
    'no-var': ['error'],
    'no-console': ['off'],
    'no-unused-vars': ['warn'],
    'no-mixed-spaces-and-tabs': ['warn'],
    'node/no-unpublished-require': ['off'],
  },
};
