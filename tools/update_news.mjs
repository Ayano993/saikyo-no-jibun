// 毎朝のニュース更新: RSS から 6〜7 本を選び、リンクが生きているものだけ data/news.json に書く
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'news.json');
const SEEN = path.join(ROOT, 'data', 'seen.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

// cat: game / ent / europe。take はそのカテゴリから取る本数
const SOURCES = [
  { cat: 'game',   name: '4Gamer',       url: 'https://www.4gamer.net/rss/index.xml', lang: 'ja' },
  { cat: 'game',   name: 'AUTOMATON',    url: 'https://automaton-media.com/feed/', lang: 'ja' },
  { cat: 'game',   name: 'GAME Watch',   url: 'https://game.watch.impress.co.jp/data/rss/1.0/gmw/feed.rdf', lang: 'ja' },
  { cat: 'ent',    name: '音楽ナタリー', url: 'https://natalie.mu/music/feed/news', lang: 'ja' },
  { cat: 'ent',    name: 'コミックナタリー', url: 'https://natalie.mu/comic/feed/news', lang: 'ja' },
  { cat: 'ent',    name: '映画ナタリー', url: 'https://natalie.mu/eiga/feed/news', lang: 'ja' },
  { cat: 'europe', name: 'ANSA Cultura', url: 'https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml', lang: 'it' },
  { cat: 'europe', name: 'The Guardian Culture', url: 'https://www.theguardian.com/culture/rss', lang: 'en', only: /theguardian\.com\/(artanddesign|stage|books|music\/\d|music\/(?!.*hip-hop)|film\/\d)/ },
];
const QUOTA = { game: 2, ent: 2, europe: 3 };

// 就活・選考・体調などは載せない
const BLOCK = /(就活|就職|採用|新卒|選考|内定|インターン|面接|求人|転職|合否|エントリー|説明会|死去|訃報|逝去|事故|事件|逮捕|病|がん|闘病|hiring|recruit|intern|job|died|dies|death|obituar|morto|morta|muore|lutto|addio a|arrest|cancer)/i;

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ').trim();

function parse(xml) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) || [];
  return blocks.map(b => {
    const title = decode((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
    let link = (b.match(/<link[^>]*href="([^"]+)"/) || [])[1] || decode((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '');
    const date = (b.match(/<(pubDate|dc:date|updated|published)>([\s\S]*?)<\/\1>/) || [])[2] || '';
    const desc = decode((b.match(/<(description|summary)[^>]*>([\s\S]*?)<\/\1>/) || [])[2] || '').slice(0, 140);
    return { title, link: link.trim(), date: date ? new Date(date).toISOString() : null, desc };
  }).filter(x => x.title && /^https:\/\//.test(x.link));
}

async function get(url, method = 'GET') {
  const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8,it;q=0.6' }, signal: AbortSignal.timeout(15000) });
  return res;
}

async function alive(url) {
  try {
    const r = await get(url);
    return r.ok;
  } catch { return false; }
}

async function main() {
  let seen = [];
  try { seen = JSON.parse(await readFile(SEEN, 'utf8')); } catch {}
  const seenSet = new Set(seen);

  const pools = { game: [], ent: [], europe: [] };
  for (const s of SOURCES) {
    try {
      const r = await get(s.url);
      if (!r.ok) throw new Error(r.status);
      const items = parse(await r.text())
        .filter(i => !BLOCK.test(i.title + ' ' + i.desc) && !seenSet.has(i.link) && (!s.only || s.only.test(i.link)))
        .slice(0, 8)
        .map(i => ({ ...i, cat: s.cat, source: s.name, lang: s.lang }));
      pools[s.cat].push(items);
    } catch (e) { console.error('feed failed', s.name, e.message); }
  }

  const picked = [];
  for (const [cat, n] of Object.entries(QUOTA)) {
    // 同じカテゴリの中で媒体を順番に混ぜる
    const lists = pools[cat].map(l => [...l]);
    let got = 0;
    while (got < n && lists.some(l => l.length)) {
      for (const l of lists) {
        if (got >= n) break;
        while (l.length) {
          const cand = l.shift();
          if (picked.some(p => p.link === cand.link || p.title === cand.title)) continue;
          if (await alive(cand.link)) { picked.push(cand); got++; break; }
          console.error('dead link skipped', cand.link);
        }
      }
    }
  }

  if (picked.length < 4) {
    console.error(`only ${picked.length} items; keeping previous news.json`);
    process.exit(1);
  }

  const now = new Date();
  const jstDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(now);
  await writeFile(OUT, JSON.stringify({ date: jstDate, updatedAt: now.toISOString(), items: picked }, null, 2) + '\n');
  await writeFile(SEEN, JSON.stringify([...picked.map(p => p.link), ...seen].slice(0, 600), null, 0) + '\n');
  console.log(`wrote ${picked.length} items for ${jstDate}`);
}

main();
