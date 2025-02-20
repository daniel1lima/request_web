const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require("mailgun.js"); // mailgun.js v11.1.0
require("dotenv").config();

async function sendSimpleMessageTemplate(customerName, songName, destinationEmail) {
  const mailgun = new Mailgun(FormData);

  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY || "API_KEY",
  });

  try {
    const data = await mg.messages.create("mg.request-app.me", {
      from: "Mailgun Sandbox <postmaster@mg.request-app.me>",
      to: ["Daniel <damorosolima@gmail.com>"],
      subject: "Hello Daniel",
      template: "request order confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        name: "test",
      }),
    });
    console.log(data); // logs response data
  } catch (error) {
    console.log(error); // logs any error
  }
}

router.post("/orderConfirmed", async (req, res) => {
  const { id, amount, billing_details, receipt_url, payment_intent } =
    req.body.data.object;

  try {
    console.log(id, amount, billing_details, receipt_url, payment_intent);

    const request = await Request.findOne({ where: { paymentId: payment_intent } });

    if (!request) {
    return res.status(404).json({ error: "Request not found" });
    }

    const songName = request.songName
    const customerName = billing_details.name
    const destinationEmail = billing_details.email
    const requestId = request.requestId
    const songImage = request.songImage

    // we also have amount and receipt_url
    


    sendSimpleMessageTemplate();

    res
      .status(201)
      .json({
        message: "Received the information from the webhook!",
        entry: req.body.data,
      });
  } catch (error) {
    console.error("Error adding entry to waitlist:", error);
    res.status(500).json({
      error: "Failed to add entry to waitlist",
      details: error.message,
    });
  }
});

module.exports = router;
