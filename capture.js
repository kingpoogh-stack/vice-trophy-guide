import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
mkdirSync(join(root, 'screenshots'), { recursive: true });
const policyPath = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const policySha = createHash('sha256').update(readFileSync(policyPath)).digest('hex');
const hatchArgs = ['--hatch-webgl-allowed-domains-file=' + policyPath, '--hatch-webgl-allowed-domains-sha256=' + policySha, '--disable-gpu-sandbox', '--allow-file-access-from-files', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks', '--allow-insecure-localhost'];
const server = spawn('node', [join(root, 'serve.ts')], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitServer() {
  for (let i = 0; i < 50; i++) { try { const r = await fetch('http://localhost:8080/'); if (r.ok) return true; } catch {} await sleep(200); }
  return false;
}
let useHttp = await waitServer();
const browser = await puppeteer.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', ...hatchArgs] });
try {
  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: s.w, height: s.h });
    const url = useHttp ? 'http://localhost:8080/' + s.query : pathToFileURL(join(root, 'app', 'index.html')).href + s.query;
    try { await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }); }
    catch (e) {
      if (useHttp) { useHttp = false; await page.goto(pathToFileURL(join(root, 'app', 'index.html')).href + s.query, { waitUntil: 'load', timeout: 30000 }); }
      else throw e;
    }
    await page.waitForFunction('window.__shotReady === true', { timeout: 30000 });
    await sleep(300);
    let quality = 85; let buf;
    while (true) {
      buf = await page.screenshot({ type: 'jpeg', quality });
      if (buf.length <= 250 * 1024 || quality <= 15) break;
      quality -= 10;
    }
    writeFileSync(join(root, 'screenshots', s.name), buf);
    console.log(s.name, statSync(join(root, 'screenshots', s.name)).size, 'bytes @q' + quality);
    await page.close();
  }
} finally { await browser.close(); server.kill(); }
