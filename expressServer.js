const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(cookieParser())
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "12345" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aaaaa" }
};

const users = { 
  "12345": {
    id: "12345", 
    email: "boi@gmail.com", 
    password: "lul"
  },
 "aaaaa": {
    id: "aaaaa", 
    email: "tristan@gmail.com", 
    password: "123"
  }
}

app.post("/logout", (req, res) => {
  console.log('logging-out');
  res.clearCookie('userId');
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  console.log('email inputted:',req.body.email);
  var thisUser = emailLookup(req.body.email);
  if (!users[thisUser]) {
    res.status(400).send('<p>Email not in Use</p><a href="/login">Go back</a><br><a href="/register">Register</a>');
  }
  else if (req.body.password !== users[thisUser].password) {
    res.status(400).send('<p>Incorrect password</p><a href="/login">Go Back</a>');
  }
  else {
    res.cookie('userId', users[thisUser].id);
    console.log(`Logging in User: ${users[thisUser].email}`);
    res.redirect(`/urls`);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.cookies.userId || req.cookies.userId !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('<a href= "/urls">Cheeky Guy Huh</a>');
  }
  else {
    console.log(`Changing ${urlDatabase[req.params.shortURL].longURL} to ${req.body.newURL}`);
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies.userId || req.cookies.userId !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('<a href= "/urls">Cheeky Guy Huh</a>');
  }
  else {
    console.log(`${req.params.shortURL}/${urlDatabase[req.params.shortURL]} is being deleted`);
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
      password: req.body.password
    }
    console.log(`New User: ${users[newId].email}`);
    res.cookie('userId',newId);
    res.redirect(`/user/${newId}`);
  }
});

app.post("/urls/", (req, res) => {//new
  console.log(req.body);
  if (!req.body.longURL) {
    res.redirect('/urls/');
    return 0;
  }
  let temp = generateRandomString(6);
  while (urlDatabase[temp]) {
    temp = generateRandomString(6);
  }
  urlDatabase[temp].longURL = 'http://' + req.body.longURL;
  res.redirect('/urls');
});

app.get('/user/:user', (req, res) => {
  let currentId = req.params.user;
  let templateVars = {user: users[req.cookies['userId']], profile: users[currentId]};
  res.render('showUser', templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {user: users[req.cookies['userId']]};
  res.render('login',templateVars)
});

app.get('/register', (req, res) => {
  let templateVars = {user: users[req.cookies['userId']]};
  res.render('register',templateVars)
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies['userId']]};
  res.render("urlsIndex", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.userId)
    res.status(401).send('<p>No Guest Access</p><a href="/urls">Main Page</a><br><a href="/register">Create an account</a><br><a href="/login">Login</a>');
  else
    res.render("urlsNew",{user: users[req.cookies['userId']]});
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longUrl: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies['userId']] };
    res.render("urlsShow", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL)
})

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function checkUnique(newId, database) {
  for (var key in database) {
    if (database[key].id === newId)
      return false;
  }
  console.log(`${newId} is unique`);
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
  console.log(target,'not found');
  return false;
}

function urlsForUser(thisUserId) {
  var urlList = [];
  for (var key in urlDatabase) {
    let urlId = urlDatabase[key];
    if (thisUserId === urlId.userID) {
      urlList.push(key);
    }
  }
  console.log(`Fetching ${urlList} for user ${users[thisUserId].email}`);
  return urlList;
}