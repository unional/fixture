export default {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true,
    },
  },
  collectCoverageFrom: [
    '<rootDir>/ts/**/*.[jt]s'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '#(.*)': '<rootDir>/node_modules/$1'
  },
  roots: [
    '<rootDir>/ts',
  ],
  testMatch: ['**/?(*.)+(spec|test|integrate|accept|system|unit).[jt]s?(x)'],
  transformIgnorePatterns: ['node_modules/(?!(chalk|execa|cp-file|p-event|p-timeout|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream)/)'],
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  watchPlugins: [
    'jest-watch-suspend',
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    [
      'jest-watch-toggle-config', { 'setting': 'verbose' },
    ],
    [
      'jest-watch-toggle-config', { 'setting': 'collectCoverage' },
    ],
  ],
}
