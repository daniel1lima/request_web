const express = require("express");
const router = express.Router();
const { Request, Payment } = require("../models/Index");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const { Op } = require("sequelize");

require("dotenv").config();

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const client = require('twilio')(accountSid, authToken);

// Format phone number to E.164 format
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Add + prefix if not present
  if (digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  } else {
    // Assume US/Canada number if no country code
    return `+1${digitsOnly}`;
  }
}

async function sendConfirmationSMS(customerName, songName, phoneNumber, orderId, paymentId) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const message = await client.messages.create({
      body: `Hi ${customerName}! 🎶 Your request for "${songName}" has been confirmed.\n\n` +
            `Order ID: ${orderId}\n\n` +
            `🔹 Your song will only appear in the queue *once the DJ accepts* your request.\n\n` +
            `🔹 To cancel, reply with "1" or check your confirmation message.\n\n` +
            `🔹 You will *not* be charged until your request is played, *if this is a paid request, don't worry if not.*.\n\n` +
            `📌 By submitting a request, you agree to our Terms of Service & Refund Policy.\n\n` +
            `Questions? Contact help.request.van@gmail.com`,
      messagingServiceSid: messagingServiceSid,
      to: formattedPhone
    });
    
    console.log(`SMS sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Error sending confirmation SMS:", error);
    throw error;
  }
}

async function sendDeclinedRequestSMS(customerName, songName, phoneNumber, orderId) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const message = await client.messages.create({
      body: `Hi ${customerName}, we regret to inform you that your request for "${songName}" has been declined.\n\n` +
            `Order ID: ${orderId}\n\n` +
            `💳 The payment authorization will be released from your account within *5-7 business days*.\n\n` +
            `Questions? Contact help.request.van@gmail.com`,
      messagingServiceSid: messagingServiceSid,
      to: formattedPhone
    });
    
    console.log(`SMS sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Error sending declined request SMS:", error);
    throw error;
  }
}

router.post("/orderConfirmed", async (req, res) => {
  const { id, amount, billing_details, receipt_url, payment_intent } =
    req.body.data.object;

  try {
    console.log(id, amount, billing_details, receipt_url, payment_intent);

    const request = await Request.findOne({
      where: { paymentId: payment_intent },
    });

    // Update payment with phone number instead of email
    const updateResult = await Payment.update({ phone: billing_details.phone, email: billing_details.email }, { where: { paymentId: payment_intent } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    console.log(`Payment update result: ${JSON.stringify(updateResult)}`);

    const songName = request.songName;
    const customerName = billing_details.name || "Customer";
    const phoneNumber = billing_details.phone;
    const requestId = request.requestId;

    // Send SMS confirmation
    await sendConfirmationSMS(
      customerName,
      songName,
      phoneNumber,
      requestId,
      payment_intent
    );

    res.status(201).json({
      message: "Order confirmation SMS sent successfully",
      entry: req.body.data,
    });
  } catch (error) {
    console.error("Error processing order confirmation:", error);
    res.status(500).json({
      error: "Failed to process order confirmation",
      details: error.message,
    });
  }
});

router.post("/freeOrderConfirmed", async (req, res) => {
  const { phone, freePaymentId } = req.body;

  try {
    const request = await Request.findOne({
      where: { paymentId: freePaymentId },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const songName = request.songName;
    const customerName = "Customer";
    const phoneNumber = phone;
    const requestId = request.requestId;

    // Send SMS confirmation
    await sendConfirmationSMS(
      customerName,
      songName,
      phoneNumber,
      requestId,
      freePaymentId
    );

    res.status(201).json({
      message: "Order confirmation SMS sent successfully",
      entry: req.body,
    });
  } catch (error) {
    console.error("Error processing order confirmation:", error);
    res.status(500).json({
      error: "Failed to process order confirmation",
      details: error.message,
    });
  }
});

router.post("/requestDeclined", async (req, res) => {
  const { requestId, paymentId } = req.body;

  try {
    // Find the request in the database
    const request = await Request.findOne({
      where: { requestId: requestId, paymentId: paymentId },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Find payment to get customer phone
    const payment = await Payment.findOne({
      where: { paymentId: paymentId },
    });

    let phoneNumber, customerName;
    
    // Check if payment exists and has phone
    if (payment && payment.phone) {
      phoneNumber = payment.phone;
      customerName = "Customer"; // Fallback if name not available
    } else {
      // If payment doesn't exist or doesn't have phone, check if request has customer info
      if (request.customerPhone) {
        phoneNumber = request.customerPhone;
        customerName = request.customerName || "Customer";
      } else {
        return res.status(400).json({ error: "No customer phone found for notification" });
      }
    }

    const songName = request.songName;

    // Send the declined notification SMS
    // await sendDeclinedRequestSMS(
    //   customerName,
    //   songName,
    //   phoneNumber,
    //   requestId
    // );

    res.status(200).json({
      message: "Request declined SMS sent successfully",
      requestId: requestId
    });
  } catch (error) {
    console.error("Error processing declined request notification:", error);
    res.status(500).json({
      error: "Failed to process declined request notification",
      details: error.message,
    });
  }
});

// Handle SMS replies for cancellation
router.post("/sms-webhook", async (req, res) => {
  // Make sure we're using the right body parser for Twilio webhooks
  console.log("Received SMS webhook:", req.body);
  
  const twiml = new MessagingResponse();
  
  try {
    // Check if req.body exists and has the expected properties
    if (!req.body || !req.body.Body || !req.body.From) {
      console.error("Missing required fields in webhook:", req.body);
      twiml.message("We encountered an issue processing your request. Please contact customer support at damorosolima@gmail.com for assistance.");
      res.type('text/xml').send(twiml.toString());
      return;
    }
    
    const { Body, From } = req.body;
    console.log(`Received SMS - Body: "${Body}", From: ${From}`);
    
    // Access the incoming text content
    const incomingMessage = Body.toLowerCase().trim();
    
    // Find all payments for this phone number
    const payments = await Payment.findAll({
      where: { phone: From },
      order: [['createdAt', 'DESC']]
    });
    
    // If no payments found
    if (!payments || payments.length === 0) {
      twiml.message("We couldn't find any requests associated with your phone number. Please contact customer support at damorosolima@gmail.com for assistance.");
      res.type('text/xml').send(twiml.toString());
      return;
    }
    
    // Get all active requests for this user
    const activeRequests = [];
    
    for (const payment of payments) {
      const request = await Request.findOne({
        where: { 
          paymentId: payment.paymentId,
          status: {
            [Op.notIn]: ['cancelled', 'completed', 'fulfilled']
          }
        }
      });
      
      if (request) {
        activeRequests.push({
          request,
          payment
        });
      }
    }
    
    // STEP 1: User sends "1" to initiate cancellation
    if (incomingMessage === "1") {
      if (activeRequests.length === 0) {
        twiml.message("You don't have any active requests to cancel. If you need assistance, please contact customer support at damorosolima@gmail.com.");
      } 
      else if (activeRequests.length === 1) {
        // If there's only one request, confirm cancellation directly
        const item = activeRequests[0];
        
        try {
          const axios = require('axios');
          const baseUrl = process.env.BASE_URL;
          
          const cancelResponse = await axios.get(`${baseUrl}/requests/cancel-request`, {
            params: {
              requestId: item.request.requestId,
              pi: item.payment.paymentId
            }
          });
          
          if (cancelResponse.status === 200) {
            // Update request status
            await Request.update(
              { status: 'cancelled' },
              { where: { requestId: item.request.requestId } }
            );
            
            twiml.message(`Your request for "${item.request.songName}" has been cancelled. Your payment authorization will be released within 5-7 business days.`);
          } else {
            twiml.message(`We encountered an issue cancelling your request. Please contact customer support at damorosolima@gmail.com for assistance.`);
            console.error("Unexpected response from cancel endpoint:", cancelResponse.data);
          }
        } catch (cancelError) {
          console.error("Error calling cancel endpoint:", cancelError);
          twiml.message(`We encountered an issue cancelling your request. Please contact customer support at damorosolima@gmail.com for assistance.`);
        }
      } 
      else {
        // For multiple requests, list them all with numbers STARTING FROM 2
        let message = "You have multiple active requests. Reply with the number of the request you want to cancel:\n\n";
        activeRequests.forEach((item, index) => {
          message += `${index + 2}. "${item.request.songName}"\n`;
        });
        message += "\nReply with '1' at any time to cancel this operation.";
        twiml.message(message);
      }
    }
    // STEP 2: User selects which request to cancel by number (now starting from 2)
    else if (/^[2-9]\d*$/.test(incomingMessage)) {
      const selectionIndex = parseInt(incomingMessage, 10) - 2; // Adjust for our offset
      
      if (selectionIndex >= 0 && selectionIndex < activeRequests.length) {
        // User selected a valid request by number
        const selectedItem = activeRequests[selectionIndex];
        
        try {
          const axios = require('axios');
          const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
          
          const cancelResponse = await axios.get(`${baseUrl}/api/requests/cancel-request`, {
            params: {
              requestId: selectedItem.request.requestId,
              pi: selectedItem.payment.paymentId
            }
          });
          
          if (cancelResponse.status === 200) {
            // Update request status
            await Request.update(
              { status: 'cancelled' },
              { where: { requestId: selectedItem.request.requestId } }
            );
            
            twiml.message(`Your request for "${selectedItem.request.songName}" has been cancelled. Your payment authorization will be released within 5-7 business days.`);
          } else {
            twiml.message(`We encountered an issue cancelling your request. Please contact customer support at damorosolima@gmail.com for assistance.`);
            console.error("Unexpected response from cancel endpoint:", cancelResponse.data);
          }
        } catch (cancelError) {
          console.error("Error calling cancel endpoint:", cancelError);
          twiml.message(`We encountered an issue cancelling your request. Please contact customer support at damorosolima@gmail.com for assistance.`);
        }
      } else {
        // Invalid selection number
        if (activeRequests.length === 0) {
          twiml.message("You don't have any active requests to cancel. If you need assistance, please contact customer support at damorosolima@gmail.com.");
        } else {
          // Show the list of requests again
          let message = `Invalid selection. Reply with a number between 2 and ${activeRequests.length + 1}:\n\n`;
          activeRequests.forEach((item, index) => {
            message += `${index + 2}. "${item.request.songName}"\n`;
          });
          message += "\nReply with '1' at any time to cancel this operation.";
          twiml.message(message);
        }
      }
    }
    // For any other reply
    else {
      twiml.message("To cancel a request, reply with \"1\". For other assistance, contact damorosolima@gmail.com.");
    }
    
    // Send the response in the format Twilio expects
    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error("Error handling SMS reply:", error);
    // Even in case of error, send a TwiML response
    twiml.message("Sorry, we encountered an error processing your request. Please contact customer support at damorosolima@gmail.com.");
    res.type('text/xml').send(twiml.toString());
  }
});

module.exports = router;
