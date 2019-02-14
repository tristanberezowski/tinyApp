const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(cookieParser())
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.post("/logout", (req, res) => {
  console.log('logging-out');
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  console.log('Username added:',req.body.username);
  res.cookie('username',req.body.username);
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  console.log(`Changing ${urlDatabase[req.params.shortURL]} to ${req.body.newURL}`)
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(`${req.params.shortURL}/${urlDatabase[req.params.shortURL]} is being deleted`);
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls/');
}); 

app.post('/register', (req, res) => {
  user[req.body.id] = { 
    id: req.body.id,
    email: req.body.email,
    password: req.body.password
  }
  console.log(`New User: ${user[req.body.id].id}`);
  res.redirect(`/user/${user[req.body.id].id}`);
})

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
  urlDatabase[temp] = 'http://' + req.body.longURL;
  res.redirect('/urls');
});

app.get('/user/:user', (req, res) => {
  let templateVars
});

app.get('/register', (req, res) => {
  let templateVars = {username: req.cookies["username"]};
  res.render('register',templateVars)
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urlsIndex", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urlsNew",{username: req.cookies["username"]});
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
    res.render("urlsShow", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL])
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



function generateRandomString(len) {
  function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
  return rString = randomString(len, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}