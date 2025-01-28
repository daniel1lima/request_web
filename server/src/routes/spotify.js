const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/status', function(req, res) {
  res.json({ status: 'Server is running', timestamp: new Date() });

    
  });

router.get('/auth', async function(req, res) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json({
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in
    });

  } catch (error) {
    console.error('Error getting token:', error.response?.data || error.message);
    res.status(400).json({
      error: 'Failed to get access token',
      details: error.response?.data || error.message
    });
  }
});

// Make sure to export the router
module.exports = router;
