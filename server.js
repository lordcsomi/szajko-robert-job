const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');

const app = express();

// Apply security headers with custom CSP to allow Google Maps iframe
// Detect Facebook crawler
app.use((req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  if (userAgent.includes('facebookexternalhit') || userAgent.includes('Facebot')) {
    // Ensure full content delivery for Facebook crawler
    res.setHeader('Accept-Ranges', 'none');
    res.setHeader('Cache-Control', 'no-transform');
  }
  next();
});

// Configure security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        frameSrc: ["'self'", "https://maps.google.com", "https://*.google.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://maps.gstatic.com",
          "https://*.fbcdn.net",
          "https://*.facebook.com"
        ],
        connectSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://*.facebook.com"
        ],
        fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

// Enable CORS for Facebook crawler
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.facebook.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

// Serve static files from 'public'
app.use(express.static('public'));


// Serve images from the 'images' directory
app.use(
  '/images',
  express.static('images', {
    maxAge: '1d', // Cache image files for 1 day
  })
);

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Serve sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// API endpoint to list images
app.get('/api/images', (req, res) => {
  console.log('Received request for image list at /api/images');

  const imagesDir = path.join(__dirname, 'images');
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error('Error reading images directory:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Filter for image files only
    const imageFiles = files.filter((file) =>
      ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(
        path.extname(file).toLowerCase()
      )
    );
    console.log(
      `Found ${imageFiles.length} image files in /images directory:`,
      imageFiles
    );

    res.json(imageFiles);
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
