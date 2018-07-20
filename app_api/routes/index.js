var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var passport = require('passport');
var jwt = require('express-jwt');
var md5 = require('js-md5');

var auth = jwt({
	secret: process.env.JWT_SECRET,
	userProperty: 'payload' //define property on req to be payload
});

var avatar = (username, size) => {	
	var hash = md5(username);
	return 'https://www.gravatar.com/avatar/' + hash + '?d=retro&s=' + size;
};

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
			var url = avatar(req.body.username, 30);
			Comment.create({
				authorName: req.body.username,
				text: req.body.comment,
				avatarUrl: url
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
			var url = avatar(req.body.username, 36);
			Post.create({
				authorName: req.body.username,
				text: req.body.post,
				avatarUrl: url
			}, function(err, post) {
				if(err) {
					return handleErr(res, 400, err);
				} 
				group.posts.unshift(post); //newest to oldest
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
			res.status(201).json(group);
		});
	});
});

//get list of groups (to display in dropdown)
router.get('/groups', auth, function(req, res, next) {
	Group.find().select('_id name').exec(function(err, groups) { //only return the group id and name
		if(err) {
			return handleErr(res, 400, err);
		}
		res.status(200).json(groups);
	});
});

//get a group
router.get('/groupMembers/:groupId', auth, function(req, res, next) {
	//populate the members ref with users, and only return the username field
	Group.findById(req.params.groupId).populate('members', 'username').exec(function(err, group) {
		if(err) {
			return handleErr(res, 400, err);
		}
		res.status(200).json(group.members);
	});
});

//delete a post
router.delete('/post/:postId/:groupId', auth, function(req, res, next) {
	Group.findById(req.params.groupId, function(err, group) {
		if(err) {
			return handleErr(res, 400, err);
		}
		if(!group) {
			return handleErr(res, 404, err);
		}
		if(group.posts.id(req.params.postId)) {	//protect against that weird 404 error...?? Will need further validation safeguards	
			group.posts.id(req.params.postId).remove(); //do i also need to delete the post itself??
			group.save(function(err, group) {
				if(err) {
					return handleErr(res, 400, err);
				}	
				Post.deleteOne({ _id: req.params.postId }, function(err) { //seems this is neccesary, will also need to do this for comments
					if(err) {
						return handleErr(res, 400, err);
					}
					res.status(202).json();
				});		
			})
		}		
	});
});

module.exports = router;