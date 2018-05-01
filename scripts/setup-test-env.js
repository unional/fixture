const LogManager = require('@unional/logging')
const ColorAppender = require('aurelia-logging-color').ColorAppender

LogManager.addAppender(new ColorAppender())

// LogManager.getLogger('fixture', LogManager.logLevel.debug)
