/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const router = express.Router();
const textract = require('textract');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const wiki = require('../wiki/dist/wiki').default;

function arrayToObj(array, key) {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
}

function timer(ms) {
	return new Promise(res => setTimeout(res, ms));
}

async function searchWikipedia(text, next){
	const Tokenizer = require('sentence-tokenizer');
	const tokenizer = new Tokenizer();
	tokenizer.setEntry(text);

	let sentences = tokenizer.getSentences();
	let results = [];
	sentences = sentences.filter( sentence => {
		if ( // too short
			sentence.split(" ").length < 10 ||
			sentence.length < 55
		) {
			return false;
		} else {
			return true;
		}
	})
	
	sentences = sentences.map(sentence => {
		// remove whitespace, split into words, limit to 32 words, rebuild into string
		return sentence.trim().replace(/(\r\n|\n|\r)/gm,' ').split(" ").slice(0, 32).join(" ");
	});



	for (let i = 0; i < sentences.length; i++){
		const sentence = sentences[i];
		try {
			console.log(sentence);
			// console.log(`${sentences.length - i} remaining`);
			results[i] = await wiki({ 
					apiUrl: 'https://en.wikipedia.org/w/api.php',
					headers: { 
						'User-Agent': 'cheater-checker (https://cheater-checker.herokuapp.com/) wiki.js' 
					}
				}).search(sentence, 1, true)
			// console.log(results[i].result);
			await timer(1000); 
		} catch (e) {
			console.log(e.message);
		}
	}

	results = results.filter(result => {
		const res = result.results;
		return res.length > 0;
	});
	results = results.map(result => {
		delete result.next;
		return result;
	})

	console.log(results);
	return results;
}

router.get('/', (req, res, next) => {
	res.json('you got me');
});

router.post('/check', upload.single('document'), (req, res, next) => {
	textract.fromBufferWithMime(req.file.mimetype, req.file.buffer, { 
		// preserveLineBreaks: false
	}, async (error, text) => {
		if (error) {
			next(Object.keys(error));
		} else {
			res.json(await searchWikipedia(text, next));
		}
	});
	
})

module.exports = router;
