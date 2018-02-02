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

// @TODO: Make this dynamic based on groupSize
// Segment participants into buckets of 32
let bucket0, bucket1, bucket2, bucket3;
bucket0 = participants.slice(0,32);
bucket1 = participants.slice(32,64);
bucket2 = participants.slice(64,96);
bucket3 = participants.slice(96);

// Set seed
participants.forEach((participant, index) => {
	participant.seed = index+1;
	participants[index] = participant;
	//console.log(`${index+1}. ${participant.srcUsername}`);
});

// Place participants in groups of 4, one from each bucket
let numberOfGroups = participants.length / groupSize;
let groups = [];
for (var i = 1; i <= numberOfGroups; i++) {
	// Pick a random participant from each bucket to create a group
	let newGroup = [
		bucket0.splice(Math.floor(Math.random() * bucket0.length), 1)[0],
		bucket1.splice(Math.floor(Math.random() * bucket1.length), 1)[0],
		bucket2.splice(Math.floor(Math.random() * bucket2.length), 1)[0],
		bucket3.splice(Math.floor(Math.random() * bucket3.length), 1)[0]
	];

	console.log(`Group ${i}: ${newGroup[0].srcUsername} (${newGroup[0].seed}), ${newGroup[1].srcUsername} (${newGroup[1].seed}), ${newGroup[2].srcUsername} (${newGroup[2].seed}), ${newGroup[3].srcUsername} (${newGroup[3].seed})`);
	groups.push(newGroup);
}

fs.writeFile('groups.json', JSON.stringify(groups), (err) => {
	if (err) console.error(err);
	console.log('Wrote groups to groups.json');
	process.exit(0);
});

// @TODO: Update seeds on challonge