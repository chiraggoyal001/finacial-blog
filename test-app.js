import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = {
    consoleErrors: [],
    pageErrors: [],
    networkErrors: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      issues.consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', error => {
    issues.pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      issues.networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  const routesToTest = [
    '/',
    '/modules',
    '/videos',
    '/events',
    '/login',
    '/signup'
  ];

  for (const route of routesToTest) {
    try {
      console.log(`Testing ${route}...`);
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      // Wait a bit for client side rendering or React Query fetches
      await page.waitForTimeout(2000);
    } catch (e) {
      console.error(`Error navigating to ${route}:`, e.message);
    }
  }

  fs.writeFileSync('bugs.json', JSON.stringify(issues, null, 2));

  await browser.close();
}

run().catch(console.error);
