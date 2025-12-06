const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Test email connection (SMTP & IMAP)
router.get('/test', emailController.testConnection);

// Check inbox for new emails
router.post('/check', emailController.checkInbox);

// Get all received emails from cache
router.get('/received', emailController.getReceivedEmails);

// Process an email into a proposal
router.post('/process/:emailId', emailController.processEmail);

// Simulate receiving an email (for testing)
router.post('/simulate', emailController.simulateReceive);

// Link an email to an RFP manually
router.put('/link/:emailId', emailController.linkEmailToRFP);

module.exports = router;
