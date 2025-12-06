const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/parse-rfp', aiController.parseRFPDescription);
router.post('/parse-response', aiController.parseVendorResponse);

module.exports = router;