const express = require("express");
const router = express.Router();
const axios = require("axios");
const Waitlist = require('../models/Waitlist');
require('dotenv').config();

router.post("/", async (req, res) => {
  const { email, eventId, songRequested } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email, eventId, and song requested are required" });
  }

  try {
    const newEntry = await Waitlist.create({
      email,
      eventId,
      songRequested
    });

    res.status(201).json({ message: "Entry added to waitlist successfully!", entry: newEntry });
  } catch (error) {
    console.error("Error adding entry to waitlist:", error);
    res.status(500).json({ 
      error: "Failed to add entry to waitlist", 
      details: error.message 
    });
  }
});

router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Define common email domains
  const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
  
  // Extract the domain from the email
  const emailDomain = email.split("@")[1];

  // Check if the domain is in the list of common domains
  if (!commonDomains.includes(emailDomain)) {
    return res.status(400).json({ error: "Email domain is not allowed" });
  }

  try {
    const existingEntry = await Waitlist.findOne({ where: { email } });
    if (existingEntry) {
      return res.status(200).json({ exists: true });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Failed to check email" });
  }
});

router.post("/check-phone", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }


  try {
    const existingEntry = await Waitlist.findOne({ where: { email: phone } });
    if (existingEntry) {
      return res.status(200).json({ exists: true });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking phone number:", error);
    return res.status(500).json({ error: "Failed to check phone number" });
  }
});

module.exports = router;
