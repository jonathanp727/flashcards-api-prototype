import { MongoClient } from 'mongodb';

const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'jisho-history';
let db;

module.exports = {
  connectToServer(callback) {
    MongoClient.connect(DB_URL, { useNewUrlParser: true }, (err, client) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
      }
      db = client.db(DB_NAME);
      return callback(err);
    });
  },

  getDb() {
    return db;
  },
};
