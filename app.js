const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Parse form data
app.use(express.urlencoded({ extended: true })); 

// Set up static file serving for UIkit CSS and JS
app.use('/css', express.static(path.join(__dirname, 'node_modules/uikit/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/uikit/dist/js')));

// Define a route for the root URL ("/") to render the landing page
app.get('/', (req, res) => {
    res.render('landing'); // Render the landing.ejs template
});


// Routes
app.get('/potd', (req, res) => {
    res.render('potd', { data: null });
  });
  
  app.post('/apod', async (req, res) => {
    const selectedDate = req.body.date;
    try {
      // Make a request to the NASA APOD API for the selected date
      const response = await axios.get('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: 'kAKd9hbHpNiKB04x4th0bFL0aQTUs6ScRwg0rGHd',
          date: selectedDate, // Use the selected date
        },
      });
  
      const data = response.data;
  
      // Render the APOD image using EJS template
      res.render('potd', { data });
    } catch (error) {
      console.error(error);
      // Render custom error page
      res.status(500).render('error', {
        message: 'There was an error retrieving data from the NASA API.'
      });
    }
  
  });

// Define a route to fetch data from the NASA Mars API with pagination, Earth date filtering, and rover selection
app.get('/mars', async (req, res) => {
    try {
        const apiKey = 'kAKd9hbHpNiKB04x4th0bFL0aQTUs6ScRwg0rGHd'; // Replace with your NASA API key
        const page = req.query.page || 1;
        const itemsPerPage = 16;
        const selectedEarthDate = req.query.date || ''; // Get the selected Earth date from query params
        const selectedRover = req.query.rover || 'curiosity'; // Get the selected rover from query params

        // Build the API URL with Earth date filtering and rover selection for photos
        let photosApiUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${selectedRover}/photos?api_key=${apiKey}&page=${page}`;

        if (selectedEarthDate) {
            photosApiUrl += `&earth_date=${selectedEarthDate}`;
        }

        // Build the API URL to retrieve rover information
        const roverInfoApiUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${selectedRover}?api_key=${apiKey}`;

        // Make parallel requests to retrieve photos and rover information
        const [photosResponse, roverInfoResponse] = await Promise.all([
            axios.get(photosApiUrl),
            axios.get(roverInfoApiUrl),
        ]);

        const marsData = photosResponse.data;
        const roverInfo = roverInfoResponse.data;

        // Calculate total pages based on the number of photos and items per page
        const totalPages = Math.ceil(marsData.photos.length / itemsPerPage);

        // Get photos for the current page
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = page * itemsPerPage;
        const photosForPage = marsData.photos.slice(startIndex, endIndex);

        // Render the data using the gallery.ejs template and pass pagination info, rover info, and selected rover
        res.render('gallery', {
            photos: photosForPage,
            totalPages,
            currentPage: parseInt(page),
            selectedEarthDate,
            selectedRover,
            roverInfo,
        });
    } catch (error) {
        res.status(500).send('Error fetching data from NASA API');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});