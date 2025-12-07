const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');
const Proposal = require('../models/Proposal');
const AIService = require('../services/aiService');
const EmailService = require('../services/emailService');

// Create RFP from natural language
exports.createRFP = async (req, res) => {
  try {
    const { description, title } = req.body;

    // Use AI to parse the description
    const structuredData = await AIService.parseRFPDescription(description);

    const rfp = new RFP({
      title: title || `RFP - ${new Date().toLocaleDateString()}`,
      description,
      structuredData,
      status: 'draft'
    });

    await rfp.save();

    res.status(201).json({
      success: true,
      data: rfp,
      message: 'RFP created successfully using AI parsing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all RFPs
exports.getAllRFPs = async (req, res) => {
  try {
    const rfps = await RFP.find()
      .populate('vendors', 'name email')
      .populate('proposals')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rfps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Send RFP to vendors
exports.sendRFPToVendors = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorIds } = req.body;

    const rfp = await RFP.findById(id);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    // Send emails to each vendor
    const sendPromises = vendors.map(async (vendor) => {
      try {
        await EmailService.sendRFPEmail(vendor.email, rfp, vendor.name);

        // Update RFP with sent vendor
        rfp.sentVendors.push({
          vendorId: vendor._id,
          sentAt: new Date(),
          sentStatus: 'sent'
        });

        return { vendorId: vendor._id, status: 'sent' };
      } catch (error) {
        rfp.sentVendors.push({
          vendorId: vendor._id,
          sentAt: new Date(),
          sentStatus: 'failed'
        });
        return { vendorId: vendor._id, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);

    rfp.status = 'sent';
    rfp.vendors = vendorIds;
    await rfp.save();

    res.json({
      success: true,
      data: results,
      message: `RFP sent to  vendors`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Compare proposals
exports.compareProposals = async (req, res) => {
  try {
    const { id } = req.params;

    const rfp = await RFP.findById(id);

    if (!rfp) {
      return res.status(404).json({
        success: false,
        error: 'RFP not found'
      });
    }

    const proposals = await Proposal.find({ rfpId: id })
      .populate('vendorId', 'name email');

    // Check if there are proposals to compare
    if (!proposals || proposals.length === 0) {
      return res.json({
        success: true,
        data: {
          comparison: [],
          recommendation: null,
          insights: ['No proposals available for comparison. Proposals need to be submitted first.']
        }
      });
    }

    // Get comparison from AI (with null check for vendorId)
    const comparison = await AIService.compareProposals(
      proposals.map(p => ({
        ...p.toObject(),
        vendorName: p.vendorId?.name || 'Unknown Vendor'
      })),
      rfp
    );

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get RFP by ID
exports.getRFPById = async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id)
      .populate('vendors', 'name email')
      .populate({
        path: 'proposals',
        populate: {
          path: 'vendorId',
          select: 'name email'
        }
      });

    if (!rfp) {
      return res.status(404).json({
        success: false,
        error: 'RFP not found'
      });
    }

    res.json({
      success: true,
      data: rfp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update RFP
exports.updateRFP = async (req, res) => {
  try {
    const rfp = await RFP.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!rfp) {
      return res.status(404).json({
        success: false,
        error: 'RFP not found'
      });
    }

    res.json({
      success: true,
      data: rfp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete RFP
exports.deleteRFP = async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        success: false,
        error: 'RFP not found'
      });
    }

    await rfp.deleteOne();

    res.json({
      success: true,
      data: {},
      message: 'RFP deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get proposals for an RFP
exports.getRFPProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ rfpId: req.params.id })
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};