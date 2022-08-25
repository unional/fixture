import t from 'assert'
import { assertron } from 'assertron'
import fs from 'fs'
import path from 'path'
import { pathEqual } from 'path-equal'
import rimraf from 'rimraf'

import { baseline, Mismatch, MismatchFile } from './index.js'

test('invoke callback for each file', () => {
  const caseNames: string[] = []
  const caseFolders: string[] = []
  const resultFolders: string[] = []
  const baselineFolders: string[] = []
  baseline('fixtures/file-cases', ({ caseName, casePath, resultPath, baselinePath }) => {
    caseNames.push(caseName)
    caseFolders.push(casePath)
    resultFolders.push(resultPath)
    baselineFolders.push(baselinePath)
  })
  t.deepStrictEqual(caseNames, ['file1.txt', 'file2.txt'])
  pathsEqual(caseFolders, ['fixtures/file-cases/cases/file1.txt', 'fixtures/file-cases/cases/file2.txt'])
  pathsEqual(resultFolders, ['fixtures/file-cases/results/file1.txt', 'fixtures/file-cases/results/file2.txt'])
  pathsEqual(baselineFolders, ['fixtures/file-cases/baselines/file1.txt', 'fixtures/file-cases/baselines/file2.txt'])
})

test(`'results' folder is created for file cases`, () => {
  ensureFolderNotExist('fixtures/no-file-results/results')

  baseline('fixtures/no-file-results', () => {
    t(fs.existsSync('fixtures/no-file-results/results'))
  })
})

test('provided match(file) compares the file in results and baselines', () => {
  baseline('fixtures/file-match-case', ({ resultPath: resultPath, match }) => {
    fs.writeFileSync(path.join(resultPath, 'result.txt'), 'expected')
    t.doesNotThrow(() => match('result.txt'))
  })
})

test('provided match(file) compares the file in results and baselines and throw', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/file-not-match-case', ({ resultPath: resultPath, match }) => {
      fs.writeFileSync(path.join(resultPath, 'result.txt'), 'actual')
      a(match('result.txt'))
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const mismatch = err.mismatches[0]

    return mismatch instanceof MismatchFile &&
      pathEqual(mismatch.actualPath, 'fixtures/file-not-match-case/results/file1.txt/result.txt') &&
      mismatch.actual === 'actual' &&
      pathEqual(mismatch.expectedPath, 'fixtures/file-not-match-case/baselines/file1.txt/result.txt') &&
      mismatch.expected === 'expected'
  })
})

test('file baseline tests should match file with same caseName if caseName is not specified', () => {
  return new Promise(a => {
    baseline({
      basePath: 'fixtures/file-match-itself',
      filter: 'good.txt',
      suppressFilterWarnings: true
    }, ({ caseName, match, resultPath }) => {
      fs.writeFileSync(path.join(resultPath, caseName), 'expected')
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
