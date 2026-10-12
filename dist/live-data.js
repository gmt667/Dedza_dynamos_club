/**
 * live-data.js — Dedza Dynamos FC dynamic data loader
 * Fetches from the live backend API and renders real club content.
 * Gracefully preserves pre-rendered data if external network is unavailable.
 */
(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  // Use same-origin (relative) by default — works on any hosted domain.
  // Fallback to the external admin URL only if same-origin request fails.
  // External admin API — used as same-origin fallback when path is not served by this host.
  // On hosted ChatGPT Sites, public data is served from the same origin via /api/public/*.
  const EXTERNAL_API = 'https://dedza-dynamos-staff-admin.mwalwandadesire5.chatgpt.site';

  const teamLogos = {
    'Blue Eagles': 'blue-eagles.png', 'FCB Nyasa Big Bullets': 'fcb-nyasa-big-bullets.png',
    'FCB Big Bullets': 'fcb-nyasa-big-bullets.png', 'Mighty Wanderers': 'mighty-wanderers.png',
    'Silver Strikers': 'silver-strikers.png', 'Masters FC': 'masters-fc.png',
    'Chitipa United': 'chitipa-united.png', 'Moyale Barracks': 'moyale-barracks.png',
    'Civil Service United': 'civil-service-united.png', 'Red Lions': 'red-lions.png',
    'Luanar Mitundu': 'luanar-mitundu.png', 'Ekhaya FC': 'ekhaya-fc.png',
    'Goshen City Dedza Dynamos': 'dedza-dynamos.png', 'Dedza Dynamos': 'dedza-dynamos.png',
    'Karonga United': 'karonga-united.png', 'MAFCO': 'mafco.png', 'MAFCO F.C': 'mafco.png',
    'Kamuzu Barracks': 'kamuzu-barracks.png', 'Creck Sporting': 'creck-sporting.png',
    'Mzuzu City Hammers': 'mzuzu-city-hammers.png', 'Mighty Tigers': 'mighty-tigers.png',
    'FOMO FC': 'fomo-fc.png', 'Bangwe All Stars': 'bangwe-all-stars.png',
  };

  function teamLogo(name) {
    const file = teamLogos[name];
    return file ? `/assets/teams/${file}` : `/assets/brand/dedza-dynamos-crest.png`;
  }

  // ── FETCH HELPERS ────────────────────────────────────────────────────────────
  async function apiFetch(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      // 1. Try relative URL (same-origin — works in dev and on any hosted domain)
      const r = await fetch(path, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (r.ok) return await r.json();
    } catch {
      // Same-origin request threw or timed out
    } finally {
      clearTimeout(timeout);
    }

    // 2. Fall back to the external admin API if same-origin returned non-200 (e.g. 404 on static host) or failed
    try {
      const r2 = await fetch(EXTERNAL_API + path, { headers: { accept: 'application/json' } });
      if (r2.ok) return await r2.json();
    } catch {}

    return null;
  }

  // ── DATE / TIME FORMATTING ───────────────────────────────────────────────────
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtDateShort(iso) {
    if (!iso) return '';
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtDay(iso) {
    return new Date(iso.replace(' ', 'T')).getDate().toString().padStart(2, '0');
  }
  function fmtMonthYear(iso) {
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  function fmtMonthKey(iso) {
    return iso.slice(0, 7); // "YYYY-MM"
  }
  function fmtDayAbbr(iso) {
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' · ' +
      d.toLocaleDateString('en-GB', { month: 'short' });
  }
  function isUpcoming(match) { return match.status === 'upcoming'; }
  function isResult(match) { return match.status === 'full_time'; }

  function compClass(comp) {
    const c = (comp || '').toLowerCase();
    if (c.includes('fdh bank premiership') || c.includes('fdh premiership')) return 'fdh-premiership';
    if (c.includes('castel')) return 'castel-cup';
    if (c.includes('fdh bank cup') || c.includes('fdh cup')) return 'fdh-cup';
    if (c.includes('airtel')) return 'airtel-top8';
    return 'fdh-premiership';
  }

  function isDedza(name) {
    return (name || '').toLowerCase().includes('dedza');
  }

  // ── NEWS / UPDATES PAGE ──────────────────────────────────────────────────────
  async function loadNewsPage() {
    const grid = document.querySelector('.card-grid');
    const feature = document.querySelector('.news-feature');
    if (!grid) return;

    const data = await apiFetch('/api/public/updates');
    if (!data || !data.updates || !data.updates.length) {
      // Keep pre-rendered HTML intact if no API response
      return;
    }

    const [featured, ...rest] = data.updates;

    // Replace feature article dynamically
    if (feature && featured) {
      feature.innerHTML = `
        <div class="news-feature-copy">
          <p class="kicker">Latest · Club News</p>
          <h2>${escHtml(featured.title)}</h2>
          <p>${escHtml(featured.summary)}</p>
          <span class="meta" style="display:block;margin-top:.5rem;font-size:.8rem;opacity:.7">
            ${fmtDate(featured.publishedAt || featured.createdAt)} · ${escHtml(featured.authorName || 'Dedza Dynamos Media')}
          </span>
        </div>`;
    }

    if (rest.length) {
      grid.innerHTML = rest.map(u => `
        <article class="news-card" data-card="club">
          <div class="news-card-image">
            <img src="/assets/dedza-team-history.jpg" alt="Club update" loading="lazy">
            <span class="tag">Club</span>
          </div>
          <div class="news-card-copy">
            <span class="meta">${fmtDate(u.publishedAt || u.createdAt)}</span>
            <h3>${escHtml(u.title)}</h3>
            <p>${escHtml(u.summary.slice(0, 140))}${u.summary.length > 140 ? '…' : ''}</p>
          </div>
        </article>`).join('');
    }

    document.querySelectorAll('.notice').forEach(n => {
      if (n.textContent.includes('editorial feed')) n.remove();
    });
  }

  // ── MATCHES PAGE ─────────────────────────────────────────────────────────────
  async function loadMatchesPage() {
    const container = document.getElementById('fixtures-container');
    if (!container) return;

    const data = await apiFetch('/api/public/live-football');
    if (!data || !data.matches || !data.matches.length) {
      // Keep pre-rendered matches intact
      return;
    }

    const upcoming = data.matches.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
    const results = data.matches.filter(isResult).sort((a, b) => b.date.localeCompare(a.date));

    // Update spotlight with next match
    if (upcoming.length) {
      const next = upcoming[0];
      const spotDate = document.querySelector('.spotlight-date');
      const spotTime = document.querySelector('.spotlight-time');
      const spotVenue = document.querySelector('.spotlight-venue');
      const spotComp = document.querySelector('.competition-title span');
      const spotTeams = document.querySelectorAll('.spotlight-team strong');
      const spotImgs = document.querySelectorAll('.spotlight-team img');
      const spotPills = document.querySelectorAll('.spotlight-team .home-away-pill');
      const spotHeader = document.querySelector('.spotlight-header .badge-tag');

      const d = new Date(next.date.replace(' ', 'T'));
      const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      if (spotDate) spotDate.textContent = dateStr;
      if (spotTime) spotTime.textContent = (next.time || '14:30') + ' CAT Kick-Off';
      if (spotVenue) spotVenue.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${escHtml(next.venue)}`;
      if (spotComp) spotComp.textContent = `${escHtml(next.competition)}${next.round ? ' · ' + next.round : ''}`;
      if (spotHeader) spotHeader.textContent = 'Next Match';

      if (spotTeams.length >= 2) {
        spotTeams[0].textContent = next.home;
        spotTeams[1].textContent = next.away;
      }
      if (spotImgs.length >= 2) {
        spotImgs[0].src = teamLogo(next.home);
        spotImgs[0].alt = next.home;
        spotImgs[1].src = teamLogo(next.away);
        spotImgs[1].alt = next.away;
      }
      if (spotPills.length >= 2) {
        spotPills[0].textContent = isDedza(next.home) ? 'Home · Yellow Boys' : 'Home';
        spotPills[1].textContent = isDedza(next.away) ? 'Away · Yellow Boys' : 'Away · Visitors';
      }
    }

    const allSorted = [...upcoming, ...results];
    const byMonth = {};
    allSorted.forEach(m => {
      const key = fmtMonthKey(m.date);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(m);
    });

    const checkedDate = data.source?.checkedAt ? fmtDate(data.source.checkedAt) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const sourceNote = data.source ? `<div class="live-source-status">
      <span><strong>Official live data</strong> · Checked ${checkedDate}</span>
      <a href="${escHtml(data.source.clubUrl || 'https://sulommw.com')}" target="_blank" rel="noopener">View SULOM source</a>
    </div>` : '';

    container.innerHTML = sourceNote + Object.entries(byMonth).map(([monthKey, matches]) => {
      const label = fmtMonthYear(monthKey + '-01');
      const cards = matches.map(m => fixtureCard(m)).join('');
      return `<div class="month-group" data-month="${monthKey}">
        <div class="month-divider"><h2>${escHtml(label)}</h2><div class="line"></div></div>
        ${cards}
      </div>`;
    }).join('');

    setupFixtureFilters();
  }

  function fixtureCard(m) {
    const isHome = isDedza(m.home);
    const comp = compClass(m.competition);
    const venue = isHome ? 'home' : 'away';
    const isFullTime = m.status === 'full_time';
    const isPostponed = m.status === 'postponed';

    const statusBadge = isFullTime
      ? `<span class="venue-type-tag" style="background:#1e293b;color:#94a3b8">Full Time</span>`
      : isPostponed
      ? `<span class="venue-type-tag" style="background:#7c3aed;color:#fff">Postponed</span>`
      : `<span class="venue-type-tag ${venue}">${venue.charAt(0).toUpperCase() + venue.slice(1)}</span>`;

    const scoreOrVs = isFullTime
      ? `<div class="match-vs-tag" style="font-size:1.5rem;color:#facc15;font-weight:900">${escHtml(m.score || 'FT')}</div>`
      : `<div class="match-vs-tag">VS</div>`;

    return `<article class="fixture-row-card" data-comp="${comp}" data-venue="${venue}">
      <div class="fixture-card-topbar">
        <span class="competition-pill ${comp}">${escHtml(m.competition)}</span>
        <span class="match-round-tag">${m.round ? escHtml(m.round) : ''}</span>
        ${statusBadge}
      </div>
      <div class="fixture-card-main">
        <div class="match-date-col">
          <div class="day-num">${fmtDay(m.date)}</div>
          <div class="day-name">${fmtDayAbbr(m.date)}</div>
          <div class="match-time">${isFullTime ? 'Full Time' : (m.time || '14:30') + ' CAT'}</div>
        </div>
        <div class="match-teams-col">
          <div class="team-box home-team${isDedza(m.home) ? ' is-dedza' : ''}">
            <strong>${escHtml(m.home)}</strong>
            <img src="${teamLogo(m.home)}" alt="${escHtml(m.home)}" loading="lazy">
          </div>
          ${scoreOrVs}
          <div class="team-box away-team${isDedza(m.away) ? ' is-dedza' : ''}">
            <img src="${teamLogo(m.away)}" alt="${escHtml(m.away)}" loading="lazy">
            <strong>${escHtml(m.away)}</strong>
          </div>
        </div>
        <div class="match-actions-col">
          <div class="match-venue-info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <strong>${escHtml(m.venue)}</strong>
          </div>
          ${!isFullTime && !isPostponed ? `<div class="match-action-btns">
            <a class="btn-ticket-sm" href="/tickets/">Tickets</a>
            <a class="btn-watch-sm" href="/video/">Watch Live</a>
          </div>` : ''}
        </div>
      </div>
    </article>`;
  }

  function setupFixtureFilters() {
    const filterBtns = document.querySelectorAll('[data-filter-type]');
    const venueBtns = document.querySelectorAll('[data-venue-type]');
    let activeComp = 'all', activeVenue = 'all';

    function applyFilters() {
      document.querySelectorAll('.fixture-row-card').forEach(card => {
        const comp = card.dataset.comp;
        const venue = card.dataset.venue;
        const compOk = activeComp === 'all' || comp === activeComp;
        const venueOk = activeVenue === 'all' || venue === activeVenue;
        card.style.display = compOk && venueOk ? '' : 'none';
      });
      document.querySelectorAll('.month-group').forEach(g => {
        const visible = [...g.querySelectorAll('.fixture-row-card')].some(c => c.style.display !== 'none');
        g.style.display = visible ? '' : 'none';
      });
    }

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeComp = btn.dataset.filterType;
      applyFilters();
    }));
    venueBtns.forEach(btn => btn.addEventListener('click', () => {
      venueBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeVenue = btn.dataset.venueType;
      applyFilters();
    }));
  }

  // ── TEAM / PLAYERS PAGE ──────────────────────────────────────────────────────
  async function loadTeamPage() {
    const grid = document.querySelector('.player-grid');
    if (!grid) return;

    const data = await apiFetch('/api/public/players');
    if (!data || !data.players || !data.players.length) {
      // Keep pre-rendered player cards intact
      return;
    }

    const positions = ['goalkeeper', 'defender', 'midfielder', 'forward'];
    const grouped = {};
    positions.forEach(p => { grouped[p] = []; });
    data.players.forEach(p => {
      const pos = (p.position || '').toLowerCase();
      if (grouped[pos]) grouped[pos].push(p);
      else if (grouped.midfielder) grouped.midfielder.push(p);
    });

    const heroDesc = document.querySelector('.page-hero-content p');
    if (heroDesc) heroDesc.textContent = `${data.players.length} active squad members. Full first-team directory — official registered players.`;

    const heroSub = document.querySelector('.page-hero-content .kicker, .page-hero-content .eyebrow');
    if (heroSub) heroSub.textContent = 'Official 2026/27 First Team Squad';

    const h1 = document.querySelector('.page-hero-content h1');
    if (h1) h1.textContent = 'First Team Squad';

    grid.innerHTML = positions.map(pos => {
      const players = grouped[pos];
      if (!players || !players.length) return '';
      return `
        <div class="position-group" style="grid-column:1/-1">
          <h3 class="position-label" style="font-size:0.75rem;letter-spacing:.12em;text-transform:uppercase;opacity:.6;margin:1.5rem 0 .75rem;font-weight:800;color:var(--yellow)">${pos.charAt(0).toUpperCase() + pos.slice(1)}s</h3>
        </div>
        ${players.map(p => playerCard(p)).join('')}`;
    }).join('');

    document.querySelectorAll('.notice').forEach(n => {
      if (n.textContent.includes('historical') || n.textContent.includes('registration')) n.remove();
    });
  }

  function playerCard(p) {
    const hasPhoto = p.photoUrl && !p.photoUrl.includes('placeholder');
    return `<article class="player${p.shirtNumber ? '' : ' yellow'}">
      ${hasPhoto ? `<img src="${escHtml(p.photoUrl)}" alt="${escHtml(p.firstName || p.name)}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:.5rem .5rem 0 0">` : ''}
      <span class="player-no">${escHtml(p.shirtNumber || p.number || '—')}</span>
      <div class="player-info">
        <small>${escHtml(p.squadRole || p.position)}</small>
        <h2>${escHtml(p.firstName || p.name || '')}<br>${escHtml(p.lastName || '')}</h2>
        ${p.bio || p.notes ? `<p>${escHtml(p.bio || p.notes)}</p>` : ''}
        ${p.nationality ? `<span style="font-size:.75rem;opacity:.6">${escHtml(p.nationality)}</span>` : ''}
      </div>
    </article>`;
  }

  // ── HOMEPAGE ─────────────────────────────────────────────────────────────────
  async function loadHomePage() {
    // Homepage layout: .card-grid inside section.shell (#main), .next-match and .latest-result inside .score-strip
    const [newsData, matchData] = await Promise.all([
      apiFetch('/api/public/updates'),
      apiFetch('/api/public/live-football'),
    ]);

    // ── News cards grid ────────────────────────────────────────────────────
    if (newsData?.updates?.length) {
      const cardGrid = document.querySelector('#main .card-grid');
      if (cardGrid) {
        const top3 = newsData.updates.filter(u => u.status === 'published' || u.audience === 'public').slice(0, 3);
        if (top3.length) {
          const images = ['dedza-cup-run', 'dedza-team-history', 'dedza-action'];
          const tags = ['History', 'Club', 'Match report'];
          cardGrid.innerHTML = top3.map((u, idx) => `
            <article class="news-card">
              <div class="news-card-image">
                <img src="/assets/${images[idx % 3]}.jpg" alt="Club update" loading="lazy">
                <span class="tag">${escHtml(tags[idx % 3])}</span>
              </div>
              <div class="news-card-copy">
                <span class="meta">${fmtDate(u.publishedAt || u.createdAt)}</span>
                <h3>${escHtml(u.title)}</h3>
                <p>${escHtml((u.summary || '').slice(0, 120))}${(u.summary || '').length > 120 ? '…' : ''}</p>
                <a class="arrow-link" href="/news/">Read more →</a>
              </div>
            </article>`).join('');
        }
      }
    }

    // ── Match strip ────────────────────────────────────────────────────────
    if (matchData?.matches?.length) {
      const upcoming = matchData.matches.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
      const results = matchData.matches.filter(isResult).sort((a, b) => b.date.localeCompare(a.date));
      const next = upcoming[0];
      const latest = results[0];
      const nextCard = document.querySelector('.next-match');
      if (next && nextCard) {
        const labels = nextCard.querySelectorAll('.match-label > span');
        if (labels[0]) labels[0].textContent = `Next fixture · ${next.competition}`;
        if (labels[1]) labels[1].textContent = `${fmtDateShort(next.date)} · ${next.time || '14:30'} CAT`;
        const teams = nextCard.querySelectorAll('.match-teams > div');
        [next.home, next.away].forEach((name, index) => {
          const team = teams[index];
          if (!team) return;
          const image = team.querySelector('img');
          const label = team.querySelector('strong');
          if (image) { image.src = teamLogo(name); image.alt = name; }
          if (label) label.textContent = name;
        });
      }
      const resultCard = document.querySelector('.latest-result');
      if (latest && resultCard) {
        const meta = resultCard.querySelector('.meta');
        const score = resultCard.querySelector('.score');
        const detail = resultCard.querySelector('small');
        if (meta) meta.textContent = `Latest official result · ${latest.competition}`;
        if (score) score.textContent = `${latest.home} ${latest.score} ${latest.away}`;
        if (detail) detail.textContent = `${fmtDate(latest.date)} · ${latest.venue} · Full Time`;
      }
    }
  }

  // ── COMPETITIONS PAGE ────────────────────────────────────────────────────────

  async function loadCompetitionsPage() {
    const tableBody = document.querySelector('#premiership .standings tbody');
    if (!tableBody) return;
    const data = await apiFetch('/api/public/live-football');
    if (!data?.table?.length) return;

    tableBody.innerHTML = data.table.map(row => {
      const dedza = isDedza(row.club);
      return `<tr${dedza ? ' class="dedza-row"' : ''}>
        <td><span class="pos-pill">${row.position}</span></td>
        <td><span class="club-cell"><img src="${teamLogo(row.club)}" alt="${escHtml(row.club)} crest" loading="lazy">${escHtml(row.club)}</span></td>
        <td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td>
        <td>${row.goalsFor}</td><td>${row.goalsAgainst}</td><td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td><td><b>${row.points}</b></td>
      </tr>`;
    }).join('');

    if (data.dedza) {
      const number = document.querySelector('.position-number strong');
      const stats = document.querySelectorAll('.position-stats strong');
      const copy = document.querySelector('.position-copy > p:not(.eyebrow)');
      if (number) number.textContent = data.dedza.position;
      if (stats[0]) stats[0].textContent = data.dedza.played;
      if (stats[1]) stats[1].textContent = data.dedza.points;
      if (stats[2]) stats[2].textContent = data.dedza.goalsFor;
      if (stats[3]) stats[3].textContent = data.dedza.goalDifference > 0 ? `+${data.dedza.goalDifference}` : data.dedza.goalDifference;
      if (copy) copy.textContent = `Dedza are ${data.dedza.position}${ordinalSuffix(data.dedza.position)} in Malawi's top flight on the latest official SULOM table.`;
    }

    const status = document.querySelector('#premiership .competition-status');
    if (status && data.dedza) status.textContent = `2026/27 · after ${data.dedza.played} matches`;
    const sourceNote = document.querySelector('#premiership .source-note');
    if (sourceNote && data.source) sourceNote.innerHTML = `Live official standings checked ${fmtDate(data.source.checkedAt)}. Source: <a href="${escHtml(data.source.tableUrl || 'https://sulommw.com')}" target="_blank" rel="noopener">Super League of Malawi</a>.`;
  }

  function ordinalSuffix(value) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return 'th';
    return value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th';
  }

  // ── PARTNERS PAGE ────────────────────────────────────────────────────────────
  async function loadPartnersPage() {
    const grid = document.querySelector('.partners-grid, .partner-grid, .sponsors-grid, [data-live="partners"]');
    if (!grid) return;

    const data = await apiFetch('/api/public/partners');
    if (!data?.partners?.length) return;

    const tiers = { platinum: [], gold: [], silver: [], commercial: [] };
    data.partners.forEach(p => {
      const t = (p.tier || 'gold').toLowerCase();
      if (tiers[t]) tiers[t].push(p);
      else tiers.gold.push(p);
    });

    const tierLabels = { platinum: 'Principal Sponsors', gold: 'Gold Partners', silver: 'Silver Partners', commercial: 'Commercial Partners' };

    grid.innerHTML = Object.entries(tiers).map(([tier, list]) => {
      if (!list.length) return '';
      return `<div class="partner-tier ${tier}">
        <h3 class="tier-label">${tierLabels[tier]}</h3>
        <div class="tier-grid">
          ${list.map(p => `
            <a class="partner-card" href="${p.url ? escHtml(p.url) : '#'}" target="_blank" rel="noopener">
              ${p.logoUrl ? `<img src="${escHtml(p.logoUrl)}" alt="${escHtml(p.name)}" loading="lazy">` : ''}
              <span>${escHtml(p.name)}</span>
              <small>${escHtml(p.category)}</small>
            </a>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  // ── XSS ESCAPE ──────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ── ROUTER ───────────────────────────────────────────────────────────────────
  const path = location.pathname;

  if (path === '/' || path === '/index.html') {
    loadHomePage();
  } else if (path.startsWith('/news')) {
    loadNewsPage();
  } else if (path.startsWith('/matches') || path.startsWith('/fixtures')) {
    loadMatchesPage();
  } else if (path.startsWith('/team')) {
    loadTeamPage();
  } else if (path.startsWith('/partners')) {
    loadPartnersPage();
  } else if (path.startsWith('/competitions')) {
    loadCompetitionsPage();
  }

  // ── GLOBAL LIVE TICKER IN UTILITY BAR ──────────────────────────────────────
  const utility = document.querySelector('.utility span');
  if (utility && path !== '/news/') {
    apiFetch('/api/public/updates').then(data => {
      if (!data?.updates?.length) return;
      const latest = data.updates[0];
      const ticker = document.createElement('span');
      ticker.className = 'live-headline';
      ticker.innerHTML = `<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#22c55e"/></svg> ${escHtml(latest.title)}`;
      ticker.style.cssText = 'margin-left:1rem;font-size:.75rem;opacity:.8;font-weight:500;display:inline-flex;align-items:center;gap:.35rem';
      utility.after(ticker);
    });
  }
})();
