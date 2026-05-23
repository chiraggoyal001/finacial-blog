import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(3000);
  
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('dom_dump.html', html);
  
  await browser.close();
})();
