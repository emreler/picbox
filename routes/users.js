var express = require('express');
var router = express.Router();

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
};

router.get('/home', ensureAuthenticated, function (req, res, next) {
  res.render('home');
});

module.exports = router;
