import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { shouldCreateCard } from '../lib/cardLogic';

const COLL_NAME = 'users';

export const DEFAULT_WORD_SCHEMA = {
  card: {
    ef: 2.5,
    n: 0,
    interval: 0,
    date: null,     // A null date can be used to signify that there is no actual card for this word
  },
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
 *   wordJlpt: { level: Number, index: Number }
 */
exports.increment = (data, callback) => {
  const { userId, wordId, wordJlpt = { level: 0 } } = data;

  const date = new Date().getTime();
  MongoClient.getDb().collection(COLL_NAME).findOne({
    _id: ObjectId(userId),
  }, (err, user) => {
    // Retrieve and update word entry if exists, otherwise create
    let word = user.words[wordId];
    if (!word) {
      word = Object.assign({}, DEFAULT_WORD_SCHEMA);
      word.count = 1;
      word.dates.push(date);
    } else {
      word.count += 1;
      word.dates.push(date);
    }

    word.latestIncrement = date;

    let query = {};

    // If no card, do check and create if necessary
    if (word.card.date === null && !word.upcoming && shouldCreateCard(user, word, wordJlpt.level)) {
      word.upcoming = true;
      query.$push = { upcoming: wordId };
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
