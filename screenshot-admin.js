import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/admin');
  
  // Wait for network idle or main selector
  await page.waitForTimeout(2000);
  
  // Log body classes or inline styles
  const bodyStyles = await page.evaluate(() => {
    return {
      pointerEvents: document.body.style.pointerEvents,
      classes: document.body.className
    }
  });
  console.log('Body styles:', bodyStyles);
  
  // Check if we were redirected to login
  console.log('Current URL:', page.url());
  
  await page.screenshot({ path: 'admin-screenshot.png' });
  await browser.close();
})();
