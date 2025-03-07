const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require("mailgun.js"); // mailgun.js v11.1.0
const { Request, Payment } = require("../models/Index");

require("dotenv").config();

async function sendSimpleMessageTemplate(
  customerName,
  songName,
  destinationEmail,
  orderId,
  cancelUrl,
  songImage
) {
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
      from: "Request App <no-reply@mg.request-app.me>",
      to: [`${customerName} <${destinationEmail}>`],
      subject: `Request Confirmation for "${songName}"`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

async function sendDeclinedRequestTemplate(
  customerName,
  songName,
  destinationEmail,
  orderId,
  songImage
) {
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
    <title>Your song request has been declined</title>
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
                            <h1 style="color: #4A4A4A; font-size: 24px; margin: 0 0 20px 0;">Your song request has been declined</h1>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Hi, ${customerName}!</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">We regret to inform you that your request for the song "${songName}" has been declined.</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Order ID#: ${orderId}</p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">The payment authorization will be released from your account within 5-7 business days.</p>
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
      from: "Request App <no-reply@mg.request-app.me>",
      to: [`${customerName} <${destinationEmail}>`],
      subject: `Your Request for "${songName}" Has Been Declined`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    console.error("Error sending declined request email:", error);
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

    await Payment.update({ email: billing_details.email }, { where: { paymentId: payment_intent } });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const songName = request.songName;
    const customerName = billing_details.name;
    const destinationEmail = billing_details.email;
    const requestId = request.requestId;
    const songImage = request.songImage;

    // Construct the cancel URL - replace with your actual domain and path
    const cancelUrl = `${process.env.API_BASE_URL}/cancel-request?requestId=${requestId}&pi=${payment_intent}`;

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

router.post("/freeOrderConfirmed", async (req, res) => {
  const {email, freePaymentId } = req.body;

  try {

    const request = await Request.findOne({
      where: { paymentId: freePaymentId },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const songName = request.songName;
    const customerName = email
    const destinationEmail = email
    const requestId = request.requestId;
    const songImage = request.songImage;

    // Construct the cancel URL - replace with your actual domain and path
    const cancelUrl = `${process.env.API_BASE_URL}/cancel-request?requestId=${requestId}&pi=${freePaymentId}`;

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

    // Find payment to get customer email
    const payment = await Payment.findOne({
      where: { paymentId: paymentId },
    });

    let destinationEmail, customerName;
    
    // Check if payment exists and has email
    if (payment && payment.email) {
      destinationEmail = payment.email;
      customerName = payment.email.split('@')[0]; // Fallback if name not available
    } else {
      // If payment doesn't exist or doesn't have email, check if request has customer info
      if (request.customerEmail) {
        destinationEmail = request.customerEmail;
        customerName = request.customerName || request.customerEmail.split('@')[0];
      } else {
        return res.status(400).json({ error: "No customer email found for notification" });
      }
    }

    const songName = request.songName;
    const songImage = request.songImage;

    // Send the declined notification email
    await sendDeclinedRequestTemplate(
      customerName,
      songName,
      destinationEmail,
      requestId,
      songImage
    );

    res.status(200).json({
      message: "Request declined email sent successfully",
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

module.exports = router;
