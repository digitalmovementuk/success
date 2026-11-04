/* Home v2 fork of ../../v1/assets/js/media.js (28 Oct 2026): the only change is CAP_DESK 4 -> 3, so the hero clip plus the Next-up clips never play more than 3 at once.
   Elite Fit Group Fitness concept v1 · media.js
   EF.media: lazy, capped, pausable class clips.
   - video[data-clip] stay preload="none" (or carry data-src) until they play, or (after the first scroll or touch) are within 40 % of a screen of playing.
   - Plays when its parent is 25 % visible, pauses when not. Cap 2 on phones / coarse pointers, 4 on desktop.
   - Hero stage ([data-hero-stage], full-bleed behind the headline below 768 px): the poster is the LCP image (preloaded in the HTML);
     page.js keeps a still there for most families and creates a [data-stage-video] (then calls EF.media.scan) for the one clip that is
     safe behind text. That clip starts only after window load and only once page.js has set the stage up (EF.api.data present).
     A panel clip is skipped while the stage already plays the same file, so a phone never decodes one clip twice.
   - Hero panel clips (data-panel-video): below 1024 px only the one inside .panel.is-open plays; from 1024 px all of them (cap 4).
   - While the sheet is open only data-group="sheet" clips play.
   - [data-pause="<group>"] toggles a user pause for that group (aria-pressed, label, .pause__txt).
   - Reduced motion, Save-Data, 2g/3g or no motion-ok: posters only, no autoplay; the pause buttons stay as Play buttons. */
(function () {
'use strict';
var w = window, d = document, root = d.documentElement;
var EF = w.EF = w.EF || {};
if (EF.media && EF.media.version) { return; }

var VERSION = '1.0.0-v2';
var MIN_VIS = 0.25;
var CAP_SMALL = 2, CAP_DESK = 3;   /* Home v2 fork: at most 3 clips at once on desktop (Raoul 28 Oct, Next-up clips) */
var START_DELAY = 250;       /* after window load, so the poster and fonts win the first paint */
var HAS_IO = 'IntersectionObserver' in w;
var slice = Array.prototype.slice;
var raf = w.requestAnimationFrame ? function (f) { return w.requestAnimationFrame(f); } : function (f) { return w.setTimeout(f, 16); };
function guard(fn) { return function () { try { return fn.apply(this, arguments); } catch (e) { return undefined; } }; }
function qsa(sel, ctx) { try { return slice.call((ctx || d).querySelectorAll(sel)); } catch (e) { return []; } }
function mq(q) { try { return w.matchMedia ? w.matchMedia(q) : null; } catch (e) { return null; } }
function yes(m) { return !!(m && m.matches); }
function listen(m, fn) { if (!m) { return; } if (m.addEventListener) { m.addEventListener('change', fn); } else if (m.addListener) { m.addListener(fn); } }
function inDoc(el) { return !!el && root.contains(el); }
function closest(el, sel) {
  if (!el) { return null; }
  if (el.closest) { return el.closest(sel); }
  while (el && el.nodeType === 1) { if ((el.matches || el.msMatchesSelector || el.webkitMatchesSelector).call(el, sel)) { return el; } el = el.parentNode; }
  return null;
}

var mqReduce = mq('(prefers-reduced-motion: reduce)');
var mqNarrow = mq('(max-width: 1023.98px)');
var mqPhone = mq('(max-width: 767.98px)');
var mqCoarse = mq('(pointer: coarse)');
var stageOn = false;         /* the full-bleed hero stage is displayed (phones) */
var stageSrc = '';           /* file the stage clip is playing or about to play, '' when the stage shows a still */

var clips = [];              /* records: {v, box, group, vis, near, failed, pending, want, retries, panel, stage} */
var userSet = {};            /* group -> true (paused by the visitor) | false (played by the visitor); memory only */
var sheetOpen = false;
var blocked = false;         /* a play() was refused (iOS Low Power Mode): wait for a gesture */
var ready = false;           /* set shortly after window load */
var seen = null, near = null;
var queued = false;
var lastAuto = null;
var interacted = false;      /* the visitor has scrolled or touched: only then do clips just off-screen start loading */

/* ---------- gates ---------- */
function slowNet() {
  try {
    var c = navigator.connection;
    return !!(c && (c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType || '')));
  } catch (e) { return false; }
}
function autoOk() { return HAS_IO && !yes(mqReduce) && !slowNet() && root.classList.contains('motion-ok'); }
function isPaused(g) { return userSet.hasOwnProperty(g) ? userSet[g] : !autoOk(); }
function groupOk(g) { return !isPaused(g) && (autoOk() || userSet[g] === false); }
function cap() { return (yes(mqNarrow) || yes(mqCoarse)) ? CAP_SMALL : CAP_DESK; }
function eligible(r) {
  if (r.failed || !ready || d.hidden || !inDoc(r.v)) { return false; }
  if (sheetOpen && r.group !== 'sheet') { return false; }
  if (!groupOk(r.group)) { return false; }
  if (blocked) { return false; }
  if (r.stage && w.EF && EF.api && EF.api.load && !EF.api.data) { return false; }   /* page.js has not chosen the stage setting yet */
  if (r.panel && stageOn && stageSrc && stageSrc === String(r.v.getAttribute('src') || '')) { return false; }   /* stage plays this file */
  if (r.panel && yes(mqNarrow) && !r.panel.classList.contains('is-open')) { return false; }
  return true;
}

/* ---------- pause buttons ---------- */
function paintButton(btn) {
  var g = btn.getAttribute('data-pause') || '', p = isPaused(g), word = p ? 'Play' : 'Pause';
  var lab = btn.getAttribute('aria-label') || '';
  btn.setAttribute('aria-pressed', p ? 'true' : 'false');
  if (/^(Pause|Play)\b/i.test(lab)) { lab = lab.replace(/^(Pause|Play)\b/i, word); }
  else if (!lab) { lab = word + ' the video'; }
  btn.setAttribute('aria-label', lab);
  var t = btn.querySelector('.pause__txt');
  if (t && t.textContent !== word) { t.textContent = word; }
}
function paintButtons(ctx) { qsa('[data-pause]', ctx).forEach(paintButton); }

/* ---------- playback ---------- */
function prep(v) {
  v.muted = true; v.defaultMuted = true; v.loop = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  try { v.playsInline = true; } catch (e) { }
}
function ensureSrc(v) {
  var ds = v.getAttribute('data-src');
  if (ds && !v.getAttribute('src')) { v.setAttribute('src', ds); }
}
function armGesture() {
  /* iOS Low Power Mode refuses autoplay until a tap. Retry once per gesture, inside the gesture. */
  if (armGesture.on) { return; }
  armGesture.on = true;
  var go = guard(function () {
    armGesture.on = false;
    ['touchend', 'click', 'keydown'].forEach(function (n) { d.removeEventListener(n, go, true); });
    blocked = false;
    syncNow();
  });
  ['touchend', 'click', 'keydown'].forEach(function (n) { d.addEventListener(n, go, true); });
}
function fail(r) {
  r.failed = true; r.want = false; r.pending = false;
  r.v.classList.remove('is-playing');
}
function startPlay(r) {
  var v = r.v, p;
  if (!v.paused || r.pending) { return; }
  ensureSrc(v);
  prep(v);
  v.preload = 'auto';
  r.pending = true;
  try { p = v.play(); } catch (e) { fail(r); return; }
  if (p && typeof p.then === 'function') {
    p.then(function () { r.pending = false; }, function (err) {
      r.pending = false;
      var n = err && err.name;
      if (n === 'AbortError') { return; }                       /* we paused it again before it started */
      if (n === 'NotAllowedError') { blocked = true; armGesture(); return; }
      fail(r);                                                  /* NotSupportedError, no source, decode error: poster stays */
    });
  } else { r.pending = false; }
}
function stopPlay(r) { if (!r.v.paused) { try { r.v.pause(); } catch (e) { } } }
function toPoster(r) {
  stopPlay(r);
  r.v.classList.remove('is-playing');
}
function dropGone() {
  clips = clips.filter(function (r) {
    if (inDoc(r.v)) { return true; }
    var list = r.box.__efmRecs || [], i = list.indexOf(r);
    if (i > -1) { list.splice(i, 1); }
    if (!list.length) { if (seen) { seen.unobserve(r.box); } if (near) { near.unobserve(r.box); } }
    return false;
  });
}
function warm(r) {
  /* a clip that may play soon: let its bytes start now. Everything else keeps preload="none".
     Not before the visitor first scrolls or touches, so the first view only pays for what it plays. */
  if (!interacted) { return; }
  ensureSrc(r.v);
  if (r.v.preload !== 'auto') { r.v.preload = 'auto'; }
}
function syncNow() {
  queued = false;
  dropGone();
  var limit = cap(), auto = autoOk(), list = [], st = d.querySelector('[data-hero-stage]');
  lastAuto = auto;
  stageOn = !!st && yes(mqPhone) && st.getClientRects().length > 0;
  var sv = stageOn && st.querySelector('[data-stage-video]');
  stageSrc = sv ? String(sv.getAttribute('src') || '') : '';
  root.classList.toggle('media-manual', !auto);
  clips.forEach(function (r) { if (eligible(r) && r.vis >= MIN_VIS) { list.push(r); } });
  list.sort(function (a, b) { return (b.vis + (b.v.paused ? 0 : 0.15)) - (a.vis + (a.v.paused ? 0 : 0.15)); });
  list = list.slice(0, limit);
  clips.forEach(function (r) {
    if (list.indexOf(r) > -1) { r.want = true; startPlay(r); }
    else {
      r.want = false;
      if (!auto && userSet[r.group] !== false) { toPoster(r); } else { stopPlay(r); }
      if (r.near && eligible(r)) { warm(r); }
    }
  });
  paintButtons();
}
function sync() {
  if (queued) { return; }
  queued = true;
  raf(guard(syncNow));
}

/* ---------- registration ---------- */
function register(v) {
  if (v.__efm) { return; }
  var box = v.parentNode;
  var r = { v: v, box: box, group: v.getAttribute('data-group') || 'default', vis: HAS_IO ? 0 : 1, near: false, failed: false, pending: false, want: false, retries: 0, panel: v.hasAttribute('data-panel-video') ? closest(v, '.panel') : null, stage: v.hasAttribute('data-stage-video') };
  v.__efm = r;
  prep(v);
  if (!v.getAttribute('preload')) { v.setAttribute('preload', 'none'); }
  v.addEventListener('playing', function () { v.classList.add('is-playing'); r.retries = 0; });
  v.addEventListener('pause', function () {
    /* something other than us paused it (iOS does this when a clip scrolls away or the OS takes over): ask again, but not forever */
    if (r.want && !v.ended && !d.hidden && r.retries < 3) { r.retries++; w.setTimeout(guard(sync), 160); }
  });
  v.addEventListener('error', function () { fail(r); });
  /* src swapped by another module (page.js changes the stage clip when a family is picked): forget an old failure, start the new clip */
  v.addEventListener('loadstart', function () { r.failed = false; r.pending = false; });
  v.addEventListener('emptied', function () { sync(); });
  clips.push(r);
  (box.__efmRecs = box.__efmRecs || []).push(r);
  if (box.__efmRecs.length === 1) {
    if (seen) { seen.observe(box); }
    if (near) { near.observe(box); }
  }
}
function scan(ctx) {
  qsa('video[data-clip]', ctx && ctx.nodeType ? ctx : d).forEach(register);
  paintButtons(ctx && ctx.nodeType ? ctx : d);
  sync();
}

/* ---------- observers ---------- */
function makeObservers() {
  if (!HAS_IO) { return; }
  var steps = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
  seen = new w.IntersectionObserver(guard(function (entries) {
    entries.forEach(function (e) {
      (e.target.__efmRecs || []).forEach(function (r) { r.vis = e.isIntersecting ? e.intersectionRatio : 0; });
    });
    sync();
  }), { threshold: steps });
  near = new w.IntersectionObserver(guard(function (entries) {
    entries.forEach(function (e) {
      (e.target.__efmRecs || []).forEach(function (r) {
        r.near = e.isIntersecting;
        if (e.isIntersecting && ready && eligible(r)) { warm(r); }
      });
    });
  }), { rootMargin: '40% 0px 40% 0px' });
}

/* ---------- events ---------- */
d.addEventListener('click', guard(function (e) {
  var btn = closest(e.target, '[data-pause]');
  if (!btn) { return; }
  var g = btn.getAttribute('data-pause') || '';
  userSet[g] = !isPaused(g);
  blocked = false;
  ready = true;
  paintButtons();
  syncNow();                               /* inside the click, so iOS lets play() through */
}));
(function () {
  var first = guard(function () {
    interacted = true;
    ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (n) { w.removeEventListener(n, first, true); });
    sync();
  });
  ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (n) { w.addEventListener(n, first, { capture: true, passive: true }); });
})();
d.addEventListener('visibilitychange', guard(function () { syncNow(); }));
w.addEventListener('pagehide', guard(function () { clips.forEach(stopPlay); }));
w.addEventListener('pageshow', guard(function () { sync(); }));
d.addEventListener('ef:panel', guard(function () { syncNow(); }));
d.addEventListener('ef:sheet', guard(function (e) { sheetOpen = !!(e && e.detail && e.detail.open); syncNow(); }));
var rt = 0;
w.addEventListener('resize', guard(function () { w.clearTimeout(rt); rt = w.setTimeout(guard(syncNow), 150); }));
[mqReduce, mqNarrow, mqPhone, mqCoarse].forEach(function (m) { listen(m, guard(function () { syncNow(); })); });
try { if (navigator.connection && navigator.connection.addEventListener) { navigator.connection.addEventListener('change', guard(syncNow)); } } catch (e) { }
if (w.MutationObserver) {
  try { new w.MutationObserver(guard(function () { if (autoOk() !== lastAuto) { sync(); } })).observe(root, { attributes: true, attributeFilter: ['class'] }); } catch (e) { }
  var hp = d.querySelector('[data-panels]');
  if (hp) { try { new w.MutationObserver(guard(sync)).observe(hp, { attributes: true, attributeFilter: ['class'], subtree: true }); } catch (e) { } }
}

/* ---------- init ---------- */
function injectStyle() {
  /* Poster-only mode has no .motion-ok, so gf.css hides .pause. Keep it as a Play button. */
  var s = d.createElement('style');
  s.setAttribute('data-ef-media', '');
  s.textContent = 'html.media-manual .pause{display:inline-grid}';
  (d.head || root).appendChild(s);
}
function start() {
  if (ready) { return; }
  ready = true;
  syncNow();
}
function init() {
  injectStyle();
  makeObservers();
  scan(d);
  if (d.readyState === 'complete') { w.setTimeout(guard(start), START_DELAY); }
  else {
    w.addEventListener('load', function () { w.setTimeout(guard(start), START_DELAY); });
    w.setTimeout(guard(start), 3500);      /* never wait for a slow late resource */
  }
}

EF.media = {
  version: VERSION,
  scan: scan,
  sync: syncNow,
  state: function () {
    var playing = clips.filter(function (r) { return !r.v.paused && !r.v.ended; });
    return { mode: autoOk() ? 'auto' : 'poster', cap: cap(), stage: stageOn, playing: playing.length, groups: playing.map(function (r) { return r.group; }), files: playing.map(function (r) { return String(r.v.getAttribute('src') || '').split('/').pop(); }), clips: clips.length, failed: clips.filter(function (r) { return r.failed; }).length, blocked: blocked };
  }
};

init();
})();
