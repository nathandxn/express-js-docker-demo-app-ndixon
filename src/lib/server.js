const express = require('express');
const path = require('path'); 
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
  windowMs: parseInt(process.env.WINDOW_MS, 10),
  max: parseInt(process.env.MAX_IP_REQUESTS, 10),
  delayMs:parseInt(process.env.DELAY_MS, 10),
  headers: true
});

const port = process.env.PORT || 3000;

const fs = require('fs'); // file system
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();

app.use(limiter);

app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

app.get('/profile-picture', (req, res) => {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

app.listen(port, function () {
    console.log("app listening on port 3000!");
});
  