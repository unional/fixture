# @unional/fixture

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[![GitHub NodeJS][github-nodejs]][github-action-url]
[![Codecov][codecov-image]][codecov-url]

[![Semantic Release][semantic-release-image]][semantic-release-url]

[![Visual Studio Code][vscode-image]][vscode-url]

Provides fixture for tests.

## Usage

```ts
import { baseline } from '@unional/fixture'

// basic usage
baseline('fixtures', (context) => {
  // `test()` comes from your favorite test runner.
  // e.g. `ava`, `jest`, `mocha`
  test(context.caseName, async () => {
    // use caseFolder + caseName to get input file
    fs.readFileSync(path.join(context.caseFolder, caseName), 'utf-8')

    // use resultFolder to write output file
    fs.writeFileSync(path.join(context.resultFolder, 'output.txt', '<some data>'))

    // compare result and baseline:
    // If test case is a file,
    //   the file with the same namd in the result and baseline folder will be compared.
    // If test case is a folder,
    //   the whole folder and its subfolder in the result and baseline folder will be compared.
    await context.match()

    // match compares specific file in result folder and baseline folder
    await context.match('output.txt')

    // if you are happy with the change,
    // use this to copy the artifacts from result folder to baseline folder
    await context.copyToBaseline('*.txt')
  })

  // advance usage
  baseline({
    basePath: 'fixtures',
    // default: 'cases'
    casesFolder: 'scenarios',
    // default: 'results'
    resultsFolder: 'actuals',
    // default: 'baselines'
    baselinesFolder: 'expects',
    // filter for specific cases
    // can use wildcards or RegExp
    filter: '*.pass',
    // By default warning messages will be displayed when some test cases are filtered.
    // Use this to suppress those warnings.
    suppressFilterWarnings: true,
    // If the file has more lines than this threshold,
    // then the file will be diff with line numbers,
    // and the unchanged lines will be trimmed off.
    largeFileThreshold: 100,
    // Controls how many unchanged lines will be shown around the changes.
    largeFileAmbientLines: 5,
    /**
     * Maximum number of diff lines to show.
     * If there are more diff lines,
     * the remaining will be timmed and show a summary instead.
     */
    diffDisplayThreshold: 150
  }, (context) => {
    ...
  })
})

```

## Contribute

```sh
# right after fork
yarn

# begin making changes
git checkout -b <branch>
yarn watch

# edit `webpack.config.dev.js` to exclude dependencies for the global build.

# after making change(s)
git commit -m "<commit message>"
git push

# create PR
```

## Commands

There are a few useful commands you can use during development.

```sh
# Run tests (and lint) automatically whenever you save a file.
yarn watch

# Run tests with coverage stats (but won't fail you if coverage does not meet criteria)
yarn test

# Manually verify the project.
# This will be ran during 'npm preversion' so you normally don't need to run this yourself.
yarn verify

# Build the project.
# You normally don't need to do this.
yarn build

# Run tslint
# You normally don't need to do this as `yarn watch` and `npm version` will automatically run lint for you.
yarn lint
```

[codecov-image]: https://codecov.io/gh/unional/fixture/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/unional/fixture
[downloads-image]: https://img.shields.io/npm/dm/@unional/fixture.svg?style=flat
[downloads-url]: https://npmjs.org/package/@unional/fixture
[github-action-url]: https://github.com/unional/fixture/actions
[github-nodejs]: https://github.com/unional/fixture/workflows/nodejs/badge.svg
[npm-image]: https://img.shields.io/npm/v/@unional/fixture.svg?style=flat
[npm-url]: https://npmjs.org/package/@unional/fixture
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[vscode-image]: https://img.shields.io/badge/vscode-ready-green.svg
[vscode-url]: https://code.visualstudio.com/
