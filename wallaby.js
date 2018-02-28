module.exports = () => {
  return {
    files: [
      { pattern: 'fixtures/**/*', instrument: false },
      { pattern: 'fixtures/**/.*', instrument: false },
      { pattern: 'tsconfig.*', instrument: false },
      'src/**/*.ts',
      '!src/**/*.spec.ts'
    ],
    tests: [
      'src/**/*.spec.ts'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    testFramework: 'jest'
  }
}
