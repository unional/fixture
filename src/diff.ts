import chalk from 'chalk'
import padLeft from 'pad-left'
import { DiffMatch, DiffResult } from './DiffMatch'

export interface DiffFormatOptions {
  /**
   * How many lines in a file would consider as a large file.
   * Default 100
   */
  largeFileThreshold: number,
  /**
   * How many unchanged lines will be displayed around the changes for large file.
   * Default 5
   */
  largeFileAmbientLines: number,
  /**
   * Maximum number of diff lines to show.
   * If there are more diff lines,
   * the remaining will be timmed and show a summary instead.
   * Default 150
   */
  diffDisplayThreshold?: number
}

export function createDiff(actual: string, expected: string) {
  const singleLine = expected.indexOf('\n') === -1 && actual.indexOf('\n') === -1
  const diff = new DiffMatch()
  return {
    singleLine,
    diff: singleLine ?
      diff.diffWords(expected, actual) :
      diff.diffLines(
        expected && !expected.endsWith('\n') ? expected + '\n' : expected,
        actual && !actual.endsWith('\n') ? actual + '\n' : actual)
  }
}

export function formatDiff(diff: { singleLine: boolean, diff: DiffResult[] }, options: DiffFormatOptions) {
  return diff.singleLine ?
    formatWordsDiff(diff.diff) :
    formatLinesDiff(diff.diff, options)
}


function formatWordsDiff(diff: DiffResult[]) {
  return diff.map(function (part) {
    if (part.added)
      return chalk.red(part.value)
    else if (part.removed)
      return chalk.green(part.value)
    else
      return part.value
  }).join('')
}

function formatLinesDiff(diff: DiffResult[], options: DiffFormatOptions) {
  const lineCount = diff.reduce((p, part) => {
    if (part.removed) return p
    return p + part.count!
  }, 0)
  const lines = prependLegend(lineCount > options.largeFileThreshold ? formatManyLinesDiff(diff, lineCount, options.largeFileAmbientLines) : formatFewLinesDiff(diff))

  const legendLineCount = 2
  const linesOver = lines.length - legendLineCount - options.diffDisplayThreshold!
  if (linesOver > 0) {
    lines.splice(options.diffDisplayThreshold!)
    lines.push(chalk.dim(`...and ${linesOver} more lines (change options.diffDisplayThreshold to show more).`))
  }
  return lines.join('\n')
}
function prependLegend(lines: string[]) {
  lines.unshift(`${chalk.green('- Baseline')}`, `${chalk.red('+ Result')}`)
  return lines
}
function formatManyLinesDiff(diff: DiffResult[], totalLineCount: number, numOfAmbientLines: number) {
  let padding = String(totalLineCount).length
  let diffLines = getTrimmedLineDiffs(diff, numOfAmbientLines)
  return diffLines.map(part => {
    if (part.added) {
      return chalk.red(`${padLeft('', padding)}  + ${part.value}`)
    }
    if (part.removed) {
      return chalk.green(`${padLeft(part.count, padding)}: - ${part.value}`)
    }
    if (part.count)
      return `${padLeft(part.count, padding)}:   ${part.value}`
    else
      return `${padLeft('', padding)}  ${part.value}`
  })
}

function formatFewLinesDiff(diff: DiffResult[]) {
  return diff.map(function (part) {
    const lines = getLines(part.value)
    if (part.added) {
      return chalk.red(lines.map(l => `+ ${l}`).join('\n'))
    }
    if (part.removed) {
      return chalk.green(lines.map(l => `- ${l}`).join('\n'))
    }
    return lines.map(l => `  ${l}`).join('\n')
  })
}

function getLines(value: string) {
  const lines = value.split('\n')
  return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
}

/**
 * Create a map on when to display the lines.
 */
function getTrimmedLineDiffs(diff: DiffResult[], numOfAmbientLines: number) {
  let index = 0
  let allLines: DiffResult[] = []
  let anchors: number[] = []
  diff.forEach(part => {
    const lines = getLines(part.value)
    if (part.added) {
      anchors.push(index)
      allLines.push(...lines.map(value => ({ added: true, value })))
    }
    else if (part.removed) {
      anchors.push(index)
      allLines.push(...lines.map(value => ({ count: ++index, removed: true, value })))
      anchors.push(index)
    }
    else {
      allLines.push(...lines.map(value => ({ count: ++index, value })))
    }
  })
  const trimmedLines: DiffResult[] = []
  let lastCount: number
  allLines.forEach(line => {
    if (inRange(anchors, numOfAmbientLines, line)) {
      if (line.count && !line.removed && lastCount && lastCount !== line.count - 1)
        trimmedLines.push({ value: chalk.cyan('......') })
      trimmedLines.push(line)
      if (line.count)
        lastCount = line.count
    }
  })
  return trimmedLines
}

function inRange(anchors: number[], range: number, line: DiffResult) {
  if (line.count === undefined || line.added || line.removed) return true
  return anchors.some(a => line.count! > a - range && line.count! <= a + range)
}
