const express = require("express");
const router = express.Router();
const axios = require("axios");
require('dotenv').config();

router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  

  try {
    console.log(process.env.EMAILOCTOPUS_KEY)
    console.log(process.env.LIST_ID)

    
    const response = await axios.post(
      `https://emailoctopus.com/api/1.6/lists/${process.env.LIST_ID}/contacts`,
      {
        api_key: process.env.EMAILOCTOPUS_KEY,
        email_address: email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      res.status(200).json({ message: "Email submitted successfully!" });
    } else {
      res.status(response.status).json({ 
        error: response.data.error.message || "Failed to submit email!" 
      });
    }
  } catch (error) {
    console.error("Error submitting email:", error);
    res.status(500).json({ 
      error: "Failed to submit email", 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

module.exports = router;
