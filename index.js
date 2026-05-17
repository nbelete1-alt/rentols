const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

dotenv.config();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

app.get('/listings', async (req, res) => {
  const { city, state } = req.query;
  try {
    const url = `https://api.rentcast.io/v1/listings/rental/long-term?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&limit=20`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': process.env.RENTCAST_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.statusCode = 500;
    res.send(error);
  }
});

app.get('/saved', async (req, res) => {
  const { data, error } = await supabase.from('saved_cities').select();
  if (error) {
    res.statusCode = 500;
    res.send(error);
  } else {
    res.json(data);
  }
});

app.post('/saved', async (req, res) => {
  const city = req.body.city;
  const state = req.body.state;

  if (!city || !state) {
    res.statusCode = 400;
    res.json({ message: 'City and state are required' });
    return;
  }

  const { data, error } = await supabase
    .from('saved_cities')
    .insert({ city: city, state: state })
    .select();

  if (error) {
    res.statusCode = 500;
    res.send(error);
  } else {
    res.json(data);
  }
});

app.get('/geocode', async (req, res) => {
  const { city, state } = req.query;
  const query = encodeURIComponent(`${city}, ${state}`);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${process.env.OPENCAGE_KEY}&limit=1`;
  const response = await fetch(url);
  const data = await response.json();
  const result = data.results[0]?.geometry || null;
  res.json(result);
});

app.listen(port, () => {
  console.log(`App is available on port: ${port}`);
});