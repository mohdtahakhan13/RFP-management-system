const EmailService = require('../services/emailService');
const AIService = require('../services/aiService');
const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');

// Test email connection
exports.testConnection = async (req, res) => {
    try {
        const results = await EmailService.testConnection();
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Check inbox for new emails
exports.checkInbox = async (req, res) => {
    try {
        const emails = await EmailService.checkInbox();
        res.json({
            success: true,
            data: emails,
            count: emails.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all received emails (from MongoDB)
exports.getReceivedEmails = async (req, res) => {
    try {
        const emails = await EmailService.getReceivedEmails();
        res.json({
            success: true,
            data: emails,
            count: emails.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Process an email into a proposal
exports.processEmail = async (req, res) => {
    try {
        const { emailId } = req.params;

        // Decode the emailId (in case it was URL encoded)
        const decodedEmailId = decodeURIComponent(emailId);
        console.log(`📧 Processing email: ${decodedEmailId}`);

        // Find the email in MongoDB
        const emails = await EmailService.getReceivedEmails();
        console.log(`📧 Found ${emails.length} emails in database`);

        // Try multiple matching strategies
        let email = emails.find(e => e.messageId === decodedEmailId);

        // If not found, try matching by UID (for simulated emails)
        if (!email) {
            email = emails.find(e => String(e.uid) === decodedEmailId || e.messageId === emailId);
        }

        // Log available emails for debugging
        if (!email) {
            console.log('📧 Available email IDs:', emails.map(e => e.messageId));
            return res.status(404).json({
                success: false,
                error: 'Email not found in cache. Try refreshing the emails list.'
            });
        }

        // Check if RFP ID is present
        if (!email.rfpId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot determine RFP ID from email. Please link manually.'
            });
        }

        // Find the RFP
        const rfp = await RFP.findById(email.rfpId);
        if (!rfp) {
            return res.status(404).json({
                success: false,
                error: 'RFP not found'
            });
        }

        // Find or create vendor based on email address
        let vendor = await Vendor.findOne({ email: email.from });
        if (!vendor) {
            vendor = new Vendor({
                name: email.fromName || email.from.split('@')[0],
                email: email.from,
                company: email.fromName || 'Unknown Company',
                category: 'General'
            });
            await vendor.save();
            console.log(`✅ Created new vendor: ${vendor.name}`);
        }

        // Use AI to parse the email content
        const emailContent = {
            subject: email.subject,
            body: email.text || email.html
        };

        console.log('📧 Parsing email with AI...');
        const parsedData = await AIService.parseVendorResponse(emailContent, rfp);
        console.log('✅ AI parsing complete');

        // Normalize recommendation to lowercase to match schema enum
        if (parsedData.analysis && parsedData.analysis.recommendation) {
            parsedData.analysis.recommendation = parsedData.analysis.recommendation.toLowerCase();
            // Ensure it's a valid enum value
            if (!['high', 'medium', 'low'].includes(parsedData.analysis.recommendation)) {
                parsedData.analysis.recommendation = 'medium'; // Default fallback
            }
        }

        // Check if proposal already exists
        const existingProposal = await Proposal.findOne({
            rfpId: rfp._id,
            vendorId: vendor._id
        });

        if (existingProposal) {
            // Update existing proposal
            existingProposal.structuredData = parsedData.proposalData;
            existingProposal.aiAnalysis = parsedData.analysis;
            existingProposal.emailSource = {
                messageId: email.messageId,
                receivedAt: email.date,
                subject: email.subject
            };
            existingProposal.status = 'received';
            await existingProposal.save();

            // Mark email as processed
            await EmailService.markEmailProcessed(decodedEmailId);

            return res.json({
                success: true,
                message: 'Proposal updated from email',
                data: existingProposal
            });
        }

        // Create new proposal
        const proposal = new Proposal({
            rfpId: rfp._id,
            vendorId: vendor._id,
            structuredData: parsedData.proposalData,
            aiAnalysis: parsedData.analysis,
            emailSource: {
                messageId: email.messageId,
                receivedAt: email.date,
                subject: email.subject
            },
            status: 'received'
        });

        await proposal.save();

        // Update RFP with the new proposal
        if (!rfp.proposals) {
            rfp.proposals = [];
        }
        rfp.proposals.push(proposal._id);
        await rfp.save();

        // Mark email as processed
        await EmailService.markEmailProcessed(decodedEmailId);

        console.log(`✅ Proposal created: ${proposal._id}`);

        res.status(201).json({
            success: true,
            message: 'Proposal created from email',
            data: proposal
        });
    } catch (error) {
        console.error('❌ Error processing email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Simulate receiving an email (for testing)
exports.simulateReceive = async (req, res) => {
    try {
        const { vendorEmail, vendorName, subject, body, rfpId } = req.body;

        if (!body) {
            return res.status(400).json({
                success: false,
                error: 'body is required'
            });
        }

        const email = await EmailService.simulateEmailReceipt(
            vendorEmail || 'vendor@example.com',
            vendorName || 'Test Vendor',
            subject || 'Re: RFP Proposal',
            body,
            rfpId
        );

        console.log(`✅ Simulated email created: ${email.messageId}`);

        res.status(201).json({
            success: true,
            message: 'Email simulated successfully',
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Link an email to an RFP manually
exports.linkEmailToRFP = async (req, res) => {
    try {
        const { emailId } = req.params;
        const { rfpId } = req.body;

        const decodedEmailId = decodeURIComponent(emailId);
        
        // Import Email model for direct update
        const Email = require('../models/Email');
        
        // Find and update email in MongoDB
        const email = await Email.findOneAndUpdate(
            { $or: [{ messageId: decodedEmailId }, { _id: decodedEmailId }] },
            { rfpId: rfpId },
            { new: true }
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        // Verify RFP exists
        const rfp = await RFP.findById(rfpId);
        if (!rfp) {
            return res.status(404).json({
                success: false,
                error: 'RFP not found'
            });
        }

        res.json({
            success: true,
            message: 'Email linked to RFP',
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
