import { ObjectId } from 'mongodb';

import MongoClient from '../lib/MongoClient';
import { DAILY_NEWCARD_LIMIT, processCardInterval } from '../lib/cardLogic';
import { DEFAULT_WORD_SCHEMA } from './word';

/**
 * Checks the users 'upcoming' flashcards.  If there are less than the daily limit, returns
 * an array (of word IDs) of the appropriate number of cards that are next based on the users
 * JLPT rank. Otherwise returns an empty array.  
 *
 * @param user [Object]
 *   upcoming: Array,
 *   jlpt: { level: Number, index: Number }
 * @return Array, new jlpt position if array isn't empty ({ level: Number, index: Number })
 */
exports.getNextWords = async (user, callback) => {
  if (user.upcoming.length >= DAILY_NEWCARD_LIMIT) return callback(null, []);
  const numCardsToAdd = DAILY_NEWCARD_LIMIT - user.upcoming.length;
  const cursor = MongoClient.getDb().collection('dictionary').find({
    $or: [
      { 'jlpt.level': { $lt: user.jlpt.level } },
      { 'jlpt.level': { $eq: user.jlpt.level }, 'jlpt.index': { $gte: user.jlpt.index } },
    ],
  }).sort(
    { 'jlpt.level': -1, 'jlpt.index': 1 }
  ).hint(
    { 'jlpt.level': -1, 'jlpt.index': 1 }
  ).project({ _id: 1, jlpt: 1 });

  const newWords = [];

  let jlpt = {};
  while (newWords.length < numCardsToAdd) {
    const word = await cursor.next();
    if (!(word._id in user.words)) {
      newWords.push(word._id);

      // If this is the last word to be added, record jlpt stats for updating user's level
      if(newWords.length === numCardsToAdd) {
        jlpt = { level: word.jlpt.level, index: word.jlpt.index + 1 }
      }
    }
  }
  callback(null, newWords, jlpt);
};

/**
 * Determines new interval for flashcard based on responseQuality (1-5).  Then updates the words
 * 'card' field in the db and places the card in it's new position in the cards array, which is sorted
 * by increasing interval length.
 *
 * @param userId   ObjectId
 * @param wordId   ObjectId
 * @param upcoming Boolean     True if card is in upcoming arr and not in cards arr
 * @param response Number (from 1 to 5)
 */
exports.doCard = (data, callback) => {
  const { userId, wordId, upcoming, response } = data;
  let query = {};
  
  // Set pull query depending on which array the card previously belonged to
  if (upcoming) {
    query.$pull = { upcoming: ObjectId(wordId) };
  } else {
    query.$pull = { cards: ObjectId(wordId) };
  };

  // Pull card before getting user to make sure we have updated version of cards arr
  MongoClient.getDb().collection('users').updateOne({ _id: ObjectId(userId) }, query, err => {
    if (err) return callback(err);

    // Query for user in order to find new position
    MongoClient.getDb().collection('users').findOne({ _id: ObjectId(userId) }, (err2, user) => {
      if (err2) return callback(err2);

      const card = processCardInterval(user.words[wordId].card, response);
      const { cards } = user;

      // Find new position of card
      let pos = 0;
      let t;
      
      while (pos < user.cards.length && card.date > new Date(user.words[cards[pos]].card.date)) {
        pos += 1;
      }

      // Make seperate db query for push operation since you can't push and pull in same op
      // This is only necessary if the card isn't in upcoming to begin, consider combining queries in future if it is
      MongoClient.getDb().collection('users').updateOne({ _id: ObjectId(userId) }, {
        $set: {
          [`words.${wordId}.card`]: card,
          [`words.${wordId}.upcoming`]: false    // Set upcoming to false every time (in reality this is only necessary the first time the card is seen)
        },
        $push: {
          'cards': {
            '$each': [ ObjectId(wordId) ],
            '$position': pos,
          },
        },
      }, err => {
        callback(err);
      });
    });
  });
}

/**
 * Creates card manually for user.  Fails if card already exists.
 *
 * @param userId   ObjectId
 * @param wordId   ObjectId
 * @param upcoming Boolean     True if card is in upcoming arr and not in cards arr
 * @param response Number (from 1 to 5)
 */
exports.createCard = (data, callback) => {
  const { userId, wordId } = data;

  // Checks if word exists in user's data
  MongoClient.getDb().collection('users').findOne({
    _id: ObjectId(userId),
    [`words.${wordId}`]: { $exists: true },
  }, (err, user) => {
    if (err) return callback(err);

    const word = Object.assign({}, DEFAULT_WORD_SCHEMA);
    word.upcoming = true;

    let query = { $push: { upcoming: wordId } };
    // If word doesn't exist, set it up and append to upcoming
    if (!user) {
      query.$set = { [`words.${wordId}`]: word };
    // If word does exist, check if card date is null to determine if card exists or not
    } else if (user.words[wordId].card.date === null && !user.words[wordId].upcoming) {
      query.$set = { [`words.${wordId}.upcoming`]: true };
    } else {
      return callback(new Error('Card already exists for this word'));
    }

    MongoClient.getDb().collection('users').updateOne({ _id: ObjectId(userId) }, query, err => {
      callback(err);
    });
  });
}
