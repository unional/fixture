import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

export function isHidden(subject: string) {
  return (/(^|\/)\.[^\/\.]/g).test(subject)
}

export function isFolder(subject: string) {
  return fs.lstatSync(path.resolve(subject)).isDirectory()
}

export function ensureFolderExist(folder: string) {
  if (!fs.existsSync(folder)) mkdirp.sync(folder)
}
