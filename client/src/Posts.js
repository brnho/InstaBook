import React, { Component } from 'react';
import { BrowserRouter as Redirect } from "react-router-dom";
import { getToken, isLoggedIn, currentUser, formatDate } from './services';

class PostList extends Component {
	state = {
		posts: [],
		username: ''
	};

	componentWillMount() {
		if(isLoggedIn()) {
			var username = currentUser();
			this.setState({ username: username });
			this.loadPostsFromApi();
		} else {
			this.props.history.replace('/login');
		}
	}

	componentDidMount() {
		if(isLoggedIn()) {			
			this.forceUpdateInterval = setInterval(this.loadPostsFromApi, 5000); //poll the api every 5 seconds
		}
	}

	componentWillUnmount() {
		clearInterval(this.forceUpdateInterval); //prevent setInterval from continuing to run after dismount
	}

	loadPostsFromApi = () => {
		var that = this;
		var token = getToken(); //JWT is set as an HTTP header called Authorization
		fetch('/api/post/' + that.props.match.params.groupId, {
			method: 'get',
			headers: {
        		'Accept': 'application/json',
        		'Authorization': 'Bearer ' + token 
      		}
		}).then(that.checkStatus)
		  .then(res => res.json())
		  .then(function(posts) {		  	
		  	that.setState({ posts: posts });
		  });
	};

	checkStatus = (response) => {
		if (response.status >= 200 && response.status < 300) {
	      return response;
	    } else {
	      console.log('help an error'); //change this
	      //need to throw some error
	    }
	};	

	updateComment = (comment, postId) => {
		var posts = this.state.posts.map((post) => {
			if(post._id === postId) {
				post.comments.push(comment);
				return post;
			} else {
				return post;
			}
		});

		this.setState({ posts: posts }); //double insurance, and create faster UI response
	};

	updatePost = (post) => {
		console.log(post.authorName);
		var postList = [...this.state.posts, post];		
		this.setState({ posts: postList });
	};

	render() {
		//note that username refers to the user currently logged in, not necessarily the author of the post
		var posts = this.state.posts.map((post, i) => {
			return(
				<PostCommentContainer
					key={i}
					post={post}
					username={this.state.username} 
					updateComment={this.updateComment}
					groupId={this.props.match.params.groupId}					
				/>
			);
		});

		return(
			<div>
				<h2>{this.props.match.params.groupName}</h2>
				<PostFormComponent
					updatePost={this.updatePost}
					username={this.state.username}
					groupId={this.props.match.params.groupId}
				/>
				{posts}
			</div>
		);
	}
} 

//

class PostCommentContainer extends Component {
	render() {
		var timestamp = formatDate(this.props.post.timestamp);
		return(
			<div>
				<PostComponent
					authorName={this.props.post.authorName}
					text={this.props.post.text}
					timestamp={timestamp}
				>
					<CommentList						
						comments={this.props.post.comments}
						username={this.props.username} //refers to the current user
						postId={this.props.post._id}
						updateComment={this.props.updateComment}
						groupId={this.props.groupId}
					/>
				</PostComponent>
			</div>
		);
	}
}

//

class PostComponent extends React.Component {
	render() {
		var commentList = React.Children.toArray(this.props.children)[0]; //convert into usable format
		return(
			<div className="row">
				<div className="col-sm-8">
					<ul className="list-group">
						<li className="list-group-item">
							<p>{this.props.authorName}&nbsp;{this.props.timestamp}</p>
							<p>{this.props.text}</p>
							{commentList}
						</li>					
					</ul>
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
					<CommentComponent
						key={i}
						authorName={comment.authorName}
						text={comment.text}
						timestamp={comment.timestamp}
					/>
				);
			});
		} else {
			comments = null;
		}	

		return(
			<div>
				{comments}
				<CommentFormComponent
					username={this.props.username}
					updateComment={this.props.updateComment}
					postId={this.props.postId}
					groupId={this.props.groupId}
				/>
			</div>
		);
	}
}

//

class CommentComponent extends React.Component {
	render() {
		var timestamp = formatDate(this.props.timestamp);
		return(
			<div className="row">
				<div className="col-sm-8">
					<ul className="list-group">
						<li className="list-group-item">
							<p>{this.props.authorName}&nbsp;{timestamp}</p>
							<p>{this.props.text}</p>
						</li>
					</ul>
				</div>
			</div>
		);
	}
}

class CommentFormComponent extends Component {
	state = {
		comment: '',
		errors: {
			comment: false
		},
		disabled: false		
	};

	handleChange = (event) => {
		this.setState({
			comment: event.target.value
		});
	};
	
	validateInput = (comment) => {
		var errors = {};
		if(!comment) {
			errors.comment = 'Text required';
		}
		return errors;
	};	

	handleSubmit = (event) => {
		event.preventDefault();		
		//perform validation
		var errors = this.validateInput(this.state.comment);
		this.setState({ errors: errors });
		if(Object.keys(errors).length !== 0) 
			return;		
		
		this.setState({ disabled: true }); //prevent submits while server is processing

		var apiData = {
			comment: this.state.comment,
			postId: this.props.postId,
			username: this.props.username
		};
		
		
		var that = this;
		var token = getToken();		
		fetch('/api/comment/' + this.props.groupId, { //update the server
			method: 'post',
			body: JSON.stringify(apiData),
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then(that.checkStatus)
	      .then(response => response.json())
		  .then(function(comment) {		  	
			that.props.updateComment(comment, that.props.postId);
		  	that.setState({
		  		comment: '',
		  		disabled: false
		  	});
		  }); 
	};

	render() {		
		return(
			<div className="row">
				<div className="col-sm-8">
					<ul className="list-group">
						<li className="list-group-item">
							<form onSubmit={this.handleSubmit}>					
								<input name='comment' value={this.state.comment} placeholder='Write a comment' onChange={this.handleChange} />
								<span style={{ color: 'red' }}>&nbsp;{this.state.errors.comment}</span>
								<br/><br/>								
								<input type='submit' value='Submit' disabled={this.state.disabled} />
							</form>							
						</li>
					</ul>
				</div>
			</div>	
		);
	}
}
//

class PostFormComponent extends Component {
	state = {
		post: '',
		errors: {
			post: false
		},
		disabled: false		
	};

	handleChange = (event) => {
		this.setState({
			post: event.target.value
		});
	};
	
	validateInput = (post) => {
		var errors = {};
		if(!post) {
			errors.post = 'Text required';
		}
		return errors;
	};	

	handleSubmit = (event) => {
		event.preventDefault();		
		//perform validation
		var errors = this.validateInput(this.state.post);
		this.setState({ errors: errors });
		if(Object.keys(errors).length !== 0) 
			return;		
		
		this.setState({ disabled: true }); //prevent submits while server is processing

		var apiData = {
			post: this.state.post,
			username: this.props.username
		};		
		
		var that = this;
		var token = getToken();
		fetch('/api/post/' + that.props.groupId, { //update the server
			method: 'post',
			body: JSON.stringify(apiData),
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then(that.checkStatus)
		  .then(response => response.json()) //must send response.json through then(), just calling response.json within a cb will only return a promise
		  .then(function(post) {		  	
		  	console.log(post);		  	
			that.props.updatePost(post) //duplicate post for faster display time
		  	that.setState({
		  		post: '',
		  		disabled: false
		  	});
		  }); 
	};

	render() {		
		return(
			<div className="row">
				<div className="col-sm-8">
					<ul className="list-group">
						<li className="list-group-item">
							<form onSubmit={this.handleSubmit}>					
								<input name='post' value={this.state.post} placeholder='Write a post' onChange={this.handleChange} />
								<span style={{ color: 'red' }}>&nbsp;{this.state.errors.post}</span>
								<br/><br/>								
								<input type='submit' value='Submit' disabled={this.state.disabled} />
							</form>							
						</li>
					</ul>
				</div>
			</div>	
		);
	}
}

export default PostList; 
