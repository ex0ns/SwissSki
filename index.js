const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://snow.myswitzerland.com/bulletin_enneigement/');
  await page.click("check02");
  await page.waitFor("moreResult");

  

  await browser.close();
})();
