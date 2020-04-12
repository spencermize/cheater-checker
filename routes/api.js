/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const router = express.Router();
const textract = require('textract');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const uuidv5 = require('uuid').v5;

const wiki = require('../wiki/dist/wiki').default;

const unique = '9115b4e1-3bfc-44e3-80fd-03d938c4f4aa';
const queue = [];
const completed = {};
let isRunning = false;

function getText(file) {
	return new Promise( (res, rej) => {
		textract.fromBufferWithMime(file.mimetype, file.buffer, { 
			// preserveLineBreaks: false
		}, async (error, text) => {
			if (error) {
				rej(Object.keys(error));
			} else {
				res(text);
			}
		});	
	})

}
async function watchQueue() {
	if (queue.length) {
		isRunning = true;
		const item = queue[0];
		item.status = 'processing';
		const text = await getText(item.file);
		const results = await item.action(text, item);
		queue.shift();

		completed[item.uuid] = results;
		watchQueue();
	} else {
		isRunning = false;
	}
}

function pushQueue(file, action) {
	const uuid = uuidv5(file.originalname + file.size, unique);
	queue.push({
		file,
		uuid,
		action,
		status: 'queued'
	});

	if (!isRunning) {
		watchQueue();
	}
	return uuid;
}

function lookupInQueue(uuid) {
	return queue.filter( item => item.uuid === uuid )[0];
}


function timer(ms) {
	return new Promise(res => setTimeout(res, ms));
}

async function searchWikipedia(text, item){
	const Tokenizer = require('sentence-tokenizer');
	const similarity = require('sentence-similarity')
	const similarityScore = require('similarity-score')	
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
		item.status = i / sentences.length;
		const sentence = sentences[i];
		try {
			console.log(sentence);
			results[i] = await wiki({ 
					apiUrl: 'https://en.wikipedia.org/w/api.php',
					headers: { 
						'User-Agent': 'cheater-checker (https://cheater-checker.herokuapp.com/) wiki.js' 
					}
				}).search(sentence, 1, true)
			
			await timer(1000);
		} catch (e) {
			console.log(e.message);
		}
	}

	results = results.filter(result => {
		return result.results.length > 0;
	});
	// console.log(results[0].results[0]);
	results = results.map(result => {
		delete result.next;

		const simOpts = { f: similarityScore.winklerMetaphone, options : {threshold: 0} }
		const wiki = result.results[0].snippet.replace('/<[^>]*>/').replace(/[\W_]+/g," ").split(" "); // strip html, remove non-words, split up
		result.similarity = similarity(
			result.query.replace(/[\W_]+/g," ").split(" "),
			wiki,
			simOpts
		);

		if ( result.similarity.score < 12) {
			return null;
		} else {
			return result;
		}
	})

	return results;
}

router.get('/', (req, res, next) => {
	res.json('you got me');
});

router.post('/check', upload.single('document'), (req, res, next) => {
	const uuid = pushQueue(req.file, searchWikipedia);
	res.json({status: 'queued', uuid});
});

router.get('/results/:uuid', (req, res, next) => {
	const result = completed[req.params.uuid];
	if (result) {
		res.json(result);
	} else {
		res.status(400).json({error: 'not found'});
	}
});

router.get('/status/:uuid', (req, res, next) => {
	const headers = {
		'Content-Type': 'text/event-stream;charset=UTF-8',
		'Connection': 'keep-alive',
		'Cache-Control': 'no-cache'
	};
	res.writeHead(200, headers);

	const interval = setInterval( () => {
		const item = lookupInQueue(req.params.uuid);
		let status = null;
		res.write("event: message\n");		
		if (item) {
			status = item.status;
		} else { 
			clearInterval(interval);
			status = 'complete';	
		}
		res.write(`data: ${JSON.stringify({status})}\n\n`);

		if (!item) {
			res.end();
		}
	}, 1000);
});
module.exports = router;
