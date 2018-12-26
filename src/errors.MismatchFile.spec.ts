import fs from 'fs'
import path from 'path'

import { MismatchFile, baseline } from '.'

const cases = {
  'single-line': 'single line file will diff by words',
  'multi-lines': 'multiline file will diff by lines',
  'multi-lines-add': 'multilines (added) are aligned',
  'multi-lines-remove': 'multilines removed are aligned',
  'indentation': 'multilines are aligned',
  'large-diff': 'large diff (> 100 lines) will show diff with line number, and 5 lines before and after'
}

baseline({
  basePath: 'fixtures/mismatch-file'
}, c => {
  test((cases as any)[c.caseName] || c.caseName, () => {
    const source = fs.readFileSync(path.join(c.caseFolder, 'source.yaml'), 'utf-8')
    const target = fs.readFileSync(path.join(c.caseFolder, 'target.yaml'), 'utf-8')

    const mismatch = new MismatchFile('target.yaml', target, 'source.yaml', source, { largeFileThreshold: 5, largeFileAmbientLines: 2 })

    fs.writeFileSync(path.join(c.resultFolder, 'result.yaml'), mismatch.formattedDiff)
    return c.match('result.yaml')
  })
})
