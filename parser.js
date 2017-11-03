const http = require("superagent");
const Station = require('./station');
const puppeteer = require('puppeteer');
const JSSoup = require('jssoup').default;

class Parser {
  static async _loadAll(page) {
    page.waitForNavigation({waitUntil: 'domcontentloaded'});
    
    while(true) {
      try {
        var a = await page.click("#moreResult");
        await page.waitFor(1500);
      } catch(e) {
        break;
      }
    }
  }

  static async _extractStationData(page) {
    const elements = await page.$$(".sportsinfo tr")
    return await Promise.all(elements.splice(1).map(async (station) => {
      let name = await station.$('.location h3');
      let temp = await station.$('.weather em');
      let snow = await station.$('td.info_set2 em');
      let snow_station = await station.$('td.info_set2 span');
      
      if(name)
        name = await page.evaluate((el) => el.innerText.trim(), name);
      else console.log(await page.evaluate((el) => el.innerHTML, station))
      if(temp)
        temp = await page.evaluate((el) => el.innerText.trim(), temp);
      if(snow)
        snow = await page.evaluate((el) => el.innerText.trim(), snow)
      if(snow_station)
        snow_station = await page.evaluate((el) => el.innerText.replace('dans la station', '').trim(), snow_station)
  
      return new Station(name, temp, snow, snow_station);
    }));
  }

  static async parse() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://snow.myswitzerland.com/bulletin_enneigement/');
    await page.click("#check02");
   
    await Parser._loadAll(page);
    const stations = await Parser._extractStationData(page);

    await browser.close();  
    return stations;
  }

  static async parseMagicPass() {
    const MP_URL = "https://www.magicpass.ch/fr/stations/"
    const response = await http.get(MP_URL);

    const soup = new JSSoup(response.text)
    
    const mp_stations = soup.findAll('div', 'station-item');
    return mp_stations.map((station) => {
      return station.find('span', 'station-name').getText().trim();
    });
  }
}

module.exports = Parser;