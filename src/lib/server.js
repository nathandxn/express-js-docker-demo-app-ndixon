require('dotenv').config();

const express = require('express');
const path = require('path'); 
const RateLimit = require('express-rate-limit');
const helmet = require('helmet');
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
const mongoSanitize = require('mongo-sanitize');
const app = express();

// use when starting application locally
let mongoUrlLocal = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PW + '@localhost:27017';

// use when starting application as docker container
let mongoUrlDocker = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PW + '@mongodb';

// pass these options to mongo client connect request to avoid DeprecationWarning for current Server Discovery and Monitoring engine
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// "user-account" in demo with docker. "my-db" in demo with docker-compose
let databaseName = "user-account";


app.use(helmet());
app.use(limiter);

app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());

// Sanitize input to prevent NoSQL injection by explicitly extracting and validating fields
function sanitizeInput(obj) {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  // Explicitly extract and validate each allowed field
  // Using String() constructor to ensure no MongoDB operators can be injected
  if (typeof obj.name === 'string') {
    sanitized.name = String(obj.name).substring(0, 100);
  }
  
  if (typeof obj.email === 'string') {
    sanitized.email = String(obj.email).substring(0, 100);
  }
  
  if (typeof obj.interests === 'string') {
    sanitized.interests = String(obj.interests).substring(0, 500);
  }
  
  return sanitized;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', (req, res) => {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

app.post('/update-profile', (req, res) => {
    // Sanitize input using mongo-sanitize to remove any keys starting with '$'
    // and then apply field allowlist validation
    const rawInput = mongoSanitize(req.body);
    const sanitizedUserObj = sanitizeInput(rawInput);
  
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
      if (err) throw err;
  
      let db = client.db(databaseName);
      
      // Create a clean update object with only allowed fields
      const updateData = {
        userid: 1,
        name: sanitizedUserObj.name || '',
        email: sanitizedUserObj.email || '',
        interests: sanitizedUserObj.interests || ''
      };
  
      let myquery = { userid: 1 };
      let newvalues = { $set: updateData };
  
      db.collection("users").updateOne(myquery, newvalues, {upsert: true}, function(err, res) {
        if (err) throw err;
        client.close();
      });
  
    });
    // Send response as JSON with proper content-type to prevent XSS
    res.json({ success: true, message: 'Profile updated successfully' });
  });
  

app.get('/get-profile', (req, res) => {
    let response = {};
    // Connect to the db
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
      if (err) throw err;
  
      let db = client.db(databaseName);
  
      let myquery = { userid: 1 };
  
      db.collection("users").findOne(myquery, function (err, result) {
        if (err) throw err;
        response = result;
        client.close();
  
        // Send response
        res.send(response ? response : {});
      });
    });
  });
  

app.listen(port, function () {
    console.log("app listening on port 3000!");
});
  