(() => {
  'use strict';

  const STORE_KEY = 'saikyo.v1';
  const QUOTE_EPOCH = '2026-11-05';
  const DEFAULT_TEMPLATE = ['Duolingo', 'ピアノ', 'パソコン'];
  const QUICK = ['ジム', '勉強', '難しい本', '部屋の掃除', 'TOEIC'];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const sfx = n => window.Sound && window.Sound.sfx(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- アイコン ----------
  const SV = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
  const ICON = {
    duo: SV('<path d="M4 18l5-12 5 12M5.8 14h6.4"/><path d="M15 11c1-1 4-1 4 1v6M19 15c-2 0-4 .3-4 1.6S16 18 17 18s2-.6 2-1.5"/>'),
    piano: SV('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/>'),
    pc: SV('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
    gym: SV('<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'),
    study: SV('<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>'),
    book: SV('<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>'),
    clean: SV('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>'),
    toeic: SV('<path d="M5 6h14M12 6v13"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    castle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V10h2V7h2v3h2V5h2V3h2v2h2v5h2V7h2v3h2v11h-7v-4a2 2 0 0 0-4 0v4z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z"/></svg>',
    check: SV('<path d="M5 12.5l4.5 4.5L19 7.5"/>', ' stroke-width="3"'),
    timer: SV('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
    stone: '<svg viewBox="0 0 24 24"><path d="M4 14l3-8h10l3 8-8 6z" fill="#a77bff"/><path d="M7 6l5 14 5-14" fill="#c9adff"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#ff8a3d"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2.5 1.5-3 .2 1 .8 1.5 1.5 1.5 0-1.5-.5-2.5 0-3.5z" fill="#ffd27a"/></svg>',
    flameOff: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#ddd1c8"/></svg>',
    rest: '<svg viewBox="0 0 24 24"><path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z" fill="#e7a3c3"/></svg>',
    chest: '<svg viewBox="0 0 64 64"><rect x="8" y="26" width="48" height="30" rx="4" fill="#e09c12"/><path d="M8 30c0-12 10-18 24-18s24 6 24 18z" fill="#ffc23d"/><rect x="8" y="28" width="48" height="6" fill="#b87a0a"/><rect x="27" y="26" width="10" height="14" rx="2" fill="#fff3c4"/><circle cx="32" cy="33" r="2" fill="#b87a0a"/></svg>',
    chestOpen: '<svg viewBox="0 0 64 64"><path d="M10 10 L54 14 L52 28 L8 24z" fill="#ffc23d"/><rect x="8" y="28" width="48" height="28" rx="4" fill="#e09c12"/><path d="M14 30h36v6H14z" fill="#a77bff"/><circle cx="24" cy="30" r="5" fill="#c9adff"/><circle cx="38" cy="29" r="6" fill="#a77bff"/><path d="M32 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff3c4"/></svg>',
  };

  // ---------- 行動計画（「何を、どれくらい」） ----------
  const PLANS = {
    'Duolingo': { icon: 'duo', color: 'green', min: 10, first: 'アプリを開いて、レッスンを1つ',
      steps: ['アプリを開く', '今日のレッスンを1つ（約5分）', '余力があれば、もう1つか復習を1つ'],
      app: { label: 'Duolingoを開く', scheme: 'duolingo://', web: 'https://www.duolingo.com/learn' } },
    'ピアノ': { icon: 'piano', color: 'pink', min: 15, first: '鍵盤のふたを開けて、音階を3分',
      steps: ['指ならし：音階かハノンを3分', 'いまの曲を2小節ずつ、ゆっくり8分', '最後に、止まらず通して1回'] },
    'パソコン': { icon: 'pc', color: 'blue', min: 25, first: '「今日つくるもの」を1行メモする',
      steps: ['今日つくるものを1行で書く', 'タイマーを押して25分だけ集中', '終わったら、できたことを一言メモ'] },
    'ジム': { icon: 'gym', color: 'orange', min: 40, first: 'ウェアに着替えて、家を出る',
      steps: ['ウォームアップ5分', 'メインのメニュー30分', 'ストレッチ5分'] },
    '勉強': { icon: 'study', color: 'gold', min: 25, first: '机に1冊だけ出して、25分',
      steps: ['やる範囲を1つ決める', '25分集中', '5分休んで、続けるか決める'] },
    '難しい本': { icon: 'book', color: 'violet', min: 20, first: '本を開いて、まず5ページ',
      steps: ['しおりのページを開く', '10ページ（または20分）読む', '心に残った一文をメモ'] },
    '部屋の掃除': { icon: 'clean', color: 'green', min: 15, first: '机の上だけ、片づける',
      steps: ['机の上を片づける', '床のものを戻す', 'ゴミをまとめて出す'] },
    'TOEIC': { icon: 'toeic', color: 'orange', min: 20, first: 'Part 5 を10問だけ解く',
      steps: ['Part 5 を20問（約10分）', '間違えた問題の解説を読む', '新しい単語を10個'] },
  };
  const DEFAULT_PLAN = { icon: 'star', color: 'orange', min: 15, first: '15分だけ、手をつける', steps: ['タイマーを押す', '15分だけやる', '終わったら「できた！」'] };

  // ---------- 天才レベル ----------
  const LEVELS = [0, 0, 60, 300, 1000, 3000]; // 添字がレベル
  const RANK = ['', 'はじめの一歩', '努力家', '秀才', '天才', '最強の自分'];
  const levelOf = st => { let l = 1; LEVELS.forEach((v, i) => { if (i && st >= v) l = i; }); return l; };

  // ---------- ヒナタのことば ----------
  const LINES = {
    morning: ['おはよう！ 今日も最強の自分に一歩、行こう！', '朝日、見えた？ 光ってる丸から行こう！'],
    noon: ['こんにちは！ 一手だけでも、ちゃんと積めるよ！'],
    night: ['おかえり！ 寝る前の一手もアリだよ！', '今日もおつかれさま！ 余白の日でも前進だよ！'],
    streak: ['<b>{n}日</b>連続！？ ちょっと信じられない…！', '<b>{n}日</b>も積み続けてるの！？ もはや職人…！'],
    milestone: ['<b>{n}日</b>連続！？！？ 正気！？ 記念日にしよう！！'],
    pickFirst: ['今日の一手、どれにする？ 丸を押して<b>★</b>をつけてね'],
    pick: ['今日の一手は<b>{t}</b>！ もう勝ってる気がする！', '<b>{t}</b>に決めたのね…！ その目、本気だ…！'],
    start: ['よーい、どん！！ 「{t}」、見てるからね…！', 'スタート！ 今日のあなた、止まらない予感…！'],
    stop: ['<b>{m}分</b>も積んだの！？ えらすぎる…！', 'え、<b>{m}分</b>！？ その集中、分けてほしい…！'],
    stopShort: ['ちょっとでも前進！ その一歩が石になる！'],
    goal: ['え、もう<b>{m}分</b>！？ 目安クリアじゃん！！ 正気！？', '目安の<b>{m}分</b>、突破！！ 集中力どうなってるの！？'],
    app: ['いってらっしゃい！ 時間はこっちで測っておくね！'],
    back: ['おかえり！ いま<b>{m}分</b>！ まだ測ってるよ〜！'],
    next: ['次は<b>{t}</b>！ この勢いのまま行こう！', 'その調子！ 次は<b>{t}</b>、行っちゃう？'],
    allDone: ['今日の城、完成…！ 明日もここで待ってるね！'],
    undo: ['だいじょうぶ、またいつでも積める！'],
    add: ['<b>{t}</b>も足すの！？ 欲張りで最高！'],
    del: ['了解！ 今日は外しておくね'],
    yohaku: ['余白の日！ 休むのも一手、わかってる人だ…！'],
    yohakuOff: ['よし、今日も積みにいこう！'],
    castle: ['あと<b>{n}つ</b>で、今日の城が完成するよ！'],
    castleDone: ['今日の城、完成してる…！！ <b>伝説すぎる！！</b>'],
    stones: ['いま<b>{n}石</b>。積むほど天才レベルが上がって、最後は<b>最強の自分</b>！'],
    plan: ['<b>{t}</b>の作戦、決まった！ もう勝ち筋しか見えない！'],
    music: ['<b>{t}</b>、スタート！ 気合、入ってきた〜！'],
    musicOff: ['音楽ストップ！ 集中モードだね！'],
    zouzei: ['ZOUZEI PHONK、いってらっしゃい！ リピートにして戻ってきてね！'],
  };
  const pick1 = a => a[Math.floor(Math.random() * a.length)];
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => esc(v[k] ?? ''));

  // ---------- 日付（日本時間） ----------
  const jstDate = (d = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(d);
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00+09:00'); d.setUTCDate(d.getUTCDate() + n); return jstDate(d); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00+09:00') - new Date(a + 'T00:00:00+09:00')) / 864e5);
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const dow = iso => new Date(iso + 'T12:00:00+09:00').getUTCDay();
  const fmtJa = iso => { const d = new Date(iso + 'T12:00:00+09:00'); return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEK[d.getUTCDay()]}）`; };
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

  // ---------- 保存（前の版の記録をそのまま読む） ----------
  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); if (s && s.days) return s; } catch {}
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
      state.days[iso] = { tasks: state.template.map(label => ({ id: uid(), label, done: false, secs: 0 })), pick: null, yohaku: false, chest: false };
      save();
    }
    return state.days[iso];
  };
  const planFor = label => {
    const base = PLANS[label] || Object.entries(PLANS).find(([k]) => label.includes(k))?.[1] || DEFAULT_PLAN;
    const own = state.plans[label];
    return own ? { ...base, ...own } : base;
  };
  const colorVars = p => `--c:var(--${p.color});--cd:var(--${p.color}-d)`;
  const iconOf = p => ICON[p.icon] || ICON.star;

  // ---------- 記録からの数字 ----------
  const running = () => state.timer || null;
  const elapsedOf = (t, iso = today) => {
    const r = running();
    const live = r && r.id === t.id && r.day === iso ? (Date.now() - r.start) / 1000 : 0;
    return (t.secs || 0) + live;
  };
  const daySecs = iso => { const d = state.days[iso]; return d ? d.tasks.reduce((a, t) => a + elapsedOf(t, iso), 0) : 0; };
  const dayStatus = iso => {
    const d = state.days[iso];
    if (!d) return 'none';
    if (d.tasks.some(t => t.done)) return 'done';
    if (d.yohaku) return 'yohaku';
    return 'none';
  };
  const dayStones = d => {
    const done = d.tasks.filter(t => t.done);
    let s = done.length * 10;
    if (d.pick && done.some(t => t.id === d.pick)) s += 10;
    if (d.chest) s += 20;
    if (d.yohaku && !done.length) s += 5;
    return s;
  };
  const totalStones = () => Object.values(state.days).reduce((a, d) => a + dayStones(d), 0);
  const streakOf = () => {
    let k = 0;
    for (let i = dayStatus(today) === 'none' ? 1 : 0; ; i++) { if (dayStatus(addDays(today, -i)) === 'none') break; k++; }
    return k;
  };
  const quests = d => {
    const n = Math.max(1, Math.min(3, d.tasks.length));
    const p = d.tasks.find(t => t.id === d.pick);
    return [
      { icon: ICON.check, c: 'var(--green)', l: '#e6f8ef', title: `一手を${n}つ積む`, now: d.tasks.filter(t => t.done).length, goal: n },
      { icon: ICON.star, c: 'var(--gold-d)', l: '#fff4d6', title: p ? `今日の一手（${p.label}）をやりきる` : '今日の一手を選んで、やりきる', now: p && p.done ? 1 : 0, goal: 1 },
      { icon: ICON.timer, c: 'var(--blue)', l: '#e8f3ff', title: 'タイマーで合計15分', now: Math.floor(daySecs(today) / 60), goal: 15 },
    ];
  };

  // ---------- ヒナタ ----------
  const say = (key, vars = {}, wow = false, quiet = false) => {
    const lines = LINES[key];
    $('#say').innerHTML = fill(pick1(lines), vars);
    const svg = $('#hinataSvg');
    svg.querySelector('.eyes-normal').style.display = wow ? 'none' : '';
    svg.querySelector('.eyes-wow').style.display = wow ? '' : 'none';
    const c = $('#coach'); c.classList.remove('wow'); void c.offsetWidth; if (wow) c.classList.add('wow');
    if (!quiet) sfx('pop');
  };
  const bump = sel => { const el = $(sel); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

  // ---------- 描画：上のバー ----------
  const renderTop = () => {
    $('#streakNum').textContent = streakOf();
    $('#stoneNum').textContent = totalStones();
    $('#totalTime').textContent = minutesJa(daySecs(today)).replace(/^(\d+)秒$/, '0分');
    const r = running();
    const t = r && findTask(r.day, r.id);
    $('#liveBar').hidden = !t;
    if (t) { $('#liveLabel').textContent = `${t.label} 計測中`; $('#liveTime').textContent = clock(elapsedOf(t, r.day)); }
  };

  // ---------- 描画：天才レベル ----------
  const renderLevel = () => {
    const st = totalStones();
    const lv = levelOf(st);
    $('#todayDate').textContent = fmtJa(today);
    $$('#castleArt .part').forEach(p => p.classList.toggle('on', +p.dataset.lv <= lv));
    $('#lvTitle').innerHTML = `天才レベル ${lv}<br><span class="banner-rank">${RANK[lv]}</span>`;
    const next = LEVELS[lv + 1];
    if (next) {
      const prev = LEVELS[lv];
      $('#lvNext').textContent = `あと${next - st}石で「${RANK[lv + 1]}」`;
      $('#lvBar').style.width = ((st - prev) / (next - prev) * 100) + '%';
      $('#lvNum').textContent = `${st} / ${next}`;
    } else {
      $('#lvNext').textContent = '最強の自分に、なった。';
      $('#lvBar').style.width = '100%';
      $('#lvNum').textContent = st;
    }
  };

  // ---------- 描画：今日の道 ----------
  const XS = [50, 26, 70, 36, 64, 30, 58];
  const STEP_Y = 132, TOP_Y = 64;
  const renderPath = () => {
    const d = ensureDay(today);
    const ts = d.tasks;
    const cur = ts.find(t => !t.done && t.id === d.pick) || ts.find(t => !t.done);
    const doneN = ts.filter(t => t.done).length;
    $('#progress').textContent = `${doneN} / ${ts.length} できた`;
    const pts = ts.map((t, i) => [XS[i % XS.length], TOP_Y + i * STEP_Y]);
    const castle = [XS[ts.length % XS.length] === 50 ? 44 : 50, TOP_Y + ts.length * STEP_Y + 10];
    const H = castle[1] + 110;
    $('#path').style.height = H + 'px';
    const all = [...pts, castle];
    const dpath = all.map((p, i) => (i ? 'L' : 'M') + p[0] * 4 + ' ' + p[1]).join(' ');
    let html = `<svg class="path-line" viewBox="0 0 400 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${dpath}" fill="none" stroke="#efe2d8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 22"/></svg>`;
    const r = running();
    ts.forEach((t, i) => {
      const [x, y] = pts[i];
      const p = planFor(t.label);
      const live = r && r.id === t.id;
      const st = t.done ? 'done' : t === cur ? 'current' : 'todo';
      html += `<button class="node ${st}${live ? ' live' : ''}" type="button" data-id="${t.id}" style="left:${x}%;top:${y}px;${colorVars(p)}" aria-label="${esc(t.label)}${t.done ? '（できた）' : ''}">${iconOf(p)}${t.id === d.pick && !t.done ? `<span class="pick" title="今日の一手">${ICON.star}</span>` : ''}</button>`;
      const sub = t.done ? 'できた' : live ? '計測中' : elapsedOf(t) >= 60 ? `${Math.floor(elapsedOf(t) / 60)} / ${p.min}分` : `${p.min}分`;
      html += `<div class="node-label" style="left:${x}%;top:${y + 50}px">${esc(t.label)}<small>${sub}</small></div>`;
      if (t === cur && !live) html += x > 50
        ? `<div class="tip left" style="left:calc(${x}% - 62px);top:${y}px">ここから！</div>`
        : `<div class="tip" style="left:calc(${x}% + 62px);top:${y}px">ここから！</div>`;
    });
    const complete = ts.length && !cur;
    const cls = complete ? '' : d.yohaku && !doneN ? ' yohaku' : ' locked';
    html += `<button class="node castle-node${cls}" type="button" data-id="castle" style="left:${castle[0]}%;top:${castle[1]}px" aria-label="今日の城">${d.yohaku && !doneN ? ICON.moon : ICON.castle}</button>`;
    html += `<div class="node-label" style="left:${castle[0]}%;top:${castle[1] + 58}px">今日の城<small>${complete ? '完成！' : d.yohaku && !doneN ? '余白の日' : `あと${ts.length - doneN}つで完成`}</small></div>`;
    $('#path').innerHTML = html;
    const yb = $('#yohakuBtn');
    yb.classList.toggle('on', !!d.yohaku);
    yb.textContent = d.yohaku ? '余白の日（前進カウント中）' : '余白の日にする';
  };
  const floatAt = (id, text) => {
    const el = $(`.node[data-id="${id}"]`);
    if (!el) return;
    const f = document.createElement('div');
    f.className = 'float';
    f.style.left = el.style.left; f.style.top = (parseFloat(el.style.top) - 20) + 'px';
    f.textContent = text;
    $('#path').appendChild(f);
    setTimeout(() => f.remove(), 1500);
  };

  // ---------- 描画：クエスト・炎 ----------
  const renderQuests = () => {
    const d = ensureDay(today);
    const qs = quests(d);
    const cleared = qs.filter(q => q.now >= q.goal).length;
    $('#questCount').textContent = `${cleared} / ${qs.length} クリア`;
    const ready = cleared === qs.length && !d.chest;
    $('#quests').innerHTML = qs.map(q => `
      <div class="quest${q.now >= q.goal ? ' clear' : ''}" style="--qc:${q.c};--qc-l:${q.l}">
        <span class="q-icon">${q.icon}</span>
        <div>
          <p class="q-title">${esc(q.title)}<span>${Math.min(q.now, q.goal)} / ${q.goal}</span></p>
          <div class="q-bar"><i style="width:${Math.min(100, q.now / q.goal * 100)}%"></i></div>
        </div>
      </div>`).join('') + `
      <button type="button" class="chest-row${ready ? ' ready' : ''}${d.chest ? ' opened' : ''}" id="chest"${ready ? '' : ' aria-disabled="true"'}>
        ${d.chest ? ICON.chestOpen : ICON.chest}
        <p>${d.chest ? '宝箱をあけた！ 石+20' : ready ? '宝箱をあけられる！ タップ' : '3つともクリアで、宝箱'}<small>${d.chest ? 'また明日、新しいクエストが届きます' : '中身は 石+20'}</small></p>
      </button>`;
  };
  const renderWeek = () => {
    const back = (dow(today) + 6) % 7; // 月曜はじまり
    const mon = addDays(today, -back);
    let lit = 0;
    $('#week').innerHTML = ['月', '火', '水', '木', '金', '土', '日'].map((w, i) => {
      const iso = addDays(mon, i);
      const st = iso > today ? 'none' : dayStatus(iso);
      if (st !== 'none') lit++;
      return `<div class="day${st === 'done' ? ' lit' : st === 'yohaku' ? ' rest' : ''}${iso === today ? ' today' : ''}">${w}<i>${st === 'done' ? ICON.flame : st === 'yohaku' ? ICON.rest : ICON.flameOff}</i></div>`;
    }).join('');
    $('#weekNote').textContent = dayStatus(today) !== 'none' ? `今日の炎も灯った！ 今週 ${lit}日目` : 'ひとつ積むと、今日の炎が灯る';
  };

  // ---------- 描画：名言 ----------
  const renderQuote = () => {
    const list = window.QUOTES || [];
    if (!list.length) return;
    const n = dayDiff(QUOTE_EPOCH, today);
    const q = list[((n % list.length) + list.length) % list.length];
    $('#quoteText').textContent = q.t;
    $('#quoteJa').textContent = q.ja || '';
    $('#quoteBy').textContent = '— ' + q.a;
  };

  const renderToday = () => { renderTop(); renderLevel(); renderPath(); renderQuests(); renderWeek(); };

  // ---------- 作戦シート ----------
  let sheetTask = null;
  const findTask = (iso, id) => state.days[iso] && state.days[iso].tasks.find(t => t.id === id);
  const openSheet = el => {
    $$('.sheet.show').forEach(s => s.classList.remove('show'));
    $('#scrim').classList.add('show');
    el.classList.add('show');
  };
  const closeSheets = () => { $$('.sheet.show').forEach(s => s.classList.remove('show')); $('#scrim').classList.remove('show'); sheetTask = null; };
  const openTask = t => {
    sheetTask = t;
    const p = planFor(t.label);
    const d = ensureDay(today);
    const sh = $('#taskSheet');
    sh.setAttribute('style', colorVars(p));
    $('#sheetIcon').innerHTML = iconOf(p);
    $('#sheetTitle').textContent = t.label;
    $('#sheetFirst').textContent = 'まず：' + p.first;
    $('#sheetReward').textContent = t.done ? 'もう積んだ一手' : d.pick === t.id ? 'できたら 石+20（今日の一手）' : 'できたら 石+10';
    $('#sheetGoal').textContent = `目安 ${p.min}分`;
    $('#sheetSteps').innerHTML = p.steps.map((s, i) => `<li><span>${i + 1}</span>${esc(s)}</li>`).join('');
    $('#pickBtn').setAttribute('aria-pressed', d.pick === t.id);
    $('#appBtn').hidden = !p.app;
    $('#appBtn').textContent = p.app ? p.app.label : '';
    $('#doneBtn').textContent = t.done ? 'できたを取り消す' : 'できた！';
    $('#doneBtn').classList.toggle('ghost', t.done);
    $('#doneBtn').classList.toggle('green', !t.done);
    $('#sheetRow').classList.toggle('one', !p.app);
    $('#resetBtn').hidden = elapsedOf(t) < 1;
    tickSheet();
    openSheet(sh);
    sfx('tap');
  };
  const tickSheet = () => {
    const t = sheetTask;
    if (!t) return;
    const s = elapsedOf(t);
    const p = planFor(t.label);
    $('#sheetTime').textContent = clock(s);
    $('#sheetBar').style.width = Math.min(100, s / (p.min * 60) * 100) + '%';
    const on = running() && running().id === t.id;
    $('#startBtn').textContent = on ? '■ ストップ' : t.done ? '▶ もう少しやる' : s >= 1 ? '▶ つづける' : '▶ はじめる';
  };

  // ---------- タイマー ----------
  const startTimer = t => {
    if (running()) stopTimer(true);
    state.timer = { day: today, id: t.id, start: Date.now(), goalShown: elapsedOf(t) >= planFor(t.label).min * 60 };
    save();
    sfx('start');
    say('start', { t: t.label });
  };
  const stopTimer = (quiet = false) => {
    const r = running();
    if (!r) return null;
    const t = findTask(r.day, r.id);
    const add = (Date.now() - r.start) / 1000;
    state.timer = null;
    if (t) t.secs = (t.secs || 0) + add;
    save();
    if (!quiet && t) {
      sfx('stop');
      if (t.secs >= planFor(t.label).min * 60 && !t.done && r.day === today) { markDone(t); return t; }
      if (add >= 60) say('stop', { m: Math.round(add / 60) }, true); else say('stopShort');
    }
    return t;
  };
  const tick = () => {
    const r = running();
    if (r) {
      const t = findTask(r.day, r.id);
      if (!t) { state.timer = null; save(); renderToday(); return; }
      const p = planFor(t.label);
      if (!r.goalShown && elapsedOf(t, r.day) >= p.min * 60) {
        r.goalShown = true; save();
        sfx('goal');
        say('goal', { m: p.min }, true);
      }
      renderTop();
      if (Math.floor(Date.now() / 1000) % 15 === 0) { renderQuests(); renderPath(); }
    }
    tickSheet();
  };

  // ---------- できた！ ----------
  const showResult = ({ title, lead, gain, big }) => {
    const h = $('#resultHinata');
    h.innerHTML = $('#hinataSvg').innerHTML;
    h.querySelector('.eyes-normal').style.display = 'none';
    h.querySelector('.eyes-wow').style.display = '';
    $('#resultTitle').textContent = title;
    $('#resultLead').textContent = lead;
    $('#rsStone').innerHTML = `${ICON.stone}+${gain}`;
    $('#rsTime').textContent = minutesJa(daySecs(today)).replace(/^(\d+)秒$/, '0分');
    $('#rsStreak').innerHTML = `${ICON.flame}${streakOf()}日`;
    $('#result').classList.add('show');
    sfx(big ? 'fanfare' : 'goal');
    if (big) confetti();
    if (navigator.vibrate) navigator.vibrate(big ? [20, 40, 20] : 14);
  };
  const markDone = t => {
    const d = ensureDay(today);
    if (running() && running().id === t.id) stopTimer(true);
    const before = totalStones();
    const firstToday = dayStatus(today) !== 'done';
    t.done = true;
    save();
    closeSheets();
    const gain = totalStones() - before;
    const levelUp = levelOf(totalStones()) > levelOf(before);
    renderToday();
    floatAt(t.id, `+${gain}石`);
    bump('#statStones');
    if (firstToday) bump('#statStreak');
    sfx('check');
    const n = d.tasks.filter(x => x.done).length;
    setTimeout(() => {
      const lv = levelOf(totalStones());
      if (levelUp) showResult({ title: `天才レベル ${lv}！`, lead: lv === 5 ? 'ついに「最強の自分」に…！ え、正気！？ 伝説だよ！！' : `「${RANK[lv]}」になった…！ え、こんなに積めたの？ 正気！？`, gain, big: true });
      else if (n === d.tasks.length && n > 1) showResult({ title: '今日の城、完成！', lead: '全部やりきった…！ え、こんなにできたの？ 正気？？', gain, big: true });
      else if (d.pick === t.id) showResult({ title: '今日の一手、やりきった！', lead: '有言実行の人だ…！ 城の人たちがざわついてます', gain, big: true });
      else showResult({ title: firstToday ? '今日の炎、点灯！' : `${t.label}、できた！`, lead: n === 2 ? '2つ目！？ え、正気？？ 天才では？' : n >= 3 ? `${n}つ目！？ 今日のあなた、伝説すぎる…！` : 'その一歩が、最強の自分への石になる！', gain, big: firstToday });
    }, 600);
  };
  $('#resultBtn').addEventListener('click', () => {
    $('#result').classList.remove('show');
    renderToday();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const d = ensureDay(today);
    const next = d.tasks.find(t => !t.done);
    setTimeout(() => next ? say('next', { t: next.label }) : say('allDone', {}, true), 300);
  });

  const confetti = () => {
    const colors = ['#ff8a3d', '#3ccf8e', '#ff6b98', '#4aa8ff', '#ffc23d', '#a77bff'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--x', (Math.random() - .5) * 200 + 'px');
      c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      c.style.setProperty('--t', (1.6 + Math.random() * 1.4) + 's');
      c.style.animationDelay = Math.random() * .3 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3400);
    }
  };

  // ---------- 外のアプリを開く ----------
  const openOutside = (scheme, web) => {
    let left = false;
    const onHide = () => { if (document.hidden) left = true; };
    document.addEventListener('visibilitychange', onHide);
    window.location.href = scheme;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      if (!left) window.open(web, '_blank', 'noopener');
    }, 1500);
  };

  // ---------- 操作：今日の道 ----------
  $('#path').addEventListener('click', e => {
    const b = e.target.closest('.node');
    if (!b) return;
    const d = ensureDay(today);
    if (b.dataset.id === 'castle') {
      const left = d.tasks.filter(t => !t.done).length;
      if (d.tasks.length && !left) say('castleDone', {}, true); else say('castle', { n: left });
      return;
    }
    const t = d.tasks.find(x => x.id === b.dataset.id);
    if (t) openTask(t);
  });
  $('#scrim').addEventListener('click', closeSheets);
  $$('.grab').forEach(g => g.addEventListener('click', closeSheets));

  $('#startBtn').addEventListener('click', () => {
    const t = sheetTask;
    if (!t) return;
    if (running() && running().id === t.id) stopTimer(); else startTimer(t);
    renderToday();
    if (sheetTask) tickSheet();
  });
  $('#appBtn').addEventListener('click', () => {
    const t = sheetTask;
    const p = t && planFor(t.label);
    if (!p || !p.app) return;
    if (!running() || running().id !== t.id) startTimer(t);
    renderToday();
    say('app');
    openOutside(p.app.scheme, p.app.web);
  });
  $('#doneBtn').addEventListener('click', () => {
    const t = sheetTask;
    if (!t) return;
    if (t.done) {
      t.done = false; save(); closeSheets(); renderToday();
      sfx('uncheck'); say('undo');
    } else markDone(t);
  });
  $('#pickBtn').addEventListener('click', () => {
    const t = sheetTask;
    const d = ensureDay(today);
    d.pick = d.pick === t.id ? null : t.id;
    save();
    $('#pickBtn').setAttribute('aria-pressed', d.pick === t.id);
    $('#sheetReward').textContent = t.done ? 'もう積んだ一手' : d.pick === t.id ? 'できたら 石+20（今日の一手）' : 'できたら 石+10';
    renderToday();
    if (d.pick) { sfx('pick'); say('pick', { t: t.label }); }
  });
  $('#resetBtn').addEventListener('click', () => {
    const t = sheetTask;
    if (running() && running().id === t.id) state.timer = null;
    t.secs = 0; save(); renderToday(); openTask(t);
  });
  $('#delBtn').addEventListener('click', () => {
    const t = sheetTask;
    const d = ensureDay(today);
    if (running() && running().id === t.id) stopTimer(true);
    d.tasks = d.tasks.filter(x => x.id !== t.id);
    if (d.pick === t.id) d.pick = null;
    save(); closeSheets(); renderToday(); say('del');
  });
  $('#liveStop').addEventListener('click', () => { stopTimer(); renderToday(); });
  $('#liveJump').addEventListener('click', () => {
    const r = running();
    const t = r && findTask(r.day, r.id);
    if (!t) return;
    go('today');
    if (r.day === today) openTask(t);
  });

  // 作戦の書きかえ
  let planLabel = null;
  $('#planBtn').addEventListener('click', () => {
    planLabel = sheetTask.label;
    const p = planFor(planLabel);
    $('#planTitle').textContent = `「${planLabel}」の作戦`;
    $('#planFirst').value = p.first;
    $('#planMin').value = p.min;
    $('#planSteps').value = p.steps.join('\n');
    openSheet($('#planSheet'));
  });
  $('#planCancel').addEventListener('click', closeSheets);
  $('#planReset').addEventListener('click', () => { delete state.plans[planLabel]; save(); closeSheets(); renderToday(); });
  $('#planSave').addEventListener('click', () => {
    const steps = $('#planSteps').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
    const base = planFor(planLabel);
    state.plans[planLabel] = {
      first: $('#planFirst').value.trim() || base.first,
      min: Math.min(240, Math.max(1, parseInt($('#planMin').value, 10) || base.min)),
      steps: steps.length ? steps : base.steps,
    };
    save(); closeSheets(); renderToday();
    say('plan', { t: planLabel });
  });

  // 一手を足す
  $('#addBtn').addEventListener('click', () => {
    const have = new Set(ensureDay(today).tasks.map(t => t.label));
    $('#quickAdd').innerHTML = QUICK.filter(q => !have.has(q)).map(q => { const p = planFor(q); return `<button type="button" data-q="${esc(q)}" style="${colorVars(p)}"><i>${iconOf(p)}</i>${esc(q)}</button>`; }).join('');
    $$('#quickAdd i svg').forEach(s => { s.style.width = '18px'; s.style.height = '18px'; });
    $('#addInput').value = '';
    openSheet($('#addSheet'));
  });
  const addTask = label => {
    label = label.trim();
    if (!label) return;
    ensureDay(today).tasks.push({ id: uid(), label, done: false, secs: 0 });
    save(); closeSheets(); renderToday();
    sfx('pick'); say('add', { t: label }, true);
  };
  $('#quickAdd').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) addTask(b.dataset.q); });
  $('#addForm').addEventListener('submit', e => { e.preventDefault(); addTask($('#addInput').value); });

  // 余白の日
  $('#yohakuBtn').addEventListener('click', () => {
    const d = ensureDay(today);
    d.yohaku = !d.yohaku;
    save(); renderToday();
    if (d.yohaku) { sfx('pick'); say('yohaku', {}, true); } else { sfx('tap'); say('yohakuOff'); }
  });

  // 宝箱
  $('#quests').addEventListener('click', e => {
    if (!e.target.closest('#chest.ready')) return;
    const d = ensureDay(today);
    const before = totalStones();
    d.chest = true; save();
    renderToday();
    bump('#statStones');
    const lv = levelOf(totalStones());
    showResult(lv > levelOf(before)
      ? { title: `天才レベル ${lv}！`, lead: `宝箱で「${RANK[lv]}」に…！ 今日のあなた、止まらない！`, gain: 20, big: true }
      : { title: '宝箱をあけた！', lead: 'クエスト全部クリア…！ 今日のあなた、止まらない！', gain: 20, big: true });
  });

  $('#statStreak').addEventListener('click', () => say('streak', { n: streakOf() }, true));
  $('#statStones').addEventListener('click', () => say('stones', { n: totalStones() }));

  // ---------- 音 ----------
  const ZOUZEI_APP = 'music://music.apple.com/jp/album/zouzei-phonk/6770631134?i=6770631505';
  const ZOUZEI_WEB = 'https://music.apple.com/jp/album/zouzei-phonk/6770631134?i=6770631505';
  const TRACK_NAME = { phonk: 'オリジナル・フォンク', sunrise: '朝焼けポップ' };
  const syncMusic = () => {
    const S = window.Sound;
    const playing = S && S.prefs.bgm;
    const tr = S ? S.prefs.track : null;
    $$('[data-music]').forEach(b => b.classList.toggle('on', !!playing && b.dataset.music === tr));
    $('#musicBtn').classList.toggle('on', !!playing);
    $('#musicBtn').setAttribute('aria-pressed', !!playing);
    if (S) { $('#sfxToggle').checked = S.prefs.sfx; $('#volRange').value = Math.round(S.prefs.vol * 100); }
  };
  $('#musicBtn').addEventListener('click', () => { syncMusic(); openSheet($('#musicSheet')); sfx('tap'); });
  $('#musicSheet').addEventListener('click', e => {
    const b = e.target.closest('[data-music]');
    if (!b || !window.Sound) return;
    const m = b.dataset.music;
    if (m === 'zouzei') {
      window.Sound.setBgm(false);
      syncMusic(); closeSheets();
      say('zouzei');
      openOutside(ZOUZEI_APP, ZOUZEI_WEB);
      return;
    }
    if (window.Sound.prefs.bgm && window.Sound.prefs.track === m) { window.Sound.setBgm(false); say('musicOff'); }
    else { window.Sound.setTrack(m); window.Sound.setBgm(true); say('music', { t: TRACK_NAME[m] }); }
    syncMusic();
  });
  $('#musicStop').addEventListener('click', () => { if (window.Sound) window.Sound.setBgm(false); syncMusic(); closeSheets(); });
  $('#sfxToggle').addEventListener('change', e => { window.Sound.setSfx(e.target.checked); sfx('check'); });
  $('#volRange').addEventListener('input', e => window.Sound.setVol(e.target.value / 100));

  // ---------- 挑戦 ----------
  const renderGoal = () => {
    const days = dayDiff(today, '2027-01-24');
    $('#toeicDays').textContent = days > 0 ? days : days === 0 ? '今日' : '済';
    const now = Date.now();
    let next = null;
    const items = $$('#toeicTimeline li');
    items.forEach((li, i) => {
      const t = new Date(li.dataset.date).getTime();
      li.classList.remove('past', 'next');
      if (t + (i === items.length - 1 ? 864e5 : 0) < now) li.classList.add('past');
      else if (!next) { next = li; li.classList.add('next'); }
    });
    const open = new Date('2026-11-11T00:00:00+09:00').getTime();
    const close = new Date('2026-12-09T15:00:00+09:00').getTime();
    let msg = '';
    if (now < open) msg = `申込開始まで あと${dayDiff(today, '2026-11-11')}日。11月11日になったら申し込もう`;
    else if (now < close) msg = `申込受付中。締切は12月9日 15:00（あと${Math.max(0, dayDiff(today, '2026-12-09'))}日）`;
    else if (days > 0) msg = '申込期間は終わりました。あとは当日まで積むだけ';
    $('#toeicNext').textContent = msg;
  };

  // ---------- 便り ----------
  const CAT = { game: 'ゲーム', ent: 'エンタメ', europe: 'ヨーロッパ' };
  const LANG = { it: 'イタリア語', en: '英語' };
  let newsFilter = 'all';
  const applyFilter = () => $$('.news-item').forEach(li => li.classList.toggle('hide', newsFilter !== 'all' && li.dataset.cat !== newsFilter));
  const renderNews = async () => {
    const ul = $('#newsList');
    try {
      const r = await fetch('data/news.json?d=' + today + '-' + Math.floor(Date.now() / 36e5), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      $('#newsDate').textContent = `${fmtJa(data.date)}の便り${data.date !== today ? '（今朝の分は準備中）' : ''}・${data.items.length}本`;
      ul.innerHTML = data.items.map(n => `
        <li class="news-item" data-cat="${esc(n.cat)}">
          <a href="${esc(n.link)}" target="_blank" rel="noopener">
            <span class="news-meta"><span class="news-cat">${CAT[n.cat] || ''}</span><span>${esc(n.source)}</span>${LANG[n.lang] ? `<span class="news-lang">${LANG[n.lang]}</span>` : ''}</span>
            <p class="news-title">${esc(n.title)}</p>
            <p class="news-desc">${esc(n.desc || '')}</p>
          </a>
        </li>`).join('');
      applyFilter();
    } catch {
      ul.innerHTML = '<li class="empty">いまは便りを取りに行けませんでした。電波のよいところで開き直してみてください</li>';
    }
  };
  $('#newsFilter').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    newsFilter = b.dataset.cat;
    $$('#newsFilter button').forEach(x => x.classList.toggle('on', x === b));
    applyFilter(); sfx('tap');
  });

  // ---------- わたし ----------
  const renderMe = () => {
    const st = totalStones();
    const lv = levelOf(st);
    $('#meRank').innerHTML = `天才レベル ${lv}「${RANK[lv]}」<small>めざすは、最強の自分</small>`;
    $('#meStones').textContent = st;
    $('#meStreak').textContent = streakOf();
    let w = 0; for (let i = 0; i < 7; i++) w += daySecs(addDays(today, -i));
    $('#meWeek').textContent = minutesJa(w);
    $('#ranks').innerHTML = RANK.slice(1).map((name, i) => {
      const l = i + 1;
      return `<li class="rank-row${l <= lv ? ' got' : ''}${l === lv ? ' now' : ''}"><i>${l}</i><span>${name}</span><small>${LEVELS[l]}石</small></li>`;
    }).join('');
    const keys = Object.keys(state.days).filter(k => k < today).sort().reverse();
    $('#historyList').innerHTML = keys.length
      ? keys.slice(0, 60).map(k => {
          const d = state.days[k];
          const items = d.tasks.map(t => {
            const m = t.secs >= 60 ? ` ${minutesJa(t.secs)}` : '';
            return t.done ? `<b>${esc(t.label)}</b>${m}` : `<s>${esc(t.label)}</s>`;
          }).join('・');
          return `<li><span class="h-date">${fmtJa(k)}<small>+${dayStones(d)}石</small></span><span class="h-items">${d.yohaku ? '余白の日・' : ''}${items || '—'}</span></li>`;
        }).join('')
      : '<li>昨日より前の記録は、まだありません。明日になると、ここに今日の一手が並びます</li>';
  };
  $('#editTemplate').addEventListener('click', () => { $('#templateText').value = state.template.join('\n'); openSheet($('#templateSheet')); });
  $('#tplCancel').addEventListener('click', closeSheets);
  $('#tplSave').addEventListener('click', () => {
    const list = $('#templateText').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 7);
    state.template = list.length ? list : DEFAULT_TEMPLATE.slice();
    save(); closeSheets();
  });
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
      save(); renderAll();
    } catch {}
    e.target.value = '';
  });

  // ---------- タブ ----------
  const VIEWS = ['today', 'goal', 'news', 'me'];
  const go = v => {
    if (!VIEWS.includes(v)) v = 'today';
    $$('.view').forEach(el => { el.hidden = el.dataset.view !== v; });
    $$('.tab').forEach(a => a.classList.toggle('on', a.dataset.tab === v));
    if (v === 'goal') renderGoal();
    if (v === 'news') renderNews();
    if (v === 'me') renderMe();
    if (v === 'today') renderToday();
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
    window.scrollTo(0, 0);
  };
  $$('.tab').forEach(a => a.addEventListener('click', e => { e.preventDefault(); sfx('tap'); go(a.dataset.tab); }));
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  // ---------- あいさつ ----------
  const greet = () => {
    const k = streakOf();
    const d = ensureDay(today);
    if ([3, 7, 14, 21, 30, 50, 100].includes(k) && dayStatus(today) === 'none') return say('milestone', { n: k }, true, true);
    if (k >= 2) return say('streak', { n: k }, true, true);
    if (!d.pick && !d.tasks.some(t => t.done)) return say('pickFirst', {}, false, true);
    const h = +new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false }).format(new Date());
    say(h >= 4 && h < 11 ? 'morning' : h >= 11 && h < 18 ? 'noon' : 'night', {}, false, true);
  };

  // ---------- 日付が変わったら・戻ってきたら ----------
  const renderAll = () => { renderToday(); renderQuote(); if (!$('#view-me').hidden) renderMe(); if (!$('#view-goal').hidden) renderGoal(); };
  const checkDay = () => { const now = jstDate(); if (now !== today) { today = now; renderAll(); greet(); } };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    checkDay();
    renderToday();
    const r = running();
    const t = r && findTask(r.day, r.id);
    const m = t ? Math.round(elapsedOf(t, r.day) / 60) : 0;
    if (m >= 1) say('back', { m });
  });
  setInterval(checkDay, 60 * 1000);
  setInterval(tick, 1000);

  ensureDay(today);
  renderQuote();
  go(location.hash.slice(1) || 'today');
  greet();
  syncMusic();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
