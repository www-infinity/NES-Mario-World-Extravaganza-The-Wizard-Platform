/**
 * app.js — NES Mario World Extravaganza platform app logic
 * Handles: player progress save/load, coin counter, site-building intro,
 * and integration with www-infinity/Infinity-Graphics engines.
 */
'use strict';

/* ══════════════════════════════════════════════════════════════════════
   PLAYER PROGRESS (localStorage)
   ══════════════════════════════════════════════════════════════════════ */
const app = (() => {
  const KEY = 'nes_mario_world_save';

  function getState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch(e) { return {}; }
  }
  function setState(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
  }

  function saveProgress() {
    const state = getState();
    state.playerName = document.getElementById('playerName')?.textContent || 'GUEST';
    state.coins     = parseInt(document.getElementById('coinCount')?.textContent) || 0;
    state.highScore = document.getElementById('highScore')?.textContent || '000000';
    state.lives     = parseInt(document.getElementById('lifeCount')?.textContent) || 3;
    state.savedAt   = new Date().toISOString();
    state.saves     = (state.saves || 0) + 1;
    setState(state);
    document.getElementById('saveCount').textContent = state.saves;
    showToast('💾 PROGRESS SAVED!', 'green');
  }

  function loadProgress() {
    const state = getState();
    if (!state.playerName) { showToast('NO SAVE DATA FOUND', 'red'); return; }
    if (document.getElementById('playerName'))
      document.getElementById('playerName').textContent = state.playerName;
    if (document.getElementById('coinCount') && state.coins)
      document.getElementById('coinCount').textContent = state.coins;
    if (document.getElementById('highScore') && state.highScore)
      document.getElementById('highScore').textContent = state.highScore;
    if (document.getElementById('lifeCount') && state.lives)
      document.getElementById('lifeCount').textContent = state.lives;
    if (document.getElementById('saveCount') && state.saves)
      document.getElementById('saveCount').textContent = state.saves;
    showToast(`📂 LOADED: ${state.playerName}`, 'blue');
  }

  function promptPlayerName() {
    const name = prompt('ENTER YOUR PLAYER NAME (max 8 chars):');
    if (!name) return;
    const cleaned = name.toUpperCase().replace(/[^A-Z0-9!?.,-]/g, '').slice(0, 8);
    if (document.getElementById('playerName'))
      document.getElementById('playerName').textContent = cleaned || 'PLAYER';
    showToast(`✏️ NAME SET: ${cleaned}`, 'yellow');
  }

  return { saveProgress, loadProgress, promptPlayerName };
})();

/* ══════════════════════════════════════════════════════════════════════
   COIN COUNTER ANIMATION
   ══════════════════════════════════════════════════════════════════════ */
function initCoinCounter() {
  const coinEl = document.getElementById('coinCount');
  const hsEl   = document.getElementById('highScore');
  if (!coinEl) return;

  // Load saved coins
  try {
    const state = JSON.parse(localStorage.getItem('nes_mario_world_save')) || {};
    if (state.coins) coinEl.textContent = state.coins;
    if (state.highScore) hsEl.textContent = state.highScore;
  } catch(e) {}

  // Click the coin counter area to earn a coin (fun easter egg)
  const coinArea = document.getElementById('coinCounter');
  if (coinArea) {
    coinArea.addEventListener('click', () => {
      let coins = parseInt(coinEl.textContent) || 0;
      coins++;
      coinEl.textContent = coins;
      // Update high score
      if (hsEl) {
        const hs = parseInt(hsEl.textContent.replace(/^0+/, '') || '0') || 0;
        if (coins * 100 > hs) hsEl.textContent = String(coins * 100).padStart(6, '0');
      }
      coinArea.style.textShadow = '0 0 12px #fcfc00';
      setTimeout(() => { coinArea.style.textShadow = ''; }, 300);
    });
    coinArea.title = 'Click to collect a coin! 🪙';
    coinArea.style.cursor = 'pointer';
  }
}

/* ══════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'green') {
  const existing = document.querySelector('.nes-toast');
  if (existing) existing.remove();

  const colors = {
    green:  ['#00aa00', '#003300'],
    red:    ['#cc0000', '#330000'],
    blue:   ['#0044cc', '#001144'],
    yellow: ['#ccaa00', '#332200'],
  };
  const [border, bg] = colors[type] || colors.green;

  const t = document.createElement('div');
  t.className = 'nes-toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${bg};border:3px solid ${border};color:#fff;
    font-family:'Press Start 2P',monospace;font-size:8px;
    padding:12px 16px;max-width:280px;animation:toastIn 0.3s ease;
    pointer-events:none;
  `;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; }, 2500);
  setTimeout(() => t.remove(), 3000);
}

if (!document.getElementById('toastStyle')) {
  const s = document.createElement('style');
  s.id = 'toastStyle';
  s.textContent = '@keyframes toastIn{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}';
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════════════════
   SITE-BUILDING INTRO — powered by Infinity-Graphics engines
   Loads WebGLRenderer, Effects, AIAssistant from cdn.jsdelivr.net
   and animates a "building the platform" intro sequence.
   ══════════════════════════════════════════════════════════════════════ */
(function buildingIntro() {
  const SKIP_KEY = 'nes_intro_shown';
  // Show intro once per session
  if (sessionStorage.getItem(SKIP_KEY)) return;

  // Build the overlay
  const overlay = document.createElement('div');
  overlay.id = 'site-builder-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;background:#000;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Press Start 2P',monospace;overflow:hidden;
  `;

  overlay.innerHTML = `
    <!-- 3D WebGL background canvas -->
    <canvas id="intro-canvas-3d" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.35;"></canvas>

    <!-- Content -->
    <div style="position:relative;z-index:2;text-align:center;padding:24px;max-width:680px;width:100%;">
      <div style="font-size:clamp(12px,4vw,28px);color:#f8d858;margin-bottom:8px;
                  text-shadow:4px 4px 0 #8c3c00;">NES MARIO WORLD</div>
      <div style="font-size:clamp(8px,2vw,14px);color:#fcfc00;margin-bottom:4px;">EXTRAVAGANZA</div>
      <div style="font-size:clamp(7px,1.5vw,10px);color:#aaa;margin-bottom:32px;">
        ★ THE WIZARD PLATFORM ★
      </div>

      <!-- AI Palette swatches -->
      <div id="intro-palette" style="display:flex;justify-content:center;gap:6px;margin-bottom:24px;min-height:32px;"></div>

      <!-- Build log -->
      <div id="intro-log" style="
        background:rgba(0,0,0,0.7);border:2px solid #333;
        padding:12px;margin-bottom:20px;text-align:left;
        max-height:160px;overflow:hidden;
        font-size:clamp(6px,1.2vw,8px);line-height:2.2;color:#00cc00;
      "></div>

      <!-- Progress bar -->
      <div style="background:#111;border:2px solid #444;height:16px;width:100%;margin-bottom:20px;">
        <div id="intro-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#00aa00,#70c028);
          transition:width 0.3s ease;"></div>
      </div>

      <div id="intro-status" style="font-size:clamp(6px,1.5vw,9px);color:#fcfc00;min-height:16px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const log     = document.getElementById('intro-log');
  const bar     = document.getElementById('intro-bar');
  const status  = document.getElementById('intro-status');
  const palette = document.getElementById('intro-palette');

  let logLines = [];
  function addLog(line, color = '#00cc00') {
    logLines.push({ text: line, color });
    if (logLines.length > 8) logLines.shift();
    log.innerHTML = logLines.map(l =>
      `<div style="color:${l.color}">► ${l.text}</div>`
    ).join('');
  }

  function setProgress(pct, msg) {
    bar.style.width = pct + '%';
    if (msg) status.textContent = msg;
  }

  // Build steps
  const steps = [
    { pct: 5,  delay: 200,  msg: 'INITIALIZING INFINITY GRAPHICS ENGINE...',     color: '#00cc00' },
    { pct: 15, delay: 500,  msg: 'LOADING WEBGL 3D RENDERER...',                 color: '#00cc00' },
    { pct: 25, delay: 800,  msg: 'LOADING EFFECTS & FILTER PIPELINE...',          color: '#00cc00' },
    { pct: 35, delay: 1100, msg: 'AI: GENERATING COLOR PALETTE...',               color: '#fcfc00' },
    { pct: 50, delay: 1500, msg: 'CONNECTING NES MARIO WORLD EXTRAVAGANZA...',    color: '#70c028' },
    { pct: 62, delay: 1900, msg: 'LOADING ZELDA GAME ENGINE...',                  color: '#70c028' },
    { pct: 74, delay: 2300, msg: 'LINKING ARCHIVE.ORG RESOURCES...',              color: '#70c028' },
    { pct: 85, delay: 2700, msg: 'AI DESIGN ASSISTANT: READY',                    color: '#4868fc' },
    { pct: 95, delay: 3100, msg: 'INFINITY-GRAPHICS 3D: ONLINE',                  color: '#4868fc' },
    { pct:100, delay: 3500, msg: 'ALL SYSTEMS GO ★ PRESS START',                  color: '#f8d858' },
  ];

  steps.forEach(step => {
    setTimeout(() => {
      setProgress(step.pct, step.msg);
      addLog(step.msg, step.color);
    }, step.delay);
  });

  // ── Generate AI color palette ──────────────────────────────────────
  setTimeout(() => {
    const hue = Math.floor(Math.random() * 360);
    const nesColors = [
      `hsl(${hue},80%,45%)`,
      `hsl(${(hue+30)%360},70%,55%)`,
      `hsl(${(hue+180)%360},90%,40%)`,
      `hsl(${(hue+120)%360},60%,50%)`,
      `hsl(${hue},40%,25%)`,
    ];
    addLog('AI PALETTE GENERATED:', '#fcfc00');
    nesColors.forEach(col => {
      const sw = document.createElement('div');
      sw.style.cssText = `width:32px;height:32px;background:${col};border:2px solid #fff;cursor:pointer;transition:transform 0.1s;`;
      sw.title = col;
      sw.addEventListener('mouseenter', () => sw.style.transform = 'scale(1.2)');
      sw.addEventListener('mouseleave', () => sw.style.transform = '');
      palette.appendChild(sw);
    });
  }, 1100);

  // ── Start WebGL 3D (Infinity-Graphics WebGLRenderer) ──────────────
  // Load scripts from jsDelivr CDN pointing at the www-infinity/Infinity-Graphics repo
  const CDN = 'https://cdn.jsdelivr.net/gh/www-infinity/Infinity-Graphics@main/js/';

  function loadScript(url, cb) {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = cb || (() => {});
    s.onerror = () => console.warn('Could not load:', url);
    document.head.appendChild(s);
  }

  // Load Effects first (WebGL depends on nothing, AIAssistant depends on Effects)
  loadScript(CDN + 'effects.js', () => {
    addLog('EFFECTS ENGINE: LOADED', '#4868fc');
    // Load AI assistant
    loadScript(CDN + 'ai.js', () => {
      addLog('AI ASSISTANT: LOADED', '#fcfc00');
    });
  });

  // Load WebGL renderer (independent)
  loadScript(CDN + 'webgl.js', () => {
    addLog('WEBGL RENDERER: LOADED', '#70c028');
    // Try to init the 3D background
    try {
      if (typeof WebGLRenderer !== 'undefined') {
        // Rename canvas to match what WebGLRenderer expects
        const introCanvas = document.getElementById('intro-canvas-3d');
        if (introCanvas) {
          introCanvas.id = 'canvas-3d'; // WebGLRenderer looks for #canvas-3d
          if (WebGLRenderer.init()) {
            WebGLRenderer.setShape('torus');
            WebGLRenderer.setObjColor([0.43, 0.75, 0.16]); // NES green
            WebGLRenderer.setBgColor3D([0, 0, 0, 1]);
            WebGLRenderer.start();
            addLog('3D TORUS: SPINNING', '#70c028');
          }
        }
      }
    } catch(e) { /* WebGL not available on device */ }
  });

  // ── Dismiss after 4 seconds or on click ───────────────────────────
  function dismiss() {
    sessionStorage.setItem(SKIP_KEY, '1');
    try { if (typeof WebGLRenderer !== 'undefined') WebGLRenderer.stop(); } catch(e) {}
    overlay.style.transition = 'opacity 0.6s';
    overlay.style.opacity    = '0';
    setTimeout(() => overlay.remove(), 700);
  }

  setTimeout(dismiss, 4200);
  overlay.addEventListener('click', dismiss);

  // Keyboard skip
  const skipKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      document.removeEventListener('keydown', skipKey);
      dismiss();
    }
  };
  document.addEventListener('keydown', skipKey);

})();

/* ══════════════════════════════════════════════════════════════════════
   INFINITY-GRAPHICS 3D HERO SECTION
   After the intro, also load a persistent 3D background in the
   hero section if a #canvas-3d element is present on the page.
   ══════════════════════════════════════════════════════════════════════ */
function initHero3D() {
  const heroCanvas = document.getElementById('canvas-3d');
  if (!heroCanvas) return;

  const CDN = 'https://cdn.jsdelivr.net/gh/www-infinity/Infinity-Graphics@main/js/';
  function loadScript(url, cb) {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = cb || (() => {});
    s.onerror = () => {};
    document.head.appendChild(s);
  }

  function tryInit3D() {
    if (typeof WebGLRenderer === 'undefined') { setTimeout(tryInit3D, 300); return; }
    try {
      if (WebGLRenderer.init()) {
        WebGLRenderer.setShape('torus');
        WebGLRenderer.setObjColor([0.85, 0.16, 0.22]); // NES red
        WebGLRenderer.setBgColor3D([0.05, 0.05, 0.17, 1]);
        WebGLRenderer.start();
      }
    } catch(e) {}
  }

  if (typeof WebGLRenderer !== 'undefined') {
    tryInit3D();
  } else {
    loadScript(CDN + 'webgl.js', tryInit3D);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCoinCounter();
  // Auto-load saved progress silently
  try {
    const state = JSON.parse(localStorage.getItem('nes_mario_world_save')) || {};
    if (state.playerName && document.getElementById('playerName'))
      document.getElementById('playerName').textContent = state.playerName;
    if (state.saves && document.getElementById('saveCount'))
      document.getElementById('saveCount').textContent = state.saves;
  } catch(e) {}
  // Init 3D hero (fires after intro if page has the canvas element)
  setTimeout(initHero3D, 4500);
});
