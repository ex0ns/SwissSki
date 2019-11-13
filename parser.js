const http = require("superagent");
const Station = require('./station');
const puppeteer = require('puppeteer');
const JSSoup = require('jssoup').default;
const PromisePool = require('@mixmaxhq/promise-pool');

const BASE_URL = "https://snow.myswitzerland.com/";
const CONCURRENCY = 5;

let results = [];
class Parser {

  static async _loadAll(browser) {
    const page = await browser.newPage();
    await page.goto(BASE_URL + '/bulletin_enneigement/piste/?search_check_pist_big=true&search_check_pist_medium=true&search_check_pist_small=true&noidx=1');
    page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    let results = [];

    let i = 0;
    while (true) {
        try {
            await page.waitForSelector('.Pagination--link');
            const links = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('a.FilterGridTable--link'),
                    a => a.getAttribute('href')
                )
            );
            results = results.concat(links);
            i = i + 1;
            await page.evaluate(() => {
                // This will raise a TypeError: Cannot read property 'click' of undefined
                // when on the last page. This will end the loop (catched exception)
                document.getElementsByClassName('Pagination--link next')[0].click();
            });
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        } catch ( e ) {
            console.log(i + " pages loaded");
            break;
        }
    }
    await page.close();
    return results;
  }

  static async _extractStationData(browser, url) {
      const page = await browser.newPage();
      await page.goto(url, {waitUntil: 'domcontentloaded'})
          .catch((err) => { console.error("Can't visit " + url + err ); });
      console.log("Visiting " + url);

      let name = await page.$('.PageHeader--title');
     name = await page.evaluate(el => el.innerHTML.trim(), name);


      let additional = await page.$('#articlesection-u19');
      if(additional === null) {
          console.error("Unable to find widget for " + url);
          await page.close();
          return null;
      }

      let widgets = await additional.$$('.SummaryAccordion--summary');
      if(widgets.length == 0) {
          console.error("Unable to find additional widgets");
          await page.close();
          return null;
      }
      let snowWidget = widgets[0];
      let skiWidget = widgets[1];
      if(snowWidget == null || skiWidget == null) {
          console.error("Unable to find ski or snow widget");
          await page.close();
          return null;
      }

      let open = await skiWidget.$('.QuickStatus');
      open = await page.evaluate(el => el.className.indexOf("open") !== -1, open);

      let weatherJSON = JSON.parse(await page.evaluate(
          () => document.querySelector('[data-js-weather]').getAttribute('data-js-weather')
      ));
      let weatherKey = weatherJSON.rKey;
      let weatherProvider = weatherJSON.provider.replace('{rKey}', weatherKey).replace('//', 'http://');

      let temp = '-1000';
      try {
        let weatherContent = await http.get(weatherProvider);
        weatherContent = JSON.parse(weatherContent.res.text);
        let forecasts = weatherContent.forecasts;
        if(forecasts.length == 0) {
            console.error("No forecasts for this station");
            await page.close();
            return null;
        }
        temp = forecasts[0].temperature_2m_max_12h;
      } catch (e) {
      }

      let snow = await snowWidget.$('.QuickFacts--value');
      if(snow == null) {
          console.error("Unable to find weather sub widget");
          await page.close();
          return null;
      }
      snow = await page.evaluate(el => el.innerText.trim(), snow);

      let snowStation = await snowWidget.$('.QuickFacts--content');
      let debug = await page.evaluate(el => el.innerHTML, snowWidget);
      if(snowStation != null) {
          snowStation = await page.evaluate(el => el.innerText.trim(), snowStation);
          snowStation = snowStation.replace('dans la station', '').trim();
      } else {
          snowStation = 0;
      }

      let slopes = await skiWidget.$('.QuickFacts--value');
      if(slopes == null) {
          console.error("Unable to find slope widget");
          await page.close();
          return null;
      }
      slopes = await page.evaluate((el) => {
        const results = /(\d+\/\d+)/g.exec(el.innerText.trim());
        if (results && results.length > 0) {
            return results[0];
        } else {
            return undefined;
        }
      }, slopes);


      await page.close().catch((err) => { });
      let station = new Station(name, temp, snow, snowStation, slopes, open);
      results.push(station);
  }

  static async parse() {
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS === "false" || true
    });
    results = [];

    const page = await browser.newPage();
    const stations_urls = (await Parser._loadAll(browser));
    console.log("Loaded " + stations_urls.length + " stations");
    const promiseProducer = async (url) => {
        if(!url) {
            return null;
        }
        try {
            return Parser._extractStationData(browser, BASE_URL + url).catch(err => {
                console.error(err);
            });
        } catch (err) {
            return null;
        }
    };

    const pool = new PromisePool({numConcurrent: CONCURRENCY});
    for(let url of stations_urls) {
        await pool.start(promiseProducer, url);
    }
    const errors = await pool.flush();
    console.log("Done");

    await browser.close();
    return results;
  }
}

module.exports = Parser;
