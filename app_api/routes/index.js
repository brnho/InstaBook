var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Post = mongoose.model('Post');
var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({
	secret: process.env.JWT_SECRET,
	userProperty: 'payload' //define property on req to be payload
});

//create a new user
router.post('/user', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		res.status(404).json({"message": "username and password required"});
		return;
	}

	User.findOne({ username: req.body.username}, function(err, user) {
		if(err) {			
			res.status(400).json(err);
			console.log(err);
			return;
		} else if(user) { //duplicate username
			res.status(409).json({"message": "username taken"});
			return;
		} else { //success
			User.create({
				username: req.body.username,
				password: req.body.password
			}, function(err, user) {
				if(err) {
					console.log(err);
					res.status(400).json(err);
				} else {
					var jwt = user.generateJwt();
					res.status(201).json(jwt); //return a jwt					
				}
			});
		}		
	});
});

//if authentication fails, a 401 unauthorized status response will be sent.
//if authentication succeeds, the next middleware function will be called, and req.user will be populated
router.post('/login', function(req, res,) {
	if(!req.body.username || !req.body.password) { //extra layer of validation
		res.status(400).json();
		return;
	}
	passport.authenticate('login', function(err, user, info) {
		if(err) {
			res.status(404).json(err);
			console.log(err);
			return;
		}
		if(user) {
			var token = user.generateJwt();
			res.status(200).json(token); //return a jwt
		} else {
			res.status(401).json(info);
		}
	})(req, res); //note how authenticate is being called from within the cb so it has access to req and res
});


router.post('/comment', auth, function(req, res, next) {
	if(!req.body.comment || !req.body.postId || !req.body.username) {
		res.status(404).json();
		return;
	} 

	Post 									//Welcome to callback hell
		.findById(req.body.postId)
		.select('comments')
		.exec(function(err, post) {
			if(err) {
				console.log(err);
				res.status(400).json(err);
			} else if(!post) {
				res.status(400).json({"message": "post not found"});
			} else {
				Comment.create({ //if we found a post, create a comment
					authorName: req.body.username,
					text: req.body.comment
				}, function(err, comment) {
					if(err) {
						res.status(400).json(err);
					} else {
						post.comments.push(comment); //save the comment to its parent post
						post.save(function(err, post) {
							if(err) {
								res.status(400).json();
							} else {
								res.status(201).json(comment); //send back the comment
							}
						});
					}
				});				
			}		
		});
});

router.get('/authenticated', function(req, res, next) {
	if(req.user) {
		var username = req.user.username;
		res.status(200).json({
			"authenticated": true,
			"username": username 
		});
	} else {
		res.status(200).json({
			"authenticated": false
		});
	}
});

router.get('/post', auth, function(req, res, next) {	
	Post.find().exec(function(err, posts) {
		if(err) {	
			console.log('heree');
			console.log(err);		
			res.status(400).json();
			return;
		} 
		res.status(200).json(posts);
	});
});

router.post('/post', auth, function(req, res, next) {
	if(!req.body.post || !req.body.username) {
		res.status(404).json();
		return;
	}
	console.log(req.body.post);

	var username = req.body.username;	
	Post.create({
		authorName: username,
		text: req.body.post
	}, function(err, post) {
		if(err) {
			console.log('over here'); //UNRESOLVED ERROR HERE
			console.log(err);
			res.status(400).json(err);					
			return;
		} else {
			res.status(201).json(post);
		}
	});
});

//Note: find returns an array of documents! Not a single document!
module.exports = router;