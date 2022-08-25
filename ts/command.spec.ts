import path from 'path'
import { pathEqual } from 'path-equal'
import { baseline, execCommand, writeCommandResult } from './index.js'

describe('execCommand()', () => {
  it('executes command within the case file, at the base folder', async () => {
    const baseFolder = 'fixtures/command/cases'
    const casePath = path.join(baseFolder, 'command.txt')

    const { stdout } = await execCommand({ caseType: 'file', casePath })

    pathEqual(stdout, baseFolder)
  })

  it('executes command in the "command" file within the case folder, at the case folder', async () => {
    const casePath = 'fixtures/command/cases/folder'
    const { stdout } = await execCommand({ caseType: 'folder', casePath })

    pathEqual(stdout, casePath)
  })
  it('returns error on failed command', async () => {
    const { error } = await execCommand({
      caseType: 'folder',
      casePath: 'fixtures/command/cases/error'
    })

    expect(error).toBeDefined()
  })
})

describe('writeCommandResult()', () => {
  baseline('fixtures/command', ({ caseType, caseName, casePath, resultPath, match }) => {
    it(caseName, async () => {
      const result = await execCommand({ casePath, caseType })
      writeCommandResult(resultPath, result)
      return match()
    })
  })
})
