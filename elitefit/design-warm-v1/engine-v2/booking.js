/* Elite Fit group fitness · engine-v2 · booking.js · v1.2.1 (29 Oct 2026; 1.0 the fork, 1.1 the class finder, 1.2 strip, focus, a11y; 1.2.1 faces, stock label, .ef-vh, observers)
   Shared booking sheet for the concept pages. Forked from variants/s3-home-v2/assets/js/booking.js (Home v2 final, 28 Oct 2026).
   Behaviour is Home v2's: below 1024 px a modal bottom sheet (inert page, scroll lock, Tab trap, drag to close); from 1024 px a
   non-modal side panel (no aria-modal, no trap, Esc closes); focus returns to the opening Book. Step 1 "Who and how": coach
   header, invitation line (Sample), the full verbatim review, four tiles (a tap selects and goes on, nothing preselected).
   Step 2 "Your details": one-line 56 px strip, full name + WhatsApp (members: WhatsApp only), Pay now | Pay at reception
   (equal, never preselected or remembered), one Confirm; .is-typing compact foot with keepPayInView(). Pay demo, Confirmed.
   engine-v2 changes (README.md "Differences"): concept-agnostic config (EF.engine), data-step / data-steps on #sheet (optional
   hidden numerals in the step label: stepNumerals), {join} accepted as an alias of {pass}, the progress element is hidden,
   #schedule as a fallback for #week, RULINGS #27 in placeReview (all four tiles in view on open).
   Demo only: EF.api.ENDPOINT is null, EF.api.submit() resolves locally; nothing is charged or sent. Vanilla ES5, one IIFE.
   Strings: COPY.md v1.1 (SHEET.* slots), verbatim. */
(function (win, doc) {
'use strict';
var EF = win.EF = win.EF || {};
if (EF.sheet) { return; }

/* Payment default for a first-timer. Raoul, 28 Oct 2026: equal choice, nothing preselected. 'now' | 'reception' | null */
var DEFAULT_PAY = null;

function A() { return EF.api; }
var root = doc.documentElement;
/* ---------- engine-v2 config (EF.engine from api.js; data-* on this script tag also count) ---------- */
var CFG = (function () {
  var c = {}, src = (EF.engine && EF.engine.config) || {}, k, me = doc.currentScript, ds = (me && me.dataset) || {};
  for (k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { c[k] = src[k]; } }
  if (ds.stepNumerals !== undefined) { c.stepNumerals = ds.stepNumerals; }
  return c;
})();
function flagOn(v) { return v !== undefined && v !== null && v !== false && !/^(false|0|off|no)$/i.test(String(v)); }
var STEP_NUM = flagOn(CFG.stepNumerals);
/* step attributes (FINDER-SPEC 6.3): data-step is the logical step (0 = every finder screen, 1, 2, pay, done), data-steps the
   journey length (finder journey 3, class and pass journeys 2), data-step-pos the 1-based position (removed on pay and done),
   data-entry how the journey started (finder | class | pass), data-finder which finder screen. Coach and filters get none. */
var FINDER_KINDS = { finder: 'mode', 'finder-day': 'day', 'finder-class': 'class', 'finder-sessions': 'sessions', 'finder-week': 'week' };
var LOGICAL = { step1: '1', step2: '2', pay: 'pay', done: 'done' };
var curStep = null;
function isFinder(kind) { return Object.prototype.hasOwnProperty.call(FINDER_KINDS, kind || ''); }
function extend(a, b) { var o = {}, k; for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) { o[k] = a[k]; } } for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) { o[k] = b[k]; } } return o; }
/* the journey part of a view's params; class, details, pay and done inherit it so the numbers and the Back arrow survive Back, Forward and reload */
function jpOf(p) { p = p || {}; return { entry: p.entry || null, mode: p.mode || null, src: p.src || null, pass: p.pass || null }; }

/* ---------- copy (COPY.md v1.1, booking sheet) ---------- */
var T = {
  joinLegend: 'How are you joining?',
  opt: {
    member: ["I'm a member", 'Book with your WhatsApp number'],
    'class-1': ['Class drop-in', '300K, one class, no gym floor'],
    membership: ['Membership', 'From 2.2M / 4 weeks, every class included'],
    duo: ['Duo day pass', '225K each, two of you, all day']
  },
  duoShort: 'Needs 2 spots free. This class has 1 spot free.',
  membershipH: ['Which ', 'membership', ' suits you?'],
  tiers: {
    'perform-4w': { name: 'Perform 4 weeks', price: '2.2M', line: 'Gym, outdoor area and every class' },
    'elite-4w': { name: 'Elite 4 weeks', price: '2.7M', badge: 'Most popular', line: 'Everything in Perform, plus Recharge' }
  },
  membershipStart: 'Your membership starts on the class date, with this class. Every class after that is included.',
  detailsLegend: 'Your details',
  fName: 'Full name', hName: 'So the front desk can find your booking.',
  fWa: 'WhatsApp', hWa: 'Include your country code, like +61 or +44.',
  payLegend: 'When would you like to pay?',
  payNow: ['Pay now', 'Before you arrive'], payReception: ['Pay at reception', 'When you arrive'],
  ctaReception: 'Confirm booking', ctaMembership: 'Confirm membership start', ctaWaitlist: 'Join the waitlist', ctaMember: 'Book with my membership',
  payDemoH: ['Pay for your ', 'booking'], payDemoLine: "On the live page, the club's payment partner opens here for {total}.", payDemoLabel: 'Demo, no payment taken',
  privacy: 'We use your name and WhatsApp only for this booking and a reminder. Demo: nothing is sent.',
  remember: "We'll remember your details on this device.",
  bookingAs: 'Booking as', notYou: 'Not you?',
  memberLead: 'Members book with their WhatsApp number.', memberNote: "Demo: we don't check memberships.", memberIncluded: 'Included in your membership',
  waitlistLead: "This class is full. Join the waitlist and we'll WhatsApp you if a spot opens up.",
  yourCoach: 'Your coach', about: 'About this class',
  err: {
    name: 'Please add your full name so the front desk can find you.',
    wa: 'Please add your WhatsApp number so we can reach you.',
    wa62: 'Numbers starting with 0 need a country code, like +62.',
    pay: 'Please choose Pay now or Pay at reception.',
    summary: 'Please check the highlighted fields, then confirm again.',
    started: 'This class has just started. Here are the next ones.',
    network: "We couldn't reach the club. Your details are safe here. Try again, or send it on WhatsApp."
  },
  doneLead: 'Your coach is saving you a spot.', doneLeadWait: "We'll WhatsApp you if a spot opens.",
  labels: { cls: 'Class', when: 'When', where: 'Where', booking: 'Booking', pay: 'Payment', ref: 'Ref' },
  arrive: 'Arrive 10 minutes early and say hi at the desk.',
  ctaIcs: 'Add to calendar', ctaShare: 'WhatsApp your +1', ctaDirections: 'Get directions', ctaForget: 'Forget my details',
  toast: { switched: 'Switched to {class} at {time}.', forgotten: 'Your details are forgotten on this device.', started: "That class just started. Here's the next one.", notfound: "We couldn't find that class. Pick another below." }
};

/* ---------- the free-spots seat row (Raoul, 28 Oct): one dot per place, FREE dots solid and first, taken dots as rings.
   Always with the label "N spots free" / "1 spot free" / "Full · Join waitlist"; screen readers hear "N of C spots free".
   Over 12 places the dots sit in groups of 5. Never terracotta, never a % bar. Capacity is Sample (data overlay). ---------- */
function spotsLabel(free) { return free <= 0 ? 'Full · Join waitlist' : (free === 1 ? '1 spot free' : free + ' spots free'); }
function seatsHtml(free, cap, opts) {
  opts = opts || {};
  var i, out = '', group = cap > 12, n = Math.max(0, Math.min(free, cap));
  for (i = 0; i < cap; i++) {
    if (group && i > 0 && i % 5 === 0) { out += '<b class="seat-gap"></b>'; }
    out += '<i class="seat' + (i < n ? ' seat--free' : '') + (opts.mine && i >= n && i < n + opts.mine ? ' seat--mine' : '') + '" style="--s:' + i + '"></i>';
  }
  var lbl = opts.label || spotsLabel(free);
  var num = /^\d+/.exec(lbl);
  var vis = num ? '<b>' + num[0] + '</b>' + lbl.slice(num[0].length) : lbl;
  return '<span class="seatrow' + (free <= 0 ? ' seatrow--full' : '') + '" data-free="' + free + '" data-cap="' + cap + '">' +
    '<span class="seats" aria-hidden="true">' + out + '</span>' +
    '<span class="seatrow__lbl" aria-hidden="true">' + vis + '</span>' +
    '<span class="vh ef-vh">' + (opts.sr || (free <= 0 ? 'Full, ' + cap + ' of ' + cap + ' spots taken. Join the waitlist.' : free + ' of ' + cap + ' spots free')) + '</span></span>';
}
EF.seats = { html: seatsHtml, label: spotsLabel };

/* ---------- tiny DOM helpers ---------- */
function add(el, kids) {
  var i;
  if (kids === undefined || kids === null || kids === false) { return; }
  if (Object.prototype.toString.call(kids) === '[object Array]') { for (i = 0; i < kids.length; i++) { add(el, kids[i]); } }
  else if (typeof kids === 'string' || typeof kids === 'number') { el.appendChild(doc.createTextNode(String(kids))); }
  else { el.appendChild(kids); }
}
function h(tag, props, kids) {
  var el = doc.createElement(tag), key, v, ev;
  if (props) {
    for (key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) { continue; }
      v = props[key];
      if (v === null || v === undefined || v === false) { continue; }
      if (key === 'cls') { el.className = v; }
      else if (key === 'text') { el.textContent = v; }
      else if (key === 'on') { for (ev in v) { if (Object.prototype.hasOwnProperty.call(v, ev)) { el.addEventListener(ev, v[ev]); } } }
      else { el.setAttribute(key, v === true ? '' : String(v)); }
    }
  }
  add(el, kids);
  return el;
}
function q(sel, rootEl) { return (rootEl || doc).querySelector(sel); }
function qa(sel, rootEl) { return Array.prototype.slice.call((rootEl || doc).querySelectorAll(sel)); }
function sampleChip() { return h('span', { cls: 'sample', 'data-wc': 'skip', text: 'Sample' }); }
function arrow() { return h('span', { cls: 'arr', 'aria-hidden': 'true', text: '→' }); }
function tWord(w) { return h('span', { cls: 't', text: w }); }
function fire(name, detail) {
  var ev;
  try { ev = new win.CustomEvent(name, { detail: detail }); }
  catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
  doc.dispatchEvent(ev);
}
function mq(s) { try { return win.matchMedia(s); } catch (e) { return { matches: false, addEventListener: function () {} }; } }
var MQ_PANEL = mq('(min-width: 1024px)');
function isPanel() { return !!MQ_PANEL.matches; }
function motionOn() { return root.classList.contains('motion-ok'); }

/* ---------- toast ---------- */
var toastTimer = null;
EF.toast = function (text) {
  var el = q('[data-toast]');
  if (!el) { return; }
  el.textContent = text;
  el.hidden = false;
  win.clearTimeout(toastTimer);
  toastTimer = win.setTimeout(function () { el.hidden = true; }, 2800);
};

/* =====================================================================
   EF.sheet
   ===================================================================== */
var S = {};
var views = {};
var depth = 0;
var opened = false;
var modal = false;
var current = null;
var closeTimer = null;
var travTimer = null;
var pendingTraverse = false;
var queued = null;
var opener = null;
var openerKey = null;
var lastTrigger = null;
var lastTriggerAt = 0;
var savedY = 0;
var inertPrev = [];
var SRC_OF = { 'hero-book': 'hero', 'buybar-book': 'bar', 'hdr-book': 'header' };
var ENTRY_SEL = '[data-book-next], [data-use-pass], [data-duo-start]';
var PASS_OK = { 'class-1': 'class-1', duo: 'duo', membership: 'membership' };

function dom() {
  S.el = q('#sheet');
  S.panel = q('.sheet__panel', S.el);
  S.body = q('[data-sheet-body]', S.el);
  S.foot = q('[data-sheet-foot]', S.el);
  S.step = q('[data-sheet-step]', S.el);
  S.back = q('[data-sheet-back]', S.el);
  S.progress = q('[data-sheet-progress]', S.el);
  S.page = q('#page');
  S.buybar = q('[data-buybar]');
}
function lockScroll() {
  var b = doc.body;
  savedY = win.pageYOffset || root.scrollTop || 0;
  root.classList.add('sheet-open');
  root.style.overflowY = 'scroll';
  b.style.position = 'fixed'; b.style.top = (-savedY) + 'px'; b.style.left = '0'; b.style.right = '0'; b.style.width = '100%';
}
function unlockScroll() {
  var b = doc.body;
  root.classList.remove('sheet-open');
  root.style.overflowY = '';
  b.style.position = ''; b.style.top = ''; b.style.left = ''; b.style.right = ''; b.style.width = '';
  root.style.scrollBehavior = 'auto';
  win.scrollTo(0, savedY);
  root.style.scrollBehavior = '';
}
/* RULINGS #38: a sticky Now bar ([data-nowbar]) outside #page goes inert under the phone sheet, and the desktop panel starts below it */
function nowbar() { return q('[data-nowbar]'); }
/* engine-v2 1.2.1: the bar's geometry comes from an IntersectionObserver entry (re-armed by a ResizeObserver when the bar changes
   size), never from a layout read in a scroll handler. A sticky bar keeps its entry; a bar that scrolls away updates at each threshold. */
var nbRect = null, nbIO = null, nbRO = null, nbEl = null;
function watchNowbar() {
  var nb = nowbar();
  if (!nb || nb === nbEl || !win.IntersectionObserver) { return; }
  if (nbIO) { nbIO.disconnect(); } if (nbRO) { nbRO.disconnect(); }
  nbEl = nb;
  /* rootMargin -1px at the top: a sticky bar that becomes stuck at top 0 drops below ratio 1 and reports in (and again when it unsticks) */
  nbIO = new win.IntersectionObserver(function (es) { var e = es[es.length - 1], r = e.boundingClientRect; nbRect = { top: r.top, bottom: r.bottom, vis: e.isIntersecting }; syncTop(); }, { rootMargin: '-1px 0px 0px 0px', threshold: [0, 0.25, 0.5, 0.75, 0.99, 1] });
  nbIO.observe(nb);
  if (win.ResizeObserver) { nbRO = new win.ResizeObserver(function () { nbIO.unobserve(nb); nbIO.observe(nb); }); nbRO.observe(nb); }
}
function syncTop() {   /* writes only: uses the last observer entry */
  if (!S.el) { return; }
  var top = 0;
  if (opened && isPanel() && nbRect && nbRect.vis && nbRect.top <= 1) { top = Math.max(0, Math.round(nbRect.bottom)); }
  S.el.style.setProperty('--sheet-top', top + 'px');
}
function setInert(on) {
  var nb = nowbar(), list = [S.page, S.buybar, nb && S.page && !S.page.contains(nb) ? nb : null], i, el, rec;
  if (on) {
    inertPrev = [];
    for (i = 0; i < list.length; i++) {
      el = list[i];
      if (!el) { continue; }
      inertPrev.push({ el: el, aria: el.getAttribute('aria-hidden'), inert: el.hasAttribute('inert') });
      el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true');
    }
  } else {
    for (i = 0; i < inertPrev.length; i++) {
      rec = inertPrev[i];
      if (!rec.inert) { rec.el.removeAttribute('inert'); }
      if (rec.aria === null) { rec.el.removeAttribute('aria-hidden'); } else { rec.el.setAttribute('aria-hidden', rec.aria); }
    }
    inertPrev = [];
  }
}
/* modal below 1024 px, non-modal side panel from 1024 px; re-applied when the width crosses 1024 while open */
function applyMode() {
  if (!opened) { return; }
  var panel = isPanel();
  if (panel && modal) { setInert(false); unlockScroll(); modal = false; }
  if (!panel && !modal) { lockScroll(); setInert(true); modal = true; }
  if (panel) { S.panel.removeAttribute('aria-modal'); } else { S.panel.setAttribute('aria-modal', 'true'); }   /* rulings #20 */
  root.classList.toggle('has-panel', panel);
  S.el.classList.toggle('is-panel', panel);
}
function captureOpener() {
  var a = doc.activeElement;
  var fresh = lastTrigger && (Date.now() - lastTriggerAt < 1500) && root.contains(lastTrigger);
  opener = fresh ? lastTrigger : ((a && a !== doc.body && a !== root) ? a : lastTrigger);
  openerKey = null;
  if (opener && opener.closest) {
    var r = opener.closest('[data-occ]');
    openerKey = { id: opener.id || '', tid: opener.getAttribute('data-testid') || '', cls: (opener.classList && opener.classList[0]) || '', occ: r ? r.getAttribute('data-occ') : '' };
  }
}
function shown(el) {
  if (!el || !root.contains(el) || el.closest('[hidden], [inert], [aria-hidden="true"]') || !el.getClientRects().length) { return false; }
  var cs = win.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}
function restoreFocus() {
  var el = opener;
  if (el && !shown(el)) {
    el = null;
    if (openerKey) {
      if (openerKey.occ) {   /* engine-v2 1.2: the same control in the re-rendered row (its Book), not the row's first button */
        var sc = '[data-occ="' + openerKey.occ + '"]';
        if (openerKey.tid) { el = q(sc + ' [data-testid="' + openerKey.tid + '"]') || q(sc + '[data-testid="' + openerKey.tid + '"]'); }
        if (!el && openerKey.cls && /^[A-Za-z_][\w-]*$/.test(openerKey.cls)) { el = q(sc + ' .' + openerKey.cls) || q(sc + '.' + openerKey.cls); }
        if (!el) { el = q(sc + ' button') || q(sc); }
      }
      if (!el && openerKey.id) { el = doc.getElementById(openerKey.id); }
      if (!el && openerKey.tid) { el = q('[data-testid="' + openerKey.tid + '"]'); }
    }
  }
  if (!el || !shown(el)) { el = q('[data-testid="hero-book"]') || doc.getElementById('schedule'); }
  if (el && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  opener = null;
}
function showSheet() {
  win.clearTimeout(closeTimer);
  if (opened) { return; }
  opened = true;
  captureOpener();
  S.el.hidden = false;
  modal = false;
  applyMode();
  watchNowbar();
  syncTop();
  void S.panel.offsetWidth;
  S.el.classList.add('is-open');
}
function hideSheet() {
  if (!opened) { return; }
  opened = false;
  var kind = current ? current.kind : '';
  S.el.classList.remove('is-open', 'has-kb');
  S.el.style.setProperty('--kb', '0px');
  S.panel.style.transform = '';
  root.classList.remove('has-panel');
  if (modal) { setInert(false); unlockScroll(); modal = false; }
  current = null;
  curStep = null;
  win.clearTimeout(closeTimer);
  closeTimer = win.setTimeout(function () {
    if (opened) { return; }
    S.el.hidden = true;
    S.el.classList.remove('is-panel');
    ['data-step', 'data-steps', 'data-step-pos', 'data-entry', 'data-finder', 'data-pass'].forEach(function (a) { S.el.removeAttribute(a); });
    S.body.innerHTML = '';
    S.foot.innerHTML = '';
  }, 400);
  fire('ef:sheet', { open: false, kind: kind, occId: null });
  /* the page first re-evaluates its bars (the sticky bar comes back), then focus returns to the opener or falls back */
  var raf = win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 16); };
  raf(function () { if (!opened) { restoreFocus(); } });
}
/* engine-v2: data-step / data-steps on the sheet root for numbered views (step 1, step 2, pay demo, Confirmed = 2 of 2);
   removed for coach, filters and other views. With stepNumerals on, a hidden "01 / 02" also goes into the step label, so
   label parsers (/(\d+)\D+(\d+)/) keep working; it is never shown or read out. */
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function sattr(name, val) { if (val === null || val === undefined || val === '') { S.el.removeAttribute(name); } else { S.el.setAttribute(name, String(val)); } }
function setStep(kind, v, p) {
  var fin = isFinder(kind), logical = fin ? '0' : (LOGICAL[v.mode] || ''), entry = (p && p.entry) || 'class';
  var steps = entry === 'finder' ? 3 : 2, pos = 0;
  if (logical === '0') { pos = 1; }
  else if (logical === '1') { pos = entry === 'class' ? 1 : 2; }
  else if (logical === '2') { pos = entry === 'finder' ? 3 : 2; }
  sattr('data-step', logical || null);
  sattr('data-steps', logical ? steps : null);
  sattr('data-step-pos', pos || null);
  sattr('data-entry', logical ? entry : null);
  sattr('data-finder', fin ? FINDER_KINDS[kind] : null);
  sattr('data-pass', logical && p && p.pass ? p.pass : null);
  curStep = logical ? { step: logical, steps: steps, pos: pos || null, entry: entry, finder: fin ? FINDER_KINDS[kind] : null } : null;
  if (pos && STEP_NUM && S.step) { S.step.appendChild(h('span', { 'data-step-numeral': '', hidden: true, text: pad2(pos) + ' / ' + pad2(steps) })); }
}
function renderView(kind, params, dir, guard) {
  var f = views[kind], v, r, t;
  if (!f) { return false; }
  v = f(params || {}, dir);
  if (!v) { return false; }
  if (v.redirect) {
    if ((guard || 0) > 2) { return false; }
    r = v.redirect;
    try { win.history.replaceState({ ef: 'gf2', kind: r.kind, params: r.params, d: depth }, '', r.url || win.location.href); } catch (e) {}
    return renderView(r.kind, r.params, dir, (guard || 0) + 1);
  }
  current = { kind: kind, params: params, view: v };
  S.step.textContent = v.label || '';
  S.el.setAttribute('data-kind', kind);
  S.el.setAttribute('data-mode', v.mode || '');
  setStep(kind, v, params || {});
  S.el.classList.toggle('sheet--tall', v.tall !== false);
  S.body.innerHTML = '';
  S.foot.innerHTML = '';
  v.render(S.body, S.foot);
  S.body.classList.remove('step-in', 'step-back', 'step-swap');
  if (dir === 'fwd' || dir === 'back' || dir === 'swap') {
    void S.body.offsetWidth;
    S.body.classList.add(dir === 'back' ? 'step-back' : (dir === 'swap' ? 'step-swap' : 'step-in'));
  }
  S.body.scrollTop = 0;
  S.back.hidden = depth <= 1 || !!v.noBack;
  try { if (EF.media && EF.media.scan) { EF.media.scan(S.body); } } catch (e1) {}
  try { if (EF.motion && EF.motion.scan) { EF.motion.scan(S.body); } } catch (e2) {}
  t = q('#sheet-title', S.body);
  if (t && curStep && curStep.pos) { t.appendChild(h('span', { cls: 'vh ef-vh', 'data-step-sr': '', text: ', step ' + curStep.pos + ' of ' + curStep.steps })); }
  var bt = dir === 'back' && params && params.back ? backTarget(params.back) : null;
  if (bt) { try { bt.focus({ preventScroll: true }); } catch (e4) { bt.focus(); } if (bt.scrollIntoView) { try { bt.scrollIntoView({ block: 'nearest' }); } catch (e5) { bt.scrollIntoView(); } } }
  else if (t) { t.setAttribute('tabindex', '-1'); try { t.focus({ preventScroll: true }); } catch (e3) { t.focus(); } }
  fire('ef:sheet', { open: true, kind: kind, occId: (params && params.occId) || null, panel: isPanel() });
  return true;
}
/* the control that led forward from this screen, kept in its history state, gets focus again on Back (FINDER-SPEC 6.1) */
function backTarget(b) {
  var sel = '[data-testid="' + b.testid + '"]' + (b.occ ? '[data-occ="' + b.occ + '"]' : '') + (b.cls ? '[data-class="' + b.cls + '"]' : '');
  try { return q(sel, S.body); } catch (e) { return null; }
}
function setParams(patch, url) {
  if (!current) { return; }
  current.params = extend(current.params || {}, patch);
  try { win.history.replaceState({ ef: 'gf2', kind: current.kind, params: current.params, d: depth }, '', url || win.location.href); } catch (e) {}
}
function rememberBack(b) { setParams({ back: b }); }
function announce(text) { if (!S.live) { return; } S.live.textContent = ''; win.setTimeout(function () { S.live.textContent = text; }, 60); }
function navigate(mode, kind, params, url, quiet, dir) {
  if (!views[kind]) { return false; }
  if (pendingTraverse) { queued = function () { navigate(mode, kind, params, url, quiet, dir); }; return true; }
  var wasOpen = opened;
  if (!wasOpen) { depth = 0; }
  var replacing = mode === 'replace' && wasOpen;
  var d = replacing ? depth : depth + 1;
  var st = { ef: 'gf2', kind: kind, params: params, d: d };
  try {
    if (replacing) { win.history.replaceState(st, '', url || win.location.href); }
    else { win.history.pushState(st, '', url || win.location.href); }
  } catch (e) {}
  depth = d;
  if (!wasOpen) { showSheet(); }
  if (!quiet) { renderView(kind, params, dir || (wasOpen ? 'fwd' : 'none')); }
  return true;
}
function flushQueue() { var fn = queued; queued = null; if (fn) { fn(); } }
function closeSheet() {
  if (!opened) { return; }
  var d = depth;
  depth = 0;
  hideSheet();
  if (d > 0) {
    pendingTraverse = true;
    win.clearTimeout(travTimer);
    travTimer = win.setTimeout(function () { pendingTraverse = false; flushQueue(); }, 700);
    try { win.history.go(-d); } catch (e) { pendingTraverse = false; }
  }
}
function backSheet() { if (depth > 1) { win.history.back(); } else { closeSheet(); } }

function focusables() {
  var nodes = S.panel.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'), out = [], i, el;
  for (i = 0; i < nodes.length; i++) {
    el = nodes[i];
    if (el.disabled || el.getAttribute('tabindex') === '-1') { continue; }
    if (el.getClientRects().length === 0) { continue; }
    if (win.getComputedStyle(el).visibility === 'hidden') { continue; }
    out.push(el);
  }
  return out;
}
function tabStops() {
  var all = focusables(), out = [], hasChecked = {}, seen = {}, i, el, key;
  for (i = 0; i < all.length; i++) { el = all[i]; if (el.type === 'radio' && el.name && el.checked) { hasChecked[el.name] = true; } }
  for (i = 0; i < all.length; i++) {
    el = all[i];
    if (el.type === 'radio' && el.name) {
      key = el.name;
      if (hasChecked[key] ? !el.checked : seen[key]) { continue; }
      seen[key] = true;
    }
    out.push(el);
  }
  return out;
}
function trapTab(e) {
  var stops = tabStops(), a = doc.activeElement, target = null, i;
  e.preventDefault();
  if (!stops.length) { S.panel.focus(); return; }
  if (a && S.panel.contains(a) && a !== S.panel) {
    var idx = stops.indexOf(a);
    if (idx >= 0) { target = stops[(idx + (e.shiftKey ? stops.length - 1 : 1)) % stops.length]; }
    else if (e.shiftKey) {
      for (i = stops.length - 1; i >= 0; i--) { if (a.compareDocumentPosition(stops[i]) & 2) { target = stops[i]; break; } }
      target = target || stops[stops.length - 1];
    } else {
      for (i = 0; i < stops.length; i++) { if (a.compareDocumentPosition(stops[i]) & 4) { target = stops[i]; break; } }
      target = target || stops[0];
    }
  } else { target = e.shiftKey ? stops[stops.length - 1] : stops[0]; }
  target.focus();
}
function initDrag() {
  var bar = q('.sheet__bar', S.panel), startY = 0, dy = 0, startT = 0, dragging = false, hgt = 1;
  if (!bar || !win.PointerEvent) { return; }
  bar.addEventListener('pointerdown', function (e) {
    if (isPanel()) { return; }
    if (e.pointerType === 'mouse' && e.button !== 0) { return; }
    if (e.target.closest && e.target.closest('button')) { return; }
    dragging = true; startY = e.clientY; dy = 0; startT = Date.now(); hgt = S.panel.offsetHeight || 1;
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    S.panel.classList.add('is-drag');
  });
  bar.addEventListener('pointermove', function (e) {
    if (!dragging) { return; }
    dy = Math.max(0, e.clientY - startY);
    S.panel.style.transform = 'translateY(' + dy + 'px)';
  });
  function end() {
    if (!dragging) { return; }
    dragging = false;
    var v = dy / Math.max(1, Date.now() - startT);
    S.panel.classList.remove('is-drag');
    S.panel.style.transform = '';
    if (dy > hgt * 0.3 || (dy > 40 && v > 0.6)) { closeSheet(); }
  }
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
}

/* ----- on-screen keyboard: the foot rides on the keyboard, the focused field is centred, the pass list folds to one row ----- */
var kbTimers = [];
function textField(el) { return !!(el && el.tagName && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'checkbox' && el.type !== 'radio' && S.body && S.body.contains(el)); }
function centerField(el) {
  if (!opened || !textField(el) || isPanel()) { return; }
  var b = S.body.getBoundingClientRect(), r = el.getBoundingClientRect();
  var delta = (r.top - b.top) - (b.height - r.height) / 2;
  if (Math.abs(delta) > 1) { S.body.scrollTop += delta; }
  keepPayInView(el);
}
/* audit fix 5: with the keyboard up, the pay pair below the field stays in view too, as long as the field itself stays in view */
function keepPayInView(el) {
  var pay = q('.paybtns', S.body);
  if (!pay) { return; }
  var b = S.body.getBoundingClientRect(), r = el.getBoundingClientRect(), p = pay.getBoundingClientRect();
  if (p.top < r.bottom) { return; }
  var need = p.bottom - (b.bottom - 4), room = r.top - (b.top + 4);
  if (need > 0 && room > 0) { S.body.scrollTop += Math.min(need, room); }
}
function settleField() {
  var el = doc.activeElement, i;
  if (!textField(el)) { return; }
  for (i = 0; i < kbTimers.length; i++) { win.clearTimeout(kbTimers[i]); }
  kbTimers = [];
  centerField(el);
  kbTimers.push(win.setTimeout(function () { centerField(el); }, 120));
  kbTimers.push(win.setTimeout(function () { centerField(el); }, 380));
}
function syncKeyboard() {
  if (!opened) { return; }
  var vv = win.visualViewport, kb = 0;
  if (vv && !isPanel()) { kb = Math.max(0, Math.round(win.innerHeight - vv.height - vv.offsetTop)); }
  if (kb < 80) { kb = 0; }
  S.el.style.setProperty('--kb', kb + 'px');
  if (vv) { S.el.style.setProperty('--vvh', Math.round(vv.height) + 'px'); }
  S.el.classList.toggle('has-kb', kb > 0 && textField(doc.activeElement));
  settleField();
}

function initSheet() {
  dom();
  if (!S.el) { return; }
  if (S.progress) { S.progress.hidden = true; }   /* engine-v2: two steps, no progress bar (P7) */
  watchNowbar();   /* 1.2.1: watch the Now bar from the start, so its geometry is cached before the first open (no jump, no layout read) */
  /* FINDER-SPEC 6.1: one polite live region for in-screen changes; the step label stops announcing (the focused title does) */
  S.live = q('[data-sheet-live]', S.el);
  if (!S.live && S.panel) { S.live = h('p', { cls: 'vh ef-vh', 'data-sheet-live': '', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }); S.panel.appendChild(S.live); }
  if (S.step) { S.step.removeAttribute('aria-live'); }
  /* FINDER-SPEC v1.1 7.4: engine-v2 owns the entry buttons. [data-book-next] (hero, sticky bar, header) -> openFinder({src});
     [data-use-pass="class-1|duo|membership"] (price buttons) -> openFinder({pass, src:'prices'}); [data-duo-start] ("Get a Duo Day Pass")
     -> openFinder({pass:'duo', src:'offer'}). Pages drop their own handlers for these; a legacy one that still fires is ignored (openClass).
     Config bookNext:false opts out of all three. */
  if (flagOn(CFG.bookNext === undefined ? true : CFG.bookNext)) {
    doc.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest(ENTRY_SEL) : null, pass = null, src;
      if (!t || (S.panel && S.panel.contains(t)) || t.disabled) { return; }
      e.preventDefault();
      if (opened) { return; }   /* a generic CTA while the sheet is open does nothing (FINDER-SPEC 1.1) */
      if (t.hasAttribute('data-use-pass')) { pass = PASS_OK[t.getAttribute('data-use-pass')] || null; src = 'prices'; }
      else if (t.hasAttribute('data-duo-start')) { pass = 'duo'; src = 'offer'; }
      else { pass = PASS_OK[t.getAttribute('data-pass') || ''] || null; src = SRC_OF[t.getAttribute('data-testid')] || t.getAttribute('data-src') || 'page'; }
      openFinder({ src: src, pass: pass });
    });
  }
  S.body.addEventListener('focusin', function (e) { if (textField(e.target)) { S.el.classList.add('is-typing'); settleField(); win.setTimeout(syncKeyboard, 60); } });
  /* 1.2.1: leaving a field restores the full foot (total, privacy line), which moves Confirm. Never while a pointer is pressed in the sheet:
     a press that lasts past the 80 ms timer would land its release next to the moved button and the booking click would be lost. */
  var pressIn = false, typingOffPending = false;
  function typingOff() { if (!textField(doc.activeElement) || !S.body.contains(doc.activeElement)) { S.el.classList.remove('is-typing'); } syncKeyboard(); }
  function releasePress() { if (!pressIn) { return; } pressIn = false; if (typingOffPending) { typingOffPending = false; win.setTimeout(typingOff, 0); } }   /* after the click */
  S.panel.addEventListener('pointerdown', function () { pressIn = true; }, true);
  doc.addEventListener('pointerup', releasePress, true);
  doc.addEventListener('pointercancel', releasePress, true);
  S.body.addEventListener('focusout', function () { win.setTimeout(function () { if (pressIn) { typingOffPending = true; return; } typingOff(); }, 80); });
  if (win.visualViewport) {
    win.visualViewport.addEventListener('resize', syncKeyboard);
    win.visualViewport.addEventListener('scroll', syncKeyboard);
  }
  win.addEventListener('resize', function () { syncKeyboard(); applyMode(); syncTop(); });
  S.el.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) { return; }
    if (t.closest('[data-sheet-close]')) { closeSheet(); return; }
    if (t.closest('[data-sheet-back]')) { backSheet(); }
  });
  doc.addEventListener('keydown', function (e) {
    if (!opened) { return; }
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (!modal && e.target && e.target.closest && !S.panel.contains(e.target) && e.target.closest('input, select, textarea')) { return; }
      e.preventDefault(); closeSheet(); return;
    }
    if (e.key === 'Tab' && modal) { trapTab(e); }
    if (e.key === 'F6' && !modal) {
      e.preventDefault();
      if (S.panel.contains(doc.activeElement)) { var m = q('#week') || q('#schedule'); if (m) { m.focus(); } } else { var tt = q('#sheet-title', S.body); if (tt) { tt.focus(); } }
    }
  });
  doc.addEventListener('focusin', function (e) {
    var toastEl = q('[data-toast]');
    if (opened && modal && S.panel && !S.panel.contains(e.target) && !(toastEl && toastEl.contains(e.target))) {
      var t = q('#sheet-title', S.body);
      if (t) { t.focus(); } else { S.panel.focus(); }
    }
  });
  doc.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null;
    if (t && !(S.panel && S.panel.contains(t))) { lastTrigger = t; lastTriggerAt = Date.now(); }
  }, true);
  win.addEventListener('popstate', function (e) {
    var st = e.state;
    if (pendingTraverse) {
      pendingTraverse = false;
      win.clearTimeout(travTimer);
      depth = 0;
      flushQueue();
      return;
    }
    /* browser-back on Confirmed never shows the filled form again: it closes */
    if (opened && current && current.kind === 'done' && st && st.ef === 'gf2' && st.d < depth) {
      var rest = st.d;
      depth = 0;
      hideSheet();
      if (rest > 0) {
        pendingTraverse = true;
        travTimer = win.setTimeout(function () { pendingTraverse = false; flushQueue(); }, 700);
        try { win.history.go(-rest); } catch (er) { pendingTraverse = false; }
      }
      return;
    }
    if (st && st.ef === 'gf2' && views[st.kind]) {
      var dir = st.d < depth ? 'back' : 'fwd';
      var wasOpen = opened;
      depth = st.d;
      if (!wasOpen) { showSheet(); }
      renderView(st.kind, st.params, wasOpen ? dir : 'none');
    } else {
      depth = 0;
      if (opened) { hideSheet(); }
    }
  });
  initDrag();
}

EF.sheet = {
  register: function (kind, factory) { views[kind] = factory; },
  open: function (kind, params, url) { return navigate('push', kind, params, url); },
  replace: function (kind, params, url) { return navigate('replace', kind, params, url); },
  back: backSheet,
  close: closeSheet,
  isOpen: function () { return opened; },
  isPanel: function () { return opened && !modal; },
  kind: function () { return current ? current.kind : null; },
  params: function () { return current ? current.params : null; },
  step: function () { return opened && curStep ? extend(curStep, {}) : null; },
  /* v1 parity: re-render the current view in place */
  update: function () { if (opened && current) { return renderView(current.kind, current.params, 'none'); } return false; },
  live: announce
};

/* =====================================================================
   EF.booking
   ===================================================================== */
var COUNTRIES = [
  ['+62', 'Indonesia'], ['+61', 'Australia'], ['+64', 'New Zealand'], ['+65', 'Singapore'], ['+60', 'Malaysia'],
  ['+66', 'Thailand'], ['+63', 'Philippines'], ['+84', 'Vietnam'], ['+44', 'UK'], ['+353', 'Ireland'],
  ['+1', 'US/Canada'], ['+49', 'Germany'], ['+31', 'Netherlands'], ['+33', 'France'], ['+41', 'Switzerland'],
  ['+46', 'Sweden'], ['+47', 'Norway'], ['+45', 'Denmark'], ['+34', 'Spain'], ['+39', 'Italy'],
  ['+7', 'Russia'], ['+380', 'Ukraine'], ['+972', 'Israel'], ['+971', 'UAE'], ['+91', 'India'],
  ['+86', 'China'], ['+81', 'Japan'], ['+82', 'South Korea'], ['+55', 'Brazil'], ['+27', 'South Africa']
];
var CC_LIST = COUNTRIES.map(function (c) { return c[0]; });
var REGION_CC = { ID: '+62', AU: '+61', NZ: '+64', SG: '+65', MY: '+60', TH: '+66', PH: '+63', VN: '+84', GB: '+44', UK: '+44', IE: '+353', US: '+1', CA: '+1', DE: '+49', NL: '+31', FR: '+33', CH: '+41', SE: '+46', NO: '+47', DK: '+45', ES: '+34', IT: '+39', RU: '+7', UA: '+380', IL: '+972', AE: '+971', IN: '+91', CN: '+86', JP: '+81', KR: '+82', BR: '+55', ZA: '+27' };
var LETTER = (function () { try { return new RegExp('\\p{L}', 'gu'); } catch (e) { return /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ֐-ۿऀ-ॿ฀-๿぀-ヿ㐀-鿿가-힯]/g; } })();
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var TESTID = { member: 'join-member', 'class-1': 'pack-class-1', membership: 'join-membership', duo: 'join-duo', 'perform-4w': 'pack-perform-4w', 'elite-4w': 'pack-elite-4w' };
/* a compact country-code picker: shows "+62 ▾", the list shows country names */
function syncCc(g) { if (g && g.shown) { g.shown.textContent = g.sel.value; } }
var payloadView = /[?&]payload=1\b/.test(win.location.search);

function letters(s) { var m = String(s).match(LETTER); return m ? m.length : 0; }
function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
function defaultCc() {
  var lang = '';
  try { lang = (win.navigator.languages && win.navigator.languages[0]) || win.navigator.language || ''; } catch (e) {}
  var m = /[-_]([A-Za-z]{2})$/.exec(lang);
  return (m && REGION_CC[m[1].toUpperCase()]) || '+62';
}
function isTier(id) { return id === 'perform-4w' || id === 'elite-4w'; }
function cardOf(id) { return isTier(id) ? 'membership' : id; }
function titleOf(name) { var i = name.indexOf(' '); return i < 0 ? [tWord(name)] : [tWord(name.slice(0, i)), name.slice(i)]; }
function k(n) { return A().k(n); }
function t12(t) { return A().time12(t); }
function dayLong(o) { return A().dateLong(o.ymd); }
function hm(ms) { var w = A().wita(ms); return (w.hh < 10 ? '0' : '') + w.hh + ':' + (w.mm < 10 ? '0' : '') + w.mm; }

/* ---- the draft: one per visitor, kept across class swaps, reloads and Back (never lose input) ---- */
var OPTIONS = ['member', 'class-1', 'membership', 'duo'];
function getOcc(id) { var b = A().bookingFor(id); return (b && A().occById(id)) || A().occ(id); }
function readDraft() { return A().store.get().flow || null; }
function saveDraft(f) { A().store.set({ flow: f }); }
function passValid(id, occ) { if (!id) { return false; } if (id === 'duo') { return occ.spotsLeft >= 2; } return isTier(id) || id === 'member' || id === 'class-1'; }
function ensureDraft(occ, opts) {
  var st = A().store.get(), c = A().contact.get(), f = st.flow, fresh = !f;
  if (!f) {
    f = { occId: occ.id, pass: null, pay: null, name: '', cc: defaultCc(), phone: '', notYou: false, section: 'week' };
    if (c) { f.name = c.name || ''; f.cc = c.cc || f.cc; f.phone = c.phone || ''; }
  }
  f.occId = occ.id;
  if (opts && opts.src) { f.section = opts.src; }
  if (opts && opts.finderMode !== undefined) { f.finderMode = opts.finderMode || null; }
  var want = opts && opts.pass ? (opts.pass === 'membership' ? 'perform-4w' : opts.pass) : null;
  var last = c ? (c.member ? 'member' : ((st.lastPass === 'duo' || st.lastPass === 'class-1') ? st.lastPass : null)) : null;
  if (opts && opts.pass === 'membership') { want = 'membership'; }
  if (want && (want === 'membership' || passValid(want, occ))) { f.pass = want; }
  else if ((opts && opts.fromPage) || fresh) { f.pass = null; }   /* step 1 has no preselection (Raoul, 28 Oct) */
  if (f.pass && f.pass !== 'membership' && f.pass !== 'waitlist' && !passValid(f.pass, occ)) { f.pass = null; }
  if (fresh) { f.prefilled = false; f.pay = DEFAULT_PAY; }   /* rulings #15: the pay choice is never remembered or preselected */
  if (!f.pay) { f.pay = DEFAULT_PAY; }
  saveDraft(f);
  return f;
}
function totalOf(f) { var i = (f.pass && f.pass !== 'membership' && f.pass !== 'waitlist') ? A().passInfo(f.pass) : null; return i ? i.total : 0; }

/* ---- urls ---- */
function urlFor(kind, occId) {
  var parts = [], np = A().nowParam;
  if (kind === 'coach') { parts.push('coach=' + encodeURIComponent(occId)); }
  else { parts.push('class=' + encodeURIComponent(occId)); if (kind !== 'class') { parts.push('step=' + kind); } }
  if (np) { parts.push('now=' + encodeURIComponent(np).replace(/%3A/g, ':')); }
  if (payloadView) { parts.push('payload=1'); }
  return '?' + parts.join('&');
}
function goStep(step, occId) { EF.sheet.open(step, extend({ occId: occId }, jpOf(EF.sheet.params())), urlFor(step, occId)); }

/* ---- shared view bits ---- */
function primary(label, testid, onClick) {
  var b = h('button', { type: 'button', cls: 'btn btn--primary', 'data-testid': testid }, [h('span', { cls: 'btn__label', text: label }), ' ', arrow()]);
  b.addEventListener('click', onClick);
  return b;
}
function html(str) { var d = h('span'); d.innerHTML = str; return d.firstChild; }
/* sheet quotes: the coach invitation (COPY SHEET.coach.<class-id>, Sample until the coaches approve) and one REAL review
   tagged with this coach or class. No real review: nothing is shown. The hero uses class-general quotes, never these. */
function coachLine(occ) { var m = (A().data.coach_lines || {}), l = m[occ.classId]; return l ? l.replace('{time}', t12(occ.time)) : null; }
function coachReview(occ) {
  var list = (A().data.reviews || []).filter(function (r) { return r && r.text && r.tags && !r.tags.hero; }), i;
  for (i = 0; i < list.length; i++) { if ((list[i].tags.classes || []).indexOf(occ.classId) >= 0) { return list[i]; } }   /* this class first */
  for (i = 0; i < list.length; i++) { if (list[i].tags.coach === occ.coachId) { return list[i]; } }                          /* then this coach */
  return null;                                                                                                               /* none: show nothing */
}
function missingView() {
  return {
    label: '', testid: 'step-class', tall: false,
    render: function (body, foot) {
      body.appendChild(h('div', { cls: 'view', 'data-testid': 'step-class' }, [h('h2', { cls: 'sh-title', id: 'sheet-title', tabindex: '-1', text: "That class isn't on the timetable" }), h('p', { cls: 'sh-lead', text: T.toast.notfound })]));
      foot.appendChild(primary('Close', 'cta-book', closeSheet));
    }
  };
}
function pickAnother(occ) {
  var cp = EF.sheet.params();
  if (cp && (cp.entry === 'finder' || cp.entry === 'pass') && depth > 1) { backSheet(); return; }   /* FINDER-SPEC 2.6 */
  closeSheet();
  var opts = { ymd: occ.ymd, family: occ.familyId, focusList: true }, landed = false;
  var land = function () {
    if (landed) { return; }
    landed = true;
    win.removeEventListener('popstate', land);
    win.setTimeout(function () { if (EF.schedule && EF.schedule.show) { EF.schedule.show(opts); } }, 40);
  };
  if (pendingTraverse) { win.addEventListener('popstate', land); win.setTimeout(land, 750); } else { land(); }
}
function otherTimes(occ, cls) {
  var list = A().nextOfClass(occ.classId, { n: 2, skip: occ.id, open: true }), box = h('div', { cls: 'sh-others' });
  list.forEach(function (o) {
    var lbl = (o.dayIndex === 0 ? 'Today' : (o.dayIndex === 1 ? 'Tomorrow' : A().dateShort(o.ymd))) + ' ' + t12(o.time);
    box.appendChild(h('button', { type: 'button', cls: 'chipbtn', 'data-testid': 'other-time', on: { click: function () { openClass(o.id, { swap: true }); } } }, [lbl, vhs(', switch to ' + o.cls.name + ', ' + dayLong(o) + ', ' + t12(o.time))]));
  });
  box.appendChild(h('button', { type: 'button', cls: 'link-t sh-pick', 'data-testid': 'pick-another', on: { click: function () { pickAnother(occ); } } }, [h('span', { text: 'Pick another time' }), ' ', arrow()]));
  if (cls) { box.className += ' ' + cls; }
  return box;
}

/* ---- fields ---- */
function field(id, label, hint, input) {
  var f = h('div', { cls: 'field', 'data-field': id });
  f.appendChild(h('label', { 'for': id, text: label }));
  if (hint) { f.appendChild(h('p', { cls: 'hint', id: id + '-hint', text: hint })); }
  f.appendChild(input);
  f.appendChild(h('p', { cls: 'err', id: 'err-' + id, 'aria-live': 'off' }));
  var inp = input.tagName === 'INPUT' ? input : q('input', input);
  if (hint && inp) { inp.setAttribute('aria-describedby', id + '-hint'); }
  return f;
}
function nameInput(val) { var i = h('input', { cls: 'input', id: 'f-name', name: 'name', type: 'text', autocomplete: 'name', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', 'aria-required': 'true', 'data-testid': 'f-name' }); i.value = val || ''; return i; }
function phoneGroup(cc, phone) {
  var sel = h('select', { cls: 'select', id: 'f-cc', name: 'cc', autocomplete: 'tel-country-code', 'data-testid': 'f-cc', 'aria-label': 'Country code' });
  COUNTRIES.forEach(function (c) { sel.appendChild(h('option', { value: c[0], text: c[1] + ' (' + c[0] + ')' })); });
  sel.value = cc; if (sel.value !== cc) { sel.value = '+62'; }
  var shown = h('span', { cls: 'cc__shown', 'aria-hidden': 'true', text: sel.value });
  var tel = h('input', { cls: 'input', id: 'f-phone', name: 'phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', enterkeyhint: 'done', 'aria-required': 'true', 'data-testid': 'f-phone' });
  tel.value = phone || '';
  var g = h('div', { cls: 'phone phone--cc' }, [h('div', { cls: 'selectwrap cc' }, [sel, shown]), tel]);
  g.sel = sel; g.tel = tel; g.shown = shown;
  return g;
}
function markBad(fieldEl, input, msg) {
  fieldEl.classList.add('is-bad');
  var e = q('.err', fieldEl); e.textContent = msg;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', e.id + (q('.hint', fieldEl) ? ' ' + q('.hint', fieldEl).id : ''));
}
function clearBad(fieldEl, input) {
  fieldEl.classList.remove('is-bad');
  input.removeAttribute('aria-invalid');
  var hint = q('.hint', fieldEl);
  if (hint) { input.setAttribute('aria-describedby', hint.id); } else { input.removeAttribute('aria-describedby'); }
}
function softHint(fieldEl, msg) {
  var s2 = q('.soft', fieldEl);
  if (!msg) { if (s2) { s2.parentNode.removeChild(s2); } return; }
  if (!s2) { s2 = h('p', { cls: 'soft', 'aria-live': 'polite' }); fieldEl.appendChild(s2); }
  s2.textContent = msg;
}
function normalisePhone(g) {
  var p = A().parsePhone(g.tel.value, CC_LIST);
  if (p.cc && p.cc !== g.sel.value) { g.sel.value = p.cc; }
  return p;
}

/* ---- busy state + submit ---- */
var busy = false;
function setBusy(btn, on) {
  busy = on;
  if (!btn) { return; }
  btn.disabled = on;
  btn.classList.toggle('is-busy', on);
  btn.setAttribute('aria-busy', on ? 'true' : 'false');
  qa('input, select', S.body).forEach(function (i) { if (on) { i.setAttribute('readonly', ''); } else { i.removeAttribute('readonly'); } });
}
function submitFlow(occ, f, extra, btn) {
  if (busy) { return; }
  setBusy(btn, true);
  var member = f.pass === 'member' && !extra.waitlist;
  if (extra.waitlist) { f = Object.assign ? Object.assign({}, f, { pass: null }) : f; }
  var flow = {
    occId: occ.id, pass: member ? 'member' : f.pass, pay: member ? null : f.pay, waitlist: !!extra.waitlist, member: member,
    name: extra.name !== undefined ? extra.name : f.name, cc: extra.cc || f.cc, phone: A().parsePhone(extra.phone !== undefined ? extra.phone : f.phone, CC_LIST).national,
    section: f.section, returning: !!extra.returning, finderMode: f.finderMode || null
  };
  var bk = A().book(flow);
  var pl = A().payload(bk, flow);
  A().submit(pl).then(function () {
    setBusy(btn, false);
    A().contact.set({ name: flow.name, cc: flow.cc, phone: flow.phone, member: !!flow.member });
    /* 1.2.1: closed (or moved on) while the booking was sending: never reopen the sheet; the booking stands, a toast says so */
    var cp = EF.sheet.params(), ck = EF.sheet.kind();
    if (!opened || !cp || cp.occId !== occ.id || (ck !== 'details' && ck !== 'pay')) { EF.toast((flow.waitlist ? 'On the waitlist: ' : 'Booked: ') + occ.cls.name + ', ' + A().dateShort(occ.ymd) + ' ' + t12(occ.time) + '.'); return; }
    EF.sheet.replace('done', extend({ occId: occ.id }, jpOf(cp)), urlFor('done', occ.id));
  }, function () {
    setBusy(btn, false);
    var ban = q('[data-banner]', S.body);
    if (ban) { ban.hidden = false; ban.textContent = T.err.network; }
  });
}

/* ---------------- step 1 "Who and how": coach hero, the coach's quote, one real review, four big tiles (a tap selects and goes on) ---------------- */
var TILES = [
  { id: 'member', name: "I'm a member", price: 'Included in your plan' },
  { id: 'class-1', name: 'Class drop-in', price: '300K', badge: 'Most chosen', label: 'Class drop-in, 300K, most chosen' }, /* Raoul 28 Oct (images/14.png): highlighted, never preselected; "Most chosen" is Sample until the club confirms */
  { id: 'membership', name: 'Membership', price: 'from 2.2M / 4 weeks' },
  { id: 'duo', name: 'Duo day pass', price: '225K each' }
];
var GMARK = '<svg class="gmark" viewBox="0 0 48 48" width="14" height="14" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
function freeDots(free) {
  var i, out = '';
  for (i = 0; i < Math.max(0, free); i++) { out += '<i class="seat seat--free" style="--s:' + i + '"></i>'; }
  var lbl = spotsLabel(free), m = /^\d+/.exec(lbl);
  return '<span class="seatrow seatrow--free" data-free="' + free + '"><span class="seats" aria-hidden="true">' + out + '</span><span class="seatrow__lbl" aria-hidden="true">' + (m ? '<b>' + m[0] + '</b>' + lbl.slice(m[0].length) : lbl) + '</span><span class="vh ef-vh">' + (free <= 0 ? 'Full. Join the waitlist.' : free + ' spots free') + '</span></span>';
}
/* responsive variants for the photos the sheet draws (assets/data/v2.json "srcset", written by srcset_v11.py) */
function ssFor(src) { var m = (A().data && A().data.srcset) || {}, k = String(src || '').split('/').pop(); return m[k] || null; }
function whenShort(occ) { return A().dateShort(occ.ymd).split(' ')[0] + ' ' + t12(occ.time); }
var SHORT = { 'hyrox-conditioning': 'HYROX', 'off-court-training': 'Off-Court', 'injury-prevention-mobility': 'Injury Prevention' };
function shortName(occ) { return SHORT[occ.classId] || occ.cls.name; }
function coachHero(occ, mode) {
  var co = occ.coach, line = coachLine(occ), rev = coachReview(occ);
  var wrap = h('div', { cls: 'coachwrap' });
  wrap.appendChild(h('div', { cls: 'coachhead' }, [
    h('span', { cls: 'coachhead__photo', 'data-coach': co.id }, h('img', { src: co.photo, srcset: ssFor(co.photo), sizes: '(min-width: 1024px) 252px, 190px', alt: co.name + ', coach at Elite Fit', width: '600', height: '750' })),
    h('div', { cls: 'coachhead__txt' }, [
      h('p', { cls: 'coachhead__k', text: T.yourCoach }),
      h('h2', { cls: 'coachhead__name', id: 'sheet-title', tabindex: '-1' }, [co.name, h('span', { cls: 'vh ef-vh', text: ', ' + occ.cls.name + ', ' + dayLong(occ) + ', ' + t12(occ.time) })]),
      h('p', { cls: 'coachhead__cls', id: 'sheet-sum' }, [h('b', { text: occ.cls.name }), ' · ' + whenShort(occ)]),
      h('div', { cls: 'coachhead__seats' }, html(freeDots(mode === 'waitlist' ? 0 : occ.spotsLeft)))
    ])
  ]));
  if (line) { wrap.appendChild(h('blockquote', { cls: 'coachhead__say' }, [h('p', null, ['“' + line + '”', sampleChip()]), h('cite', { cls: 'vh ef-vh', text: co.name + ', your coach' })])); }
  if (rev) {
    /* Raoul 28 Oct: the WHOLE Google review, verbatim (rev.full = its paragraphs from the raw Maps data), larger and dark, in s3-home's quote
       order: the reviewer's own stars, the text, the attribution on its own line. No box. A review too long to leave the first row of tiles
       in view moves under the tiles (placeReview). */
    var paras = rev.full && rev.full.length ? rev.full : [rev.text], last = paras.length - 1;
    var bq = h('blockquote', { cls: 'coachhead__text' }, paras.map(function (t1, i) { return h('p', null, (i === 0 ? '“' : '') + t1 + (i === last ? '”' : '')); }));
    var cite = h('figcaption', { cls: 'coachhead__cite' }); cite.innerHTML = GMARK + ' ' + rev.by.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    wrap.appendChild(h('figure', { cls: 'coachhead__rev', 'data-review': rev.id || '' }, [
      h('p', { cls: 'coachhead__stars' }, [h('span', { 'aria-hidden': 'true', text: '★★★★★' }), h('span', { cls: 'vh ef-vh', text: '5 stars' })]),
      bq, cite
    ]));
  }
  return wrap;
}
/* RULINGS #27 (engine-v2): all four tiles in view on open (390x844). If the full review pushes ANY tile row below the sheet's visible
   bottom, first try the 96x120 compact portrait (.is-compact); if a row is still out of view, the review moves under the tiles
   (.is-after) and the 112x140 portrait comes back when the tiles still fit with it (RULINGS #26: 96x120 only when needed). */
function placeReview(wrap) {
  var rv = q('.coachhead__rev', wrap), tiles = qa('.jtile', wrap), anchor;
  if (!rv || !tiles.length || !wrap.parentNode || rv.classList.contains('is-after')) { return; }
  if (!S.body.getBoundingClientRect().height) { return; }
  function fits() {
    var bottom = S.body.getBoundingClientRect().bottom - 8, i;
    for (i = 0; i < tiles.length; i++) { if (tiles[i].getBoundingClientRect().bottom > bottom) { return false; } }
    return true;
  }
  if (fits()) { return; }
  if (!wrap.classList.contains('is-compact')) {
    wrap.classList.add('is-compact');
    if (fits()) { return; }
  }
  anchor = q('.joining', wrap) || tiles[tiles.length - 1];
  anchor.parentNode.insertBefore(rv, anchor.nextSibling);
  rv.classList.add('is-after');
  wrap.classList.remove('is-compact');
  if (!fits()) { wrap.classList.add('is-compact'); }
}
function viewClass(p) {
  var occ = getOcc(p.occId);
  if (!occ) { return missingView(); }
  if (A().bookingFor(occ.id)) { return { redirect: { kind: 'done', params: extend({ occId: occ.id }, jpOf(p)), url: urlFor('done', occ.id) } }; }
  var f = ensureDraft(occ, p);
  var mode = occ.full ? 'waitlist' : 'guest';
  return {
    label: mode === 'waitlist' ? 'Waitlist' : 'Book a class', mode: 'step1', testid: 'step-class', noBack: !(p.entry === 'finder' || p.entry === 'pass'),   /* FINDER-SPEC 2.6: Back to the finder screen */
    render: function (body, foot) {
      var wrap = h('div', { cls: 'view view--step1', 'data-testid': 'step-class', 'data-mode': mode });
      wrap.appendChild(coachHero(occ, mode));
      if (mode === 'waitlist') {
        wrap.appendChild(h('p', { cls: 'sh-lead' }, [T.waitlistLead, sampleChip()]));
        var wl = h('button', { type: 'button', cls: 'jtile jtile--wide', 'data-testid': 'join-waitlist' }, [h('span', { cls: 'jtile__name', text: T.ctaWaitlist }), h('span', { cls: 'jtile__go', 'aria-hidden': 'true', text: '›' })]);
        wl.addEventListener('click', function () { f.pass = 'waitlist'; saveDraft(f); goStep('details', occ.id); });
        wrap.appendChild(wl);
        wrap.appendChild(otherTimes(occ));
      } else {
        var fs = h('div', { cls: 'joining', role: 'group', 'aria-labelledby': 'join-h' }, h('p', { cls: 'group__legend', id: 'join-h', text: T.joinLegend }));
        var grid = h('div', { cls: 'jtiles' });
        var duoOk = occ.spotsLeft >= 2;
        TILES.forEach(function (t0) {
          var on = t0.id === 'membership' ? isTier(f.pass) : f.pass === t0.id;
          var dis = t0.id === 'duo' && !duoOk;
          var b = h('button', { type: 'button', cls: 'jtile' + (t0.badge ? ' jtile--hl' : ''), 'data-testid': TESTID[t0.id], 'aria-pressed': on ? 'true' : null, 'aria-describedby': dis ? 'note-duo' : null, disabled: dis ? true : null }, [
            /* engine-v2 1.2 (axe label-in-name): no aria-label; the name is the visible text, "Class drop-in, 300K, Most chosen" (P10 order).
               The pill comes last in the DOM; it is absolutely positioned on the top edge, so nothing moves on screen. */
            h('span', { cls: 'jtile__name', text: t0.name }), vhs(', '),
            h('span', { cls: 'jtile__price', id: dis ? 'note-duo' : null }, dis ? [T.duoShort] : t0.price),
            t0.badge ? [vhs(', '), h('span', { cls: 'jtile__badge', text: t0.badge })] : null,
            h('span', { cls: 'jtile__go', 'aria-hidden': 'true', text: '›' })
          ]);
          b.addEventListener('click', function () {
            f.pass = t0.id === 'membership' ? (isTier(f.pass) ? f.pass : 'membership') : t0.id;
            saveDraft(f); fire('ef:pass', { pass: f.pass }); if (t0.id === 'member') { fire('ef:member', { occId: occ.id }); }
            goStep('details', occ.id);
          });
          grid.appendChild(b);
        });
        fs.appendChild(grid);
        wrap.appendChild(fs);
      }
      body.appendChild(wrap);
      placeReview(wrap);
      win.requestAnimationFrame(function () { placeReview(wrap); });
    }
  };
}

var STRIP_SHORT = { 'class-1': 'Drop-in', duo: 'Duo', member: 'Member', membership: 'Plan', 'perform-4w': 'Perform', 'elite-4w': 'Elite', waitlist: 'Waitlist' };
var STRIP_FULL = { 'class-1': 'Class drop-in, 300K', duo: 'Duo day pass, 225K each', member: 'Member, included in your membership', membership: 'Membership, from 2.2M every 4 weeks', 'perform-4w': 'Perform 4 weeks, 2.2M', 'elite-4w': 'Elite 4 weeks, 2.7M', waitlist: 'Waitlist' };
function stripWhen(occ) { return A().dateShort(occ.ymd).split(' ')[0] + ' ' + occ.time.replace(/^0/, ''); }
function stripSr(occ, key) { return ', ' + occ.cls.name + ' with ' + occ.coach.name + ', ' + dayLong(occ) + ', ' + t12(occ.time) + '. ' + (STRIP_FULL[key] || '') + '.'; }
/* ---------------- step 2 "Your details": strip, (membership tiers), full name, WhatsApp, Pay now | Pay at reception, sticky Confirm ---------------- */
function viewDetails(p) {
  var occ = getOcc(p.occId);
  if (!occ) { return missingView(); }
  if (A().bookingFor(occ.id)) { return { redirect: { kind: 'done', params: extend({ occId: occ.id }, jpOf(p)), url: urlFor('done', occ.id) } }; }
  var f = readDraft();
  var wl = !!occ.full;
  if (!f || f.occId !== occ.id || (!wl && !f.pass) || (!wl && f.pass === 'waitlist')) { return { redirect: { kind: 'class', params: extend({ occId: occ.id }, jpOf(p)), url: urlFor('class', occ.id) } }; }
  if (f.pass === 'duo' && occ.spotsLeft < 2) { return { redirect: { kind: 'class', params: extend({ occId: occ.id }, jpOf(p)), url: urlFor('class', occ.id) } }; }
  var c = A().contact.get();
  if (c && !f.prefilled) { f.name = f.name || c.name || ''; f.cc = c.cc || f.cc; f.phone = f.phone || c.phone || ''; f.prefilled = true; saveDraft(f); }
  var member = !wl && f.pass === 'member', tierPick = !wl && (f.pass === 'membership' || isTier(f.pass));
  return {
    label: 'Your details', mode: 'step2', testid: 'step-details',
    render: function (body, foot) {
      var wrap = h('div', { cls: 'view view--step2', 'data-testid': 'step-details' });
      /* engine-v2 1.2: a compact one-line strip, "Thu 8:30 · Rey · Drop-in" (24-hour time, the pass short name), that fits 360 px at the
         14 px floor (RULINGS #41) beside Change; the full detail stays in the accessible name */
      var optKey = wl ? 'waitlist' : (member ? 'member' : (tierPick ? (isTier(f.pass) ? f.pass : 'membership') : f.pass));
      var strip = h('div', { cls: 'strip', 'data-testid': 'details-strip' }, [
        h('span', { cls: 'strip__photo', 'data-coach': occ.coach.id }, h('img', { src: occ.coach.avatar, srcset: ssFor(occ.coach.avatar), sizes: '32px', alt: '', width: '32', height: '32' })),
        h('h2', { cls: 'strip__h', id: 'sheet-title', tabindex: '-1' }, [stripWhen(occ) + ' · ' + occ.coach.name + ' · ', h('span', { 'data-strip-opt': '' }, STRIP_SHORT[optKey] || ''), h('span', { cls: 'vh ef-vh', 'data-strip-sr': '', text: stripSr(occ, optKey) })]),
        h('button', { type: 'button', cls: 'link-t strip__change', 'data-testid': 'change-option', on: { click: function () { backSheet(); } } }, [h('span', { text: 'Change' })])
      ]);
      wrap.appendChild(strip);
      var refs = {}, failed = false;
      if (tierPick) {
        var tg = h('div', { cls: 'group tiers', id: 'grp-tier', role: 'group', 'aria-label': 'Which membership?' });
        refs.tiers = {};
        ['perform-4w', 'elite-4w'].forEach(function (tid) {
          var tr = T.tiers[tid];
          var b = h('button', { type: 'button', cls: 'ttile', 'data-testid': TESTID[tid], 'aria-pressed': f.pass === tid ? 'true' : 'false' }, [h('span', { cls: 'ttile__name', text: tr.name.split(' ')[0] + ' ' + tr.price + ' / 4 weeks' }), h('span', { cls: 'ttile__line', text: tr.line })]);
          b.addEventListener('click', function () { f.pass = tid; saveDraft(f); qa('.ttile', wrap).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); q('[data-strip-opt]', wrap).textContent = STRIP_SHORT[tid]; q('[data-strip-sr]', wrap).textContent = stripSr(occ, tid); sync(); fire('ef:pass', { pass: tid }); if (failed) { validate(false); } });
          refs.tiers[tid] = b; tg.appendChild(b);
        });
        refs.tierErr = h('p', { cls: 'err err--group', id: 'err-tier' });
        tg.appendChild(refs.tierErr);
        wrap.appendChild(tg);
      }
      if (wl) { wrap.appendChild(h('p', { cls: 'sh-lead', text: T.waitlistLead })); }
      if (member) { wrap.appendChild(h('p', { cls: 'sh-lead', text: T.memberLead })); }
      var det = h('div', { cls: 'details' });
      refs.name = nameInput(f.name);
      refs.nameF = field('f-name', T.fName, '', refs.name);
      if (!member) { det.appendChild(refs.nameF); }
      refs.phone = phoneGroup(f.cc, f.phone);
      refs.phoneF = field('f-phone', T.fWa, '', refs.phone);
      q('label', refs.phoneF).setAttribute('for', 'f-phone');
      det.appendChild(refs.phoneF);
      wrap.appendChild(det);
      if (member) { wrap.appendChild(h('p', { cls: 'sh-remember', text: T.memberNote })); }
      if (!wl && !member) {
        var pay = h('div', { cls: 'group pay', id: 'grp-pay', role: 'radiogroup', 'aria-labelledby': 'pay-h', 'aria-describedby': 'err-pay' }, h('p', { cls: 'group__legend', id: 'pay-h', text: T.payLegend }));
        var row = h('div', { cls: 'paybtns' });
        refs.pay = {};
        [['now', 'pay-now', T.payNow[0]], ['reception', 'pay-reception', T.payReception[0]]].forEach(function (pp) {
          var inp = h('input', { type: 'radio', name: 'pay', value: pp[0], 'data-testid': pp[1] });
          inp.checked = f.pay === pp[0];
          refs.pay[pp[0]] = inp;
          row.appendChild(h('label', { cls: 'paybtn' }, [inp, h('span', { cls: 'paybtn__face', text: pp[2] })]));
        });
        pay.appendChild(row);
        refs.payErr = h('p', { cls: 'err err--group', id: 'err-pay' });
        pay.appendChild(refs.payErr);
        refs.payF = pay;
        wrap.appendChild(pay);
      }
      if (A().store.get().remember !== false) { wrap.appendChild(h('p', { cls: 'sh-remember', text: T.remember })); }
      body.appendChild(wrap);

      var total = h('p', { cls: 'sh-total', 'data-total': '', 'aria-live': 'polite' });
      var errSum = h('p', { cls: 'err-summary', id: 'err-summary', role: 'alert', 'data-testid': 'err-summary', hidden: true });
      var cta = primary('', 'cta-book', onConfirm);
      cta.setAttribute('aria-describedby', 'sheet-privacy');
      foot.appendChild(total); foot.appendChild(errSum); foot.appendChild(cta);
      foot.appendChild(h('p', { cls: 'sh-privacy', id: 'sheet-privacy', text: T.privacy }));

      function store() { if (!member) { f.name = refs.name.value; } f.cc = refs.phone.sel.value; f.phone = refs.phone.tel.value; saveDraft(f); }
      function sync() {
        var tot = isTier(f.pass) || f.pass === 'duo' || f.pass === 'class-1' ? totalOf(f) : 0, label;
        if (wl) { total.hidden = true; label = T.ctaWaitlist; }
        else if (member) { total.hidden = false; total.textContent = T.memberIncluded; label = T.ctaMember; }
        else {
          total.hidden = false;
          total.textContent = (tierPick && !isTier(f.pass)) ? 'from 2.2M' : k(tot) + (f.pay === 'now' ? ' · pay now' : (f.pay === 'reception' ? ' · pay at reception' : ''));
          label = f.pay === 'now' && tot ? 'Confirm and pay ' + k(tot) : (tierPick ? T.ctaMembership : T.ctaReception);
        }
        q('.btn__label', cta).textContent = label;
      }
      function validate(focus) {
        var bad = [], pr;
        store();
        if (tierPick) { q('#grp-tier', wrap).classList.remove('is-bad'); refs.tierErr.textContent = ''; if (!isTier(f.pass)) { q('#grp-tier', wrap).classList.add('is-bad'); refs.tierErr.textContent = 'Please choose Perform or Elite.'; bad.push(refs.tiers['perform-4w']); } }
        if (!member) { clearBad(refs.nameF, refs.name); if (letters(trim(refs.name.value)) < 2) { markBad(refs.nameF, refs.name, T.err.name); bad.push(refs.name); } }
        clearBad(refs.phoneF, refs.phone.tel);
        pr = normalisePhone(refs.phone); f.cc = refs.phone.sel.value; syncCc(refs.phone);
        softHint(refs.phoneF, pr.zero ? T.err.wa62 : '');
        if (!A().phoneOk(f.cc, pr.national)) { markBad(refs.phoneF, refs.phone.tel, T.err.wa); bad.push(refs.phone.tel); }
        if (refs.payF) { refs.payF.classList.remove('is-bad'); refs.payErr.textContent = ''; if (!f.pay) { refs.payF.classList.add('is-bad'); refs.payErr.textContent = T.err.pay; bad.push(refs.pay.now); } }
        saveDraft(f);
        var fieldBad = bad.filter(function (x) { return x === refs.name || x === refs.phone.tel; }).length;
        errSum.hidden = fieldBad === 0; errSum.textContent = fieldBad ? T.err.summary : '';
        if (bad.length && focus) {
          var first = bad[0];
          try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
          var tgt = first.closest('.field') || first.closest('.group');
          if (tgt && tgt.scrollIntoView) { try { tgt.scrollIntoView({ block: 'nearest', behavior: motionOn() ? 'smooth' : 'auto' }); } catch (e2) { tgt.scrollIntoView(); } }
        }
        return bad.length === 0;
      }
      function onConfirm() {
        if (busy) { return; }
        var fresh = A().occById(occ.id);
        if (fresh && fresh.past) { EF.toast(T.err.started); backSheet(); return; }
        if (!validate(true)) { failed = true; return; }
        var ex = { returning: !!c };
        if (wl) { ex.waitlist = true; submitFlow(occ, f, ex, cta); return; }
        if (member) { ex.name = (c && c.name) || ''; submitFlow(occ, f, ex, cta); return; }
        if (f.pay === 'now') { saveDraft(f); fire('ef:pay', { pay: 'now' }); goStep('pay', occ.id); return; }
        submitFlow(occ, f, ex, cta);
      }
      if (refs.pay) { ['now', 'reception'].forEach(function (pp) { refs.pay[pp].addEventListener('change', function () { if (!this.checked) { return; } f.pay = pp; saveDraft(f); sync(); fire('ef:pay', { pay: pp }); if (failed) { validate(false); } }); }); }
      refs.name.addEventListener('input', function () { store(); if (failed) { validate(false); } });
      refs.phone.tel.addEventListener('input', function () { store(); if (failed) { validate(false); } });
      refs.phone.tel.addEventListener('blur', function () { if (this.value) { var pr = normalisePhone(refs.phone); syncCc(refs.phone); softHint(refs.phoneF, pr.zero ? T.err.wa62 : ''); store(); } });
      refs.phone.sel.addEventListener('change', function () { syncCc(refs.phone); store(); if (failed) { validate(false); } });
      refs.name.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); refs.phone.tel.focus(); } });
      refs.phone.tel.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); refs.phone.tel.blur(); } });
      sync();
    }
  };
}

/* ---------------- pay now: one demo payment screen ---------------- */
function viewPay(p) {
  var occ = getOcc(p.occId);
  var f = readDraft();
  if (!occ || A().bookingFor(occ.id) || occ.full || !f || f.pay !== 'now' || f.pass === 'member' || !(f.pass === 'class-1' || f.pass === 'duo' || isTier(f.pass))) { return { redirect: { kind: 'class', params: extend({ occId: p.occId }, jpOf(p)), url: urlFor('class', p.occId) } }; }
  if (letters(trim(f.name)) < 2 || !A().phoneOk(f.cc, A().parsePhone(f.phone, CC_LIST).national)) { return { redirect: { kind: 'details', params: extend({ occId: occ.id }, jpOf(p)), url: urlFor('details', occ.id) } }; }
  var c = A().contact.get();
  var tot = totalOf(f);
  return {
    label: 'Pay (demo)', mode: 'pay', testid: 'step-pay',
    render: function (body, foot) {
      var wrap = h('div', { cls: 'view view--pay', 'data-testid': 'step-pay' });
      wrap.appendChild(h('h2', { cls: 'sh-title', id: 'sheet-title', tabindex: '-1' }, [T.payDemoH[0], tWord(T.payDemoH[1])]));
      wrap.appendChild(h('p', { cls: 'demo-flag', 'data-testid': 'demo-flag', text: T.payDemoLabel }));
      wrap.appendChild(h('p', { cls: 'sh-lead', text: T.payDemoLine.replace('{total}', k(tot)) }));
      wrap.appendChild(h('dl', { cls: 'summary' }, [
        row(T.labels.cls, occ.cls.name + ' · with ' + occ.coach.name),
        row(T.labels.when, A().dateShort(occ.ymd) + ' · ' + t12(occ.time)),
        row(T.labels.booking, A().passName(f.pass)),
        h('div', { cls: 'total' }, [h('dt', { text: 'Total' }), h('dd', null, [k(tot), h('small', { text: A().idr(tot) })])])
      ]));
      body.appendChild(wrap);
      var cta = primary('Pay ' + k(tot) + ' (demo)', 'cta-pay', function () { submitFlow(occ, f, { returning: !!c }, cta); });
      foot.appendChild(h('p', { cls: 'sh-total', text: k(tot) + ' · pay now' }));
      foot.appendChild(cta);
      foot.appendChild(h('p', { cls: 'sh-privacy', text: 'Demo: nothing is sent.' }));
    }
  };
}

/* ---------------- confirmed ---------------- */
function row(label, value) { return h('div', null, [h('dt', { text: label }), h('dd', null, value)]); }
function shareHref(occ) {
  var base = win.location.href.split('#')[0].split('?')[0];
  var day = occ.dayIndex === 0 ? 'today' : (occ.dayIndex === 1 ? 'tomorrow' : A().dateShort(occ.ymd));
  var text = "I'm going to " + occ.cls.name + ' at Elite Fit on ' + day + ' at ' + t12(occ.time) + '. Come with me? The Duo day pass is ' + k(A().passInfo('duo').unit) + ' each. ' + base + '?class=' + occ.classId + '&pass=duo';
  return 'https://wa.me/?text=' + encodeURIComponent(text);
}
function payText(bk) {
  if (bk.member) { return T.memberIncluded; }
  if (bk.paid) { return 'Paid ' + k(bk.total_idr) + ' (demo)'; }
  return 'Pay ' + k(bk.total_idr) + ' at reception';
}
function viewDone(p) {
  var bk = A().bookingFor(p.occId);
  if (!bk) { return { redirect: { kind: 'class', params: extend({ occId: p.occId }, jpOf(p)), url: urlFor('class', p.occId) } }; }
  var occ = getOcc(p.occId);
  if (!occ) { return missingView(); }
  var wl = !!bk.waitlist, club = A().data.club;
  return {
    label: wl ? 'On the waitlist' : 'Booked', mode: 'done', testid: 'step-done', noBack: true,
    render: function (body, foot) {
      var wrap = h('div', { cls: 'view view--done', 'data-testid': 'step-done', role: 'status' });
      wrap.insertAdjacentHTML('beforeend', '<svg class="done-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="29"></circle><path d="M19 33l9 9 17-20"></path></svg>');
      var title = bk.firstName
        ? (wl ? ["You're on the list, ", tWord(bk.firstName), '.'] : ['See you at ' + t12(occ.time) + ', ', tWord(bk.firstName), '.'])
        : (wl ? ["You're on the ", tWord('list'), '.'] : ['See you at ', tWord(t12(occ.time)), '.']);
      wrap.appendChild(h('h2', { cls: 'done-title', id: 'sheet-title', tabindex: '-1', 'data-testid': 'done-title' }, title));
      var lead = h('p', { cls: 'done-lead' }, wl ? T.doneLeadWait : T.doneLead);
      if (wl) { lead.appendChild(sampleChip()); }
      wrap.appendChild(lead);
      var rows = [
        row(T.labels.cls, occ.cls.name + ' · with ' + occ.coach.name),
        row(T.labels.when, A().dateShort(occ.ymd) + ' · ' + t12(occ.time) + ' · ' + occ.cls.length_min + ' min')
      ];
      if (!wl) {
        rows.push(row(T.labels.booking, bk.membershipStart ? (bk.pass === 'elite-4w' ? 'Elite' : 'Perform') + ' membership' : A().passName(bk.pass)));   /* RULINGS #24 (handover cards): Duo and membership within 57 words */
        rows.push(row(T.labels.pay, payText(bk)));
      }
      rows.push(row(T.labels.ref, bk.ref));
      var ticket = h('dl', { cls: 'summary', 'data-testid': 'ticket' }, rows);
      wrap.appendChild(ticket);
      /* the membership starts with this class (the When row has the date; step 2 says so): no separate line, RULINGS #24 */
      wrap.appendChild(h('p', { cls: 'done-note', text: T.arrive }));
      var links = h('div', { cls: 'done-links' }, [
        h('a', { cls: 'link-t', href: club.maps_url, target: '_blank', rel: 'noopener', 'data-testid': 'cta-directions' }, [h('span', { text: 'Jalan Sempol No. 26 · ' + T.ctaDirections }), ' ', arrow()])
      ]);
      wrap.appendChild(links);
      /* rulings #24: Confirmed <=57 words / <=31 elements / <=5 controls; the Recharge card goes so the "Where" line fits (Recharge stays on the page) */
      if (payloadView) {
        var pl = A().lastPayload();
        wrap.appendChild(h('details', { cls: 'payload', 'data-testid': 'payload', open: true }, [h('summary', { text: 'Production payload (QA, ?payload=1): built here, sent nowhere' }), h('pre', { text: JSON.stringify(pl, null, 1) || 'Built at submit time; book again in this tab to see it.' })]));
      }
      body.appendChild(wrap);
      if (wl) {
        foot.appendChild(primary('See other times', 'cta-other-time', function () {
          var jp = jpOf(p);   /* FINDER-SPEC 2.6: a finder journey reopens the finder at the mode the visitor used */
          if (jp.entry === 'finder' || jp.entry === 'pass') { closeSheet(); openFinder({ mode: /^(day|week|class)$/.test(jp.mode || '') ? jp.mode : null, src: jp.src, pass: jp.pass, force: true }); }
          else { pickAnother(occ); }
        }));
      } else {
        foot.appendChild(primary(T.ctaIcs, 'cta-ics', function () {
          try { A().downloadIcs(occ, bk); EF.toast('Calendar file saved.'); fire('ef:ics', { ref: bk.ref }); }
          catch (e) { EF.toast("Couldn't save the calendar file."); }
        }));
        foot.appendChild(h('a', { cls: 'btn btn--outline', href: shareHref(occ), target: '_blank', rel: 'noopener', 'data-testid': 'cta-wa-share', text: T.ctaShare, on: { click: function () { fire('ef:share', { ref: bk.ref }); } } }));
      }
    }
  };
}

/* ---------------- coach ---------------- */
function coachRole(coach) {
  if (coach.role) { return coach.role.replace(/ · Weight loss/, ''); }
  var names = A().data.classes.filter(function (c) { return c.coach === coach.id; }).map(function (c) { return c.name; });
  return 'Teaches ' + (names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]);
}
function viewCoach(p) {
  var coach = A().coach(p.coachId);
  if (!coach) { return missingView(); }
  return {
    label: 'Coach', mode: 'coach', testid: 'step-coach',
    render: function (body) {
      var wrap = h('div', { cls: 'view', 'data-testid': 'step-coach' });
      wrap.appendChild(h('div', { cls: 'csheet__top' }, [
        h('div', { cls: 'csheet__photo' }, h('img', { src: coach.photo, srcset: ssFor(coach.photo), sizes: '(min-width: 1024px) 300px, 60vw', alt: coach.name + ', coach at Elite Fit', width: '360', height: '450' })),
        h('div', null, [h('p', { cls: 'sh-k', text: "Hello, I'm" }), h('h2', { cls: 'sh-title', id: 'sheet-title', tabindex: '-1' }, [tWord(coach.name)]), h('p', { cls: 'sh-lead', text: coachRole(coach) })])
      ]));
      wrap.appendChild(h('p', { cls: 'sh-lead' }, [coach.bio, sampleChip()]));
      wrap.appendChild(h('h3', { cls: 'sh-h', text: coach.name + "'s week" }));
      var occs = A().coachOccs(coach.id);
      if (!occs.length) { wrap.appendChild(h('p', { cls: 'sh-lead', text: 'No classes with ' + coach.name + ' in the next seven days.' })); }
      else {
        var ul = h('ul', { cls: 'mrows' });
        occs.forEach(function (o) {
          var bk = o.booking, lbl = bk ? 'Booked' : (o.full ? 'Waitlist' : 'Book');
          var btn = h('button', { type: 'button', cls: 'btn btn--outline btn--sm rbtn', 'data-testid': 'mrow-book', 'aria-haspopup': 'dialog', 'aria-label': lbl + ' ' + o.cls.name + ', ' + dayLong(o) + ', ' + t12(o.time), text: lbl });
          btn.addEventListener('click', function () { openClass(o.id, { src: 'coach' }); });
          ul.appendChild(h('li', { cls: 'mrow', 'data-mocc': o.id }, [h('div', null, [h('b', { text: o.cls.name }), h('span', { text: A().dateShort(o.ymd) + ' · ' + t12(o.time) })]), btn]));
        });
        wrap.appendChild(ul);
      }
      body.appendChild(wrap);
    }
  };
}

/* ---------------- public API ---------------- */
/* engine-v2: v1 pages call open(id, {join:'duo'}); v2 pages call open(id, {pass:'duo'}). Both work; pass wins when both are given. */
var JOIN_ALIAS = { duo: 'duo', member: 'member', 'class-1': 'class-1', membership: 'membership', 'perform-4w': 'perform-4w', 'elite-4w': 'elite-4w' };
function normOpts(o) {
  var out = {}, k;
  if (o && typeof o === 'object') { for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { out[k] = o[k]; } } }
  if (!out.pass && out.join && JOIN_ALIAS[out.join]) { out.pass = JOIN_ALIAS[out.join]; }
  return out;
}
function openClass(idOrOcc, opts) {
  opts = normOpts(opts);
  if (!A().data) { A().load().then(function () { openClass(idOrOcc, opts); }); return false; }
  var occ = A().occ(idOrOcc);
  if (!occ) { EF.toast(T.toast.notfound); var wk = doc.getElementById('week') || doc.getElementById('schedule'); if (wk) { try { wk.focus({ preventScroll: true }); } catch (e) {} if (wk.scrollIntoView) { wk.scrollIntoView(); } } return false; }
  var k0 = EF.sheet.kind(), cur = EF.sheet.params() || {};
  var inFinder = EF.sheet.isOpen() && isFinder(k0);
  /* a page's own [data-book-next] handler firing for the same click that opened the finder: ignore it (FINDER-SPEC 7.4).
     The last click on the page is still that button (any other click, a row or a chip, moves lastTrigger on). */
  if (!opts.entry && !opts.swap && inFinder && k0 === 'finder' && depth === 1 && lastTrigger && lastTrigger.closest && lastTrigger.closest(ENTRY_SEL) && Date.now() - lastTriggerAt < 1500) { return true; }
  /* a class tap on the page while the panel shows a finder screen: step 1 is pushed on top of it, no toast (FINDER-SPEC 1.1) */
  if (inFinder && !opts.entry) { opts.entry = cur.entry || 'finder'; opts.mode = cur.mode || null; opts.src = opts.src || cur.src || null; if (!opts.pass && cur.pass) { opts.pass = cur.pass; } fire('ef:finder-pick', { mode: opts.mode, occId: occ.id, via: 'page' }); }
  var swapping = EF.sheet.isOpen() && !inFinder && (EF.sheet.isPanel() || opts.swap) && (k0 === 'class' || k0 === 'details' || k0 === 'pay' || k0 === 'done' || k0 === 'coach');
  var jr = swapping ? jpOf(cur) : { entry: opts.entry || 'class', mode: opts.mode || null, src: opts.src || null, pass: opts.entry === 'pass' ? (opts.pass || null) : null };
  if (!A().bookingFor(occ.id)) { ensureDraft(occ, { pass: opts.pass, src: opts.src, fromPage: true, finderMode: jr.entry === 'class' ? null : (jr.mode || null) }); }
  /* desktop panel (or a swap chip inside the sheet): swap the class in place, keep the details, pass and pay choice */
  if (swapping) {
    if (cur && cur.occId === occ.id && k0 !== 'coach') { var tt = q('#sheet-title', S.body); if (tt) { tt.focus(); } return true; }
    var r = navigate('replace', 'class', extend({ occId: occ.id }, jr), urlFor('class', occ.id), false, 'swap');
    if (k0 !== 'done' && k0 !== 'coach') { EF.toast(T.toast.switched.replace('{class}', occ.cls.name).replace('{time}', A().dateShort(occ.ymd).split(' ')[0] + ' ' + t12(occ.time))); }
    return r;
  }
  var r2 = EF.sheet.open('class', extend({ occId: occ.id }, jr), urlFor('class', occ.id));
  if (opts.pass && !occ.full && !(opts.pass === 'duo' && occ.spotsLeft < 2)) { goStep('details', occ.id); }
  return r2;
}
/* =====================================================================
   Class finder (RULINGS #30, upgrade/FINDER-SPEC.md v1.0 section 7): step 0 "How do you want to pick?", By day (A1), Show week (W1)
   and the Next-class shortcut, then the existing step 1. By class (B1/B2) and pass-carrying price buttons follow FINDER-SPEC v1.1.
   No terracotta on any finder screen; nothing preselected (the By day strip's day is a view filter); only classes still to come.
   ===================================================================== */
var FT = {
  step0: 'Book a class', step0H: 'How do you want to pick?',
  modes: [
    { id: 'day', name: 'By day', sub: 'One day at a time', testid: 'finder-mode-day', kind: 'finder-day' },
    { id: 'class', name: 'By class', sub: 'Boxing, HYROX, Sculpt, Mobility', testid: 'finder-mode-class', kind: 'finder-class' },
    { id: 'week', name: 'Show week', sub: 'The whole week', testid: 'finder-mode-week', kind: 'finder-week' }
  ],
  lastUsed: 'Last used', nextK: 'Next class: ', book: 'Book',
  errH: "The timetable didn't load", errLead: 'Check your connection and try again.', retry: 'Try again',
  dayLabel: 'By day', dayH: 'When can you come?', dayStrip: 'Pick a day',
  weekLabel: 'Show week', weekH: 'The week, today first',
  todayDone: "That's today done.", duoNeeds: '1 spot free · Duo needs 2', duoChip: ['1 spot free', 'Duo needs 2'],
  classLabel: 'By class', classH: 'What do you want to train?', stock: 'Stock clip', fullNext: ['Full ·', 'Join waitlist'], nextFree: 'Next free class '
};
var PASS_LABEL = { 'class-1': 'Class drop-in', duo: 'Duo day pass', membership: 'Membership' };
var GLYPH = {
  day: function (n) { return '<svg viewBox="0 0 32 32" width="32" height="32" focusable="false"><rect x="3" y="5" width="26" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 11h26M10 3v5M22 3v5" fill="none" stroke="currentColor" stroke-width="2"/><text x="16" y="26.5" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" font-family="inherit">' + n + '</text></svg>'; },
  'class': function () { return '<svg viewBox="0 0 32 32" width="32" height="32" focusable="false"><rect x="4" y="4" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="4" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="18" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="18" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'; },
  week: function () { var i, s = '<svg viewBox="0 0 32 32" width="32" height="32" focusable="false">'; for (i = 0; i < 7; i++) { s += '<rect x="' + (2 + i * 4.2) + '" y="6" width="2.4" height="20" rx="1.2" fill="currentColor"/>'; } return s + '</svg>'; }
};
var memMode = null;
function finderKey() { return ((EF.engine && EF.engine.storeKey) || 'ef-gf-v3') + ':finder'; }
/* FINDER-SPEC 1.3 / 7.6: the last mode in sessionStorage only (never localStorage), with a memory fallback */
function readMode() {
  try { var raw = win.sessionStorage.getItem(finderKey()), o = raw ? JSON.parse(raw) : null; return o && /^(day|class|week)$/.test(o.mode) ? o.mode : null; }
  catch (e) { return memMode; }
}
function writeMode(m) { memMode = m; try { win.sessionStorage.setItem(finderKey(), JSON.stringify({ mode: m })); } catch (e) {} }
function finderUrl(kind, p) {
  var parts = [], np = A().nowParam;
  p = p || {};
  if (kind === 'finder') { parts.push('finder=1'); }
  else if (kind === 'finder-day') { parts.push('finder=day'); if (p.ymd) { parts.push('day=' + p.ymd.replace(/-/g, '')); } }
  else if (kind === 'finder-week') { parts.push('finder=week'); }
  else if (kind === 'finder-class') { parts.push('finder=class'); }
  else if (kind === 'finder-sessions') { parts.push('finder=class'); if (p.cls) { parts.push('cls=' + encodeURIComponent(p.cls)); } }
  if (p.pass) { parts.push('pass=' + encodeURIComponent(p.pass)); }
  if (np) { parts.push('now=' + encodeURIComponent(np).replace(/%3A/g, ':')); }
  if (payloadView) { parts.push('payload=1'); }
  return '?' + parts.join('&');
}
function passLabel(p) { return (p && PASS_LABEL[p]) || ''; }
function countTxt(n) { return n === 1 ? '1 class' : n + ' classes'; }
function leftOf(day) { return day.occs.filter(function (o) { return !o.past; }); }
function dayWord(o) { return o.dayIndex === 0 ? 'Today' : (o.dayIndex === 1 ? 'Tomorrow' : A().dateShort(o.ymd).split(' ')[0]); }
function daySr(o) { return (o.dayIndex === 0 ? 'today, ' : (o.dayIndex === 1 ? 'tomorrow, ' : '')) + dayLong(o); }
function seatSr(o, duoBlock) {
  if (duoBlock) { return '1 spot free. Duo needs 2 spots.'; }
  if (o.booking) { return o.booking.waitlist ? 'On the waitlist.' : 'Booked.'; }
  if (o.full) { return 'Full, ' + o.capacity + ' of ' + o.capacity + ' spots taken. Join the waitlist.'; }
  if (duoBlock) { return '1 spot free. Duo needs 2 spots.'; }
  return o.spotsLeft + ' of ' + o.capacity + ' spots free.';
}
function occName(o, duoBlock) { return o.cls.name + ' with ' + o.coach.name + ', ' + daySr(o) + ', ' + t12(o.time) + '. ' + seatSr(o, duoBlock); }
function nextFor(pass) {
  if (pass === 'duo') { var list = A().upcoming(40), i; for (i = 0; i < list.length; i++) { if (list[i].spotsLeft >= 2) { return list[i]; } } return null; }
  return A().upcoming(1)[0] || null;
}
/* HANDOVER-QA cards (axe label-content-name-mismatch, WCAG 2.5.3): finder controls take their name from their content, visible text
   first; the extra detail for screen readers follows as visually hidden text. No aria-label on them. */
function vhs(text) { return h('span', { cls: 'vh ef-vh', text: text }); }
function quietSample() { var sc = sampleChip(); sc.setAttribute('aria-hidden', 'true'); return sc; }
function finderTitle(text) { return h('h2', { cls: 'sh-title find-title', id: 'sheet-title', tabindex: '-1', text: text }); }
function toScreen(p, kind, patch) { var p2 = extend(jpOf(p), patch); EF.sheet.open(kind, p2, finderUrl(kind, p2)); }
/* hand-over: every row, chip and the shortcut PUSH step 1 on top of the finder screen (FINDER-SPEC 2.6); pass journeys go on to step 2 */
function handOver(occId, via, p) {
  var mode = via === 'shortcut' ? 'next' : (p.mode || null);
  fire('ef:finder-pick', { mode: mode, occId: occId, via: via, pass: p.pass || null });
  openClass(occId, { entry: p.pass ? 'pass' : 'finder', mode: mode, src: p.src || null, pass: p.pass || null, via: via });
}
function weekendNote() { var t = A().data.timetable || {}; return t.weekend_note ? h('p', { cls: 'find-note', 'data-testid': 'finder-weekend-note', text: t.weekend_note }) : null; }

/* ---------------- step 0 "How do you want to pick?" ---------------- */
function viewFinder(p) {
  if (p.error || !A().data) {
    return {
      label: FT.step0, mode: 'finder', testid: 'step-finder', noBack: true,
      render: function (body, foot) {
        body.appendChild(h('div', { cls: 'view view--finder', 'data-testid': 'step-finder' }, [finderTitle(FT.errH), h('p', { cls: 'sh-lead', text: FT.errLead })]));
        foot.appendChild(primary(FT.retry, 'finder-error', function () { win.location.reload(); }));
      }
    };
  }
  return {
    label: p.pass ? passLabel(p.pass) : FT.step0, mode: 'finder', testid: 'step-finder', noBack: true,
    render: function (body) {
      var wrap = h('div', { cls: 'view view--finder', 'data-testid': 'step-finder' }), last = readMode(), today = A().week()[0];
      wrap.appendChild(finderTitle(FT.step0H));
      var ul = h('ul', { cls: 'find-modes' });
      FT.modes.forEach(function (m) {
        var isLast = last === m.id;
        var b = h('button', { type: 'button', cls: 'find-mode', 'data-testid': m.testid, 'data-mode': m.id, 'data-index': String(FT.modes.indexOf(m) + 1) }, [
          h('span', { cls: 'find-mode__glyph', 'aria-hidden': 'true' }, html(GLYPH[m.id](today ? today.dayNum : ''))),
          h('span', { cls: 'find-mode__name', text: m.name }), vhs('. '),
          h('span', { cls: 'find-mode__sub', text: m.sub }),
          isLast ? vhs(', ') : null,
          isLast ? h('span', { cls: 'find-mode__last', 'data-testid': 'finder-last-used', text: FT.lastUsed }) : null,
          h('span', { cls: 'find-mode__go', 'aria-hidden': 'true', text: '›' })
        ]);
        b.addEventListener('click', function () {
          if (!views[m.kind]) { return; }
          fire('ef:finder-mode', { mode: m.id, last: readMode() === m.id });
          writeMode(m.id);
          rememberBack({ testid: m.testid });
          toScreen(p, m.kind, { mode: m.id });
        });
        ul.appendChild(h('li', null, b));
      });
      wrap.appendChild(ul);
      var nx = nextFor(p.pass);
      if (nx) {
        wrap.appendChild(h('hr', { cls: 'find-sep' }));
        var sb = h('button', { type: 'button', cls: 'find-next', 'data-testid': 'finder-next', 'data-occ': nx.id }, [
          h('span', { cls: 'find-next__k' }, [FT.nextK, h('span', { cls: 'find-next__cls', text: shortName(nx) + ' · ' + dayWord(nx) + ' ' + t12(nx.time) })]),
          h('span', { cls: 'find-next__seats' }, html(freeDots(nx.spotsLeft))),
          h('span', { cls: 'find-next__go' }, [h('span', { text: FT.book }), ' ', h('span', { 'aria-hidden': 'true', text: '›' })]),
          vhs('. ' + occName(nx))
        ]);
        sb.addEventListener('click', function () { rememberBack({ testid: 'finder-next' }); handOver(nx.id, 'shortcut', p); });
        wrap.appendChild(sb);
      }
      body.appendChild(wrap);
      fire('ef:finder', { screen: 'mode', mode: null, src: p.src || null, pass: p.pass || null });
    }
  };
}

/* ---------------- shared rows (By day, By class times) ---------------- */
function findRow(o, first, p, opt) {
  opt = opt || {};
  var bk = o.booking, duoBlock = p.pass === 'duo' && !o.full && o.spotsLeft < 2;   /* Duo needs 2 spots, booked here or not (FQ22) */
  var lbl = duoBlock ? FT.duoNeeds : (bk ? (bk.waitlist ? 'On the waitlist' : 'Booked') : null);
  var seats = html(EF.seats.html(o.spotsLeft, o.capacity, { label: lbl || undefined, sr: seatSr(o, duoBlock).replace(/\.$/, '') }));
  if (first) { seats.appendChild(quietSample()); }   /* one Sample chip per list (RULINGS #11) */
  var av = h('img', { src: o.coach.avatar, srcset: ssFor(o.coach.avatar), sizes: '24px', alt: '', width: '24', height: '24' });
  var b = h('button', { type: 'button', cls: 'find-row' + (o.full ? ' find-row--full' : '') + (bk ? ' find-row--booked' : ''), 'data-testid': 'finder-row', 'data-occ': o.id, 'data-free': String(o.spotsLeft), 'data-full': o.full ? 'true' : 'false', 'data-index': opt.index ? String(opt.index) : null, 'aria-disabled': duoBlock ? 'true' : null }, [
    h('span', { cls: 'find-row__time', text: t12(o.time) }),
    opt.noName ? null : h('span', { cls: 'find-row__name', text: o.cls.name }),
    h('span', { cls: 'find-row__who' }, [av, h('span', { text: o.coach.name })]),
    h('span', { cls: 'find-row__seats' }, seats),
    h('span', { cls: 'find-row__go', 'aria-hidden': 'true', text: '›' }),
    vhs(', ' + (opt.noName ? '' : '') + daySr(o) + '.')
  ]);
  b.addEventListener('click', function () { if (duoBlock) { return; } rememberBack({ testid: 'finder-row', occ: o.id }); handOver(o.id, 'row', p); });
  return h('li', null, b);
}

/* ---------------- A1 By day "When can you come?" ---------------- */
function viewFinderDay(p) {
  var wk = A().week();
  return {
    label: p.pass ? passLabel(p.pass) : FT.dayLabel, mode: 'finder', testid: 'step-finder-day',
    render: function (body) {
      var wrap = h('div', { cls: 'view view--fday', 'data-testid': 'step-finder-day' }), cur = -1, tabs;
      wrap.appendChild(finderTitle(FT.dayH));
      var strip = h('div', { cls: 'find-days', role: 'tablist', 'aria-label': FT.dayStrip, 'data-testid': 'finder-daystrip' });
      var line = h('h3', { cls: 'find-dayline', id: 'find-dayline' });
      var box = h('div', { cls: 'find-daybox', id: 'find-list', role: 'tabpanel', 'aria-labelledby': 'find-dayline' });
      function nextWith(i) { var j; for (j = i + 1; j < wk.length; j++) { if (leftOf(wk[j]).length) { return j; } } return -1; }
      function seeBtn(j) { return h('button', { type: 'button', cls: 'chipbtn', 'data-testid': 'finder-see-day', on: { click: function () { select(j, true); tabs[j].focus(); } } }, 'See ' + wk[j].long.split(' ')[0]); }
      function paint(i) {
        var d = wk[i], left = leftOf(d), j, ul;
        line.textContent = (d.isToday ? 'Today, ' : '') + d.long + ' · ' + countTxt(left.length);
        box.innerHTML = '';
        if (!left.length) {
          j = nextWith(i);
          if (d.isToday && d.occs.length) {
            var nf = j >= 0 ? leftOf(wk[j])[0] : null;
            box.appendChild(h('p', { cls: 'find-empty', 'data-testid': 'finder-done-today', text: FT.todayDone + (nf ? ' ' + (j === 1 ? 'Tomorrow' : wk[j].long.split(' ')[0]) + ' starts at ' + t12(nf.time) + ' with ' + nf.cls.name + '.' : '') }));
          } else {
            box.appendChild(h('p', { cls: 'find-empty', 'data-testid': 'finder-empty', text: 'No classes on ' + d.long.split(' ')[0] + '.' }));
          }
          if (j >= 0) { box.appendChild(seeBtn(j)); }
        } else {
          ul = h('ul', { cls: 'find-list' });
          left.forEach(function (o, k) { ul.appendChild(findRow(o, k === 0, p, { index: k + 1 })); });
          box.appendChild(ul);
        }
        if (d.dow >= 6) { var wn = weekendNote(); if (wn) { box.appendChild(wn); } }
        try { if (EF.media && EF.media.scan) { EF.media.scan(box); } } catch (e) {}
      }
      function select(i, user) {
        if (i === cur) { return; }
        cur = i;
        tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.setAttribute('tabindex', k === i ? '0' : '-1'); });
        paint(i);
        if (user) {
          var d = wk[i], n = leftOf(d).length;
          setParams({ ymd: d.ymd }, finderUrl('finder-day', extend(jpOf(p), { ymd: d.ymd })));
          announce(d.long + (d.isToday && !n && d.occs.length ? '. ' + FT.todayDone : ', ' + countTxt(n) + '.'));
          fire('ef:finder-day', { ymd: d.ymd, count: n });
        }
      }
      tabs = wk.map(function (d, i) {
        var n = leftOf(d).length, done = d.isToday && !n && d.occs.length > 0;
        var b = h('button', { type: 'button', role: 'tab', id: 'find-day-' + i, cls: 'find-day' + (d.isToday ? ' is-today' : '') + (done ? ' is-done' : ''), 'data-testid': 'finder-day-' + i, 'data-ymd': d.ymd, 'aria-controls': 'find-list', 'aria-selected': 'false', tabindex: '-1' }, [
          h('span', { cls: 'find-day__dow', text: i === 0 ? 'Today' : d.dowShort }),
          h('span', { cls: 'find-day__num', text: String(d.dayNum) }),
          vhs(', ' + (i === 1 ? 'tomorrow, ' : '') + d.long + ', ' + (done ? 'done' : countTxt(n)))
        ]);
        b.addEventListener('click', function () { select(i, true); });
        b.addEventListener('keydown', function (e) {
          var k = e.key, j = -1;
          if (k === 'ArrowRight') { j = (cur + 1) % wk.length; } else if (k === 'ArrowLeft') { j = (cur + wk.length - 1) % wk.length; } else if (k === 'Home') { j = 0; } else if (k === 'End') { j = wk.length - 1; }
          if (j >= 0) { e.preventDefault(); select(j, true); tabs[j].focus(); }
        });
        strip.appendChild(b);
        return b;
      });
      /* the one default in the finder: a view filter (FINDER-SPEC 2.2): the asked day, else today, else the first day with classes to come */
      var start = -1, i;
      for (i = 0; i < wk.length && p.ymd; i++) { if (wk[i].ymd === p.ymd) { start = i; } }
      if (start < 0) { start = leftOf(wk[0]).length ? 0 : nextWith(0); }
      if (start < 0) { start = 0; }
      wrap.appendChild(strip); wrap.appendChild(line); wrap.appendChild(box);
      body.appendChild(wrap);
      select(start, false);
      if (!p.ymd) { setParams({ ymd: wk[start].ymd }, finderUrl('finder-day', extend(jpOf(p), { ymd: wk[start].ymd }))); }
      fire('ef:finder', { screen: 'day', mode: 'day', src: p.src || null, pass: p.pass || null });
    }
  };
}

/* ---------------- W1 Show week "The week, today first" ---------------- */
function viewFinderWeek(p) {
  var wk = A().week();
  return {
    label: p.pass ? passLabel(p.pass) : FT.weekLabel, mode: 'finder', testid: 'step-finder-week',
    render: function (body) {
      var wrap = h('div', { cls: 'view view--fweek', 'data-testid': 'step-finder-week' }), board = h('div', { cls: 'find-week' }), sampled = false, noted = false, ci = 0;
      wrap.appendChild(finderTitle(FT.weekH));
      wk.forEach(function (d, i) {
        var hid = 'find-wh-' + i, left = leftOf(d);
        var sec = h('section', { cls: 'find-wday', 'aria-labelledby': hid, 'data-ymd': d.ymd, 'data-index': String(i + 1) }, h('h3', { cls: 'find-wday__h', id: hid, text: (i === 0 ? 'Today · ' : (i === 1 ? 'Tomorrow · ' : '')) + A().dateShort(d.ymd) }));
        if (!left.length) {
          sec.appendChild(h('p', { cls: 'find-empty', 'data-testid': d.isToday && d.occs.length ? 'finder-done-today' : 'finder-empty', text: d.isToday && d.occs.length ? FT.todayDone : 'No classes.' }));
        } else {
          var ul = h('ul', { cls: 'find-chips' });
          left.forEach(function (o) {
            var bk = o.booking, duoBlock = p.pass === 'duo' && !o.full && o.spotsLeft < 2;
            var lbl = duoBlock ? null : (bk ? (bk.waitlist ? 'On the waitlist' : 'Booked') : spotsLabel(o.spotsLeft));
            var seats = h('span', { cls: 'find-chip__seats', 'aria-hidden': 'true' }, duoBlock ? [h('span', { cls: 'find-chip__l', text: FT.duoChip[0] }), h('span', { cls: 'find-chip__l', text: FT.duoChip[1] })] : lbl);
            ci++;
            if (!sampled) { seats.appendChild(quietSample()); sampled = true; }
            var b = h('button', { type: 'button', cls: 'find-chip' + (o.full ? ' find-chip--full' : '') + (bk ? ' find-chip--booked' : ''), 'data-testid': 'finder-chip', 'data-occ': o.id, 'data-free': String(o.spotsLeft), 'data-full': o.full ? 'true' : 'false', 'data-index': String(ci), 'aria-disabled': duoBlock ? 'true' : null }, [
              h('span', { cls: 'find-chip__time', text: t12(o.time) }),
              h('span', { cls: 'find-chip__name', text: shortName(o) }),
              seats,
              vhs('. ' + occName(o, duoBlock))
            ]);
            b.addEventListener('click', function () { if (duoBlock) { return; } rememberBack({ testid: 'finder-chip', occ: o.id }); handOver(o.id, 'chip', p); });
            ul.appendChild(h('li', null, b));
          });
          sec.appendChild(ul);
        }
        if (d.dow >= 6 && !noted) { var wn = weekendNote(); if (wn) { sec.appendChild(wn); noted = true; } }
        board.appendChild(sec);
      });
      wrap.appendChild(board);
      body.appendChild(wrap);
      fire('ef:finder', { screen: 'week', mode: 'week', src: p.src || null, pass: p.pass || null });
    }
  };
}

/* ---------------- B1 By class "What do you want to train?" (RULINGS #37: all 10 classes, 4 type headers, one media each) ---------------- */
function typeMedia(f) {
  var nm = (A().data.nextup_media || {})[f.id];
  /* engine-v2 1.2.1: thumb_pos (optional) is the 4:3 thumbnail's face-safe object-position, falling back to pos; stock comes from the
     overlay item, else from the family, and always shows the "Stock clip" label (RULINGS #28) */
  if (nm && (nm.poster || nm.still)) { return { video: nm.video || null, poster: nm.poster || nm.still, pos: nm.thumb_pos || nm.pos || null, stock: !!nm.stock }; }
  return { video: f.video || null, poster: f.poster || null, pos: (nm && nm.thumb_pos) || f.thumb_pos || null, stock: !!f.stock };   /* no club footage: the family clip, labelled */
}
function mediaBox(m) {
  var box = h('span', { cls: 'find-type__media', 'aria-hidden': 'true' }), img, v;
  if (m.poster) { img = h('img', { cls: 'media__poster', src: m.poster, alt: '', width: '96', height: '72', loading: 'lazy', decoding: 'async' }); if (m.pos) { img.style.objectPosition = m.pos; } box.appendChild(img); }
  if (m.video) { v = h('video', { 'data-clip': '', 'data-group': 'sheet', muted: true, loop: true, playsinline: true, preload: 'none', src: m.video, 'aria-hidden': 'true', tabindex: '-1' }); v.muted = true; if (m.pos) { v.style.objectPosition = m.pos; } box.appendChild(v); }
  return box;
}
function clsLine(c) {
  var fd = A().data.finder || {}, lines = fd.lines || {}, co = A().coach(c.coach);
  if (lines[c.id]) { return lines[c.id]; }
  return (fd.template || '{coach}, {n} times a week').replace('{coach}', co ? co.name : '').replace('{n}', String(A().slots(c.id).length));
}
function nextFree(classId, pass) {
  var list = A().nextOfClass(classId, { n: 40, open: true }), i;
  for (i = 0; i < list.length; i++) { if (pass !== 'duo' || list[i].spotsLeft >= 2) { return list[i]; } }
  return null;
}
function sessionsOf(classId) { var out = []; A().week().forEach(function (d) { d.occs.forEach(function (o) { if (o.classId === classId && !o.past) { out.push(o); } }); }); return out; }
function dayHead(d, i) { return (i === 0 ? 'Today · ' : (i === 1 ? 'Tomorrow · ' : '')) + A().dateShort(d.ymd); }
function viewFinderClass(p) {
  return {
    label: p.pass ? passLabel(p.pass) : FT.classLabel, mode: 'finder', testid: 'step-finder-class',
    render: function (body) {
      var wrap = h('div', { cls: 'view view--fclass', 'data-testid': 'step-finder-class' }), types = h('div', { cls: 'find-types' }), idx = 0;
      wrap.appendChild(finderTitle(FT.classH));
      (A().data.families || []).forEach(function (f, gi) {
        var classes = A().classesInFamily(f.id), m, hid = 'find-th-' + f.id, sec, ul;
        if (!classes.length) { return; }
        m = typeMedia(f);
        sec = h('section', { cls: 'find-type', 'data-type': f.id, 'data-index': String(gi + 1), 'aria-labelledby': hid });
        sec.appendChild(h('h3', { cls: 'find-type__head', id: hid, 'data-testid': 'finder-typehead-' + f.id }, [
          mediaBox(m), h('span', { cls: 'find-type__icon', 'aria-hidden': 'true' }), h('span', { cls: 'find-type__name', text: f.name }),
          m.stock ? h('span', { cls: 'find-type__stock', text: FT.stock }) : null
        ]));
        ul = h('ul', { cls: 'find-list find-clss' });
        classes.forEach(function (c) {
          var nx = nextFree(c.id, p.pass), line = clsLine(c), b;
          idx++;
          b = h('button', { type: 'button', cls: 'find-cls', 'data-testid': 'finder-class-' + c.id, 'data-class': c.id, 'data-family': f.id, 'data-index': String(idx) }, [
            h('span', { cls: 'find-cls__name', text: c.name }), vhs('. '),
            h('span', { cls: 'find-cls__line', text: line }), vhs('. '),
            h('span', { cls: 'find-cls__next', 'data-testid': 'finder-class-next' }, nx ? [vhs(FT.nextFree), h('span', { cls: 'find-cls__day', 'aria-hidden': 'true', text: dayWord(nx) }), vhs(daySr(nx) + ', '), h('span', { cls: 'find-cls__time', text: t12(nx.time) }), vhs('.')] : [h('span', { cls: 'find-cls__day', text: FT.fullNext[0] }), h('span', { cls: 'find-cls__time', text: FT.fullNext[1] })]),
            h('span', { cls: 'find-cls__go', 'aria-hidden': 'true', text: '›' })
          ]);
          b.addEventListener('click', function () {
            fire('ef:finder-class', { classId: c.id, count: sessionsOf(c.id).length });
            rememberBack({ testid: 'finder-class-' + c.id, cls: c.id });
            toScreen(p, 'finder-sessions', { mode: 'class', cls: c.id });
          });
          ul.appendChild(h('li', null, b));
        });
        sec.appendChild(ul);
        types.appendChild(sec);
      });
      wrap.appendChild(types);
      body.appendChild(wrap);
      fire('ef:finder', { screen: 'class', mode: 'class', src: p.src || null, pass: p.pass || null });
    }
  };
}

/* ---------------- B2 "{Class name}": that class's times across the week ---------------- */
function viewFinderSessions(p) {
  var c = p.cls ? A().cls(p.cls) : null;
  if (!c) { return { redirect: { kind: 'finder-class', params: extend(jpOf(p), { mode: 'class' }), url: finderUrl('finder-class', jpOf(p)) } }; }
  return {
    label: p.pass ? passLabel(p.pass) : FT.classLabel, mode: 'finder', testid: 'step-finder-sessions',
    render: function (body) {
      var wrap = h('div', { cls: 'view view--fsessions', 'data-testid': 'step-finder-sessions', 'data-class': c.id }), wk = A().week(), list = sessionsOf(c.id);
      var groups = h('div', { cls: 'find-groups' }), first = true, noted = false, gi = 0, ri = 0;
      function group(head, occs, dow, hid) {
        var sec = h('section', { cls: 'find-group', 'data-index': String(++gi), 'aria-labelledby': hid }, h('h3', { cls: 'find-group__h', id: hid, text: head }));
        var ul = h('ul', { cls: 'find-list' });
        occs.forEach(function (o) { ul.appendChild(findRow(o, first, p, { noName: true, index: ++ri })); first = false; });
        sec.appendChild(ul);
        if (dow >= 6 && !noted) { var wn = weekendNote(); if (wn) { sec.appendChild(wn); noted = true; } }
        groups.appendChild(sec);
      }
      wrap.appendChild(finderTitle(c.name));
      wrap.appendChild(h('p', { cls: 'find-sub', text: countTxt(list.length) + ' in the next 7 days' }));
      if (list.length) {
        wk.forEach(function (d, i) { var occs = d.occs.filter(function (o) { return o.classId === c.id && !o.past; }); if (occs.length) { group(dayHead(d, i), occs, d.dow, 'find-gh-' + i); } });
      } else {
        wrap.appendChild(h('p', { cls: 'find-empty', 'data-testid': 'finder-empty', text: 'No ' + c.name + ' in the next 7 days.' }));
        var nx = A().nextOfClass(c.id);   /* the next session beyond the week keeps the class bookable */
        if (nx) { group(A().dateShort(nx.ymd), [nx], 0, 'find-gh-next'); }
      }
      wrap.appendChild(groups);
      body.appendChild(wrap);
      fire('ef:finder', { screen: 'sessions', mode: 'class', src: p.src || null, pass: p.pass || null });
    }
  };
}

/* ---------------- the public entry (FINDER-SPEC 7.4) ----------------
   EF.booking.openFinder({src, pass, mode, ymd, type}): step 0, or (mode) step 0 underneath plus that mode screen, so Back walks up to
   step 0 and then closes. Generic Book buttons only; class-specific entries keep EF.booking.open(occId). Returns true when it opens. */
function openFinder(opts) {
  opts = normOpts(opts);
  if (pendingTraverse) { queued = function () { openFinder(opts); }; return true; }
  if (!A().data) {
    A().load().then(function () { openFinder(opts); }, function () { if (!opened) { EF.sheet.open('finder', { entry: 'finder', src: opts.src || null, error: true }, finderUrl('finder', {})); } });
    return false;
  }
  if (opened && !opts.force) { return false; }
  var base = { entry: opts.pass ? 'pass' : 'finder', src: opts.src || null, pass: opts.pass || null, mode: null };
  var m = null, i;
  for (i = 0; i < FT.modes.length; i++) { if (FT.modes[i].id === opts.mode && views[FT.modes[i].kind]) { m = FT.modes[i]; } }
  var chain = [['finder', base]];
  if (m) { chain.push([m.kind, extend(base, { mode: m.id, ymd: opts.ymd || null })]); }
  if (m && m.id === 'class' && opts.cls && A().cls(opts.cls)) { chain.push(['finder-sessions', extend(base, { mode: 'class', cls: opts.cls })]); }
  for (i = 0; i < chain.length; i++) { navigate('push', chain[i][0], chain[i][1], finderUrl(chain[i][0], chain[i][1]), i < chain.length - 1); }
  return true;
}
function openCoach(id) {
  if (!A().data) { A().load().then(function () { openCoach(id); }); return false; }
  if (!A().coach(id)) { return false; }
  if (EF.sheet.isOpen() && EF.sheet.isPanel()) { return navigate('replace', 'coach', { coachId: id }, urlFor('coach', id), false, 'swap'); }
  return EF.sheet.open('coach', { coachId: id }, urlFor('coach', id));
}
EF.booking = {
  open: openClass,
  openFinder: openFinder,
  finderMode: readMode,
  openCoach: openCoach,
  draft: readDraft,
  DEFAULT_PAY: DEFAULT_PAY,
  version: '1.2.1'
};

/* ---------------- boot: deep links and reload ---------------- */
function parseQuery() {
  var out = {}, s = win.location.search.replace(/^\?/, ''), parts, i, kv;
  if (!s) { return out; }
  parts = s.split('&');
  for (i = 0; i < parts.length; i++) { kv = parts[i].split('='); try { out[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } catch (e) {} }
  return out;
}
function cleanUrl() {
  var np = A().nowParam, qs = [];
  if (np) { qs.push('now=' + encodeURIComponent(np).replace(/%3A/g, ':')); }
  if (payloadView) { qs.push('payload=1'); }
  try { win.history.replaceState(null, '', win.location.pathname + (qs.length ? '?' + qs.join('&') : '') + win.location.hash); } catch (e) {}
}
function boot() {
  try { win.history.scrollRestoration = 'manual'; } catch (e) {}
  var qs = parseQuery(), occ, chain, i, f, exact;
  if (!qs.pass && qs.join && JOIN_ALIAS[qs.join]) { qs.pass = JOIN_ALIAS[qs.join]; }   /* engine-v2: &join= alias */
  if (qs['class']) {
    occ = A().occ(qs['class']);
    cleanUrl();
    if (!occ) { EF.toast(T.toast.notfound); var wk = doc.getElementById('week') || doc.getElementById('schedule'); if (wk) { try { wk.focus({ preventScroll: true }); } catch (er) {} } return; }
    exact = A().parseOccId(qs['class']);
    if (exact && exact.classId && occ.id !== qs['class']) { win.setTimeout(function () { EF.toast(T.toast.started); }, 300); }
    var bk = A().bookingFor(occ.id);
    if (!bk) { ensureDraft(occ, { pass: qs.step === 'member' ? 'member' : (qs.step === 'membership' ? 'membership' : qs.pass), src: qs.pass ? 'share' : 'deeplink', fromPage: !(qs.step === 'details' || qs.step === 'pay') }); }
    chain = ['class'];
    f = readDraft();
    if (!bk && (qs.pass || qs.step === 'details' || qs.step === 'member' || qs.step === 'membership' || qs.step === 'pay') && f && f.pass) { chain.push('details'); }
    if (qs.step === 'pay' && !bk && !occ.full && f && f.pay === 'now' && f.pass) { chain.push('pay'); }
    else if (qs.step === 'done' && bk) { chain = ['done']; }
    for (i = 0; i < chain.length; i++) { navigate('push', chain[i], { occId: occ.id }, urlFor(chain[i], occ.id), i < chain.length - 1); }
  } else if (qs.coach) {
    cleanUrl();
    if (A().coach(qs.coach)) { openCoach(qs.coach); }
  } else if (qs.finder) {
    /* FINDER-SPEC 7.1 deep links: ?finder=1 | day&day=YYYYMMDD | week | class(&type=). Deep links never write the remembered mode (1.3). */
    cleanUrl();
    openFinder({ mode: /^(day|week|class)$/.test(qs.finder) ? qs.finder : null, ymd: /^\d{8}$/.test(qs.day || '') ? qs.day.slice(0, 4) + '-' + qs.day.slice(4, 6) + '-' + qs.day.slice(6) : null, cls: qs.cls || null, src: 'deeplink', pass: qs.pass || qs.join || null });
  }
}

views.finder = viewFinder;
views['finder-day'] = viewFinderDay;
views['finder-week'] = viewFinderWeek;
views['finder-class'] = viewFinderClass;
views['finder-sessions'] = viewFinderSessions;
views['class'] = viewClass;
views.details = viewDetails;
views.pay = viewPay;
views.done = viewDone;
views.coach = viewCoach;

initSheet();
A().load().then(boot, function () {});
})(window, document);
