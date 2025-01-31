const express = require('express');
const router = express.Router();
const axios = require('axios');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Use environment variable for the secret key
if (!stripeSecretKey) {
  throw new Error('Stripe secret key is not defined in environment variables');
}
const stripe = require('stripe')(stripeSecretKey); // Initialize Stripe with the secret key
const Payment = require('../models/Payment'); // Import the Payment model


router.get('/status', async (req, res) => {
    try {
      res.status(200).json({ status: 'OK' });
    } catch (error) {
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Failed to check status', details: error.message });
    }
  });

router.post('/createPayment', async (req, res) => {
  const { paymentId, amount, djId = null } = req.body; // Extract data from request body with default djId set to null

  try {
    const newPayment = await Payment.create({
      paymentId: paymentId,
      amount: amount,
      djId: djId,
    });

    

    res.status(201).json(newPayment); // Respond with the created payment
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

module.exports = router;