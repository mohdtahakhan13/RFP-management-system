const AIService = require('../services/aiService');
const RFP = require('../models/RFP');

exports.parseRFPDescription = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }
    
    const structuredData = await AIService.parseRFPDescription(description);
    
    res.json({
      success: true,
      data: structuredData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.parseVendorResponse = async (req, res) => {
  try {
    const { emailContent, rfpId } = req.body;
    
    if (!emailContent || !rfpId) {
      return res.status(400).json({
        success: false,
        error: 'Email content and RFP ID are required'
      });
    }
    
    const rfp = await RFP.findById(rfpId);
    const parsedData = await AIService.parseVendorResponse(emailContent, rfp);
    
    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};