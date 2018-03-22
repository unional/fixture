import assert from 'assert'
import { AssertOrder, assertron } from 'assertron'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import { pathEqual } from 'path-equal'
import rimraf from 'rimraf'

import { baseline, NoCaseFound, Mismatch, MismatchFile, ExtraResultFile, MissingResultFile } from '.'
import { ensureFolderExist } from './fsUtils'

test('load from not exist folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/not-exist', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/not-exist'))
})

test('load from folder without "cases" subfolder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/no-cases', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/no-cases/cases'))
})

test('load from empty folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/empty', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/empty/cases'))
})

test('invoke callback for each folder', () => {
  const caseNames: string[] = []
  const caseFolders: string[] = []
  const resultFolders: string[] = []
  const baselineFolders: string[] = []
  baseline('fixtures/dir-cases', ({ caseName, caseFolder, resultFolder, baselineFolder }) => {
    caseNames.push(caseName)
    caseFolders.push(caseFolder)
    resultFolders.push(resultFolder)
    baselineFolders.push(baselineFolder)
  })
  assert.deepEqual(caseNames, ['case1', 'case2'])
  pathsEqual(caseFolders, ['fixtures/dir-cases/cases/case1', 'fixtures/dir-cases/cases/case2'])
  pathsEqual(resultFolders, ['fixtures/dir-cases/results/case1', 'fixtures/dir-cases/results/case2'])
  pathsEqual(baselineFolders, ['fixtures/dir-cases/baselines/case1', 'fixtures/dir-cases/baselines/case2'])
})

test(`'results/<case>' folder is created for dir cases`, () => {
  ensureFolderNotExist('fixtures/no-dir-results/results')

  baseline('fixtures/no-dir-results', ({ caseName }) => {
    assert(fs.existsSync('fixtures/no-dir-results/results/case-1'))
  })
})

test(`'baselines' folder is created for file cases`, () => {
  ensureFolderNotExist('fixtures/no-baselines/baselines')

  baseline('fixtures/no-baselines', ({ caseName }) => {
    assert(fs.existsSync('fixtures/no-baselines/baselines'))
  })
})

test('fixture.skip() will do nothing', () => {
  baseline.skip('fixtures/not-exists', () => {
    throw new Error('should not reach')
  })
})

test('provided match() pass with matching files in folder', () => {
  baseline('fixtures/dir-match-case', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
    fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
    return match()
  })
})

test('provided match() rejects with files in folder not match by content', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-not-match-case', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'actual')
      a(match())
    })
  }), err => {

    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const mismatch = err.mismatches[0]

    return mismatch instanceof MismatchFile &&
      pathEqual(mismatch.actualPath, 'fixtures/dir-not-match-case/results/case-1/case-1') &&
      mismatch.actual === 'actual' &&
      pathEqual(mismatch.expectedPath, 'fixtures/dir-not-match-case/baselines/case-1/case-1') &&
      mismatch.expected === 'expected'
  })
})

// TODO: Support Wildcard matching
test.skip('provided match() pass with matching files in folder', () => {
  baseline('fixtures/dir-match-wildcard', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
    const context = fs.readFileSync(path.join(caseFolder, 'input.txt'), 'utf-8')
    fs.writeFileSync(path.join(resultFolder, 'f1.txt'), context)
    fs.writeFileSync(path.join(resultFolder, 'f2.txt'), context)
    fs.writeFileSync(path.join(resultFolder, 'other.js'), 'should not match')
    return match('*.txt')
  })
})

test('provided match() rejects when missing baseline folder', () => {
  ensureFolderNotExist('fixtures/dir-miss-baseline-folder/baselines/case-1')

  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, 'output.txt'), 'actual')
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false
    const m1 = err.mismatches[0]
    return m1 instanceof ExtraResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-baseline-folder/results/case-1/output.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].added === true
  })
})

test('provided match() rejects when missing baseline folder and sub-folder', () => {
  ensureFolderNotExist('fixtures/dir-miss-baseline-folder-deep/baselines/case-1')
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder-deep', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      ensureFolderExist('fixtures/dir-miss-baseline-folder-deep/results/case-1/sub-folder')
      fs.writeFileSync(path.join(resultFolder, 'sub-folder/output.txt'), 'actual line 1\nactual line 2')
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false
    const m1 = err.mismatches[0]
    return m1 instanceof ExtraResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-baseline-folder-deep/results/case-1/sub-folder/output.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].added === true
  })
})

test('provided match() rejects when missing baseline file', () => {
  ensureFolderExist('fixtures/dir-miss-baseline-file/baselines/case-1')

  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-file', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, 'result.txt'), 'actual')
      a(match('result.txt'))
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const m1 = err.mismatches[0]
    return m1 instanceof ExtraResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-baseline-file/results/case-1/result.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].added === true
  })
})

test('provided match() rejects when missing baseline folder with sub-folder', () => {
  ensureFolderExist('fixtures/dir-miss-baseline-folder-no-sub/baselines/case-1')

  ensureFolderNotExist('fixtures/dir-miss-baseline-folder-no-sub/baselines/case-1/sub-folder')
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder-no-sub', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      ensureFolderExist('fixtures/dir-miss-baseline-folder-no-sub/results/case-1/sub-folder')
      fs.writeFileSync(path.join(resultFolder, 'sub-folder/output.txt'), 'actual line 1\nactual line 2')
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false
    const m1 = err.mismatches[0]
    return m1 instanceof ExtraResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-baseline-folder-no-sub/results/case-1/sub-folder/output.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].added === true
  })
})

test('provided match() rejects when missing result file', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-result-file', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      a(match('output.txt'))
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const m1 = err.mismatches[0]
    return m1 instanceof MissingResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-result-file/results/case-1/output.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].removed === true
  })
})

test('provided match() rejects when missing result file in subfolder', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-result-file-deep', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const m1 = err.mismatches[0]
    return m1 instanceof MissingResultFile &&
      pathEqual(m1.filePath, 'fixtures/dir-miss-result-file-deep/results/case-1/sub-folder/file1.txt') &&
      m1.diff.length === 1 &&
      m1.diff[0].removed === true
  })
})

test('customize all folder names', () => {
  ensureFolderNotExist('fixtures/custom/expects')
  ensureFolderNotExist('fixtures/custom/actuals')

  const o = new AssertOrder(1)
  baseline({
    basePath: 'fixtures/custom',
    casesFolder: 'scenarios',
    baselinesFolder: 'expects',
    resultsFolder: 'actuals'
  }, ({ caseName }) => {
    o.once(1)
    assert.equal(caseName, 'file1.txt')
    assert(fs.existsSync('fixtures/custom/expects'))
    assert(fs.existsSync('fixtures/custom/actuals'))
  })
  o.end()
})

test(`Provided copyToBaseline() saves result to baseline for file case`, async () => {
  ensureFolderNotExist('fixtures/save-file/results')
  ensureFolderNotExist('fixtures/save-file/baselines')

  await new Promise(a => {
    baseline('fixtures/save-file', ({ caseName, resultFolder, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
      a(copyToBaseline(caseName))
    })
  })

  assert(fs.existsSync('fixtures/save-file/baselines/case1.txt'))
})

test(`Provided copyToBaseline() saves result to baseline for dir case`, async () => {
  ensureFolderNotExist('fixtures/save-dir/results')
  ensureFolderNotExist('fixtures/save-dir/baselines')

  await new Promise(a => {
    baseline('fixtures/save-dir', ({ caseName, resultFolder, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultFolder, 'file1.txt'), 'expected')
      a(copyToBaseline('*'))
    })
  })

  assert(fs.existsSync('fixtures/save-dir/baselines/case-1/file1.txt'))
})

test('Result folder is empty when handler is called for dir case', () => {
  mkdirp.sync('fixtures/dirty-result-folder/results/case-1')
  fs.writeFileSync('fixtures/dirty-result-folder/results/case-1/dirty.txt', 'dirty')

  baseline('fixtures/dirty-result-folder', ({ caseName }) => {
    const actual = fs.readdirSync('fixtures/dirty-result-folder/results/case-1/')
    assert(actual.length === 0)
  })
})

function ensureFolderNotExist(folder: string) {
  if (fs.existsSync(folder))
    rimraf.sync(folder)
}

function pathsEqual(actuals: string[], expects: string[]) {
  actuals.forEach((a, i) => assertron.pathEqual(a, expects[i]))
}
