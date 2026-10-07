import http from 'node:http';

async function getPageTarget() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome://'));
  return page;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // In Node 22, WebSocket is globally available!
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result?.value;
  }
}

async function run() {
  const page = await getPageTarget();
  console.log('Connecting to page:', page.title, page.url);
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  console.log('Connected to CDP!');

  // Navigate to Home
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await new Promise(r => setTimeout(r, 1000));

  // Test 1: Title & H1
  const homeMeta = await client.eval(`({
    title: document.title,
    h1: document.querySelector('h1')?.innerText,
    hasCrest: !!document.querySelector('.mark img'),
    menuVisible: window.getComputedStyle(document.querySelector('.menu-button')).display !== 'none',
    ctaVisible: window.getComputedStyle(document.querySelector('.cta-small') || document.body).display !== 'none'
  })`);
  console.log('Home metadata & layout check:', homeMeta);

  // Test 2: Search interactive test
  const searchTest = await client.eval(`(() => {
    const btn = document.querySelector('[data-search]');
    if (!btn) return 'Search button not found';
    btn.click();
    const searchModal = document.querySelector('.site-search');
    const isOpen = searchModal.classList.contains('open');
    const input = document.querySelector('#site-search');
    input.value = 'news';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const results = document.querySelectorAll('.search-results a').length;
    document.querySelector('.search-close')?.click();
    const isClosed = !searchModal.classList.contains('open');
    return { isOpen, resultsFound: results, isClosed };
  })()`);
  console.log('Search test result:', searchTest);

  // Test 3: Navigate to /club/ and test Year tabs
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/club/' });
  await new Promise(r => setTimeout(r, 1000));

  const clubTest = await client.eval(`(() => {
    const yearBtns = Array.from(document.querySelectorAll('[data-year]'));
    const initialTitle = document.querySelector('.history-panel h2')?.innerText;
    const btn2021 = yearBtns.find(b => b.dataset.year === '2021');
    if (btn2021) btn2021.click();
    const updatedTitle = document.querySelector('.history-panel h2')?.innerText;
    return {
      availableYears: yearBtns.map(b => b.dataset.year),
      initialTitle,
      updatedTitle
    };
  })()`);
  console.log('Club year interactive test:', clubTest);

  // Test 4: Navigate to /matches/ and test filter tabs
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/matches/' });
  await new Promise(r => setTimeout(r, 1000));

  const matchesTest = await client.eval(`(() => {
    const filterBtns = Array.from(document.querySelectorAll('[data-filter]'));
    const allCards = document.querySelectorAll('[data-card]').length;
    const resultsBtn = filterBtns.find(b => b.dataset.filter === 'result');
    if (resultsBtn) resultsBtn.click();
    const visibleCards = Array.from(document.querySelectorAll('[data-card]')).filter(c => !c.hidden).length;
    return {
      filters: filterBtns.map(b => b.dataset.filter),
      allCards,
      visibleAfterFilterResult: visibleCards
    };
  })()`);
  console.log('Matches filter interactive test:', matchesTest);

  // Test 5: Navigate to /contact/ and test form submission toast
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/contact/' });
  await new Promise(r => setTimeout(r, 1000));

  const contactTest = await client.eval(`(() => {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return 'Form not found';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const statusText = form.querySelector('[role=status]')?.innerText;
    return { statusText };
  })()`);
  console.log('Contact form test:', contactTest);

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
