var express = require('express');
var moment = require('moment');

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
    var lastSync = req.user.last_sync ? moment.unix(req.user.last_sync).fromNow() : null;
    var username = req.user.username || req.user.email.substring(0, req.user.email.indexOf('@'));

    console.log(lastSync);
    app.render('home', {
      username: username,
      email: req.user.email,
      linkedIgm: linkedIgm,
      linkedDbx: linkedDbx,
      lastSync: lastSync
    }, function (err, content) {
      if (err) console.error(err);
      res.render('layouts/main', {content: content});
    });
  });
};
