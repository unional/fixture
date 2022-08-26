import * as execa from 'execa'
import fs from 'fs'
import path from 'path'
import type { BaselineHandlerContext } from './index.js'

export interface execCommandResult {
  stdout: string,
  stderr: string,
  error?: Error
}

export async function execCommand({ casePath, caseType }: Pick<BaselineHandlerContext, 'casePath' | 'caseType'>): Promise<execCommandResult> {
  const { command, cwd } = prepareCommandInfo({ caseType, casePath })

  return execa.execa(command, { cwd }).then(
    ({ stderr, stdout }) => ({ stdout, stderr, error: undefined }),
    (error) => ({ stdout: '', stderr: '', error })
  )
}

function prepareCommandInfo({ caseType, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'casePath'>) {
  return caseType === 'file' ? {
    command: fs.readFileSync(casePath, 'utf-8'),
    cwd: path.dirname(casePath)
  } : {
    command: fs.readFileSync(path.join(casePath, 'command'), 'utf-8'),
    cwd: casePath
  }
}

export function writeCommandResult(resultPath: string, { stdout, stderr, error }: execCommandResult) {
  if (stdout) fs.writeFileSync(path.join(resultPath, 'stdout'), stdout)
  if (stderr) fs.writeFileSync(path.join(resultPath, 'stderr'), stderr)
  if (error) fs.writeFileSync(path.join(resultPath, 'error'), error.toString())
}
