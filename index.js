const difflib = require('difflib');
const Parser = require("./parser");

function renameStation(station) {
  const renames = {
    'Les Diablerets - Glacier 3000': "Too Expensive",
    'Jaunpass - Boltigen': 'Much duplicate',
    
    'Les Mosses-La Lécherette': 'La Lécherette',
    'Leysin-Mosses-Lécherette': 'Les Mosses'
  }

  if(Object.keys(renames).indexOf(station.name) !== -1) {
    station.name = renames[station.name];
  }

  return station;
}

const matched = [];

function filterStations(station, names) {
  if(names.indexOf(station.name) !== -1){
    matched.push(station.name)
    return true;
  }
      
  for(let name in names) {
    if(station.name.indexOf(name) !== -1) {
      matched.push(name);
      return true;
    }
  }
    
  const matches = difflib.getCloseMatches(station.name, names);
  const result = matches.length !== 0;

  if(result) {
    matched.push(matches[0])
  }

  return result;
}

async function start() {
  const allStations = await Parser.parse();
  const mpStations = await Parser.parseMagicPass();

  const filtered = allStations
    .map(station => renameStation(station))
    .filter(station => filterStations(station, mpStations));

  console.log(allStations)
};


try {
  start();
} catch(e) {
  console.error(e);
}

