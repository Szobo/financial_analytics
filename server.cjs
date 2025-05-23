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

// Helper: Get M-PESA Access Token
async function getMpesaAccessToken() {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = (process.env.BASE_URL || "https://api.safaricom.co.ke") + "/oauth/v1/generate?grant_type=client_credentials";
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get M-PESA access token:", error.response?.data || error.message);
    throw new Error("Failed to get M-PESA access token");
  }
}

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

// Webhook: Confirmation
app.post("/api/confirmation", (req, res) => {
  console.log("CONFIRMATION RECEIVED:", req.body);
  transactions.unshift({ ...req.body, receivedAt: new Date().toISOString() });
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// Webhook: Validation
app.post("/api/validation", (req, res) => {
  console.log("VALIDATION RECEIVED:", req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// Register webhook URLs with Safaricom
app.get("/api/register-url", async (req, res) => {
  try {
    const accessToken = await getMpesaAccessToken();
    const payload = {
      ShortCode: process.env.SHORTCODE || process.env.TILL_NUMBER,
      ResponseType: "Completed",
      ConfirmationURL: `${process.env.PUBLIC_URL || "https://your-backend.onrender.com"}/api/confirmation`,
      ValidationURL: `${process.env.PUBLIC_URL || "https://your-backend.onrender.com"}/api/validation`
    };
    const url = (process.env.BASE_URL || "https://api.safaricom.co.ke") + "/mpesa/c2b/v1/registerurl";
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    res.status(200).json({ message: "Registered!", data: response.data });
  } catch (error) {
    console.error("Registration Error", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to register" });
  }
});

// Endpoint to get all stored transactions (for frontend)
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
