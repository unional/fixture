import assert from 'assert'
import { AssertOrder, assertron } from 'assertron'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import { pathEqual } from 'path-equal'
import rimraf from 'rimraf'

import { ensureFolderExist, isFolder } from './fsUtils.js'
import { baseline, ExtraResultFile, Mismatch, MismatchFile, MissingResultFile } from './index.js'

test('invoke callback for each folder', () => {
  const caseNames: string[] = []
  const caseFolders: string[] = []
  const resultFolders: string[] = []
  const baselineFolders: string[] = []
  baseline('fixtures/dir-cases', ({ caseName, casePath, resultPath, baselinePath }) => {
    caseNames.push(caseName)
    caseFolders.push(casePath)
    resultFolders.push(resultPath)
    baselineFolders.push(baselinePath)
  })
  assert.deepStrictEqual(caseNames, ['case1', 'case2'])
  pathsEqual(caseFolders, ['fixtures/dir-cases/cases/case1', 'fixtures/dir-cases/cases/case2'])
  pathsEqual(resultFolders, ['fixtures/dir-cases/results/case1', 'fixtures/dir-cases/results/case2'])
  pathsEqual(baselineFolders, ['fixtures/dir-cases/baselines/case1', 'fixtures/dir-cases/baselines/case2'])
})

test(`'results/<case>' folder is created for dir cases`, () => {
  ensureFolderNotExist('fixtures/no-dir-results/results')

  baseline('fixtures/no-dir-results', ({ resultPath }) => {
    assert(fs.existsSync(resultPath))
  })
})

test('fixture.skip() will do nothing', () => {
  void baseline.skip('fixtures/not-exists', () => {
    throw new Error('should not reach')
  })
})

test('provided match() pass with matching files in folder', () => {
  return new Promise(a => {
    baseline('fixtures/dir-match-case', ({ caseName, resultPath, match }) => {
      fs.writeFileSync(path.join(resultPath, caseName), 'expected')
      a(match())
    })
  })
})

test('provided match() rejects with files in folder not match by content', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-not-match-case', ({ caseName, resultPath, match }) => {
      fs.writeFileSync(path.join(resultPath, caseName), 'actual')
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
  return new Promise(a => {
    baseline('fixtures/dir-match-wildcard', ({ casePath: caseFolder, resultPath, match }) => {
      const context = fs.readFileSync(path.join(caseFolder, 'input.txt'), 'utf-8')
      fs.writeFileSync(path.join(resultPath, 'f1.txt'), context)
      fs.writeFileSync(path.join(resultPath, 'f2.txt'), context)
      fs.writeFileSync(path.join(resultPath, 'other.js'), 'should not match')
      a(match('*.txt'))
    })
  })
})

test('provided match() rejects when missing baseline folder', () => {
  ensureFolderNotExist('fixtures/dir-miss-baseline-folder/baselines')

  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder', ({ resultPath, match }) => {
      fs.writeFileSync(path.join(resultPath, 'output.txt'), 'actual')
      a(match())
    })
  }), err => err instanceof ExtraResultFile && pathEqual(err.filePath, 'fixtures/dir-miss-baseline-folder/results/case-1'))
})

test('provided match() rejects when missing baseline sub-folder', () => {
  ensureFolderNotExist('fixtures/dir-miss-baseline-folder-deep/baselines/case-1')
  ensureFolderExist('fixtures/dir-miss-baseline-folder-deep/baselines/case-1')
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder-deep', ({ resultPath, match }) => {
      ensureFolderExist('fixtures/dir-miss-baseline-folder-deep/results/case-1/sub-folder')
      fs.writeFileSync(path.join(resultPath, 'sub-folder/output.txt'), 'actual line 1\nactual line 2')
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
    baseline('fixtures/dir-miss-baseline-file', ({ resultPath, match }) => {
      fs.writeFileSync(path.join(resultPath, 'result.txt'), 'actual')
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
    baseline('fixtures/dir-miss-baseline-folder-no-sub', ({ resultPath, match }) => {
      ensureFolderExist(`${resultPath}/sub-folder`)
      fs.writeFileSync(path.join(resultPath, 'sub-folder/output.txt'), 'actual line 1\nactual line 2')
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

test('provided match() rejectts when missing result file', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-result-file', ({ match }) => {
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
    baseline('fixtures/dir-miss-result-file-deep', ({ match }) => {
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

it('can customize result folder', () => {
  ensureFolderNotExist('fixtures/custom/expects')
  ensureFolderNotExist('fixtures/custom/actuals')

  const o = new AssertOrder(1)
  baseline({
    basePath: 'fixtures/custom',
    casesFolder: 'scenarios',
    resultsFolder: 'actuals'
  }, ({ caseName }) => {
    o.once(1)
    assert.strictEqual(caseName, 'file1.txt')
    assert(fs.existsSync('fixtures/custom/actuals'))
  })
  o.end()
})

it('can customize baseline folder', () => {
  ensureFolderNotExist('fixtures/custom-saved/actuals')

  return new Promise(a => baseline({
    basePath: 'fixtures/custom-saved',
    casesFolder: 'scenarios',
    baselinesFolder: 'expects',
    resultsFolder: 'actuals'
  }, ({ caseName, resultPath, match }) => {
    fs.writeFileSync(path.join(resultPath, caseName), 'some value')
    a(match())
  }))
})

test(`Provided copyToBaseline() saves result to baseline for file case`, async () => {
  ensureFolderNotExist('fixtures/save-file/results')
  ensureFolderNotExist('fixtures/save-file/baselines')

  await new Promise(a => {
    baseline('fixtures/save-file', ({ caseName, resultPath, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultPath, caseName), 'expected')
      a(copyToBaseline(caseName))
    })
  })

  assert(fs.existsSync('fixtures/save-file/baselines/case1.txt'))
})

test(`copyToBaseline('*') saves result to baseline for dir case`, async () => {
  ensureFolderNotExist('fixtures/save-dir/results')
  ensureFolderNotExist('fixtures/save-dir/baselines')

  await new Promise(a => {
    baseline('fixtures/save-dir', ({ resultPath, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultPath, 'file1.txt'), 'expected')
      a(copyToBaseline('*'))
    })
  })

  assert(fs.existsSync('fixtures/save-dir/baselines/case-1/file1.txt'))
})

test(`copyToBaseline() is the same as copyToBaseline('*')`, async () => {
  ensureFolderNotExist('fixtures/save-dir2/results')
  ensureFolderNotExist('fixtures/save-dir2/baselines')

  await new Promise(a => {
    baseline('fixtures/save-dir2', ({ resultPath, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultPath, 'file1.txt'), 'expected')
      a(copyToBaseline())
    })
  })

  assert(fs.existsSync('fixtures/save-dir2/baselines/case-1/file1.txt'))
})

test(`copyToBaseline.skip() to not doing anything. This allows consumer to keep the shape of the test`, async () => {
  ensureFolderNotExist('fixtures/no-save/results')
  ensureFolderNotExist('fixtures/no-save/baselines')

  await new Promise(a => {
    baseline('fixtures/no-save', ({ resultPath, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultPath, 'file1.txt'), 'expected')
      a(copyToBaseline.skip('*'))
    })
  })

  assert(!fs.existsSync('fixtures/no-save/baselines/case-1/file1.txt'))
})

test('result folder is empty when handler is invoked (only when the case is folder based)', () => {
  mkdirp.sync('fixtures/dirty-result-folder/results/case-1')
  fs.writeFileSync('fixtures/dirty-result-folder/results/case-1/dirty.txt', 'dirty')

  return new Promise<void>(a => {
    baseline('fixtures/dirty-result-folder', ({ resultPath }) => {
      const actual = fs.readdirSync(resultPath)
      assert(actual.length === 0)
      a()
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

test('default diff display threshold is 200', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/diff-display-threshold', ({ caseName, casePath, resultPath, match }) => {
      const content = fs.readFileSync(casePath, 'utf-8')
      fs.writeFileSync(path.join(resultPath, caseName), content)
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    return err.message.indexOf('more lines') > 0
  })
})

it('supports mixed case', () => {
  const caseNames: string[] = []
  const caseFolders: string[] = []
  const resultFolders: string[] = []
  const baselineFolders: string[] = []
  baseline('fixtures/mix-cases', ({ caseName, casePath, resultPath, baselinePath }) => {
    caseNames.push(caseName)
    caseFolders.push(casePath)
    resultFolders.push(resultPath)
    baselineFolders.push(baselinePath)
    assert(isFolder(resultPath))
  })
  assert.deepStrictEqual(caseNames, ['case-1.txt', 'case-2'])
  pathsEqual(caseFolders, ['fixtures/mix-cases/cases/case-1.txt', 'fixtures/mix-cases/cases/case-2'])
  pathsEqual(resultFolders, ['fixtures/mix-cases/results/case-1.txt', 'fixtures/mix-cases/results/case-2'])
  pathsEqual(baselineFolders, ['fixtures/mix-cases/baselines/case-1.txt', 'fixtures/mix-cases/baselines/case-2'])
})
