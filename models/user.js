import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';

const COLL_NAME = 'users';

exports.all = (callback) => {
  MongoClient.getDb().collection(COLL_NAME).find().toArray((err, result) => {
    callback(err, result);
  });
};

exports.get = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, result) => {
    callback(err, result);
  });
};

exports.new = (data, callback) => {
  MongoClient.getDb().collection(COLL_NAME).insertOne({
    username: data.username,
    password: data.password,
    isAdmin: false,
    words: [],
    cards: [],
  }, (err, result) => {
    callback(err, result);
  });
};

exports.update = (id, data, callback) => {
  MongoClient.getDb().collection(COLL_NAME).updateOne({ _id: ObjectId(id) }, {
    username: data.username,
    password: data.password,
  }, (err) => {
    callback(err);
  });
};

exports.delete = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).deleteOne({ _id: ObjectId(id) }, (err) => {
    callback(err);
  });
};
