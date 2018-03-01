import dirCompare from 'dir-compare'
import fs from 'fs'
import path from 'path'
import { Tersify } from 'tersify'

import { MissingFile, MismatchFile, Mismatch, MissingDirectory } from './errors'

export type match = (caseName?: string) => Promise<any>

export function createMatchFunction(baselineFolder: string, resultFolder: string) {
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
              mismatches.push(new MismatchFile(filename2, file2, filename1, file1))
            }
          }
        })
        if (mismatches.length > 0)
          throw new Mismatch(mismatches)
      })
  }
}
