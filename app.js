(() => {
  'use strict';

  const STORE_KEY = 'saikyo.v1';
  const QUOTE_EPOCH = '2026-11-05';
  const DEFAULT_TEMPLATE = ['Duolingo', 'ピアノ', 'パソコン'];
  const QUICK = ['ジム', '勉強', '難しい本', '部屋の掃除', 'TOEIC'];
  const $ = s => document.querySelector(s);

  // ---------- 日付（日本時間） ----------
  const jstDate = (d = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(d);
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00+09:00');
    d.setUTCDate(d.getUTCDate() + n);
    return jstDate(d);
  };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00+09:00') - new Date(a + 'T00:00:00+09:00')) / 864e5);
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const fmtJa = iso => {
    const d = new Date(iso + 'T12:00:00+09:00');
    return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEK[d.getUTCDay()]}）`;
  };

  // ---------- 保存 ----------
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.days) return s;
    } catch {}
    return { template: DEFAULT_TEMPLATE.slice(), days: {} };
  };
  let state = load();
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  let today = jstDate();
  const uid = () => Math.random().toString(36).slice(2, 9);
  const ensureDay = iso => {
    if (!state.days[iso]) {
      state.days[iso] = { tasks: state.template.map(label => ({ id: uid(), label, done: false })), pick: null, yohaku: false };
      save();
    }
    return state.days[iso];
  };
  const dayStatus = iso => {
    const d = state.days[iso];
    if (!d) return 'none';
    if (d.tasks.some(t => t.done)) return 'done';
    if (d.yohaku) return 'yohaku';
    return 'none';
  };

  // ---------- トースト・お祝い ----------
  let toastTimer;
  const toast = msg => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };
  const sparkle = (x, y) => {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const a = (Math.PI * 2 * i) / 14, r = 40 + Math.random() * 40;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--x', Math.cos(a) * r + 'px');
      s.style.setProperty('--y', Math.sin(a) * r + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  };
  // チェックしたときのヒナタの反応（数が増えるほど大げさに）
  const cheer = (day, t) => {
    const n = day.tasks.filter(x => x.done).length;
    const total = day.tasks.length;
    if (n === total && total > 1) return window.Hinata.say('all', { n }, { mood: 'shock', big: true });
    if (day.pick === t.id) return window.Hinata.say('pickDone', { t: t.label }, { mood: 'shock', big: true });
    if (n === 1) return window.Hinata.say('first', { n }, { mood: 'joy' });
    if (n === 2) return window.Hinata.say('second', { n }, { mood: 'shock' });
    return window.Hinata.say('more', { n }, { mood: 'shock', big: n >= 4 });
  };
  const streakOf = () => {
    let k = 0;
    for (let i = dayStatus(today) === 'none' ? 1 : 0; ; i++) {
      if (dayStatus(addDays(today, -i)) === 'none') break;
      k++;
    }
    return k;
  };
  const greet = () => {
    const k = streakOf();
    if ([3, 7, 14, 21, 30, 50, 100].includes(k)) return window.Hinata.say('milestone', { n: k }, { mood: 'shock', big: true });
    if (k >= 2) return window.Hinata.say('streak', { n: k }, { mood: 'shock' });
    const h = +new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false }).format(new Date());
    window.Hinata.say(h >= 4 && h < 11 ? 'morning' : h < 18 && h >= 11 ? 'noon' : 'night', {}, { mood: 'joy' });
  };

  // ---------- ヒーロー ----------
  const renderHero = () => {
    $('#heroDate').textContent = fmtJa(today);
    const stones = Object.keys(state.days).filter(k => dayStatus(k) !== 'none').length;
    $('#heroCount').textContent = `stones · ${stones}`;
  };

  const buildSky = () => {
    let seed = 20261105;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.getElementById('stars');
    const rays = document.getElementById('rayset');
    for (let i = 0; i < 24; i++) {
      const p = document.createElementNS(NS, 'path');
      const w = 2 + rnd() * 5;
      p.setAttribute('d', `M0 0 L${-w} -${520 + rnd() * 160} L${w} -${520 + rnd() * 160}Z`);
      p.setAttribute('transform', `rotate(${i * 15 + rnd() * 6})`);
      p.setAttribute('opacity', (.25 + rnd() * .5).toFixed(2));
      rays.appendChild(p);
    }
    for (let i = 0; i < 60; i++) {
      const c = document.createElementNS(NS, 'circle');
      const y = Math.pow(rnd(), 2) * 220;
      c.setAttribute('cx', (rnd() * 1200).toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      const big = rnd() > .93;
      c.setAttribute('r', (big ? 1.6 + rnd() * 1.2 : .5 + rnd() * .9).toFixed(2));
      c.setAttribute('fill', rnd() > .85 ? '#ffe7c2' : rnd() > .7 ? '#cdd6ff' : '#ffffff');
      c.setAttribute('class', 'star');
      c.style.setProperty('--d', (2.5 + rnd() * 5).toFixed(1) + 's');
      c.style.setProperty('--delay', (-rnd() * 6).toFixed(1) + 's');
      c.style.setProperty('--o', (.4 + rnd() * .6).toFixed(2));
      g.appendChild(c);
    }
    const ff = document.getElementById('fireflies');
    for (let i = 0; i < 16; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', (380 + rnd() * 440).toFixed(1));
      c.setAttribute('cy', (640 + rnd() * 320).toFixed(1));
      c.setAttribute('r', (1 + rnd() * 1.6).toFixed(1));
      c.setAttribute('class', 'firefly');
      c.style.setProperty('--d', (4 + rnd() * 4).toFixed(1) + 's');
      c.style.setProperty('--delay', (-rnd() * 8).toFixed(1) + 's');
      c.style.setProperty('--dx', ((rnd() - .5) * 40).toFixed(0) + 'px');
      c.style.setProperty('--dy', (-10 - rnd() * 30).toFixed(0) + 'px');
      ff.appendChild(c);
    }
  };

  // ---------- 名言 ----------
  const renderQuote = () => {
    const list = window.QUOTES || [];
    if (!list.length) return;
    const n = dayDiff(QUOTE_EPOCH, today);
    const q = list[((n % list.length) + list.length) % list.length];
    const t = $('#quoteText');
    t.textContent = q.t;
    t.classList.toggle('latin', /^[\x00-\x7FÀ-ɏ'’—…«»¿¡ ]+$/.test(q.t));
    $('#quoteJa').textContent = q.ja || '';
    $('#quoteBy').textContent = q.a;
  };

  // ---------- 今日の一手 ----------
  const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const renderTasks = () => {
    const day = ensureDay(today);
    $('#todayLabel').textContent = `${fmtJa(today)}の一手`;
    const ul = $('#tasks');
    ul.innerHTML = day.tasks.map(t => `
      <li class="task${t.done ? ' done' : ''}${day.pick === t.id ? ' picked' : ''}" data-id="${t.id}">
        <button class="check" type="button" aria-label="${esc(t.label)}を${t.done ? '未完了に戻す' : '完了にする'}" aria-pressed="${t.done}">${CHECK_SVG}</button>
        <span class="task-label">${day.pick === t.id ? '<span class="task-tag">今日の一手</span>' : ''}<span class="task-text">${esc(t.label)}</span></span>
        <button class="pick" type="button" aria-pressed="${day.pick === t.id}" aria-label="今日の一手に選ぶ" title="今日の一手に選ぶ">♜</button>
        <button class="del" type="button" aria-label="${esc(t.label)}を今日のリストから外す" title="外す">×</button>
      </li>`).join('');

    const have = new Set(day.tasks.map(t => t.label));
    $('#quickAdd').innerHTML = QUICK.filter(q => !have.has(q)).map(q => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('');

    const yb = $('#yohakuBtn');
    yb.classList.toggle('on', !!day.yohaku);
    yb.setAttribute('aria-pressed', !!day.yohaku);
    $('#yohakuLabel').textContent = day.yohaku ? '今日は余白の日。ちゃんと前進にカウントしています' : '今日は余白の日にする（これも前進）';

    renderWall();
    renderHistory();
    renderHero();
    window.Hinata.heat({ done: day.tasks.filter(t => t.done).length, total: day.tasks.length, yohaku: day.yohaku });
  };

  const renderWall = () => {
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const iso = addDays(today, -i);
      const st = dayStatus(iso);
      cells.push(`<span class="sw ${st}${i === 0 ? ' today' : ''}" title="${fmtJa(iso)}"></span>`);
    }
    $('#stoneWall').innerHTML = cells.join('');

    const stones = Object.keys(state.days).filter(k => dayStatus(k) !== 'none').length;
    let streak = 0;
    for (let i = dayStatus(today) === 'none' ? 1 : 0; ; i++) {
      if (dayStatus(addDays(today, -i)) === 'none') break;
      streak++;
    }
    let week = 0;
    for (let i = 0; i < 7; i++) if (dayStatus(addDays(today, -i)) !== 'none') week++;
    $('#statStones').textContent = stones;
    $('#statStreak').textContent = streak;
    $('#statWeek').textContent = week;
  };

  const renderHistory = () => {
    const keys = Object.keys(state.days).filter(k => k < today).sort().reverse();
    $('#historyList').innerHTML = keys.length
      ? keys.slice(0, 60).map(k => {
          const d = state.days[k];
          const items = d.tasks.map(t => t.done ? `<b>${esc(t.label)}</b>` : `<s>${esc(t.label)}</s>`).join('・');
          return `<li><span class="h-date">${fmtJa(k)}</span>${d.yohaku ? '<span class="h-items">余白の日 ・ </span>' : ''}<span class="h-items">${items || '—'}</span></li>`;
        }).join('')
      : '<li>まだ昨日以前の記録はありません。明日になると、ここに今日の一手が並びます。</li>';
  };

  $('#tasks').addEventListener('click', e => {
    const li = e.target.closest('.task');
    if (!li) return;
    const day = ensureDay(today);
    const t = day.tasks.find(x => x.id === li.dataset.id);
    if (!t) return;
    if (e.target.closest('.check')) {
      const r = li.querySelector('.check').getBoundingClientRect();
      t.done = !t.done;
      save();
      renderTasks();
      if (t.done) {
        sparkle(r.left + r.width / 2, r.top + r.height / 2);
        cheer(day, t);
      } else {
        window.Hinata.say('undo', {}, {});
      }
    } else if (e.target.closest('.pick')) {
      day.pick = day.pick === t.id ? null : t.id;
      save();
      renderTasks();
      if (day.pick) window.Hinata.say('pick', { t: t.label }, { mood: 'joy' });
    } else if (e.target.closest('.del')) {
      day.tasks = day.tasks.filter(x => x.id !== t.id);
      if (day.pick === t.id) day.pick = null;
      save();
      renderTasks();
    }
  });

  const addTask = label => {
    label = label.trim();
    if (!label) return;
    const day = ensureDay(today);
    day.tasks.push({ id: uid(), label, done: false });
    save();
    renderTasks();
    window.Hinata.say('add', { t: label }, { mood: 'shock' });
  };
  $('#taskAdd').addEventListener('submit', e => {
    e.preventDefault();
    addTask($('#taskInput').value);
    $('#taskInput').value = '';
  });
  $('#quickAdd').addEventListener('click', e => {
    const b = e.target.closest('button[data-q]');
    if (b) addTask(b.dataset.q);
  });
  $('#yohakuBtn').addEventListener('click', () => {
    const day = ensureDay(today);
    day.yohaku = !day.yohaku;
    save();
    renderTasks();
    if (day.yohaku) window.Hinata.say('yohaku', {}, { mood: 'joy' });
  });

  // 毎日の項目
  const sheet = $('#templateSheet');
  $('#editTemplate').addEventListener('click', () => {
    $('#templateText').value = state.template.join('\n');
    sheet.showModal();
  });
  sheet.addEventListener('close', () => {
    if (sheet.returnValue !== 'save') return;
    const list = $('#templateText').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
    state.template = list.length ? list : DEFAULT_TEMPLATE.slice();
    save();
    toast('明日から、この項目で始まります');
  });

  // 書き出し・読み込み
  $('#exportData').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `saikyo-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importData').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.days) throw new Error('bad');
      state.days = { ...data.days, ...state.days };
      if (Array.isArray(data.template)) state.template = data.template;
      save();
      renderTasks();
      toast('記録を読み込みました');
    } catch { toast('読み込めないファイルでした'); }
    e.target.value = '';
  });

  // ---------- TOEIC ----------
  const renderToeic = () => {
    const days = dayDiff(today, '2027-01-24');
    $('#toeicDays').textContent = days > 0 ? days : days === 0 ? '今日' : '済';
    const now = Date.now();
    let next = null;
    document.querySelectorAll('#toeicTimeline li').forEach(li => {
      const t = new Date(li.dataset.date).getTime();
      li.classList.remove('past', 'next');
      if (t + (li === document.querySelector('#toeicTimeline li:last-child') ? 864e5 : 0) < now) li.classList.add('past');
      else if (!next) { next = li; li.classList.add('next'); }
    });
    const open = new Date('2026-11-11T00:00:00+09:00').getTime();
    const close = new Date('2026-12-09T15:00:00+09:00').getTime();
    let msg = '';
    if (now < open) msg = `申込開始まで あと${dayDiff(today, '2026-11-11')}日。11月11日になったら申し込もう。`;
    else if (now < close) msg = `申込受付中。締切は12月9日 15:00（あと${Math.max(0, dayDiff(today, '2026-12-09'))}日）。`;
    else if (days > 0) msg = '申込期間は終わりました。あとは当日まで積むだけ。';
    $('#toeicNext').textContent = msg;
  };

  // ---------- ニュース ----------
  const CAT = { game: 'ゲーム', ent: 'エンタメ', europe: 'ヨーロッパ' };
  const LANG = { it: 'ITALIANO', en: 'ENGLISH' };
  let currentFilter = 'all';
  const applyFilter = () => {
    document.querySelectorAll('.news-item').forEach(li => li.classList.toggle('hide', currentFilter !== 'all' && li.dataset.cat !== currentFilter));
  };
  const renderNews = async () => {
    const ul = $('#newsList');
    try {
      const r = await fetch('data/news.json?d=' + today + '-' + Math.floor(Date.now() / 36e5), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const stale = data.date !== today;
      $('#newsDate').textContent = `${fmtJa(data.date)}${stale ? 'の便り（今朝の分は準備中）' : 'の便り'}・${data.items.length}本`;
      ul.innerHTML = data.items.map(n => `
        <li class="news-item" data-cat="${n.cat}">
          <a href="${esc(n.link)}" target="_blank" rel="noopener">
            <span class="news-bar"></span>
            <span>
              <span class="news-meta"><span class="news-cat">${CAT[n.cat] || ''}</span><span>${esc(n.source)}</span>${LANG[n.lang] ? `<span class="news-lang">${LANG[n.lang]}</span>` : ''}</span>
              <p class="news-title">${esc(n.title)}</p>
              <p class="news-desc">${esc(n.desc || '')}</p>
            </span>
          </a>
        </li>`).join('');
      applyFilter();
    } catch {
      ul.innerHTML = '<li class="news-empty">いまは便りを取りに行けませんでした。電波のよいところで開き直してみてください。</li>';
    }
  };
  $('#newsFilter').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    currentFilter = b.dataset.cat;
    document.querySelectorAll('#newsFilter button').forEach(x => x.classList.toggle('on', x === b));
    applyFilter();
  });

  // ---------- 演出 ----------
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  const tabs = [...document.querySelectorAll('.tabbar a')];
  const secs = tabs.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * .35;
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
    tabs.forEach((a, i) => a.classList.toggle('on', i === cur));
    document.querySelector('.tabbar').classList.toggle('hidden', window.scrollY < window.innerHeight * .5);
    const art = document.querySelector('.hero-art');
    if (window.scrollY < window.innerHeight) art.style.transform = `translateY(${window.scrollY * .25}px)`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- 日付が変わったら ----------
  const refreshAll = () => {
    renderHero(); renderQuote(); renderTasks(); renderToeic(); renderNews();
  };
  const checkDay = () => {
    const now = jstDate();
    if (now !== today) { today = now; refreshAll(); }
    else renderToeic();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); renderNews(); } });
  setInterval(checkDay, 60 * 1000);

  buildSky();
  refreshAll();
  onScroll();
  setTimeout(greet, 1400);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
