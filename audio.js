// BGM と効果音。すべてこのページの中で Web Audio により作る自作の音（市販曲・外部音源は使わない）。
// BGM は一度だけ音声データに書き出して <audio> で流す。iPhone で別のアプリを開いても止まりにくくするため。
(() => {
  'use strict';

  const PREF_KEY = 'saikyo.sound';
  const prefs = (() => {
    try { return { bgm: false, sfx: true, vol: .7, track: 'phonk', ...JSON.parse(localStorage.getItem(PREF_KEY)) }; }
    catch { return { bgm: false, sfx: true, vol: .7, track: 'phonk' }; }
  })();
  const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} };

  let ctx = null, master, bgmBus, sfxBus, delay, noiseBuf, drive;

  // 音の通り道をつくる（ライブ用と書き出し用で共通）
  const build = () => {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    master = ctx.createGain(); master.gain.value = prefs.vol;
    master.connect(comp).connect(ctx.destination);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0; bgmBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master);
    // BGM のつぶ立ちに少しだけ残響（ディレイ）
    delay = ctx.createDelay(1); delay.delayTime.value = 60 / TRACKS[prefs.track].bpm * .75;
    // 808 とカウベルを少し歪ませる
    drive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.2); }
    drive.curve = curve;
    const driveOut = ctx.createGain(); driveOut.gain.value = .7;
    drive.connect(driveOut).connect(bgmBus);
    const fb = ctx.createGain(); fb.gain.value = .28;
    const dl = ctx.createGain(); dl.gain.value = .32;
    delay.connect(fb).connect(delay); delay.connect(dl).connect(bgmBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  };
  const init = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    build();
    return ctx;
  };

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // ひとつの音を鳴らす
  const tone = (dest, { midi, f, t, dur = .2, type = 'triangle', gain = .2, attack = .005, glideTo, cutoff, send = 0 }) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    const freq = f || hz(midi);
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o;
    if (cutoff) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff;
      o.connect(lp); node = lp;
    }
    node.connect(g).connect(dest);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(delay); }
    o.start(t); o.stop(t + dur + .05);
  };
  const noise = (dest, { t, dur = .05, gain = .1, type = 'highpass', freq = 7000, q = 1, sweepTo }) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t); fl.Q.value = q;
    if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl).connect(g).connect(dest);
    s.start(t); s.stop(t + dur + .02);
  };

  // ---------- BGM 1: 朝焼けポップ（D メジャー、I–V–vi–IV） ----------
  const CHORDS = [
    { root: 38, notes: [62, 66, 69] },  // D
    { root: 33, notes: [61, 64, 69] },  // A
    { root: 35, notes: [62, 66, 71] },  // Bm
    { root: 31, notes: [62, 67, 71] },  // G
  ];
  const ARP = [0, 1, 2, 1, 0, 2, 1, 2];
  const MELODY = [ // 8 小節で一周する短い主旋律（null は休み）
    [74, null, 76, null, 78, null, null, null, 76, null, 74, null, 73, null, null, null],
    [76, null, null, 73, 69, null, null, null, 71, null, 73, null, 76, null, null, null],
    [74, null, 76, null, 78, null, 81, null, 78, null, 76, null, 74, null, null, null],
    [71, null, 74, null, 74, null, 76, null, 74, null, null, null, null, null, null, null],
  ];
  const sunriseStep = (s, t, STEP) => {
    const bar = Math.floor(s / 16) % 32;
    const pos = s % 16;
    const ch = CHORDS[bar % 4];
    const intro = bar < 4;
    const withMelody = bar >= 8 && bar < 24;
    if (pos === 0) {
      ch.notes.forEach(n => tone(bgmBus, { midi: n - 12, t, dur: STEP * 16, type: 'sawtooth', gain: .022, attack: .25, cutoff: 1400 }));
    }
    if (!intro) {
      if (pos % 4 === 0) tone(bgmBus, { f: 120, glideTo: 45, t, dur: .22, type: 'sine', gain: .5 });
      if (pos % 4 === 2) noise(bgmBus, { t, dur: .045, gain: .05 });
      if (pos === 4 || pos === 12) noise(bgmBus, { t, dur: .12, gain: .09, type: 'bandpass', freq: 1800, q: .8 });
      if (pos === 0 || pos === 6 || pos === 8 || pos === 14) tone(bgmBus, { midi: ch.root + (pos === 6 || pos === 14 ? 12 : 0), t, dur: STEP * 2.2, type: 'triangle', gain: .2, cutoff: 900 });
    }
    if (pos % 2 === 0) {
      const n = ch.notes[ARP[(pos / 2) % 8]] + 12;
      tone(bgmBus, { midi: n, t, dur: STEP * 1.6, type: 'triangle', gain: intro ? .045 : .035, send: .7 });
    }
    if (withMelody) {
      const m = MELODY[bar % 4][pos];
      if (m) tone(bgmBus, { midi: m, t, dur: STEP * 3, type: 'square', gain: .028, cutoff: 2600, send: .5 });
    }
  };

  // ---------- BGM 2: フォンク（D マイナー。カウベル、歪んだ 808、細かいハイハット） ----------
  const PH_ROOTS = [38, 34, 36, 33];               // Dm – B♭ – C – A
  const PH_PADS = [[62, 65, 69], [62, 65, 70], [64, 67, 72], [61, 64, 69]];
  const _ = null;
  const PH_BELL = [
    [74, _, _, 74, _, _, 77, _, 74, _, _, 74, _, 79, 77, _],
    [81, _, _, 79, _, _, 77, _, 76, _, _, 74, _, 76, _, _],
    [74, _, _, 74, _, _, 77, _, 74, _, _, 74, _, 79, 77, _],
    [74, _, 77, _, 79, _, 81, _, 82, _, 81, _, 79, _, 77, _],
  ];
  const cowbell = (midi, t, gain = .07) => {
    const f = hz(midi);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 1.25; bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .003);
    g.gain.exponentialRampToValueAtTime(gain * .35, t + .04);
    g.gain.exponentialRampToValueAtTime(.0001, t + .32);
    [f, f * 1.4836].forEach(fr => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr;
      o.connect(bp); o.start(t); o.stop(t + .36);
    });
    bp.connect(g); g.connect(drive);
    const s = ctx.createGain(); s.gain.value = .45; g.connect(s).connect(delay);
  };
  const bass808 = (midi, t, dur, slideTo) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    const f = hz(midi);
    o.frequency.setValueAtTime(f * 1.9, t);
    o.frequency.exponentialRampToValueAtTime(f, t + .03);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(hz(slideTo), t + dur * .9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.55, t + .005);
    g.gain.setTargetAtTime(.32, t + .05, .12);
    g.gain.setTargetAtTime(.0001, t + dur, .04);
    o.connect(g).connect(drive);
    o.start(t); o.stop(t + dur + .3);
  };
  const phonkStep = (s, t, STEP) => {
    const bar = Math.floor(s / 16) % 16;
    const pos = s % 16;
    const ci = bar % 4;
    const intro = bar < 2;
    const brk = bar >= 14;
    const full = !intro && !brk;
    if (pos === 0) PH_PADS[ci].forEach(n => tone(bgmBus, { midi: n - 12, t, dur: STEP * 16, type: 'sawtooth', gain: .014, attack: .3, cutoff: 900 }));
    const bell = PH_BELL[bar % 4][pos];
    if (bell) cowbell(bell, t, intro ? .05 : .07);
    // ハイハット（8分。2小節ごとに 32 分の連打）
    if (pos % 2 === 0) noise(bgmBus, { t, dur: .035, gain: intro ? .03 : .05, freq: 8000 });
    if (!intro && bar % 2 === 1 && pos >= 12) {
      noise(bgmBus, { t: t + STEP / 2, dur: .025, gain: .035, freq: 9000 });
    }
    if (full) {
      const kicks = bar % 4 === 3 ? [0, 7, 10, 14] : [0, 7, 10];
      if (kicks.includes(pos)) {
        tone(bgmBus, { f: 160, glideTo: 50, t, dur: .09, type: 'sine', gain: .55 });
        const next = kicks.find(k => k > pos) ?? 16;
        const slide = bar % 4 === 3 && pos === 10 ? PH_ROOTS[ci] + 12 : null;
        bass808(PH_ROOTS[ci] + (pos === 7 ? 0 : 0), t, STEP * (next - pos) * .95, slide);
      }
    }
    if ((full || brk) && (pos === 4 || pos === 12)) {
      noise(bgmBus, { t, dur: .16, gain: .13, type: 'bandpass', freq: 1500, q: .7 });
      noise(bgmBus, { t: t + .012, dur: .1, gain: .07, type: 'bandpass', freq: 2400, q: .9 });
    }
  };

  const TRACKS = {
    phonk: { bpm: 132, step: phonkStep, gain: .5, bars: 16 },
    sunrise: { bpm: 104, step: sunriseStep, gain: .55, bars: 32 },
  };
  // ---------- BGM を書き出して <audio> で流す ----------
  const RATE = 32000;
  const rendered = {};
  const toWav = buf => {
    const d = buf.getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + d.length * 2));
    const w = (o, str) => [...str].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, RATE, true); out.setUint32(28, RATE * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
    w(36, 'data'); out.setUint32(40, d.length * 2, true);
    for (let i = 0; i < d.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
    return new Blob([out], { type: 'audio/wav' });
  };
  // 2周ぶん書き出して2周目だけ使うと、残響まで含めてつなぎ目なくループする
  const render = async name => {
    if (rendered[name]) return rendered[name];
    const tr = TRACKS[name];
    const STEP = 60 / tr.bpm / 4;
    const steps = tr.bars * 16;
    const loopLen = steps * STEP;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const off = new OAC(1, Math.ceil(RATE * loopLen * 2), RATE);
    const live = { ctx, master, bgmBus, sfxBus, delay, noiseBuf, drive };
    ctx = off;
    build();
    master.gain.value = 1;
    bgmBus.gain.value = tr.gain;
    delay.delayTime.value = STEP * 3;
    for (let i = 0; i < steps * 2; i++) tr.step(i, i * STEP, STEP);
    ({ ctx, master, bgmBus, sfxBus, delay, noiseBuf, drive } = live);
    const full = await off.startRendering();
    const start = Math.floor(loopLen * RATE), len = Math.floor(loopLen * RATE);
    const one = (ctx || new OAC(1, 1, RATE)).createBuffer(1, len, RATE);
    one.getChannelData(0).set(full.getChannelData(0).subarray(start, start + len));
    rendered[name] = URL.createObjectURL(toWav(one));
    return rendered[name];
  };

  const SILENT = URL.createObjectURL(toWav({ getChannelData: () => new Float32Array(RATE / 4) })); // 0.25秒の無音
  const bgmEl = new Audio();
  bgmEl.loop = true;
  bgmEl.preload = 'auto';
  bgmEl.setAttribute('playsinline', '');
  let wanted = false, loading = false;
  const elVol = () => Math.min(1, prefs.vol * .9);
  const mediaInfo = name => {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: name === 'sunrise' ? '朝焼けポップ' : 'オリジナル・フォンク',
      artist: '最強の自分',
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
    try {
      navigator.mediaSession.setActionHandler('play', () => bgmEl.play());
      navigator.mediaSession.setActionHandler('pause', () => bgmEl.pause());
    } catch {}
  };
  const bgmStart = () => {
    wanted = true;
    // タップの中で一度鳴らして <audio> を解放しておく（書き出しの後でも再生できるように）
    if (!bgmEl.src || bgmEl.paused) { bgmEl.src = rendered[prefs.track] || SILENT; bgmEl.play().catch(() => {}); }
    const name = TRACKS[prefs.track] ? prefs.track : 'phonk';
    if (loading) return;
    loading = true;
    render(name).then(url => {
      loading = false;
      if (!wanted) return;
      if (prefs.track !== name) return bgmStart();
      if (!bgmEl.src.endsWith(url)) bgmEl.src = url;
      bgmEl.volume = elVol();
      bgmEl.play().catch(() => {});
      mediaInfo(name);
    }).catch(() => { loading = false; });
  };
  const bgmStop = () => { wanted = false; bgmEl.pause(); };
  let duckTimer;
  const duck = (secs = 1.2) => {
    if (bgmEl.paused) return;
    bgmEl.volume = elVol() * .35;
    clearTimeout(duckTimer);
    duckTimer = setTimeout(() => { bgmEl.volume = elVol(); }, secs * 1000);
  };

  // ---------- 効果音 ----------
  const SFX = {
    tap: t => tone(sfxBus, { midi: 96, t, dur: .04, type: 'sine', gain: .06 }),
    check: t => {
      tone(sfxBus, { midi: 81, t, dur: .14, gain: .22 });
      tone(sfxBus, { midi: 88, t: t + .07, dur: .3, gain: .22 });
      tone(sfxBus, { midi: 100, t: t + .12, dur: .4, type: 'sine', gain: .07 });
    },
    uncheck: t => tone(sfxBus, { midi: 64, glideTo: hz(57), t, dur: .18, type: 'sine', gain: .14 }),
    pick: t => [74, 78, 81, 86].forEach((m, i) => tone(sfxBus, { midi: m, t: t + i * .06, dur: .25, gain: .14 })),
    pop: t => tone(sfxBus, { f: 520, glideTo: 980, t, dur: .1, type: 'sine', gain: .12 }),
    start: t => {
      noise(sfxBus, { t, dur: .35, gain: .12, type: 'bandpass', freq: 400, sweepTo: 4000, q: 2 });
      tone(sfxBus, { midi: 74, t: t + .2, dur: .18, gain: .16 });
      tone(sfxBus, { midi: 81, t: t + .3, dur: .35, gain: .18 });
    },
    stop: t => {
      tone(sfxBus, { midi: 79, t, dur: .5, type: 'sine', gain: .16 });
      tone(sfxBus, { midi: 86, t, dur: .7, type: 'sine', gain: .06 });
    },
    goal: t => [0, 12, 19, 24].forEach((d, i) => tone(sfxBus, { midi: 76 + d, t: t + i * .02, dur: 1.4 - i * .2, type: 'sine', gain: .12 / (i + 1) })),
    fanfare: t => {
      [62, 66, 69, 74].forEach((m, i) => tone(sfxBus, { midi: m, t: t + i * .09, dur: .22, type: 'sawtooth', gain: .08, cutoff: 3000 }));
      [74, 78, 81, 86].forEach(m => tone(sfxBus, { midi: m, t: t + .42, dur: 1.1, type: 'sawtooth', gain: .06, cutoff: 2600, attack: .02 }));
      noise(sfxBus, { t: t + .42, dur: .5, gain: .06 });
      [98, 101, 105].forEach((m, i) => tone(sfxBus, { midi: m, t: t + .5 + i * .08, dur: .3, type: 'sine', gain: .05 }));
    },
    open: t => [69, 74, 78, 81].forEach((m, i) => tone(sfxBus, { midi: m, t: t + i * .11, dur: .6, type: 'sine', gain: .1 })),
  };
  const sfx = name => {
    if (!prefs.sfx || !init() || ctx.state !== 'running') return;
    const f = SFX[name];
    if (!f) return;
    if (name === 'fanfare' || name === 'goal') duck(1.6); else duck(.5);
    f(ctx.currentTime + .01);
  };

  // iPhone は最初のタップで音を解放する必要がある
  let unlocked = false;
  const unlock = () => {
    if (!init()) return;
    if (ctx.state !== 'running') ctx.resume();
    if (!unlocked) {
      unlocked = true;
      // 無音を一度鳴らして確実に解放
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
      if (prefs.bgm && bgmEl.paused) bgmStart();
    }
  };
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (unlocked) ctx.resume();
  });

  window.Sound = {
    prefs,
    sfx,
    setBgm(on) { prefs.bgm = on; savePrefs(); unlock(); on ? bgmStart() : bgmStop(); },
    setSfx(on) { prefs.sfx = on; savePrefs(); },
    setTrack(name) {
      if (!TRACKS[name]) return;
      const changed = prefs.track !== name;
      prefs.track = name; savePrefs();
      if (changed && wanted) { bgmEl.pause(); bgmEl.src = SILENT; bgmEl.play().catch(() => {}); bgmStart(); }
    },
    setVol(v) { prefs.vol = v; savePrefs(); if (master) master.gain.setTargetAtTime(v, ctx.currentTime, .05); bgmEl.volume = elVol(); },
    get playing() { return wanted; },
    get audio() { return bgmEl; },
  };
})();
