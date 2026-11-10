'use strict';
// ------------------------------------------------------------
//  Touch-Steuerung fürs Handy: Stick links, Knöpfe rechts.
//  Erscheint nur auf Geräten mit Touchscreen.
// ------------------------------------------------------------
const Touch = (function () {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  function init() {
    if (!isTouch) return;
    document.body.classList.add('touch');
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div id="stick"><div id="knob"></div></div>
      <div id="tbtns">
        <button data-k="KeyE" class="big">E</button>
        <button data-k="KeyF">Lampe</button>
        <button data-k="ShiftLeft" data-hold="1">Rennen</button>
        <button data-k="KeyC" data-hold="1">Leise</button>
        <button data-k="Space" data-hold="1">Atem</button>
      </div>
      <div id="ttop">
        <button data-k="Escape">Menü</button>
        <button data-k="KeyI">Inv.</button>
        <button data-k="KeyJ">Tageb.</button>
        <button data-k="KeyM">Karte</button>
        <button data-k="KeyR">Batt.</button>
      </div>`;
    document.body.appendChild(root);

    // Knöpfe
    root.querySelectorAll('button').forEach((b) => {
      const k = b.dataset.k;
      const down = (e) => { e.preventDefault(); Input.press(k); b.classList.add('on'); };
      const up = (e) => { e.preventDefault(); Input.release(k); b.classList.remove('on'); };
      b.addEventListener('touchstart', down, { passive: false });
      b.addEventListener('touchend', up, { passive: false });
      b.addEventListener('touchcancel', up, { passive: false });
    });

    // Stick
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    let id = null, cx = 0, cy = 0;
    const dirs = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    const active = {};
    let repeatT = null;
    function set(dir, on) {
      if (!!active[dir] === on) return;
      active[dir] = on;
      if (on) Input.press(dirs[dir]); else Input.release(dirs[dir]);
    }
    function move(x, y) {
      let dx = x - cx, dy = y - cy;
      const r = stick.offsetWidth / 2, d = Math.hypot(dx, dy);
      if (d > r) { dx = dx / d * r; dy = dy / d * r; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const t = r * 0.35;
      set('left', dx < -t); set('right', dx > t); set('up', dy < -t); set('down', dy > t);
    }
    function end() {
      id = null; knob.style.transform = '';
      Object.keys(dirs).forEach((k) => set(k, false));
      clearInterval(repeatT);
    }
    stick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; id = t.identifier;
      const rc = stick.getBoundingClientRect(); cx = rc.left + rc.width / 2; cy = rc.top + rc.height / 2;
      move(t.clientX, t.clientY);
      clearInterval(repeatT);
      // gehaltene Richtung wiederholt sich in Menüs
      repeatT = setInterval(() => { Object.keys(active).forEach((k) => { if (active[k]) Input.navK[dirs[k]] = true; }); }, 220);
    }, { passive: false });
    stick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === id) move(t.clientX, t.clientY);
    }, { passive: false });
    stick.addEventListener('touchend', (e) => { e.preventDefault(); end(); }, { passive: false });
    stick.addEventListener('touchcancel', end);
    // Kein Zoomen/Scrollen durch Doppeltipps
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }
  return { init, isTouch };
})();
window.addEventListener('load', () => Touch.init());
