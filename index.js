const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://snow.myswitzerland.com/bulletin_enneigement/');
  await page.click("#check02");
  
  await page.click("#moreResult");
  await page.waitForNavigation({waitUntil: 'networkidle'});

  const viewToken = await page.evaluate(id => 
    document.getElementById("j_id1:javax.faces.ViewState:0").value);

  const cookies = await page.cookies();
  const sessionID = cookies.filter((cookie) => cookie.name === "JSESSIONID").map((cookie) => cookie.value)[0];

  while(true) {
    try {
      var a = await page.click("#moreResult");
      await page.waitForNavigation({waitUntil: 'networkidle'});
    } catch(e) {
      break;
    }
   
  }

  console.log("After await")
  await browser.close();

  return {sessionID, viewToken};
})();
