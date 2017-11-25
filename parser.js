const http = require("superagent");
const Station = require('./station');
const puppeteer = require('puppeteer');
const JSSoup = require('jssoup').default;


const TIMEOUT = 1500;

class Parser {
  static async _loadAll(page) {
    page.waitForNavigation({
      waitUntil: 'domcontentloaded'
    });

    while (true) {
      try {
        var a = await page.click("#moreResult");
        await page.waitFor(TIMEOUT);
      } catch ( e ) {
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
        let slopes = await station.$('td.info_set3 em');
        let open = false;

        if (name) {
          name = await page.evaluate((el) => el.innerText.trim(), name);
        } else {
          console.log(await page.evaluate((el) => el.innerHTML, station))
        }
        if (temp) {
          temp = await page.evaluate((el) => el.innerText.trim(), temp);
        }
        if (snow) {
          snow = await page.evaluate((el) => el.innerText.trim(), snow);
        }


        if (snow_station) {
          snow_station = await page.evaluate((el) => el.innerText.replace('dans la station', '').trim(), snow_station);
        }
        if (slopes) {
          open = await page.evaluate((el) => el.className.indexOf("open") !== -1, slopes);
          slopes = await page.evaluate((el) => {
            const results = /(\d+\/\d+)/g.exec(el.innerText.trim());
            if (results && results.length > 0) {
              return results[0]
            } else {
              return undefined;
            }
          }, slopes);
        }

        return new Station(name, temp, snow, snow_station, slopes, open);
      }));
  }

  static async parse() {
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS === "false" || true
    });
    const page = await browser.newPage();
    await page.goto('https://snow.myswitzerland.com/bulletin_enneigement/');
    await page.click("#check02");

    await Parser._loadAll(page);
    const stations = await Parser._extractStationData(page);

    await browser.close();
    return stations;
  }
}

module.exports = Parser;