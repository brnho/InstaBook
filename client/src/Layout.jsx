import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";

import Home from './Home.js';
import PostList from './PostList.jsx';
import LoginForm from './LoginForm.jsx';
import Logout from './Logout.js';
import GroupForm from './GroupForm.js';
import GroupInvite from './GroupInvite.js';
import GroupSearch from './Autosuggest.js';
import ChatDisplay from './ChatApp.jsx';
import { isLoggedIn, getToken, currentUser, userId } from './services';

class Layout extends Component {
  state = {
    loggedIn: false,
    username: '',
    userId: '',
    groups: []
  }

  componentWillMount() {
    if(isLoggedIn()) {
      var username = currentUser();
      var user_id = userId();
      this.setState({
        loggedIn: true,
        username: username,
        userId: user_id
      });
      this.loadGroupsFromApi();
      this.interval = setInterval(this.loadGroupsFromApi, 5000); //poll api every 5 seconds
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadGroupsFromApi = () => {
    var that = this;
    var token = getToken(); //JWT is set as an HTTP header called Authorization
    fetch('/api/groups', {
      method: 'get',
      headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token 
          }
    }).then(that.checkStatus)
      .then(function(groups) {      
        that.setState({ groups: groups });
      });
  };

  updateGroups = (group) => {
    var groupList = [...this.state.groups, group];
    this.setState({ groups: groupList });
  };

  checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response.json();
      } else {
        console.log('help an error'); //change this
        //need to throw some error
        return [];
      }
  };
  
  onLogout = () => {
    this.setState({ loggedIn: false, groups: [] });
    clearInterval(this.interval); //stop polling api upon logout
  };

  onLogin = () => {
    var username = currentUser();
    var user_id = userId();
    this.setState({
      loggedIn: true,
      username: username,
      userId: user_id
    });
    this.loadGroupsFromApi();
    this.interval = setInterval(this.loadGroupsFromApi, 5000); //start polling the api again after logging in
  };

  render() {
    var login, signup, groups, viewGroups;
    if(this.state.loggedIn) {
      login = <Link to="/logout" id="navText" className="nav-link">Logout</Link>;
      groups = this.state.groups.map((group, i) => {  
        var url = '/posts/' + group._id;      
        return(
          <a className="dropdown-item" href={url} key={i}>{group.name}</a>
        );
      }); 
      viewGroups = <a id="navText" className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      View Groups
                   </a>;     
    } else {
      viewGroups = <a className="nav-link dropdown-toggle disabled" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      View Groups
                   </a>;
    }

    return (
      <Router>
      <div>       

        <nav className="navbar fixed-top navbar-expand-sm ">
          <a id="navText" className="navbar-brand" href="/"><strong>Instabook</strong></a>
          
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <a id="navText" className="nav-link" href="/">Home</a>
              </li>
              <li className="nav-item">
                <Link to="/createGroup" className="nav-link" id="navText">Create Group</Link>
              </li>
              <li className="nav-item dropdown">
                {viewGroups}
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  {groups}
                </div>
              </li>
              <li className="nav-item">
                {login}
              </li>      
            </ul>  

            <GroupSearch 
              className="form-inline my-2 my-lg-0"
              groups={this.state.groups}
            />
          </div>
        </nav> 
          
            <Route exact path="/" component={Home} />
            <Route exact path="/posts/:groupId" component={PostList} />
            <Route 
              exact path='/createGroup'
              render={(props) => <GroupForm {...props} updateGroups={this.updateGroups} userId={this.state.userId}/>}
            />
            <Route 
              exact path="/login" 
              render={(props) => <LoginForm {...props} onLogin={this.onLogin} />}
            />
            <Route 
              exact path="/logout"
              render={(props) => <Logout {...props} onLogout={this.onLogout} />} 
            /> 
            <Route exact path="/groupInvite/:token" component={GroupInvite} />
            <Route 
              exact path="/chat"
              render={(props) => <ChatDisplay {...props} username={this.state.username} userId={this.state.userId} />} 
            />          

      </div>        
      </Router>
    );
  }
}

export default Layout;
