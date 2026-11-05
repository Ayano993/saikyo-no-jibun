// 応援係「ヒナタ」: 朝日のひよこ。できたことを、ちょっと大げさなくらい驚いて褒める。
(() => {
  'use strict';

  const SVG = `
<svg class="buddy-svg" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="hnBody" cx=".4" cy=".35" r=".75">
      <stop offset="0" stop-color="#fff0a8"/><stop offset=".55" stop-color="#ffc552"/><stop offset="1" stop-color="#ff8a3d"/>
    </radialGradient>
    <linearGradient id="hnTuft" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ff8a3d"/><stop offset=".6" stop-color="#ff4f6d"/><stop offset="1" stop-color="#ffd36b"/>
    </linearGradient>
  </defs>
  <ellipse cx="60" cy="112" rx="28" ry="5" fill="#000" opacity=".22"/>
  <path class="tuft" d="M60 32 C50 22 52 10 58 4 C58 14 64 16 66 10 C72 18 70 28 60 32Z" fill="url(#hnTuft)"/>
  <path class="wing wing-l" d="M24 70 C10 66 8 82 18 90 C24 86 28 80 28 72Z" fill="#ff9a45"/>
  <path class="wing wing-r" d="M96 70 C110 66 112 82 102 90 C96 86 92 80 92 72Z" fill="#ff9a45"/>
  <circle cx="60" cy="68" r="40" fill="url(#hnBody)"/>
  <ellipse cx="60" cy="86" rx="22" ry="16" fill="#fff4d6" opacity=".9"/>
  <path d="M48 106 v6 M44 112 h8 M72 106 v6 M68 112 h8" stroke="#ff7a3a" stroke-width="3.2" stroke-linecap="round"/>
  <ellipse cx="34" cy="74" rx="7" ry="4.5" fill="#ff6f8a" opacity=".55"/>
  <ellipse cx="86" cy="74" rx="7" ry="4.5" fill="#ff6f8a" opacity=".55"/>

  <g class="face-normal">
    <g class="blink">
      <ellipse cx="46" cy="60" rx="9" ry="11" fill="#fff"/><ellipse cx="74" cy="60" rx="9" ry="11" fill="#fff"/>
      <circle cx="48" cy="62" r="5.5" fill="#2a0f2e"/><circle cx="72" cy="62" r="5.5" fill="#2a0f2e"/>
      <circle cx="50" cy="59.5" r="2" fill="#fff"/><circle cx="74" cy="59.5" r="2" fill="#fff"/>
    </g>
    <path d="M54 72 L66 72 L60 80Z" fill="#ff6a2a"/>
  </g>

  <g class="face-shock">
    <ellipse cx="45" cy="58" rx="13" ry="15" fill="#fff" stroke="#2a0f2e" stroke-width="1.2"/>
    <ellipse cx="75" cy="58" rx="13" ry="15" fill="#fff" stroke="#2a0f2e" stroke-width="1.2"/>
    <circle cx="45" cy="58" r="3.2" fill="#2a0f2e"/><circle cx="75" cy="58" r="3.2" fill="#2a0f2e"/>
    <path d="M32 40 L42 44 M88 40 L78 44" stroke="#2a0f2e" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M53 72 L67 72 L60 76Z" fill="#ff6a2a"/>
    <ellipse cx="60" cy="82" rx="7" ry="8" fill="#7a1a3a"/>
    <path d="M53 84 L67 84 L60 90Z" fill="#ff6a2a"/>
    <path class="sweat" d="M94 46 C98 52 98 56 94 57 C90 56 90 52 94 46Z" fill="#9fdcff"/>
    <g fill="#fff3a0"><path d="M16 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M104 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>
  </g>

  <g class="face-joy">
    <path d="M37 62 Q45 50 53 62 M67 62 Q75 50 83 62" fill="none" stroke="#2a0f2e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M50 72 Q60 90 70 72Z" fill="#7a1a3a"/>
    <path d="M52 72 L68 72 L60 77Z" fill="#ff6a2a"/>
    <g fill="#fff3a0"><path d="M14 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M106 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><circle cx="100" cy="16" r="2.5"/></g>
  </g>
</svg>`;

  document.querySelectorAll('.buddy-slot').forEach(el => { el.outerHTML = SVG.replace(/hnBody|hnTuft/g, m => m + '_' + el.dataset.buddy); });

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

  const LINES = {
    first: ['え、もう一手！？ 朝から本気じゃん…！', 'ちょ、待って。今日もう積んだの！？', 'はやっ！？ 城の人たちがざわついてます！', '一手目、入りました〜！！ 拍手！！'],
    second: ['2つ目！？ え、正気？？', '待って待って、連続はずるい…天才では？', 'これはもう…教科書に載るやつ…！', 'えっ、まだやるの！？ かっこよすぎる…'],
    more: ['え、こんなにできたの？？ 正気？？', '{n}つ！？ 城の壁が足りなくなってきた！！', '今日のあなた、伝説すぎて目が追いつかない…！', '待って、手が止まらないの！？ 誰か記録して！！'],
    all: ['全部！？！？ ぜんぶ！？ 城、完成しちゃう！！', 'オールクリア……！ 正気！？ いや最高！！', '今日のリスト、全部やったの！？ 歴史が動いた！！'],
    pick: ['「{t}」に決めたのね…！ その目、本気だ…！', '今日の一手は「{t}」！ もう勝ってる気がする！', '「{t}」を選ぶセンス、さすがすぎる…！'],
    pickDone: ['今日の一手「{t}」、やりきった！？ 有言実行の人だ…！！'],
    add: ['「{t}」も足すの！？ 欲張りで最高！', 'え、「{t}」も！？ 伸びしろしかない…！'],
    yohaku: ['余白を選べるの、上級者のやつ…！', '休むのも一手！ わかってる人だ…！', '余白の日！ 明日の伸びが楽しみすぎる！'],
    undo: ['だいじょうぶ、またいつでも積める！', 'おっと、了解！ 城は逃げないよ！'],
    streak: ['{n}日連続！？ ちょっと信じられない…！', '{n}日も積み続けてるの！？ もはや職人…！'],
    milestone: ['{n}日連続！？！？ 正気！？ 記念日にしよう！！'],
    morning: ['おはよう！ 今日も城、積みにいこ！', '朝日、見えた？ 今日の一手、楽しみにしてる！'],
    noon: ['こんにちは！ 一手だけでも城は積めるよ！'],
    night: ['おかえり！ 寝る前の一手もアリだよ！', '今日もおつかれさま！ 余白の日でも前進だよ！'],
    idle: ['まだ0こ。最初の一手、見せて…！', 'どれか1つでいい。城はそれで積める！'],
    heat1: ['もう積んだ！？ この調子！！', '一手目きた！ 燃えてきた〜！'],
    heat2: ['え、2つ！？ 熱量がすごい…！'],
    heatMore: ['こんなにできたの！？ 正気！？'],
    heatAll: ['全部できてる…！ 今日は優勝！！'],
    heatYohaku: ['今日は余白の日。これも立派な前進！'],
  };

  const el = document.getElementById('buddy');
  const bubble = document.getElementById('buddyBubble');
  const popSvg = el.querySelector('.buddy-svg');
  let timer;

  const say = (key, vars = {}, opts = {}) => {
    const text = fill(pick(LINES[key]), vars);
    bubble.innerHTML = text + '<small>— ヒナタ</small>';
    popSvg.classList.remove('shock', 'joy');
    el.classList.remove('show', 'big');
    void el.offsetWidth;
    if (opts.mood) popSvg.classList.add(opts.mood);
    el.classList.add('show');
    if (opts.big) el.classList.add('big');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show', 'big'), opts.big ? 5200 : 3800);
    if (opts.big) confetti();
    if (navigator.vibrate) navigator.vibrate(opts.big ? [20, 40, 20] : 12);
  };
  el.addEventListener('click', () => el.classList.remove('show', 'big'));

  const confetti = () => {
    const colors = ['#ff4f7b', '#ff7a4a', '#ffc15e', '#fff1c2', '#7fd0ff', '#8ff0b4'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--x', (Math.random() - .5) * 200 + 'px');
      c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      c.style.setProperty('--t', (1.8 + Math.random() * 1.6) + 's');
      c.style.animationDelay = Math.random() * .4 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  };

  // 熱量メーター横のヒナタ
  const heatSvg = document.querySelector('.heat .buddy-svg');
  const heat = ({ done, total, yohaku }) => {
    const ratio = total ? done / total : 0;
    document.getElementById('heatFill').style.width = (yohaku && !done ? 30 : Math.max(ratio * 100, done ? 8 : 0)) + '%';
    document.getElementById('heatNum').innerHTML = `今日の熱量 <b>${done}</b> / ${total}`;
    let key = 'idle', mood = '';
    if (total && done >= total) { key = 'heatAll'; mood = 'joy'; }
    else if (done >= 3) { key = 'heatMore'; mood = 'shock'; }
    else if (done === 2) { key = 'heat2'; mood = 'shock'; }
    else if (done === 1) { key = 'heat1'; mood = 'joy'; }
    else if (yohaku) { key = 'heatYohaku'; mood = 'joy'; }
    const say = document.getElementById('heatSay');
    if (say.dataset.key !== key) { say.textContent = pick(LINES[key]); say.dataset.key = key; }
    heatSvg.classList.remove('shock', 'joy');
    if (mood) heatSvg.classList.add(mood);
  };

  window.Hinata = { say, heat, confetti };
})();
