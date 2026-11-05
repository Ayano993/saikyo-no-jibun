// BGM と効果音。すべてこのページの中で Web Audio により作る自作の音（市販曲・外部音源は使わない）。
(() => {
  'use strict';

  const PREF_KEY = 'saikyo.sound';
  const prefs = (() => {
    try { return { bgm: false, sfx: true, vol: .7, ...JSON.parse(localStorage.getItem(PREF_KEY)) }; }
    catch { return { bgm: false, sfx: true, vol: .7 }; }
  })();
  const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} };

  let ctx = null, master, bgmBus, sfxBus, delay, noiseBuf;

  const init = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    master = ctx.createGain(); master.gain.value = prefs.vol;
    master.connect(comp).connect(ctx.destination);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0; bgmBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master);
    // BGM のつぶ立ちに少しだけ残響（ディレイ）
    delay = ctx.createDelay(1); delay.delayTime.value = 60 / BPM * .75;
    const fb = ctx.createGain(); fb.gain.value = .28;
    const dl = ctx.createGain(); dl.gain.value = .32;
    delay.connect(fb).connect(delay); delay.connect(dl).connect(bgmBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
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

  // ---------- BGM（自作の明るいループ。D メジャー、I–V–vi–IV） ----------
  const BPM = 104;
  const STEP = 60 / BPM / 4;
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
  let step = 0, nextT = 0, sched = null;

  const scheduleStep = (s, t) => {
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
  const tick = () => {
    while (nextT < ctx.currentTime + .12) { scheduleStep(step, nextT); step++; nextT += STEP; }
  };
  const bgmStart = () => {
    if (!init() || sched) return;
    step = 0; nextT = ctx.currentTime + .08;
    sched = setInterval(tick, 25);
    bgmBus.gain.cancelScheduledValues(ctx.currentTime);
    bgmBus.gain.setTargetAtTime(.55, ctx.currentTime, .6);
  };
  const bgmStop = () => {
    if (!ctx || !sched) return;
    bgmBus.gain.setTargetAtTime(0, ctx.currentTime, .25);
    const id = sched; sched = null;
    setTimeout(() => clearInterval(id), 900);
  };
  const duck = (secs = 1.2) => {
    if (!ctx || !sched) return;
    const t = ctx.currentTime;
    bgmBus.gain.cancelScheduledValues(t);
    bgmBus.gain.setTargetAtTime(.22, t, .05);
    bgmBus.gain.setTargetAtTime(.55, t + secs, .4);
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
      if (prefs.bgm) bgmStart();
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
    setVol(v) { prefs.vol = v; savePrefs(); if (master) master.gain.setTargetAtTime(v, ctx.currentTime, .05); },
    get playing() { return !!sched; },
  };
})();
