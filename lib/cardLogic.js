// Calculation to determine whether a lookup should translate into a new card
export const shouldCreateCard = (user, word, wordJlpt) => {
  if (wordJlpt >= user.jlpt.level || word.count > 3) {
    return true;
  }
  return false;
};

// The amount of new cards to be introduced each day
export const DAILY_NEWCARD_LIMIT = 5;
