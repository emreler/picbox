var mysql = require('mysql');
var bcrypt = require('bcrypt');

var Storage = function (config) {
  this.host = config.host;
  this.user = config.user;
  this.password = config.password;
  this.database = config.database;

  this.connection = mysql.createConnection({
    host: this.host,
    user: this.user,
    password: this.password,
    database: this.database
  });
};

Storage.prototype.terminate = function () {
  this.connection.end();
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

module.exports = Storage;
