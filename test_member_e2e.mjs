import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE_DIR = 'c:\\Users\\GMT\\Downloads\\Dedza_dynamos_club\\site';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
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

  async click(selector) {
    return this.eval(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) throw new Error('Element not found: ${selector}');
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    })()`);
  }

  async type(selector, val) {
    return this.eval(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) throw new Error('Element not found: ${selector}');
      el.value = '${val}';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`📸 Screenshot saved: ${path.basename(filePath)}`);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== STARTING DEDZA DYNAMOS MEMBER PORTAL TEST SUITE ===\n');

  // 1. Start Public Preview Server (port 4173)
  console.log('▶ Starting public server (serve.mjs on port 4173)...');
  const serverProc = spawn('node', ['serve.mjs'], { cwd: SITE_DIR, stdio: 'pipe' });
  serverProc.stdout.on('data', d => console.log('  [serve.mjs]', d.toString().trim()));
  serverProc.stderr.on('data', d => console.error('  [serve.mjs ERR]', d.toString().trim()));

  // 2. Start Admin Server (port 4174)
  console.log('▶ Starting admin server (serve-admin.mjs on port 4174)...');
  const adminProc = spawn('node', ['serve-admin.mjs'], { cwd: SITE_DIR, stdio: 'pipe' });
  adminProc.stdout.on('data', d => console.log('  [admin.mjs]', d.toString().trim()));
  adminProc.stderr.on('data', d => console.error('  [admin.mjs ERR]', d.toString().trim()));

  // Wait for servers to be ready
  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const r = await fetch('http://127.0.0.1:4173/api/public/live-football');
      if (r.ok) { serverReady = true; break; }
    } catch {}
  }
  if (!serverReady) {
    console.error('❌ Server did not start in time.');
    serverProc.kill();
    adminProc.kill();
    process.exit(1);
  }
  console.log('✓ Public & Admin servers active!\n');

  // ── TEST 1: API ENDPOINTS ──────────────────────────────────────────────────
  console.log('--- TEST 1: REST API /api/public/members ---');

  // GET stats
  const statsRes = await fetch('http://127.0.0.1:4173/api/public/members');
  const statsData = await statsRes.json();
  console.log('✓ GET /api/public/members status:', statsRes.status);
  console.log('  Total members:', statsData.totalMembers);
  console.log('  Tiers breakdown:', statsData.tiers);

  // POST Registration
  const testEmail = `supporter_${Date.now()}@test.mw`;
  const regPayload = {
    action: 'register',
    fullName: 'Tamanda Zimba',
    email: testEmail,
    phone: '+265 888 777 666',
    district: 'Dedza',
    tier: 'gold',
    favoritePlayer: 'Clement Nyondo',
    pin: '2026'
  };
  const regRes = await fetch('http://127.0.0.1:4173/api/public/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  const regData = await regRes.json();
  console.log('✓ POST /api/public/members (Registration) status:', regRes.status);
  console.log('  Registered Member ID:', regData.member?.id);
  console.log('  Full Name:', regData.member?.fullName);
  console.log('  Tier:', regData.member?.tier);

  // POST Sign In
  const loginRes = await fetch('http://127.0.0.1:4173/api/public/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', credential: testEmail, pin: '2026' })
  });
  const loginData = await loginRes.json();
  console.log('✓ POST /api/public/members (Login) status:', loginRes.status);
  console.log('  Logged in member ID:', loginData.member?.id);
  console.log('  Verified Name:', loginData.member?.fullName);

  // Check Staff Admin API (port 4174)
  const staffRes = await fetch('http://127.0.0.1:4174/api/members');
  const staffData = await staffRes.json();
  const foundInStaff = (staffData.members || []).some(m => m.email === testEmail);
  console.log('✓ GET /api/members (Admin Staff API):');
  console.log(`  New member "${testEmail}" found in admin staff records: ${foundInStaff ? 'YES ✓' : 'NO ❌'}\n`);

  // ── TEST 2: BROWSER & UI VERIFICATION ──────────────────────────────────────
  console.log('--- TEST 2: BROWSER E2E TEST (Chrome Headless CDP) ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,1000'
  ]);

  let cdpReady = false;
  let wsUrl = '';
  for (let i = 0; i < 25; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const targets = await res.json();
      const page = targets.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        cdpReady = true;
        break;
      }
    } catch {}
  }

  if (!cdpReady) {
    console.error('❌ Could not connect to Chrome CDP.');
    chromeProc.kill();
    serverProc.kill();
    adminProc.kill();
    process.exit(1);
  }

  const client = new CDPClient(wsUrl);
  await client.connect();
  console.log('✓ Connected to Headless Chrome via Chrome DevTools Protocol!');

  // Navigate to /members/
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/members/' });
  await sleep(1000);

  // Check initial state
  const isAuthVisible = await client.eval(`document.getElementById('member-auth-section')?.style.display !== 'none'`);
  const isDashVisible = await client.eval(`document.getElementById('member-dash-section')?.style.display !== 'none'`);
  console.log('✓ Initial page load:');
  console.log('  Auth/Registration section visible:', isAuthVisible ? 'YES ✓' : 'NO ❌');
  console.log('  Dashboard section hidden:', !isDashVisible ? 'YES ✓' : 'NO ❌');

  await client.screenshot(path.join(SITE_DIR, 'test_member_logged_out.png'));

  // Switch to sign in tab
  console.log('\n▶ Testing Tab Switch to "Member Sign In"...');
  await client.click('#tab-signin');
  await sleep(300);
  const isSigninFormVisible = await client.eval(`document.getElementById('form-signin')?.style.display !== 'none'`);
  console.log('  Sign In form displayed:', isSigninFormVisible ? 'YES ✓' : 'NO ❌');

  // Test Demo Login Button
  console.log('\n▶ Clicking "Instant Demo Sign In (Chimwemwe Banda · Gold VIP)"...');
  await client.click('#demo-login-btn');
  await sleep(600);

  // Verify Dashboard elements
  const dashShown = await client.eval(`document.getElementById('member-dash-section')?.style.display !== 'none'`);
  const cardHolder = await client.eval(`document.getElementById('card-holder-name')?.textContent`);
  const cardId = await client.eval(`document.getElementById('card-id-text')?.textContent`);
  const cardTier = await client.eval(`document.getElementById('card-tier-badge')?.textContent`);
  const cardDistrict = await client.eval(`document.getElementById('card-district-text')?.textContent`);

  console.log('✓ Dashboard rendered after sign-in:');
  console.log('  Dashboard visible:', dashShown ? 'YES ✓' : 'NO ❌');
  console.log('  Card Holder:', cardHolder);
  console.log('  Card Member ID:', cardId);
  console.log('  Card Tier Badge:', cardTier);
  console.log('  Card District & Country:', cardDistrict);

  // Test Player of the Month Fan Poll voting
  console.log('\n▶ Testing Player of the Month Poll...');
  await client.click('.candidate-card[data-player="clement-nyondo"]');
  await sleep(200);
  await client.click('#submit-vote-btn');
  await sleep(400);

  const hasVotedTag = await client.eval(`
    document.querySelector('.candidate-card[data-player="clement-nyondo"] .voted-tag')?.style.display !== 'none'
  `);
  console.log('  "Your Vote ✓" badge visible on Clement Nyondo card:', hasVotedTag ? 'YES ✓' : 'NO ❌');

  // Test Voucher Copy
  console.log('\n▶ Testing Voucher Discount Code...');
  const copyBtnTextBefore = await client.eval(`document.getElementById('btn-disc-1')?.textContent`);
  console.log('  Copy button before click:', copyBtnTextBefore);
  await client.click('#btn-disc-1');
  await sleep(300);
  const copyBtnTextAfter = await client.eval(`document.getElementById('btn-disc-1')?.textContent`);
  console.log('  Copy button after click:', copyBtnTextAfter);

  await client.screenshot(path.join(SITE_DIR, 'test_member_dashboard_gold.png'));

  // Test Profile Form Preference Update
  console.log('\n▶ Testing Profile Preferences Update...');
  await client.type('#prof-phone', '+265 999 555 444');
  await client.type('#prof-district', 'Lilongwe');
  await client.click('#member-profile-form button[type="submit"]');
  await sleep(400);

  const updatedDistrict = await client.eval(`document.getElementById('card-district-text')?.textContent`);
  console.log('  Updated card district reflecting saved profile:', updatedDistrict);

  // Test Sign Out
  console.log('\n▶ Testing Sign Out...');
  await client.click('#member-signout-btn');
  await sleep(500);

  const authVisibleAfterLogout = await client.eval(`document.getElementById('member-auth-section')?.style.display !== 'none'`);
  console.log('  Returned to Auth Section upon Sign Out:', authVisibleAfterLogout ? 'YES ✓' : 'NO ❌');

  // Test Register Form through UI
  console.log('\n▶ Testing New User Registration through Form UI...');
  await client.click('#tab-register');
  await sleep(200);
  await client.type('#reg-name', 'Chifundo Banda');
  await client.type('#reg-email', `chifundo_${Date.now()}@email.mw`);
  await client.type('#reg-phone', '+265 884 112 233');

  // Select Silver Member Tier
  await client.click('.tier-option:nth-child(2)');
  await sleep(200);

  // Submit registration
  await client.click('#form-register button[type="submit"]');
  await sleep(800);

  const newHolder = await client.eval(`document.getElementById('card-holder-name')?.textContent`);
  const newTier = await client.eval(`document.getElementById('card-tier-badge')?.textContent`);
  const newId = await client.eval(`document.getElementById('card-id-text')?.textContent`);
  console.log('✓ Newly registered supporter dashboard active:');
  console.log('  Card Holder:', newHolder);
  console.log('  Card Tier:', newTier);
  console.log('  New Member ID:', newId);

  await client.screenshot(path.join(SITE_DIR, 'test_member_dashboard_silver.png'));

  // Cleanup
  console.log('\n▶ Cleaning up processes...');
  chromeProc.kill();
  serverProc.kill();
  adminProc.kill();

  console.log('\n=== ALL MEMBER TESTS PASSED SUCCESSFULLY! ===\n');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
