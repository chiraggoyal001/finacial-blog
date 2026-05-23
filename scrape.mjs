import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  console.log("Navigating to Superdesign...");
  await page.goto('https://app.superdesign.dev/library', { waitUntil: 'networkidle' });
  console.log("Extracting sidebar links...");
  
  // Extract all links in the document to see what websites are in the library
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.href
    })).filter(l => l.text.length > 0 && l.href.startsWith('http'));
  });
  
  fs.writeFileSync('superdesign_links.json', JSON.stringify(links, null, 2));
  console.log("Done extracting links.");
  
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('superdesign_text.txt', text);
  
  await browser.close();
})();
