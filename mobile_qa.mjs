import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9337;
const server = spawn(process.execPath, ['serve.mjs'], { cwd: root, stdio: 'ignore' });
const chrome = spawn(chromePath, [
  '--headless', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=C:\\tmp\\dedza-mobile-qa-${process.pid}`,
  'about:blank',
], { stdio: 'ignore' });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(url, attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await pause(300);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CDP {
  constructor(url) { this.url = url; this.id = 0; this.callbacks = new Map(); }
  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
      this.socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        const callback = this.callbacks.get(message.id);
        if (!callback) return;
        this.callbacks.delete(message.id);
        message.error ? callback.reject(message.error) : callback.resolve(message.result);
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return result.result.value;
  }
}

try {
  await Promise.all([
    waitFor('http://127.0.0.1:4173/'),
    waitFor(`http://127.0.0.1:${port}/json/list`),
  ]);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === 'page');
  const client = new CDP(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await pause(1400);

  const initial = await client.evaluate(`(() => {
    const heading=document.querySelector('h1').getBoundingClientRect();
    const menu=getComputedStyle(document.querySelector('.menu-button'));
    return {viewport:innerWidth,headingRight:Math.round(heading.right),headingLeft:Math.round(heading.left),menuDisplay:menu.display,horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  const menu = await client.evaluate(`(async () => { document.querySelector('.menu-button').click(); await new Promise(resolve=>setTimeout(resolve,350)); const nav=document.querySelector('.mobile-nav'); const box=nav.getBoundingClientRect(); return {open:nav.classList.contains('open'),aria:document.querySelector('.menu-button').getAttribute('aria-expanded'),left:Math.round(box.left),right:Math.round(box.right),top:Math.round(box.top),bodyLocked:document.body.classList.contains('menu-open')}; })()`);
  const menuShot = await client.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(root, 'snap_mobile_menu_fixed.png'), Buffer.from(menuShot.data, 'base64'));
  await client.evaluate(`document.querySelector('.menu-button').click()`);
  const search = await client.evaluate(`(async () => { document.querySelector('[data-search]').click(); await new Promise(resolve=>setTimeout(resolve,350)); const modal=document.querySelector('.search-modal').getBoundingClientRect(); const input=document.querySelector('#site-search').getBoundingClientRect(); return {open:document.querySelector('.site-search').classList.contains('open'),modalWidth:Math.round(modal.width),inputRight:Math.round(input.right),bodyLocked:document.body.classList.contains('search-open')}; })()`);
  const searchShot = await client.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(root, 'snap_mobile_search_fixed.png'), Buffer.from(searchShot.data, 'base64'));
  console.log(JSON.stringify({ initial, menu, search }, null, 2));
  client.socket.close();
} finally {
  server.kill();
  chrome.kill();
}
