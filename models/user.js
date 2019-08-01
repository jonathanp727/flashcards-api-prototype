import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { getNextWords } from './card';
import { DEFAULT_WORD_SCHEMA, get } from './word';
import { isSameDay } from '../lib/dateLogic';

const COLL_NAME = 'users';

exports.all = (callback) => {
  MongoClient.getDb().collection(COLL_NAME).find().toArray((err, result) => {
    callback(err, result);
  });
};

// Standard user get
exports.get = (id, callback) => {
  console.log(id);
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, user) => {
    console.log(user);
    callback(err, user);
  });
};

// Get user as well as checking for and creating upcoming cards as necessary
exports.getWithNewCards = (id, callback) => {
  MongoClient.getDb().collection(COLL_NAME).findOne({ _id: ObjectId(id) }, (err, user) => {
    if (err) return callback(err);

    // Check and add more words if upcoming isn't full
    getNextWords(user, (err2, words, newJlpt) => {
      const schema = Object.assign({}, DEFAULT_WORD_SCHEMA);
      schema.upcoming = true;
      const setWordsQuery = {};
      if (err2) return callback(err2);

      words.forEach(wordId => {
        setWordsQuery[`words.${wordId}`] = schema;
        setWordsQuery.lastWordRetrieval = new Date().getTime();
        user.upcoming.push(wordId)
        user.words[wordId] = Object.assign({}, schema);
      });

      // Update user in database with upcoming cards if new words should be added, otherwise return
      if (words.length > 0) {
        MongoClient.getDb().collection(COLL_NAME).updateOne({ _id: ObjectId(id) }, {
          $push: { upcoming: { $each: words }},
          $set: { ...setWordsQuery, jlpt: newJlpt },
        }, (err3) => {
          callback(err3, user);
        });
      } else {
        callback(err2, user);
      }
    });
  });
};

// Get user and add new cards using `getWithNewCards()` if it hasn't been done already today
exports.condGetWithNewCards = (id, callback) => {
  exports.get(id, async (err, user) => {
    if (err) return callback(err);

    if (user.lastWordRetrieval === null || !isSameDay(new Date(user.lastWordRetrieval), new Date())) {
      exports.getWithNewCards(id, async (err2, newUser) => {
        newUser = await exports.joinDict(newUser);
        callback(err2, newUser);
      });
    } else {
      user = await exports.joinDict(user);
      callback(err, user);
    }
  });
}

// Convert user wordIDs into dict entries
exports.joinDict = async (user) => {
  for (let wordId in user.words) {
    let entry = await get(wordId);
    user.words[wordId].entry = entry;
  }
  return user;
}

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
    lastWordRetrieval: null,
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
