import { execa } from 'execa'
import fs from 'fs'
import yaml from 'js-yaml'
import { platform } from 'os'
import path from 'path'
import { PartialPick, unpartial } from 'type-plus'
import type { BaselineHandlerContext } from './baseline.js'
import { NotCommandCase } from './errors.js'

export namespace execCommand {
  export interface Result {
    stdout: string,
    stderr: string
  }
  export type CommandInfo = {
    casePath: string,
    command: string,
    args: string[]
  }
}

export async function execCommand(input: Pick<BaselineHandlerContext, 'casePath' | 'caseName' | 'caseType'>)
export async function execCommand(input: PartialPick<execCommand.CommandInfo, 'args'>)
export async function execCommand(input: any): Promise<execCommand.Result> {
  if (input.caseType) {
    const casePath = input.caseType === 'file' ? path.dirname(input.casePath) : input.casePath
    const { command, args } = readCommandInfo(input)
    return execCommandDirectly({ casePath, command, args })
  }
  const { casePath, command, args = [] } = input
  return execCommandDirectly({ casePath, command, args })
}

function execCommandDirectly({ casePath, command, args }: execCommand.CommandInfo) {
  return execa(command, adjustArgs(args), { cwd: casePath, cleanup: true, shell: true })
    .then(({ stderr, stdout }) => ({ stderr, stdout }))
}
function readCommandInfo({ caseName, caseType, casePath }: Pick<BaselineHandlerContext, 'caseType' | 'caseName' | 'casePath'>) {
  const fileinfo = findCommandFileInfo({ caseType, casePath })
  if (!fileinfo) {
    throw new NotCommandCase(caseName, { ssf: execCommand })
  }
  const content = fs.readFileSync(fileinfo.filepath, 'utf-8')
  return unpartial(
    { command: '', args: [] },
    fileinfo.filetype === 'json' ? JSON.parse(content) : yaml.load(content)
  )
}

// istanbul ignore next
function adjustArgs(args: string[]) {
  return platform() === 'win32' ? args.map(adjustArg) : args
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

export function writeCommandResult(resultPath: string, { stdout, stderr }: execCommand.Result) {
  if (stdout) fs.writeFileSync(path.join(resultPath, 'stdout'), stdout)
  if (stderr) fs.writeFileSync(path.join(resultPath, 'stderr'), stderr)
}
