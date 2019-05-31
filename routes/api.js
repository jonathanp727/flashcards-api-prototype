import express from 'express';

import user from './user';
import word from './word';
import card from './card';

const router = express.Router();

router.use('/user', user);
router.use('/word', word);
router.use('/card', card);

router.get('/', (req, res) => {
  res.json({ success: true });
});

module.exports = router;

