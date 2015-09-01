var express = require('express');
var passport = require('passport');
var validator = require('validator');

var Instagram = require('../app/sdk/instagram');
var Dropbox = require('../app/sdk/dropbox');
var Storage = require('../app/storage');
var config = require('../config');

var router = express.Router();
var storage = new Storage(config.mysql, config.redis);
var instagram = new Instagram(config.instagram);
var dropbox = new Dropbox(config.dropbox);

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
};

router.get('/login', function (req, res, next) {
  // todo: show login page
  res.end();
});

router.post('/login', passport.authenticate('local', {successRedirect: '/home', failureRedirect: '/'}));

router.get('/join', function (req, res, next) {
  // todo: show signup page
  res.end();
});

router.post('/join', function (req, res, next) {
  if (req.body.hasOwnProperty('email') && req.body.hasOwnProperty('password')) {
    if (validator.isEmail(req.body.email)) {
      storage.createUser(req.body.email, req.body.password)
      .then(function (userID) {
        req.login({id: userID}, function (err) {
          if (err) console.log(err);
          return res.redirect('/home');
        });
      })
      .catch(function (err) {
        if (err.hasOwnProperty('email_exists')) {

        }
        res.end();
      });
    }
  }
});

router.get('/logout', ensureAuthenticated, function (req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/authenticate/instagram', ensureAuthenticated, function (req, res, next) {
  res.redirect(instagram.getAuthUrl());
});

router.get('/authenticate/dropbox', ensureAuthenticated, function (req, res, next) {
  res.redirect(dropbox.getAuthUrl());
});

router.get('/authenticate/instagram/callback', ensureAuthenticated, function (req, res, next) {
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

router.get('/authenticate/dropbox/callback', ensureAuthenticated, function (req, res, next) {
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

router.get('/unlink/instagram', ensureAuthenticated, function (req, res, next) {
  storage.removeInstagramInfo(req.user.email)
  .then(function () {
    res.redirect('/home');
  })
  .catch(function (err) {
    console.error(err);
    res.redirect('/home');
  });
});

router.get('/unlink/dropbox', ensureAuthenticated, function (req, res, next) {
  storage.removeDropboxInfo(req.user.email)
  .then(function () {
    res.redirect('/home');
  })
  .catch(function (err) {
    console.error(err);
    res.redirect('/home');
  });
});

module.exports = router;
