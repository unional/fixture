module.exports = {
  collectCoverageFrom: ['<rootDir>/src/**/*.[jt]s', '!<rootDir>/src/bin.[jt]s'],
  reporters: [
    'default',
    'jest-progress-tracker',
    ['jest-audio-reporter', { volume: 0.3 }]
  ],
  watchPlugins: [
    'jest-watch-suspend',
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    ['jest-watch-toggle-config', { setting: 'verbose' }],
    ['jest-watch-toggle-config', { setting: 'collectCoverage' }]
  ]
}
