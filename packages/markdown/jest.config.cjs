/* eslint-disable no-undef */
// // eslint-disable-next-line no-undef
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   transform: {
//     '^.+\\.ts?$': 'ts-jest',
//   },
//   transformIgnorePatterns: ['<rootDir>/node_modules/'],
// };

module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  rootDir: process.cwd(),
  roots: ['<rootDir>', process.cwd()],
  modulePaths: ['<rootDir>', process.cwd()],
  moduleDirectories: ['node_modules'],
  transform: {
    'node_modules/variables/.+\\.(j|t)s?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  //   testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
  //   collectCoverageFrom: ['src/**/*.ts'],
  //   coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
};
