if(!document.querySelector('link[href="/nav.css"]')){const navStyles=document.createElement('link');navStyles.rel='stylesheet';navStyles.href='/nav.css';document.head.append(navStyles)}
const menu=document.querySelector('.menu-button');const mobile=document.querySelector('.mobile-nav');
const primaryLinks=[['News','/news/'],['Video','/media/'],['Fixtures','/matches/'],['Tickets','/tickets/'],['Shop','/shop/'],['Players','/team/'],['Club','/club/']];
const moreLinks=[['Tables & cups','/competitions/'],['Supporters','/supporters/'],['Partners','/partners/'],['Contact','/contact/']];
document.querySelectorAll('.main-nav').forEach(nav=>{const current=location.pathname;nav.innerHTML=primaryLinks.map(([label,href])=>`<a href="${href}"${current===href?' aria-current="page"':''}>${label}</a>`).join('')+`<div class="more-menu"><button class="more-button" aria-expanded="false" aria-haspopup="true">More <span aria-hidden="true">⌄</span></button><div class="more-panel">${moreLinks.map(([label,href])=>`<a href="${href}"${current===href?' aria-current="page"':''}>${label}</a>`).join('')}</div></div>`;});
document.querySelectorAll('.mobile-nav').forEach(nav=>{const current=location.pathname;nav.innerHTML=[...primaryLinks,...moreLinks].map(([label,href])=>`<a href="${href}"${current===href?' aria-current="page"':''}>${label}</a>`).join('')+`<a href="/admin/">Sign in</a>`});
document.querySelectorAll('.more-button').forEach(button=>button.addEventListener('click',()=>{const open=button.parentElement.classList.toggle('open');button.setAttribute('aria-expanded',open)}));
document.querySelectorAll('.head-actions').forEach(actions=>{const existingSearch=actions.querySelector('[data-search]');const existingMenu=actions.querySelector('.menu-button');actions.innerHTML='';const signIn=document.createElement('a');signIn.className='account-link';signIn.href='/admin/';signIn.innerHTML='<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#user"></use></svg><span>Sign in</span>';const basket=document.createElement('a');basket.className='basket-link';basket.href='/shop/';basket.setAttribute('aria-label','Basket, 0 items');basket.innerHTML='<span class="basket-icon" aria-hidden="true">Bag</span><strong>0</strong>';actions.append(existingSearch,signIn,basket,existingMenu)});
const officialTeamLogos={
  'Blue Eagles':'blue-eagles.png','FCB Nyasa Big Bullets':'fcb-nyasa-big-bullets.png','FCB Big Bullets':'fcb-nyasa-big-bullets.png','Mighty Wanderers':'mighty-wanderers.png','Silver Strikers':'silver-strikers.png','Masters FC':'masters-fc.png','Chitipa United':'chitipa-united.png','Moyale Barracks':'moyale-barracks.png','Civil Service United':'civil-service-united.png','Red Lions':'red-lions.png','Luanar Mitundu':'luanar-mitundu.png','Ekhaya FC':'ekhaya-fc.png','Goshen City Dedza Dynamos':'dedza-dynamos.png','Dedza Dynamos':'dedza-dynamos.png','Karonga United':'karonga-united.png','MAFCO':'mafco.png','MAFCO F.C':'mafco.png','Kamuzu Barracks':'kamuzu-barracks.png','Creck Sporting':'creck-sporting.png','Mzuzu City Hammers':'mzuzu-city-hammers.png','Mzuzu City Hammers FC':'mzuzu-city-hammers.png','Mighty Tigers':'mighty-tigers.png','FOMO':'fomo-fc.png','FOMO FC':'fomo-fc.png','Bangwe All Stars':'bangwe-all-stars.png'
};
document.querySelectorAll('.standings tbody tr').forEach(row=>{const cell=row.cells?.[1];if(!cell||cell.querySelector('img'))return;const name=cell.textContent.trim();const logo=officialTeamLogos[name];if(!logo)return;cell.textContent='';const wrap=document.createElement('span');wrap.className='club-cell';const img=document.createElement('img');img.src=`/assets/teams/${logo}`;img.alt=`${name} crest`;img.loading='lazy';wrap.append(img,document.createTextNode(name));cell.append(wrap)});
document.querySelectorAll('.fixture-teams>span').forEach(team=>{if(team.querySelector('img'))return;const name=team.textContent.trim();const logo=officialTeamLogos[name];if(!logo)return;team.classList.add('team-with-crest');const img=document.createElement('img');img.src=`/assets/teams/${logo}`;img.alt=`${name} crest`;img.loading='lazy';team.prepend(img)});
if(menu)menu.addEventListener('click',()=>{const open=mobile.classList.toggle('open');document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',open)});
const searchIndex = [
  { cat: 'Page', title: 'Home', subtitle: 'Dedza Dynamos official homepage', url: '/', keywords: 'home landing main official yellow boys' },
  { cat: 'Page', title: 'Fixtures & Match Centre', subtitle: 'All 2026/27 upcoming games, cup ties & results', url: '/fixtures/', keywords: 'fixtures matches games schedule results cup league season calender next game' },
  { cat: 'Page', title: 'Video & TV Channels', subtitle: 'MBC TV, Mibawa, Times, Luntha, Zodiac live streaming', url: '/video/', keywords: 'video streaming watch live tv mbc mibawa luntha times zodiac media broadcast stream' },
  { cat: 'Page', title: 'Official Club Shop', subtitle: 'Jerseys, hoodies, tracksuit pants & club outfits', url: '/shop/', keywords: 'shop store jersey kit hoodie track pants outfit merchandise clothes buy gear' },
  { cat: 'Page', title: 'Match Tickets & Booking', subtitle: 'Digital booking via uthenga.co, Kwenda & Machenji', url: '/tickets/', keywords: 'tickets booking buy gate price uthenga kwenda machenji passes entry seats' },
  { cat: 'Page', title: 'Players & First Team Squad', subtitle: 'Full player profiles, positions, numbers & coaches', url: '/team/', keywords: 'players team squad roster line up goalkeeper defender midfielder forward' },
  { cat: 'Page', title: 'League Tables & Cups', subtitle: 'FDH Bank Premiership standings & cup brackets', url: '/competitions/', keywords: 'table standings position points goals league sulom fam fdh premiership ranking' },
  { cat: 'Page', title: 'Club History & Stadium', subtitle: 'Founded 2017, Dedza Stadium, board & leadership', url: '/club/', keywords: 'club history stadium dedza ground board executive management story' },
  { cat: 'Page', title: 'News & Announcements', subtitle: 'Official club updates & FAM/SULOM reports', url: '/news/', keywords: 'news stories press announcements reports updates articles' },
  { cat: 'Page', title: 'Supporters & Fans', subtitle: 'Fan clubs, WhatsApp group & matchday community', url: '/supporters/', keywords: 'supporters fans whatsapp community followers chants' },
  { cat: 'Page', title: 'Commercial Partners & Sponsors', subtitle: 'Goshen City & club sponsors', url: '/partners/', keywords: 'partners sponsors goshen commercial branding advertising' },
  { cat: 'Page', title: 'Contact Us', subtitle: 'Stadium address, official mailbox & phone', url: '/contact/', keywords: 'contact email phone address location office mailbox' },
  { cat: 'Page', title: 'Admin & Staff Portal', subtitle: 'Secure publishing, team management & settings', url: '/admin/', keywords: 'admin login sign in staff portal management dashboard members' },

  { cat: 'Fixtures', title: 'Dedza Dynamos vs Masters FC', subtitle: 'Next Match · Sun 11 Oct · 14:30 CAT · Dedza Stadium · FDH Premiership', url: '/fixtures/', keywords: 'next match masters fc october home league fdh bank premiership' },
  { cat: 'Fixtures', title: 'Civil Service United vs Dedza Dynamos', subtitle: 'Sat 17 Oct · Civo Stadium, Lilongwe · FDH Premiership', url: '/fixtures/', keywords: 'civil service united civo lilongwe away league' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs Creck Sporting (Castel Cup)', subtitle: 'Wed 21 Oct · Round of 16 Knockout · Dedza Stadium', url: '/fixtures/', keywords: 'creck sporting castel challenge cup knockout round 16' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs Moyale Barracks', subtitle: 'Sun 25 Oct · Dedza Stadium · FDH Premiership', url: '/fixtures/', keywords: 'moyale barracks mzuzu soldier home league' },
  { cat: 'Fixtures', title: 'Ekhaya FC vs Dedza Dynamos (FDH Cup)', subtitle: 'Sat 31 Oct · Round of 32 · Mpira Stadium, Blantyre', url: '/fixtures/', keywords: 'ekhaya fc fdh bank cup knockout blatnyre mpira' },
  { cat: 'Fixtures', title: 'Silver Strikers vs Dedza Dynamos', subtitle: 'Sun 8 Nov · Silver Stadium, Lilongwe · FDH Premiership', url: '/fixtures/', keywords: 'silver strikers bankers lilongwe away' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs Mighty Wanderers (Castel Cup)', subtitle: 'Sat 14 Nov · Quarter-Final · Dedza Stadium', url: '/fixtures/', keywords: 'mighty wanderers nomads lali lubani cup quarter final' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs FCB Nyasa Big Bullets', subtitle: 'Sun 22 Nov · Blockbuster Clash · Dedza Stadium', url: '/fixtures/', keywords: 'fcb nyasa big bullets maule red army home giant' },
  { cat: 'Fixtures', title: 'Blue Eagles vs Dedza Dynamos', subtitle: 'Sat 28 Nov · Nankhaka Stadium · FDH Premiership', url: '/fixtures/', keywords: 'blue eagles police nankhaka away' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs Kamuzu Barracks (Airtel Top 8)', subtitle: 'Sun 6 Dec · Quarter-Final 1st Leg · Dedza Stadium', url: '/fixtures/', keywords: 'airtel top 8 kamuzu barracks soldiers cup knockout' },
  { cat: 'Fixtures', title: 'Dedza Dynamos vs MAFCO', subtitle: 'Sat 12 Dec · Dedza Stadium · FDH Premiership', url: '/fixtures/', keywords: 'mafco armed forces salima home' },
  { cat: 'Fixtures', title: 'Chitipa United vs Dedza Dynamos', subtitle: 'Sun 20 Dec · Karonga Stadium · FDH Premiership', url: '/fixtures/', keywords: 'chitipa united karonga northern tour away' },
  { cat: 'Fixtures', title: 'Castel Challenge Cup Final 2026 (Runners-Up)', subtitle: 'Big Bullets 2–1 Dedza · Historic First National Final', url: '/fixtures/#results', keywords: 'castel final bullets mbeta bingu runners up historic final' },

  { cat: 'Shop', title: 'Official Home Jersey 2026/27', subtitle: 'Iconic yellow kit with black trim · MK 25,000 · In Stock', url: '/shop/', keywords: 'home jersey shirt yellow boys kit buy uniform top' },
  { cat: 'Shop', title: 'Official Away Kit 2026/27', subtitle: 'Navy & gold away strip · MK 25,000', url: '/shop/', keywords: 'away kit jersey navy blue gold shirt' },
  { cat: 'Shop', title: 'Official Goalkeeper Jersey', subtitle: 'Cyan emerald goalkeeper edition · MK 27,000', url: '/shop/', keywords: 'goalkeeper jersey goalie keeper green cyan' },
  { cat: 'Shop', title: 'Club Pullover Hoodie', subtitle: 'Heavyweight fleece hoodie in deep navy · MK 32,000', url: '/shop/', keywords: 'hoodie top pullover fleece navy warm clothing sweatshirt' },
  { cat: 'Shop', title: 'Performance Track Pants', subtitle: 'Tapered athletic pants with club crest · MK 22,000', url: '/shop/', keywords: 'track pants trousers joggers slim fit bottoms' },
  { cat: 'Shop', title: 'Full Tracksuit Outfit', subtitle: 'Matching jacket & training trousers · MK 48,000', url: '/shop/', keywords: 'full outfit tracksuit tracksuit jacket set full suit clothes' },

  { cat: 'Streaming', title: 'MBC Television (MBC 1)', subtitle: 'Malawi national broadcaster · Live Super League & Cup matches', url: '/video/', keywords: 'mbc television mbc1 channel live tv sports stream broadcast' },
  { cat: 'Streaming', title: 'Mibawa TV & Streaming', subtitle: 'Official digital live stream partner for Malawian football', url: '/video/', keywords: 'mibawa streaming online app watch broadcast live mobile' },
  { cat: 'Streaming', title: 'Times Television (Times 360)', subtitle: 'Private nationwide sports & live football broadcasts', url: '/video/', keywords: 'times television times tv live coverage blt news' },
  { cat: 'Streaming', title: 'Luntha TV', subtitle: 'Balaka-based nationwide Catholic television sports coverage', url: '/video/', keywords: 'luntha tv catholic broadcast balaka television' },
  { cat: 'Streaming', title: 'Zodiac Broadcasting (ZBS)', subtitle: 'Award-winning private radio & television network', url: '/video/', keywords: 'zodiac zbs radio station broadcaster live commentary' },
  { cat: 'Streaming', title: 'MBC 2 Sports & Youth', subtitle: 'Dedicated 24/7 sports & grassroots athletics channel', url: '/video/', keywords: 'mbc2 mbc 2 sports live coverage youth' },

  { cat: 'Tickets', title: 'uthenga.co Digital Tickets', subtitle: 'Official verified online ticketing platform for Dedza matches', url: '/tickets/', keywords: 'uthenga uthenga.co digital online mobile money airtel tnm tickets booking' },
  { cat: 'Tickets', title: 'Kwenda Ticketing App', subtitle: 'Mobile ticket booking & advance seat reservations', url: '/tickets/', keywords: 'kwenda app booking mobile wallet tickets seats' },
  { cat: 'Tickets', title: 'Machenji Gate Ticketing', subtitle: 'Matchday turnstile & physical cash/MoMo gate entry', url: '/tickets/', keywords: 'machenji gate entrance turnstile stadium physical tickets' },

  { cat: 'Player', title: 'Chikondi Mbeta (Forward)', subtitle: 'Star attacker · Scored in the 2026 Castel Cup final', url: '/team/', keywords: 'chikondi mbeta striker forward goalscorer star player attacker' },
  { cat: 'Player', title: 'Clement Nyondo (Legend)', subtitle: '2023 Super League Golden Boot Winner (16 goals)', url: '/club/', keywords: 'clement nyondo top scorer golden boot legend striker' },
  { cat: 'Player', title: 'First Team Goalkeepers', subtitle: 'Senior goalkeeping department', url: '/team/', keywords: 'goalkeepers goalie keeper defense number 1' },
  { cat: 'Player', title: 'First Team Defenders', subtitle: 'Centre-backs & fullbacks', url: '/team/', keywords: 'defenders fullback centre back backline' },
  { cat: 'Player', title: 'Midfield Engine', subtitle: 'Central & attacking midfielders', url: '/team/', keywords: 'midfielders midfield playmaker winger' },
  { cat: 'Player', title: 'Attacking Forwards', subtitle: 'Goalscorers & front line', url: '/team/', keywords: 'forwards strikers attackers front' },

  { cat: 'Venue', title: 'Dedza Stadium', subtitle: 'Home fortress of the Yellow Boys · Dedza Boma', url: '/club/', keywords: 'dedza stadium venue pitch fortress capacity home ground pitch boma' },
  { cat: 'Competition', title: 'FDH Bank Premiership Standings', subtitle: 'Current position: 12th · 15 points after 15 games', url: '/competitions/', keywords: 'fdh bank premiership table standings super league rank 12th points' },
  { cat: 'Competition', title: 'Castel Challenge Cup Brackets', subtitle: 'Dedza are 2025/26 runners-up and into Round of 16', url: '/competitions/#castel', keywords: 'castel challenge cup knockout bracket draw runners up' },
  { cat: 'Community', title: 'Fan Club & WhatsApp', subtitle: 'Join verified supporter chats and traveling fans', url: '/supporters/', keywords: 'supporters club whatsapp group chat fans community' }
];

const searchOverlay = document.querySelector('.site-search');
if (searchOverlay) {
  searchOverlay.innerHTML = `
    <div class="search-modal" role="dialog" aria-modal="true" aria-label="Search Dedza Dynamos">
      <div class="search-header-bar">
        <span class="search-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Search Dedza Dynamos
        </span>
        <div class="search-shortcuts-hint">
          <span>Navigate:</span>
          <span class="kbd-pill">↑</span><span class="kbd-pill">↓</span>
          <span>Select:</span><span class="kbd-pill">↵</span>
          <span>Close:</span><span class="kbd-pill">ESC</span>
        </div>
        <button class="search-close-btn" aria-label="Close search (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="search-input-box">
        <svg class="input-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input id="site-search" type="search" placeholder="Search fixtures, tickets, jerseys, live TV, players..." autocomplete="off" spellcheck="false">
        <button class="search-clear-btn" id="search-clear-btn" aria-label="Clear query">×</button>
      </div>

      <div class="search-quick-tags" id="search-quick-tags">
        <span class="quick-label">Popular:</span>
        <button class="quick-pill" data-query="Next Match"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>Next Match</button>
        <button class="quick-pill" data-query="Tickets"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V6H3z"/></svg>Tickets</button>
        <button class="quick-pill" data-query="Jersey"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8 3 4 3 4-3 5 4-3 5-2-1v10H8V11l-2 1-3-5z"/></svg>Home Jersey</button>
        <button class="quick-pill" data-query="MBC TV"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="m9 3 3 3 3-3M9 11l6 2-6 2z"/></svg>Watch Live TV</button>
        <button class="quick-pill" data-query="Castel Cup"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12v4a6 6 0 0 1-12 0zM8 13h8M12 11v6M8 21h8"/><path d="M6 5H3v1a4 4 0 0 0 4 4M18 5h3v1a4 4 0 0 1-4 4"/></svg>Castel Cup</button>
        <button class="quick-pill" data-query="Standings"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/></svg>Standings</button>
        <button class="quick-pill" data-query="Players"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M15 15a5 5 0 0 1 5 5"/></svg>Squad</button>
      </div>

      <div class="search-results-list" id="search-results-list" role="listbox"></div>

      <div class="search-meta-footer" id="search-meta-footer">
        <span id="search-count-label">Explore Dedza Dynamos</span>
        <span>AstraMind Labs Search Engine</span>
      </div>
    </div>
  `;

  const searchInput = searchOverlay.querySelector('#site-search');
  const resultsContainer = searchOverlay.querySelector('#search-results-list');
  const clearBtn = searchOverlay.querySelector('#search-clear-btn');
  const closeBtn = searchOverlay.querySelector('.search-close-btn');
  const countLabel = searchOverlay.querySelector('#search-count-label');
  const quickTags = searchOverlay.querySelectorAll('.quick-pill');

  let selectedIdx = -1;

  function openSearch() {
    searchOverlay.classList.add('open');
    document.body.classList.add('search-open');
    setTimeout(() => {
      searchInput.focus();
      renderResults(searchInput.value);
    }, 40);
  }

  function closeSearch() {
    searchOverlay.classList.remove('open');
    document.body.classList.remove('search-open');
    selectedIdx = -1;
  }

  document.querySelectorAll('[data-search]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openSearch();
    });
  });

  closeBtn?.addEventListener('click', closeSearch);

  searchOverlay.addEventListener('click', e => {
    if (e.target === searchOverlay) closeSearch();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {
      closeSearch();
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
    }
  });

  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    searchInput.focus();
    renderResults('');
  });

  quickTags.forEach(pill => {
    pill.addEventListener('click', () => {
      const q = pill.getAttribute('data-query');
      searchInput.value = q;
      clearBtn.classList.add('visible');
      searchInput.focus();
      renderResults(q);
    });
  });

  function highlightMatch(text, query) {
    if (!query) return text;
    const parts = query.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return text;
    const regex = new RegExp(`(${parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function renderResults(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    selectedIdx = -1;

    if (q) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }

    if (!q) {
      const featured = searchIndex.slice(0, 8);
      countLabel.textContent = 'Explore official club destinations';
      resultsContainer.innerHTML = featured.map((item, idx) => `
        <a class="search-result-row" href="${item.url}" data-idx="${idx}" role="option">
          <div class="result-main">
            <div class="result-title-bar">
              <span class="result-cat-tag cat-${item.cat.toLowerCase()}">${item.cat}</span>
              <span class="result-title">${item.title}</span>
            </div>
            <span class="result-sub">${item.subtitle}</span>
          </div>
          <span class="result-arrow">→</span>
        </a>
      `).join('');
      return;
    }

    const tokens = q.split(/\s+/).filter(Boolean);

    const matches = searchIndex.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const subLower = item.subtitle.toLowerCase();
      const catLower = item.cat.toLowerCase();
      const kwLower = (item.keywords || '').toLowerCase();

      if (titleLower === q) score += 120;
      else if (titleLower.startsWith(q)) score += 80;
      else if (titleLower.includes(q)) score += 50;

      let tokenHits = 0;
      tokens.forEach(tok => {
        if (titleLower.includes(tok)) { score += 30; tokenHits++; }
        else if (subLower.includes(tok)) { score += 18; tokenHits++; }
        else if (catLower.includes(tok)) { score += 25; tokenHits++; }
        else if (kwLower.includes(tok)) { score += 20; tokenHits++; }
      });

      if (tokenHits === tokens.length) score += 35;
      return { item, score };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score).map(m => m.item);

    if (!matches.length) {
      countLabel.textContent = `0 results for "${rawQuery}"`;
      resultsContainer.innerHTML = `
        <div class="search-empty-msg">
          <h4>No results found for "${rawQuery}"</h4>
          <p>Check the spelling or try searching for <strong>fixtures</strong>, <strong>tickets</strong>, <strong>jersey</strong>, <strong>MBC</strong>, or <strong>players</strong>.</p>
        </div>
      `;
      return;
    }

    countLabel.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} found for "${rawQuery}"`;
    resultsContainer.innerHTML = matches.map((item, idx) => `
      <a class="search-result-row" href="${item.url}" data-idx="${idx}" role="option">
        <div class="result-main">
          <div class="result-title-bar">
            <span class="result-cat-tag cat-${item.cat.toLowerCase()}">${item.cat}</span>
            <span class="result-title">${highlightMatch(item.title, rawQuery)}</span>
          </div>
          <span class="result-sub">${highlightMatch(item.subtitle, rawQuery)}</span>
        </div>
        <span class="result-arrow">→</span>
      </a>
    `).join('');
  }

  searchInput.addEventListener('input', e => renderResults(e.target.value));

  searchInput.addEventListener('keydown', e => {
    const rows = resultsContainer.querySelectorAll('.search-result-row');
    if (!rows.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % rows.length;
      updateSelection(rows);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + rows.length) % rows.length;
      updateSelection(rows);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && rows[selectedIdx]) {
        rows[selectedIdx].click();
      } else if (rows[0]) {
        rows[0].click();
      }
    }
  });

  function updateSelection(rows) {
    rows.forEach((r, idx) => {
      const isSel = (idx === selectedIdx);
      r.classList.toggle('selected', isSel);
      if (isSel) r.scrollIntoView({ block: 'nearest' });
    });
  }
}
const toast=document.querySelector('.toast');function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(window.toastT);window.toastT=setTimeout(()=>toast.classList.remove('show'),3500)}
document.querySelectorAll('[data-pending]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showToast(b.dataset.pending||'This service is awaiting club confirmation.')}));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-card]').forEach(c=>c.hidden=b.dataset.filter!=='all'&&!c.dataset.card.includes(b.dataset.filter))}));
const history={2017:['The beginning','Dedza Dynamos Football Club is founded in Dedza, Malawi.'],2021:['Regional champions','The Yellow Boys win the Central Region title and earn promotion to Malawi’s elite league.'],2022:['Top-flight debut','The first Super League season ends with a ninth-place finish.'],2023:['Individual recognition','Clement Nyondo wins the league Golden Boot after a reported 16-goal season.'],2026:['A national final','Dedza reach their first Castel Challenge Cup final and finish as runners-up.']};
document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-year]').forEach(x=>x.classList.toggle('active',x===b));const [h,p]=history[b.dataset.year];document.querySelector('.history-panel').innerHTML=`<p class="kicker">${b.dataset.year}</p><h2>${h}</h2><p>${p}</p>`}));
document.querySelectorAll('[data-back-top]').forEach(b=>b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'})));
document.querySelector('[data-contact-form]')?.addEventListener('submit',event=>{event.preventDefault();const status=event.currentTarget.querySelector('[role=status]');status.textContent='Your message has been prepared. Submission will activate when the club confirms its official mailbox.';event.currentTarget.reset()});
const polishedPrimary=[['News','/news/'],['Video','/video/'],['Fixtures','/fixtures/'],['Tickets','/tickets/'],['Shop','/shop/'],['Players','/team/'],['Club','/club/']];
const polishedMore=[['Tables & cups','/competitions/'],['Supporters','/supporters/'],['Partners','/partners/'],['Contact','/contact/']];
/* ── Mega-menu panel definitions ────────────────────────── */
const megaPanels={
  '/news/':`<div class="mega-col"><span class="mega-label">Club news</span><a href="/news/">Latest news</a><a href="/media/">Media centre</a><a href="/news/">Club announcements</a></div><div class="mega-col"><span class="mega-label">External sources</span><a href="https://fam.mw" target="_blank" rel="noopener">FAM — Football Assoc.</a><a href="https://sulommw.com" target="_blank" rel="noopener">SULOM — Super League</a><a href="https://times.mw" target="_blank" rel="noopener">Times of Malawi</a></div><div class="mega-feat"><span>Yellow Boys</span><strong>All the latest from Dedza.</strong><a href="/news/">Read all news <b>→</b></a></div>`,
  '/video/':`<div class="mega-col"><span class="mega-label">Watch live</span><a href="https://www.mbcmalawi.com" target="_blank" rel="noopener">MBC Television</a><a href="https://www.mibawa.com" target="_blank" rel="noopener">Mibawa (streaming)</a><a href="https://www.lunthatv.com" target="_blank" rel="noopener">Luntha TV</a></div><div class="mega-col"><span class="mega-label">More channels</span><a href="https://www.times.mw" target="_blank" rel="noopener">Times Television</a><a href="https://www.zodiacmalawi.com" target="_blank" rel="noopener">Zodiac Broadcasting</a><a href="https://www.mbcmalawi.com" target="_blank" rel="noopener">MBC 2 Sports</a></div><div class="mega-feat"><span>Dedza Dynamos TV</span><strong>Catch every Yellow Boys moment.</strong><a href="/video/">All channels <b>→</b></a></div>`,
  '/fixtures/':`<div class="mega-col"><span class="mega-label">Matchdays</span><a href="/fixtures/">Fixtures & results</a><a href="/competitions/">League tables</a><a href="/competitions/">Cup standings</a></div><div class="mega-col"><span class="mega-label">Season</span><a href="/matches/">All matches</a><a href="/competitions/">FDH Premiership</a><a href="/competitions/">Castel Challenge Cup</a></div><div class="mega-feat"><span>Match centre</span><strong>Never miss a game.</strong><a href="/fixtures/">View fixtures <b>→</b></a></div>`,
  '/tickets/':`<div class="mega-col"><span class="mega-label">Buy tickets</span><a href="/tickets/">All ticket options</a><a href="https://uthenga.co" target="_blank" rel="noopener">uthenga.co</a><a href="https://kwenda.com" target="_blank" rel="noopener">Kwenda</a></div><div class="mega-col"><span class="mega-label">At the gate</span><a href="https://machenji.mw" target="_blank" rel="noopener">Machenji</a><a href="/supporters/">Supporter info</a><a href="/contact/">Contact the club</a></div><div class="mega-feat"><span>Matchday tickets</span><strong>Be in the stands for the Yellow Boys.</strong><a href="/tickets/">Get tickets <b>→</b></a></div>`,
  '/shop/':`<div class="mega-col"><span class="mega-label">Kits</span><a href="/shop/">Home jersey</a><a href="/shop/">Away kit</a><a href="/shop/">Goalkeeper kit</a></div><div class="mega-col"><span class="mega-label">Clothing</span><a href="/shop/">Hoodie tops</a><a href="/shop/">Track pants</a><a href="/shop/">Full tracksuit outfit</a></div><div class="mega-feat"><span>Official store</span><strong>Wear the yellow.</strong><a href="/shop/">Shop now <b>→</b></a></div>`,
  '/team/':`<div class="mega-col"><span class="mega-label">Squad</span><a href="/team/">First team</a><a href="/team/">Goalkeepers</a><a href="/team/">Defenders</a></div><div class="mega-col"><span class="mega-label">More</span><a href="/team/">Midfielders</a><a href="/team/">Forwards</a><a href="/club/">Coaching staff</a></div><div class="mega-feat"><span>Players</span><strong>The Yellow Boys squad.</strong><a href="/team/">View all players <b>→</b></a></div>`,
  '/club/':`<div class="mega-col"><span class="mega-label">About</span><a href="/club/">Club history</a><a href="/club/">Stadium & facilities</a><a href="/club/">Club values</a></div><div class="mega-col"><span class="mega-label">Community</span><a href="/supporters/">Supporters</a><a href="/partners/">Partners</a><a href="/contact/">Contact us</a></div><div class="mega-feat"><span>The Club</span><strong>Goshen City Dedza Dynamos.</strong><a href="/club/">About the club <b>→</b></a></div>`,
};
document.querySelectorAll('.main-nav').forEach(nav=>{
  const current=location.pathname;
  nav.innerHTML=polishedPrimary.map(([label,href])=>{
    const panel=megaPanels[href];
    if(panel){
      return `<div class="mega-item${current===href?' active':''}"><button class="mega-trigger" aria-expanded="false" aria-haspopup="true" data-href="${href}">${label}<svg class="nav-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="mega-panel" role="region">${panel}</div></div>`;
    }
    return `<a href="${href}"${current===href?' aria-current="page"':''}>${label}</a>`;
  }).join('');
});
document.querySelectorAll('.mobile-nav').forEach(nav=>{const current=location.pathname;nav.innerHTML=`<span class="mobile-nav-label">Explore Dedza Dynamos</span>`+[...polishedPrimary,...polishedMore].map(([label,href])=>`<a href="${href}"${current===href?' aria-current="page"':''}>${label}<span aria-hidden="true">→</span></a>`).join('')+`<a class="mobile-admin" href="/members/">Members <span aria-hidden="true">→</span></a>`});
/* ── Mega-menu open/close logic ─────────────────────────── */
function closeMega(){document.querySelectorAll('.mega-item.open').forEach(item=>{item.classList.remove('open');item.querySelector('.mega-trigger')?.setAttribute('aria-expanded','false')})}
document.querySelectorAll('.main-nav').forEach(nav=>{
  nav.addEventListener('click',e=>{
    const trigger=e.target.closest('.mega-trigger');
    if(!trigger)return;
    const item=trigger.closest('.mega-item');
    const isOpen=item.classList.contains('open');
    closeMega();
    if(!isOpen){item.classList.add('open');trigger.setAttribute('aria-expanded','true')}
  });
  nav.addEventListener('mouseleave',()=>closeMega());
  nav.querySelectorAll('.mega-item').forEach(item=>{
    item.addEventListener('mouseenter',()=>{
      closeMega();
      item.classList.add('open');
      item.querySelector('.mega-trigger')?.setAttribute('aria-expanded','true');
    });
  });
});
document.addEventListener('click',e=>{if(!e.target.closest('.main-nav'))closeMega()});
const sourceStories=[{source:'Football Association of Malawi',date:'21 April 2026',title:'FAM grants full licences to 14 Super League clubs',summary:'Goshen City Dedza Dynamos are listed among the clubs granted a full licence.',url:'https://fam.mw/fam-grants-full-licences-to-14-super-league-clubs/'},{source:'Football Association of Malawi',date:'7 February 2026',title:'Dedza Dynamos reach the Castel Challenge Cup final',summary:'Dedza edged Blue Eagles on penalties to secure a place in the national final.',url:'https://fam.mw/dedza-dynamos-edge-blue-eagles-on-penalties-to-reach-castel-challenge-cup-final/'},{source:'Super League of Malawi',date:'2026/27 season',title:'FDH Bank Premiership fixtures and results',summary:'Official fixtures, results and competition data for Malawi’s top flight.',url:'https://sulommw.com/competition/fdh-bank-premiership-2026-27/'}];
function clubPosts(){try{return JSON.parse(localStorage.getItem('dedza-club-posts')||'[]')}catch{return[]}}
function renderNewsFeeds(){if(location.pathname!=='/news/')return;let mount=document.querySelector('[data-news-feeds]');if(!mount){mount=document.createElement('section');mount.dataset.newsFeeds='';document.querySelector('main .shell')?.append(mount)}if(!mount)return;const local=clubPosts();const official=local.length?local.map(item=>`<article class="news-card"><div class="news-card-copy"><span class="meta">Official club update · ${item.date}</span><h3>${item.title}</h3><p>${item.summary}</p><span class="arrow-link">Published by Dedza Dynamos</span></div></article>`).join(''):'<article class="news-card"><div class="news-card-copy"><span class="meta">Official club updates</span><h3>Club newsroom ready</h3><p>Verified club staff announcements will appear here once the secure publishing service is activated.</p></div></article>';const external=sourceStories.map(item=>`<article class="news-card"><div class="news-card-copy"><span class="meta">Source: ${item.source} · ${item.date}</span><h3>${item.title}</h3><p>${item.summary}</p><a class="arrow-link" href="${item.url}" target="_blank" rel="noopener">Read at source →</a></div></article>`).join('');mount.innerHTML=`<section class="section-head"><div><p class="eyebrow">Official club channel</p><h2>From Dedza</h2></div><p>Club-authored updates are labelled separately from independent reporting.</p></section><div class="card-grid">${official}</div><section class="section-head" style="margin-top:4rem"><div><p class="eyebrow">External reporting</p><h2>From trusted sources</h2></div><p>Headlines link to the original publisher and are never presented as club statements.</p></section><div class="card-grid">${external}</div>`}renderNewsFeeds();
function renderAdminDashboard(){const root=document.querySelector('[data-club-admin]');if(!root)return;const posts=clubPosts();root.innerHTML=`<div class="support-grid"><article class="support-card"><p class="eyebrow">Club content</p><h2>Publish an update</h2><form data-club-post-form><label>Headline<input name="title" required maxlength="90"></label><label>Summary<textarea name="summary" required maxlength="280" rows="5"></textarea></label><label>Date<input name="date" type="date" required></label><button class="button yellow" type="submit">Add official update</button></form></article><article class="support-card dark"><p class="eyebrow">News rules</p><h2>Source-aware publishing</h2><p>Club updates display under “From Dedza”. SULOM and FAM stories remain externally attributed with links to their original reports.</p><p class="meta">${posts.length} local draft${posts.length===1?'':'s'} in this browser</p></article></div><section class="section-head" style="margin-top:4rem"><div><p class="eyebrow">Current local drafts</p><h2>News queue</h2></div></section><div class="card-grid">${posts.length?posts.map(post=>`<article class="news-card"><div class="news-card-copy"><span class="meta">${post.date}</span><h3>${post.title}</h3><p>${post.summary}</p></div></article>`).join(''):'<p>No club updates have been added in this browser.</p>'}</div>`;const form=root.querySelector('[data-club-post-form]');form?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);const all=clubPosts();all.unshift({title:String(data.get('title')).trim(),summary:String(data.get('summary')).trim(),date:String(data.get('date'))});localStorage.setItem('dedza-club-posts',JSON.stringify(all));renderAdminDashboard()});}renderAdminDashboard();
