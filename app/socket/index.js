var config = require('../../config');
var Storage = require('../storage');

var storage = new Storage(config.mysql, config.redis);

module.exports = function (server) {
  var io = require('socket.io').listen(server);
  var lastCount = null;
  var emit = function () {
    io.sockets.emit('up', lastCount);
  };
  setInterval(function () {
    storage.getTotalSavedCount().then(function (totalSavedCount) {
      if (totalSavedCount !== lastCount) {
        lastCount = totalSavedCount;
        emit();
      }
    });
  }, 1000);
  io.on('connection', function (socket) {
    emit();
    socket.on('disconnect', function () {

    });
  });
};
