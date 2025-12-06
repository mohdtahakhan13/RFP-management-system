const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

// Proposal CRUD operations
router.post('/', proposalController.createProposal);
router.get('/:id', proposalController.getProposalById);
router.put('/:id', proposalController.updateProposal);
router.delete('/:id', proposalController.deleteProposal);

// Get all proposals
router.get('/', proposalController.getAllProposals);

module.exports = router;