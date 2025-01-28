const express = require('express');
const router = express.Router();
const { Event } = require('../models');

// Get all events
router.get('/all_events', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

// Create event
router.post('/create_event', async (req, res) => {
  try {
    const newEvent = await Event.create(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make sure to export the router
module.exports = router;
