var express = require('express');
var Instagram = require('../app/sdk/instagram');
var Dropbox = require('../app/sdk/dropbox');
var Storage = require('../app/storage');
var config = require('../config');

var router = express.Router();
var storage = new Storage(config.mysql);
var instagram = new Instagram(config.instagram);
var dropbox = new Dropbox(config.dropbox);

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
};

router.get('/instagram', ensureAuthenticated, function (req, res, next) {
  res.redirect(instagram.getAuthUrl());
});

router.get('/dropbox', ensureAuthenticated, function (req, res, next) {
  res.redirect(dropbox.getAuthUrl());
});

router.get('/instagram/callback', ensureAuthenticated, function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    instagram.getAccessToken(req.query.code, function (err, accessToken, user) {
      if (err || !accessToken || !user) {
        return res.send(err.message);
      }
      storage.saveInstagramInfo(req.user.email, {accessToken: accessToken, userID: user.id}, function (updated) {
        return res.redirect('/home?auth=instagram');
      });
    });
  } else {
    return next(new Error('No code found'));
  }
});

router.get('/dropbox/callback', ensureAuthenticated, function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    dropbox.getAccessToken(req.query.code, function (err, accessToken, userID) {
      if (err) {
        res.send(err.message);
        return;
      }
      storage.saveDropboxInfo(req.user.email, {accessToken: accessToken, userID: userID}, function (updated) {
        return res.redirect('/home?auth=dropbox');
      });
    });
  } else {
  next(new Error('No code found'));
  }
});

module.exports = router;
