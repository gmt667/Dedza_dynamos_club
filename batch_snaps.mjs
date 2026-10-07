import { execFileSync } from 'node:child_process';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'c:\\Users\\GMT\\Downloads\\Dedza_dynamos_club\\site';

const snaps = [
  { url: 'http://127.0.0.1:4173/matches/', out: 'snap_matches.png', w: 1440, h: 1000 },
  { url: 'http://127.0.0.1:4173/team/', out: 'snap_team.png', w: 1440, h: 1000 },
  { url: 'http://127.0.0.1:4173/club/', out: 'snap_club.png', w: 1440, h: 1000 },
  { url: 'http://127.0.0.1:4173/competitions/', out: 'snap_competitions.png', w: 1440, h: 1000 },
  { url: 'http://127.0.0.1:4173/contact/', out: 'snap_contact.png', w: 1440, h: 1000 },
  { url: 'http://127.0.0.1:4173/', out: 'snap_mobile.png', w: 390, h: 844 },
];

for (const s of snaps) {
  const file = path.join(base, s.out);
  const args = [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${s.w},${s.h}`,
    `--screenshot=${file}`,
    s.url
  ];
  try {
    execFileSync(chromePath, args);
    console.log('Saved:', s.out);
  } catch (err) {
    console.error('Failed:', s.out, err.message);
  }
}
