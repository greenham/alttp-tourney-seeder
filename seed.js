const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const challongeApiBaseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
const src = require('./lib/src.js');
const util = require('./lib/util.js');
const participantsFile = 'participants.json';
const groupNamesFile = 'conf/group-names.json';
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
	seedList.push(`${index+1}. ${participant.srcUsername} (${participant.pb.toString().toHHMMSS()})`);
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

let groupNames = JSON.parse(fs.readFileSync(groupNamesFile)) || [];

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
	generateGroups(bucketsCopy, numGroups, groupSize, groupNames);
}

// Places participants in desired number of groups of groupSize, one from each bucket
function generateGroups(buckets, numGroups, groupSize, groupNames)
{
	let currentSeed = 0;
	let groups = [];
	let groupsText = [];
	let bucketNames = {
		0: "1-32  ",
		1: "33-64 ",
		2: "65-96 ",
		3: "97-128",
	}

	for (let i = 0; i < numGroups; i++) {
		let newGroup = {};
		let groupLog = [];

		// pick a random name for this group
		newGroup.name = groupNames.splice(Math.floor(Math.random() * groupNames.length), 1);
		newGroup.members = [];

		groupLog.push(`GROUP : ${newGroup.name}`);

		for (let j = 0; j < groupSize; j++) {
			// choose random participant from the current bucket
			let p = buckets[j].splice(Math.floor(Math.random() * buckets[j].length), 1)[0];

			// track 'group seed' for ordering on challonge later
			p.groupSeed = currentSeed++;

			// add new member
			newGroup.members.push(p);

			// log
			groupLog.push(`${bucketNames[j]}: ${p.srcUsername} (${p.seed}) [${p.pb.toString().toHHMMSS()}]`);
		}
		
		groupsText.push(groupLog.join("\n"), "");
		groups.push(newGroup);
	}

	let groupsFile = 'out/groups-'+Math.floor(Math.random()*1000000)+'.txt';
	fs.writeFile(groupsFile, groupsText.join("\n"), (err) => {
		if (err) console.error(err);
		console.log(`Wrote groups text to ${groupsFile}`);
	});
}

// @TODO: Update seeds on challonge (re-number based on buckets)
// this should probably go in a separate script so that you can choose which group list to use
/*let basePath = `tournaments/${config.challonge.tourneyId}/participants/`;
participants.forEach((participant, index) => {
	let participantReq = {
		url: challongeApiBaseUrl+basePath+participant.challongeId+'.json',
		method: 'PUT',
		headers: {'User-Agent': userAgent},
		body: {seed: participant.seed},
		json: true
	};

	console.log(participantReq);

	request(participantReq, function(error, response, body) {
	  if (!error && response.statusCode == 200) {
	    console.log(`Updated seed for ${participant.challongeUsername} to ${participant.seed}`);
	  } else {
	  	console.error(`Received statusCode ${response.statusCode} from challonge: `, error);
	  }
	});
});*/