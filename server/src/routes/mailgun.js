const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require("mailgun.js"); // mailgun.js v11.1.0
const { Request } = require("../models/Index");
require("dotenv").config();

async function sendSimpleMessageTemplate(customerName, songName, destinationEmail, orderId, cancelUrl, songImage) {
  const mailgun = new Mailgun(FormData);

  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY || "API_KEY",
  });

  // HTML template with variable replacement
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your order has been confirmed!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 40px 20px; text-align: center;">
                
                
                <!-- Song Image and Name Section -->
                <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                        <td style="text-align: center;">
                            <img src="${songImage}" alt="${songName}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                            <p style="color: #4A4A4A; font-size: 18px; font-weight: bold; margin: 0;">${songName}</p>
                        </td>
                    </tr>
                </table>
                
                <table role="presentation" style="width: 100%;">
                    <tr>
                        <td style="padding: 20px 0;">
                            <h1 style="color: #4A4A4A; font-size: 24px; margin: 0 0 20px 0;">Your order has been confirmed!</h1>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Hi, ${customerName}!</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">This is a confirmation of your request for the song "${songName}".</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Order ID#: ${orderId}</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">If you'd like to cancel your order, click the button below.</p>
                            
                            <!-- Bulletproof Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 4px; background-color: #4A4A4A;" bgcolor="#4A4A4A">
                                        <a href="${cancelUrl}" target="_blank" style="border: none; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 1.2; padding: 12px 24px; text-decoration: none; text-align: center; border-radius: 4px; -webkit-text-size-adjust: none;">Cancel My Song Request</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">In the case of any issues, contact damorosolima@gmail.com</p>

                            <img src="https://www.request-app.me/RequestLogoLight.png" alt="Request Logo" style="width: 200px; height: auto; margin-bottom: 20px;">
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  try {
    const data = await mg.messages.create("mg.request-app.me", {
      from: "Request App <postmaster@mg.request-app.me>",
      to: [`${customerName} <${destinationEmail}>`],
      subject: `Order Confirmation for "${songName}"`,
      html: htmlTemplate,
    });
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
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

    const songName = request.songName;
    const customerName = billing_details.name;
    const destinationEmail = billing_details.email;
    const requestId = request.requestId;
    const songImage = request.songImage;
    
    // Construct the cancel URL - replace with your actual domain and path
    const cancelUrl = `${process.env.API_BASE_URL}/requests/cancel-request/${requestId}`;

    // Send the email with all required parameters, including songImage
    await sendSimpleMessageTemplate(
      customerName,
      songName,
      destinationEmail,
      requestId,
      cancelUrl,
      songImage
    );

    res.status(201).json({
      message: "Order confirmation email sent successfully",
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

module.exports = router;