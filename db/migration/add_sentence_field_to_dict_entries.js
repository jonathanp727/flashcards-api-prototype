import MongoClient from '../../lib/MongoClient';

MongoClient.connectToServer((err, db) => {
  db.collection('dictionary').updateMany({}, {
    $set: { sentences: [] }
  }, err => {
    if (err) throw err;
    console.log('Finished!');
  });
});
