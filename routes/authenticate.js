var express = require('express');
var Instagram = require('../app/sdk/instagram');
var Dropbox = require('../app/sdk/dropbox');
var Storage = require('../app/storage');
var config = require('../config');

var router = express.Router();
var storage = new Storage(config.mysql);

router.get('/instagram', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get instagram access token using req.query.code
    var instagram = new Instagram(config.instagram);
    instagram.getAccessToken(req.query.code, function (err, accessToken, user) {
      if (err || !accessToken || !user) {
        return res.send(err.message);
      }
      storage.saveInstagramInfo(req.user.email, {accessToken: accessToken, userID: user.id}, function (updated) {
        return res.send('saved');
      });
    });
  } else {
    return next(new Error('No code found'));
  }
});

router.get('/dropbox', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get dropbox access token using req.query.code
    var dropbox = new Dropbox(config.dropbox);
    dropbox.getAccessToken(req.query.code, function (err, accessToken, userID) {
      if (err) {
        res.send(err.message);
        return;
      }
      storage.saveDropboxInfo(req.user.email, {accessToken: accessToken, userID: userID}, function (updated) {
        return res.send('saved');
      });
    });
  } else {
  next(new Error('No code found'));
  }
});

module.exports = router;
