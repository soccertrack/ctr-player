// We'll use Puppeteer is our browser automation framework.
const puppeteer = require('puppeteer');

const agents = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.33 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.16",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.16 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.16",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36 Edg/103.0.1264.62",
];

const searchTerms = [
  "kanban+and+sequence+diagram",
  "kanban+sequence+diagram",
  "sequence+diagram+kanban"
];
/*
const searchTerms = [
  "how+to+prevent+food+spoilage",
  "prevent+spoiled+food",
  "stop+food+spoilage",
  "keep+food+from+spoilage",
  "stop+spoil+food"
];
*/
const minWait = 2500;
const maxWait = 5000;

const meanWidth = 1200;
const meanHeight = 900;

// This is where we'll put the code to get around the tests.
const preparePagEnvironment = async (page) => {
  // Pass the User-Agent Test.
  let userAgent = agents[parseInt(Math.floor(Math.random() * agents.length))];
  console.log(`Using UA: ` + userAgent)
  await page.setUserAgent(userAgent);

  // Pass the Webdriver Test.
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // Pass the Chrome Test.
  await page.evaluateOnNewDocument(() => {
    // We can mock this in as much depth as we need for the test.
    window.navigator.chrome = {
      runtime: {},
      // etc.
    };
  });

  // Pass the Permissions Test.
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;
    return window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  // Pass the Plugins Length Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'plugins', {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5],
    });
  });

  // Pass the Languages Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });
}

let width = meanWidth + getRandomInt(200);
let height = meanHeight + getRandomInt(200);
let searchTerm = searchTerms[getRandomInt(searchTerms.length)];
//let targetSelector = 'a[href^="https://defiel.com/"]';
let targetSelector = 'a[href^="https://kan-ban.org"]';

(async (width, height, searchTerm, targetSelector) => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    args: [`--no-sandbox`,`--window-size=${width},${height}`],
    headless: false,
    defaultViewport: {
        width:width,
        height:height
      }
  });
  const page = await browser.newPage();
  const maxPageToTurn = 6;
  var pageNumber = 0;

  // Prepare for the tests (not yet implemented).
  await preparePagEnvironment(page);

  const searchUrl = `https://www.google.com/search?q=${searchTerm}&oq=${searchTerm}&sourceid=chrome&ie=UTF-8`
  console.log(`nav to ${searchUrl}`);
  await page.goto(searchUrl);

  for (pageNumber=1; pageNumber<=maxPageToTurn; pageNumber++) {
    await delay(Math.max(getRandomInt(2500), 1000));
    await autoScroll(page);

    try {
      let match = await page.waitForSelector(targetSelector, { timeout: 1000 });
      
      if (match) {
        console.log('Found target url, clicking into it.');

        // perform target page task.
        await handleDestinationTask(page, targetSelector);

        // get out of the loop
        break;
      }
    } catch(e) {
      console.log(e);
      console.log('No match for page ' + pageNumber)
    }

    // no match for this page, go to the next page.
    let button = await page.waitForSelector(`a[aria-label="Page ${pageNumber+1}"]`)
    if (button) {
      button.click();
    }
  }

  // Clean up.
  console.log(`successful run.`);
  await browser.close()
})(width, height, searchTerm, targetSelector);

async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          let getRandomInt = (max) => {
            return parseInt(Math.floor(Math.random() * max));
          };
          var totalHeight = 0;
          var distance = Math.max(getRandomInt(300), 80);
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight - window.innerHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, getRandomInt(700));
      });
  });
}

async function handleDestinationTask(page, targetSelector) {
  console.log('going into target page.');
  // found target url, clicking into it.
  await page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if(element) {
      element.scrollIntoView();
      element.click();
    }
  }, targetSelector);

  console.log('wait and scroll the target page.');
  // read and scroll target page.
  await delay(Math.max(getRandomInt(maxWait), minWait));
  await autoScroll(page);

  console.log('finding a link with https:// and click into it.');
  // find an external hyperlink, scroll into it and click.
  await page.evaluate((targetSelector) => {
    const elements = document.querySelectorAll(targetSelector);
    if(elements.length > 0) {
      let idx = parseInt(Math.floor(Math.max(Math.random() * elements.length)));
      elements[idx].scrollIntoView();
      elements[idx].click();
    }
  }, targetSelector);

  // stay around a bit and bail.
  console.log('stay around a bit and bail.');
  await delay(Math.max(getRandomInt(maxWait), minWait));
  await autoScroll(page);
}

function delay(time) {
  return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   });
}

function getRandomInt(max) {
    return parseInt(Math.floor(Math.random() * max));
}
