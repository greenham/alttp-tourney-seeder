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
		a.raceTimes.sort(util.sortNumber);
		a.bestRaceTime = a.raceTimes[0];
		a.averageRaceTime = util.average(a.raceTimes);
	} else {
		a.bestRaceTime = 999999;
		a.averageRaceTime = 999999;
	}

	if (b.raceTimes.length > 0) {
		b.raceTimes.sort(util.sortNumber);
		b.bestRaceTime = b.raceTimes[0];
		b.averageRaceTime = util.average(b.raceTimes);
	} else {
		b.bestRaceTime = 999999;
		b.averageRaceTime = 999999;
	}

	return a.bestRaceTime - b.bestRaceTime;
});

// Set participant's original seed
let seedList = [];
let totalRaceTimes = 0;
let missingMatches = 0;
participants.forEach((participant, index) => {
	participant.seed = index+1;
	totalRaceTimes += participant.raceTimes.length;
	if (participant.bestRaceTime === 999999) {
		missingMatches++;
	}
	participants[index] = participant;
	seedList.push(`${index+1}. ${participant.srcUsername} (${participant.bestRaceTime.toString().toHHMMSS()}) [${participant.wins}-${participant.losses}] | Average Time: ${participant.averageRaceTime.toString().toHHMMSS()}`);
});

let seedFile = 'out/bracket-seeds-'+Date.now()+'.txt';
let totalMatches = totalRaceTimes/2;
let output = `${totalMatches} / 192 Matches Played (${(totalMatches/192)*100}%)\n`
					 + `${missingMatches} / 128 Racers w/o Race (${(missingMatches/128)*100}%)\n\n`
					 + `${seedList.join("\n")}`
fs.writeFile(seedFile, output, (err) => {
	if (err) console.error(err);
	console.log(`Wrote bracket seeds to ${seedFile}`);
});
