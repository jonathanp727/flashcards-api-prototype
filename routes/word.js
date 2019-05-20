const express = require('express');
const WordModel = require('../models/word.js');

const router = express.Router();

// increment
router.post('/', (req, res, next) => {
  WordModel.increment(req.body, (err, newWord) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

module.exports = router;
