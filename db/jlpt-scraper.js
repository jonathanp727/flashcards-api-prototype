import rp from 'request-promise';
import cheerio from 'cheerio';
import MongoClient from '../lib/MongoClient';

const urls = [
  'http://www.tanos.co.uk/jlpt/jlpt1/vocab/',
  'http://www.tanos.co.uk/jlpt/jlpt2/vocab/',
  'http://www.tanos.co.uk/jlpt/jlpt3/vocab/',
  'http://www.tanos.co.uk/jlpt/jlpt4/vocab/',
  'http://www.tanos.co.uk/jlpt/jlpt5/vocab/',
];

// sleep for random number between 8-15 seconds
function sleep() {
  return new Promise(resolve => setTimeout(resolve, Math.random(8000, 15000)));
}

const scrape = (url) => {
  return new Promise((resolve, reject) => {
    rp(url)
      .then((html) => {
        const $ = cheerio.load(html);
        const words = [];

        $('table[border=1]').find('tr').each((i, elem) => {
          const word = {};
          $(elem).children().each((i2, elem2) => {
            // kanji
            if (i2 == 0) {
              word.kanji = $(elem2).find('a').text();
            // reading
            } else if (i2 == 1) {
              word.reading = $(elem2).find('a').text();
            } else if (i2 == 2) {
              word.meaning = $(elem2).find('a').text();
            }
          });
          // Push if an actual word (used to ignore table headers)
          if (word.reading != '' || word.kanji != '') {
            words.push(word);
          }
        });

        resolve(words);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// Perform scrapes
const promises = [];
urls.forEach(url => {
  promises.push(scrape(url));
  sleep();
});

// Insert data into db
MongoClient.connectToServer(() => {
  const db = MongoClient.getDb();
  Promise.all(promises).then(levels => {
    levels.forEach((words, index) => {
      const jlptStr = `n${index+1}`;

      for (let i = 0; i < words.length; i++) {
        words[i].level = jlptStr;
        db.collection('jlpt').insertOne(words[i]);
      }
    });
    console.log('Finshed');
  });
});
