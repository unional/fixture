import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import rimraf = require('rimraf');
// import rimraf from 'rimraf'

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
  if (fs.existsSync(folder)) {
    // remove the content, not the folder.
    // in some case, the folder may be watched by other program,
    // so deleting the folder itself would cause permission issue.
    const entries = fs.readdirSync(folder)
    entries.forEach(e => {
      const subject = path.join(folder, e)
      rimraf.sync(subject)
    })
    // rimraf.sync(folder)
  }
  mkdirp.sync(folder)
}
