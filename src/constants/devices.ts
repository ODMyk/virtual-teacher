export const DEVICE_NAME = "BlackHole 16ch";
export const OPTIMAL_VIEWPORT = {height: 900, width: 1600};
export const PUPPETEER_BROWSER_ARGS = [
  "--disable-blink-features=AutomationControlled", // Prevents bot detection
  "--start-maximized",
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-infobars",
  "--enable-features=NetworkService,NetworkServiceInProcess",
  "--disable-features=IsolateOrigins,site-per-process",
  "--allow-running-insecure-content",
];
