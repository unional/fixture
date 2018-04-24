import fs from 'fs'
import minimatch from 'minimatch'
import path from 'path'
import { unpartial } from 'unpartial'

import { createCopyToBaselineFunction, CopyToBaseline } from './copyToBaseline'
import { DiffFormatOptions } from './diff'
import { NoCaseFound } from './errors'
import { isHidden, isFolder, ensureFolderEmpty, ensureFolderExist } from './fsUtils'
import { createMatchFunction, match, createMatchFunctionForFile } from './match'
import { log } from './log'

export interface BaselineOptions extends DiffFormatOptions {
  /**
   * Path to the fixture root.
   */
  basePath: string
  /**
   * Name of the cases folder.
   * Defaults to 'cases'.
   */
  casesFolder: string
  /**
   * Name of the results folder.
   * Defaults to 'results'.
   */
  resultsFolder: string
  /**
   * Name of the baselines folder.
   * Defaults to 'baselines'.
   */
  baselinesFolder: string
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
   * Folder containing the case.
   * If the case is a file, this is the 'cases' folder.
   * If the case is a folder, this is the case folder.
   */
  caseFolder: string,
  /**
   * Folder containing the baseline.
   * This is mostly for reference purpose.
   * You don't normally need to use this.
   *
   * If the case is a file, this is the 'baselines' folder.
   * If the case is a folder, this is the baseline folder.
   */
  baselineFolder: string,
  /**
   * Folder containing the result.
   * Use this to write your output file(s).
   * If the case is a file, this is the 'results' folder.
   * If the case is a folder, this is the result folder.
   */
  resultFolder: string,
  /**
   * Assert the result and baseline matches.
   */
  match: match,
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

    let cases = fs.readdirSync(casesFolder).filter(path => {
      if (isHidden(path)) return false

      if (shouldInclude(path)) return true

      if (!options.suppressFilterWarnings)
        log.warn(`case '${path}' in '${options.basePath}' is filtered and not executed`)
      return false
    })

    if (cases.length === 0) throw new NoCaseFound(casesFolder)

    ensureFolderExist(resultsFolder)
    ensureFolderExist(baselinesFolder)

    cases.forEach(caseName => {
      const casePath = path.join(casesFolder, caseName)
      const isDir = isFolder(casePath)
      if (isDir) {
        const context = createContextForDirectory(caseName, casesFolder, baselinesFolder, resultsFolder, options)
        ensureFolderEmpty(context.resultFolder)
        return handler(context)
      }
      else {
        const context = createContextForFile(caseName, casesFolder, baselinesFolder, resultsFolder, options)
        return handler(context)
      }
    })
  }, {
    skip(basePathOrOptions: string | Partial<BaselineOptions>, handler: BaselineHandler): Promise<void> | void { }
  })

const defaultOptions = {
  casesFolder: 'cases',
  resultsFolder: 'results',
  baselinesFolder: 'baselines',
  largeFileThreshold: 100,
  largeFileAmbientLines: 5,
  diffDisplayThreshold: 150
} as BaselineOptions

function getOptions(givenOptions: string | Partial<BaselineOptions>) {
  return unpartial(defaultOptions, typeof givenOptions === 'string' ? { basePath: givenOptions } : givenOptions)
}

function getShouldIncludePredicate(filter: string | RegExp | undefined) {
  if (filter instanceof RegExp)
    return (path) => filter.test(path)
  if (typeof filter === 'string')
    return (path) => minimatch(path, filter)
  return (_path) => true
}

function createContextForDirectory(caseName: string, casesFolder: string, baselinesFolder: string, resultsFolder: string, options: DiffFormatOptions): BaselineHandlerContext {
  const caseFolder = path.join(casesFolder, caseName)
  const baselineFolder = path.join(baselinesFolder, caseName)
  const resultFolder = path.join(resultsFolder, caseName)
  const match = createMatchFunction(baselineFolder, resultFolder, options)
  const copyToBaseline = createCopyToBaselineFunction(baselineFolder, resultFolder)
  return {
    caseName,
    caseFolder,
    baselineFolder,
    resultFolder,
    match,
    copyToBaseline
  }
}

function createContextForFile(caseName: string, casesFolder: string, baselinesFolder: string, resultsFolder: string, options: DiffFormatOptions): BaselineHandlerContext {
  const caseFolder = casesFolder
  const baselineFolder = baselinesFolder
  const resultFolder = resultsFolder
  const match = createMatchFunctionForFile(baselineFolder, resultFolder, caseName, options)
  const copyToBaseline = createCopyToBaselineFunction(baselineFolder, resultFolder)
  return {
    caseName,
    caseFolder,
    baselineFolder,
    resultFolder,
    match,
    copyToBaseline
  }
}
