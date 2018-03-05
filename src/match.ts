import dirCompare from 'dir-compare'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { Tersify } from 'tersify'

import { DiffFormatOptions } from './diff'
import { MismatchFile, Mismatch, ExtraResultFile, MissingResultFile } from './errors'
import { isFolder } from './fsUtils'

export type match = (caseName?: string) => Promise<any>

export function createMatchFunction(baselineFolder: string, resultFolder: string, options: DiffFormatOptions) {
  return function match(caseName?: string): Promise<any> {
    const resultPath = caseName ? path.join(resultFolder, caseName) : resultFolder
    const baselinePath = caseName ? path.join(baselineFolder, caseName) : baselineFolder
    return dirCompare.compare(baselinePath, resultPath)
      .then((res) => {
        let mismatches: Tersify[] = []
        res.diffSet.forEach(d => {
          if (d.type1 === 'missing') {
            if (d.type2 === 'file') {
              const filePath = path.join(d.path2, d.name2)
              const result = fs.readFileSync(filePath, 'utf-8')
              mismatches.push(new ExtraResultFile(filePath, result, options))
            }
          }
          else if (d.type2 === 'missing') {
            const missingPath = path.join((d.path1 as string).replace(baselinePath, resultPath), d.name1)

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
        if (mismatches.length > 0)
          throw new Mismatch(mismatches)
      }, async err => {
        if (err.code === 'ENOENT') {
          if ((path.isAbsolute(err.path) && err.path === path.resolve(baselinePath)) ||
            err.path === baselinePath)
            throw await getMissingBaselineMismatch(baselinePath, resultPath, options)
          else
            throw await getMissingResultMismatch(resultPath, baselinePath, options)
        }
        // istanbul ignore next
        throw err
      })
  }
}

async function getMissingBaselineMismatch(missingFilePath: string, resultPath: string, options: DiffFormatOptions) {
  if (isFolder(resultPath)) {
    const mismatches = await new Promise<Tersify[]>(a => {
      glob('**', { cwd: resultPath, nodir: true }, (_err, files) => {
        a(files.map(file => {
          const filePath = path.join(resultPath, file)
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          return new ExtraResultFile(filePath, fileContent, options)
        }))
      })
    })

    return new Mismatch(mismatches)
  }
  else {
    const fileContent = fs.readFileSync(resultPath, 'utf-8')
    return new Mismatch([new ExtraResultFile(resultPath, fileContent, options)])
  }
}

async function getMissingResultMismatch(missingFilePath: string, baselinePath: string, options: DiffFormatOptions) {
  // result folder will never be missing.
  // it is ensured by `baseline()`.
  const fileContent = fs.readFileSync(baselinePath, 'utf-8')
  return new Mismatch([new MissingResultFile(missingFilePath, fileContent, options)])
}
