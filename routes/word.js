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

// look up in dictionary
router.get('/:word', (req, res, next) => {
  WordModel.lookup(req.params.word, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});
