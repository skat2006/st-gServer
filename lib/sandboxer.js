'use strict';

var fs = require('fs');
var path = require('path');
var srvConfig = require('./config');
var Game = require('./game');

var Sandbox = require('sandboxer');
var shims = require('./shims');

var log = require('./logger')(__filename);

var gamesDir = srvConfig.get('games_directory');
var games = {};

module.exports.list = function list() {
  if (Object.keys(games).length === 0) {
    fs.readdirSync(gamesDir).filter(function(file) {
      return fs.statSync(path.join(gamesDir, file)).isDirectory();
    }).forEach(function(gDir) {
      games[gDir] = new Game( path.join(gamesDir, gDir) );
    });
  }
  return games;
};

module.exports.spawn = function spawn(game) {
  game = games[game].createServer();

  log('spawning', {game: game.codeName, port: game.port});

  // создаем песочницу
  var sandbox = new Sandbox(game.srcDir, {
    modules: srvConfig.get('sanctioned_modules'),
    shims:   {
      'sandbox-io':     shims.io(game.io),
      'sandbox-server': shims.server(game.server)
    },
    globals: {
      console:     console,
      setTimeout:  setTimeout,
      setInterval: setInterval,
      db:          game.db.bind(game),
      log:         require('./logger')(game.codeName, true)
    }
  });

  game.server.listen(game.port, function() {
    log('Game started!', {game: game.codeName, port: game.port});
    // пуск после сервера для отладки
    try {
      sandbox.load(game.main);
    } catch (err) {
      log.error('Game fail', err, {game: game.codeName});
      game.server.close(); // Останавливаемся при краше.
      setTimeout(function(){
        // Отложенный рестарт
        spawn(game.codeName);
      }, 30 * 1000); // 30 seconds
    }
  });

};
