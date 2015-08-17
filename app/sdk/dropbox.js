var querystring = require('querystring');
var https = require('https');

var Dropbox = function (config) {
  this.clientID = config.client_id;
  this.clientSecret = config.client_secret;
  this.redirectUri = config.redirect_uri;
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

      cb(null);
    });
  });

  req.write(postData);
  req.end();

};

module.exports = Dropbox;
