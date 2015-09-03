var express = require('express');

module.exports = function (app) {
  var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/');
    }
  };

  app.get('/home', ensureAuthenticated, function (req, res, next) {

    var linkedIgm = !!(req.user.instagram_id && req.user.instagram_token);
    var linkedDbx = !!(req.user.dropbox_id && req.user.dropbox_token);


    app.render('home', {
      email: req.user.email,
      linkedIgm: linkedIgm,
      linkedDbx: linkedDbx
    }, function (err, content) {
      res.render('layouts/main', {content: content});
    });
  });
};
