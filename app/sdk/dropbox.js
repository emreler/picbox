var querystring = require('querystring');
var https = require('https');
var request = require('request');
var Q = require('q');
var debug = require('debug')('dropbox');

var Dropbox = function (config) {
  this.clientID = config.client_id;
  this.clientSecret = config.client_secret;
  this.redirectUri = config.redirect_uri;
  this.maxRetry = 5;
};

Dropbox.prototype.getAuthUrl = function () {
  return 'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id='+this.clientID+'&redirect_uri='+this.redirectUri;
};

Dropbox.prototype.getAccessToken = function (code, cb) {

  var postData = querystring.stringify({
    client_id: this.clientID,
    client_secret: this.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectUri,
    code: code
  });

  var options = {
    host: 'api.dropbox.com',
    path: '/1/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var _this = this;
  var req = https.request(options, function(res) {
    var responseStr = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      responseStr += chunk;
    });

    res.on('end', function () {
      /*
      Sample response:
      {"access_token": "ABCDEFG", "token_type": "bearer", "uid": "12345"}
      */
      var response = {};
      try {
        response = JSON.parse(responseStr);
      } catch (e) {
        // todo: show error
        return cb(e);
      }

      if (response.hasOwnProperty('error')) {
        return cb(new Error(response.error_description));
      }

      _this.accessToken = response.access_token;
      _this.userID = response.uid;

      cb(null, response.access_token, response.uid);
    });
  });

  req.write(postData);
  req.end();

};

Dropbox.prototype.isAppInstalled = function (accessToken) {
  var deferred = Q.defer();

  var options = {
    url: 'https://api.dropboxapi.com/1/account/info',
    method: 'GET',
    json: true,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  };

  request(options, function (err, response, body) {
    if (err) throw err;
    if (response.statusCode == 200 && body.hasOwnProperty('uid')) {
      deferred.resolve();
    } else if (body.hasOwnProperty('error')) {
      if (body.error.indexOf('has expired') >= 0 || body.error.indexOf('User has removed their App folder') >= 0) {
        deferred.reject({removeDbxCredentials: true, message: body.error});
      } else {
        deferred.reject(new Error(body.error));
      }
    }
  });

  return deferred.promise;
};

Dropbox.prototype.getFileList = function (accessToken) {
  var deferred = Q.defer();
  var options = {
    url: 'https://api.dropboxapi.com/1/metadata/auto/?' + querystring.stringify({file_limit: 25000, list: true}),
    method: 'GET',
    json: true,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  };

  _this = this;
  request(options, function (err, res, body) {
    if (err) {
      deferred.reject(err);
    }
    deferred.resolve(body.contents);
  });
  return deferred.promise;
}

Dropbox.prototype.deleteFile = function (accessToken, path) {
  var deferred = Q.defer();
  var options = {
    url: 'https://api.dropboxapi.com/1/fileops/delete',
    method: 'POST',
    form: {
      root: 'auto',
      path: path
    },
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  };

  _this = this;
  request(options, function (err, res, body) {
    if (err) {
      deferred.reject(err);
    }
    try {
      body = JSON.parse(body);
      if (body.hasOwnProperty('error')) {
        deferred.reject(body.error);
      }
      deferred.resolve();
    } catch (e) {
      deferred.reject('invalid json', body, e);
    }

  });
  return deferred.promise;
}

Dropbox.prototype.saveUrlP = function (params) {
  var deferred = Q.defer();
  // Q.delay(300).then(function () {return deferred.reject('fooer');});
  // return deferred.promise;
  params.retry = params.retry || 0;

  var options = {
    url: 'https://api.dropboxapi.com/1/save_url/auto/' + encodeURIComponent(params.path) + '?' + querystring.stringify({url: params.url}),
    method: 'POST',
    json: true,
    headers: {
      Authorization: 'Bearer '+params.accessToken
    }
  };

  _this = this;
  request(options, function (err, res, body) {
    if (err) throw err;

    if (body.hasOwnProperty('error')) {
      // See: https://www.dropboxforum.com/hc/en-us/community/posts/204555365-Failed-to-grab-locks
      if (body.error.indexOf('Failed to grab locks') >= 0) {
        if (++params.retry === _this.maxRetry) {
          deferred.reject(new Error('Retries failed'));
        } else {
          debug('Retrying ['+params.retry+']...');
          Q.delay(300 * params.retry)
          .then(function () {
            return _this.saveUrlP(params);
          })
          .then(function (body) {
            deferred.resolve(body);
          })
          .catch(function (err) {
            deferred.reject(err);
          });
        }
      } else {
        deferred.reject(new Error(body.error));
      }
    } else {
      if (params.retry > 0) {
        debug('completed after '+ params.retry + ' retries');
      }
      deferred.resolve(body);
    }
  });
  return deferred.promise;
};

Dropbox.prototype.saveUrl = function (params, cb) {

  params.retry = params.retry || 0;

  _this = this;
  var req = https.request({
    host: 'api.dropboxapi.com',
    path: '/1/save_url/auto/' + encodeURIComponent(params.path) + '?' + querystring.stringify({url: params.url}),
    method: 'POST',
    headers: {
      Authorization: 'Bearer '+params.accessToken
    }
  }, function (res) {
    var responseStr = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      responseStr += chunk;
    });

    res.on('end', function () {
      /*
      Sample response:
      {"status": "PENDING", "job": "1mYs8ReIEScAAAAAAAAmIQ"}
      */
      var response = {};
      try {
        response = JSON.parse(responseStr);
      } catch (e) {
        // todo: show error
        return cb(e);
      }

      if (response.hasOwnProperty('error')) {
        // See: https://www.dropboxforum.com/hc/en-us/community/posts/204555365-Failed-to-grab-locks
        if (response.error.indexOf('Failed to grab locks') >= 0) {
          if (++params.retry === _this.maxRetry) {
            return cb(new Error('Retries failed'));
          }
          return setTimeout(function () {
            _this.saveUrl(params, cb);
          }, 300 * params.retry);
        } else {
          return cb(new Error(response.error));
        }
      }

      if (params.retry > 0) {
        console.log('completed after '+ params.retry + ' retries');
      }

      cb(null, response);
    });
  });

  req.end();
};

module.exports = Dropbox;
