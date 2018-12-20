const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

//postgres client setup
const { Pool }  = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  password: keys.pgPassword,
  host: keys.pgHost,
  port: keys.pgPort,
  database: keys.pgDatabase
});

pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err=> console.log(err));

//redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

//express rout handlers

app.get('/', (req,res) => {
  res.send('Hi');
});

app.get('/values/all', async (req,res) => {
  const values = await pgClient.query('SELECT * from values');
  res.send(values.rows);
});

//NOTE - why are we using a classic callback here, when for pg we use 'await'?
//       redis does not support promise syntax out of the box.

app.get('/values/current', async (req,res) => {
  redisClient.hgetall('values', (err,values) => {
    res.send(values);
  });
});


app.post('/values', async (req,res) => {
  const index  = req.body.index;
  if(parseInt(index) > 40) {
	return res.status(422).send('index too high');	
  }

  redisClient.hset('values', index, 'Nothing yet!');
  //send message to the worker process to calc fib sequence for index
  //question - how does worker know to listen to this publisher?
  redisPublisher.publish('insert', index);
  pgClient.query('insert into values(number) values($1)', [index]); 
  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
