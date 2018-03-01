import assert from 'assert'
import { AssertOrder, assertron } from 'assertron'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

import { baseline, NoCaseFound, Mismatch, MismatchFile, MissingFile, MissingDirectory } from '.'

test('load from not exist folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/not-exist', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && err.dir === 'fixtures/not-exist')
})

test('load from folder without "cases" subfolder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/no-cases', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && err.dir === 'fixtures/no-cases/cases')
})

test('load from empty folder throws NoCaseFound', () => {
  assert.throws(() => baseline('fixtures/empty', () => {
    throw new Error('should not called')
  }), err => err instanceof NoCaseFound && err.dir === 'fixtures/empty/cases')
})

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
  assert.deepEqual(caseNames, ['file1.txt', 'file2.txt'])
  assert.deepEqual(caseFolders, ['fixtures/file-cases/cases', 'fixtures/file-cases/cases'])
  assert.deepEqual(resultFolders, ['fixtures/file-cases/results', 'fixtures/file-cases/results'])
  assert.deepEqual(baselineFolders, ['fixtures/file-cases/baselines', 'fixtures/file-cases/baselines'])
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
  assert.deepEqual(caseFolders, ['fixtures/dir-cases/cases/case1', 'fixtures/dir-cases/cases/case2'])
  assert.deepEqual(resultFolders, ['fixtures/dir-cases/results/case1', 'fixtures/dir-cases/results/case2'])
  assert.deepEqual(baselineFolders, ['fixtures/dir-cases/baselines/case1', 'fixtures/dir-cases/baselines/case2'])
})

test('filter cases using RegExp', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: /file1/
  }, ({ caseName }) => {
    assert.equal(caseName, 'file1.txt')
    o.once(1)
  })

  o.end()
})

test('filter cases using wildcards', () => {
  const o = new AssertOrder()
  baseline({
    basePath: 'fixtures/file-cases',
    filter: '*1.*'
  }, ({ caseName }) => {
    assert.equal(caseName, 'file1.txt')
    o.once(1)
  })

  o.end()
})

test(`'results' folder is created for file cases`, () => {
  ensureFolderNotExist('fixtures/no-file-results/results')

  baseline('fixtures/no-file-results', ({ caseName }) => {
    assert(fs.existsSync('fixtures/no-file-results/results'))
  })
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

test('provided match(file) compares the file in results and baselines', () => {
  baseline('fixtures/file-match-case', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
    fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
    assert.doesNotThrow(() => match(caseName))
  })
})

test('provided match(file) compares the file in results and baselines and throw', async () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/file-not-match-case', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'actual')
      a(match(caseName))
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const mismatch = err.mismatches[0]

    return mismatch instanceof MismatchFile &&
      mismatch.actualPath === 'fixtures/file-not-match-case/results/file1.txt' &&
      mismatch.actual === 'actual' &&
      mismatch.expectedPath === 'fixtures/file-not-match-case/baselines/file1.txt' &&
      mismatch.expected === 'expected'
  })
})

test('provided match() pass with matching files in folder', async () => {
  return new Promise(a => {
    baseline('fixtures/dir-match-case', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
      a(match())
    })
  })
})

test('provided match() rejects with files in folder not match by content', async () => {
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
      mismatch.actualPath === 'fixtures/dir-not-match-case/results/case-1/case-1' &&
      mismatch.actual === 'actual' &&
      mismatch.expectedPath === 'fixtures/dir-not-match-case/baselines/case-1/case-1' &&
      mismatch.expected === 'expected'
  })
})

test('provided match() rejects when missing baseline file', async () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-baseline-file', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      fs.writeFileSync(path.join(resultFolder, caseName), 'actual')
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const m = err.mismatches[0]
    return m instanceof MissingFile &&
      m.filePath === 'fixtures/dir-miss-baseline-file/baselines/case-1/case-1'
  })
})

test('provided match() rejects when missing result file', async () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-result-file', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 1)
      return false

    const m = err.mismatches[0]
    return m instanceof MissingFile &&
      m.filePath === 'fixtures/dir-miss-result-file/results/case-1/case-1'
  })
})

test('provided match() rejects when missing result file in subfolder', async () => {
  return assertron.throws(new Promise(a => {
    baseline('fixtures/dir-miss-result-file-deep', ({ caseName, caseFolder, resultFolder, baselineFolder, match }) => {
      a(match())
    })
  }), err => {
    if (!(err instanceof Mismatch) || err.mismatches.length !== 2)
      return false

    const d = err.mismatches[0]
    const f = err.mismatches[1]
    return d instanceof MissingDirectory &&
      d.dirPath === 'fixtures/dir-miss-result-file-deep/results/case-1/sub-folder' &&
      f instanceof MissingFile &&
      f.filePath === 'fixtures/dir-miss-result-file-deep/results/case-1/sub-folder/file1.txt'
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

  await baseline('fixtures/save-file', ({ caseName, resultFolder, copyToBaseline }) => {
    fs.writeFileSync(path.join(resultFolder, caseName), 'expected')
    return copyToBaseline(caseName)
  })

  assert(fs.existsSync('fixtures/save-file/baselines/case1.txt'))
})

test(`Provided copyToBaseline() saves result to baseline for dir case`, async () => {
  ensureFolderNotExist('fixtures/save-dir/results')
  ensureFolderNotExist('fixtures/save-dir/baselines')

  await baseline('fixtures/save-dir', ({ caseName, resultFolder, copyToBaseline }) => {
    fs.writeFileSync(path.join(resultFolder, 'file1.txt'), 'expected')
    return copyToBaseline('*')
  })

  assert(fs.existsSync('fixtures/save-dir/baselines/case-1/file1.txt'))
})

function ensureFolderNotExist(folder: string) {
  if (fs.existsSync(folder))
    rimraf.sync(folder)
}
