# @unional/fixture

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[![GitHub NodeJS][github-nodejs]][github-action-url]
[![Codecov][codecov-image]][codecov-url]

[![Semantic Release][semantic-release-image]][semantic-release-url]

[![Visual Studio Code][vscode-image]][vscode-url]

Provides fixture for tests.
You can use it for any test runner such as `jest`, `ava`, `mocha`, `tap`, etc.

## Install

```sh
# npm
npm install -D @unional/fixture

# yarn
yarn add -D @unional/fixture

# pnpm
pnpm install -D @unional/fixture

# rush
rush add -p @unional/fixture --dev
```

## Usage

`baseline()` is the heart of `@unional/fixture`.
You can use it to read a folder containing multiple test cases and use them in your test runner.

```ts
import { baseline } from '@unional/fixture'

// basic usage
baseline('fixtures', ({ caseName, caseType, casePath, resultPath, match, copyToBaseline }) => {
  // `test()` comes from your favorite test runner.
  // e.g. `ava`, `jest`, `mocha`
  test(caseName, async () => {
    // this example assumes `caseType === 'file'`,
    // so the `casePath` points to the input file directly.
    fs.readFileSync(casePath, 'utf-8')

    // `resultPath` points to a folder where you can save your result(s)
    fs.writeFileSync(path.join(resultPath, 'output.txt', '<some data>'))

    // compare result and baseline folder
    await match()

    // match compares specific file in result folder and baseline folder
    await match('output.txt')

    // if you are happy with the change,
    // use this to copy the artifacts from result folder to baseline folder,
    // or you can do that manually from your IDE.
    await copyToBaseline('*.txt')
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

### Command Testing

In addition to `baseline()`,
`@unional/fixture` provides `execCommand()` and `writeCommandResult()` to run command line test within the fixture.

If the test case is a JSON or YAML, it will read and execute the command within.
If the test case is a folder, it will look for a `command.json|yml|yaml` in the folder and does the same.

More file types and features will be added in the future.

Here is a common way to use them:

```ts
import { baseline, execCommand, writeCommandResult } from '@unional/fixture'

baseline('fixtures/command', ({ caseType, caseName, casePath, resultPath, match }) => {
  it(caseName, async () => {
    writeCommandResult(
      resultPath,
      await execCommand({ caseType, caseName, casePath })
    )
    return match()
  })
})
```

The `execCommand()` has an alternative signature that allows you to easily run and capture `stdout` and `stderr`:

```ts
const { stdout, stderr } = await execCommand({ casePath, command, args })
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
