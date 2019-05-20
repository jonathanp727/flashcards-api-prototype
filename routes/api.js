import express from 'express';

import user from './user';
import word from './word';

const router = express.Router();

router.use('/user', user);
router.use('/word', word);

router.get('/', (req, res) => {
  res.json({ success: true });
});

module.exports = router;

