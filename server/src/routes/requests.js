const express = require("express");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const router = express.Router();
const { Request, User, Event, Payment } = require("../models/Index");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Use environment variable for the secret key
if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not defined in environment variables");
}
const stripe = require("stripe")(stripeSecretKey); // Initialize Stripe with the secret key


/**
 * Route Handlers
 */

// Get all requests
router.get("/all", async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
      ],
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch requests",
      details: error.message,
    });
  }
});

// Get specific request by ID
router.get("/getById", async (req, res) => {
  try {
    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({
        error: "Missing request ID",
        details: "requestId query parameter is required",
      });
    }

    const request = await Request.findOne({
      where: { requestId },
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
      ],
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch request",
      details: error.message,
    });
  }
});

// Create new request
router.post("/create", async (req, res) => {
  try {
    const { songName, songArtist, songImage, userId, eventId, paymentId } =
      req.body;

    if (!songName || !songArtist || !eventId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newRequest = await Request.create({
      songName,
      songArtist,
      songImage,
      userId,
      eventId,
      paymentId,
      accepted: false,
      played: false,
      requestUpvotes: 0,
    });

    //console.log('New request created:', newRequest.toJSON());

    const fullRequest = await Request.findOne({
      where: { requestId: newRequest.requestId },
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
        { model: Payment, attributes: ["amount", "email"] },
      ],
    });

    if (!fullRequest) {
      console.error(
        "Failed to fetch created request with ID:",
        newRequest.requestId
      );
      return res
        .status(500)
        .json({ error: "Request created but failed to fetch details" });
    }

    res.status(201).json(fullRequest);

    if (eventClients.has(eventId)) {
      notifyEventClients(eventId, { type: "create", request: fullRequest });
    }
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({
      error: "Failed to create request",
      details: error.message,
    });
  }
});

// Accept a request
router.put("/accept", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { requestId } = req.query;
    //console.log('Attempting to accept request:', requestId);

    if (!requestId) {
      return res.status(400).json({
        error: "Missing request ID",
        details: "requestId query parameter is required",
      });
    }

    const request = await Request.findOne({ where: { requestId } });

    if (!request) {
      //console.log('Request not found:', requestId);
      return res.status(404).json({ error: "Request not found" });
    }

    await request.update({ accepted: true, status: "accepted" });

    const fullRequest = await Request.findOne({
      where: { requestId },
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
      ],
    });

    res.json(fullRequest);

    if (eventClients.has(request.eventId)) {
      notifyEventClients(request.eventId, {
        type: "update",
        request: fullRequest,
      });
    }
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({
      error: "Failed to accept request",
      details: error.message,
    });
  }
});

// Mark request as played
router.put("/played", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { requestId } = req.query;
    //console.log('Attempting to mark request as played:', requestId);

    if (!requestId) {
      return res.status(400).json({
        error: "Missing request ID",
        details: "requestId query parameter is required",
      });
    }

    const request = await Request.findOne({ where: { requestId } });

    if (!request) {
      //console.log('Request not found:', requestId);
      return res.status(404).json({ error: "Request not found" });
    }

    if (!request.accepted) {
      //console.log('Attempted to play unaccepted request:', requestId);
      return res.status(400).json({
        error: "Invalid operation",
        details: "Request must be accepted before it can be marked as played",
      });
    }

    await request.update({ played: true, status: "completed" });

    const fullRequest = await Request.findOne({
      where: { requestId },
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
      ],
    });

    res.json(fullRequest);

    if (eventClients.has(request.eventId)) {
      notifyEventClients(request.eventId, {
        type: "update",
        request: fullRequest,
      });
    }
  } catch (error) {
    console.error("Mark played error:", error);
    res.status(500).json({
      error: "Failed to mark request as played",
      details: error.message,
    });
  }
});

// Delete request
router.delete("/delete", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({
        error: "Missing request ID",
        details: "requestId query parameter is required",
      });
    }

    const request = await Request.findOne({ where: { requestId } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Try to cancel the payment intent, but continue even if it fails
    try {
      if (request.paymentId && !request.paymentId.startsWith("FREE_")) {
        await stripe.paymentIntents.cancel(`${request.paymentId}`);
      }
    } catch (stripeError) {
      console.error("Error cancelling Stripe payment intent:", stripeError);
      // Continue with request deletion despite Stripe error
    }

    const deletedRequest = {
      requestId: request.requestId,
      eventId: request.eventId,
    };

    await request.destroy();
    res.json({ message: "Request deleted successfully" });

    if (eventClients.has(request.eventId)) {
      notifyEventClients(request.eventId, {
        type: "delete",
        request: deletedRequest,
      });
    }
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({
      error: "Failed to delete request",
      details: error.message,
    });
  }
});

// Delete request
router.get("/cancel-request", async (req, res) => {
  try {
    const { requestId, pi } = req.query; // Changed from req.query to req.params

    console.log(req.query)

    if (!requestId) {
      return res.status(400).json({
        error: "Missing request ID",
        details: "requestId parameter is required",
      });
    }

    const request = await Request.findOne({ where: { requestId } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check if the request is already cancelled or completed
    if (request.status === "cancelled" || request.status === "completed") {
      return res.status(400).json({
        error: "Invalid request status",
        details: `Request is already ${request.status}`,
      });
    }

    try {
      if (!pi.startsWith("FREE_")) {
        await stripe.paymentIntents.cancel(`${pi}`);
      }
    } catch (error) {
      console.error("Error cancelling payment intent:", error);
      res.status(500).json({
        error: "Failed to cancelling payment intent",
        details: error.message,
      });
    }

    const deletedRequest = {
      requestId: request.requestId,
      eventId: request.eventId,
      status: "cancelled", // Add status to the deletedRequest object
    };

    // Update the request status to 'cancelled' instead of destroying it
    await request.update({ status: "cancelled" });

    res.json({
      message: "Request cancelled successfully",
      request: deletedRequest,
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({
      error: "Failed to cancel request",
      details: error.message,
    });
  }
});


// Get all requests for a specific event
router.get("/getByEvent", async (req, res) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        error: "Missing event ID",
        details: "eventId query parameter is required",
      });
    }

    const requests = await Request.findAll({
      where: { eventId }, // Assuming 'eventId' is the correct field
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
        { model: Payment, attributes: ["amount", "email"] },
      ],
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch requests for event",
      details: error.message,
    });
  }
});

router.get("/getByPid", async (req, res) => {
  const { pid } = req.query;

  try {
    const request = await Request.findOne({ where: { paymentId: pid } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update request status by payment ID
router.put("/update-status", async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "paymentId and status are required"
      });
    }

    // Find the request by payment ID
    const request = await Request.findOne({ where: { paymentId } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Update the request status
    await request.update({ status });

    // Get the updated request with related data
    const updatedRequest = await Request.findOne({
      where: { paymentId },
      include: [
        { model: User, attributes: ["userName"] },
        { model: Event, attributes: ["eventName"] },
      ],
    });

    res.json(updatedRequest);

    // Notify connected clients about the update
    if (eventClients.has(request.eventId)) {
      notifyEventClients(request.eventId, {
        type: "update",
        request: updatedRequest,
      });
    }
  } catch (error) {
    console.error("Update request status error:", error);
    res.status(500).json({
      error: "Failed to update request status",
      details: error.message,
    });
  }
});

module.exports = router;
