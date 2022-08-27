import * as execa from 'execa'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import type { BaselineHandlerContext } from './baseline.js'
import { NotCommandCase } from './errors.js'

export interface execCommandResult {
  stdout: string,
  stderr: string,
  error?: Error
}

export async function execCommand({ caseType, caseName, casePath }: Pick<BaselineHandlerContext, 'casePath' | 'caseName' | 'caseType'>): Promise<execCommandResult> {
  const { commandInfo, cwd } = prepareCommandInfo({ caseType, caseName, casePath })

  return execa.execa(commandInfo.command, commandInfo.args, { cwd, cleanup: true, shell: true }).then(
    ({ stderr, stdout }) => ({ stdout, stderr, error: undefined }),
    (error) => ({ stdout: '', stderr: '', error })
  )
}

function prepareCommandInfo({ caseType, caseName, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'caseName' | 'casePath'>) {
  return {
    commandInfo: readCommandInfo({ caseType, caseName, casePath }),
    cwd: caseType === 'file' ? path.dirname(casePath) : casePath
  }
}

function readCommandInfo({ caseName, caseType, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'caseName' | 'casePath'>) {
  const info = findCommandFileInfo({ caseType, casePath })
  if (!info) {
    throw new NotCommandCase(caseName, { ssf: execCommand })
  }
  const content = fs.readFileSync(info.filepath, 'utf-8')
  const command = info.filetype === 'json' ? JSON.parse(content) : yaml.load(content)
  // TODO: validate object format
  // TODO: win32 process args
  return command
}

function findCommandFileInfo({ caseType, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'casePath'>) {
  return caseType === 'file'
    ? findCommandFileInfoForFile(casePath)
    : findCommandFileInfoForFolder(casePath)
}

function findCommandFileInfoForFile(casePath: string) {
  const extension = path.extname(casePath)
  if (extension === '.json') return { filepath: casePath, filetype: 'json' }
  if (['.yml', '.yaml'].indexOf(extension) >= 0) return { filepath: casePath, filetype: 'yaml' }
}

function findCommandFileInfoForFolder(casePath: string) {
  let filepath = path.join(casePath, 'command.json')
  if (fs.existsSync(filepath)) return { filepath, filetype: 'json' }

  filepath = path.join(casePath, 'command.yml')
  if (fs.existsSync(filepath)) return { filepath, filetype: 'yaml' }

  filepath = path.join(casePath, 'command.yaml')
  if (fs.existsSync(filepath)) return { filepath, filetype: 'yaml' }
}

export function writeCommandResult(resultPath: string, { stdout, stderr, error }: execCommandResult) {
  if (stdout) fs.writeFileSync(path.join(resultPath, 'stdout'), stdout)
  if (stderr) fs.writeFileSync(path.join(resultPath, 'stderr'), stderr)
  if (error) fs.writeFileSync(path.join(resultPath, 'error'), error.toString())
}
