const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  const routes = [
    '/',
    '/modules',
    '/videos',
    '/events'
  ];

  for (const route of routes) {
    try {
      console.log(`Navigating to ${route}...`);
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' });
      // Wait an extra second for animations to settle
      await page.waitForTimeout(1000);
      
      const fileName = route === '/' ? 'home' : route.substring(1).replace('/', '-');
      await page.screenshot({ path: `screenshots/${fileName}.png`, fullPage: true });
      console.log(`Saved screenshot for ${route}`);
    } catch (e) {
      console.error(`Failed to capture ${route}:`, e);
    }
  }

  await browser.close();
}

run();
