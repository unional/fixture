import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import rimraf from 'rimraf'

export function isHidden(subject) {
  return (/(^|\/)\.[^\/\.]/g).test(subject)
}

export function isFolder(subject) {
  return fs.lstatSync(path.resolve(subject)).isDirectory()
}

export function ensureFolderExist(folder: string) {
  if (!fs.existsSync(folder))
    mkdirp.sync(folder)
}

export function ensureFolderEmpty(folder: string) {
  if (fs.existsSync(folder))
    rimraf.sync(folder)
  mkdirp.sync(folder)
}
