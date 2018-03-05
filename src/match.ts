import dirCompare from 'dir-compare'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { Tersify } from 'tersify'

import { MissingFile, MismatchFile, Mismatch, MissingDirectory, MismatchFileOptions } from './errors'
import { isFolder } from './fsUtils'

export type match = (caseName?: string) => Promise<any>

export function createMatchFunction(baselineFolder: string, resultFolder: string, options: MismatchFileOptions) {
  return function match(caseName?: string): Promise<any> {
    const resultPath = caseName ? path.join(resultFolder, caseName) : resultFolder
    const baselinePath = caseName ? path.join(baselineFolder, caseName) : baselineFolder
    return dirCompare.compare(baselinePath, resultPath)
      .then((res) => {
        let mismatches: Tersify[] = []
        res.diffSet.forEach(d => {
          if (d.type1 === 'missing') {
            const missingPath = path.join((d.path2 as string).replace(resultPath, baselinePath), d.name2)

            mismatches.push(d.type2 === 'file' ? new MissingFile(missingPath) : new MissingDirectory(missingPath))
          }
          else if (d.type2 === 'missing') {
            const missingPath = path.join((d.path1 as string).replace(baselinePath, resultPath), d.name1)
            mismatches.push(d.type1 === 'file' ? new MissingFile(missingPath) : new MissingDirectory(missingPath))
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
        if (mismatches.length > 0)
          throw new Mismatch(mismatches)
      }, async err => {
        if (err.code === 'ENOENT') {
          if (err.path === baselinePath)
            throw await getMissingBaselineMismatch(err.path, resultPath, options)
          else
            throw await getMissingResultMismatch(err.path, baselinePath, options)
        }
        throw err
      })
  }
}

async function getMissingBaselineMismatch(missingFilePath: string, baselinePath: string, options: MismatchFileOptions) {
  if (isFolder(baselinePath)) {
    const mismatches: Tersify[] = [new MissingDirectory(missingFilePath)]
    const mismatchFiles = await new Promise<MismatchFile[]>(a => {
      glob('**', { cwd: baselinePath, nodir: true }, (_err, files) => {
        a(files.map(file => {
          const filePath = path.join(baselinePath, file)
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          return new MismatchFile(
            path.join(missingFilePath, file),
            '',
            filePath,
            fileContent,
            options
          )
        }))
      })
    })
    mismatches.push(...mismatchFiles)

    return new Mismatch(mismatches)
  }
  else {
    const fileContent = fs.readFileSync(baselinePath, 'utf-8')
    const mismatches = [
      new MissingFile(missingFilePath),
      new MismatchFile(
        missingFilePath,
        '',
        baselinePath,
        fileContent,
        options
      )]
    return new Mismatch(mismatches)
  }
}

async function getMissingResultMismatch(missingFilePath: string, resultPath: string, options: MismatchFileOptions) {
  // result folder will never be missing.
  // it is ensured by `baseline()`.
  const fileContent = fs.readFileSync(resultPath, 'utf-8')
  const mismatches = [
    new MissingFile(missingFilePath),
    new MismatchFile(
      resultPath,
      fileContent,
      missingFilePath,
      '',
      options
    )]
  return new Mismatch(mismatches)
}
