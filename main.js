const express = require('express');
const axios = require('axios');
const app = express();
app.set('view engine', 'ejs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountkey.json');
const bcrypt = require('bcrypt');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


app.get('/', function (req, res) {
  res.redirect('/login');
});

app.get('/signup', function (req, res) {
  const message = req.query.message || '';
  res.render('signup', { message });
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/signupSubmit', async function (req, res) {
  try {
    const { Fullname, Email, Phoneno, Password } = req.body;
    const userExistsSnapshot = await db.collection('userDemo').where('Email', '==', Email).get();

    if (!userExistsSnapshot.empty) {
      const message = 'User already registered with this email';
      return res.redirect(`/signup?message=${message}`);
    }

    const hashedPassword = await bcrypt.hash(Password, 10);
    await db.collection('userDemo').add({
      Fullname,
      Email,
      Phoneno,
      Password: hashedPassword,
    });

    res.render('login');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Signup failed');
  }
});

app.post('/loginSubmit', async function (req, res) {
  try {
    const { Email, Password } = req.body;
    const snapshot = await db.collection('userDemo').where('Email', '==', Email).get();

    if (!snapshot.empty) {
      const user = snapshot.docs[0].data();
      const hashedPassword = user.Password;
      const passwordMatch = await bcrypt.compare(Password, hashedPassword);

      if (passwordMatch) {
        // User authentication is successful; you can redirect to the dashboard here
        res.redirect('/dashboard');
      } else {
        res.send('Login failed');
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Login failed');
  }
});

  
 
app.get('/dashboard', async function (req, res) {
  try {
    // Extract the location parameter from the query string
    const location = req.query.location;

    // Initialize the searchResults array
    const searchResults = [];

    // Check if a search query was provided
    const query = req.query.query || '';

    // Perform the search based on the query using your data source (if needed)
    // Populate the searchResults array with the search results

    if (!location) {
      // If no location is provided, render the 'dashboard' view without weather data
      res.render('dashboard', { searchResults, weatherData: null });
      return;
    }

    // Fetch weather data using Axios
    const weatherOptions = {
      method: 'GET',
      url: 'https://weatherapi-com.p.rapidapi.com/current.json',
      params: { q: location },
      headers: {
        'X-RapidAPI-Key': 'e282716e65mshf7d0277032eb989p12bdcdjsn20e4bb8d16c5',
        'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
      }
    };

    const weatherResponse = await axios.request(weatherOptions);
    const weatherData = weatherResponse.data;

    // Render the 'dashboard' view with the search results and weather data
    res.render('dashboard', { searchResults, weatherData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
});



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
