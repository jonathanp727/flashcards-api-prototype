import MongoClient from '../../lib/MongoClient';

MongoClient.connectToServer((err, db) => {
  db.collection('dictionary').createIndex({ name: 'text', 'sense.gloss._t': 'text' }, (err) => {
    if (err) throw err;
    console.log('Finished!');
  });
});
