const { chromium, firefox } = require('playwright');

const TARGET_URL = 'http://localhost:4200';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImI5MDVjYWY2LWVkMWItNGRkNi1iOWIwLTRmOTdhYjk3MWI4OSIsImVtYWlsIjoiYW5nZWxAamRpYXouY29tIiwidXNlcm5hbWUiOiJBbmdlbGdjZTIiLCJmaXJzdE5hbWUiOiJBbmdlbCIsImxhc3ROYW1lIjoiQ2hhdmV6IiwiYXZhdGFyIjoidXNlci1hdmF0YXJzLzVlMjJhMmFlLWQyMjEtNDE3Yy04ZjVlLTBhODAzODBmN2M4Ny0xNzY1NDM0MzI0NjQ5Iiwic3RhdHVzIjoiQUNUSVZFIiwicm9sZSI6WyJ1c2VyIiwiYmV0YSJdLCJsYW5ndWFnZSI6ImVuZyIsImlhdCI6MTc3MTY1MDY5OCwiZXhwIjoxNzcyMjU1NDk4fQ.6iF3HUeYDQ2_1N8lvUMVhMMPCLtrlBneMkfWoJwsOu8';

const VIEWPORT = { width: 1280, height: 720 };

async function screenshotBrowser(browserType, browserName) {
  console.log(`\n=== ${browserName.toUpperCase()} ===`);
  const browser = await browserType.launch({ headless: false });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((token) => { localStorage.setItem('token', token); }, TOKEN);
  await page.goto(TARGET_URL + '/lobby', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(6000);

  await page.screenshot({ path: `C:/tmp/${browserName}-zoom-test.png`, fullPage: false });
  console.log(`Screenshot: C:/tmp/${browserName}-zoom-test.png`);

  await browser.close();
}

(async () => {
  try {
    await screenshotBrowser(chromium, 'chromium');
    await screenshotBrowser(firefox, 'firefox');
    console.log('\nDone! Compare screenshots.');
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
