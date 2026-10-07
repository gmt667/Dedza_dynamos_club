import { execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPath = 'c:\\Users\\GMT\\Downloads\\Dedza_dynamos_club\\site\\test_home.png';

const args = [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1440,900',
  `--screenshot=${outPath}`,
  'http://127.0.0.1:4173/'
];

execFile(chromePath, args, (err, stdout, stderr) => {
  console.log('Error:', err);
  console.log('Stdout:', stdout);
  console.log('Stderr:', stderr);
  console.log('Exists?', fs.existsSync(outPath));
});
