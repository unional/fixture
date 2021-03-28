import t from 'assert'
import { assertron } from 'assertron'
import fs from 'fs'
import path from 'path'
import { pathEqual } from 'path-equal'
import rimraf from 'rimraf'

import { baseline, Mismatch, MismatchFile } from '.'

test('invoke callback for each file', () => {
  const caseNames: string[] = []
  const caseFolders: string[] = []
  const resultFolders: string[] = []
  const baselineFolders: string[] = []
  baseline('fixtures/file-cases', ({ caseName, caseFolder, resultFolder, baselineFolder }) => {
    caseNames.push(caseName)
    caseFolders.push(caseFolder)
    resultFolders.push(resultFolder)
    baselineFolders.push(baselineFolder)
  })
  t.deepStrictEqual(caseNames, ['file1.txt', 'file2.txt'])
  pathsEqual(caseFolders, ['fixtures/file-cases/cases', 'fixtures/file-cases/cases'])
  pathsEqual(resultFolders, ['fixtures/file-cases/results', 'fixtures/file-cases/results'])
  pathsEqual(baselineFolders, ['fixtures/file-cases/baselines', 'fixtures/file-cases/baselines'])
})

test(`'results' folder is created for file cases`, () => {
  ensureFolderNotExist('fixtures/no-file-results/results')

  baseline('fixtures/no-file-results', () => {
    t(fs.existsSync('fixtures/no-file-results/results'))
  })
})

test('provided match(file) compares the file in results and baselines', () => {
  baseline('fixtures/file-match-case', ({ resultFolder, match }) => {
    fs.writeFileSync(path.join(resultFolder, 'result.txt'), 'expected')
    t.doesNotThrow(() => match('result.txt'))
  })
})

test('provided match(file) compares the file in results and baselines and throw', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/file-not-match-case', ({ resultFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, 'result.txt'), 'actual')
      a(match('result.txt'))
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const mismatch = err.mismatches[0]

    return mismatch instanceof MismatchFile &&
      pathEqual(mismatch.actualPath, 'fixtures/file-not-match-case/results/result.txt') &&
      mismatch.actual === 'actual' &&
      pathEqual(mismatch.expectedPath, 'fixtures/file-not-match-case/baselines/result.txt') &&
      mismatch.expected === 'expected'
  })
})

test('file baseline tests should match file with same caseName if caseName is not specified', () => {
  return new Promise(a => {
    baseline({
      basePath: 'fixtures/file-match-itself',
      filter: 'good.txt',
      suppressFilterWarnings: true
    }, ({ match, caseName, resultFolder }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
      a(match())
    })
  })
})

function ensureFolderNotExist(folder: string) {
  if (fs.existsSync(folder))
    rimraf.sync(folder)
}

function pathsEqual(actuals: string[], expects: string[]) {
  actuals.forEach((a, i) => assertron.pathEqual(a, expects[i]))
}
