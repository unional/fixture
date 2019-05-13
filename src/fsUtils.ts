import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import rimraf from 'rimraf'

export function isHidden(subject: string) {
  return (/(^|\/)\.[^\/\.]/g).test(subject)
}

export function isFolder(subject: string) {
  return fs.lstatSync(path.resolve(subject)).isDirectory()
}

export function ensureFolderExist(folder: string) {
  if (!fs.existsSync(folder)) mkdirp.sync(folder)
}

export function ensureFolderEmpty(folder: string) {
  rimraf.sync(`${folder}${path.sep}*`)
  rimraf.sync(`${folder}${path.sep}.*`)
}
