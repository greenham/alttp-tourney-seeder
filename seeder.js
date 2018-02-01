const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const baseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
const src = require('./lib/src.js');
const participantsFile = 'participants.json';

function getParticipants(cb) {
	// use existing file if possible
	if (fs.existsSync(participantsFile)) {
		cb(JSON.parse(fs.readFileSync(participantsFile)));
		return;
	}

	// otherwise, get the current list from challonge
	let path = `tournaments/${config.challonge.tourneyId}/participants.json`;
	let participantReq = {
		url: baseUrl+path,
		headers: {'User-Agent': userAgent}
	};
	let list = [];

	request(participantReq, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      let participants = JSON.parse(body);
      if (participants) {
	      participants.forEach((part) => {
	      	let el = part.participant;
	      	if (el.on_waiting_list === false) {
	      		list.push({challongeId: el.id, challongeUsername: el.username});
	      	}
	      });
	      console.log(`Retrieved ${list.length} participants from challonge, saving...`);
	      fs.writeFile(participantsFile, JSON.stringify(list), (err) => {
	      	if (err) console.error(err);
	      	console.log(`Saved list to ${participantsFile}`);
	      });
	      cb(list);
	    }
    }
  });
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// @TODO: Map challonge username to SRC username
// Have a list of the cases where they do not match
let challongeToSRCMap = {
	"TGH_": "TGH",
	"Ineb": "Andy",
	"released": "JoshRTA",
	"helgefmi": "poor_little_pinkus",
	"Salatmann": "Salatmann92",
	"SNESChalmers": "SNESChalmers_",
	"Lui37": "Lui",
	"Mishrak": "mishrak109",
	"SerelepeM": "SerelepeMarsupial",
	"ElminsterRTA": "Elminster",
	"Maniacal42": "Maniacal",
	"mashystrr": "mashy",
	"jerbie2": "jerbie",
	"Jem_": "Jem",
	"mugi": "ivan"
};

// NotFmayweather (cryptonberry)
// Shatty (ShattyGames)
// Superplayer02 (SprSuperplayer2)
// felix_tc (felix0the0cat)
// __ICEY420Ku$hb0ii69__ (VReznor)
// Lyra (MoonlightMelody)
// Maxketchumz (bigzizio)

let pbOverrides = {
	"wqqqqwrt": 5012,
	"runnerwatcher": 5242
};

let missingCount = 0;
let foundCount = 0;

getParticipants((list) => {
	// Pull in current PB's for all challonge entrants
	console.log('Searching SRC for PB times for all participants...');
	const startPBSearch = async (cb) => {
		await asyncForEach(list, async (participant, index, theList) => {
			participant.srcUsername = challongeToSRCMap.hasOwnProperty(participant.challongeUsername) ? challongeToSRCMap[participant.challongeUsername] : participant.challongeUsername;
			console.log(`Starting search for ${participant.srcUsername}...`);
			if (pbOverrides.hasOwnProperty(participant.challongeUsername)) {
				participant.pb = pbOverrides[participant.challongeUsername];
				console.log(`Found PB of ${participant.pb} for ${participant.srcUsername}`);
			} else {
				try {
					let run = await src.findPB(participant.srcUsername, 'nmg', 'any');
					if (run.run && run.run.times && run.run.times.primary_t) {
						console.log(`Found PB of ${run.run.times.primary_t} for ${participant.srcUsername}`);
						participant.pb = run.run.times.primary_t;
				  }
				} catch (e) {
					console.error(e);
				}
			}

			if (participant.hasOwnProperty('pb')) {
				foundCount++;
			} else {
				missingCount++;
				console.log(`!!!!! ${participant.challongeUsername} !!!!!`);
			}

			list[index] = participant;
		});
		cb(list, foundCount, missingCount);
	};

	startPBSearch((list, foundCount, missingCount) => {
		console.log(`Finished PB search... found ${foundCount}, missing ${missingCount}`);
		fs.writeFile(participantsFile, JSON.stringify(list), (err) => {
			if (err) console.error(err);
				console.log(`Saved list to ${participantsFile}!`);
			});
	});

	// Sort PBs

	// Update seeds on challonge

	// Stop process
	//process.exit(0);
});

// catch Promise errors
process.on('unhandledRejection', console.error);