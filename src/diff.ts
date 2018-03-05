import chalk from 'chalk'
import * as jsdiff from 'diff'
import padLeft from 'pad-left'

export interface DiffFormatOptions {
  /**
   * How many lines in a file would consider as a large file.
   */
  largeFileThreshold: number,
  /**
   * How many unchanged lines will be displayed around the changes for large file.
   */
  largeFileAmbientLines: number
}

export function createDiff(actual: string, expected: string) {
  const singleLine = expected.indexOf('\n') === -1 && actual.indexOf('\n') === -1

  return {
    singleLine,
    diff: singleLine ?
      jsdiff.diffWords(expected, actual) :
      jsdiff.diffLines(
        expected && !expected.endsWith('\n') ? expected + '\n' : expected,
        actual && !actual.endsWith('\n') ? actual + '\n' : actual)
  }
}

export function formatDiff(diff: { singleLine: boolean, diff: jsdiff.IDiffResult[] }, options: DiffFormatOptions) {
  return diff.singleLine ?
    formatWordsDiff(diff.diff) :
    formatLinesDiff(diff.diff, options)
}


function formatWordsDiff(diff: jsdiff.IDiffResult[]) {
  return diff.map(function (part) {
    if (part.added)
      return chalk.green(part.value)
    else if (part.removed)
      return chalk.red(part.value)
    else
      return part.value
  }).join('')
}

function formatLinesDiff(diff: jsdiff.IDiffResult[], options: DiffFormatOptions) {
  const lineCount = diff.reduce((p, part) => {
    if (part.removed) return p
    return p + part.count!
  }, 0)
  return lineCount > options.largeFileThreshold ? formatManyLinesDiff(diff, lineCount, options.largeFileAmbientLines) : formatFewLinesDiff(diff)
}
function formatManyLinesDiff(diff: jsdiff.IDiffResult[], totalLineCount: number, numOfAmbientLines: number) {
  let padding = String(totalLineCount).length
  let diffLines = getTrimmedLineDiffs(diff, numOfAmbientLines)
  return diffLines.map(part => {
    if (part.added) {
      return chalk.green(`${padLeft('', padding)}  + ${part.value}`)
    }
    if (part.removed) {
      return chalk.red(`${padLeft(part.count, padding)}: - ${part.value}`)
    }
    return `${padLeft(part.count, padding)}:   ${part.value}`
  }).join('\n')
}

function formatFewLinesDiff(diff: jsdiff.IDiffResult[]) {
  return diff.map(function (part) {
    const lines = getLines(part.value)
    if (part.added) {
      return chalk.green(lines.map(l => `+ ${l}`).join('\n'))
    }
    if (part.removed) {
      return chalk.red(lines.map(l => `- ${l}`).join('\n'))
    }
    return lines.map(l => `  ${l}`).join('\n')
  }).join('\n')
}

function getLines(value: string) {
  const lines = value.split('\n')
  return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
}

/**
 * Create a map on when to display the lines.
 */
function getTrimmedLineDiffs(diff: jsdiff.IDiffResult[], numOfAmbientLines: number) {
  let index = 0
  let allLines: jsdiff.IDiffResult[] = []
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
  const trimmedLines: jsdiff.IDiffResult[] = []

  allLines.forEach(line => {
    if (line.count === undefined || inRange(anchors, numOfAmbientLines, line.count))
      trimmedLines.push(line)
  })
  return trimmedLines
}

function inRange(anchors: number[], range: number, lineNumber: number) {
  return anchors.some(a => lineNumber > a - range && lineNumber <= a + range)
}
