const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const challongeApiBaseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
const src = require('./lib/src.js');
const participantsFile = 'participants.json';
const groupSize = 4;

// Pull in participants.json
if (!fs.existsSync(participantsFile)) {
	console.error('No participant list found! Make sure populate.js has been ran!');
	process.exit(1);
}

let participants = JSON.parse(fs.readFileSync(participantsFile));
console.log(`Found ${participants.length} participants to seed...`);

// Sort participants by PB
participants.sort((a, b) => {
	return a.pb - b.pb;
});

// Set participant's original seed
participants.forEach((participant, index) => {
	participant.seed = index+1;
	participants[index] = participant;
	console.log(`${index+1}. ${participant.srcUsername}`);
});

// Create the appropriate number of buckets based on groupSize
let numGroups = participants.length / groupSize;
let buckets = [];
for (let i = 0; i < groupSize; i++) {
	buckets.push(participants.slice(i*numGroups,numGroups*(i+1)));
}

// Place participants in groups of groupSize, one from each bucket
let groups = [];
for (let i = 0; i < numGroups; i++) {
	let newGroup = [];
	let groupLog = [];
	for (let j = 0; j < groupSize; j++) {
		let p = buckets[j].splice(Math.floor(Math.random() * buckets[j].length), 1)[0];
		newGroup.push(p);
		groupLog.push(`${p.srcUsername} (${p.seed})`);
	}
	
	console.log(`Group ${i+1}: ${groupLog.join(', ')}`);
	groups.push(newGroup);
}

fs.writeFile('groups.json', JSON.stringify(groups), (err) => {
	if (err) console.error(err);
	console.log('Wrote groups to groups.json');
	process.exit(0);
});

// @TODO: Update seeds on challonge