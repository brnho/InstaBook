import React, { Component } from 'react';
import { isLoggedIn, getToken, currentUser } from './services';

class GroupForm extends Component {
	state = {
		groupName: '',
		errors: {
			groupName: false
		},
		disabled: false,		
	};	

	componentWillMount() {
		if(!isLoggedIn()) {
			this.props.history.replace('/login');
		}
	}

	handleChange = (event) => {
		this.setState({
			groupName: event.target.value
		});
	};	

	validateInput = (groupName) => {
		var errors = {};
		if(!groupName) {
			errors.groupName = 'Name required';
		}		
		return errors;
	};	

	handleSubmit = (event) => {
		event.preventDefault();		
		//perform validation
		var errors = this.validateInput(this.state.groupName);
		this.setState({ errors: errors });
		if(Object.keys(errors).length !== 0) 
			return;		
		
		this.setState({ disabled: true }); //prevent submits while server is processing

		var username = currentUser(); //should this be async???
		if(username) {
			var apiData = {
				groupName: this.state.groupName,
				username: username
			};
		}
		var that = this; //good workaround?
		var token = getToken();
		fetch('/api/group', {
			method: 'post',
			body: JSON.stringify(apiData),
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then(function(response) {
			if(response.status === 201) {
				that.setState({
					groupName: '',
					disabled: false
				});				
				return;					
			} 	
			else {
				console.log("some error occurred..."); //not sure how this is supposed to be done
				console.log(response);
			}
		});
	};

	render() {		
		return(
			<div>
				<h2>Create Group</h2>					
				<form onSubmit={this.handleSubmit}>					
					<input name='groupName' value={this.state.groupName} placeholder='Group name' onChange={this.handleChange} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.groupName}</span>
					<br/><br/>					
					<input type='submit' value='Submit' disabled={this.state.disabled} />
					<span style={{ color: 'red' }}>&nbsp;{this.state.errors.submit}</span>
				</form>
			</div>		
		);
	}
}

export default GroupForm;