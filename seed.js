const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const challongeApiBaseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
const src = require('./lib/src.js');
const participantsFile = 'participants.json';
const groupSize = 4;
let parseArgs = require('minimist')(process.argv.slice(2));

// command-line option for generating groups only (multiple groups at a time if desired)
let groupsOnly = parseArgs.g || false;
let genNumGroups = parseArgs.n || 1;
//let groupSize = parseArgs.s || 4;

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
let partList = [];
let seedList = [];
participants.forEach((participant, index) => {
	participant.seed = index+1;
	participants[index] = participant;
	seedList.push(`${index+1}. ${participant.srcUsername} (${participant.pb})`);
	partList.push(participant.srcUsername);
});

if (!groupsOnly) {
	let seedFile = 'out/seeds-'+Date.now()+'.txt';
	fs.writeFile(seedFile, seedList.join("\n"), (err) => {
		if (err) console.error(err);
		console.log(`Wrote original seeds to ${seedFile}`);
	});
	let partFile = 'out/part-'+Date.now()+'.txt';
	fs.writeFile(partFile, partList.join("\n"), (err) => {
		if (err) console.error(err);
		console.log(`Wrote participant list to ${partFile}`);
	});
}

// Create the appropriate number of buckets based on groupSize
// Fill buckets with participants using seed order
let numGroups = participants.length / groupSize;
let buckets = [];
for (let g = 0; g < groupSize; g++) {
	buckets.push(participants.slice(g*numGroups,numGroups*(g+1)));
}

// Generate numGroups sets of groups
for (let h = 0; h < genNumGroups; h++) {
	let bucketsCopy = JSON.parse(JSON.stringify(buckets));
	generateGroups(bucketsCopy, numGroups, groupSize);
}

function generateGroups(buckets, numGroups, groupSize)
{
	// Place participants in groups of groupSize, one from each bucket
	let groups = [];
	let groupsText = [];
	for (let i = 0; i < numGroups; i++) {
		let newGroup = [];
		let groupLog = [];
		for (let j = 0; j < groupSize; j++) {
			let p = buckets[j].splice(Math.floor(Math.random() * buckets[j].length), 1)[0];
			newGroup.push(p);
			groupLog.push(`${p.srcUsername} (${p.seed})`);
		}
		
		groupsText.push(`Group ${i+1}: ${groupLog.join(', ')}`);
		groups.push(newGroup);
	}

	let groupsFile = 'out/groups-'+Math.floor(Math.random()*1000000)+'.txt';
	fs.writeFile(groupsFile, groupsText.join("\n"), (err) => {
		if (err) console.error(err);
		console.log(`Wrote groups text to ${groupsFile}`);
	});
}

// process.exit(0);
// @TODO: Update seeds on challonge (re-number based on buckets)