import React, { Component } from 'react';
import { getToken, isLoggedIn, currentUser, formatDate, userId, createToken } from './services';
import InviteForm from './InviteForm';
import PostForm from './PostForm';
import CommentForm from './CommentForm';
import ChatDisplay from './ChatApp.jsx';

class PostList extends Component {
	state = {
		posts: [],
		groupMembers: [],
		groupName: '',
		chatRoomId:'',
		username: '',
		user_id: '',
		chatReady: false //only render chatapp once a chatkit user has been created
	};

	componentWillMount() {
		if(!isLoggedIn()) {
			this.props.history.replace('/login');
		} else { //check if user has access to the group
			var user_id = userId();
			var token = getToken();
			var that = this;
			fetch('/api/groupAccess/' + user_id + '/' + that.props.match.params.groupId, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token
				}
			})
			.then((response) => {
				if(response.status === 200) {
					return;
				} else {
					that.props.history.replace('/');
				}
			});			
		}
	}

	componentDidMount() {
		if(isLoggedIn()) {
			var username = currentUser();
			var user_id = userId();
			this.setState({  
				username: username,
				user_id: user_id 
			});
			this.loadGroupInfo();
			this.loadGroupMembers();		
			this.forceUpdateInterval = setInterval(this.loadGroupInfo, 5000); //poll the api every 5 seconds			
		}
	}

	componentWillUnmount() {
		clearInterval(this.forceUpdateInterval); //prevent setInterval from continuing to run after dismount
	}

	loadGroupInfo = () => {
		var that = this;
		var token = getToken();
		fetch('/api/group/' + this.props.match.params.groupId, {
			method: 'get',
			headers: {
				'Accept': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		})
		.then(that.checkStatus)
		.then(res => res.json())
		.then(function(group) {
			that.setState({ 
				posts: group.posts,
				groupName: group.name,
				chatRoomId: group.chatRoomId
			});
		});
	};

	loadGroupMembers = () => {
		var that = this;
		var token = getToken();
		fetch('/api/groupMembers/' + this.props.match.params.groupId, {
			method: 'get',
			headers: {
				'Accept': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		})
			.then(that.checkStatus)
			.then(res => res.json())
			.then(function(groupMembers) {
				that.setState({ groupMembers: groupMembers });
			});
	};

	checkStatus = (response) => {
		if (response.status >= 200 && response.status < 300) {
	      return response;
	    } else {
	      throw 'error!!';
	    }
	};	

	newComment = (comment, postId) => {
		var posts = this.state.posts.map((post) => {
			if(post._id === postId) {
				post.comments.push(comment);
				return post;
			} else {
				return post;
			}
		});
		this.setState({ posts: posts }); //faster UI response
	};

	newPost = (post) => {
		var postList = [post, ...this.state.posts];		
		this.setState({ posts: postList });
	};

	deletePost = (postId) => {
		var posts = this.state.posts.filter(post => post._id !== postId);
		if(posts) { //if for some weird reason the post doesn't exist
			this.setState({ posts: posts });
		}

		var jwt = createToken();
		var token = getToken();
		var that = this;
		fetch('/api/post/' + postId + '/' + that.props.match.params.groupId + '/' + jwt, {
			method: 'delete',
			headers: {
				'Accept': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		});
	}

	deleteComment = (postId, commentId) => {
		var modifiedPost = this.state.posts.find((post) => post._id === postId);
		if(modifiedPost) { //if for some weird reason the post doesn't exist
			var comments = modifiedPost.comments.filter(comment => comment._id !== commentId);
			modifiedPost.comments = comments; 
			var posts = this.state.posts.map((post) => {
				if(post._id === postId) {
					return modifiedPost;
				} else {
					return post;
				}
			});
			this.setState({ posts: posts });
		}

		var token = getToken();
		var that = this;
		fetch('/api/comment/' + commentId + '/' + postId + '/' + that.props.match.params.groupId, {
			method: 'delete',
			headers: {
				'Accept': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		});
	}

	render() {
		//note that username refers to the user currently logged in, not necessarily the author of the post
		var posts = this.state.posts.map((post, i) => {
			return(
				<PostCommentContainer
					key={i}
					post={post}
					username={this.state.username} 
					user_id={this.state.user_id}
					newComment={this.newComment}
					groupId={this.props.match.params.groupId}
					deletePost={this.deletePost}
					deleteComment={this.deleteComment}					
				/>
			);
		});

		var members = this.state.groupMembers.map((member, i) => {
			return(<a className="dropdown-item" key={i}>{member.username}</a>);   
		});		

		var chatDisplay;
		if(this.state.username && this.state.user_id && this.state.chatRoomId){ //make sure neccesary info is loaded before rendering ChatDisplay
			chatDisplay = <ChatDisplay username={this.state.username} userId={this.state.user_id} roomId={this.state.chatRoomId} />;
		}

		return(
			<div className="row no-gutters">
				<div className="col-sm-3">
					{chatDisplay}
				</div>

				<div className="flex-column col-sm-6">					
					<PostForm
						newPost={this.newPost}
						username={this.state.username}
						user_id={this.state.user_id}
						groupId={this.props.match.params.groupId}
					/>				
					{posts}
				</div>

				<div className="flex-column col-sm-3">
					<div className="box" id="groupName">					
						<h2>{this.state.groupName}</h2>
						<a id="members" className="nav-link dropdown-toggle" href="javascript:void(0)" id="navbarDropdownBody" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                   			Members
               			</a>
				        <div className="dropdown-menu" aria-labelledby="navbarDropdown">
				          {members}
				        </div>	
				        <InviteForm
				        	groupId={this.props.match.params.groupId}
				        	groupName={this.state.groupName}
				        />	
					</div>								
				</div>
			</div>			
		);
	}
} 


class PostCommentContainer extends Component {
	render() {
		var timestamp = formatDate(this.props.post.timestamp);
		return(
			<div>
				<Post
					authorName={this.props.post.authorName}
					username={this.props.username} //refers to the current user
					user_id={this.props.user_id}
					text={this.props.post.text}
					timestamp={timestamp}
					url={this.props.post.avatarUrl}
					postId={this.props.post._id}
					deletePost={this.props.deletePost}
				>
					<CommentList						
						comments={this.props.post.comments}
						username={this.props.username} //refers to the current user
						user_id={this.props.user_id}
						postId={this.props.post._id}
						newComment={this.props.newComment}
						groupId={this.props.groupId}
						deleteComment={this.props.deleteComment}
					/>
				</Post>
			</div>
		);
	}
}


class Post extends React.Component {
	deletePost = () => {		
		this.props.deletePost(this.props.postId);
	};

	render() {
		if(this.props.authorName === this.props.username) { //if this is the current user's post
			var options = <td id="delete">									
								<a id="delete" href="javascript:void(0)" onClick={this.deletePost}>Delete Post</a>
							</td>;
		}

		var commentList = React.Children.toArray(this.props.children)[0]; //convert into usable format
		return(
			<div className="row d-flex justify-content-center">
				<div className="col-sm-12">
					<div className="box" id="boxPost">
						<table>
							<tbody>
							<tr>
								<td className='pTableCell1'><img src={this.props.url} /></td>
								<td className='pTableCell2' id="postInfo">
									<div id="author">{this.props.authorName}</div>									
									{this.props.timestamp}
								</td>
								{options}								
							</tr>							
							</tbody>
						</table>											
						<p id="postText">{this.props.text}</p>
						{commentList}
					</div>					
				</div>
			</div>			
		);
	}
}

class CommentList extends React.Component {
	render() {
		var comments;
		if(this.props.comments) {
			comments = this.props.comments.map((comment, i) => {
				return(
					<Comment
						key={i}
						authorName={comment.authorName}
						username={this.props.username}
						text={comment.text}
						timestamp={comment.timestamp}
						url={comment.avatarUrl}
						postId={this.props.postId}
						commentId={comment._id}
						deleteComment={this.props.deleteComment}
					/>
				);
			});
		} else {
			comments = null;
		}	

		return(
			<div>
				{comments}
				<CommentForm
					username={this.props.username}
					newComment={this.props.newComment}
					postId={this.props.postId}
					groupId={this.props.groupId}
				/>
			</div>
		);
	}
}

class Comment extends React.Component {

	deleteComment = () => {
		this.props.deleteComment(this.props.postId, this.props.commentId);
	};

	render() {
		if(this.props.authorName === this.props.username) {
			var options = <td id="delete">									
								<a id="delete" href="javascript:void(0)" onClick={this.deleteComment}>Delete Comment</a>
							</td>;
		}

		var timestamp = formatDate(this.props.timestamp);
		return(
			<div className="row d-flex justify-content-center mr-2 ml-2">
				<div className="col-sm-12">
					<div className="box" id="commentBox">
						<table>
							<tbody>
							<tr>
								<td className="cTableCell1"><img id='commentImg' src={this.props.url} /></td>
								<td className="cTableCell2" id="commentInfo">
									<div id="author">{this.props.authorName}</div>
									{timestamp}
								</td>
								{options}								
							</tr>
							</tbody>
						</table>					
						<p id="commentText">{this.props.text}</p>
					</div>					
				</div>
			</div>
		);
	}
}

export default PostList; 
