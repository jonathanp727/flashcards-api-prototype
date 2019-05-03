/* eslint-disable */
const parser = require('xml2json');
const fs = require('fs');
const JSON = require('jsonify');
const path = require('path');
const MongoClient = require('../lib/MongoClient.js');

MongoClient.connectToServer(async (err, db) => {
  if (err) throw err;
  await dropDict(db);
  populateDict(db);
});

const dropDict = db => (
  new Promise((resolve, reject) => {
    db.collection('dictionary').drop(err => {
      if (err) reject(err);
      else resolve();
    });
  })
)

const populateDict = db => {
  fs.readFile(path.join(__dirname, 'JMdict_edited.xml'), (err, data) => {
    if (err) throw err;

    // alternateTextNode changes $t keys to _t to avoid conflicts with mongo driver
    const dictJson = parser.toJson(data, { alternateTextNode: true });
    const dict = JSON.parse(dictJson).JMdict.entry;

    db.collection('dictionary').insertMany(dict, (err2, result) => {
      if (err2) throw err2;
      console.log('Finished successfully!');
      process.exit();
    });
  });
}
