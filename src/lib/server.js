const express = require('express');
const path = require('path'); 
const fs = require('fs'); // file system
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();
