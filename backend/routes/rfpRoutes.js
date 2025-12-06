const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfpController');

// RFP CRUD operations
router.post('/', rfpController.createRFP);
router.get('/', rfpController.getAllRFPs);
router.get('/:id', rfpController.getRFPById);
router.put('/:id', rfpController.updateRFP);
router.delete('/:id', rfpController.deleteRFP);

// Special operations
router.post('/:id/send', rfpController.sendRFPToVendors);
router.get('/:id/proposals', rfpController.getRFPProposals);
router.post('/:id/compare', rfpController.compareProposals);

module.exports = router;