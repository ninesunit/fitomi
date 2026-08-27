import { chromium } from 'playwright';
const OUT = '/tmp/claude-0/-home-user-fitomi/34694acd-300b-5c27-a6ae-4e6cef8d7198/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let bad = 0;
for (const mode of ['quests','profile','raid','library','tools']) {
  const p = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:5199/preview/index.html?m=${mode}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/p-${mode}.png` });
  const txt = (await p.locator('body').innerText()).replace(/\n/g,' ').slice(0,70);
  console.log(`${mode.padEnd(9)} ${errs.length ? 'ERROR: ' + errs[0].slice(0,110) : 'ok'}  | ${txt}`);
  if (errs.length) bad++;
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
