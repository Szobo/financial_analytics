const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();

// Enable CORS for the frontend
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

const port = process.env.PORT || 3000;

// In-memory transaction storage (replace with a database in production)
const transactions = [];

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify M-PESA credentials
app.get("/api/test-credentials", async (req, res) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    return res.status(400).json({
      error: "Missing credentials",
      details: {
        hasConsumerKey: !!consumerKey,
        hasConsumerSecret: !!consumerSecret,
        hasShortcode: !!shortcode,
        hasPasskey: !!passkey
      }
    });
  }

  try {
    // Test 1: Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenRes = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${auth}` },
    });

    // Test 2: Generate password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    res.json({
      status: "success",
      message: "Credentials are valid",
      details: {
        accessToken: tokenRes.data.access_token,
        timestamp,
        password: password.substring(0, 10) + "..." // Only show part of the password for security
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to validate credentials",
      error: error.response?.data || error.message
    });
  }
});

// Step 1: Get Access Token
app.get("/api/token", async (req, res) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching token", error);
    res.status(500).send("Token error");
  }
});

// Step 2: Register URL for real-time transaction notifications
app.post("/api/register-url", async (req, res) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    // Get access token
    const tokenRes = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${auth}` },
    });
    const accessToken = tokenRes.data.access_token;

    // Register URL
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl",
      {
        ShortCode: shortcode,
        ResponseType: "Completed",
        ConfirmationURL: "https://your-domain.com/api/confirmation",
        ValidationURL: "https://your-domain.com/api/validation",
        Password: password,
        Timestamp: timestamp
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error registering URL:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Step 3: Handle incoming transaction notifications
app.post("/api/confirmation", (req, res) => {
  const transaction = {
    date: new Date().toISOString(),
    amount: req.body.TransAmount,
    msisdn: req.body.MSISDN,
    billRefNumber: req.body.BillRefNumber,
    transactionType: req.body.TransactionType,
    transID: req.body.TransID,
    transTime: req.body.TransTime
  };

  // Store the transaction
  transactions.unshift(transaction);
  
  // Send acknowledgment
  res.json({
    ResultCode: 0,
    ResultDesc: "Success"
  });
});

// Step 4: Validate incoming transactions
app.post("/api/validation", (req, res) => {
  // Add your validation logic here
  // For example, check if the amount is within acceptable limits
  const amount = parseFloat(req.body.TransAmount);
  
  if (amount > 0) {
    res.json({
      ResultCode: 0,
      ResultDesc: "Success"
    });
  } else {
    res.json({
      ResultCode: 1,
      ResultDesc: "Invalid amount"
    });
  }
});

// Step 5: Get all transactions
app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

// Step 6: Get transaction statistics
app.get("/api/statistics", (req, res) => {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const count = transactions.length;
  const average = count > 0 ? total / count : 0;
  
  res.json({
    total,
    count,
    average,
    lastTransaction: transactions[0] || null
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Health check available at: http://localhost:${port}/health`);
});
