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

exports.get = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, user) => {
    if (err) callback(err);

    getNextWords(user, (err2, words) => {
      if (err2) callback(err2);
      words.forEach(wordId => {
        user.upcoming.push(wordId)
        user.words[wordId] = Object.assign({}, DEFAULT_WORD_SCHEMA );
        user.words[wordId].upcoming = true;
      });

      callback(err2, user);
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
