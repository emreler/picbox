var express = require('express');
var router = express.Router();

var config = require('../config');
var Storage = require('../app/storage');
var storage = new Storage(config.mysql, config.redis);

module.exports = function (app) {
  app.get('/',
  function (req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/home');
    }
    next();
  },
  function(req, res, next) {
    storage.getTotalSavedCount()
    .then(function (totalSavedCount) {
      app.render('index', {totalSavedCount: totalSavedCount}, function (err, content) {
        if (err) console.error(err);
        res.render('layouts/home', {content: content});
      });
    });
  });
};
