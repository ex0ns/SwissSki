const Bot = require("./bot");
const difflib = require('difflib');
const Parser = require("./parser");
const Station = require('./station');
const { List } = require('immutable');

function renameStation(station) {
  const renames = {
    'Les Diablerets - Glacier 3000': "Too Expensive",
    'Jaunpass - Boltigen': 'Much duplicate',
    
    'Les Mosses-La Lécherette': 'La Lécherette',
    'Leysin-Mosses-Lécherette': 'Les Mosses'
  }
  
  if(Object.keys(renames).indexOf(station.name) !== -1) {
    const copy = Object.assign({}, station);
    console.log(`Rename ${station.name} in ${station.name}`);
    copy.name = renames[station.name];
    return new Station(copy);
  }
  
  return station;
}

function filterStations(station, names) {
  if(names.indexOf(station.name) !== -1){
    return true;
  }
  
  for(let name in names) {
    if(station.name.indexOf(name) !== -1) {
      return true;
    }
  }
  
  const matches = difflib.getCloseMatches(station.name, names.toJS());
  const result = matches.length !== 0;
  
  return result;
}

async function start() {
  const allStations = List(await Parser.parse());
  const mpStations = List(await Parser.parseMagicPass());
  
  console.log(`Got ${mpStations.size} stations from MagicPass`);

  const filtered = allStations.slice()
    .map(station => renameStation(station))
    .filter(station => filterStations(station, mpStations));

  if(process.env.MP_TOKEN) {
    new Bot(process.env.MP_TOKEN, filtered);
  }
  
  if(process.env.TOKEN) {
    new Bot(process.env.TOKEN, allStations);
  }
};


try {
  start();
} catch(e) {
  console.error(e);
}

