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
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/not-exist'))
})

test('load from folder without "cases" subfolder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/no-cases', () => {
    throw new Error('should not called')
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/no-cases/cases'))
})

test('load from empty folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/empty', () => {
    throw new Error('should not called')
  }), (err: Error) => err instanceof NoCaseFound && pathEqual(err.dir, 'fixtures/empty/cases'))
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
  assert.deepStrictEqual(caseNames, ['case1', 'case2'])
  pathsEqual(caseFolders, ['fixtures/dir-cases/cases/case1', 'fixtures/dir-cases/cases/case2'])
  pathsEqual(resultFolders, ['fixtures/dir-cases/results/case1', 'fixtures/dir-cases/results/case2'])
  pathsEqual(baselineFolders, ['fixtures/dir-cases/baselines/case1', 'fixtures/dir-cases/baselines/case2'])
})

test(`'results/<case>' folder is created for dir cases`, () => {
  ensureFolderNotExist('fixtures/no-dir-results/results')

  baseline('fixtures/no-dir-results', ({ resultFolder }) => {
    assert(fs.existsSync(resultFolder))
  })
})

test(`'baselines' folder is created for file cases`, () => {
  ensureFolderNotExist('fixtures/no-baselines/baselines')

  baseline('fixtures/no-baselines', () => {
    assert(fs.existsSync('fixtures/no-baselines/baselines'))
  })
})

test('fixture.skip() will do nothing', () => {
  void baseline.skip('fixtures/not-exists', () => {
    throw new Error('should not reach')
  })
})

test('provided match() pass with matching files in folder', () => {
  return new Promise(a => {
    baseline('fixtures/dir-match-case', ({ caseName, resultFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
      a(match())
    })
  })
})

test('provided match() rejects with files in folder not match by content', () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-not-match-case', ({ caseName, resultFolder, match }) => {
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
  return new Promise(a => {
    baseline('fixtures/dir-match-wildcard', ({ caseFolder, resultFolder, match }) => {
      const context = fs.readFileSync(path.join(caseFolder, 'input.txt'), 'utf-8')
      fs.writeFileSync(path.join(resultFolder, 'f1.txt'), context)
      fs.writeFileSync(path.join(resultFolder, 'f2.txt'), context)
      fs.writeFileSync(path.join(resultFolder, 'other.js'), 'should not match')
      a(match('*.txt'))
    })
  })
})

test('provided match() rejects when missing baseline folder', () => {
  ensureFolderNotExist('fixtures/dir-miss-baseline-folder/baselines/case-1')

  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-folder', ({ resultFolder, match }) => {
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
    baseline('fixtures/dir-miss-baseline-folder-deep', ({ resultFolder, match }) => {
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
    baseline('fixtures/dir-miss-baseline-file', ({ resultFolder, match }) => {
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
    baseline('fixtures/dir-miss-baseline-folder-no-sub', ({ resultFolder, match }) => {
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
    assert.strictEqual(caseName, 'file1.txt')
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

test(`copyToBaseline('*') saves result to baseline for dir case`, async () => {
  ensureFolderNotExist('fixtures/save-dir/results')
  ensureFolderNotExist('fixtures/save-dir/baselines')

  await new Promise(a => {
    baseline('fixtures/save-dir', ({ resultFolder, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultFolder, 'file1.txt'), 'expected')
      a(copyToBaseline('*'))
    })
  })

  assert(fs.existsSync('fixtures/save-dir/baselines/case-1/file1.txt'))
})

test(`copyToBaseline() is the same as copyToBaseline('*')`, async () => {
  ensureFolderNotExist('fixtures/save-dir2/results')
  ensureFolderNotExist('fixtures/save-dir2/baselines')

  await new Promise(a => {
    baseline('fixtures/save-dir2', ({ resultFolder, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultFolder, 'file1.txt'), 'expected')
      a(copyToBaseline())
    })
  })

  assert(fs.existsSync('fixtures/save-dir2/baselines/case-1/file1.txt'))
})

test(`copyToBaseline.skip() to not doing anything. This allows consumer to keep the shape of the test`, async () => {
  ensureFolderNotExist('fixtures/no-save/results')
  ensureFolderNotExist('fixtures/no-save/baselines')

  await new Promise(a => {
    baseline('fixtures/no-save', ({ resultFolder, copyToBaseline }) => {
      fs.writeFileSync(path.join(resultFolder, 'file1.txt'), 'expected')
      a(copyToBaseline.skip('*'))
    })
  })

  assert(!fs.existsSync('fixtures/no-save/baselines/case-1/file1.txt'))
})

test('result folder is empty when handler is invoked (only when the case is folder based)', () => {
  mkdirp.sync('fixtures/dirty-result-folder/results/case-1')
  fs.writeFileSync('fixtures/dirty-result-folder/results/case-1/dirty.txt', 'dirty')

  return new Promise<void>(a => {
    baseline('fixtures/dirty-result-folder', ({ resultFolder }) => {
      const actual = fs.readdirSync(resultFolder)
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
    baseline('fixtures/diff-display-threshold', ({ caseName, caseFolder, resultFolder, match }) => {
      const content = fs.readFileSync(path.join(caseFolder, caseName), 'utf-8')
      fs.writeFileSync(path.join(resultFolder, caseName), content)
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    return err.message.indexOf('more lines') > 0
  })
})
