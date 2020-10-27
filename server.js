const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', (req, res) => {
  console.log(req.body.username);
  res.json({ msg: 'success', username: req.body.username });
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

app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});
