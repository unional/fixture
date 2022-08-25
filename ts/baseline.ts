import fs from 'fs'
import minimatch from 'minimatch'
import path from 'path'
import { required } from 'type-plus'
import { context } from './context.js'
import { CopyToBaseline, createCopyToBaselineFunction } from './copyToBaseline.js'
import { DiffFormatOptions } from './diff.js'
import { NoCaseFound } from './errors.js'
import { ensureFolderEmpty, ensureFolderExist, isFolder, isHidden } from './fsUtils.js'
import { createMatchFunction } from './match.js'

export interface BaselineOptions extends DiffFormatOptions {
  /**
   * Path to the fixture root.
   */
  basePath: string,
  /**
   * Name of the cases folder.
   * Defaults to 'cases'.
   */
  casesFolder: string,
  /**
   * Name of the results folder.
   * Defaults to 'results'.
   */
  resultsFolder: string,
  /**
   * Name of the baselines folder.
   * Defaults to 'baselines'.
   */
  baselinesFolder: string,
  /**
   * Filter cases to run.
   */
  filter?: string | RegExp,
  /**
   * By default warning messages will be displayed when some test cases are filtered.
   * Use this to suppress those warnings.
   */
  suppressFilterWarnings?: boolean,
}
export interface BaselineHandlerContext {
  /**
   * Name of the case.
   * This is the name of the file or the folder.
   */
  caseName: string,

  /**
   * Indicates if the case is a file-case or a folder-case.
   */
  caseType: 'file' | 'folder',
  /**
   * File or folder path of the case.
   */
  casePath: string,
  /**
   * Path of the baseline folder.
   * Even if the case is a file, this will create points to a folder with the same name
   * This is mostly for reference purpose.
   * You don't normally need to use this.
   */
  baselinePath: string,
  /**
   * Path of the result folder.
   * Even if the case is a file, this will create points to a folder with the same name
   */
  resultPath: string,
  /**
   * Assert the result and baseline matches.
   * @param target Optional. Target to match against. Default to `caseName`.
   */
  match(target?: string): Promise<any>,

  /**
   * Helper function to copy the result to baseline.
   */
  copyToBaseline: CopyToBaseline
}

export type BaselineHandler = (context: BaselineHandlerContext) => void

/**
 * Iterates files/folders for `cases|results|baselines` testing.
 */
export const baseline = Object.assign(
  function baseline(basePathOrOptions: string | Partial<BaselineOptions>, handler: BaselineHandler) {
    const options = getOptions(basePathOrOptions)

    if (!fs.existsSync(options.basePath)) throw new NoCaseFound(options.basePath)

    const casesFolder = path.join(options.basePath, options.casesFolder)
    const resultsFolder = path.join(options.basePath, options.resultsFolder)
    const baselinesFolder = path.join(options.basePath, options.baselinesFolder)

    if (!fs.existsSync(casesFolder)) throw new NoCaseFound(casesFolder)

    const shouldInclude = getShouldIncludePredicate(options.filter)

    const cases = fs.readdirSync(casesFolder).filter(path => {
      if (isHidden(path)) return false

      if (shouldInclude(path)) return true

      if (!options.suppressFilterWarnings)
        context.log.warn(`case '${path}' in '${options.basePath}' is filtered and not executed`)
      return false
    })

    if (cases.length === 0) throw new NoCaseFound(casesFolder)

    ensureFolderExist(resultsFolder)
    ensureFolderExist(baselinesFolder)

    cases.forEach(caseName => {
      const context = createContextForDirectory(caseName, casesFolder, baselinesFolder, resultsFolder, options)
      ensureFolderEmpty(context.resultPath)
      handler(context)
    })
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    skip(basePathOrOptions: string | Partial<BaselineOptions>, handler: BaselineHandler): void { }
  }
)

const defaultOptions = {
  casesFolder: 'cases',
  resultsFolder: 'results',
  baselinesFolder: 'baselines',
  largeFileThreshold: 100,
  largeFileAmbientLines: 5,
  diffDisplayThreshold: 150
} as BaselineOptions

function getOptions(givenOptions: string | Partial<BaselineOptions>) {
  return required(defaultOptions, typeof givenOptions === 'string' ? { basePath: givenOptions } : givenOptions)
}

function getShouldIncludePredicate(filter: string | RegExp | undefined) {
  if (filter instanceof RegExp)
    return (path: string) => filter.test(path)
  if (typeof filter === 'string')
    return (path: string) => minimatch(path, filter)
  return (_path: string) => true
}

function createContextForDirectory(caseName: string, casesFolder: string, baselinesFolder: string, resultsFolder: string, options: DiffFormatOptions): BaselineHandlerContext {
  const casePath = path.join(casesFolder, caseName)
  const baselinePath = path.join(baselinesFolder, caseName)
  const resultPath = path.join(resultsFolder, caseName)

  ensureFolderExist(baselinePath)
  ensureFolderExist(resultPath)

  const match = createMatchFunction(baselinePath, resultPath, options)
  const copyToBaseline = createCopyToBaselineFunction(baselinePath, resultPath)
  return {
    caseName,
    caseType: isFolder(casePath) ? 'folder' : 'file',
    casePath,
    baselinePath,
    resultPath,
    match,
    copyToBaseline
  }
}
