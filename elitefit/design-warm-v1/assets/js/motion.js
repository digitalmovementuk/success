/* Elite Fit Group Fitness · Home · motion.js (27 Oct 2026)
   EF.motion for this variant. Same public API as v1 (scan, roll, on, revealAll) so the shared booking engine can call it.
   - Reveals are time-based springs (CSS linear() curves in home.css). This file only sets state classes:
     html.m-ready (pre-state allowed), element.m-in (play), html.m-fast (fast scroll: cut durations).
   - Scroll-linked effects (deck fan-out, photo depth, hero drift) are pure CSS scroll timelines under html.sda.
     Without scroll timelines the deck gets .m-in from the IntersectionObserver and deals with the same spring.
   - Counters ([data-roll]) count up once when 60 % in view; roll(el, n) re-counts a number that changed (spots after a booking).
   - Pointer tilt on coach photos (fine pointers only, max 3 degrees).
   Nothing is hidden: pre-states only move things; words keep full contrast. Elements already on screen at boot are never moved.
   Off for prefers-reduced-motion and Save-Data (live), and with JS off nothing here runs. Classic deferred script, ES5. */
(function () {
'use strict';
var w = window, d = document, root = d.documentElement;
var EF = w.EF = w.EF || {};
if (EF.motion && EF.motion.version) { return; }

var VERSION = 's3-1.0.0';
var RATIO = 0.15, BOTTOM = 0.08;
var FAST_PX_MS = 2.5, FAST_HOLD = 400;
var COUNT_MS = 400, ROLL_MS = 400;
var TILT_MAX = 3;
var SEL = '[data-motion~="rise"], [data-motion~="lift"], [data-motion~="stagger"], [data-motion~="swing"], [data-motion~="pop"], [data-deal], [data-deck]';
var HAS_IO = 'IntersectionObserver' in w;
var slice = Array.prototype.slice;
var raf = w.requestAnimationFrame ? function (f) { return w.requestAnimationFrame(f); } : function (f) { return w.setTimeout(f, 16); };
function now() { return (w.performance && w.performance.now) ? w.performance.now() : Date.now(); }
function guard(fn) { return function () { try { return fn.apply(this, arguments); } catch (e) { return undefined; } }; }
function qsa(sel, ctx) { try { return slice.call((ctx || d).querySelectorAll(sel)); } catch (e) { return []; } }
function mq(q) { try { return w.matchMedia ? w.matchMedia(q) : null; } catch (e) { return null; } }
function yes(m) { return !!(m && m.matches); }
function listen(m, fn) { if (!m) { return; } if (m.addEventListener) { m.addEventListener('change', fn); } else if (m.addListener) { m.addListener(fn); } }
function saveData() { try { var c = navigator.connection; return !!(c && c.saveData); } catch (e) { return false; } }
function vh() { return w.innerHeight || root.clientHeight || 800; }
function inDoc(el) { return !!el && root.contains(el); }

var mqReduce = mq('(prefers-reduced-motion: reduce)');
var mqFine = mq('(hover: hover) and (pointer: fine)');
var active = false, booted = false, io = null, countIO = null;

/* ---------- reveals ---------- */
function reveal(el) {
  if (!el.classList.contains('m-in')) { el.classList.add('m-in'); }
  if (io) { io.unobserve(el); }
}
function revealAll() {
  qsa(SEL).forEach(function (el) { el.classList.add('m-in'); });
  if (io) { io.disconnect(); }
}
function indexKids(el) {
  var kids = el.children, i;
  for (i = 0; i < kids.length; i++) { if (kids[i].style && !kids[i].style.getPropertyValue('--i')) { kids[i].style.setProperty('--i', String(i)); } }
}
function onScreen(r) {
  if (r.width === 0 && r.height === 0) { return false; }
  return r.bottom > 0 && r.top < vh() * (1 - BOTTOM);
}
var onIntersect = guard(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting && e.intersectionRatio >= RATIO) { reveal(e.target); }
    else if (e.isIntersecting && e.boundingClientRect.height > vh() * 2) { reveal(e.target); }     /* very tall: a sliver is enough */
    else if (!e.isIntersecting && e.boundingClientRect.top < 0) { reveal(e.target); }             /* scrolled past */
  });
});
function makeIO() {
  if (io || !HAS_IO) { return; }
  io = new w.IntersectionObserver(onIntersect, { threshold: [0, 0.05, RATIO], rootMargin: '0px 0px -' + (BOTTOM * 100) + '% 0px' });
}
function collect(ctx, atBoot) {
  qsa(SEL, ctx).concat(ctx && ctx.nodeType === 1 && ctx.matches && ctx.matches(SEL) ? [ctx] : []).forEach(function (el) {
    if (el.__mSeen) { return; }
    el.__mSeen = true;
    if (/\bstagger\b/.test(el.getAttribute('data-motion') || '')) { indexKids(el); }
    if (el.classList.contains('m-in')) { return; }
    if (atBoot && onScreen(el.getBoundingClientRect())) { reveal(el); return; }   /* already visible: never move it */
    if (io) { io.observe(el); } else { reveal(el); }
  });
}
function scan(ctx) {
  if (!active) { return; }
  var c = ctx && ctx.nodeType ? ctx : d;
  collect(c, false);
  qsa('[data-roll]', c).forEach(watchCount);
}
function boot() {
  booted = true;
  makeIO();
  collect(d, true);
  root.classList.add('m-ready');
  qsa('[data-roll]').forEach(watchCount);
}

/* ---------- counters ---------- */
function parseNum(el) { var t = String(el.textContent || '').replace(/\s+/g, ''); return /^\d{1,4}$/.test(t) ? +t : null; }
function countTo(el, from, to, ms) {
  var t0 = now(), st = el.__mCount = { to: to };
  el.classList.add('is-counting');
  function step() {
    if (el.__mCount !== st) { return; }
    var p = Math.min(1, (now() - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * e));
    if (p < 1) { raf(step); } else { el.textContent = String(to); el.classList.remove('is-counting'); el.__mCount = null; }
  }
  raf(step);
}
function watchCount(el) {
  if (el.__mWatch || !active) { return; }
  var n = parseNum(el);
  if (n === null || n === 0) { return; }
  el.__mWatch = true;
  if (!HAS_IO) { return; }
  if (!countIO) {
    countIO = new w.IntersectionObserver(guard(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || e.intersectionRatio < 0.6) { return; }
        countIO.unobserve(e.target);
        var target = parseNum(e.target);
        if (active && target !== null) { countTo(e.target, 0, target, COUNT_MS); }
      });
    }), { threshold: [0.6] });
  }
  countIO.observe(el);
}
/* roll(el, n): set a number; if motion is on and it is on screen, count from the old value to the new one */
function roll(el, n) {
  if (!el || el.nodeType !== 1) { return; }
  var v = +n;
  if (!(v >= 0) || v !== Math.floor(v)) { el.textContent = String(n); return; }
  var cur = el.__mCount ? el.__mCount.to : parseNum(el);
  if (!active || cur === null || cur === v) { el.__mCount = null; el.textContent = String(v); return; }
  var r = el.getBoundingClientRect();
  if (r.bottom > 0 && r.top < vh()) {
    countTo(el, cur, v, ROLL_MS);
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
  } else { el.textContent = String(v); }
}

/* ---------- fast scroll flag ---------- */
/* Handover v2 (motion forced-layout, 29 Oct): no timer clears m-fast any more; the class is set and cleared only here, inside rAF,
   and the frame re-queues itself while the class is on. The position is read once, before any write, from a ScrollTimeline snapshot
   (no style or layout read) where the browser has one; elsewhere from pageYOffset. The scroll range for the snapshot is cached by a
   ResizeObserver (delivered after layout, so that read is clean too). */
var lastY = 0, lastT = 0, ticking = false, fastUntil = 0, scrollWired = false, stl = null, stlRange = 0;
function scrollPos() {
  if (stl) { var c = stl.currentTime; return (c && stlRange > 0) ? c.value / 100 * stlRange : 0; }
  return w.pageYOffset || 0;
}
function measureScroll() {
  ticking = false;
  var y = scrollPos(), t = now(), dt = t - lastT;
  if (dt > 0 && lastT && Math.abs(y - lastY) / dt > FAST_PX_MS) { fastUntil = t + FAST_HOLD; root.classList.add('m-fast'); }
  else if (fastUntil && t > fastUntil) { fastUntil = 0; root.classList.remove('m-fast'); }
  lastY = y; lastT = t;
  if (fastUntil && active && !ticking) { ticking = true; raf(guard(measureScroll)); }
}
function wireScroll() {
  if (scrollWired) { return; }
  scrollWired = true;
  try {
    if (w.ScrollTimeline && w.ResizeObserver) {
      stl = new w.ScrollTimeline({ source: d.scrollingElement || root, axis: 'block' });
      new w.ResizeObserver(function () { stlRange = Math.max(0, root.scrollHeight - w.innerHeight); }).observe(root);
    }
  } catch (e) { stl = null; }
  lastY = stl ? 0 : (w.pageYOffset || 0); lastT = now();
  w.addEventListener('scroll', function () { if (!active || ticking) { return; } ticking = true; raf(guard(measureScroll)); }, { passive: true });
}

/* ---------- pointer tilt (fine pointers only) ---------- */
var tiltHost = null, tiltTarget = null, tiltRaf = 0, tx = 0, ty = 0;
function tiltReset() { if (tiltTarget) { tiltTarget.style.transform = ''; } tiltHost = null; tiltTarget = null; }
function tiltApply() {
  tiltRaf = 0;
  if (!tiltTarget || !active) { return; }
  var r = tiltTarget.getBoundingClientRect();
  if (!r.width || !r.height) { return; }
  var nx = Math.max(-1, Math.min(1, (tx - (r.left + r.width / 2)) / (r.width / 2)));
  var ny = Math.max(-1, Math.min(1, (ty - (r.top + r.height / 2)) / (r.height / 2)));
  tiltTarget.style.transform = 'perspective(900px) rotateX(' + (-ny * TILT_MAX).toFixed(2) + 'deg) rotateY(' + (nx * TILT_MAX).toFixed(2) + 'deg)';
}
d.addEventListener('pointermove', guard(function (e) {
  if (!active || !yes(mqFine) || e.pointerType === 'touch') { return; }
  var host = e.target && e.target.closest ? e.target.closest('[data-motion~="tilt"]') : null;
  if (host !== tiltHost) { tiltReset(); if (host) { tiltHost = host; tiltTarget = host.querySelector('[data-tilt-target]') || host; } }
  if (!tiltHost) { return; }
  tx = e.clientX; ty = e.clientY;
  if (!tiltRaf) { tiltRaf = raf(guard(tiltApply)); }
}), { passive: true });
d.addEventListener('pointerout', function (e) { if (!e.relatedTarget) { tiltReset(); } });
w.addEventListener('blur', function () { tiltReset(); });

/* ---------- on / off ---------- */
function activate() {
  if (active) { return; }
  active = true;
  root.classList.add('motion-ok');
  if (!HAS_IO) { root.classList.add('m-ready'); revealAll(); return; }
  wireScroll();
  if (!booted) { boot(); } else { collect(d, true); }
}
function deactivate() {
  if (!active) { return; }
  active = false;
  root.classList.remove('motion-ok', 'm-fast');
  revealAll();
  tiltReset();
}
function evaluate() { if (!yes(mqReduce) && !saveData()) { activate(); } else { deactivate(); } }

var api = EF.motion = { version: VERSION, scan: scan, roll: roll, revealAll: revealAll };
try { Object.defineProperty(api, 'on', { get: function () { return active; }, enumerable: true }); } catch (e) { api.on = false; }
listen(mqReduce, guard(evaluate));
try { if (navigator.connection && navigator.connection.addEventListener) { navigator.connection.addEventListener('change', guard(evaluate)); } } catch (e) { }
w.addEventListener('beforeprint', guard(revealAll));
if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', guard(evaluate)); } else { evaluate(); }
})();
