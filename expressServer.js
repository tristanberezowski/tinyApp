/* TinyApp Server by Tristan Berezowski
Start server with npm start
*/
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['Super Secret Key']
}));
app.use(bodyParser.urlencoded({extended: true}));

//Databases
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "12345" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aaaaa" }
};

const users = { 
  "12345": {
    id: "12345", 
    email: "boi@gmail.com", 
    password: bcrypt.hashSync('lul', 10)
  },
 "aaaaa": {
    id: "aaaaa", 
    email: "tristan@gmail.com", 
    password: bcrypt.hashSync('lul', 10)
  }
};

//update user-id - a stretch feature not required
app.post("/user/:oldId", (req, res) => {
  if (!req.session.userId || (req.session.userId !== users[req.params.oldId].id)) {
    res.status(401).send('<a href= "/urls">Wrong Profile</a>');
  }
  else if(!checkUnique(req.body.id, users)) {
    res.status(409).send('<p>Id in use</p><br><a href= "/urls">Go Back</a>')
  }
  else {
    //console.log(`Changing ${users[req.params.oldId].id} to ${req.body.id}`);
    const newId = req.body.id;
    users[newId] = users[req.params.oldId];
    delete users[req.params.oldId];
    users[newId].id = newId;
    const urlList = urlsForUser(req.params.oldId);
    for(let i = 0; i < urlList.length; i++) {
      urlDatabase[urlList[i]].userID = newId;
    }
    req.session.userId = newId;
    //console.log(`Cookie is set to ${newId}`);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const thisUser = emailLookup(req.body.email);
  if (!users[thisUser]) {
    res.status(400).send('<p>Email not in Use</p><a href="/login">Go back</a><br><a href="/register">Register</a>');
  }
  else if (!bcrypt.compareSync(req.body.password, users[thisUser].password)) {
    res.status(400).send('<p>Incorrect password</p><a href="/login">Go Back</a>');
  }
  else {
    req.session.userId = users[thisUser].id;
    //console.log(`Logging in User: ${users[thisUser].email}`);
    res.redirect(`/urls`);
  }
});

// editing a url
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.userId || req.session.userId !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('<a href= "/urls">You are not the right user</a>');
  }
  else {
    //console.log(`Changing ${urlDatabase[req.params.shortURL].longURL} to ${req.body.newURL}`);
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect(`/urls/`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.userId || req.session.userId !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('<a href= "/urls">Cheeky Guy Huh</a>');
  }
  else {
    //console.log(`${req.params.shortURL}/${urlDatabase[req.params.shortURL]} is being deleted`);
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
  }
}); 

app.post('/register', (req, res) => {
  if (emailLookup(req.body.email)) {
    res.status(400).send('<p>Email in Use</p><a href="/register">Go Back</a>');
  }
  else if (!req.body.email || !req.body.password) {
    res.status(400).send('<p>Invalid email or password</p><a href="/register">Go Back</a>');
  }
  else {
    do {
      var newId = generateRandomString(5);
    } while (!checkUnique(newId, users));
    users[newId] = { 
      id: newId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    //console.log(`New User: ${users[newId].email}`);
    req.session.userId = newId;
    res.redirect(`/user/${newId}`);
  }
});

app.post("/urls/", (req, res) => {//new
  if (!req.body.longURL) {
    res.redirect('/urls/');
    return 0;
  }
  let temp = generateRandomString(6);
  while (urlDatabase[temp]) {
    temp = generateRandomString(6);
  }
  urlDatabase[temp] = { longURL: 'http://' + req.body.longURL, userID: req.session.userId };
  res.redirect('/urls');
});

//user profile
app.get('/user/:user', (req, res) => {
  let currentId = req.params.user;
  let urlList = urlsForUser(currentId);
  let templateVars = {user: users[req.session.userId], profile: users[currentId], urlList: urlList, urls: urlDatabase};
  res.render('showUser', templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {user: users[req.session.userId]};
  res.render('login',templateVars);
});

app.get('/register', (req, res) => {
  let templateVars = {user: users[req.session.userId] };
  res.render('register',templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.userId] };
  res.render("urlsIndex", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.userId || !userIdLookup(req.session.userId))
    res.status(401).send('<p>No Guest Access</p><a href="/urls">Main Page</a><br><a href="/register">Create an account</a><br><a href="/login">Login</a>');
  else
    res.render("urlsNew",{user: users[req.session.userId]});
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, urls: urlDatabase, user: users[req.session.userId] };
  res.render("urlsShow", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
})

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`tinyApp listening on port ${PORT}!`);
});

function checkUnique(newId, database) {
  for (var key in database) {
    if (database[key].id === newId)
      return false;
  }
  //console.log(`${newId} is unique`);
  return true;
}

function generateRandomString(len) {
  function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
  return rString = randomString(len, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}

function emailLookup(target) { //returns user id if found
  for (var key in users) {
    let user = users[key];
    if(user.email === target)
      return user.id;
  }
  //console.log(target,'not found');
  return false;
}

function userIdLookup(target) {
  for (var key in users) {
    let user = users[key];
    if(user.id === target)
      return true;
  }
  //console.log(target,'not found');
  return false;
}

function urlsForUser(thisUserId) { //returns an array of urls from the user by their shortURL
  var urlList = [];
  for (var key in urlDatabase) {
    let urlId = urlDatabase[key];
    if (thisUserId === urlId.userID) {
      urlList.push(key);
    }
  }
  return urlList;
}