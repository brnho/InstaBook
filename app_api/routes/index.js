var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var passport = require('passport');
var jwt = require('express-jwt');
var jsonwebtoken = require('jsonwebtoken');
var md5 = require('js-md5');
var crypto = require('crypto');
var Chatkit = require('@pusher/chatkit-server');


var instanceLocator = 'v1:us1:d240e83d-f99c-44d7-ae6f-08b42180a620';
var secretKey = '51bc1c41-7359-40d2-8201-4273cbeea2f5:nbz0z+rUAYCn0cS4B2BpwVs/dqqu2rpCU/0/DRlUQFM=';
var chatkit = new Chatkit.default({
		instanceLocator: instanceLocator,
		key: secretKey
	});

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
	if(!req.body.username || !req.body.password || !req.body.email) {
		return handleErr(res, 404, {"message": "missing fields"});		
	}	

	User.findOne({ email: req.body.email}, function(err, user) {
		if(err)	return handleErr(res, 400, err);
		if(user) return handleErr(res, 409, {"message": "duplicate email"});

		User.findOne({ email: req.body.username}, function(err, user) {
			if(err) return handleErr(res, 400, err);
			if(user) res.status(410).json({"message": "duplicate username"});

			User.create({
				email: req.body.email,
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
		});		
	});
});

//if authentication fails, a 401 unauthorized status response will be sent.
//if authentication succeeds, the next middleware function will be called, and req.user will be populated
router.post('/login', function(req, res,) {
	if(!req.body.username || !req.body.password) { //extra layer of validation
		return handleErr(res, 404, {"message": "username and password required"});
	}
	passport.authenticate('login', {session: false}, function(err, user, info) {
		if(err) {
			return handleErr(res, 400, err);
		}
		if(user) {
			var token = user.generateJwt();
			res.status(200).json(token); 
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
			if(err) return handleErr(res, 400, err);
			
			var post = group.posts.id(req.body.postId); //cool method			
			var url = avatar(req.body.username, 20);
			post.comments.push({
				authorName: req.body.username,
				text: req.body.comment,
				avatarUrl: url
			});

			post.save(function(err) {
				if(err) return handleErr(res, 400, err);
				group.save(function(err) {
					if(err) return handleErr(res, 400, err);
					res.status(201).json(post.comments[post.comments.length-1]); //possible source of error, like below?
				});
			});			
		});	
});


//Create new post
router.post('/post/:groupId', auth, function(req, res, next) {
	if(!req.body.username || !req.body.user_id) { //missing poll/post and multiVote...
		return handleErr(res, 404, {"message": "missing information"});
	}
	Group
		.findById(req.params.groupId)
		.exec(function(err, group) {
			if(err) {
				return handleErr(res, 400, err);
			}
			var url = avatar(req.body.username, 30);
			if(req.body.post) { //text post
				group.posts.unshift({
					authorName: req.body.username,
					authorId: req.body.user_id,
					text: req.body.post,
					avatarUrl: url
				});
			} else if(req.body.pollOptions) { //poll post
				var voteArrays = []; var i;
				for(i = 0; i < req.body.pollOptions.length; i++)
					voteArrays.push([]);
				group.posts.unshift({
					authorName: req.body.username,
					authorId: req.body.user_id,
					pollOptions: req.body.pollOptions,
					votesPerOption: voteArrays,
					avatarUrl: url,
					multiVote: req.body.multiVote
				});
			} else { //empty submission...
				return handleErr(res, 404, {"message": "insufficient information"});
			}
			group.save(function(err, group) {
				if(err) return handleErr(res, 400, err);
				res.status(201).json(group.posts[0]); //what if another thread saved another post earlier, so the wrong post is returned??
			});			
		});
});

//Create a group
router.post('/group', auth, function(req, res, next) {
	if(!req.body.groupName || !req.body.username) {
		return handleErr(res, 404, {"message": "missing information"});
	}

	//Note: find returns an array of documents! Not a single document!
	Group.findOne({ name: req.body.groupName }, function(err, group) {
		if(err) return handleErr(res, 400, err);
		if(group) {
			res.status(409).json(); //group with that name already exists
			return;
		} else {
			User.findOne({ username: req.body.username }, function(err, user) {
				if(err) {
					return handleErr(res, 400, err);
				} else if (!user) {
					return handleErr(res, 404, {"message": "user not found"});
				}		
				Group.create({
					name: req.body.groupName,
				}, function(err, group) {
					if(err) {
						return handleErr(res, 400, err);
					}
					user.groups.push(group._id); //add the group to the user
					user.save(function(err) {
						if(err) 
							return handleErr(res, 400, err);
						chatkit.createRoom({ //create a chat room
						  creatorId: user._id,
						  name: group.name,
						})
						.then((room) => {
							group.chatRoomId = room.id; //add the chat room id to the group
							group.members.push(user._id); //add the user to the group
							group.save(function(err) {
								res.status(201).json(group);	
							});							 
						})
						.catch((err) => {
						    console.log(err);
						});							
					});	
				});
			});
		}
	});
});

//get list of group names (to display in dropdown)
router.get('/groups', auth, function(req, res, next) {
	Group.find().select('_id name').exec(function(err, groups) { //only return the group id and name
		if(err) {
			return handleErr(res, 400, err);
		}
		
		res.status(200).json(groups);
	});
});

//get a group
router.get('/group/:groupId', auth, function(req, res, next) {
	Group.findById(req.params.groupId).populate('members', 'username').exec(function(err, group) {
		if(err) return handleErr(res, 400, err);
		res.status(200).json(group);
	});
});

//delete a post
router.delete('/post/:postId/:groupId/:token', auth, function(req, res, next) {
	//authorization 
	jsonwebtoken.verify(req.params.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) return handleErr(res, 403, err);//return handleErr(res, 403, {"message": "insufficient permissions (token error)"});
		/*
		var decipher = crypto.createDecipher('aes-256-ctr', process.env.JWT_SECRET);
		var dec = decipher.update(userId, 'hex', 'utf8');
		dec += decipher.final('utf8'); //decrypt the jwt payload
`		*/
		var userId = decoded.userId;
		Group.findById(req.params.groupId).exec(function(err, group) {
			if(err) return handleErr(res, 400, err);
			if(!group) return handleErr(res, 404, {"message": "group not found"});
	
			if(group.posts.id(req.params.postId)) {	//protect against that weird 404 error...?? Will need further validation safeguards	
				var authorId = group.posts.id(req.params.postId).authorId.toString();
				if(authorId !== userId) //user id and post id don't match
					return handleErr(res, 403, {"message": "insufficient permissions (id error)"});				
				group.posts.id(req.params.postId).remove(); 
				group.save(function(err, group) {
					if(err) return handleErr(res, 400, err);
					res.status(202).json(); 
				})			
			} else {
				return handleErr(res, 404, {"message": "resource not found"});
			}		
		});
	});
});

//delete a comment
router.delete('/comment/:commentId/:postId/:groupId', auth, function(req, res, next) {
	Group
		.findById(req.params.groupId)
		.exec(function(err, group) {
			if(err)	return handleErr(res, 400, err);			
			
			if(group.posts.id(req.params.postId)) { //can we find the post
				var post = group.posts.id(req.params.postId); //obtain the post

				if(post.comments.id(req.params.commentId)){ //can we find the comment
					post.comments.id(req.params.commentId).remove(); //remove the comment
					post.save(function(err) {
						if(err) return handleErr(res, 400, err);
						group.save(function(err) {
							if(err) return handleErr(res, 400, err);
							res.status(202).json(); //success
						});
					});					
				} else {
					return handleErr(res, 404, {"message": "resource not found"});
				}
			} else {
				return handleErr(res, 404, {"message": "resource not found"});
			}	
		});
});

//add user to a group and vice versa and add user to group chat room
router.post('/joinGroup', auth, function(req, res, next) {
	if(!req.body.groupId || !req.body.userId) 
		return handleErr(res, 404, {"message": "missing info"});
	Group.findById(req.body.groupId, function(err, group) {
		if(err) 
			return handleErr(res, 404, err); //if the group couldnt be found		
		User.findById(req.body.userId, function(err, user) {
			if(err) 
				return handleErr(res, 400, err);
			var found = group.members.find((member) => member.equals(user._id)); //.equals method for comparing object IDs!!
			if(found) { //the user is already part of the group!
				res.status(200).json({ chatRoomId: group.chatRoomId });
				return;
			}
			group.members.push(user._id); //add the user to the group
			group.save(function(err) {
				if(err) return handleErr(res, 400, err);
				user.groups.push(group._id); //add the group to the user
				user.save(function(err) {
					if(err) return handleErr(res, 400, err);
					res.status(200).json({ chatRoomId: group.chatRoomId }); //success
				});
			});				
		});
	});
});

//check whether a user has access to a group
router.get('/groupAccess/:userId/:groupId', auth, function(req, res, next) {
	Group.findById(req.params.groupId, function(err, group) {
		if(err) return handleErr(res, 403, err); //403 because we still want to prevent user from accessing
		var i;
		for(i = 0; i < group.members.length; i++) {
			if(group.members[i].toString() === req.params.userId) 
				return (res.status(200).json());
		}
		res.status(403).json();
	});
});

//vote for a poll option
router.post('/vote/:postId/:groupId', auth, function(req, res, next) { //index, userId, isChecked in req.body
	Group.findById(req.params.groupId, function(err, group) {
		if(err)
			return handleErr(res, 400, err);
		if(!group) 
			return handleErr(res, 404, {"message": "group not found"});
		var post = group.posts.id(req.params.postId);
		if(!post)
			return handleErr(res, 404, {"message": "post not found"});
		if(req.body.isChecked) { //vote for an option
			if(!post.multiVote) {
				var i, j;
				loop:
				for(i = 0; i < post.votesPerOption.length; i++) {
					for(j = 0; j < post.votesPerOption[i].length; j++) {
						console.log(post.votesPerOption[i][j]);
						if(post.votesPerOption[i][j] === req.body.userId) {							
							post.votesPerOption[i].splice(j, 1); //remove one element at index j
							break loop; //users vote should be in there at most once
						}
					}
				}
			}
			post.votesPerOption[req.body.index].push(req.body.userId);
			post.markModified('votesPerOption');
		} else { //remove the user's vote
			var voteList = post.votesPerOption[req.body.index].filter((vote) => vote !== req.body.userId);
			post.votesPerOption[req.body.index] = voteList;
			post.markModified('votesPerOption'); //interesting...required for mix schema types
		}
		group.save(function(err) {
			if(err)
				return handleErr(res, 400, err);
			res.status(201).json();
		});
	});
});

//verify jwt and return decoded group name and group id
router.get('/verifyToken/:token', auth, function(req, res, next) {
	jsonwebtoken.verify(req.params.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			return handleErr(res, 403, err); //invalid jwt
		}
		res.status(200).json({
			groupId: decoded.groupId,
			groupName: decoded.groupName
		});
	});
});

//create chatkit user
router.post('/chatkitUser', auth, (req, res) => {
	var username = req.body.username;
	var userId = req.body.userId;
	chatkit
		.createUser({
			id: userId,
			name: username
		})
		.then(() => res.sendStatus(201))
		.catch(error => {
			if(error.error_description === 'User with given id already exists') {
				res.sendStatus(200);
			} else {
				console.log(error);
				res.status(error.status).json(error);
			}
		});
});

//get chatkit token
router.post('/chatkitAuth', auth, (req, res) => {
	var authData = chatkit.authenticate({
		userId: req.query.user_id
	});
	res.status(authData.status).send(authData.body); //returns jwt
});

module.exports = router;