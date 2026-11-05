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
  Object.assign(PLANS, {
    'ゲーム制作': { icon: 'pc', color: 'violet', min: 25, first: '今日つくる場面を1つ決める', steps: ['作る場面かバグを1つ決める', '25分だけ手を動かす', '動いたところを1行メモ'] },
    'イタリア語': { icon: 'duo', color: 'green', min: 10, first: 'Duolingoでイタリア語を1レッスン', steps: ['Duolingoでイタリア語を1レッスン', '便りのイタリア語の見出しを1本読む', '覚えた単語を1つ声に出す'],
      app: { label: 'Duolingoを開く', scheme: 'duolingo://', web: 'https://www.duolingo.com/learn' } },
    '旅の下調べ': { icon: 'star', color: 'blue', min: 15, first: '行きたい街を1つ決める', steps: ['行きたい街を1つ決める', 'その街の写真と行き方を調べる', '「いつか行く」メモに足す'] },
    'ワインの下調べ': { icon: 'book', color: 'pink', min: 15, first: 'ワインエキスパートの試験日を調べる', steps: ['試験日と申込期間を調べる', '必要な勉強の量を調べる', '始める時期を決める'] },
    '英検': { icon: 'study', color: 'blue', min: 20, first: '英検準1級の試験日を調べる', steps: ['次の試験日と申込期間を調べる', '過去問を1セット眺める', '単語を10個'] },
    '1曲仕上げ': { icon: 'piano', color: 'pink', min: 20, first: '仕上げたい1曲を決める', steps: ['仕上げたい1曲を決める', '難しい4小節だけ練習', 'スマホで1回録音してみる'] },
    'note': { icon: 'study', color: 'gold', min: 25, first: '書きたいことを3行メモ', steps: ['書きたいことを3行メモ', '見出しを決めて下書き', '読み返して公開か保存'] },
    'カラオケ練習': { icon: 'piano', color: 'green', min: 15, first: '十八番の1曲を決める', steps: ['十八番を1曲決める', '原曲を聴きながら一緒に歌う', '外しやすいところを3回'] },
    'ヴァイオリン': { icon: 'piano', color: 'violet', min: 15, first: '弓を張って、開放弦を1分', steps: ['開放弦でまっすぐ弾く1分', '音階をゆっくり', '曲を少しずつ'] },
  });
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
    order: ['順番、決まった！ 上から順に、積んでいこう！'],
    already: ['<b>{t}</b>は、もう今日の道にあるよ！ 丸を押してね'],
    ms: ['<b>{t}</b>、達成！？ この日までに、ちゃんと積めてる…！'],
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
    if (secs < 1) return '0分';
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
    let base = PLANS[label] || Object.entries(PLANS).find(([k]) => label.includes(k))?.[1] || DEFAULT_PLAN;
    if (base === PLANS.TOEIC && typeof PHASES !== 'undefined') {
      const ph = PHASES.find(p => today >= p.from && today <= p.to) || PHASES[0];
      const steps = ph.items.filter(x => !/申し?込/.test(x));
      if (steps.length) base = { ...base, first: steps[0], steps };
    }
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
    $('#toeicMsBtn').hidden = !/TOEIC/i.test(t.label);
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
  $('#toeicMsBtn').addEventListener('click', () => {
    closeSheets(); go('goal');
    setTimeout(() => $('#milestones').scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
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

  // 並べかえ
  const renderOrder = movedId => {
    const ts = ensureDay(today).tasks;
    $('#orderList').innerHTML = ts.map((t, i) => {
      const p = planFor(t.label);
      return `<li class="order-row${t.id === movedId ? ' moved' : ''}" data-id="${t.id}" style="${colorVars(p)}">
        <span class="o-ico">${iconOf(p)}</span>
        <b>${esc(t.label)}<small>${i + 1}番目${t.done ? '・できた' : ''}</small></b>
        <button class="o-btn" type="button" data-dir="-1" aria-label="${esc(t.label)}を上へ"${i === 0 ? ' disabled' : ''}>▲</button>
        <button class="o-btn" type="button" data-dir="1" aria-label="${esc(t.label)}を下へ"${i === ts.length - 1 ? ' disabled' : ''}>▼</button>
      </li>`;
    }).join('');
  };
  $('#orderBtn').addEventListener('click', () => { renderOrder(); $('#orderTpl').checked = false; openSheet($('#orderSheet')); sfx('tap'); });
  $('#orderList').addEventListener('click', e => {
    const b = e.target.closest('.o-btn');
    if (!b) return;
    const ts = ensureDay(today).tasks;
    const id = b.closest('.order-row').dataset.id;
    const i = ts.findIndex(t => t.id === id);
    const j = i + +b.dataset.dir;
    if (j < 0 || j >= ts.length) return;
    [ts[i], ts[j]] = [ts[j], ts[i]];
    save();
    renderOrder(id);
    sfx('tap');
  });
  $('#orderDone').addEventListener('click', () => {
    if ($('#orderTpl').checked) {
      const order = ensureDay(today).tasks.map(t => t.label);
      state.template = [...order.filter(l => state.template.includes(l)), ...state.template.filter(l => !order.includes(l))];
      save();
    }
    closeSheets();
    renderToday();
    say('order');
  });

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
    const ext = S && S.external;
    const playing = S && (S.prefs.bgm || ext);
    const tr = ext ? 'zouzei' : S ? S.prefs.track : null;
    $$('[data-music]').forEach(b => b.classList.toggle('on', !!playing && b.dataset.music === tr));
    $('#musicBtn').classList.toggle('on', !!playing);
    $('#musicBtn').setAttribute('aria-pressed', !!playing);
    $('#extNote').hidden = !ext;
    if (S) { $('#sfxToggle').checked = S.prefs.sfx && !ext; $('#sfxToggle').disabled = !!ext; $('#volRange').value = Math.round(S.prefs.vol * 100); }
  };
  $('#musicBtn').addEventListener('click', () => { syncMusic(); openSheet($('#musicSheet')); sfx('tap'); });
  $('#musicSheet').addEventListener('click', e => {
    const b = e.target.closest('[data-music]');
    if (!b || !window.Sound) return;
    const m = b.dataset.music;
    if (m === 'zouzei') {
      window.Sound.setExternal(true);
      syncMusic(); closeSheets();
      say('zouzei');
      openOutside(ZOUZEI_APP, ZOUZEI_WEB);
      return;
    }
    if (window.Sound.prefs.bgm && window.Sound.prefs.track === m) { window.Sound.setBgm(false); say('musicOff'); }
    else { window.Sound.setTrack(m); window.Sound.setBgm(true); say('music', { t: TRACK_NAME[m] }); }
    syncMusic();
  });
  $('#musicStop').addEventListener('click', () => {
    if (window.Sound) { window.Sound.setBgm(false); if (window.Sound.external) window.Sound.setExternal(false); }
    syncMusic(); closeSheets();
  });
  $('#sfxToggle').addEventListener('change', e => { window.Sound.setSfx(e.target.checked); sfx('check'); });
  $('#volRange').addEventListener('input', e => window.Sound.setVol(e.target.value / 100));

  // ---------- 詳しく見る・その場で登録 ----------
  let infoActs = [];
  const openInfo = ({ icon = ICON.star, color = 'orange', title, sub = '', body = '', actions = [] }) => {
    const sh = $('#infoSheet');
    sh.setAttribute('style', `--c:var(--${color});--cd:var(--${color}-d)`);
    $('#infoIcon').innerHTML = icon;
    $('#infoTitle').textContent = title;
    $('#infoSub').textContent = sub;
    $('#infoBody').innerHTML = body;
    infoActs = actions;
    $('#infoActions').innerHTML = actions.map((a, i) => `<button class="btn${a.ghost ? ' ghost' : ''}${a.green ? ' green' : ''}" type="button" data-i="${i}">${esc(a.label)}</button>`).join('');
    openSheet(sh);
    sfx('tap');
  };
  $('#infoActions').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) infoActs[+b.dataset.i].fn(); });
  const hasToday = label => ensureDay(today).tasks.some(t => t.label === label);
  const addToToday = label => {
    if (hasToday(label)) { closeSheets(); go('today'); say('already', { t: label }); return; }
    ensureDay(today).tasks.push({ id: uid(), label, done: false, secs: 0 });
    save(); closeSheets(); go('today');
    sfx('pick'); say('add', { t: label }, true);
  };
  const addAct = label => ({ label: hasToday(label) ? `「${label}」は今日の道にあります` : `今日の道に「${label}」を足す`, fn: () => addToToday(label) });
  const stepsHtml = (steps, okCount = 0) => `<ol>${steps.map((x, i) => `<li${i < okCount ? ' class="ok"' : ''}><span>${i < okCount ? '✓' : i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol>`;

  // ---------- 記録の集計 ----------
  const timeByLabel = () => {
    const m = {};
    Object.entries(state.days).forEach(([iso, d]) => d.tasks.forEach(t => { m[t.label] = (m[t.label] || 0) + elapsedOf(t, iso); }));
    return m;
  };
  const timeMatching = re => Object.entries(timeByLabel()).reduce((a, [k, v]) => a + (re.test(k) ? v : 0), 0);
  const countLast7 = re => { let n = 0; for (let i = 0; i < 7; i++) { const d = state.days[addDays(today, -i)]; if (d && d.tasks.some(t => t.done && re.test(t.label))) n++; } return n; };
  const bestStreak = () => {
    const keys = Object.keys(state.days).sort();
    if (!keys.length) return 0;
    let best = 0, cur = 0, prev = null;
    keys.forEach(k => {
      if (dayStatus(k) === 'none') { cur = 0; prev = k; return; }
      cur = prev && dayDiff(prev, k) === 1 && dayStatus(prev) !== 'none' ? cur + 1 : 1;
      best = Math.max(best, cur); prev = k;
    });
    return best;
  };

  // ---------- 挑戦 ----------
  const PHASES = [
    { title: '申し込んで、毎日少しずつ', from: '2026-11-05', to: '2026-11-30', items: ['11月11日になったら申し込む', 'Part 5 を毎日10問', '単語を毎日10個'] },
    { title: '基礎を固める', from: '2026-12-01', to: '2026-12-27', items: ['12月9日 15:00 までに申込を済ませる', 'Part 5・6 を毎日20問', 'Part 2 を毎日10問'] },
    { title: '本番形式で演習', from: '2026-12-28', to: '2027-01-17', items: ['模試を週1回（2時間通して）', '間違えたPartを集中して復習', 'Part 7 を毎日1セット'] },
    { title: '直前の仕上げ', from: '2027-01-18', to: '2027-01-23', items: ['本番と同じ時間帯に模試を1回', '新しいことはしない', '前の日は早く寝る'] },
    { title: '本番', from: '2027-01-24', to: '2027-01-24', items: ['いつもの朝ごはん', '受験票と写真付きの身分証', 'ここまで積んだ石を信じる'] },
  ];
  // TOEIC：この日までに、ここまで
  const OFFICIAL = 'https://www.iibc-global.org/toeic/test/lr/guide01/schedule.html';
  const MILESTONES = [
    { id: 'apply', date: '2026-11-11', title: '申し込む', type: 'check', how: '公式サイトから申し込む。申込期間は12月9日 15:00まで', link: OFFICIAL },
    { id: 'base', date: '2026-11-20', title: '模試を1回解いて、今の点数を知る', type: 'check', how: 'リスニングとリーディングを通しで1回。今の点数が分かれば、どこを伸ばすか決まる' },
    { id: 'p5a', date: '2026-11-30', title: 'Part 5 を合計200問', type: 'count', goal: 200, step: 10, unit: '問', how: '1日10問なら20日。間違えた問題は解説まで読む' },
    { id: 'words', date: '2026-12-09', title: '単語を合計300個', type: 'count', goal: 300, step: 10, unit: '個', how: '1日10個なら30日。覚えた単語は、例文ごと声に出す' },
    { id: 'check', date: '2026-12-09', title: '申込が済んでいるか確かめる（15:00締切）', type: 'check', how: '申込完了のメールか、マイページで確かめる', link: OFFICIAL },
    { id: 'p2', date: '2026-12-27', title: 'Part 2 を合計200問', type: 'count', goal: 200, step: 10, unit: '問', how: '1日10問。聞き取れなかった問題は、スクリプトを見てもう一度聞く' },
    { id: 'p56', date: '2026-12-27', title: 'Part 5・6 を合計500問', type: 'count', goal: 500, step: 20, unit: '問', how: '1日20問。苦手な文法をメモしておく' },
    { id: 'mock2', date: '2027-01-10', title: '模試を2回、通しで解く', type: 'count', goal: 2, step: 1, unit: '回', how: '2時間通しで。時間配分（Part 7 に75分）を体で覚える' },
    { id: 'p7', date: '2027-01-17', title: 'Part 7 を合計15セット', type: 'count', goal: 15, step: 1, unit: 'セット', how: '1日1セット。時間を測って解く' },
    { id: 'mock3', date: '2027-01-20', title: '本番と同じ時間帯に、模試をもう1回', type: 'check', how: '本番は午後。同じ時間に通して解いて、体を慣らす' },
    { id: 'review', date: '2027-01-23', title: '間違いノートを見直す', type: 'check', how: '新しいことはしない。これまで間違えたところだけ' },
    { id: 'exam', date: '2027-01-24', title: '本番で 700点', type: 'check', how: '受験票と写真付きの身分証。ここまで積んだ石を信じる' },
  ];
  state.toeic = state.toeic || {};
  const msState = id => (state.toeic[id] = state.toeic[id] || { n: 0, done: false });
  const msDone = m => m.type === 'count' ? msState(m.id).n >= m.goal : msState(m.id).done;
  const daysLeft = iso => dayDiff(today, iso);
  const whenText = iso => { const n = daysLeft(iso); return n > 0 ? `あと${n}日` : n === 0 ? '今日まで' : `${-n}日すぎた`; };
  const nextMilestone = () => MILESTONES.find(m => !msDone(m));
  const renderMilestones = () => {
    const nx = nextMilestone();
    const doneN = MILESTONES.filter(msDone).length;
    $('#msCount').textContent = `${doneN} / ${MILESTONES.length} 達成`;
    $('#msBar').style.width = (doneN / MILESTONES.length * 100) + '%';
    $('#msLabel').textContent = doneN === MILESTONES.length ? 'ぜんぶ達成！' : `次は ${md(nx.date)}`;
    $('#milestones').innerHTML = MILESTONES.map(m => {
      const st = msState(m.id);
      const ok = msDone(m);
      const d = new Date(m.date + 'T12:00:00+09:00');
      const prog = m.type === 'count' ? `<div class="ms-bar"><i style="width:${Math.min(100, st.n / m.goal * 100)}%"></i></div>` : '';
      const act = m.type === 'count' ? (ok ? '✓' : `+${m.step}`) : '✓';
      return `<li class="ms${ok ? ' done' : ''}${m === nx ? ' next' : ''}${daysLeft(m.date) < 0 ? ' late' : ''}" data-ms="${m.id}">
        <span class="ms-date">${d.getUTCMonth() + 1}月<strong>${d.getUTCDate()}日</strong></span>
        <span class="ms-main tap"><b>${esc(m.title)}</b><small class="when">${ok ? '達成！' : whenText(m.date)}${m.type === 'count' ? `・${st.n} / ${m.goal}${m.unit}` : ''}</small>${prog}</span>
        <button class="ms-act" type="button" data-act="${m.id}" aria-label="${esc(m.title)}を記録">${act}</button>
      </li>`;
    }).join('');
    const tn = $('#thNext');
    if (nx) {
      const d = new Date(nx.date + 'T12:00:00+09:00');
      tn.hidden = false;
      tn.innerHTML = `<span class="tn-date">${d.getUTCMonth() + 1}月<strong>${d.getUTCDate()}日</strong></span><span><small>次の目標・${whenText(nx.date)}</small><b>${esc(nx.title)}</b></span>`;
      tn.dataset.ms = nx.id;
    } else tn.hidden = true;
  };
  const msAdd = (m, delta) => {
    const st = msState(m.id);
    const was = msDone(m);
    if (m.type === 'count') st.n = Math.max(0, st.n + delta); else st.done = delta > 0;
    save();
    renderMilestones();
    if (!was && msDone(m)) { sfx('fanfare'); confetti(); say('ms', { t: m.title }, true); }
    else sfx(delta > 0 ? 'check' : 'uncheck');
  };
  const openMilestone = m => {
    const st = msState(m.id);
    const ok = msDone(m);
    const body = `<div class="ib-box"><b>${md(m.date)} までに・${ok ? '達成！' : whenText(m.date)}</b>${esc(m.how)}</div>` +
      (m.type === 'count' ? `<div class="counter"><button class="minus" type="button" data-d="-${m.step}">−${m.step}</button><b id="ctrNum">${st.n}<small>/ ${m.goal}${m.unit}</small></b><button type="button" data-d="${m.step}">+${m.step}</button></div>` : '');
    const acts = [];
    if (m.type === 'check') acts.push({ label: ok ? '達成を取り消す' : 'できた！（達成）', green: !ok, ghost: ok, fn: () => { msAdd(m, ok ? -1 : 1); openMilestone(m); } });
    if (m.link) acts.push({ label: '公式サイトを開く ↗', ghost: true, fn: () => window.open(m.link, '_blank', 'noopener') });
    if (!['apply', 'check', 'exam'].includes(m.id)) acts.push(addAct('TOEIC'));
    openInfo({ icon: ICON.toeic, color: 'orange', title: m.title, sub: 'TOEIC・この日までに、ここまで', body, actions: acts });
    $$('#infoBody .counter button').forEach(b => b.addEventListener('click', () => { msAdd(m, +b.dataset.d); $('#ctrNum').innerHTML = `${msState(m.id).n}<small>/ ${m.goal}${m.unit}</small>`; }));
  };
  $('#milestones').addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    const li = e.target.closest('.ms');
    if (!li) return;
    const m = MILESTONES.find(x => x.id === li.dataset.ms);
    if (act) { if (m.type === 'count') msAdd(m, m.step); else msAdd(m, msDone(m) ? -1 : 1); return; }
    openMilestone(m);
  });
  $('#thNext').addEventListener('click', () => { const m = MILESTONES.find(x => x.id === $('#thNext').dataset.ms); if (m) openMilestone(m); });

  const md = iso => { const d = new Date(iso + 'T12:00:00+09:00'); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
  const GOALS = [
    { task: 'TOEIC', steps: ['1月24日に700点', '次の公開テストで800点', '900点を超える'], icon: 'A+', c: 'orange', title: 'TOEIC 900超え', sub: 'まずは700、その先へ', next: 'まず1月24日に700点。取れたら、次は800点を目標に',
      stats: () => [`TOEIC 累計 ${minutesJa(timeMatching(/TOEIC/i))}`, `試験まで ${Math.max(0, dayDiff(today, '2027-01-24'))}日`] },
    { task: '英検', steps: ['TOEIC 700', '英検準1級', 'イタリア語の検定', 'ワインエキスパート'], icon: '◆', c: 'violet', title: '資格をたくさん', sub: '転職でも困らないほどに', next: '順番の案：TOEIC 700 → 英検準1級 → イタリア語の検定 → ワインエキスパート',
      stats: () => ['いま挑戦中：TOEIC', `Duolingo 累計 ${minutesJa(timeMatching(/Duolingo/i))}`] },
    { task: '1曲仕上げ', steps: ['仕上げたい1曲を決める', '難しい4小節から練習', '通して弾けたら録音', 'ヴァイオリンも始める'], icon: '♪', c: 'pink', title: 'ピアノとヴァイオリン', sub: '上級者レベルまで', next: 'まずピアノで1曲を仕上げて、録音して残す',
      stats: () => [`ピアノ 累計 ${minutesJa(timeMatching(/ピアノ/))}`, `この7日で ${countLast7(/ピアノ/)}日`] },
    { task: 'ジム', steps: ['ジムを週2回', '行けた日は炎を灯す', '1か月続いたら、自分にごほうび'], icon: '✦', c: 'pink', title: '今よりきれいに', sub: 'やせて、可愛くなって、モテたい', next: 'ジムを週2回。行けた週は、今週の炎がもっと明るくなる',
      stats: () => [`この7日のジム ${countLast7(/ジム/)}回`] },
    { task: 'ゲーム制作', steps: ['作りたい場面を1つ完成させる', '友だちに遊んでもらう', '感想をもらって直す', '公開する'], icon: '♛', c: 'gold', title: '誇れることを作る', sub: '特別な人と知り合う・海外で特別なことをする', next: 'ゲームを完成させて、誰かに遊んでもらう（いつかやりたい棚から）',
      stats: () => [`パソコン 累計 ${minutesJa(timeMatching(/パソコン/))}`] },
    { task: 'カラオケ練習', steps: ['十八番を1曲決める', 'その曲で90点', 'レパートリーを3曲に増やす'], icon: '90', c: 'green', title: 'カラオケで毎回90点', sub: 'いつ歌っても、90点を超える', next: '十八番を1曲決めて、音程バーを見ながら練習する',
      stats: () => [] },
  ];
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
    if (now < open) { $('#applyTitle').textContent = `申込開始まで あと${dayDiff(today, '2026-11-11')}日`; $('#applySub').textContent = '11月11日になったら、公式サイトから申し込もう'; }
    else if (now < close) { $('#applyTitle').textContent = `申込受付中・締切まで あと${Math.max(0, dayDiff(today, '2026-12-09'))}日`; $('#applySub').textContent = '締切は12月9日 15:00'; }
    else { $('#applyTitle').textContent = '申込期間は終わりました'; $('#applySub').textContent = 'あとは当日まで、積むだけ'; }
    let nowIdx = PHASES.findIndex(p => today >= p.from && today <= p.to);
    if (nowIdx < 0) nowIdx = today < PHASES[0].from ? 0 : PHASES.length;
    $('#phaseNow').textContent = nowIdx < PHASES.length ? `いまは ${nowIdx + 1}つ目` : 'おつかれさま';
    $('#phases').innerHTML = PHASES.map((p, i) => `
      <li class="phase${i === nowIdx ? ' now' : i < nowIdx ? ' past' : ''}" data-ph="${i}">
        <span class="ph-no">${i < nowIdx ? '✓' : i + 1}</span>
        <h3>${p.title}<small>${p.from === p.to ? md(p.from) : `${md(p.from)}〜${md(p.to)}`}</small></h3>
        <ul>${p.items.map(x => `<li>${x}</li>`).join('')}</ul>
        <span class="ph-more">押すと、くわしく</span>
      </li>`).join('');
    renderMilestones();
    $('#toeicTime').textContent = minutesJa(timeMatching(/TOEIC/i)).replace(/^(\d+)秒$/, '0分');
    const has = ensureDay(today).tasks.some(t => /TOEIC/i.test(t.label));
    $('#addToeic').textContent = has ? '今日の道へ行く' : '今日の道に TOEIC を足す';
    $('#goalList').innerHTML = GOALS.map((g, gi) => {
      const st = g.stats();
      return `<li class="goal-item tap" data-goal="${gi}" style="--c:var(--${g.c});--cd:var(--${g.c}-d)">
        <div class="gi-head"><span class="gi-ico">${g.icon}</span><div><h3>${g.title}</h3><p>${g.sub}</p></div></div>
        <div class="gi-next"><b>次の一歩</b>${g.next}</div>
        ${st.length ? `<div class="gi-stats">${st.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        <span class="gi-cta">押すと、道のりと「今日の道に足す」 ›</span>
      </li>`;
    }).join('');
  };
  $('#goalList').addEventListener('click', e => {
    const li = e.target.closest('[data-goal]');
    if (!li) return;
    const g = GOALS[+li.dataset.goal];
    const st = g.stats();
    openInfo({ icon: `<b style="font-size:20px">${g.icon}</b>`, color: g.c, title: g.title, sub: g.sub,
      body: `<div class="ib-box"><b>次の一歩</b>${esc(g.next)}</div><p>ここまでの道のり</p>${stepsHtml(g.steps, g.task === 'TOEIC' && MILESTONES.find(m => m.id === 'exam') && msDone(MILESTONES.find(m => m.id === 'exam')) ? 1 : 0)}${st.length ? `<div class="gi-stats">${st.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}`,
      actions: [addAct(g.task)] });
  });
  $('#phases').addEventListener('click', e => {
    const li = e.target.closest('[data-ph]');
    if (!li) return;
    const p = PHASES[+li.dataset.ph];
    const related = MILESTONES.filter(m => m.date >= p.from && m.date <= p.to);
    openInfo({ icon: ICON.toeic, color: 'orange', title: p.title, sub: `${md(p.from)}〜${md(p.to)} の毎日のペース`,
      body: `<p>毎日やること</p>${stepsHtml(p.items)}${related.length ? `<div class="ib-box"><b>この時期の締切</b>${related.map(m => `${md(m.date)}　${esc(m.title)}${msDone(m) ? '（達成）' : ''}`).join('<br>')}</div>` : ''}`,
      actions: [addAct('TOEIC')] });
  });
  $('#addToeic').addEventListener('click', () => {
    const d = ensureDay(today);
    if (!d.tasks.some(t => /TOEIC/i.test(t.label))) { d.tasks.push({ id: uid(), label: 'TOEIC', done: false, secs: 0 }); save(); go('today'); say('add', { t: 'TOEIC' }, true); }
    else go('today');
  });

  // ---------- 便り ----------
  const CAT = { game: 'ゲーム', ent: 'エンタメ', europe: 'ヨーロッパ' };
  const LANG = { it: 'イタリア語', en: '英語' };
  let newsFilter = 'all';
  const READ_KEY = 'saikyo.read';
  const readSet = () => { try { const r = JSON.parse(localStorage.getItem(READ_KEY)); return new Set(r && r.date === today ? r.links : []); } catch { return new Set(); } };
  const markRead = link => { const s = readSet(); s.add(link); try { localStorage.setItem(READ_KEY, JSON.stringify({ date: today, links: [...s] })); } catch {} };
  const renderReadMeter = () => {
    const links = $$('.news-item a').map(a => a.getAttribute('href'));
    const r = readSet();
    const n = links.filter(l => r.has(l)).length;
    $('#readNum').textContent = `${n} / ${links.length}`;
    $('#readBar').style.width = links.length ? (n / links.length * 100) + '%' : '0';
    $$('.news-item').forEach(li => li.classList.toggle('read', r.has(li.querySelector('a').getAttribute('href'))));
  };
  const applyFilter = () => $$('.news-item').forEach(li => li.classList.toggle('hide', newsFilter !== 'all' && li.dataset.cat !== newsFilter));
  const renderNews = async () => {
    const ul = $('#newsList');
    try {
      const r = await fetch('data/news.json?d=' + today + '-' + Math.floor(Date.now() / 36e5), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      $('#newsDate').textContent = `${fmtJa(data.date)}の便り${data.date !== today ? '（今朝の分は準備中）' : ''}・${data.items.length}本`;
      ul.innerHTML = data.items.map((n, i) => {
        const body = `
            <span class="news-meta"><span class="news-cat">${CAT[n.cat] || ''}</span><span>${esc(n.source)}</span>${LANG[n.lang] ? `<span class="news-lang">${LANG[n.lang]}</span>` : ''}</span>
            <p class="news-title">${esc(n.title)}</p>
            <p class="news-desc">${esc(n.desc || '')}</p>
            ${n.lang === 'it' ? '<p class="news-it-hint">イタリア語のまま、見出しだけ読んでみよう</p>' : ''}`;
        return `
        <li class="news-item${i === 0 ? ' feature' : ''}" data-cat="${esc(n.cat)}">
          <a href="${esc(n.link)}" target="_blank" rel="noopener">${i === 0 ? `<div class="nf-band"></div><div class="nf-body">${body}</div>` : body}</a>
        </li>`;
      }).join('');
      applyFilter();
      renderReadMeter();
    } catch {
      ul.innerHTML = '<li class="empty">いまは便りを取りに行けませんでした。電波のよいところで開き直してみてください</li>';
    }
  };
  $('#newsList').addEventListener('click', e => {
    const a = e.target.closest('.news-item a');
    if (!a) return;
    markRead(a.getAttribute('href'));
    setTimeout(renderReadMeter, 300);
    sfx('tap');
  });
  $('#newsFilter').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    newsFilter = b.dataset.cat;
    $$('#newsFilter button').forEach(x => x.classList.toggle('on', x === b));
    applyFilter(); sfx('tap');
  });

  // ---------- わたし ----------
  const BADGES = [
    { ico: '一', c: 'orange', name: 'はじめの一手', how: '一手を1つ積む', ok: () => Object.values(state.days).some(d => d.tasks.some(t => t.done)) },
    { ico: '★', c: 'gold', name: '有言実行', how: '今日の一手をやりきる', ok: () => Object.values(state.days).some(d => d.pick && d.tasks.some(t => t.done && t.id === d.pick)) },
    { ico: '♜', c: 'violet', name: '城の完成', how: '1日の一手を全部やる', ok: () => Object.values(state.days).some(d => d.tasks.length > 1 && d.tasks.every(t => t.done)) },
    { ico: '宝', c: 'gold', name: '宝箱ハンター', how: 'クエストを全部クリア', ok: () => Object.values(state.days).some(d => d.chest) },
    { ico: '☾', c: 'pink', name: '余白も前進', how: '余白の日を使う', ok: () => Object.values(state.days).some(d => d.yohaku) },
    { ico: '3', c: 'orange', name: '3日の炎', how: '3日続ける', ok: () => bestStreak() >= 3, prog: () => `最長 ${bestStreak()}日 / 3日` },
    { ico: '7', c: 'orange', name: '1週間の炎', how: '7日続ける', ok: () => bestStreak() >= 7, prog: () => `最長 ${bestStreak()}日 / 7日` },
    { ico: '30', c: 'orange', name: '1か月の炎', how: '30日続ける', ok: () => bestStreak() >= 30, prog: () => `最長 ${bestStreak()}日 / 30日` },
    { ico: '1h', c: 'blue', name: '1時間', how: '合計1時間 積む', ok: () => totalTime() >= 3600, prog: () => `${minutesJa(totalTime())} / 1時間` },
    { ico: '10h', c: 'blue', name: '10時間', how: '合計10時間 積む', ok: () => totalTime() >= 36000, prog: () => `${minutesJa(totalTime())} / 10時間` },
    { ico: '50h', c: 'blue', name: '50時間', how: '合計50時間 積む', ok: () => totalTime() >= 180000, prog: () => `${minutesJa(totalTime())} / 50時間` },
    { ico: '努', c: 'green', name: '努力家', how: '天才レベル2（60石）', ok: () => levelOf(totalStones()) >= 2, prog: () => `${totalStones()}石 / 60石` },
    { ico: '秀', c: 'green', name: '秀才', how: '天才レベル3（300石）', ok: () => levelOf(totalStones()) >= 3, prog: () => `${totalStones()}石 / 300石` },
    { ico: '天', c: 'violet', name: '天才', how: '天才レベル4（1000石）', ok: () => levelOf(totalStones()) >= 4, prog: () => `${totalStones()}石 / 1000石` },
    { ico: '最', c: 'pink', name: '最強の自分', how: '天才レベル5（3000石）', ok: () => levelOf(totalStones()) >= 5, prog: () => `${totalStones()}石 / 3000石` },
  ];
  const MOOD = [
    { label: 'ジム' }, { label: 'ピアノ練習', task: 'ピアノ' }, { label: '勉強' }, { label: '難しい本を読む', task: '難しい本' }, { label: '部屋の掃除' },
    { label: 'パソコン作業', task: 'パソコン', note: 'スタバなど外でやると尚よい', wide: true },
  ];
  const SHELF = [
    { label: 'ゲームを完成させて誰かに遊んでもらう', c: 'violet', task: 'ゲーム制作', steps: ['作りたい場面を1つ完成させる', '友だちに遊んでもらう', '感想をもらって直す'] },
    { label: 'イタリア語を検定まで', c: 'green', task: 'イタリア語', steps: ['Duolingoでイタリア語を毎日', '検定の級と日程を調べる', '過去問を1回解いてみる'] },
    { label: 'ヨーロッパに数ヶ月滞在', c: 'blue', task: '旅の下調べ', steps: ['住んでみたい街を3つ選ぶ', '滞在の方法を調べる', 'いつ行けるか、ざっくり決める'] },
    { label: 'ワインの資格（ワインエキスパートなど）', c: 'pink', task: 'ワインの下調べ', steps: ['試験日と申込期間を調べる', '勉強の量を調べる', '始める時期を決める'] },
    { label: '英検準1級', c: 'orange', task: '英検', steps: ['試験日と申込期間を調べる', '過去問を1セット眺める', 'TOEICの後に始めるか決める'] },
    { label: 'ピアノで仕上げた1曲を残せる形にする', c: 'violet', task: '1曲仕上げ', steps: ['仕上げたい1曲を決める', '難しい4小節から練習', 'スマホで録音して残す'] },
    { label: 'noteを続けて「この人の文章」と覚えてもらう', c: 'gold', task: 'note', steps: ['書きたいことを3行メモ', '週に1本、書いて出す', '同じテーマで続ける'] },
  ];
  const renderLists = () => {
    $('#mood').innerHTML = MOOD.map((m, i) => { const p = planFor(m.task || m.label); return `<li class="tap${m.wide ? ' wide' : ''}${hasToday(m.task || m.label) ? ' added' : ''}" data-mood="${i}" style="${colorVars(p)}"><i>${iconOf(p)}</i><span>${m.label}${m.note ? `<small>${m.note}</small>` : ''}</span></li>`; }).join('');
    $('#shelf').innerHTML = SHELF.map((x, i) => `<li class="tap" data-shelf="${i}" style="--c:var(--${x.c})">${esc(x.label)}</li>`).join('');
  };
  $('#mood').addEventListener('click', e => {
    const li = e.target.closest('[data-mood]');
    if (!li) return;
    const m = MOOD[+li.dataset.mood];
    const label = m.task || m.label;
    const p = planFor(label);
    openInfo({ icon: iconOf(p), color: p.color, title: m.label, sub: '気分が上がること',
      body: `<div class="ib-box"><b>まずやること</b>${esc(p.first)}</div>${stepsHtml(p.steps)}<p>目安 ${p.min}分${m.note ? `・${esc(m.note)}` : ''}</p>`,
      actions: [addAct(label)] });
  });
  $('#shelf').addEventListener('click', e => {
    const li = e.target.closest('[data-shelf]');
    if (!li) return;
    const x = SHELF[+li.dataset.shelf];
    openInfo({ icon: ICON.star, color: x.c, title: x.label, sub: 'いつかやりたい棚・約束じゃなくてアイデア',
      body: `<p>小さな一歩から</p>${stepsHtml(x.steps)}<div class="ib-box"><b>今日できること</b>${esc(planFor(x.task).first)}（目安 ${planFor(x.task).min}分）</div>`,
      actions: [addAct(x.task)] });
  });
  $('#badges').addEventListener('click', e => {
    const li = e.target.closest('[data-badge]');
    if (!li) return;
    const b = BADGES[+li.dataset.badge];
    const ok = b.ok();
    openInfo({ icon: `<b style="font-size:20px">${ok ? b.ico : '?'}</b>`, color: ok ? b.c : 'gray', title: b.name, sub: ok ? '取った！' : 'まだ。でも、すぐそこ',
      body: `<div class="ib-box"><b>取り方</b>${esc(b.how)}</div>${b.prog ? `<p>いま：${esc(b.prog())}</p>` : ''}`,
      actions: [{ label: 'とじる', ghost: true, fn: closeSheets }] });
  });
  $('#heatmap').addEventListener('click', e => {
    const c = e.target.closest('[data-day]');
    if (!c) return;
    const iso = c.dataset.day;
    const d = state.days[iso];
    const rows = d ? d.tasks.map(t => { const p = planFor(t.label); return `<li class="${t.done ? '' : 'not'}" style="${colorVars(p)}"><span class="dr-ico">${iconOf(p)}</span><span>${esc(t.label)}${t.done ? '' : '（まだ）'}</span><small>${elapsedOf(t, iso) >= 1 ? minutesJa(elapsedOf(t, iso)) : ''}</small></li>`; }).join('') : '';
    openInfo({ icon: ICON.flame, color: 'orange', title: fmtJa(iso), sub: d ? `+${dayStones(d)}石・${minutesJa(daySecs(iso))}${d.yohaku ? '・余白の日' : ''}` : '記録なし',
      body: d ? `<ul class="day-rec">${rows || '<li>一手なし</li>'}</ul>` : '<p>この日の記録はありません</p>',
      actions: iso === today ? [{ label: '今日の道へ', fn: () => { closeSheets(); go('today'); } }] : [{ label: 'とじる', ghost: true, fn: closeSheets }] });
  });
  $('#timeBars').addEventListener('click', e => {
    const li = e.target.closest('[data-label]');
    if (!li) return;
    const label = li.dataset.label;
    const p = planFor(label);
    let days = 0, w = 0;
    Object.entries(state.days).forEach(([iso, d]) => d.tasks.forEach(t => { if (t.label === label && t.done) days++; if (t.label === label && dayDiff(iso, today) < 7) w += elapsedOf(t, iso); }));
    openInfo({ icon: iconOf(p), color: p.color, title: label, sub: `これまで ${minutesJa(timeByLabel()[label] || 0)}`,
      body: `<div class="gi-stats"><span>できた日 ${days}日</span><span>この7日 ${minutesJa(w)}</span><span>目安 ${p.min}分/回</span></div>`,
      actions: [addAct(label)] });
  });
  const totalTime = () => Object.keys(state.days).reduce((a, k) => a + daySecs(k), 0);
  const renderMe = () => {
    const st = totalStones();
    const lv = levelOf(st);
    const h = $('#meHinata');
    h.innerHTML = $('#hinataSvg').innerHTML;
    h.querySelector('.eyes-normal').style.display = '';
    h.querySelector('.eyes-wow').style.display = 'none';
    $('#meLv').textContent = lv;
    $('#meRank').textContent = RANK[lv];
    const nx = LEVELS[lv + 1];
    $('#meBar').style.width = nx ? ((st - LEVELS[lv]) / (nx - LEVELS[lv]) * 100) + '%' : '100%';
    $('#meNext').textContent = nx ? `あと${nx - st}石で「${RANK[lv + 1]}」・めざすは最強の自分` : '最強の自分に、なった。';
    $('#meStones').textContent = st;
    $('#meStreak').textContent = `${streakOf()}日`;
    $('#meBest').textContent = `${bestStreak()}日`;
    $('#meTotal').textContent = minutesJa(totalTime()).replace(/^(\d+)秒$/, '0分');

    let seen = []; try { seen = JSON.parse(localStorage.getItem('saikyo.badges')) || []; } catch {}
    const got = BADGES.filter(b => b.ok()).map(b => b.name);
    $('#badgeCount').textContent = `${got.length} / ${BADGES.length}`;
    $('#badges').innerHTML = BADGES.map(b => {
      const ok = got.includes(b.name);
      return `<li class="badge tap${ok ? '' : ' locked'}${ok && !seen.includes(b.name) ? ' new' : ''}" data-badge="${BADGES.indexOf(b)}" style="--c:var(--${b.c});--cd:var(--${b.c}-d)"><i>${ok ? b.ico : '?'}</i><b>${b.name}</b><small>${b.how}</small></li>`;
    }).join('');
    try { localStorage.setItem('saikyo.badges', JSON.stringify(got)); } catch {}

    // この5週間（月曜はじまり、今週を最後の行に）
    const mon = addDays(today, -((dow(today) + 6) % 7) - 28);
    const vals = [];
    for (let i = 0; i < 35; i++) { const iso = addDays(mon, i); vals.push([iso, state.days[iso] ? dayStones(state.days[iso]) : 0]); }
    const max = Math.max(30, ...vals.map(v => v[1]));
    $('#heatmap').innerHTML = vals.map(([iso, v]) => {
      const fut = iso > today;
      const rest = !fut && dayStatus(iso) === 'yohaku';
      const o = v ? (.18 + .82 * v / max).toFixed(2) : 0;
      const dnum = +iso.slice(8);
      return `<div class="hm${fut ? ' future' : v && !rest ? ' on' : rest ? ' rest' : ''}${iso === today ? ' today' : ''}"${fut ? '' : ` data-day="${iso}"`} style="--o:${o}" title="${fmtJa(iso)} +${v}石"><small>${dnum}</small></div>`;
    }).join('');

    // 何に積んだか
    const tb = Object.entries(timeByLabel()).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const tmax = tb.length ? tb[0][1] : 1;
    $('#timeBars').innerHTML = tb.length ? tb.map(([k, v]) => {
      const p = planFor(k);
      return `<li class="tb-row tap" data-label="${esc(k)}" style="--c:var(--${p.color})"><span class="tb-ico">${iconOf(p)}</span><div><div class="tb-top">${esc(k)}<span>${minutesJa(v)}</span></div><div class="tb-bar"><i style="width:${Math.max(4, v / tmax * 100)}%"></i></div></div></li>`;
    }).join('') : '<li class="empty">タイマーで測ると、ここに積んだ時間が並びます</li>';

    renderLists();
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
