var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function() {
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use("login", new LocalStrategy( //first param is a custom name for the strategy
		function(username, password, done) {
			User.findOne({ username: username }, function(err, user) {
				if(err) {
					return done(err);
				}
				if(!user) {
					return done(null, false, { message: "No user with that username exists"});
				}
				user.checkPassword(password, function(err, match) {
					if(err) return done(err);
					if(match) {
						return done(null, user);
					} else {
						return done(null, false, { message: "Invalid password"});
					}
				});
			});
		}
	));
}


