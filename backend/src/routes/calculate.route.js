const express = require('express');
const router = express.Router();

// Import controller FUNCTION (not object)
const calculate = require('../controllers/calculate.controller');

// POST /api/calculate
router.post('/', calculate);

module.exports = router;