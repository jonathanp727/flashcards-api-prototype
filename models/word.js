import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { shouldCreateCard } from '../lib/cardLogic';

const COLL_NAME = 'users';

export const DEFAULT_WORD_SCHEMA = {
  card: null,
  count: 0,
  dates: [],
  upcoming: false,
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
  const { userId, wordId, wordJlpt } = data;

  const date = new Date().getTime();
  MongoClient.getDb().collection(COLL_NAME).findOne({
    _id: ObjectId(userId),
  }, (err, user) => {
    // Retrieve and update word entry if exists, otherwise create
    let word = user.words[wordId];
    if (!word) {
      word = {
        card: null,
        count: 1,
        dates: [date],
        upcoming: false,
      };
    } else {
      word.count += 1;
      word.dates.push(date);
    }

    word.latestIncrement = date;

    let query = {};

    // If no card, do check and create if necessary
    if (word.card === null && !word.upcoming && shouldCreateCard(user, word, wordJlpt.level)) {
      word.upcoming = true;
      query.$push = { upcoming: wordId };
    }
    query.$set = { [`words.${wordId}`]: word };

    MongoClient.getDb().collection(COLL_NAME).updateOne({ _id: ObjectId(userId) }, query, err => {
      callback(err);
    });
  });
}