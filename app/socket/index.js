var config = require('../../config');
var Storage = require('../storage');

var storage = new Storage(config.mysql, config.redis);

module.exports = function (server) {
  var io = require('socket.io').listen(server);
  io.on('connection', function (socket) {
    var emit = function () {
      storage.getTotalSavedCount().then(function (totalSavedCount) {
        io.emit('up', totalSavedCount);
      });
    }();
    setInterval(emit, 60000);
    socket.on('disconnect', function () {

    });
  });
};
