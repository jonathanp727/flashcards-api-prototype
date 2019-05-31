const express = require('express');
const CardModel = require('../models/card.js');

const router = express.Router();

// increment
router.post('/', (req, res, next) => {
  CardModel.doCard(req.body, err => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

module.exports = router;
