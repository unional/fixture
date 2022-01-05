import fs from 'fs'
import path from 'path'
import uncolor from 'uncolor'
import { baseline, MismatchFile } from '.'


const cases: Record<string, string> = {
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
  test(cases[c.caseName] || c.caseName, () => {
    const source = fs.readFileSync(path.join(c.caseFolder, 'source.yaml'), 'utf-8')
    const target = fs.readFileSync(path.join(c.caseFolder, 'target.yaml'), 'utf-8')

    const mismatch = new MismatchFile(
      'target.yaml',
      target,
      'source.yaml',
      source,
      { largeFileThreshold: 5, largeFileAmbientLines: 2 })

    // during CI, `chalk` does not add color, causing tests to fail.
    // uncolor the result so that the test passes.
    fs.writeFileSync(path.join(c.resultFolder, 'result.yaml'), uncolor(mismatch.formattedDiff))
    return c.match('result.yaml')
  })
})
