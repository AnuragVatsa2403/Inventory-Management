const express  = require('express');
const router   = express.Router();
const { downloadInvoice, downloadGRN } = require('../controllers/pdfController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.get('/invoice/:saleId', protect, authorize('generate:pdf'), downloadInvoice);

router.get('/grn/:grnId', protect, authorize('generate:pdf'), downloadGRN);

module.exports = router;
