const express = require('express');
const router = express.Router();
const { Event } = require('../models');

// Get all events
router.get('/', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

// Create event
router.post('/', async (req, res) => {
  try {
    const newEvent = await Event.create(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other routes (GET by ID, PUT, DELETE) follow similarly...