import React, { Component } from 'react';
import { isLoggedIn, currentUser, userId } from './services';

class Home extends Component {


	state = {
		username: '',
		userId: '',
    }

    componentDidMount() {
    	if(!isLoggedIn()) {
    		this.props.history.replace('/login');
    	}
    	var username = currentUser();
    	var user_id = userId();
		if(username && userId) { //async just in case?
			this.setState({ 
				username: username,
				userId: user_id
			});
		}
	}

	render() {
		return(
			<div className="d-flex justify-content-center" id="welcome">
				<h1>Hello, {this.state.username}!</h1>
			</div>
		);
	}
}

export default Home;