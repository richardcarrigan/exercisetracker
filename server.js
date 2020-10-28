const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const port = process.env.PORT || 3000;
const url = require('url');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let collection = '';
client.connect(err => {
  if(err) {
    console.error(err);
  } else {
    collection = client.db('exercise-tracker').collection('users');
    console.log('Connected to db...');
  }
});

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/exercise/users', async (req, res) => {
  const users = [];
  const cursor = await collection.find();
  cursor.forEach(user => {
    users.push(user)
  }).then(() => res.json(users));
});

app.get('/api/exercise/log', (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  if(queryObject.userId) {
    res.json({ 
      msg: 'success',
      userId: queryObject.userId,
      from: queryObject.from,
      to: queryObject.to,
      limit: queryObject.limit
    });
  } else {
    res.json({ msg: 'failure', err: 'must include userId' });
  }
});

app.post('/api/exercise/new-user', (req, res) => {
  collection.findOne({ username: req.body.username }).then(user => {
    if(user !== null) {
      res.json(user);
    } else {
      collection.insertOne({ username: req.body.username }).then(result => {
        collection.findOne({ username: req.body.username }).then(user => {
          res.json(user);
        });
      });
    }
  });
  // console.log(req.body.username);
  // res.json({ username: req.body.username, _id: '123456abcde' });
});

app.post('/api/exercise/add', (req, res) => {
  res.json({
    msg: 'success', 
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date
  });
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});
