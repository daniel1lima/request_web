const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const router = express.Router();
const axios = require('axios');
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

router.get('/:paymentId', async (req, res) => {
  const { paymentId } = req.params; // Extract paymentId from request parameters

  console.log(`Fetching payment with ID: ${paymentId}`); // Log the paymentId being queried

  try {
    const payment = await Payment.findOne({ where: { paymentId: paymentId } }); // Query the database for the payment

    console.log('Payment found:', payment); // Log the payment found (or null if not found)

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' }); // Handle case where payment is not found
    }

    res.status(200).json(payment); // Respond with the found payment
  } catch (error) {
    console.error('Error retrieving payment:', error);
    res.status(500).json({ error: 'Failed to retrieve payment', details: error.message });
  }
});

module.exports = router;