// Lists class names used in markup strings that have no rule in styles.css.
import { readFileSync } from 'node:fs';

const js = readFileSync('app.js', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

const used = new Set();
for (const m of js.matchAll(/class="([^"$`]*)"/g)) {
  m[1].split(/\s+/).filter(Boolean).forEach(c => used.add(c));
}
for (const m of js.matchAll(/class=\\?"([^"$`\\]*)\\?"/g)) {
  m[1].split(/\s+/).filter(Boolean).forEach(c => used.add(c));
}
for (const m of html.matchAll(/class="([^"]*)"/g)) {
  m[1].split(/\s+/).filter(Boolean).forEach(c => used.add(c));
}
const missing = [...used].filter(c => !new RegExp(`\\.${c}(?![\\w-])`).test(css)).sort();
console.log(`classes used: ${used.size}`);
console.log(`missing in css: ${missing.length ? missing.join(', ') : 'none'}`);
