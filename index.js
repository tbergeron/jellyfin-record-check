// config
const { logging, recordingMsg, notRecordingMsg, url, interval, titleToLookFor } = require('./config');
// selenium
const { Builder, By, until } = require('selenium-webdriver');
// browser driver
const firefox = require('selenium-webdriver/firefox');
// xpath
const xpath = `//*[text()='${titleToLookFor}']`;
const by    = By.xpath(xpath);

// just to keep it safe from infinite loops
if (typeof interval === 'undefined') {
  interval = 60;
}

// main check
function check() {
  var start = new Date();
  log('Check loop has started...');

  (async function getRecordingState() {
    log(`Creating browser driver...`);
    // building headless browser session
    let driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(new firefox.Options().headless(true))  
      .build();
  
    try {
      log('Fetching url...');
      await driver.get(url);
      log('Attemping to locate element...');
      await driver.wait(until.elementLocated(by));
      // warn user if element exists
      if (await driver.findElement(By.xpath(xpath)).isDisplayed()) {
        log(`Element has been found! ${xpath}`);
        // remove old tray
        let t = getTrayObject();
        if (t) t.remove();
        // create new tray
        let o = new nw.Tray({ title: recordingMsg, tooltip: recordingMsg, icon: 'recording.png' });
        // set menu
        o.menu = getTrayMenu();
        // retain new tray object
        setTrayObject(o);
        log(`Cleaning old tray and creating new one (recording)...`);
      } else {
        log(`Element cannot be found... ${xpath}`);
        // remove old tray
        let t = getTrayObject();
        if (t) t.remove();
        // create new tray
        let o = new nw.Tray({ title: notRecordingMsg, tooltip: notRecordingMsg, icon: 'not_recording.png' });
        // set menu
        o.menu = getTrayMenu();
        // retain new tray object
        setTrayObject(o);
        log(`Cleaning old tray and creating new one (notRecording)...`);
      }
    } finally {
      log(`Discarding browser driver...`);
      await driver.quit();
    }
    log(`Check loop has ended. (exec time: ${new Date().getTime()-start.getTime()}ms)`);
  })();
}

// dirty tray retainer
let tray = null;

function setTrayObject(o) {
  tray = o;
}

function getTrayObject() {
  return tray;
}

// tray menu
function getTrayMenu() {
  var menu = new nw.Menu();
  menu.append(new nw.MenuItem({
    label: 'Quit',
    click: () => {
      nw.App.quit();
    }
  }));
  return menu;
}

// main timer loop
function startTimer() {
  setTimeout(() => {
    check();
    startTimer();
  }, interval * 1000);
}

// dirty log function
function log(msg) {
  if (logging) {
    console.log(`log: ${msg}`);
    if (typeof document !== 'undefined') {
      document.write(`log: ${msg}<br/>`);
    }
  }
}

// start main loop
startTimer();