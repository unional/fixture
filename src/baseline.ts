import fs from 'fs'
import minimatch from 'minimatch'
import mkdirp from 'mkdirp'
import path from 'path'
import rimraf from 'rimraf'
import { unpartial } from 'unpartial'

import { createCopyToBaselineFunction, copyToBaseline } from './copyToBaseline'
import { NoCaseFound } from './errors'
import { createMatchFunction, match } from './match'

export interface BaselineOptions {
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
  filter?: string | RegExp
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
  copyToBaseline: copyToBaseline
}

export type BaselineHandler = (context: BaselineHandlerContext) => Promise<void> | void

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

    let cases = fs.readdirSync(casesFolder).filter(path => !isHidden(path) && shouldInclude(path))

    if (cases.length === 0) throw new NoCaseFound(casesFolder)

    ensureFolderExist(resultsFolder)
    ensureFolderExist(baselinesFolder)

    return Promise.all(cases.map(caseName => {
      const casePath = path.join(casesFolder, caseName)
      const isDir = isDirectory(casePath)
      if (isDir) {
        const context = createContextForDirectory(caseName, casesFolder, baselinesFolder, resultsFolder)
        ensureFolderEmpty(context.resultFolder)
        ensureFolderExist(context.baselineFolder)
        return handler(context)
      }
      else {
        const context = createContextForFile(caseName, casesFolder, baselinesFolder, resultsFolder)
        return handler(context)
      }
    }))
  }, {
    skip(basePathOrOptions: string | Partial<BaselineOptions>, handler: BaselineHandler): Promise<void> | void { }
  })

const defaultOptions = {
  casesFolder: 'cases',
  resultsFolder: 'results',
  baselinesFolder: 'baselines'
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

function isHidden(subject) {
  return (/(^|\/)\.[^\/\.]/g).test(subject)
}

function isDirectory(subject) {
  return fs.lstatSync(path.resolve(subject)).isDirectory()
}

function ensureFolderExist(folder: string) {
  if (!fs.existsSync(folder))
    mkdirp.sync(folder)
}

function ensureFolderEmpty(folder: string) {
  if (fs.existsSync(folder))
    rimraf.sync(folder)
  mkdirp.sync(folder)
}

function createContextForDirectory(caseName: string, casesFolder: string, baselinesFolder: string, resultsFolder: string): BaselineHandlerContext {
  const caseFolder = path.join(casesFolder, caseName)
  const baselineFolder = path.join(baselinesFolder, caseName)
  const resultFolder = path.join(resultsFolder, caseName)
  const match = createMatchFunction(baselineFolder, resultFolder)
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

function createContextForFile(caseName: string, casesFolder: string, baselinesFolder: string, resultsFolder: string): BaselineHandlerContext {
  const caseFolder = casesFolder
  const baselineFolder = baselinesFolder
  const resultFolder = resultsFolder
  const match = createMatchFunction(baselineFolder, resultFolder)
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
