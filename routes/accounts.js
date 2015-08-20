var express = require('express');
var router = express.Router();
var passport = require('passport');

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
};

router.get('/signin', function (req, res, next) {
  // todo: redirect to homepage
  res.end();
});

router.post('/signin', passport.authenticate('local', {successRedirect: '/home', failureRedirect: '/'}));

router.get('/signup', function (req, res, next) {
  // todo: redirect to homepage
  res.end();
});

router.post('/signup', function (req, res, next) {
  res.end();
});

router.get('/home', ensureAuthenticated, function (req, res, next) {
  res.render('home');
});

module.exports = router;
