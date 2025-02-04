const express = require("express");
const router = express.Router();
const axios = require("axios");
require('dotenv').config();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Use environment variable for the secret key
if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not defined in environment variables");
}
const stripe = require("stripe")(stripeSecretKey); // Initialize Stripe with the secret key

router.get("/status", async (req, res) => {
  try {
    res.status(200).json({ status: "OK" });
  } catch (error) {
    console.error("Error checking status:", error);
    res
      .status(500)
      .json({ error: "Failed to check status", details: error.message });
  }
});

router.post("/createPaymentIntent", async (req, res) => {
  const { currency, amount, requestId } = req.query;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: "manual",
      metadata: {
        song_request_id: requestId, // Link to your song request
      },
    });
    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res
      .status(500)
      .json({
        error: "Failed to create payment intent",
        details: error.message,
      });
  }
});

// 1. Create payment intent once the user opens the portal
// 2. We save the intent id
// 3. We Confirm payment with the intent id -> If this comes back OK
// 4. We save the request with the intent ID so that it can be later captured (all payment intents have capture method manual)
// 5. Once the DJ accepts the request we {https://docs.stripe.com/api/payment_intents/capture} capture or decline the payment intent

// Cancel all payment intents once the event is over.

router.post("/capturePaymentIntent", async (req, res) => {
  const { intentId, capture } = req.query;

  try {
    const paymentIntentCapture = await stripe.paymentIntents.capture(intentId, {
      amount_to_capture: capture,
    });

    res.status(200).json(paymentIntentCapture);
  } catch (error) {
    console.error("Error capturing payment intent:", error);
    res
      .status(500)
      .json({
        error: "Failed to capturing payment intent",
        details: error.message,
      });
  }
});


router.post("/cancelPaymentIntent", async (req, res) => {
  const { intentId } = req.query;

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(
      `${intentId}`
    );

    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error("Error cancelling payment intent:", error);
    res
      .status(500)
      .json({
        error: "Failed to cancelling payment intent",
        details: error.message,
      });
  }
});

module.exports = router;
