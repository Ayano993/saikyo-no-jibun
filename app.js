(() => {
  'use strict';

  const STORE_KEY = 'saikyo.v1';
  const QUOTE_EPOCH = '2026-11-05';
  const DEFAULT_TEMPLATE = ['Duolingo', 'ピアノ', 'パソコン'];
  const QUICK = ['ジム', '勉強', '難しい本', '部屋の掃除', 'TOEIC'];
  const $ = s => document.querySelector(s);
  const hinata = () => window.Hinata;
  const sound = name => window.Sound && window.Sound.sfx(name);

  // ---------- 行動計画（「何を、どれくらい」） ----------
  // first: 今すぐやる最初の一歩 / min: 目安の分 / steps: 手順 / app: そのまま開けるアプリ
  const PLANS = {
    'Duolingo': {
      icon: 'Aa', hue: 'green', min: 10,
      first: 'アプリを開いて、レッスンを1つ',
      steps: ['アプリを開く', '今日のレッスンを1つ（約5分）', '余力があれば、もう1つか復習を1つ'],
      app: { label: 'Duolingoを開く', scheme: 'duolingo://', web: 'https://www.duolingo.com/learn' },
    },
    'ピアノ': {
      icon: '♪', hue: 'pink', min: 15,
      first: '鍵盤のふたを開けて、音階を3分',
      steps: ['指ならし：音階かハノンを3分', 'いまの曲を2小節ずつ、ゆっくり8分', '最後に、止まらず通して1回'],
    },
    'パソコン': {
      icon: '⌘', hue: 'blue', min: 25,
      first: '「今日つくるもの」を1行メモする',
      steps: ['今日つくるものを1行で書く', 'タイマーを押して25分だけ集中', '終わったら、できたことを一言メモ'],
    },
    'ジム': {
      icon: '◆', hue: 'orange', min: 40,
      first: 'ウェアに着替えて、家を出る',
      steps: ['ウォームアップ5分', 'メインのメニュー30分', 'ストレッチ5分'],
    },
    '勉強': {
      icon: '✎', hue: 'gold', min: 25,
      first: '机に1冊だけ出して、25分',
      steps: ['やる範囲を1つ決める', '25分集中', '5分休んで、続けるか決める'],
    },
    '難しい本': {
      icon: '❦', hue: 'violet', min: 20,
      first: '本を開いて、まず5ページ',
      steps: ['しおりのページを開く', '10ページ（または20分）読む', '心に残った一文をメモ'],
    },
    '部屋の掃除': {
      icon: '✧', hue: 'mint', min: 15,
      first: '机の上だけ、片づける',
      steps: ['机の上を片づける', '床のものを戻す', 'ゴミをまとめて出す'],
    },
    'TOEIC': {
      icon: 'Ⓣ', hue: 'gold', min: 20,
      first: 'Part 5 を10問だけ解く',
      steps: ['Part 5 を20問（約10分）', '間違えた問題の解説を読む', '新しい単語を10個'],
    },
  };
  const DEFAULT_PLAN = { icon: '✦', hue: 'orange', min: 15, first: '15分だけ、手をつける', steps: ['タイマーを押す', '15分だけやる', '終わったらチェック'] };
  const planFor = label => {
    const own = state.plans && state.plans[label];
    const base = PLANS[label] || Object.entries(PLANS).find(([k]) => label.includes(k))?.[1] || DEFAULT_PLAN;
    return own ? { ...base, ...own } : base;
  };

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
  const clock = secs => {
    secs = Math.max(0, Math.floor(secs));
    const h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60), s = secs % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const minutesJa = secs => {
    if (secs < 60) return `${Math.floor(secs)}秒`;
    const m = Math.round(secs / 60);
    return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60 ? m % 60 + '分' : ''}` : `${m}分`;
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
  state.plans = state.plans || {};
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  let today = jstDate();
  const uid = () => Math.random().toString(36).slice(2, 9);
  const ensureDay = iso => {
    if (!state.days[iso]) {
      state.days[iso] = { tasks: state.template.map(label => ({ id: uid(), label, done: false, secs: 0 })), pick: null, yohaku: false };
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

  // ---------- タイマー（開いた端末に保存。アプリを行き来しても続く） ----------
  const running = () => state.timer || null;
  const elapsedOf = t => {
    const r = running();
    const live = r && r.id === t.id ? (Date.now() - r.start) / 1000 : 0;
    return (t.secs || 0) + live;
  };
  const daySecs = iso => {
    const d = state.days[iso];
    if (!d) return 0;
    return d.tasks.reduce((a, t) => a + (iso === today ? elapsedOf(t) : t.secs || 0), 0);
  };
  const findTask = (day, id) => state.days[day] && state.days[day].tasks.find(t => t.id === id);
  const stopTimer = (quiet = false) => {
    const r = running();
    if (!r) return null;
    const t = findTask(r.day, r.id);
    const add = (Date.now() - r.start) / 1000;
    state.timer = null;
    if (t) t.secs = (t.secs || 0) + add;
    save();
    if (!quiet && t) {
      sound('stop');
      const plan = planFor(t.label);
      if (t.secs >= plan.min * 60 && !t.done) { t.done = true; save(); celebrate(state.days[r.day], t, null); }
      else if (add >= 60) hinata().say('timerStop', { m: Math.round(add / 60) }, { mood: 'shock' });
      else hinata().say('timerShort', {}, { mood: 'joy' });
    }
    return t;
  };
  const startTimer = t => {
    if (running()) stopTimer(true);
    state.timer = { day: today, id: t.id, start: Date.now(), goalShown: elapsedOf(t) >= planFor(t.label).min * 60 };
    save();
    sound('start');
    hinata().say('timerStart', { t: t.label }, { mood: 'joy' });
  };

  // ---------- アプリを開く ----------
  const openApp = app => {
    hinata().say('openApp', {}, { mood: 'joy' });
    const t0 = Date.now();
    let left = false;
    const onHide = () => { if (document.hidden) left = true; };
    document.addEventListener('visibilitychange', onHide);
    window.location.href = app.scheme;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      if (!left && Date.now() - t0 < 4000) window.open(app.web, '_blank', 'noopener');
    }, 1500);
  };

  // ---------- お祝い ----------
  const sparkle = (x, y) => {
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const a = (Math.PI * 2 * i) / 16, r = 40 + Math.random() * 50;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--x', Math.cos(a) * r + 'px');
      s.style.setProperty('--y', Math.sin(a) * r + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  };
  // チェックしたときのヒナタの反応（数が増えるほど大げさに）
  const celebrate = (day, t, at) => {
    if (at) sparkle(at.x, at.y);
    const n = day.tasks.filter(x => x.done).length;
    const total = day.tasks.length;
    if (n === total && total > 1) { sound('fanfare'); return hinata().say('all', { n }, { mood: 'shock', big: true }); }
    if (day.pick === t.id) { sound('fanfare'); return hinata().say('pickDone', { t: t.label }, { mood: 'shock', big: true }); }
    sound('check');
    if (n === 1) return hinata().say('first', { n }, { mood: 'joy' });
    if (n === 2) return hinata().say('second', { n }, { mood: 'shock' });
    return hinata().say('more', { n }, { mood: 'shock', big: n >= 4 });
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
    if ([3, 7, 14, 21, 30, 50, 100].includes(k)) { sound('fanfare'); return hinata().say('milestone', { n: k }, { mood: 'shock', big: true }); }
    if (k >= 2) return hinata().say('streak', { n: k }, { mood: 'shock' });
    const h = +new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false }).format(new Date());
    hinata().say(h >= 4 && h < 11 ? 'morning' : h < 18 && h >= 11 ? 'noon' : 'night', {}, { mood: 'joy' });
  };

  // ---------- ヒーロー ----------
  const renderHero = () => {
    $('#heroDate').textContent = fmtJa(today);
    const k = streakOf();
    $('#heroStreak').textContent = k ? `${k}日連続` : '今日から積む';
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
  const RING_R = 19, RING_C = 2 * Math.PI * RING_R;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let openId = null;

  const timerBtn = (t, plan) => {
    const on = running() && running().id === t.id;
    const ratio = Math.min(1, elapsedOf(t) / (plan.min * 60));
    return `
      <button class="tbtn${on ? ' on' : ''}" type="button" data-act="timer" aria-label="${esc(t.label)}の時間を${on ? '止める' : '測る'}">
        <svg viewBox="0 0 44 44" class="ring"><circle cx="22" cy="22" r="${RING_R}" class="ring-bg"/><circle cx="22" cy="22" r="${RING_R}" class="ring-fg" style="stroke-dasharray:${RING_C};stroke-dashoffset:${RING_C * (1 - ratio)}"/></svg>
        <span class="tbtn-ico">${on ? '■' : '▶'}</span>
      </button>`;
  };

  const renderFocus = day => {
    const box = $('#focus');
    const t = day.tasks.find(x => x.id === day.pick);
    if (!t) {
      box.className = 'focus empty';
      box.innerHTML = `
        <p class="focus-kicker">今すぐの一手</p>
        <h3 class="focus-title">今日の一手を選ぶ</h3>
        <div class="focus-chips">${day.tasks.map(x => `<button type="button" data-pick="${x.id}"><i class="hue-${planFor(x.label).hue}">${esc(planFor(x.label).icon)}</i>${esc(x.label)}</button>`).join('')}</div>`;
      return;
    }
    const plan = planFor(t.label);
    const on = running() && running().id === t.id;
    box.className = `focus${t.done ? ' done' : ''}${on ? ' live' : ''}`;
    box.innerHTML = `
      <p class="focus-kicker">今すぐの一手</p>
      <div class="focus-head">
        <span class="focus-icon hue-${plan.hue}">${esc(plan.icon)}</span>
        <div>
          <h3 class="focus-title">${esc(t.label)}</h3>
          <p class="focus-first">${t.done ? 'やりきった！ 今日の城に石が積まれました' : `まず：${esc(plan.first)}`}</p>
        </div>
      </div>
      <div class="focus-meter">
        <span class="focus-time" data-live="${t.id}">${clock(elapsedOf(t))}</span>
        <span class="focus-goal">目安 ${plan.min}分</span>
      </div>
      <div class="focus-bar"><span style="width:${Math.min(100, elapsedOf(t) / (plan.min * 60) * 100)}%" data-livebar="${t.id}"></span></div>
      <div class="focus-actions">
        <button type="button" class="btn-main" data-focus="timer" data-id="${t.id}">${on ? '■ ストップ' : t.done ? '▶ もう少しやる' : '▶ はじめる'}</button>
        ${plan.app ? `<button type="button" class="btn-sub" data-focus="app" data-id="${t.id}">${esc(plan.app.label)} ↗</button>` : ''}
      </div>`;
  };

  const renderTasks = () => {
    const day = ensureDay(today);
    $('#todayLabel').textContent = `${fmtJa(today)}の一手`;
    renderFocus(day);

    $('#tasks').innerHTML = day.tasks.map(t => {
      const plan = planFor(t.label);
      const picked = day.pick === t.id;
      const open = openId === t.id;
      const secs = elapsedOf(t);
      return `
      <li class="task${t.done ? ' done' : ''}${picked ? ' picked' : ''}${open ? ' open' : ''}${running() && running().id === t.id ? ' live' : ''}" data-id="${t.id}">
        <div class="task-row">
          <button class="check" type="button" data-act="check" aria-label="${esc(t.label)}を${t.done ? '未完了に戻す' : '完了にする'}" aria-pressed="${t.done}">${CHECK_SVG}</button>
          <button class="task-main" type="button" data-act="toggle" aria-expanded="${open}">
            <span class="task-icon hue-${plan.hue}">${esc(plan.icon)}</span>
            <span class="task-label">
              ${picked ? '<span class="task-tag">♜ 今日の一手</span>' : ''}
              <span class="task-text">${esc(t.label)}</span>
              <span class="task-sub">${secs >= 1 ? `<b data-live="${t.id}">${clock(secs)}</b> / ${plan.min}分` : `${esc(plan.first)} · ${plan.min}分`}</span>
            </span>
          </button>
          ${timerBtn(t, plan)}
        </div>
        <div class="task-plan">
          <ol class="plan-steps">${plan.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
          <div class="plan-actions">
            ${plan.app ? `<button type="button" class="chip-btn strong" data-act="app">${esc(plan.app.label)} ↗</button>` : ''}
            <button type="button" class="chip-btn" data-act="pick" aria-pressed="${picked}">${picked ? '♜ 今日の一手に選択中' : '♜ 今日の一手にする'}</button>
            <button type="button" class="chip-btn" data-act="plan">計画を書きかえる</button>
            ${secs >= 1 ? '<button type="button" class="chip-btn" data-act="reset">時間を0に戻す</button>' : ''}
            <button type="button" class="chip-btn ghost" data-act="del">今日は外す</button>
          </div>
        </div>
      </li>`;
    }).join('');

    const have = new Set(day.tasks.map(t => t.label));
    $('#quickAdd').innerHTML = QUICK.filter(q => !have.has(q)).map(q => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('');

    const yb = $('#yohakuBtn');
    yb.classList.toggle('on', !!day.yohaku);
    yb.setAttribute('aria-pressed', !!day.yohaku);
    $('#yohakuLabel').textContent = day.yohaku ? '今日は余白の日。ちゃんと前進にカウントしています' : '今日は余白の日にする（これも前進）';

    renderWall();
    renderHistory();
    renderHero();
    renderPill();
    hinata().heat({ done: day.tasks.filter(t => t.done).length, total: day.tasks.length, yohaku: day.yohaku, secs: daySecs(today) });
  };

  // 1秒ごとに動く部分だけ更新
  const tickLive = () => {
    const r = running();
    if (!r) return;
    const t = findTask(r.day, r.id);
    if (!t) { state.timer = null; save(); return; }
    const secs = elapsedOf(t);
    document.querySelectorAll(`[data-live="${t.id}"]`).forEach(el => { el.textContent = clock(secs); });
    const plan = planFor(t.label);
    const ratio = Math.min(1, secs / (plan.min * 60));
    document.querySelectorAll(`[data-livebar="${t.id}"]`).forEach(el => { el.style.width = ratio * 100 + '%'; });
    const ring = document.querySelector(`.task[data-id="${t.id}"] .ring-fg`);
    if (ring) ring.style.strokeDashoffset = RING_C * (1 - ratio);
    $('#pillTime').textContent = clock(secs);
    $('#heatTime').textContent = minutesJa(daySecs(today));
    if (!r.goalShown && secs >= plan.min * 60) {
      r.goalShown = true; save();
      sound('goal');
      hinata().say('timerGoal', { m: plan.min }, { mood: 'shock', big: true });
    }
  };

  const renderPill = () => {
    const r = running();
    const pill = $('#timerPill');
    const t = r && findTask(r.day, r.id);
    pill.classList.toggle('show', !!t);
    if (t) {
      $('#pillLabel').textContent = t.label;
      $('#pillTime').textContent = clock(elapsedOf(t));
    }
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
    let week = 0, weekSecs = 0;
    for (let i = 0; i < 7; i++) {
      const iso = addDays(today, -i);
      if (dayStatus(iso) !== 'none') week++;
      weekSecs += daySecs(iso);
    }
    $('#statStones').textContent = stones;
    $('#statStreak').textContent = streakOf();
    $('#statWeek').textContent = week;
    $('#weekTime').textContent = minutesJa(weekSecs);
  };

  const renderHistory = () => {
    const keys = Object.keys(state.days).filter(k => k < today).sort().reverse();
    $('#historyList').innerHTML = keys.length
      ? keys.slice(0, 60).map(k => {
          const d = state.days[k];
          const items = d.tasks.map(t => {
            const m = t.secs >= 60 ? `<small>${minutesJa(t.secs)}</small>` : '';
            return t.done ? `<b>${esc(t.label)}</b>${m}` : `<s>${esc(t.label)}</s>${m}`;
          }).join('・');
          const total = daySecs(k);
          return `<li><span class="h-date">${fmtJa(k)}</span>${d.yohaku ? '<span class="h-items">余白の日 ・ </span>' : ''}<span class="h-items">${items || '—'}</span>${total >= 60 ? `<span class="h-total">計 ${minutesJa(total)}</span>` : ''}</li>`;
        }).join('')
      : '<li>まだ昨日以前の記録はありません。明日になると、ここに今日の一手が並びます。</li>';
  };

  const doCheck = (day, t, el) => {
    const r = el.getBoundingClientRect();
    if (running() && running().id === t.id && !t.done) stopTimer(true);
    t.done = !t.done;
    save();
    renderTasks();
    if (t.done) celebrate(day, t, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    else { sound('uncheck'); hinata().say('undo', {}, {}); }
    if (navigator.vibrate) navigator.vibrate(t.done ? 14 : 6);
  };
  const doPick = (day, t) => {
    day.pick = day.pick === t.id ? null : t.id;
    save();
    renderTasks();
    if (day.pick) { sound('pick'); hinata().say('pick', { t: t.label }, { mood: 'joy' }); }
  };
  const doTimer = t => {
    if (running() && running().id === t.id) stopTimer();
    else startTimer(t);
    renderTasks();
  };

  $('#tasks').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    const li = e.target.closest('.task');
    if (!btn || !li) return;
    const day = ensureDay(today);
    const t = day.tasks.find(x => x.id === li.dataset.id);
    if (!t) return;
    const plan = planFor(t.label);
    switch (btn.dataset.act) {
      case 'check': doCheck(day, t, btn); break;
      case 'toggle': openId = openId === t.id ? null : t.id; sound('tap'); renderTasks(); break;
      case 'timer': doTimer(t); break;
      case 'pick': doPick(day, t); break;
      case 'app': if (plan.app) { if (!running() || running().id !== t.id) startTimer(t); renderTasks(); openApp(plan.app); } break;
      case 'plan': openPlanSheet(t.label); break;
      case 'reset':
        if (running() && running().id === t.id) state.timer = null;
        t.secs = 0; save(); renderTasks(); break;
      case 'del':
        if (running() && running().id === t.id) stopTimer(true);
        day.tasks = day.tasks.filter(x => x.id !== t.id);
        if (day.pick === t.id) day.pick = null;
        save(); renderTasks(); break;
    }
  });

  $('#focus').addEventListener('click', e => {
    const day = ensureDay(today);
    const p = e.target.closest('[data-pick]');
    if (p) { const t = day.tasks.find(x => x.id === p.dataset.pick); if (t) doPick(day, t); return; }
    const b = e.target.closest('[data-focus]');
    if (!b) return;
    const t = day.tasks.find(x => x.id === b.dataset.id);
    if (!t) return;
    if (b.dataset.focus === 'timer') doTimer(t);
    if (b.dataset.focus === 'app') {
      if (!running() || running().id !== t.id) startTimer(t);
      renderTasks();
      openApp(planFor(t.label).app);
    }
  });

  $('#pillStop').addEventListener('click', () => { stopTimer(); renderTasks(); });
  $('#pillJump').addEventListener('click', () => {
    const r = running();
    const el = r && document.querySelector(`.task[data-id="${r.id}"]`);
    (el || $('#today')).scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  const addTask = label => {
    label = label.trim();
    if (!label) return;
    const day = ensureDay(today);
    day.tasks.push({ id: uid(), label, done: false, secs: 0 });
    save();
    renderTasks();
    sound('pick');
    hinata().say('add', { t: label }, { mood: 'shock' });
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
    if (day.yohaku) { sound('pick'); hinata().say('yohaku', {}, { mood: 'joy' }); }
    else sound('tap');
  });

  // 計画の書きかえ
  const planSheet = $('#planSheet');
  let planLabel = null;
  const openPlanSheet = label => {
    planLabel = label;
    const p = planFor(label);
    $('#planName').textContent = label;
    $('#planFirst').value = p.first;
    $('#planMin').value = p.min;
    $('#planSteps').value = p.steps.join('\n');
    planSheet.showModal();
  };
  planSheet.addEventListener('close', () => {
    if (planSheet.returnValue === 'reset') { delete state.plans[planLabel]; save(); renderTasks(); return; }
    if (planSheet.returnValue !== 'save') return;
    const steps = $('#planSteps').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
    state.plans[planLabel] = {
      first: $('#planFirst').value.trim() || planFor(planLabel).first,
      min: Math.min(240, Math.max(1, parseInt($('#planMin').value, 10) || 15)),
      steps: steps.length ? steps : planFor(planLabel).steps,
    };
    save();
    renderTasks();
    hinata().say('planSaved', { t: planLabel }, { mood: 'joy' });
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
    hinata().say('templateSaved', {}, { mood: 'joy' });
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
      if (data.plans) state.plans = { ...data.plans, ...state.plans };
      save();
      renderTasks();
      hinata().say('imported', {}, { mood: 'joy' });
    } catch { hinata().say('importFail', {}, {}); }
    e.target.value = '';
  });

  // ---------- 音の設定 ----------
  const soundPanel = $('#soundPanel');
  const syncSoundUi = () => {
    const p = window.Sound ? window.Sound.prefs : { bgm: false, sfx: false, vol: .7 };
    $('#bgmToggle').checked = p.bgm;
    $('#sfxToggle').checked = p.sfx;
    $('#volRange').value = Math.round(p.vol * 100);
    document.querySelectorAll('[data-track]').forEach(b => b.setAttribute('aria-checked', b.dataset.track === (p.track || 'phonk')));
    $('#soundBtn').classList.toggle('muted', !p.bgm && !p.sfx);
    $('#soundBtn').classList.toggle('playing', p.bgm);
  };
  $('#soundBtn').addEventListener('click', e => {
    e.stopPropagation();
    soundPanel.classList.toggle('show');
    $('#soundBtn').setAttribute('aria-expanded', soundPanel.classList.contains('show'));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#soundPanel, #soundBtn')) soundPanel.classList.remove('show');
  });
  $('#bgmToggle').addEventListener('change', e => { window.Sound.setBgm(e.target.checked); syncSoundUi(); if (e.target.checked) hinata().say('bgmOn', {}, { mood: 'joy' }); });
  $('#sfxToggle').addEventListener('change', e => { window.Sound.setSfx(e.target.checked); syncSoundUi(); sound('check'); });
  $('#volRange').addEventListener('input', e => window.Sound.setVol(e.target.value / 100));
  document.querySelectorAll('[data-track]').forEach(b => b.addEventListener('click', () => {
    window.Sound.setTrack(b.dataset.track);
    syncSoundUi();
    sound('tap');
  }));
  syncSoundUi();

  // ---------- TOEIC ----------
  const renderToeic = () => {
    const days = dayDiff(today, '2027-01-24');
    $('#toeicDays').textContent = days > 0 ? days : days === 0 ? '今日' : '済';
    const now = Date.now();
    let next = null;
    const items = [...document.querySelectorAll('#toeicTimeline li')];
    items.forEach((li, i) => {
      const t = new Date(li.dataset.date).getTime();
      li.classList.remove('past', 'next');
      if (t + (i === items.length - 1 ? 864e5 : 0) < now) li.classList.add('past');
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
  const LANG = { it: 'イタリア語', en: '英語' };
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
    sound('tap');
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
  tabs.forEach(a => a.addEventListener('click', () => sound('tap')));

  // ---------- 日付が変わったら ----------
  const refreshAll = () => {
    renderHero(); renderQuote(); renderTasks(); renderToeic(); renderNews();
  };
  const checkDay = () => {
    const now = jstDate();
    if (now !== today) { today = now; refreshAll(); }
    else renderToeic();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    checkDay();
    renderNews();
    renderTasks();
    const r = running();
    const m = r ? Math.round(elapsedOf(findTask(r.day, r.id) || { secs: 0 }) / 60) : 0;
    if (m >= 1) hinata().say('welcomeBack', { m }, { mood: 'joy' });
  });
  setInterval(checkDay, 60 * 1000);
  setInterval(tickLive, 1000);

  buildSky();
  refreshAll();
  onScroll();
  setTimeout(greet, 1400);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
