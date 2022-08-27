import { compare as dirCompare } from 'dir-compare'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import type { Tersible } from 'tersify'
import { isSystemError } from 'type-plus'
import { context } from './context.js'
import { DiffFormatOptions } from './diff.js'
import { ExtraResultFile, Mismatch, MismatchFile, MissingResultFile } from './errors.js'
import { isFolder } from './fsUtils.js'

export function createMatchFunction(baselinePath: string, resultPath: string, options: DiffFormatOptions) {
  const filesBeforeTest = readFileOrDirectory(resultPath)
  return function match(target = ''): Promise<any> {
    if (isFolder(resultPath)) {
      const filesAfterTest = readFileOrDirectory(resultPath)
      removeUnchangedFiles(filesBeforeTest, filesAfterTest)
    }

    return compare(
      match,
      path.join(baselinePath, target),
      path.join(resultPath, target),
      options
    )
  }
}

function readFileOrDirectory(target: string) {
  const files: { filePath: string, ctime: number }[] = []
  fillFileOrDirectory(files, target)
  return files
}
function fillFileOrDirectory(files: { filePath: string, ctime: number }[], entryPath: string) {
  const stat = fs.statSync(entryPath)
  // istanbul ignore next
  if (stat.isSymbolicLink()) return
  if (stat.isFile()) files.push({ filePath: entryPath, ctime: stat.ctimeMs })
  if (stat.isDirectory()) {
    fs.readdirSync(entryPath).forEach(entry =>
      fillFileOrDirectory(files, path.join(entryPath, entry))
    )
  }
}
function removeUnchangedFiles(before: { filePath: string, ctime: number }[], after: { filePath: string, ctime: number }[]) {
  after.forEach(v => {
    if (before.some(entry => entry.filePath === v.filePath && entry.ctime === v.ctime)) {
      // istanbul ignore next
      fs.unlinkSync(v.filePath)
    }
  })
}
async function compare(match: any, baselinePath: string, resultPath: string, options: DiffFormatOptions) {
  const time = new Date().getTime()

  try {
    const res = await dirCompare(baselinePath, resultPath)
    context.log.debug(`comparing ${baselinePath} and ${resultPath} took ${new Date().getTime() - time} (ms)`)
    const mismatches: Tersible[] = []
    res.diffSet.forEach(d => {
      if (d.type1 === 'missing') {
        if (d.type2 === 'file') {
          const filePath = path.join(d.path2, d.name2)
          const result = fs.readFileSync(filePath, 'utf-8')
          mismatches.push(new ExtraResultFile(filePath, result, options))
        }
      }
      else if (d.type2 === 'missing') {
        const missingPath = path.join(d.path1.replace(baselinePath, resultPath), d.name1)

        if (d.type1 === 'file') {
          const baseline = fs.readFileSync(path.join(d.path1, d.name1), 'utf-8')
          mismatches.push(new MissingResultFile(missingPath, baseline, options))
        }
      }
      else {
        const filename1 = path.join(d.path1, d.name1)
        const filename2 = path.join(d.path2, d.name2)
        const file1 = fs.readFileSync(filename1, 'utf-8')
        const file2 = fs.readFileSync(filename2, 'utf-8')
        if (file1 !== file2) {
          mismatches.push(new MismatchFile(filename2, file2, filename1, file1, options))
        }
      }
    })
    if (mismatches.length > 0) throw new Mismatch(mismatches, { ssf: match })
  }
  catch (err: unknown) {
    if (isSystemError('ENOENT', err)) {
      if ((path.isAbsolute(err.path) && err.path === path.resolve(baselinePath)) || err.path === baselinePath)
        throw await getMissingBaselineMismatch(match, baselinePath, resultPath, options)
      else
        throw await getMissingResultMismatch(match, resultPath, baselinePath, options)
    }
    // istanbul ignore next
    throw err
  }
}

function getMissingBaselineMismatch(match: any, missingFilePath: string, resultPath: string, options: DiffFormatOptions) {
  if (isFolder(resultPath)) {
    return new Promise<Tersible[]>(a => {
      glob('**', { cwd: resultPath, nodir: true }, (_err, files) => {
        a(files.map(file => {
          const filePath = path.join(resultPath, file)
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          return new ExtraResultFile(filePath, fileContent, options)
        }))
      })
    }).then(mismatches => new Mismatch(mismatches, { ssf: match }))
  }
  else {
    const fileContent = fs.readFileSync(resultPath, 'utf-8')
    return Promise.resolve(new Mismatch([new ExtraResultFile(resultPath, fileContent, options)], { ssf: match }))
  }
}

function getMissingResultMismatch(match: any, missingFilePath: string, baselinePath: string, options: DiffFormatOptions) {
  // result folder will never be missing.
  // it is ensured by `baseline()`.
  return new Promise(a => {
    const fileContent = fs.readFileSync(baselinePath, 'utf-8')
    a(new Mismatch([new MissingResultFile(missingFilePath, fileContent, options)], { ssf: match }))
  })
}
