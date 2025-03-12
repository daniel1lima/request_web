const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const router = express.Router();
const { Event, DJ} = require('../models/Index');
const { Op } = require('sequelize');

// Get all events
router.get('/all', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

// Create an event
router.post('/create', ClerkExpressRequireAuth(), async (req, res) => {
  try {
      const { 
          eventName, 
          eventImage, 
          eventDateTime, 
          eventLocation, 
          requestFee, 
          djId 
      } = req.body;

      // Validate required fields
      if (!eventName || !eventDateTime || !eventLocation || !requestFee || !djId) {
          return res.status(400).json({ 
              error: 'Missing required fields' 
          });
      }

      // Verify DJ exists
      const djExists = await DJ.findByPk(djId);
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
          djId
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
        const { eventId } = req.query;

        if (!eventId) {
            return res.status(400).json({ 
                error: 'Missing event ID',
                details: 'eventId query parameter is required'
            });
        }

        const event = await Event.findOne({
            where: { eventId },
            include: [{ 
                model: DJ,
                attributes: ['djName', 'djEmail', 'djPhone', 'djInsta']
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
        const { djId } = req.query;

        if (!djId) {
            return res.status(400).json({ 
                error: 'Missing DJ ID',
                details: 'djId query parameter is required'
            });
        }

        const events = await Event.findAll({
            where: { djId },
            include: [{ 
                model: DJ,
                attributes: ['djName', 'djEmail', 'djPhone', 'djInsta']
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
router.put('/update', ClerkExpressRequireAuth(), async (req, res) => {
    console.log("Received body:", req.body); // Log the received body
    try {
        const { eventId } = req.query;
        const { eventName, eventImage, eventDateTime, eventLocation, requestFee, djId, acceptRequests, acceptFreeRequests, acceptEmailRequests } = req.body;

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

        // If djId is being updated, verify new DJ exists
        if (djId && djId !== event.djId) {
            const djExists = await DJ.findByPk(djId);
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
            djId: djId || event.djId,
            acceptRequests: acceptRequests !== undefined ? acceptRequests : event.acceptRequests,
            acceptFreeRequests: acceptFreeRequests !== undefined ? acceptFreeRequests : event.acceptFreeRequests,
            acceptEmailRequests: acceptEmailRequests !== undefined ? acceptEmailRequests : event.acceptEmailRequests
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
router.delete('/delete', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { eventId } = req.query;

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
                attributes: ['djName', 'djEmail', 'djPhone', 'djInsta']
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



// DJ MANAGEMENT

// Add a DJ to an event (many-to-many relationship)
router.put('/:eventId/add-dj', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { djId } = req.body;
    
    if (!eventId || !djId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'eventId and djId are required'
      });
    }
    
    // Find the event and DJ
    const event = await Event.findByPk(eventId);
    const dj = await DJ.findByPk(djId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    // Add the DJ to the event (assuming you have a EventDJs join table)
    await event.addDJ(dj);
    
    res.json({ message: 'DJ added to event successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add DJ to event',
      details: error.message 
    });
  }
});

// Get all DJs for an event
router.get('/:eventId/djs', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ 
        error: 'Missing event ID',
        details: 'eventId parameter is required'
      });
    }
    
    // Find the event with its associated DJs
    const event = await Event.findByPk(eventId, {
      include: [{ 
        model: DJ,
        through: { attributes: [] } // This excludes the join table attributes
      }]
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Return the DJs associated with the event
    res.json(event.DJs || []);
  } catch (error) {
    console.error('Error fetching event DJs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch event DJs',
      details: error.message 
    });
  }
});

// Remove a DJ from an event
router.delete('/:eventId/djs/:djId', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { eventId, djId } = req.params;
    const { checkForDelete } = req.query;
    
    if (!eventId || !djId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'eventId and djId are required'
      });
    }
    
    // Find the event and DJ
    const event = await Event.findByPk(eventId);
    const dj = await DJ.findByPk(djId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    // Check if this is the main DJ
    if (event.djId === djId) {
      return res.status(400).json({ 
        error: 'Cannot remove main DJ',
        details: 'The main DJ cannot be removed from the event'
      });
    }
    
    // Remove the DJ from the event
    await event.removeDJ(dj);

    if (checkForDelete) {
      await DJ.destroy({ where: { djId } });
    }
    
    res.json({ message: 'DJ removed from event successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to remove DJ from event',
      details: error.message 
    });
  }
});

// Set the active DJ for an event
router.put('/:eventId/active-dj', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { djId } = req.body;
    
    if (!eventId || !djId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'eventId and djId are required'
      });
    }
    
    // Find the event
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Find the DJ
    const dj = await DJ.findByPk(djId);
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    // Check if the DJ is associated with this event
    const isDJAssociated = await event.hasDJ(dj);
    
    if (!isDJAssociated && event.djId !== djId) {
      return res.status(400).json({ 
        error: 'DJ not associated with event',
        details: 'The DJ must be associated with the event to be set as active'
      });
    }
    
    // Update the event with the new active DJ
    await event.update({ currentDjId: djId });
    
    res.json({ 
      message: 'Active DJ updated successfully',
      event: {
        eventId: event.eventId,
        currentDjId: event.currentDjId
      }
    });
  } catch (error) {
    console.error('Error setting active DJ:', error);
    res.status(500).json({ 
      error: 'Failed to set active DJ',
      details: error.message 
    });
  }
});

module.exports = router;
