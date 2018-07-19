import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import './App.css';
import Home from './home.js';
import PostList from './Posts';
import UserForm from './UserForm';
import LoginForm from './LoginForm';
import Logout from './Logout.js';
import GroupForm from './GroupForm.js';
import { isLoggedIn, getToken } from './services';

class App extends Component {
  state = {
    users: [],
    loggedIn: false,
    groups: []
  }

  componentWillMount() {
    if(isLoggedIn()) {
      this.setState({ loggedIn: true });
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
      .then(res => res.json())
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
        return response;
      } else {
        console.log('help an error'); //change this
        //need to throw some error
      }
  };
  
  onLogout = () => {
    this.setState({ loggedIn: false });
    clearInterval(this.interval); //stop polling api upon logout
  };

  onLogin = () => {
    this.setState({ loggedIn: true });
    this.interval = setInterval(this.loadGroupsFromApi, 5000); //start polling the api again after logging in
  };

  render() {
    var login, signup, groups, groupButton, viewGroups;
    if(this.state.loggedIn) {
      login = <Link to="/logout" className="nav-link disabled">Logout</Link>;
      signup = null;                                    
      groups = this.state.groups.map((group, i) => {  
        var url = '/posts/' + group.name + '/' + group._id;      
        return(
          <a className="dropdown-item" href={url} key={i}>{group.name}</a>
        );
      }); 
      viewGroups = <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      View Groups
                   </a>;     
    } else {
      login = <Link to="/login" className="nav-link disabled">Login</Link>; 
      signup = <Link to="/signup" className="nav-link disabled">Sign Up</Link>; 
      viewGroups = <a className="nav-link dropdown-toggle disabled" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      View Groups
                   </a>;
    }

    return (
      <Router>
        <div>         
        

<nav className="navbar navbar-expand-lg navbar-ligh" style={{backgroundColor: '#e3f2fd'}}>
  <a className="navbar-brand" href="/">Website Title</a>
  <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span className="navbar-toggler-icon"></span>
  </button>

  <div className="collapse navbar-collapse" id="navbarSupportedContent">
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <a className="nav-link disabled" href="/">Home</a>
      </li>
      <li className="nav-item">
        <Link to="/createGroup" className="nav-link disabled">Create Group</Link>
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
      <li className="nav-item">
        {signup}
      </li>      
    </ul>


    <form className="form-inline my-2 my-lg-0">
      <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
      <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
    </form>
  </div>
</nav>


          <Route exact path="/" component={Home} />
          <Route exact path="/posts/:groupName/:groupId" component={PostList} />
          <Route 
            exact path='/createGroup'
            render={(props) => <GroupForm {...props} updateGroups={this.updateGroups} />}
          />
          <Route exact path="/signup" component={UserForm} />  
          <Route 
            exact path="/login" 
            render={(props) => <LoginForm {...props} onLogin={this.onLogin} />}
          />
          <Route 
            exact path="/logout"
            render={(props) => <Logout {...props} onLogout={this.onLogout} />} 
          />        
        </div>        
      </Router>
    );
  }
}

export default App;
