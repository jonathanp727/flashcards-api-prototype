import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { getNextWords } from './card';
import { DEFAULT_WORD_SCHEMA } from './word';

const COLL_NAME = 'users';

exports.all = (callback) => {
  MongoClient.getDb().collection(COLL_NAME).find().toArray((err, result) => {
    callback(err, result);
  });
};

// Standard user get
exports.get = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, user) => {
    callback(err, user);
  });
};

// Get user as well as checking for and creating upcoming cards as necessary
exports.getWithNewCards = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, user) => {
    if (err) return callback(err);

    // Check and add more words if upcoming isn't full
    getNextWords(user, (err2, words) => {
      const schema = Object.assign({}, DEFAULT_WORD_SCHEMA);
      schema.upcoming = true;
      const setWordsQuery = {};
      if (err2) return callback(err2);

      words.forEach(wordId => {
        setWordsQuery[`words.${wordId}`] = schema;
        user.upcoming.push(wordId)
        user.words[wordId] = schema;
      });

      // Update user in database with upcoming cards if found, otherwise return
      if (words.length > 0) {
        MongoClient.getDb().collection(COLL_NAME).updateOne({ _id: ObjectId(id) }, {
          $push: { upcoming: { $each: words }},
          $set: setWordsQuery,
        }, err3 => {
          callback(err3, user);
        });
      } else {
        callback(err2, user);
      }
    });
  });
};

exports.new = (data, callback) => {
  MongoClient.getDb().collection(COLL_NAME).insertOne({
    username: data.username,
    password: data.password,
    isAdmin: false,
    words: {},
    cards: [],
    upcoming: [],
    jlpt: {
      level: data.level,
      index: 0,
    },
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
