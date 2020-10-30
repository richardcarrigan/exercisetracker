const bodyParser = require('body-parser');
const cors = require('cors');
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

app.use(cors());

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
    collection.findOne({ _id: new ObjectId(queryObject.userId) }).then(result => {
      if(result !== null) {
        const exercises = result.log;
        let exerciseResult = [];

        if(queryObject.from && queryObject.to) {
          const from = new Date(queryObject.from);
          const to = new Date(queryObject.to);
          exercises.forEach(exercise => {
            if(exercise.date >= from && exercise.date <= to) {
              exercise.date = exercise.date.toDateString();
              exerciseResult.push(exercise);
            }
          });
        } else {
          exercises.forEach(exercise => {
            exercise.date = exercise.date.toDateString();
          })
          exerciseResult = [...exercises];
        }

        if(queryObject.limit && queryObject.limit < exerciseResult.length) {
          exerciseResult = exerciseResult.slice(0, queryObject.limit);
        }

        const count = exerciseResult.length;
        res.json({ _id: result._id, username: result.username, log: exerciseResult, count: count });
      } else {
        res.json({ msg: `user ${queryObject.userId} not found` });
      }
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
      collection.findOneAndUpdate(
        query, 
        { $set: { username: req.body.username, log: [] } },
        { returnOriginal: false, upsert: true}
      ).then(user => {
        res.json({ username: user.value.username, _id: user.value._id });
      }).catch( err => res.json({ msg: err }));
    }
  }).catch( err => res.json({ msg: err }));
});

app.post('/api/exercise/add', (req, res) => {
  const filter = { _id: new ObjectId(req.body.userId) };
  const exercise = {
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date ? new Date(req.body.date) : new Date()
  };

  collection.findOneAndUpdate(filter, { $push: { log: exercise } }, { returnOriginal: false }).then(user => {
    if(user !== null) {
      const newExercise = user.value.log[user.value.log.length - 1];
        res.json({
          username: user.value.username,
          description: newExercise.description,
          duration: newExercise.duration,
          _id: user.value._id,
          date: newExercise.date.toDateString()
        });
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
