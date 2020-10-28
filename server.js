const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
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
  try {
    const cursor = await collection.find();
    cursor.forEach(user => {
      users.push({ username: user.username, _id: user._id });
    }).then(() => res.json(users));
  }
  catch {
    res.json({ msg: 'Error retrieving user list' });
  }
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
  const query = { username: req.body.username };
  collection.findOne(query).then(user => {
    if(user !== null) {
      res.json({ username: user.username, _id: user._id });
    } else {
      collection.insertOne({ username: req.body.username, exercises: [] }).then(result => {
        collection.findOne(query).then(user => {
          res.json({ username: user.username, _id: user._id });
        }).catch( err => res.json({ msg: err }));
      }).catch( err => res.json({ msg: err }));
    }
  }).catch( err => res.json({ msg: err }));
});

app.post('/api/exercise/add', (req, res) => {
  const query = { _id: new ObjectId(req.body.userId) };
  collection.findOne(query).then(user => {
    if(user !== null) {
      const exercise = {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      };
      const exercises = [...user.exercises, exercise];
      collection.findOneAndUpdate(query, { $set: { exercises: exercises } }).then(result => {
        res.json(result.value);
      }).catch( err => res.json({ msg: err }));
    } else {
      res.json({ msg: `You must add user ${req.body.userId} before adding exercises!`});
    }
  }).catch( err => res.json({ msg: err }));
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});
