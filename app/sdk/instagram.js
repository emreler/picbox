var querystring = require('querystring');
var https = require('https');
var Q = require('q');
var debug = require('debug')('instagram');
var request = require('request');

var Instagram = function (config) {
  this.clientID = config.client_id;
  this.clientSecret = config.client_secret;
  this.redirectUri = config.redirect_uri;
  this.apiHost = 'api.instagram.com';
};

Instagram.prototype.getAuthUrl = function () {
  return 'https://api.instagram.com/oauth/authorize/?client_id=' + this.clientID + '&redirect_uri=' + this.redirectUri + '&response_type=code';
};

Instagram.prototype.getLikes = function (accessToken, cb) {

};

Instagram.prototype.getLikesP = function (accessToken) {
  var deferred = Q.defer();

  var queryParams = querystring.stringify({
    'access_token': accessToken,
    count: 20
  });

  var options = {
    url: 'https://api.instagram.com/v1/users/self/media/liked?' + queryParams,
    method: 'GET',
    json: true,
    timeout: 50000
  };

  request(options, function (err, res, body) {
    /*
    Sample response:
    {"pagination":{"next_url":"https:\/\/api.instagram.com\/v1\/users\/self\/media\/liked?access_token=foo\u0026count=1\u0026max_like_id=1057321178928673247","next_max_like_id":"1057321178928673247"},"meta":{"code":200},"data":[{"attribution":null,"tags":["3door","classic"],"type":"image","location":null,"comments":{},"filter":"Normal","created_time":"1440262528","link":"https:\/\/instagram.com\/p\/6sXAKjinHf\/","likes":{},"images":{"low_resolution":{"url":"https:\/\/...","width":320,"height":320},"thumbnail":{"url":"https:\/\/...","width":150,"height":150},"standard_resolution":{"url":"https:\/\/...","width":640,"height":640}},"users_in_photo":[],"caption":{"created_time":"1440262528","text":"some text","from":{"username":"american_automobiles","profile_picture":"https:\/\/...","id":"1042330667","full_name":"name"},"id":"1057321182317671120"},"user_has_liked":true,"id":"1057321178928673247_1042330667","user":{"username":"american_automobiles","profile_picture":"https:\/\/...","id":"1042330667","full_name":""}}]}
    */

    if (err) {
      throw err;
    }

    if (res.statusCode != 200) {
      if (body.hasOwnProperty('meta') && body.meta.hasOwnProperty('error_message')) {
        if (body.meta.error_message.indexOf('The access_token provided is invalid') >= 0) {
          deferred.reject({removeIgmCredentials: true, message: body.meta.error_message});
        } else {
          deferred.reject(new Error(body.meta.error_message));
        }
      }
      deferred.reject(body);
    }
    deferred.resolve(body.data);
  });

  return deferred.promise;
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
    host: this.apiHost,
    path: '/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var _this = this;
  var req = https.request(options, function (res) {
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

      cb(null, response.access_token, response.user);
    });
  });

  req.write(postData);
  req.end();

};

module.exports = Instagram;
