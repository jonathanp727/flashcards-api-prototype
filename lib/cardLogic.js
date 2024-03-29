const DEFAULT_CARD_SCHEMA = {
  ef: 2.5,
  n: 0,
  interval: 0,
  date: null,
};

/**
 * Calculation to determine whether a lookup should translate into a new card
 *
 * @param user      [Object]
 * @param word      [Object]
 * @param wordJlpt  [Object]
 * @param kindaKnew boolean
 * @return [Object]
 *    newCard: [Object] // The card to be created or null if card should not be created
 *    isNew: boolean // Whether the card is a fresh new card or if it has parematers set to perform
 *                   // differently or show up on a specific date, 
 */
export const shouldCreateCard = (user, word, wordJlpt, kindaKnew) => {
  if (kindaKnew) {
     // Return a card that is set to be done in 7 days
    const card = Object.assign({}, DEFAULT_CARD_SCHEMA);
    card.date = new Date();
    card.date.setHours(0,0,0,0); // Set hours, minutes, seconds, and milliseconds to 0
    card.interval = 7;
    card.date.setDate(card.date.getDate() + card.interval);
    card.n = 3;
    return { newCard: card, isNew: false };
  } else {
    // if word jlpt is at or above the user's level, OR it's at the next level
    if (wordJlpt >= user.jlpt.level || word.count > 3) {
      return { newCard: Object.assign({}, DEFAULT_CARD_SCHEMA), isNew: true };
    }
    return { newCard: null };
  }
};

// Update an existing card that has been incremented
export const incExistingCard = (card, kindaKnew) => {
  if (kindaKnew) {
    return card;
  } else {
    return Object.assign({}, DEFAULT_CARD_SCHEMA);
  }
}

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
  if (origCard === null) {
    var card = Object.assign({}, DEFAULT_CARD_SCHEMA);
  } else {
    var card = Object.assign({}, origCard);
  }

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

/**
 * Returns a card with a high EF (easy) that will show up for the user in a week.
 * 
 * This function was originally created to handle "kinda knew" lookups where the user knows the word
 * decently.
 *
 * @param origCard [Object]
 *   ef: Number,
 *   n: Number,
 *   date: Date,
 *   interval: Number,
 * @param response Number (quality of response from 1-5)
 * @return card
 */
export const createCardWeekAway = () => {

}
