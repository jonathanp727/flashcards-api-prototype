import express from 'express';
import UserModel from '../models/user';

const router = express.Router();

// index
router.get('/', (req, res, next) => {
  UserModel.all((err, value) => {
    if (err) return next(err);
    res.json(value);
  });
});

// show
router.get('/:id', (req, res, next) => {
  UserModel.get(req.params.id, (err, value) => {
    if (err) return next(err);
    res.json(value);
  });
});

// new
router.post('/', (req, res, next) => {
  UserModel.new(req.body, (err, result) => {
    if (err) return next(err);
    res.json(result.insertedId);
  });
});

// update
router.put('/:id', (req, res, next) => {
  UserModel.update(req.params.id, req.body, (err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

// delete
router.delete('/:id', (req, res, next) => {
  UserModel.delete(req.params.id, (err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

module.exports = router;
