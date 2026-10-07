const fixtures=[
  {date:'2026-10-11',display:'11 Oct',home:'Dedza Dynamos',away:'Masters FC',venue:'Dedza Stadium',competition:'FDH Bank Premiership',status:'Kick-off TBC'},
  {date:'2026-10-17',display:'17 Oct',home:'Civil Service United',away:'Dedza Dynamos',venue:'Civo Stadium',competition:'FDH Bank Premiership',status:'Kick-off TBC'},
  {date:'2026-10-25',display:'25 Oct',home:'Dedza Dynamos',away:'Moyale Barracks',venue:'Dedza Stadium',competition:'FDH Bank Premiership',status:'Kick-off TBC'},
  {date:'2026-11-01',display:'1 Nov',home:'Mighty Wanderers',away:'Dedza Dynamos',venue:'Zomba Stadium',competition:'FDH Bank Premiership',status:'Kick-off TBC'}
];
const results=[
  {date:'2026-09-09',display:'9 Sep',home:'Dedza Dynamos',away:'Luanar Mitundu',venue:'Dedza Stadium',competition:'FDH Bank Premiership',score:'0–0',status:'Full time'},
  {date:'2026-08-23',display:'23 Aug',home:'Silver Strikers',away:'Dedza Dynamos',venue:'Away',competition:'FDH Bank Premiership',score:'0–0',status:'Full time'},
  {date:'2026-08-16',display:'16 Aug',home:'Dedza Dynamos',away:'Creck Sporting',venue:'Dedza Stadium',competition:'FDH Bank Premiership',score:'1–1',status:'Full time'},
  {date:'2026-07-25',display:'25 Jul',home:'Dedza Dynamos',away:'FCB Nyasa Big Bullets',venue:'Dedza Stadium',competition:'FDH Bank Premiership',score:'1–0',status:'Full time'}
];
let currentMode='fixtures';
const matchList=document.querySelector('#match-list');
const featured=document.querySelector('#featured-match');

function initials(name){return name.split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('');}
function renderMatches(mode='fixtures',selected=0){
  currentMode=mode; const data=mode==='fixtures'?fixtures:results; const match=data[selected]||data[0];
  document.querySelector('#match-list-label').textContent=mode==='fixtures'?'Upcoming':'Recent results';
  featured.innerHTML=`<div class="match-meta"><span class="competition">${match.competition}</span><span>${match.status}</span></div><div class="versus"><div><div class="team-badge">${initials(match.home)}</div><div class="team-name">${match.home}</div></div><div class="versus-mark">${match.score||'VS'}</div><div><div class="team-badge">${initials(match.away)}</div><div class="team-name">${match.away}</div></div></div><div class="match-venue"><time datetime="${match.date}">${match.display} 2026</time> · ${match.venue}</div><button class="button button-ghost" type="button" data-match-detail>${mode==='fixtures'?'Match details':'View result'} <span>→</span></button>`;
  matchList.innerHTML=data.map((item,index)=>`<button class="match-row" type="button" data-match-index="${index}" aria-label="Select ${item.home} versus ${item.away}"><span><time datetime="${item.date}">${item.display}</time><strong>${item.home} vs ${item.away}</strong></span><span class="result">${item.score||'→'}</span></button>`).join('');
}
document.querySelectorAll('[data-match-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-match-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',b===button)});renderMatches(button.dataset.matchTab)}));
matchList.addEventListener('click',event=>{const row=event.target.closest('[data-match-index]');if(row)renderMatches(currentMode,Number(row.dataset.matchIndex));});
featured.addEventListener('click',event=>{if(!event.target.closest('[data-match-detail]'))return;const match=(currentMode==='fixtures'?fixtures:results)[0];openDialog(currentMode==='fixtures'?'Match information':'Confirmed result',`<p class="kicker">${match.competition}</p><h2>${match.home}<br>${match.score||'vs'} ${match.away}</h2><p><strong>${match.display} 2026 · ${match.venue}</strong></p><p>${currentMode==='fixtures'?'Kick-off time and travel information remain subject to club confirmation. Check the official competition record before travelling.':'This score is included as a dated result from the club profile’s SULOM snapshot.'}</p>`)});

const menuButton=document.querySelector('.menu-button'); const mobileNav=document.querySelector('.mobile-nav');
menuButton.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
mobileNav.addEventListener('click',event=>{if(event.target.matches('a')){mobileNav.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}});

document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('.story').forEach(card=>{card.hidden=filter!=='all'&&!card.dataset.category.includes(filter)});}));
document.querySelector('[data-show-all]').addEventListener('click',()=>{document.querySelector('[data-filter="all"]').click();document.querySelector('#news-grid').scrollIntoView({behavior:'smooth'});showToast('Showing all published stories in this concept.');});

const dialog=document.querySelector('#content-dialog'); const dialogContent=document.querySelector('#dialog-content');
function openDialog(title,html){dialogContent.innerHTML=`<article class="dialog-body">${html}</article>`;dialog.setAttribute('aria-label',title);dialog.showModal();}
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
const articles={
  'cup-run':['The road to a first final',`<p class="kicker">Club history · 19 February 2026</p><h2>The road to a first Castel Cup final</h2><p>The 2025/26 Castel Challenge Cup became a landmark campaign for Dedza Dynamos. The documented run included a 3–1 win over Creck Sporting, a 2–0 quarterfinal victory against Ekhaya FC and a dramatic semifinal against Blue Eagles.</p><p>Gift Magola scored in stoppage time to force a shootout. Dedza won 4–3 on penalties and reached the competition's final for the first time.</p><p>This story is based on Football Association of Malawi tournament reporting cited in the club profile.</p>`],
  board:['A new chapter',`<p class="kicker">Club update · 5 October 2026</p><h2>A new board for a new era</h2><p>Nyasa Times reported that a nine-member board chaired by Paul Mzungu took effect from 1 October 2026. The reported remit includes governance, technology, commercial growth and oversight of operations.</p><p>The club should approve the final leadership directory before it is treated as official current information.</p>`],
  final:['The 2026 final',`<p class="kicker">Match report · 21 February 2026</p><h2>Big Bullets 2–1 Dedza Dynamos</h2><p>Dedza Dynamos finished as runners-up in their first Castel Challenge Cup final. Hassan Kajoke scored twice for Big Bullets before Chikondi Mbeta replied for Dedza in the 83rd minute.</p><p>The final was played at Bingu National Stadium in Lilongwe. Result and scorers are drawn from the Football Association of Malawi report cited in the profile.</p>`]
};
document.querySelectorAll('[data-article]').forEach(button=>button.addEventListener('click',()=>{const [title,html]=articles[button.dataset.article];openDialog(title,html)}));
document.querySelector('[data-open-story]').addEventListener('click',()=>openDialog('The Dedza story',`<p class="kicker">2017—2026</p><h2>Built in Dedza</h2><p>Founded in 2017, Dedza Dynamos rose from regional competition to reach Malawi's elite league in 2022. Four years later, the Yellow Boys contested their first Castel Challenge Cup final.</p><p>This interactive presentation uses documented milestones. A club-approved video can replace this story panel when licensed footage becomes available.</p>`));
document.querySelectorAll('.timeline-item').forEach(item=>{const activate=()=>{document.querySelectorAll('.timeline-item').forEach(i=>i.classList.toggle('active',i===item))};item.addEventListener('click',activate);item.addEventListener('focus',activate)});
function showToast(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),3500)}
document.querySelector('[data-whatsapp]').addEventListener('click',()=>showToast('The official WhatsApp channel is awaiting club confirmation.'));
document.querySelector('#newsletter-form').addEventListener('submit',event=>{event.preventDefault();const status=event.currentTarget.querySelector('.form-status');status.textContent='Thanks — this concept form is ready to connect to the club’s approved mailing service.';event.currentTarget.reset()});
document.querySelector('[data-back-top]').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
renderMatches();
