import React, { Component } from 'react';
import { isLoggedIn, getToken, currentUser } from './services';

class GroupForm extends Component { //receives props userId, updateGroups
	state = {
		groupName: '',
		errors: {
			group: false
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
			errors.group = 'Name required';
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
		this.createGroup();
	};

	createGroup = () => {
		var username = currentUser(); //should this be async???		
		if(username) { //async?
			var that = this; //good workaround?
			var token = getToken();
			fetch('/api/group', {
				method: 'post',
				body: JSON.stringify({
					groupName: that.state.groupName,
					username: username,
				}),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token
				}
			})
			.then(that.checkStatus)
			.then(function(group) {
				if(group) {
					that.props.updateGroups(group); //inform layout about the new group for faster UI display
					that.setState({
						groupName: '',
						disabled: false
					});									
				} else { //duplicate group name or some other random error
					that.setState({ disabled: false });
				}
			});
		}		
	}

	checkStatus = (response) => {
		if(response.status === 201) {
			return response.json();
		} else if(response.status === 409) { //duplicate group name
			this.setState({ errors: {group: "Group name taken"} });
			return {};
		} else {
			this.setState({ errors: {group: "Sorry, an error occurred"} });
			return {}; //need to throw some error
		}
	};	

	render() {
		var error;	
		if(this.state.errors.group) {
			error = <div style={{ color: 'red' }}>{this.state.errors.group}</div>;
		} else {
			error = null;
		}	

		return(
			<div id="groupFormPage">
			
				<h2>Create Group</h2>

				<form onSubmit={this.handleSubmit} id="groupForm">					
					<input className='form-control groupField' name='groupName' value={this.state.groupName} placeholder='Group name' onChange={this.handleChange} />
										
					<button className="btn btn-primary" id="groupSubmit" type="submit" disabled={this.state.disabled}>Submit</button>
					{error}
				</form>				
			
			</div>				
		);
	}
}

export default GroupForm;