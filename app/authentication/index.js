var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var config = require('../../config');
var Storage = require('../storage');

module.exports = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      var storage = new Storage(config.mysql, config.redis);
      storage.getUser(email, password, function (err, user) {
        if (err) {
          var msg;
          if (err.not_exists || err.incorrect_password) {
            msg = 'Invalid email address or password';
          } else {
            msg = 'Unknown error occured';
            console.error(err);
          }
          return done(null, false, msg);
        }

        return done(null, user);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    var storage = new Storage(config.mysql, config.redis);
    storage.getUser(id, function (err, user) {
      if (err) return done(err);
      return done(null, user);
    });
  });

};
