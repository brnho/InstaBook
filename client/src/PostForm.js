import React, { Component } from 'react';
import { getToken } from './services';

class PostForm extends Component {
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
			username: this.props.username,
			user_id: this.props.user_id
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
		}).then(function(response) {
			if(response.status !== 201)
				throw "error";
			return response.json(); //note that this only returns a promise, cant access its value directly inside the parent function
		}).then(function(post) {		  			  	
			that.props.newPost(post); //duplicate post for faster display time
		  	that.setState({
		  		post: '',
		  		disabled: false
		  	});
		  }); 
	};

	render() {	
		var errors;	
		if(this.state.errors.post) {
			errors = <span id="error" style={{ color: 'red' }}>&nbsp;{this.state.errors.post}</span>;
		} else {
			errors = null;
		}

		return(
			<div className="row d-flex justify-content-center">
				<div className="col-sm-12">
					<div className="box" id="boxPostForm">
						<form onSubmit={this.handleSubmit}>				
							<textarea className='form-control' value={this.state.post} placeholder='Write a post' onChange={this.handleChange} />								
							<button className="btn btn-primary" type="submit" disabled={this.state.disabled}>Create Post</button>&nbsp;{errors}							
						</form>							
					</div>
				</div>
			</div>	
		);
	}
}

export default PostForm;