var express = require('express');
var Instagram = require('../app/sdk/instagram');
var Dropbox = require('../app/sdk/dropbox');
var config = require('../config');

var router = express.Router();

router.get('/instagram', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get instagram access token using req.query.code
    var instagram = new Instagram(config.instagram);
    instagram.getAccessToken(req.query.code, function (err) {
      if (err) {
        res.send(err.message);
        return;
      }
      res.send('user id: '+instagram.userID+', received access token: '+instagram.accessToken);
      return;
    });
  } else {
    next(new Error('No code found'));
  }
});

router.get('/dropbox', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get dropbox access token using req.query.code
    var dropbox = new Dropbox(config.dropbox);
    dropbox.getAccessToken(req.query.code, function (err) {
      if (err) {
        res.send(err.message);
        return;
      }
      res.send('user id: '+dropbox.userID+', received access token: '+dropbox.accessToken);
      return;
    });
  } else {
  next(new Error('No code found'));
  }
});

module.exports = router;
