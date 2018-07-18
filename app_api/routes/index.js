var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({
	secret: process.env.JWT_SECRET,
	userProperty: 'payload' //define property on req to be payload
});

var handleErr = function(res, statusCode, err) {
	console.log(err);
	res.status(statusCode).json(err);
};

//create a new user
router.post('/user', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		return handleErr(res, 404, {"message": "username and password required"});		
	}	

	User.findOne({ username: req.body.username}, function(err, user) {
		if(err) {			
			return handleErr(res, 400, err);
		} else if(user) { //duplicate username
			return handleErr(res, 409, {"message": "duplicate username"});
		} else { //success
			User.create({
				username: req.body.username,
				password: req.body.password
			}, function(err, user) {
				if(err) {
					return handleErr(res, 400, err);
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
		return handleErr(res, 404, {"message": "username and password required"});
	}
	passport.authenticate('login', function(err, user, info) {
		if(err) {
			return handleErr(res, 400, err);
		}
		if(user) {
			var token = user.generateJwt();
			res.status(200).json(token); //return a jwt
		} else {
			res.status(401).json(info);
		}
	})(req, res); //note how authenticate is being called from within the cb so it has access to req and res
});

//Create a new comment
router.post('/comment/:groupId', auth, function(req, res, next) {
	if(!req.body.comment || !req.body.postId || !req.body.username) {
		return handleErr(res, 404, {"message": "missing information"});
	} 

	Group
		.findById(req.params.groupId)
		.exec(function(err, group) {
			if(err) {
				return handleErr(res, 400, err);
			}
			var post = group.posts.id(req.body.postId); //cool method
			Comment.create({
				authorName: req.body.username,
				text: req.body.comment
			}, function(err, comment) {
				if(err) {
					return handleErr(res, 400, err);
				}
				post.comments.push(comment);
				post.save(function(err, post) {
					if(err) {
						return handleErr(res, 400, err);
					}
					group.save(function(err, group) {
						if(err) {
							return handleErr(res, 400, err);
						}
						res.status(201).json(comment);
					})
				});
			});
		});	
});

//Get posts
router.get('/post/:groupId', auth, function(req, res, next) {
	Group 
		.findById(req.params.groupId)
		.exec(function(err, group) {
			if(err) {
				return handleErr(res, 400, err);
			}
			res.status(200).json(group.posts);
		});
});

//Create new post
router.post('/post/:groupId', auth, function(req, res, next) {
	if(!req.body.post || !req.body.username) {
		return handleErr(res, 404, {"message": "missing information"});
	}

	Group
		.findById(req.params.groupId)
		.exec(function(err, group) {
			if(err) {
				return handleErr(res, 400, err);
			}
			Post.create({
				authorName: req.body.username,
				text: req.body.post
			}, function(err, post) {
				if(err) {
					return handleErr(res, 400, err);
				} 
				group.posts.push(post);
				group.save(function(err, group) {
					if(err) {
						return handleErr(res, 400, err);
					}
					res.status(201).json(post);
				});
			});
		});
});

//Create a new group
router.post('/group', auth, function(req, res, next) {
	if(!req.body.groupName || !req.body.username) {
		return handleErr(res, 404, {"message": "group name required"});
	}

	//Note: find returns an array of documents! Not a single document!
	User.findOne({ username: req.body.username }, function(err, user) {
		if(err) {
			return handleErr(res, 400, err);
		} else if (!user) {
			return handleErr(res, 404, {"message": "user not found"});
		}		
		Group.create({
			name: req.body.groupName
		}, function(err, group) {
			if(err) {
				return handleErr(res, 400, err);
			}
			group.members.push(user._id); //add the user to the group
			group.save(function(err) {
				if(err) {
					return handleErr(res, 400, err);
				}
			});			
			user.groups.push(group._id); //add the group to the user
			user.save(function(err) {
				if(err) {
					return handleErr(res, 400, err);
				}
			});
			res.status(201).json();
		});
	});
});

router.get('/group', auth, function(req, res, next) {
	Group.find().select('_id name').exec(function(err, groups) { //only return the group id and name
		if(err) {
			return handleErr(res, 400, err);
		}
		res.status(200).json(groups);
	});
});

module.exports = router;