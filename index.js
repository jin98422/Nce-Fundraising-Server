const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const seed = require('./seed')

const port = parseInt(process.env.PORT, 10) || 8000;

//Databases
const User = require('./database/Users');
const Role = require('./database/Roles');
const Seed = require('./database/Seeds');
const Method = require('./database/Methods');
const Gender = require('./database/Genders');

//routes
const dbconfig = require('./config/dbconfig');
const user = require('./routes/user');
const client = require('./routes/client');
const source = require('./routes/source');
const fundraiser = require('./routes/fundraiser');
const donor = require('./routes/donor');
const campaign = require('./routes/campaign');
const team = require('./routes/team');
const share = require('./routes/share');

//Database-MongoDB-connect
mongoose.Promise = global.Promise;
mongoose.connect(dbconfig.DB, {useNewUrlParser: true, useCreateIndex: true}).then(
    () => {console.log(`Database is connected - ${dbconfig.DB}`)},
    err => {console.log(`Can't connect to the database - ${err}`)}
);  

//insert default data
Seed.find({flag: true}).then(doc => {
  if(doc.length == 0) {
    User.insertMany(seed.admin);
    Role.insertMany(seed.roles);
    Method.insertMany(seed.methods);
    Gender.insertMany(seed.genders);
    Seed.insertMany(seed.seed);
  }
}).catch(err => {
  console.log(err)
})

app.use(bodyParser.json());
app.use(cors());
// app.use(cors)
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
})

var publicDir = path.join(__dirname,'/public');
app.use(express.static(publicDir));

app.get('/api/', (req, res) => {
  res.send('Hello!')
});

app.use('/api/user', user);
app.use('/api/client', client);
app.use('/api/source', source);
app.use('/api/fundraiser', fundraiser);
app.use('/api/donor', donor);
app.use('/api/campaign', campaign);
app.use('/api/team', team);
app.use('/api/share', share);
app.use('/api/images/', express.static(publicDir))

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});