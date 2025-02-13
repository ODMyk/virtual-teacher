import puppeteer from "puppeteer";
import {PUPPETEER_PROFILE} from "@constants/filesystem";
import {OPTIMAL_VIEWPORT, PUPPETEER_BROWSER_ARGS} from "@constants/devices";
import {BasicAppFactory} from "core/basic/BasicAppFactory";

// TODO: Create a way to inject the setup data into app
const MEET_URL = "https://meet.google.com/gfb-syrf-fpo";

const sleep = async (ms: number) =>
  await new Promise((res) => setTimeout(res, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: PUPPETEER_BROWSER_ARGS,
    userDataDir: PUPPETEER_PROFILE,
    defaultViewport: OPTIMAL_VIEWPORT,
  });

  const page = await browser.newPage();
  await page.goto(MEET_URL);

  console.log("Google Meet Agent Joining...");

  await page.waitForSelector('button[jscontroller="O626Fe"]', {visible: true});
  await page.click(
    'div[jscontroller="dtQcwe"][data-device-type="1"] button[jscontroller="soHxf"]',
  );
  await page.waitForSelector("span[jsname='K4r5Ff']");
  await page.evaluate(() => {
    const span = [...document.querySelectorAll("span[jsname='K4r5Ff']")].find(
      (el) => el.textContent?.includes("BlackHole"),
    );
    if (span) (span as any).click();
  });
  await sleep(200);
  await page.click(
    'div[jscontroller="dtQcwe"][data-device-type="2"] button[jscontroller="soHxf"]',
  );
  await page.waitForSelector(
    `ul[aria-label="Device selection for the speaker"]`,
  );
  await page.evaluate(() => {
    const span = [
      ...document.querySelectorAll(
        `ul[aria-label="Device selection for the speaker"] span[jsname='K4r5Ff']`,
      ),
    ].find((el) => el.textContent?.includes("BlackHole"));
    setTimeout(() => {
      console.log(span);
      if (span) (span as any).click();
    }, 500);
  });
  await sleep(200);

  await page.click('button[jscontroller="O626Fe"]');

  // TODO: Replace with some selector for better UX
  await page.waitForSelector('div[jsname="RFn3Rd"');
  console.log("Agent Joined the Meeting");

  const app = BasicAppFactory.create();
  app.run();
})();
