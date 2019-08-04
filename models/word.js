import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { shouldCreateCard } from '../lib/cardLogic';

const COLL_NAME = 'users';

export const DEFAULT_WORD_SCHEMA = {
  card: null,
  count: 0,
  dates: [],
  upcoming: false,  // States whether the word is in the user's 'upcoming' arr for words that will soon be added to deck
}

/**
 * Increments the lookup counter of a word for a particular user and determines
 * if the word should be added to the "upcoming" flashcards array.
 *
 * @param data [Object]
 *   userId: ObjectId,
 *   wordId: ObjectId,
 #   kindaKnew: boolean,   // Marks whether the user kind of knew the word or didn't at all
 *   wordJlpt: { level: Number, index: Number }
 */
exports.increment = (data, callback) => {
  const { userId, wordId, wordJlpt = { level: 0 }, kindaKnew } = data;

  const date = new Date().getTime();
  MongoClient.getDb().collection(COLL_NAME).findOne({
    _id: ObjectId(userId),
  }, (err, user) => {
    // Retrieve and update word entry if exists, otherwise create
    let word = user.words[wordId];
    if (!word) {
      word = Object.assign({}, DEFAULT_WORD_SCHEMA);
      word.count = 1;
      word.dates.push({ date, kindaKnew });
    } else {
      word.count += 1;
      word.dates.push({ date, kindaKnew });
    }

    word.latestIncrement = date;

    let query = {};

    // If no card, do check and create if necessary
    if (word.card === null && !word.upcoming) {
      var { newCard, isNew } = shouldCreateCard(user, word, wordJlpt.level, kindaKnew);
      if (newCard !== null) {
        word.card = res;
        word.upcoming = isNew;
        if (word.upcoming) {
          query.$push = { upcoming: ObjectId(wordId) };
        }
      }
    }
    query.$set = { [`words.${wordId}`]: word };

    MongoClient.getDb().collection(COLL_NAME).updateOne({ _id: ObjectId(userId) }, query, err => {
      callback(err);
    });
  });
}

exports.lookup = (query, callback) => {
  if (query.charCodeAt(0) > 255) {
    // word is japanese
    MongoClient.getDb().collection('dictionary').find({
      $or: [
        { 'r_ele.reb': query },
        { 'k_ele.keb': query },
      ],
    }).project({ sentences: 0 }).toArray((err, res) => {
      callback(err, res);
    });
  } else {
    // word is english
    MongoClient.getDb().collection('dictionary').find({
      $text: { $search: `\"${query}\"` },
    }, {
      score: { $meta: "textScore" },
    }).project({ sentences: 0 }).toArray((err, res) => {
      callback(err, res);
    });
  }
}

// Get a single word entry from dictionary
exports.get = (wordId) => (
  new Promise((resolve, reject) => {
    MongoClient.getDb().collection('dictionary').findOne({ _id: ObjectId(wordId)}, (err, word) => {
      if (err) reject(err);
      else resolve(word);
    });
  })
)
