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

  var linkedIgm = !!(req.user.instagram_id && req.user.instagram_token);
  var linkedDbx = !!(req.user.dropbox_id && req.user.dropbox_token);

  res.render('home', {
    email: req.user.email,
    linkedIgm: linkedIgm,
    linkedDbx: linkedDbx
  });
});

module.exports = router;
