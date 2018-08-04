import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit';
import { getToken, avatar } from './services';

var instanceLocator = 'v1:us1:d240e83d-f99c-44d7-ae6f-08b42180a620';

class ChatDisplay extends Component { //props: username, userId, roomId
	constructor(props) {
    super(props);
    this.messageList = React.createRef();
  }

  state = {
    currentRoom: {},
    currentUser: {},
    messages: [],
  }

  componentDidMount() {
    var that = this;
    var token = getToken(); 
    var user_id = parseInt(this.props.userId);
    var tokenProvider = new Chatkit.TokenProvider({
      url: 'http://localhost:3001/api/chatkitAuth',
      queryParams: { userId: user_id },                                                                                                         
      headers: { Authorization: 'Bearer ' + token}
    });

    var chatManager = new Chatkit.ChatManager({
      instanceLocator: instanceLocator,
			userId: that.props.userId, //bc we set the userId this way when we created a new chatkit user
			tokenProvider: tokenProvider
		});

    chatManager
    .connect()
    .then((currentUser) => {
				that.setState({ currentUser }); //store reference to currentUser
				return currentUser.subscribeToRoom({
					roomId: parseInt(that.props.roomId), //12386251
          messageLimit: 100, //onNewMessage hook will be called for the past 100 messages
          hooks: {
						onNewMessage: message => { //updates state whenever a message is sent to the room
							that.setState({ messages: [...that.state.messages, message] })
						}
					}
				});
			})
    .then(currentRoom => {
      that.setState({ currentRoom })
    })
    .catch(error => console.error('error', error));
  }

  forceScrollToBottom = () => {
    var box = this.messageList.current;
    box.scrollTop = box.scrollHeight - box.clientHeight;
  }  

  sendMessage = (text) => {
    this.state.currentUser.sendMessage({
      text,
      roomId: this.state.currentRoom.id
    });
  }; 

  render() {
    var styles = {
      container: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      },
      chatContainer: {
        display: 'flex',
        flex: 1
      },
      whosOnlineListContainer: {
        width: '300px',
        flex: 'none',
        padding: 20,
        backgroundColor: '#2c303b',
        color: 'white'
      },
      chatListContainer: {
        padding: 20,
        width: '85%',
        display: 'flex',
        flexDirection: 'column'
      }
    };

    return(
      <div id='chatContainer'>
        <div id='whosOnlineListContainer'>          
        </div>       
       
        <MessageList
            messages={this.state.messages}
            currentUser={this.state.currentUser}
         />            
        
        <MessageForm
          sendMessage={this.sendMessage}
        />       
        
      </div>
    );
  }
}

class MessageList extends Component { //props: currentUser, messages (message has sender.name and text)
  constructor(props) {
    super(props);
    this.container= React.createRef();
  }

  componentWillUpdate() {
    var container = this.container.current;
    this.shouldScrollToBottom = container.scrollTop + container.clientHeight + 100 >= container.scrollHeight;
    //max scroll top = scrollHeight - clientHeight
  }

  componentDidUpdate() {
    if(this.shouldScrollToBottom) {
        var container = this.container.current;
        container.scrollTop = container.scrollHeight;
    }
  }  

  render() {
    var i;
    var displayMessages = [];
    var messages = this.props.messages;
    for(i = 0; i < messages.length; i++) {
      var date1, date2, elapsed;
      if(i !==0) { //figure out how much time passed between the current and previous messages
        date1 = new Date(messages[i].createdAt);
        date2 = new Date(messages[i-1].createdAt);
        elapsed = (date1.getTime() - date2.getTime()) / 1000; //seconds
      } else { 
        date1 = new Date(messages[i].createdAt);
      }

      if(i !== 0 && messages[i-1].sender.id === messages[i].sender.id && elapsed < 60) { //don't display user's picture and username
        displayMessages.push(
          <div key={i}>
            <p id='messageText'>{messages[i].text}</p>
          </div>
        );
      } else {
        var url = avatar(messages[i].sender.name, 20);
        var amOrPm = (date1.getHours() < 12) ? "AM" : "PM";
        var hour = (date1.getHours() < 13) ? date1.getHours() : date1.getHours() - 12;
        var minutes = (date1.getMinutes() < 10) ? '0' + date1.getMinutes() : date1.getMinutes();
        var time = hour + ':' + minutes + ' ' + amOrPm;        
        displayMessages.push(
          <div key={i} id='messageBlock'>
            <img src={url} /> <span id='messageAuthor'>{messages[i].sender.name}</span> <span id='messageTime'>{time}</span>
            <p id='messageText'>{messages[i].text}</p>
          </div>
        );
      }
    }

    return(
      <div id='messageList' ref={this.container}>
          {displayMessages}
      </div>
    );
  }
}

class MessageForm extends Component { //props: sendMessage
  state = {
    input: ''
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.props.sendMessage(this.state.input);
    this.setState({ input: '' });
  }

  render() {
    return(
      <form id='chatForm' onSubmit={this.onSubmit}>
        <input id='chatInput' value={this.state.input} placeholder="Type your message" onChange={this.onInputChange} />
      </form>
    );
  }
}


export default ChatDisplay;