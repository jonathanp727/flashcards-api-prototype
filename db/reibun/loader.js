// Loads sentences from file into mongo database

import fs from 'fs';
import path from 'path';
import MongoClient from '../../lib/MongoClient';

const filePath = path.join(__dirname, '/examples_pd-utf-8');
let db;
let lineIndex = 0;

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(filePath)
});

MongoClient.connectToServer(async (err, res) => {
  db = res;
  await dropCol();

  printProgress();
  lineReader.on('line', async line => {
    if (line[0] === 'A') {
      const reibunEnd = line.indexOf(' ', 3);
      const reibun = line.substring(3, reibunEnd);
      
      // find start of english sentence (skip gender marks ([M], [F]) )
      let i = reibunEnd;
      while (line[i] === ' ') {
        i += 1;
        if (line[i] === '[') {
          i += 2;
        }
      }

      const eibunEnd = line.indexOf('#', i);
      const eibun = line.substring(i, eibunEnd);

      await insert(reibun, eibun);
      lineIndex += 1;
    }
  });
});

const printProgress = () => {
  let lastIndex = -1;
  let count = 0;
  setInterval(() => {
    if (lastIndex != lineIndex) {
      lastIndex = lineIndex;
      count = 0;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Processed reibun #${lineIndex}`);
    } else {
      if (count == 4) {
        process.stdout.write('\n');
        console.log('Finished!');
        process.exit();
      }
      count += 1;
    }
  }, 500)
}

const insert = (jp, en) => (
  new Promise((resolve, reject) => {
    db.collection('reibun').insertOne({ jp, en }, err => {
      if (err) reject(err);
      else resolve();
    });
  })
)

const dropCol = () => (
  new Promise((resolve, reject) => {
    db.collection('reibun').drop(err => {
      if (err) reject(err);
      else resolve();
    });
  })
)
