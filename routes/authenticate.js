var express = require('express');
var Instagram = require('../lib/sdk/instagram');
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
    // todo: show error
    res.send('no code found');
  }
});

router.get('/dropbox', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get dropbox access token using req.query.code
  }
  res.end();
});

module.exports = router;
