import React, { Component } from 'react';
import { getToken } from './services';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class PostForm extends Component {
	constructor(props) {
		super(props);
		this.pollModal = React.createRef();
	}

	state = {
		post: '',
		errors: {
			post: false,
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

	pollSubmit = (options, multiVote) => {
		var that = this;
		var token = getToken();
		var apiData = {
			pollOptions: options,
			username: this.props.username,
			user_id: this.props.user_id,
			multiVote: multiVote
		};
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
		  	that.pollModal.current.toggle(); //close the modal
		  });		
	}

	openModal = (event) => {
		this.pollModal.current.toggle();
	}

	render() {	
		var errors;	
		if(this.state.errors.post) {
			errors = <div id="error" style={{ color: 'red' }}>&nbsp;{this.state.errors.post}</div>;
		} else {
			errors = null;
		}

		return(
			<div className="row d-flex justify-content-center">
				<div className="col-sm-12">
					<div className="box" id="boxPostForm">
						<form onSubmit={this.handleSubmit}>				
							<textarea className='form-control' value={this.state.post} placeholder='Write a post' onChange={this.handleChange} />								
							<button className="btn btn-primary" type="submit" disabled={this.state.disabled}>Create Post</button>							
							<button id="pollButton" type="button" className="btn btn-primary" onClick={this.openModal}>Create Poll</button>
						</form>
						{errors}
					</div>
					<PollModal
						ref={this.pollModal}
						errors={this.state.errors.poll}
						pollSubmit={this.pollSubmit}
					/>
				</div>
			</div>	
		);
	}
}

class PollModal extends Component {  
  state = {
    modal: false,
    options: ['', '', ''], //begin with three options
    isChecked: false,
    errors: ''
  }

  toggle = () => {
    this.setState({ 
      modal: !this.state.modal,
      options: ['', '', ''],
      isChecked: false,
      errors: ''
    });
  }

  onChange = (event) => {
  	var index = parseInt(event.target.name, 10); //get the index of the option
  	var optionsList = this.state.options.map((option, i) => {
  		if(i === index) {
  			return event.target.value;
  		} else {
  			return option;
  		}
  	});
  	this.setState({ options: optionsList });
  }

  handleCheck = (event) => {
  	this.setState({ isChecked: event.target.checked });
  }

  addOption = (event) => {
  	this.setState({ options: [...this.state.options, ''] });
  }

  deleteOption = (event) => {
  	var index = parseInt(event.target.name, 10); //get the index of the option
  	var optionsList = this.state.options.filter((option, i) => i !== index);
  	this.setState({ options: optionsList });
  }

  handlePollSubmit = (event) => {
  	event.preventDefault();
  	var i; 
  	var isEmpty = true;
  	var optionsList = [];
	for(i = 0; i < this.state.options.length; i++) {
		if(this.state.options[i]) { 
			isEmpty = false;
			optionsList.push(this.state.options[i]);
		}
	}
	if(isEmpty){ //validation for empty options
		this.setState({ errors: "Empty options" });
		return;
	} else {
  		this.props.pollSubmit(optionsList, this.state.isChecked);
	}	
  }

  render() {
  	var optionsDisplay = this.state.options.map((option, i) => {
  		return(
  			<div id='optionContainer' key={i}>
  				<textarea name={i} id='option' placeholder="add option" value={option} onChange={this.onChange} />
  				<a href='#' name={i} id='deleteOption' onClick={this.deleteOption}>X</a>
  			</div>
  		);
  	});
    return(
      <div>
        <Modal isOpen={this.state.modal} toggle={this.toggle}>
        	<ModalHeader toggle={this.toggle}>Create Poll</ModalHeader>
        	<form onSubmit={this.handlePollSubmit}>
	          	<ModalBody>
	          		{optionsDisplay}
	          		<a href='#' id="addOption" onClick={this.addOption}>+ Add option</a>
	        	</ModalBody>
	        	<ModalFooter>	    
	          		<button type="submit" className="btn btn-default btn-primary">Submit</button>
	          		<label id="pollNumVoteCheckbox"><input type="checkbox" onChange={this.handleCheck} checked={this.state.isChecked} /> Allow members to vote more than once</label>
	        	</ModalFooter>
	    	</form>
	    	<p id="pollErrors">{this.state.errors}</p>
        </Modal>
      </div>      
    );
  }
}

export default PostForm;