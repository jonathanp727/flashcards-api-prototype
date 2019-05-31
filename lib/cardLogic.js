// Calculation to determine whether a lookup should translate into a new card
export const shouldCreateCard = (user, word, wordJlpt) => {
  if (wordJlpt >= user.jlpt.level || word.count > 3) {
    return true;
  }
  return false;
};

// The amount of new cards to be introduced each day
export const DAILY_NEWCARD_LIMIT = 5;

/**
 * Implements the SM-2 algorithm for SRS card interval calculation.  Takes a card 
 * and a response quality and updates all necessary variables including the date
 * of next appearance.
 * 
 * A detailed description of the algorithm can be found at:
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * @param origCard [Object]
 *   ef: Number,
 *   n: Number,
 *   date: Date,
 *   interval: Number,
 * @param response Number (quality of response from 1-5)
 * @return card
 */
export const processCardInterval = (origCard, response) => {
  const card = Object.assign({}, origCard);
  if (response < 3) {
    card.n = 1;
  } else {
    card.n += 1;
  }

  card.ef = card.ef + (0.1 - (5 - response) * (0.08 + (5 - response) * 0.02));

  if (card.ef < 1.3) card.ef = 1.3;

  if (card.n == 1) {
    card.interval = 1;
  } else if (card.n == 2) {
    card.interval = 6;
  } else {
    card.interval = card.interval * card.ef;
    card.interval = Math.round(card.interval);
  }

  card.date = new Date();
  card.date.setHours(0,0,0,0); // Set hours, minutes, seconds, and milliseconds to 0
  card.date.setDate(card.date.getDate() + card.interval);

  return card;
};
