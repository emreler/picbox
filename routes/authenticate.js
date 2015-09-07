var express = require('express');
var passport = require('passport');
var validator = require('validator');

var Instagram = require('../app/sdk/instagram');
var Dropbox = require('../app/sdk/dropbox');
var Storage = require('../app/storage');
var config = require('../config');

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

module.exports = function (app) {
  app.get('/login', function (req, res, next) {
    app.render('login', {errorMessage: req.flash('error')[0]}, function (err, content) {
      if (err) console.error(err);
      res.render('layouts/main', {content: content});
    });
  });

  app.post('/login', passport.authenticate('local', {successRedirect: '/home', failureRedirect: '/login', failureFlash: true}));

  app.get('/join', function (req, res, next) {
    app.render('join', {errorMessage: req.flash('error')[0]}, function (err, content) {
      if (err) console.error(err);
      res.render('layouts/main', {content: content});
    });
  });

  app.post('/join', function (req, res, next) {
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
            req.flash('error', 'This email address is already registered');
            res.redirect('/join');
          } else {
            req.flash('error', 'Unknown error occured');
            console.error(err);
            res.redirect('/join');
          }
        });
      } else {
        req.flash('error', 'Invalid email address');
        res.redirect('/join');
      }
    }
  });

  app.get('/logout', ensureAuthenticated, function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/authenticate/instagram', ensureAuthenticated, function (req, res, next) {
    res.redirect(instagram.getAuthUrl());
  });

  app.get('/authenticate/dropbox', ensureAuthenticated, function (req, res, next) {
    res.redirect(dropbox.getAuthUrl());
  });

  app.get('/authenticate/instagram/callback', ensureAuthenticated, function (req, res, next) {
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

  app.get('/authenticate/dropbox/callback', ensureAuthenticated, function (req, res, next) {
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

  app.get('/unlink/instagram', ensureAuthenticated, function (req, res, next) {
    storage.removeInstagramInfo(req.user.email)
    .then(function () {
      res.redirect('/home');
    })
    .catch(function (err) {
      console.error(err);
      res.redirect('/home');
    });
  });

  app.get('/unlink/dropbox', ensureAuthenticated, function (req, res, next) {
    storage.removeDropboxInfo(req.user.email)
    .then(function () {
      res.redirect('/home');
    })
    .catch(function (err) {
      console.error(err);
      res.redirect('/home');
    });
  });
};
