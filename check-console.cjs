import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console messages
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Collect uncaught errors
  page.on('pageerror', exception => {
    logs.push(`[UNCAUGHT] ${exception.message}`);
  });

  console.log('Navigating to http://localhost:5174/ ...');
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  } catch (err) {
    console.error('Error navigating:', err);
  }

  console.log('--- CONSOLE LOGS ---');
  if (logs.length > 0) {
    logs.forEach(log => console.log(log));
  } else {
    console.log('No warnings or errors found.');
  }
  
  await browser.close();
})();
