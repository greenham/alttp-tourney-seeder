const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const challongeApiBaseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
const util = require('./lib/util.js');
const participantsFile = 'participants-groups-times.json';
let parseArgs = require('minimist')(process.argv.slice(2));

// Pull in participants
if (!fs.existsSync(participantsFile)) {
	console.error('No participant list found! Make sure populate.js has been ran!');
	process.exit(1);
}

let participants = JSON.parse(fs.readFileSync(participantsFile));
console.log(`Found ${participants.length} participants to seed...`);

// Sort participants by best race time
participants.sort((a, b) => {
	// find the best race time for each racer, then compare
	if (a.raceTimes.length > 0) {
		a.raceTimes.sort();
		a.bestRaceTime = a.raceTimes[0];
	} else {
		a.bestRaceTime = 999999;
	}

	if (b.raceTimes.length > 0) {
		b.raceTimes.sort();
		b.bestRaceTime = b.raceTimes[0];
	} else {
		b.bestRaceTime = 999999;
	}

	return a.bestRaceTime - b.bestRaceTime;
});

// Set participant's original seed
let seedList = [];
let matchesPlayed = 0;
participants.forEach((participant, index) => {
	participant.seed = index+1;
	matchesPlayed += participant.raceTimes.length;
	participants[index] = participant;
	seedList.push(`${index+1}. ${participant.srcUsername} (${participant.bestRaceTime.toString().toHHMMSS()}) [${participant.wins}-${participant.losses}]`);
});

let seedFile = 'out/bracket-seeds-'+Date.now()+'.txt';
fs.writeFile(seedFile, `${matchesPlayed/2} / 192 Played\n${seedList.join("\n")}`, (err) => {
	if (err) console.error(err);
	console.log(`Wrote bracket seeds to ${seedFile}`);
});
