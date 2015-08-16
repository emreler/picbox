var querystring = require('querystring');
var https = require('https');

var Instagram = function (config) {
  this.clientID = config.client_id;
  this.clientSecret = config.client_secret;
  this.redirectUri = config.redirect_uri;
};

Instagram.prototype.getAuthUrl = function () {
  return 'https://api.instagram.com/oauth/authorize/?client_id=' + this.clientID + '&redirect_uri=' + this.redirectUri + '&response_type=code';
};

Instagram.prototype.getAccessToken = function (code, cb) {

  var postData = querystring.stringify({
    client_id: this.clientID,
    client_secret: this.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectUri,
    code: code
  });

  var options = {
    host: 'api.instagram.com',
    path: '/oauth/access_token',
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
      {"access_token":"20528320.d636d05.4f31430fefc845de833c11951daab503","user":{"username":"emreler","bio":"","website":"","profile_picture":"https:\/\/igcdn-photos-b-a.akamaihd.net\/hphotos-ak-xpa1\/t51.2885-19\/10354286_709618082428265_934304024_a.jpg","full_name":"Emre Kayan","id":"20528320"}}
      */
      var response = {};
      try {
        response = JSON.parse(responseStr);
      } catch (e) {
        // todo: show error
        return cb(e);
      }

      if (response.hasOwnProperty('error_type')) {
        return cb(new Error(response.error_message));
      }

      _this.accessToken = response.access_token;
      _this.userID = response.user.id;

      cb(null, response.access_token);
    });
  });

  req.write(postData);
  req.end();

};

module.exports = Instagram;
