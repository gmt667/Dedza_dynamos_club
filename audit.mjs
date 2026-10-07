import fs from 'node:fs';
import path from 'node:path';

const dist = 'c:/Users/GMT/Downloads/Dedza_dynamos_club/site/dist';
function getFiles(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res.push(...getFiles(full));
    else if (f.endsWith('.html')) res.push(full);
  }
  return res;
}

const htmlFiles = getFiles(dist);
console.log('Total HTML pages:', htmlFiles.length);

const allHrefs = new Set();
const missingLinks = [];
const missingImages = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(dist, file).replace(/\\/g, '/');
  
  // Extract title and meta description
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  
  // Extract links
  const hrefs = [...content.matchAll(/href=["']([^"'#]+)(#[^"']*)?["']/g)].map(m => m[1]);
  for (const h of hrefs) {
    if (h.startsWith('http') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('//')) continue;
    allHrefs.add(h);
    // Resolve relative or root path
    let target = h.startsWith('/') ? path.join(dist, h) : path.join(path.dirname(file), h);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (!fs.existsSync(target)) {
      missingLinks.push({ from: rel, link: h, target });
    }
  }

  // Extract images
  const srcs = [...content.matchAll(/src=["']([^"']+)["']/g)].map(m => m[1]);
  for (const s of srcs) {
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:')) continue;
    let target = s.startsWith('/') ? path.join(dist, s) : path.join(path.dirname(file), s);
    if (!fs.existsSync(target)) {
      missingImages.push({ from: rel, src: s, target });
    }
  }

  console.log(`\n--- [${rel}] ---`);
  console.log(`Title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
  console.log(`Desc: ${descMatch ? descMatch[1] : 'NONE'}`);
  console.log(`H1: ${h1Match ? h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'NONE'}`);
}

console.log('\n=== Missing links ===', missingLinks);
console.log('=== Missing images ===', missingImages);
