import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit';
import { isLoggedIn, getToken, userId } from './services';

var instanceLocator = 'v1:us1:d240e83d-f99c-44d7-ae6f-08b42180a620';

class GroupInvite extends Component {

	state = {
		validLink: false,
		groupId: '',
		groupName: '',
		isLoading: true
	}
	
	componentWillMount() {
		if(!isLoggedIn()) {
			this.props.history.replace('/login'); //need some sort of history redirect...
			return;
		}

		var token = getToken();
		var that = this;
		fetch('/api/verifyToken/' + that.props.match.params.token, {
			method: 'get',			
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		}).then(function(response) {
			if(response.status === 403) { //invalid jwt
				that.setState({ 
					isLoading: false,
					validLink: false 
				}); //ideally i would like to break out of the fetch call at this point
				return;
			} else if(response.status === 200) {
				return response.json();
			} else {
				console.log('an error'); //throw some error??
			}
		}).then(function(body) {
			if(body) {
				that.setState({ //retrieve the information from the decoded jwt
					isLoading: false,
					validLink: true,
					groupId: body.groupId,
					groupName: body.groupName
				});
				return;
			}
		});	
	}

	joinGroup = () => {
		var user_id = userId();
		var apiData = {
			groupId: this.state.groupId,
			userId: user_id
		};
		var token = getToken();
		var that = this;
		fetch('/api/joinGroup', {
			method: 'post',	
			body: JSON.stringify(apiData),		
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		})
		.then(function(response) {
			if(response.status === 200) { 
				return response.json(); //receive roomId from api response body
			} else if(response.status === 404) { //like the group couldn't be found bc the link was faulty
				that.setState({ validLink: false });
				return;
			} else {
				console.log('error...'); //throw some error?? redirect to homepage and flash a message?
			} 
		})
		.then((body) => {
			if(body) {
				that.addUserToRoom(body.chatRoomId, user_id);
			}
		});
	};

	addUserToRoom = (roomId, user_id) => {
		var that = this;
		var token = getToken();
		var tokenProvider = new Chatkit.TokenProvider({
	      url: 'http://localhost:3001/api/chatkitAuth',
	      queryParams: { userId: user_id },                                                                                                         
	      headers: { Authorization: 'Bearer ' + token}
	    });	
	    var chatManager = new Chatkit.ChatManager({
      		instanceLocator: instanceLocator,
			userId: user_id, 
			tokenProvider: tokenProvider
		});
		chatManager
			.connect()
			.then((currentUser) => {
				currentUser
					.joinRoom({ roomId: parseInt(roomId) })
					.then(room => {
						var url = '/posts/' + that.state.groupId;
						that.props.history.push(url); //redirect to the group
					})
					.catch(err => console.log(err));
			})
			.catch(err => console.log(err));
	};

	render() {
		var invite, loading;
		if(this.state.isLoading) { 
			loading = <div>Loading...</div>; // //try to get that spinning wheel gif
		}

		if(!this.state.isLoading && this.state.validLink) {
			invite = <a href="javascript:void(0)" onClick={this.joinGroup}>Join the group {this.props.groupName}</a>;
		} else if(!this.state.isLoading) {
			invite = <div>
				<p>Sorry, the link you were looking for does not exist</p>
				<a href="/">Return to homepage</a>
			</div>;
		}

		return(
			<div>
				{loading}
				{invite}
			</div>
		);
	}		
}

export default GroupInvite;