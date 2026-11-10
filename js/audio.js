'use strict';
// ------------------------------------------------------------
//  Prozeduraler Klang: keine Dateien, alles WebAudio.
// ------------------------------------------------------------
const Sound = (function () {
  let ac = null, master, sfxBus, ambBus, musBus, revIn, noiseBuf, brownBuf;
  const vol = { master: 0.8, sfx: 1, music: 0.7 };
  let amb = null, ambKind = null;
  let oneShotT = 3;
  let heartT = 0;
  let musicTimer = null;

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = vol.master;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    ambBus = ac.createGain(); ambBus.gain.value = vol.music; ambBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = vol.music; musBus.connect(master);
    // Hall
    const rev = ac.createConvolver();
    rev.buffer = impulse(3.2, 2.4);
    revIn = ac.createGain(); revIn.gain.value = 0.6;
    revIn.connect(rev); rev.connect(master);
    // Rauschpuffer
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    brownBuf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate);
    const b = brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < b.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
  }
  function impulse(sec, decay) {
    const len = ac.sampleRate * sec;
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }
  function now() { return ac ? ac.currentTime : 0; }
  function setVolumes(v) {
    Object.assign(vol, v);
    if (!ac) return;
    master.gain.value = vol.master;
    sfxBus.gain.value = vol.sfx;
    ambBus.gain.value = vol.music;
    musBus.gain.value = vol.music;
  }

  // --- Grundbausteine ---------------------------------------
  function tone(o) {
    if (!ac) return;
    const t0 = now() + (o.delay || 0);
    const dur = o.dur || 0.3;
    const os = ac.createOscillator();
    os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f || 440, t0);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    if (o.detune) os.detune.value = o.detune;
    const g = ac.createGain();
    const v = o.vol === undefined ? 0.2 : o.vol;
    const a = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = os;
    if (o.filter) {
      const f = ac.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.value = o.filter.f || 1000;
      f.Q.value = o.filter.q || 1;
      node.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    if (o.rev) { const s = ac.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    if (o.vib) {
      const l = ac.createOscillator(); const lg = ac.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(os.frequency); l.start(t0); l.stop(t0 + dur + 0.05);
    }
    os.start(t0); os.stop(t0 + dur + 0.05);
    return os;
  }
  function noise(o) {
    if (!ac) return;
    const t0 = now() + (o.delay || 0);
    const dur = o.dur || 0.2;
    const src = ac.createBufferSource();
    src.buffer = o.brown ? brownBuf : noiseBuf;
    src.loop = true;
    src.playbackRate.value = o.rate || 1;
    const f = ac.createBiquadFilter();
    f.type = (o.filter && o.filter.type) || 'bandpass';
    f.frequency.setValueAtTime((o.filter && o.filter.f) || 1000, t0);
    if (o.filter && o.filter.to) f.frequency.exponentialRampToValueAtTime(o.filter.to, t0 + dur);
    f.Q.value = (o.filter && o.filter.q) || 1;
    const g = ac.createGain();
    const v = o.vol === undefined ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    if (o.rev) { const s = ac.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  }

  // --- Benannte Klänge --------------------------------------
  const NOTE = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, H: 493.88, C2: 523.25 };
  const S = {
    step(surface, loud) {
      const v = (loud || 1) * 0.12;
      switch (surface) {
        case 'grass':
          noise({ dur: 0.09, vol: v * 0.6, filter: { type: 'highpass', f: 2600 }, attack: 0.02 }); break;
        case 'gravel':
          for (let i = 0; i < 3; i++) noise({ delay: i * 0.018, dur: 0.04, vol: v * 0.55, filter: { type: 'bandpass', f: 3000 + Math.random() * 1500, q: 2 } });
          break;
        case 'dirt': case 'mud':
          noise({ dur: 0.08, vol: v * 0.8, filter: { type: 'lowpass', f: 700 } }); break;
        case 'stone': case 'tile':
          noise({ dur: 0.05, vol: v * 0.7, filter: { type: 'bandpass', f: surface === 'tile' ? 2600 : 1800, q: 3 }, rev: 0.25 });
          tone({ f: 140, slide: 90, dur: 0.06, vol: v * 0.5 }); break;
        case 'water':
          noise({ dur: 0.12, vol: v * 0.7, filter: { type: 'bandpass', f: 900, to: 400, q: 2 } }); break;
        default: // Holz
          noise({ dur: 0.06, vol: v * 0.6, filter: { type: 'lowpass', f: 900 } });
          tone({ f: 110 + Math.random() * 20, slide: 70, dur: 0.07, vol: v * 0.6 });
          if (Math.random() < 0.08) creakSmall();
      }
    },
    ui() { tone({ f: 620, type: 'square', dur: 0.04, vol: 0.04, filter: { f: 2000 } }); },
    ok() { tone({ f: 520, type: 'square', dur: 0.05, vol: 0.05, filter: { f: 2200 } }); tone({ f: 780, type: 'square', dur: 0.07, vol: 0.05, delay: 0.05, filter: { f: 2200 } }); },
    back() { tone({ f: 480, type: 'square', dur: 0.05, vol: 0.05, filter: { f: 1800 } }); tone({ f: 320, type: 'square', dur: 0.07, vol: 0.05, delay: 0.05, filter: { f: 1800 } }); },
    blip() { tone({ f: 900 + Math.random() * 120, type: 'square', dur: 0.018, vol: 0.022, filter: { f: 2400 } }); },
    page() { noise({ dur: 0.18, vol: 0.06, filter: { type: 'bandpass', f: 3000, to: 1200, q: 0.7 }, attack: 0.04 }); },
    pickup() {
      [0, 0.07, 0.14].forEach((d, i) => tone({ f: [392, 494, 659][i], type: 'triangle', dur: 0.25, vol: 0.08, delay: d, rev: 0.4 }));
    },
    key() { [0, 0.05].forEach((d) => noise({ delay: d, dur: 0.03, vol: 0.1, filter: { type: 'bandpass', f: 5000, q: 4 } })); },
    door() {
      creak(0.7);
      noise({ delay: 0.55, dur: 0.18, vol: 0.18, filter: { type: 'lowpass', f: 300 }, rev: 0.3 });
    },
    doorOpen() { creak(0.5); },
    slam() {
      noise({ dur: 0.35, vol: 0.4, filter: { type: 'lowpass', f: 380 }, rev: 0.7 });
      tone({ f: 70, slide: 40, dur: 0.3, vol: 0.3 });
    },
    locked() {
      for (let i = 0; i < 4; i++) noise({ delay: i * 0.07, dur: 0.04, vol: 0.12, filter: { type: 'bandpass', f: 2200 + i * 300, q: 6 } });
    },
    unlock() {
      noise({ dur: 0.05, vol: 0.15, filter: { type: 'bandpass', f: 4000, q: 5 } });
      noise({ delay: 0.12, dur: 0.08, vol: 0.18, filter: { type: 'bandpass', f: 1500, q: 4 } });
    },
    click() { noise({ dur: 0.02, vol: 0.12, filter: { type: 'bandpass', f: 3500, q: 6 } }); },
    flashOn() { noise({ dur: 0.02, vol: 0.1, filter: { type: 'bandpass', f: 2500, q: 8 } }); },
    hurt() {
      noise({ dur: 0.3, vol: 0.35, filter: { type: 'lowpass', f: 900, to: 200 } });
      tone({ f: 180, slide: 60, dur: 0.4, vol: 0.25, type: 'sawtooth', filter: { f: 600 } });
    },
    stinger() {
      [0, 1, 6, 11, 13].forEach((st) => {
        tone({ f: 110 * Math.pow(2, st / 12), type: 'sawtooth', dur: 2.2, vol: 0.06, attack: 0.01, filter: { f: 1400 }, rev: 0.6 });
      });
      tone({ f: 1760, slide: 1400, type: 'sine', dur: 1.6, vol: 0.05, vib: [9, 30], rev: 0.8 });
      noise({ dur: 0.6, vol: 0.2, filter: { type: 'lowpass', f: 300 } });
    },
    scream() {
      tone({ f: 900, slide: 160, type: 'sawtooth', dur: 1.1, vol: 0.12, filter: { type: 'bandpass', f: 1200, q: 2 }, vib: [23, 60], rev: 0.6 });
      tone({ f: 1200, slide: 240, type: 'square', dur: 0.9, vol: 0.05, filter: { type: 'bandpass', f: 1800, q: 3 }, vib: [31, 80] });
      noise({ dur: 0.9, vol: 0.12, filter: { type: 'bandpass', f: 1600, to: 500, q: 1 } });
    },
    count(n) {
      // tiefes, heiseres Murmeln
      const f = 92 - (n % 10) * 2;
      tone({ f, type: 'sawtooth', dur: 0.45, vol: 0.05, filter: { type: 'bandpass', f: 420, q: 4 }, vib: [6, 6], rev: 0.5 });
      noise({ dur: 0.4, vol: 0.04, filter: { type: 'bandpass', f: 900, q: 5 }, attack: 0.08, rev: 0.5 });
    },
    whisper() {
      const n = U.randi(2, 4);
      for (let i = 0; i < n; i++) {
        noise({ delay: i * 0.18 + Math.random() * 0.05, dur: 0.16 + Math.random() * 0.1, vol: 0.05, filter: { type: 'bandpass', f: 1500 + Math.random() * 2500, q: 6 }, attack: 0.05, rev: 0.7 });
      }
    },
    crawler() {
      for (let i = 0; i < 5; i++) noise({ delay: i * 0.05, dur: 0.02, vol: 0.06, filter: { type: 'bandpass', f: 1800 + Math.random() * 800, q: 8 } });
      noise({ delay: 0.25, dur: 0.5, vol: 0.05, filter: { type: 'bandpass', f: 500, q: 3 }, attack: 0.15 });
    },
    thunder() {
      noise({ dur: 3.5, vol: 0.35, brown: true, filter: { type: 'lowpass', f: 300, to: 80 }, attack: 0.05, rev: 0.4 });
      noise({ delay: 0.1, dur: 1.2, vol: 0.15, filter: { type: 'lowpass', f: 900, to: 150 } });
    },
    piano(note, v) {
      const f = NOTE[note] || 440;
      const vv = v || 0.12;
      tone({ f, type: 'triangle', dur: 1.8, vol: vv, rev: 0.5 });
      tone({ f: f * 2, type: 'sine', dur: 0.9, vol: vv * 0.3, rev: 0.5 });
      tone({ f: f * 1.003, type: 'sine', dur: 1.4, vol: vv * 0.5 });
    },
    pianoWrong() {
      ['C', 'F', 'H'].forEach((n) => S.piano(n, 0.08));
      tone({ f: 61, dur: 1.5, type: 'triangle', vol: 0.1, rev: 0.6 });
    },
    musicbox(note, d) {
      const f = (NOTE[note] || 440) * 2;
      tone({ f, type: 'sine', dur: 1.2, vol: 0.06, delay: d || 0, rev: 0.7 });
      tone({ f: f * 3, type: 'sine', dur: 0.3, vol: 0.015, delay: d || 0 });
    },
    bell(pitch) {
      const f = pitch || 330;
      [1, 2.76, 5.4, 8.93].forEach((m, i) => tone({ f: f * m, type: 'sine', dur: 4 - i * 0.7, vol: 0.09 / (i + 1), rev: 0.8 }));
    },
    save() {
      [0, 0.12, 0.24].forEach((d, i) => tone({ f: [523, 659, 784][i], type: 'sine', dur: 1.4, vol: 0.06, delay: d, rev: 0.8 }));
    },
    tick(tock) { noise({ dur: 0.015, vol: 0.05, filter: { type: 'bandpass', f: tock ? 2200 : 3000, q: 10 } }); },
    knock() {
      [0, 0.32, 0.64].forEach((d) => { noise({ delay: d, dur: 0.08, vol: 0.12, filter: { type: 'lowpass', f: 400 }, rev: 0.6 }); tone({ delay: d, f: 90, slide: 60, dur: 0.08, vol: 0.15 }); });
    },
    crow() {
      for (let i = 0; i < 2; i++) tone({ delay: i * 0.3, f: 520, slide: 380, type: 'sawtooth', dur: 0.22, vol: 0.05, filter: { type: 'bandpass', f: 1100, q: 3 }, rev: 0.5 });
    },
    flap() { for (let i = 0; i < 6; i++) noise({ delay: i * 0.07, dur: 0.05, vol: 0.06, filter: { type: 'lowpass', f: 800 } }); },
    owl() {
      tone({ f: 380, slide: 340, type: 'sine', dur: 0.4, vol: 0.04, vib: [5, 6], rev: 0.8 });
      tone({ delay: 0.5, f: 360, slide: 300, type: 'sine', dur: 0.7, vol: 0.035, vib: [5, 6], rev: 0.8 });
    },
    drip() { tone({ f: 1400 + Math.random() * 900, slide: 500, type: 'sine', dur: 0.12, vol: 0.05, rev: 0.7 }); },
    creak() { creak(0.5 + Math.random() * 0.4); },
    breath() { noise({ dur: 1.1, vol: 0.05, filter: { type: 'bandpass', f: 700, q: 1 }, attack: 0.5 }); },
    gasp() { noise({ dur: 0.35, vol: 0.12, filter: { type: 'bandpass', f: 1100, q: 1.5 }, attack: 0.02 }); },
    heart(strength) {
      const v = 0.1 + 0.25 * strength;
      tone({ f: 58, slide: 38, dur: 0.16, vol: v });
      tone({ delay: 0.18, f: 52, slide: 34, dur: 0.18, vol: v * 0.75 });
    },
    switchOn() {
      noise({ dur: 0.05, vol: 0.2, filter: { type: 'bandpass', f: 1200, q: 3 } });
      tone({ delay: 0.1, f: 50, type: 'sawtooth', dur: 1.5, vol: 0.06, filter: { f: 200 } });
      tone({ delay: 0.1, f: 100, type: 'sawtooth', dur: 1.5, vol: 0.03, filter: { f: 300 } });
    },
    shutter() {
      for (let i = 0; i < 16; i++) noise({ delay: i * 0.08, dur: 0.06, vol: 0.12, filter: { type: 'bandpass', f: 900 + (i % 2) * 300, q: 3 } });
      tone({ f: 60, type: 'sawtooth', dur: 1.3, vol: 0.05, filter: { f: 250 } });
    },
    water() { noise({ dur: 4, vol: 0.18, brown: true, filter: { type: 'lowpass', f: 900, to: 250 }, attack: 0.5, rev: 0.4 }); },
    wood() { noise({ dur: 0.3, vol: 0.3, filter: { type: 'bandpass', f: 600, q: 2 } }); tone({ f: 200, slide: 90, dur: 0.2, vol: 0.15, type: 'square', filter: { f: 500 } }); },
    battery() { S.click(); tone({ delay: 0.1, f: 1200, type: 'sine', dur: 0.08, vol: 0.05 }); },
    lighter() { noise({ dur: 0.25, vol: 0.12, filter: { type: 'bandpass', f: 2500, q: 1 }, attack: 0.01 }); noise({ delay: 0.1, dur: 0.5, vol: 0.05, filter: { type: 'lowpass', f: 600 } }); },
    death() {
      tone({ f: 220, slide: 30, type: 'sawtooth', dur: 3, vol: 0.12, filter: { f: 800 }, rev: 0.7 });
      noise({ dur: 2.5, vol: 0.2, brown: true, filter: { type: 'lowpass', f: 400, to: 60 } });
      S.stinger();
    },
    laugh() {
      [0, 0.16, 0.32, 0.48].forEach((d, i) => tone({ delay: d, f: 700 - i * 30, slide: 600 - i * 30, type: 'triangle', dur: 0.12, vol: 0.03, vib: [12, 20], rev: 0.9 }));
    },
    ball() { [0, 0.4, 0.7, 0.9, 1.05].forEach((d, i) => tone({ delay: d, f: 120, slide: 80, dur: 0.1, vol: 0.12 / (i + 1), rev: 0.5 })); },
  };
  function creak(len) {
    if (!ac) return;
    const t0 = now();
    const os = ac.createOscillator(); os.type = 'sawtooth';
    const base = 180 + Math.random() * 120;
    os.frequency.setValueAtTime(base, t0);
    os.frequency.linearRampToValueAtTime(base * 1.6, t0 + len * 0.4);
    os.frequency.linearRampToValueAtTime(base * 1.1, t0 + len);
    const lfo = ac.createOscillator(); const lg = ac.createGain();
    lfo.frequency.value = 28 + Math.random() * 20; lg.gain.value = 40;
    lfo.connect(lg); lg.connect(os.frequency);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    os.connect(f); f.connect(g); g.connect(sfxBus);
    const s = ac.createGain(); s.gain.value = 0.4; g.connect(s); s.connect(revIn);
    os.start(t0); lfo.start(t0); os.stop(t0 + len + 0.1); lfo.stop(t0 + len + 0.1);
  }
  function creakSmall() { creak(0.25); }

  function play(name, a, b) { if (!ac || !S[name]) return; try { S[name](a, b); } catch (e) { /* still */ } }

  // --- Atmosphäre -------------------------------------------
  const AMB = {
    forest: { drone: 55, dvol: 0.05, cut: 180, wind: 0.10, wf: 500, rain: 0.05 },
    hof: { drone: 52, dvol: 0.05, cut: 170, wind: 0.08, wf: 420, rain: 0.06 },
    manor: { drone: 49, dvol: 0.06, cut: 150, wind: 0.025, wf: 300, rain: 0.012 },
    upper: { drone: 46, dvol: 0.065, cut: 160, wind: 0.03, wf: 320, rain: 0.015 },
    cellar: { drone: 41, dvol: 0.08, cut: 120, wind: 0.015, wf: 200, rain: 0 },
    attic: { drone: 62, dvol: 0.05, cut: 200, wind: 0.05, wf: 600, rain: 0.03 },
    greenhouse: { drone: 58, dvol: 0.04, cut: 160, wind: 0.02, wf: 400, rain: 0.09 },
    chapel: { drone: 44, dvol: 0.05, cut: 140, wind: 0.04, wf: 350, rain: 0.02, pad: [220, 261.6, 311.1] },
    crypt: { drone: 36, dvol: 0.09, cut: 110, wind: 0.02, wf: 250, rain: 0, pad: [146.8, 174.6, 207.6] },
    hut: { drone: 60, dvol: 0.03, cut: 200, wind: 0.04, wf: 500, rain: 0.03 },
    title: { drone: 44, dvol: 0.05, cut: 140, wind: 0.05, wf: 400, rain: 0.06 },
    silence: { drone: 40, dvol: 0.0, cut: 100, wind: 0, wf: 300, rain: 0 },
  };
  function setAmbience(kind) {
    if (!ac || kind === ambKind) return;
    ambKind = kind;
    const old = amb;
    if (old) {
      const t = now();
      old.g.gain.cancelScheduledValues(t);
      old.g.gain.setValueAtTime(old.g.gain.value, t);
      old.g.gain.linearRampToValueAtTime(0.0001, t + 2.5);
      setTimeout(() => old.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* */ } }), 2800);
    }
    const p = AMB[kind] || AMB.manor;
    const g = ac.createGain(); g.gain.value = 0.0001; g.connect(ambBus);
    const nodes = [];
    // Bordun
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = p.cut; lp.Q.value = 3;
    const dg = ac.createGain(); dg.gain.value = p.dvol;
    lp.connect(dg); dg.connect(g);
    [1, 1.006, 1.498].forEach((m, i) => {
      const o = ac.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = p.drone * m;
      const og = ac.createGain(); og.gain.value = i === 2 ? 0.25 : 0.5;
      o.connect(og); og.connect(lp); o.start(); nodes.push(o);
    });
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
    const lfg = ac.createGain(); lfg.gain.value = p.cut * 0.5;
    lfo.connect(lfg); lfg.connect(lp.frequency); lfo.start(); nodes.push(lfo);
    // Wind
    if (p.wind > 0) {
      const ns = ac.createBufferSource(); ns.buffer = brownBuf; ns.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = p.wf; bp.Q.value = 0.8;
      const wg = ac.createGain(); wg.gain.value = p.wind;
      const wl = ac.createOscillator(); wl.frequency.value = 0.11;
      const wlg = ac.createGain(); wlg.gain.value = p.wind * 0.8;
      wl.connect(wlg); wlg.connect(wg.gain);
      const wl2 = ac.createOscillator(); wl2.frequency.value = 0.05;
      const wl2g = ac.createGain(); wl2g.gain.value = p.wf * 0.4;
      wl2.connect(wl2g); wl2g.connect(bp.frequency);
      ns.connect(bp); bp.connect(wg); wg.connect(g);
      ns.start(); wl.start(); wl2.start(); nodes.push(ns, wl, wl2);
    }
    // Regen
    if (p.rain > 0) {
      const rs = ac.createBufferSource(); rs.buffer = noiseBuf; rs.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 7000;
      const rg = ac.createGain(); rg.gain.value = p.rain;
      rs.connect(hp); hp.connect(lp2); lp2.connect(rg); rg.connect(g); rs.start(); nodes.push(rs);
    }
    // Chor-artige Fläche
    if (p.pad) {
      p.pad.forEach((f, i) => {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const og = ac.createGain(); og.gain.value = 0.012;
        const v = ac.createOscillator(); v.frequency.value = 0.2 + i * 0.07;
        const vg = ac.createGain(); vg.gain.value = 0.008;
        v.connect(vg); vg.connect(og.gain);
        o.connect(og); og.connect(g);
        const rs = ac.createGain(); rs.gain.value = 0.5; og.connect(rs); rs.connect(revIn);
        o.start(); v.start(); nodes.push(o, v);
      });
    }
    const t = now();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 3);
    amb = { g, nodes, kind };
  }

  // Zufällige Einzelgeräusche je nach Ort + Herzschlag
  function update(dt, danger, kind) {
    if (!ac) return;
    oneShotT -= dt;
    if (oneShotT <= 0) {
      oneShotT = 4 + Math.random() * 9;
      const k = kind || ambKind;
      const r = Math.random();
      if (k === 'forest' || k === 'hof') {
        if (r < 0.3) S.owl(); else if (r < 0.5) S.crow(); else if (r < 0.6) S.whisper(); else creak(0.6);
      } else if (k === 'manor' || k === 'upper') {
        if (r < 0.45) creak(0.4 + Math.random() * 0.5); else if (r < 0.6) S.knock(); else if (r < 0.72) S.whisper(); else S.tick(true);
      } else if (k === 'cellar') {
        if (r < 0.6) S.drip(); else if (r < 0.75) S.knock(); else creak(0.8);
      } else if (k === 'attic') {
        if (r < 0.5) creak(0.6); else if (r < 0.7) S.whisper(); else S.flap();
      } else if (k === 'crypt' || k === 'chapel') {
        if (r < 0.4) S.drip(); else if (r < 0.7) S.whisper(); else creak(1.0);
      } else if (k === 'greenhouse') {
        if (r < 0.5) S.drip(); else creak(0.4);
      }
    }
    if (danger > 0.05) {
      heartT -= dt;
      if (heartT <= 0) {
        S.heart(danger);
        heartT = U.lerp(1.3, 0.42, U.clamp(danger, 0, 1));
      }
    } else heartT = 0.3;
  }

  // Spieluhr-Melodie fürs Titelbild (das Schlaflied!)
  const LULLABY = ['A', 'C2', 'H', 'G', 'A', 'E', 'F', 'E'];
  function startMusic() {
    stopMusic();
    if (!ac) return;
    let i = 0;
    const stepFn = () => {
      const n = LULLABY[i % LULLABY.length];
      S.musicbox(n);
      if (i % LULLABY.length === LULLABY.length - 1) tone({ f: 110, type: 'sine', dur: 3, vol: 0.04, rev: 0.6, bus: musBus });
      i++;
    };
    stepFn();
    musicTimer = setInterval(stepFn, 720);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  return { init, resume, play, setAmbience, update, setVolumes, vol, startMusic, stopMusic, LULLABY, get ready() { return !!ac; } };
})();
