import { a } from 'assertron'
import path from 'path'
import { pathEqual } from 'path-equal'
import { baseline, execCommand, NotCommandCase, writeCommandResult } from './index.js'

describe('execCommand()', () => {
  it('throws NotCommandCase if the file is not json, yml, or yaml', async () => {
    await a.throws(execCommand({ caseType: 'file', caseName: 'file1.txt', casePath: 'fixtures/file-cases/cases/file1.txt' }), NotCommandCase)
  })
  it('executes command within the case file, at the base folder', async () => {
    const baseFolder = 'fixtures/command/cases'
    const caseName = 'command.json'
    const casePath = path.join(baseFolder, caseName)

    const { stdout } = await execCommand({ caseType: 'file', caseName, casePath })

    pathEqual(stdout, baseFolder)
  })

  it('executes command in the "command" file within the case folder, at the case folder', async () => {
    const casePath = 'fixtures/command/cases/folder'
    const { stdout } = await execCommand({ caseType: 'folder', caseName: 'folder', casePath })

    pathEqual(stdout, casePath)
  })
  it('throw error on failed command', async () => {
    const error = await a.throws(execCommand({
      caseType: 'folder',
      caseName: 'command-error',
      casePath: 'fixtures/command-error'
    }))

    expect(error).toBeDefined()
  })
})

describe('writeCommandResult()', () => {
  baseline('fixtures/command', ({ caseType, caseName, casePath, resultPath, match }) => {
    it(caseName, async () => {
      const result = await execCommand({ caseType, caseName, casePath })
      writeCommandResult(resultPath, result)
      return match()
    })
  })
})
