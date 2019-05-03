import MongoClient from '../lib/MongoClient';

let db;

MongoClient.connectToServer(async (err, res) => {  
  if (err) throw err;
  db = res;
  const jlpt = await getJlpt();

  assign();
});

const getJlpt = () => (
  new Promise((resolve, reject) => {
    db.collection('jlpt').find().toArray((err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
)

const getDict = () => (
  new Promise((resolve, reject) => {
    db.collection('dictionary').find().toArray((err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
)

const searchDict = (query) => (
  new Promise((resolve, reject) => {
    db.collection('dictionary').find(query).toArray((err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
)

const testing = async () => {
  const jlpt = await getJlpt();

  for (let i = 0; i < jlpt.length; i++) {
    const entry = jlpt[i];
    let query = { 'k_ele.keb': entry.kanji, 'r_ele.reb': entry.reading };
    if (!entry.kanji) {
      query = { 'r_ele.reb': entry.reading };
    }
    
    const found = await searchDict(query);
    if (!found) {
      console.log(`Not found: ${entry.kanji}:${entry.reading}`);
    } else if (found.length > 1) {
      console.log(`Multiple found: ${entry.kanji}:${entry.reading}`);
    }
  }
  console.log('Finished');
}

const assign = async () => {
  const jlpt = await getJlpt();
  const counts = {
    'n1': 0,
    'n2': 0,
    'n3': 0,
    'n4': 0,
    'n5': 0,
  }

  for (let i = 0; i < jlpt.length; i++) {
    const entry = jlpt[i];
    let query = { 'k_ele.keb': entry.kanji, 'r_ele.reb': entry.reading };
    if (!entry.kanji) {
      query = { 'r_ele.reb': entry.reading };
    }

    const data = { level: entry.level, index: counts[entry.level]++ };
    db.collection('dictionary').updateOne(query, { $set: { jlpt: data } }, err => {
      if (err) {
        console.log(`Error on insert: ${entry.kanji}:${entry.reading}`);
        console.log(err);
      }
      if (i === jlpt.length - 1) {
        console.log('Finished');
        process.exit();
      }
    });
  }
}
