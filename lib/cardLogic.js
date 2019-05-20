export const shouldCreateCard = (user, word, wordJlpt) => {
  if (wordJlpt >= user.jlpt.level || word.count > 3) {
    return true;
  }
  return false;
};
