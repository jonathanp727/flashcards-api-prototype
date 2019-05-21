import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { DAILY_NEWCARD_LIMIT } from '../lib/cardLogic';

/**
 * Checks the users 'upcoming' flashcards.  If there are less than the daily limit, returns
 * an array (of word IDs) of the appropriate number of cards that are next based on the users
 * JLPT rank. Otherwise returns an empty array.  
 *
 * @param user [Object]
 *   upcoming: Array,
 *   jlpt: { level: Number, index: Number }
 * @return Array
 */
exports.getNextWords = async (user, callback) => {
  if (user.upcoming.length >= DAILY_NEWCARD_LIMIT) callback(null, []);

  const numCardsToAdd = DAILY_NEWCARD_LIMIT - user.upcoming.length;
  const cursor = MongoClient.getDb().collection('dictionary').find({
    $or: [
      { 'jlpt.level': { $lt: user.jlpt.level } },
      { 'jlpt.level': { $eq: user.jlpt.level }, 'jlpt.index': { $gt: user.jlpt.index } },
    ],
  }).sort(
    { 'jlpt.level': -1, 'jlpt.index': 1 }
  ).hint(
    { 'jlpt.level': -1, 'jlpt.index': 1 }
  ).project({ _id: 1 });

  const newWords = [];

  while (newWords.length < numCardsToAdd) {
    const word = await cursor.next();
    if (!(word._id in user.words)) {
      newWords.push(word._id);
    }
  }

  callback(null, newWords);
};
