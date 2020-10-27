const bodyParser = require('body-parser');
const express = require('express');
const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`);
});
