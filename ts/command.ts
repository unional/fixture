import * as execa from 'execa'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { required } from 'type-plus'
import type { BaselineHandlerContext } from './baseline.js'
import { NotCommandCase } from './errors.js'
import { platform } from 'os'

export interface execCommandResult {
  stdout: string,
  stderr: string
}

export async function execCommand({ caseType, caseName, casePath }: Pick<BaselineHandlerContext, 'casePath' | 'caseName' | 'caseType'>): Promise<execCommandResult> {
  const { commandInfo, cwd } = prepareCommandInfo({ caseType, caseName, casePath })

  return execa.execa(commandInfo.command, commandInfo.args, { cwd, cleanup: true, shell: true })
    .then(({ stderr, stdout }) => ({ stderr, stdout }))
}

function prepareCommandInfo({ caseType, caseName, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'caseName' | 'casePath'>) {
  return {
    commandInfo: readCommandInfo({ caseType, caseName, casePath }),
    cwd: caseType === 'file' ? path.dirname(casePath) : casePath
  }
}

function readCommandInfo({ caseName, caseType, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'caseName' | 'casePath'>) {
  const fileinfo = findCommandFileInfo({ caseType, casePath })
  if (!fileinfo) {
    throw new NotCommandCase(caseName, { ssf: execCommand })
  }
  const content = fs.readFileSync(fileinfo.filepath, 'utf-8')
  const { command, args } = required(
    { command: '', args: [] },
    fileinfo.filetype === 'json' ? JSON.parse(content) : yaml.load(content)
  )

  return { command, args: adjustArgs(args) }
}

// istanbul ignore next
function adjustArgs(args: string[]) {
  if (platform() === 'win32') return args.map(adjustArg)
  return args
}

function adjustArg(arg: string) {
  return arg.startsWith("'") ? `"${arg.slice(1, -1).replace(/"/g, '""')}"` : arg
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

export function writeCommandResult(resultPath: string, { stdout, stderr }: execCommandResult) {
  if (stdout) fs.writeFileSync(path.join(resultPath, 'stdout'), stdout)
  if (stderr) fs.writeFileSync(path.join(resultPath, 'stderr'), stderr)
}
