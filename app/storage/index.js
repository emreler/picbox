var mysql = require('mysql');
var bcrypt = require('bcrypt');
var redis = require('redis');
var debug = require('debug')('storage');
var Q = require('q');

var Storage = function (mysqlConfig, redisConfig) {
  this.host = mysqlConfig.host;
  this.user = mysqlConfig.user;
  this.password = mysqlConfig.password;
  this.database = mysqlConfig.database;

  // connection is not established here. it is established implicitly by invoking a query
  this.connection = mysql.createConnection({
    host: this.host,
    user: this.user,
    password: this.password,
    database: this.database
  });

  this.redisClient = redis.createClient(redisConfig.port, redisConfig.host);
};

Storage.prototype.terminate = function () {
  this.connection.end();
  this.redisClient.quit();
};

Storage.prototype.createUser = function (user, cb) {
  var _this = this;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, function(err, hash) {
      _this.connection.query('INSERT INTO users SET ?', {email: user.email, password: hash}, function (err, result) {
        if (err) {
          if (err.hasOwnProperty('code') && err.code == 'ER_DUP_ENTRY') {
            // email address has already been registered
            return cb({email_exists: true});
          }
          throw err;
        }
        cb(null, result.insertId);
      });
    });
  });
};

Storage.prototype.getUser = function (email, password, cb) {
  if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'function') {
    // called with `ìd` parameter for deserialization
    var id = email;
    cb = password;
    this.connection.query('SELECT * FROM users WHERE ?', {id: id}, function (err, result) {
      if (err) throw err;

      if (result.length != 1) {
        return cb({not_exists: true});
      }

      return cb(null, result[0]);
    });
  } else {
    this.connection.query('SELECT * FROM users WHERE ?', {email: email}, function (err, result) {
      if (err) throw err;

      if (result.length === 0) {
        return cb({not_exists: true});
      }

      bcrypt.compare(password, result[0].password, function(err, match) {
        if (err) throw err;

        if (match) {
          cb(null, result[0]);
        } else {
          cb({incorrect_password: true});
        }
      });
    });
  }
};

Storage.prototype.getUsers = function (limit, cb) {
  if (!cb && typeof limit == 'function') {
    cb = limit;
    limit = 100;
  }
  this.connection.query('SELECT id, email, instagram_id, instagram_token, dropbox_id, dropbox_token FROM users LIMIT ?', [limit], function (err, results) {
    if (err) {
      return cb(err);
    }

    cb(null, results);
  });
};

Storage.prototype.getUsersP = function (limit) {
  limit = limit || 100;
  var deferred = Q.defer();
  this.connection.query('SELECT id, email, instagram_id, instagram_token, dropbox_id, dropbox_token FROM users LIMIT ?', [limit], function (err, results) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(results);
    }
  });
  return deferred.promise;
};

Storage.prototype.saveInstagramInfo = function (email, igm, cb) {
  this.connection.query('UPDATE users SET ? WHERE ?',
  [
    {instagram_id: igm.userID, instagram_token: igm.accessToken},
    {email: email}
  ],
  function (err, result) {
    if (err) throw err;
    cb(result.changedRows);
  });
};

Storage.prototype.saveDropboxInfo = function (email, dbx, cb) {
  this.connection.query('UPDATE users SET ? WHERE ?',
  [
    {dropbox_id: dbx.userID, dropbox_token: dbx.accessToken},
    {email: email}
  ],
  function (err, result) {
    if (err) throw err;
    cb(result.changedRows);
  });
};

Storage.prototype.checkMediaSavedP = function (userID, mediaID) {
  var deferred = Q.defer();

  this.isMediaSaved(userID, mediaID, function (err, saved) {
    if (err) throw err;
    deferred.resolve(saved);
  });

  return deferred.promise;
};

Storage.prototype.isMediaSaved = function (userID, mediaID, cb) {
  var savedLikesKey = 'picbox.' + userID + '.saved';
  this.redisClient.sismember(savedLikesKey, mediaID, function (err, reply) {
    if (err) {
      return cb(err);
    }
    if (reply === 1) {
      return cb(null, true);
    } else if(reply === 0) {
      return cb(null, false);
    } else {
      return cb(new Error('Unknown response: ' + reply));
    }
  });
};

Storage.prototype.saveLikedMedia = function (userID, mediaID) {
  var savedLikesKey = 'picbox.' + userID + '.saved';

  // todo: error handling
  this.redisClient.sadd(savedLikesKey, mediaID);
};

module.exports = Storage;
