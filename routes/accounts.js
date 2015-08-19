var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/signin', function (req, res, next) {
  // todo: redirect to homepage
  res.end();
});

router.post('/signin', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}));

router.get('/signup', function (req, res, next) {
  // todo: redirect to homepage
  res.end();
});

router.post('/signup', function (req, res, next) {
  res.end();
});

module.exports = router;
