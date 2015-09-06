var express = require('express');
var router = express.Router();

module.exports = function (app) {
  app.get('/',
  function (req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/home');
    }
    next();
  },
  function(req, res, next) {
    app.render('index', {}, function (err, content) {
      if (err) console.error(err);
      res.render('layouts/home', {content: content});
    });
  });
};
