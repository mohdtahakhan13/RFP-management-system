const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const Email = require('../models/Email');

class EmailService {
  constructor() {
    // Initialize SMTP transporter for sending emails (Mailtrap SMTP)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.EMAIL_PORT) || 2525,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Email SMTP service initialized');
    } else {
      console.warn('⚠️ Email credentials not configured. Email sending will be simulated.');
      this.transporter = null;
    }

    // Initialize IMAP config for receiving emails
    // For Gmail IMAP, use the same credentials as SMTP
    const imapUser = process.env.IMAP_USER || process.env.EMAIL_USER;
    const imapPass = process.env.IMAP_PASS || process.env.EMAIL_PASS;
    
    if (imapUser && imapPass) {
      this.imapConfig = {
        imap: {
          user: imapUser,
          password: imapPass,
          host: process.env.IMAP_HOST || 'imap.gmail.com',
          port: parseInt(process.env.IMAP_PORT) || 993,
          tls: true,
          authTimeout: 10000,  // Reduced from 30000 to 10000
          connTimeout: 15000,  // Reduced from 30000 to 15000
          tlsOptions: { 
            rejectUnauthorized: false,
            servername: process.env.IMAP_HOST || 'imap.gmail.com'
          }
        }
      };
      console.log('✅ Email IMAP service initialized');
    } else {
      this.imapConfig = null;
      console.warn('⚠️ IMAP credentials not configured. Email receiving will be simulated.');
    }
  }

  async sendRFPEmail(vendorEmail, rfpData, vendorName) {
    // If no email transporter (demo mode), simulate sending
    if (!this.transporter) {
      console.log(`📧 [SIMULATED] Sending RFP to ${vendorEmail}`);
      console.log(`Subject: RFP: ${rfpData.title}`);
      return {
        success: true,
        message: 'Email sent in simulation mode',
        vendorEmail,
        rfpId: rfpData._id
      };
    }

    const mailOptions = {
      from: `"RFP Management System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: vendorEmail,
      subject: `RFP: ${rfpData.title} [RFP-${rfpData._id}]`,
      html: this.generateRFPTemplate(rfpData, vendorName),
      text: this.generateTextRFPTemplate(rfpData, vendorName),
      replyTo: process.env.EMAIL_USER // Replies come back to our inbox
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${vendorEmail} - Message ID: ${info.messageId}`);
      return {
        success: true,
        message: 'Email sent successfully',
        vendorEmail,
        rfpId: rfpData._id,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      throw error; // Let the controller handle the error
    }
  }

  // Check for new emails in inbox (IMAP) with better timeout handling
  async checkInbox() {
    if (!this.imapConfig) {
      console.log('📧 [SIMULATED] Checking inbox...');
      return [];
    }

    let connection = null;
    
    try {
      console.log('📧 Connecting to IMAP server...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('IMAP connection timeout after 20 seconds')), 20000);
      });
      
      // Race between connection and timeout
      connection = await Promise.race([
        imaps.connect(this.imapConfig),
        timeoutPromise
      ]);

      console.log('📧 Connected to IMAP server, opening INBOX...');
      await connection.openBox('INBOX');

      // Search ONLY for UNSEEN (unread) emails with "RFP:" in subject
      // This prevents re-fetching old emails after DB is cleared
      const searchCriteria = [
        'UNSEEN',
        ['OR', 
          ['SUBJECT', 'RFP:'],
          ['SUBJECT', 'Re: RFP:']
        ]
      ];
      
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false  // We'll mark as seen manually after saving
      };

      console.log('📧 Searching for UNSEEN RFP-related emails...');
      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`📧 Found ${messages.length} unread RFP emails`);

      const newEmails = [];
      const uidsToMarkRead = [];

      for (const message of messages) {
        const all = message.parts.find(part => part.which === '');
        if (all) {
          const parsed = await simpleParser(all.body);

          // Check if this is a reply to an RFP (double check)
          const isRFPReply = parsed.subject &&
            (parsed.subject.includes('RFP:') || parsed.subject.includes('Re: RFP:'));

          if (isRFPReply) {
            // Extract RFP ID from subject if present
            const rfpIdMatch = parsed.subject.match(/\[RFP-([a-f0-9]+)\]/i);
            const messageId = parsed.messageId || `imap-${message.attributes.uid}-${Date.now()}`;

            // Check if this email already exists in MongoDB (by messageId or uid)
            const existingEmail = await Email.findOne({ 
              $or: [
                { messageId },
                { uid: String(message.attributes.uid) }
              ]
            });
            
            if (!existingEmail) {
              // Save new email to MongoDB
              const emailData = {
                uid: String(message.attributes.uid),
                messageId,
                from: parsed.from?.value?.[0]?.address || 'unknown',
                fromName: parsed.from?.value?.[0]?.name || 'Unknown Vendor',
                subject: parsed.subject,
                text: parsed.text || '',
                html: parsed.html || '',
                date: parsed.date || new Date(),
                rfpId: rfpIdMatch ? rfpIdMatch[1] : null,
                processed: false,
                simulated: false
              };

              const savedEmail = await Email.create(emailData);
              newEmails.push(savedEmail);
              uidsToMarkRead.push(message.attributes.uid);
              console.log(`📧 New email saved: ${parsed.subject}`);
            } else {
              // Email already in DB, just mark as read in Gmail
              uidsToMarkRead.push(message.attributes.uid);
            }
          }
        }
      }

      // Mark all fetched emails as SEEN in Gmail to prevent re-fetching
      if (uidsToMarkRead.length > 0) {
        try {
          await connection.addFlags(uidsToMarkRead, ['\\Seen']);
          console.log(`📧 Marked ${uidsToMarkRead.length} emails as read in Gmail`);
        } catch (flagError) {
          console.error('⚠️ Could not mark emails as read:', flagError.message);
        }
      }

      await connection.end();
      console.log(`📧 Found ${newEmails.length} new RFP-related emails`);
      return newEmails;

    } catch (error) {
      console.error('❌ Error checking inbox:', error.message);
      
      // Try to close connection if it exists
      if (connection) {
        try {
          await connection.end();
        } catch (closeError) {
          console.error('Error closing connection:', closeError.message);
        }
      }
      
      throw error;
    }
  }

  // Mark an email as read
  async markAsRead(uid) {
    if (!this.imapConfig) return;

    try {
      const connection = await imaps.connect(this.imapConfig);
      await connection.openBox('INBOX');
      await connection.addFlags(uid, ['\\Seen']);
      await connection.end();
      console.log(`✅ Marked email ${uid} as read`);
    } catch (error) {
      console.error('Error marking email as read:', error.message);
    }
  }

  // Get all received emails from MongoDB
  async getReceivedEmails() {
    try {
      const emails = await Email.find({}).sort({ date: -1 });
      return emails;
    } catch (error) {
      console.error('Error fetching emails from DB:', error.message);
      return [];
    }
  }

  // Clear processed emails from database
  async clearProcessedEmails() {
    try {
      await Email.deleteMany({ processed: true });
      console.log('✅ Cleared processed emails from database');
    } catch (error) {
      console.error('Error clearing processed emails:', error.message);
    }
  }

  // Mark email as processed
  async markEmailProcessed(emailId) {
    try {
      await Email.findOneAndUpdate(
        { $or: [{ messageId: emailId }, { _id: emailId }] },
        { processed: true }
      );
      console.log(`✅ Marked email ${emailId} as processed`);
    } catch (error) {
      console.error('Error marking email as processed:', error.message);
    }
  }

  // Simulate receiving an email (for testing) - now saves to MongoDB
  async simulateEmailReceipt(vendorEmail, vendorName, subject, body, rfpId) {
    console.log(`📧 [SIMULATED] Received email from ${vendorName} <${vendorEmail}>`);
    console.log(`Subject: ${subject}`);

    const emailData = {
      uid: String(Date.now()),
      messageId: `simulated-${Date.now()}@local`,
      from: vendorEmail,
      fromName: vendorName,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      date: new Date(),
      rfpId: rfpId,
      processed: false,
      simulated: true
    };

    // Save to MongoDB
    const savedEmail = await Email.create(emailData);
    console.log(`✅ Simulated email saved to database: ${savedEmail._id}`);
    
    return savedEmail;
  }

  // Test email connection
  async testConnection() {
    const results = {
      smtp: { success: false, message: '' },
      imap: { success: false, message: '' }
    };

    // Test SMTP
    if (this.transporter) {
      try {
        await this.transporter.verify();
        results.smtp = { success: true, message: 'SMTP connection successful' };
        console.log('✅ SMTP connection verified');
      } catch (error) {
        results.smtp = { success: false, message: error.message };
        console.error('❌ SMTP connection failed:', error.message);
      }
    } else {
      results.smtp = { success: false, message: 'SMTP not configured' };
    }

    // Test IMAP with timeout
    if (this.imapConfig) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('IMAP connection timeout')), 15000);
        });
        
        const connection = await Promise.race([
          imaps.connect(this.imapConfig),
          timeoutPromise
        ]);
        await connection.end();
        results.imap = { success: true, message: 'IMAP connection successful' };
        console.log('✅ IMAP connection verified');
      } catch (error) {
        results.imap = { success: false, message: error.message };
        console.error('❌ IMAP connection failed:', error.message);
      }
    } else {
      results.imap = { success: false, message: 'IMAP not configured' };
    }

    return results;
  }

  generateRFPTemplate(rfpData, vendorName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RFP: ${rfpData.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .item-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
          }
          .highlight {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #ffc107;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 14px;
          }
          .rfp-id {
            background: rgba(255,255,255,0.2);
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            margin-top: 10px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Request for Proposal</h1>
          <h2>${rfpData.title}</h2>
          <div class="rfp-id">Reference: RFP-${rfpData._id}</div>
        </div>
        
        <div class="content">
          <p>Dear ${vendorName},</p>
          
          <p>You have been invited to submit a proposal for the following requirements. Please review the details below and <strong>reply to this email</strong> with your proposal.</p>
          
          <div class="highlight">
            <strong>📋 Please include in your response:</strong>
            <ul>
              <li>Itemized pricing for all requested items</li>
              <li>Delivery timeline (in days)</li>
              <li>Payment terms (e.g., Net 30, Net 45)</li>
              <li>Warranty details</li>
              <li>Any additional terms or conditions</li>
            </ul>
          </div>
          
          <h3>📄 Project Requirements:</h3>
          <p>${rfpData.description}</p>
          
          <h3>📊 Key Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Budget:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${rfpData.structuredData?.currency || 'USD'} ${rfpData.structuredData?.totalBudget?.toLocaleString() || 'To be determined'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Delivery Required:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${rfpData.structuredData?.deliveryDays || 'N/A'} days</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Payment Terms:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${rfpData.structuredData?.paymentTerms || 'Net 30'}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Warranty Required:</strong></td>
              <td style="padding: 10px;">${rfpData.structuredData?.warranty || '1 year minimum'}</td>
            </tr>
          </table>
          
          ${rfpData.structuredData?.items && rfpData.structuredData.items.length > 0 ? `
          <h3>📦 Items Required:</h3>
          ${rfpData.structuredData.items.map(item => `
            <div class="item-card">
              <strong>${item.name}</strong><br>
              <em>Quantity: ${item.quantity || 1}</em><br>
              ${item.specifications ? `Specifications: ${item.specifications}<br>` : ''}
            </div>
          `).join('')}
          ` : ''}
          
          <h3>📅 Submission Deadline:</h3>
          <p>Please reply to this email with your proposal by <strong>${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.</p>
          
          <div class="footer">
            <p>⚡ Simply <strong>reply to this email</strong> with your proposal. Our system will automatically process your response.</p>
            <p style="color: #999; font-size: 12px;">RFP Management System | Reference: RFP-${rfpData._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateTextRFPTemplate(rfpData, vendorName) {
    return `
REQUEST FOR PROPOSAL
====================

RFP: ${rfpData.title}
Reference: RFP-${rfpData._id}

Dear ${vendorName},

You have been invited to submit a proposal for the following requirements:

PROJECT DESCRIPTION:
${rfpData.description}

KEY DETAILS:
- Total Budget: ${rfpData.structuredData?.currency || 'USD'} ${rfpData.structuredData?.totalBudget?.toLocaleString() || 'To be determined'}
- Delivery Required: ${rfpData.structuredData?.deliveryDays || 'N/A'} days
- Payment Terms: ${rfpData.structuredData?.paymentTerms || 'Net 30'}
- Warranty Required: ${rfpData.structuredData?.warranty || '1 year minimum'}

ITEMS REQUIRED:
${(rfpData.structuredData?.items || []).map(item => `
* ${item.name}
  Quantity: ${item.quantity || 1}
  ${item.specifications ? `Specifications: ${item.specifications}` : ''}
`).join('\n')}

PLEASE INCLUDE IN YOUR RESPONSE:
1. Itemized pricing for all items
2. Delivery timeline (in days)
3. Payment terms
4. Warranty details

SUBMISSION DEADLINE: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Simply reply to this email with your proposal. Our system will automatically process your response.

--
RFP Management System
Reference: RFP-${rfpData._id}
    `;
  }
}

module.exports = new EmailService();