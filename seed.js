const request = require('request');
const fs = require('fs');
const config = require('./config.json');
const challongeApiBaseUrl = `https://${config.challonge.username}:${config.challonge.apiKey}@api.challonge.com/v1/`;
const userAgent = "alttp-tourney-seeder/1.0";
let parseArgs = require('minimist')(process.argv.slice(2));
let groupsFile = parseArgs._[0] || false;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// Pull in specified groups file
if (!fs.existsSync(groupsFile)) {
	console.error('Specified groups file does not exist!');
	process.exit(1);
}

let groups = JSON.parse(fs.readFileSync(groupsFile));
console.log(`Found ${groups.length} groups to seed...`);

// Update seeds on challonge
let basePath = `tournaments/${config.challonge.tourneyId}/participants/`;

const startUpdate = async (cb) => {
	await asyncForEach(groups, async (group) => {
		await asyncForEach(group.members, async (participant) => {
			try {
				//await updateParticipantSeed(participant);
			} catch (e) {
				console.error(e);
			}
		});
	});
	cb();
}

startUpdate(() => {console.log('Update finished')});

function updateParticipantSeed(participant) {
	return new Promise((resolve, reject) => {
		let participantReq = {
			url: challongeApiBaseUrl+basePath+participant.challongeId+'.json',
			method: 'PUT',
			headers: {'User-Agent': userAgent},
			body: {seed: participant.groupSeed},
			json: true
		};

		//console.log(participantReq);

		request(participantReq, function(error, response, body) {
		  if (!error && response.statusCode == 200) {
		    console.log(`Updated seed for ${participant.challongeUsername} to ${participant.groupSeed}`);
		  	resolve(true);
		  } else {
		  	console.log(`Received statusCode ${response.statusCode} from challonge: `, error, body);
		  	reject(error);
		  }
		});
	});
}

// catch Promise errors
process.on('unhandledRejection', console.error);