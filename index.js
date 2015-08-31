'use strict';

var fs = require('fs');
var config = require('./lib/config');
var logFactory = require('./lib/logger');
var sandboxer = require('./lib/sandboxer');
var log = logFactory(__filename);

exports.main = function() {
  // проверяем существует ли дирректория с играми
  if (!fs.existsSync( config.get('games_directory'))) {
    log.error('Unable to read "' + config.get('games_directory') + '"');
    process.exit(1);
  }

  for (var game in sandboxer.list()) {
    sandboxer.spawn(game);
  }

  require('./lib/lobby').start();
};

if (!module.parent) {
  var logConf = config.get('log') || {};
  logFactory.setConfig(logConf);
  exports.main();
}
