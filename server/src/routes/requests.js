const express = require('express');
const router = express.Router();
const { Request } = require('../models');

// Get all events
router.get('/all_events', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

// Make sure to export the router
module.exports = router;
