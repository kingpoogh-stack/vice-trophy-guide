import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root = new URL('.', import.meta.url).pathname;
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const server = spawn('node', ['serve.ts'], { cwd: root, stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://localhost:8080/');
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server did not start');
}

async function shoot(browser, shot) {
  const page = await browser.newPage();
  await page.setViewport({ width: shot.w, height: shot.h });
  try {
    await page.goto('http://localhost:8080/' + shot.query, { waitUntil: 'networkidle0', timeout: 20000 });
  } catch {
    await page.goto('file://' + join(root, 'app', 'index.html') + shot.query, { waitUntil: 'load', timeout: 20000 });
  }
  const listId = shot.query.includes('view=roadmap') ? '#roadmap-list' : '#trophy-list';
  await page.waitForFunction((sel) => { const el = document.querySelector(sel); return el && el.children.length > 0; }, { timeout: 15000 }, listId);
  await new Promise((r) => setTimeout(r, 500));
  let quality = 85;
  while (true) {
    const buf = await page.screenshot({ type: 'jpeg', quality });
    const out = join(root, 'screenshots', shot.name);
    writeFileSync(out, buf);
    const size = statSync(out).size;
    console.log(shot.name, size, 'bytes at quality', quality);
    if (size <= 250 * 1024 || quality <= 15) break;
    quality -= 10;
  }
  await page.close();
}

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt', '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks', '--allow-insecure-localhost', '--allow-file-access-from-files'],
  });
  for (const shot of shots) {
    await shoot(browser, shot);
  }
  await browser.close();
} finally {
  server.kill();
}
