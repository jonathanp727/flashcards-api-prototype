import MongoClient from '../../lib/MongoClient';

MongoClient.connectToServer((err, db) => {
  db.collection('dictionary').find().toArray((err, result) => {
    if (err) throw err;

    result.forEach(el => {
      if ('jlpt' in el) {
        db.collection('dictionary').updateOne({ _id: el._id }, {
          $set: { 'jlpt.level': Number(el.jlpt.level.charAt(1)) },
        }, err2 => {
          if (err2) throw err2;
          console.log('Not finished until this stops lol');
        });
      }
    });
  });
});
