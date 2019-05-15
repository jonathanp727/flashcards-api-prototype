// Creates references between dictionary entries and sentences they appear in
import MongoClient from '../../lib/MongoClient';
import MeCabWrapper from '../../lib/MeCabWrapper';

let db;

MongoClient.connectToServer(async (err, res) => {
  db = res;
  await MeCabWrapper.init();

  const sentences = await getSentences();

  for (let i = 0; i < sentences.length; i++) {
    const cur = sentences[i];
    
    const parse = await MeCabWrapper.parse(cur.jp);
    
    parse.forEach(word => {
      // Only process these pos for now
      if (!['動詞', '名詞', '形容詞', ''].includes(word.lexical)) {
        return;
      }
      appendSentence(word.original, cur._id, cur.jp);
    });

    console.log(`Parsed sentence ${i} / ${sentences.length}`);
  }
});

const getSentences = () => (
  new Promise((resolve, reject) => {
    db.collection('reibun').find().toArray((err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
)

const appendSentence = (word, senId, sen) => {
  db.collection('dictionary').updateOne({ 'k_ele.keb': word }, {
    $push: {
      sentences: senId,
    }
  }, (err, res) => {
      if (err) throw err;
      if (res.result.nModified > 0) {
        console.log(`matched ${word} to ${sen}`);
      }
    }
  );
}
