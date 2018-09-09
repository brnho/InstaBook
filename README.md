# InstaBook

(better formatting: https://docs.google.com/document/d/1HOthhyFP6-BE-nkuziMylyujCs1HUVDCokQj8-Nm3C4/edit)

General

- React.js frontend, Express.js backend/API. Single-page application. Mongoose ODM.
- React frontend located in client folder inside root directory (Created with Create React App). Express.js backend served on port 3001, - React.js frontend served on port 3000. 
- Layout is the base component, contains the navbar, and handles all the routes
- Users are members of groups. In a group, they can make posts, comment on posts, and chat with other members.
- All protected API routes require a jwt for authentication.


User Accounts/Authentication

- SignUpForm.jsx takes in email, username, and password. 
- If a user was successfully created, the API sends back a jwt (but nothing is done with it). SignUpForm.jsx redirects to LoginForm.jsx    by pushing ‘/login’ onto the history props.
- API uses Passport module to handle login authentication. 
- Passport configuration (in setuppassport.js): First checks whether a user with the given username exists. If so, checks whether the  	 
  given passport is correct by calling the checkPassword method of the User model. 
- Sessions are disabled for Passport since we generate a jwt each time we make a request to the API (?)
- userSchema has a pre-save hook that hashes the password before it is saved
- LoginForm.jsx determines whether login was successful by checking fetch response status codes. 
- If successful, LoginForm.jsx receives a jwt from the API and saves it in localStorage. The jwt secret key is located in the .env file.  - Username and UserId is extracted from the jwt and used to create a chatkit profile for the user. If a chatkit  profile for the user
  already exists, the API will just return a 200 status code. 
- Finally, LoginForm.jsx calls its onLogin props method (inform parent component Layout.jsx the user is now logged in so it can make 	   some changes to the navbar display, ex. removing ‘Sign Up’ and replacing it with ‘Logout’) and redirects to the homepage. 
- Components requiring user login check whether the user is logged in by calling isLoggedIn (method defined in services.js) in - -  - ComponentDidMount. If false, user is redirected to LoginForm.jsx through the history prop’s replace method.






Posts/Comments

Comments belong to a post. Posts belong to a group.
The Group model stores refs to the User model (members of a group), and stores Posts as subdocuments. Posts do not exist independently of the group. 
The Post model stores Comments as subdocuments. 
Posts are either text posts or poll posts. 
Poll post fields:
pollOptions stores an array of the poll options. 
votesPerOption stores an array of arrays, where the inner arrays contain the user IDs of the users who voted for the corresponding option. (ex. [ [g5f76, 687k], [ ], [5968gj] ]) 
multiVote indicates whether users can vote multiple times in the poll.
Posts.jsx 
Responsible for displaying all the posts/comments in a group
Receives group ID in its url, accessible through props.match.params. Uses the groupID to identify which group to load posts from.
In ComponentWillMount, an API call is made to check whether the user is a member of the group. Redirects to homepage if false.  
LoadGroupInfo method fetches the group from the api and updates state. LoadGroupInfo is called every 5 seconds through the setInterval function, executed in ComponentDidMount. clearInterval is called in ComponentWillUnmount, but react still seems to be giving error warnings about calling setState on an unmounted component. 
ChatDisplay.jsx is only rendered when state has values username, user id, and chat room id

	
Poll Post Functionality
Each poll option is rendered with a checkbox that has an attribute ‘name’ set to the option’s index. The checkbox is checked if the user voted for that option (done by searching through votesPerOption for the user’s id).
Each poll option is also shaded proportionally based on its vote percentage. 
When the user votes or unvotes for an option by clicking on a checkbox, a request containing the option’s index, the user’s id, and the checkbox’s status (checked or not)  is made to the API .
 If the checkbox was checked, and the poll is of type multi-vote, the user’s id is pushed to the correct array in votesPerOption. If the poll is of type single-vote, the API controller first scans through votesPerOption to remove the user’s id if found (should only be there at most once).  
If the checkbox was unchecked, the user’s id is removed from the correct array in votesPerOption.
When the API sends back a response, I have PostList.jsx immediately call loadGroupInfo for a faster UI display time. 

Chat

- In LoginForm, a chatkit user is created (with properties username and userId).
- When a new group is created in GroupForm, a new chatkit room is also created:
- When the form is submitted, createOrDeleteChatRoom is called. First, the currentUser is retrieved in order to create a new chatkit room. The createGroup function is called from within the create room promise so that it can receive the room ID as an argument (not entirely sure how async/promises/if control works). If it turns out that there was an error in creating the group, we want to delete the created room, so we call createOrDeleteChatRoom again, this time indicating the delete option. It’s circular, but it probably works. (I could have split up the createOrDeleteChatRoom method, but I wanted to save space, since I would have to set up the currentUser again) 
- In Posts, the group’s chatkit room ID is retrieved and passed as a prop to ChatApp
- Two chat functions are included in the API: one for creating a chatkit user, and another for authentication

Emailing Group Invitations

The controller for sending the email is actually located inside of app.js instead of the API because express-mailer was hooked up to the app. Didn’t want to fiddle with exporting the app to the API.

















