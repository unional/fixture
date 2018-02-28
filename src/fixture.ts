import fs from 'fs'
import path from 'path'

import { NoCaseFound } from './errors'

export function fixture(basePath: string, callback) {
  console.log(fs.readdirSync('fixtures'))
  if (!fs.existsSync(basePath)) throw new NoCaseFound(basePath)

  const casePath = path.join(basePath, 'cases')

  if (!fs.existsSync(casePath)) throw new NoCaseFound(casePath)

  const cases = fs.readdirSync(casePath)
  if (cases.length === 0) throw new NoCaseFound(basePath)

  callback()
}
