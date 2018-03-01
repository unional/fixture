import fs from 'fs'
import matcher from 'matcher'
import mkdirp from 'mkdirp'
import path from 'path'
import { unpartial } from 'unpartial'

import { NoCaseFound } from './errors'
import { createMatchFunction, match } from './match'
import { createCopyToBaselineFunction, copyToBaseline } from './copyToBaseline'
export interface BaselineOptions {
  basePath: string
  casesFolder: string
  resultsFolder: string
  baselinesFolder: string
  filter?: string | RegExp
}
export interface BaselineHandlerContext {
  caseName: string,
  caseFolder: string,
  baselineFolder: string,
  resultFolder: string,
  match: match,
  copyToBaseline: copyToBaseline
}
export type BaselineHandler = (context: BaselineHandlerContext) => Promise<void> | void

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
        ensureFolderExist(context.resultFolder)
        return handler(context)
      }
      else {
        const context = createContextForFile(caseName, casesFolder, baselinesFolder, resultsFolder)
        return handler(context)
      }
    }))
  }, {
    skip(basePathOrOptions: string | Partial<BaselineOptions>, handler: BaselineHandler): Promise<void> | void {
      return
    }
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
    return (path) => matcher.isMatch(path, filter)
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
