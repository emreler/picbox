var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/',
function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/home');
  }
  next();
},
function(req, res, next) {
  res.render('index');
});

module.exports = router;
