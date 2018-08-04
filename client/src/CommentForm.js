import React, { Component } from 'react';
import { getToken } from './services';

class CommentForm extends Component {
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
		}).then(function(response) {
			if(response.status !== 201)
				throw "error";
			return response.json();
		})
		  .then(function(comment) {		  	
			that.props.newComment(comment, that.props.postId);
		  	that.setState({
		  		comment: '',
		  		disabled: false
		  	});
		  }); 
	};

	render() {	
		var errors;	
		if(this.state.errors.comment) {
			errors = <span id="error" style={{ color: 'red' }}>&nbsp;{this.state.errors.comment}</span>;
		} else {
			errors = null;
		}
		return(
			<div className="row d-flex justify-content-center mr-2 ml-2">
				<div className="col-sm-12">
					
						<form onSubmit={this.handleSubmit}>					
							<input name='comment' className='form-control' disabled={this.state.disabled} value={this.state.comment} placeholder='Write a comment' onChange={this.handleChange}/>
							{errors}														
						</form>							
					
				</div>
			</div>	
		);
	}
}

export default CommentForm;