const express = require('express');
const router = express.Router();
const { Event, DJ} = require('../models/Index');
const { Op } = require('sequelize');

// Get all events
router.get('/all', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});


// Create an event
router.post('/create', async (req, res) => {
  try {
      const { 
          eventName, 
          eventImage, 
          eventDateTime, 
          eventLocation, 
          requestFee, 
          DJID 
      } = req.body;

      // Validate required fields
      if (!eventName || !eventDateTime || !eventLocation || !requestFee || !DJID) {
          return res.status(400).json({ 
              error: 'Missing required fields' 
          });
      }

      // Verify DJ exists
      const djExists = await DJ.findByPk(DJID);
      if (!djExists) {
          return res.status(404).json({ 
              error: 'DJ not found' 
          });
      }

      // Create the event
      const newEvent = await Event.create({
          eventName,
          eventImage,
          eventDateTime,
          eventLocation,
          requestFee,
          DJID
      });

      res.status(201).json(newEvent);
  } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ 
          error: 'Failed to create event',
          details: error.message 
      });
  }
});

// Get event by ID
router.get('/getById', async (req, res) => {
    try {
        const eventId = parseInt(req.query.eventId, 10);

        if (!eventId) {
            return res.status(400).json({ 
                error: 'Missing event ID',
                details: 'eventId query parameter is required'
            });
        }

        const event = await Event.findOne({
            where: { eventID: eventId },
            include: [{ 
                model: DJ,
                attributes: ['DJName', 'DJEmail', 'DJPhone', 'DJInsta']
            }]
        });

        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                details: `No event found with ID ${eventId}`
            });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            error: 'Failed to fetch event',
            details: error.message 
        });
    }
});

// Get all events for a specific DJ
router.get('/getByDj', async (req, res) => {
    try {
        const djId = parseInt(req.query.djId, 10);

        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const events = await Event.findAll({
            where: { DJID: djId },
            include: [{ 
                model: DJ,
                attributes: ['DJName', 'DJEmail', 'DJPhone', 'DJInsta']
            }]
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching DJ events:', error);
        res.status(500).json({ 
            error: 'Failed to fetch DJ events',
            details: error.message 
        });
    }
});

// Update event details
router.put('/update', async (req, res) => {
    try {
        const eventId = parseInt(req.query.eventId, 10);
        const { eventName, eventImage, eventDateTime, eventLocation, requestFee, DJID } = req.body;

        if (!eventId) {
            return res.status(400).json({ 
                error: 'Missing event ID',
                details: 'eventId query parameter is required'
            });
        }

        const event = await Event.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                details: `No event found with ID ${eventId}`
            });
        }

        // If DJID is being updated, verify new DJ exists
        if (DJID && DJID !== event.DJID) {
            const djExists = await DJ.findByPk(DJID);
            if (!djExists) {
                return res.status(404).json({ 
                    error: 'DJ not found' 
                });
            }
        }

        await event.update({
            eventName: eventName || event.eventName,
            eventImage: eventImage || event.eventImage,
            eventDateTime: eventDateTime || event.eventDateTime,
            eventLocation: eventLocation || event.eventLocation,
            requestFee: requestFee || event.requestFee,
            DJID: DJID || event.DJID
        });

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            error: 'Failed to update event',
            details: error.message 
        });
    }
});

// Delete an event
router.delete('/delete', async (req, res) => {
    try {
        const eventId = parseInt(req.query.eventId, 10);

        if (!eventId) {
            return res.status(400).json({ 
                error: 'Missing event ID',
                details: 'eventId query parameter is required'
            });
        }

        const event = await Event.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ 
                error: 'Event not found',
                details: `No event found with ID ${eventId}`
            });
        }

        await event.destroy();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            error: 'Failed to delete event',
            details: error.message 
        });
    }
});

// Get upcoming events
router.get('/getUpcoming', async (req, res) => {
    try {
        const events = await Event.findAll({
            where: {
                eventDateTime: {
                    [Op.gt]: new Date() // Only get future events
                }
            },
            include: [{ 
                model: DJ,
                attributes: ['DJName', 'DJEmail', 'DJPhone', 'DJInsta']
            }],
            order: [['eventDateTime', 'ASC']] // Sort by date ascending
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ 
            error: 'Failed to fetch upcoming events',
            details: error.message 
        });
    }
});

// Make sure to export the router
module.exports = router;
