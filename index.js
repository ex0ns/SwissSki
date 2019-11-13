const Bot = require('./bot');
const Parser = require('./parser');
const {List} = require('immutable');
const Station = require('./station');
const CronJob = require('cron').CronJob;

function filterStations(station) {
    const magicPassStations = [
        'Anzère',
        'Bugnenets - Savagnières',
        'Charmey',
        "La Braye - Château-d'Oex",
        'Crans - Montana',
        'Grimentz-Zinal /Anniviers',
        'Jaun - Dorf',
        'La Berra - La Roche',
        'Leysin-Mosses-Lécherette',
        'Les Mosses-La Lécherette',
        'Les Marécottes',
        'Les Diablerets',
        'Les Paccots',
        'Leysin',
        'Moléson s/Gruyères',
        'Nax / Mont-Noble',
        'Ovronnaz',
        'Rathvel s/Châtel-St-Denis',
        'Schwarzsee FR',
        'St-Luc - Chandolin/Anniviers',
        'Tramelan',
        'Vercorin',
        'Villars-Gryon'
    ];

    return magicPassStations.indexOf(station.name) !== -1;
}
;

let mpBot;
let swissBot;

async function parseData() {
    const allStations = List(await Parser.parse());
    const filtered = allStations.slice()
          .filter(station => filterStations(station));
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
    }

    if (process.env.TOKEN) {
        if (swissBot) {
            swissBot.setStations(full);
        } else {
            swissBot = new Bot(process.env.TOKEN, full);
        }
    }
}
;

try {
    runBots();
} catch ( e ) {
    console.error(e);
}
