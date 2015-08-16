var express = require('express');
var router = express.Router();

router.get('/instagram', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get instagram access token using req.query.code
  }
  res.end();
});

router.get('/dropbox', function(req, res, next) {
  if (req.query.hasOwnProperty('code')) {
    // get dropbox access token using req.query.code
  }
  res.end();
});

module.exports = router;
