const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');

// Create proposal (from parsed email)
exports.createProposal = async (req, res) => {
  try {
    const { rfpId, vendorId, emailContent, structuredData, aiAnalysis, status } = req.body;

    // Validate required fields
    if (!rfpId || !vendorId || !emailContent) {
      return res.status(400).json({
        success: false,
        error: 'rfpId, vendorId, and emailContent are required'
      });
    }

    const proposal = new Proposal({
      rfpId,
      vendorId,
      emailContent,
      structuredData: structuredData || {},
      aiAnalysis: aiAnalysis || {},
      status: status || 'pending'
    });

    await proposal.save();

    // Link proposal to RFP
    await RFP.findByIdAndUpdate(rfpId, {
      $push: { proposals: proposal._id },
      $set: { status: 'in-progress' }
    });

    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal created successfully'
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get proposal by ID
exports.getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('vendorId', 'name email')
      .populate('rfpId', 'title description structuredData');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all proposals
exports.getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find()
      .populate('vendorId', 'name email')
      .populate('rfpId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update proposal
exports.updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('vendorId', 'name email');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete proposal
exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Remove from RFP
    await RFP.findByIdAndUpdate(proposal.rfpId, {
      $pull: { proposals: proposal._id }
    });

    await Proposal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};