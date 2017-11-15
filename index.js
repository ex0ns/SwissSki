const Bot = require("./bot");
const difflib = require('difflib');
const Parser = require("./parser");
const Station = require('./station');
const {List} = require('immutable');
const CronJob = require('cron').CronJob;

function renameStation(station) {
  const renames = {
    'Les Diablerets - Glacier 3000': "Too Expensive",
    'Jaunpass - Boltigen': 'Much duplicate',

    'Les Mosses-La Lécherette': 'La Lécherette',
    'Leysin-Mosses-Lécherette': 'Les Mosses'
  };

  if (Object.keys(renames).indexOf(station.name) !== -1) {
    const copy = Object.assign({}, station);
    copy.name = renames[station.name];
    return new Station(copy);
  }

  return station;
};

function filterStations(station, names) {
  if (names.indexOf(station.name) !== -1) {
    return true;
  }

  for (let name in names) {
    if (station.name.indexOf(name) !== -1) {
      return true;
    }
  }

  const matches = difflib.getCloseMatches(station.name, names.toJS());
  const result = matches.length !== 0;

  return result;
};

let mpBot = undefined;
let swissBot = undefined;

async function parseData() {
  const allStations = List(await Parser.parse());
  const mpStations = List(await Parser.parseMagicPass());

  console.log(`Got ${mpStations.size} stations from MagicPass`);

  const filtered = allStations.slice()
    .map(station => renameStation(station))
    .filter(station => filterStations(station, mpStations));

  return {
    full: allStations,
    mp: filtered
  };
};

new CronJob('00 */2 * * *', async () => await runBots()).start();

async function runBots() {
  const {full, mp} = await parseData();
  if (process.env.MP_TOKEN) {
    if (mpBot) {
      mpBot.setStations(mp);
    } else {
      mpBot = new Bot(process.env.MP_TOKEN, mp);
    }

    if (swissBot) {
      swissBot.setStations(full);
    } else {
      swissBot = new Bot(process.env.TOKEN, full);
    }
  }
};


try {
  runBots();
} catch ( e ) {
  console.error(e);
}

