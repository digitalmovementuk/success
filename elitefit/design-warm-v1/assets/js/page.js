/* Elite Fit · Home v2 · page.js · v1.1, 28 Oct 2026. Built from variants/s3-home/assets/js/page.js (the design master) by
   page_v11.py, changed only where a Raoul decision or SEO-SPEC needs it: the schedule enhances the crawlable <table>
   rows in place (instead of a JS-only list), "Room for N more" becomes the free-spots seat row, price CTAs open the sheet with that
   option, the hero quote rotator, the coach role drops "Weight loss" (FACTS F2-CCH-01).
   v1.3, 29 Oct 2026 (switch_v13.py): runs on the shared engine-v2 (../../engine-v2/api.js, booking.js). The engine binds the generic
   Book, the price buttons and "Get a Duo Day Pass" (the class finder, RULINGS #30, #36); this page keeps the class-specific entries
   (rows, week chips, Next-up cards, family cards, coaches, the Now bar) on EF.booking.open().
   Renders and wires this variant from EF.api:
   visitor toggle, next up, the classes inside each family card, the friendly schedule ("Who's coaching tomorrow?"),
   the filter drawer (an EF.sheet view), coach counts, prices, the sticky dock and the header CTA.
   Hooks follow the shared page contract so the shared booking engine (booking.js) works unchanged. Classic deferred script, ES5. */
(function (w, d) {
'use strict';
var EF = w.EF = w.EF || {};
var root = d.documentElement;

/* ---------- helpers ---------- */
function qs(s, c) { return (c || d).querySelector(s); }
function qsa(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
function emit(name, detail) { var ev; try { ev = new CustomEvent(name, { detail: detail }); } catch (e) { ev = d.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); } d.dispatchEvent(ev); }
function mq(q) { try { return w.matchMedia(q); } catch (e) { return { matches: false }; } }
var mqDesk = mq('(min-width: 1024px)');
function motionOn() { return root.classList.contains('motion-ok'); }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function store() { try { return (EF.api && EF.api.store && EF.api.store.get()) || {}; } catch (e) { return {}; } }
function storeSet(p) { try { if (EF.api && EF.api.store) { EF.api.store.set(p); } } catch (e) { } }
function scrollToEl(el) { if (!el) { return; } try { el.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'start' }); } catch (e) { el.scrollIntoView(); } }
function openOcc(id, opts) { if (EF.booking && EF.booking.open && id) { EF.booking.open(id, opts || {}); } }
function listJoin(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
function dayPhrase(o) { return o.dayIndex === 0 ? 'today' : (o.dayIndex === 1 ? 'tomorrow' : EF.api.dateShort(o.ymd)); }
function isSample(cls, field) { return !!(cls.sample_fields && cls.sample_fields.indexOf(field) > -1) || (field === 'length' && !!cls.length_sample); }
var CHIP = ' <span class="sample" data-wc="skip">Sample</span>';
function seats(free, cap) { return EF.seats ? EF.seats.html(free, cap) : ''; }
function spotsText(o) {
  if (o.past) { return 'Finished'; }
  if (o.booking && !o.booking.waitlist) { return "You're booked"; }
  if (o.booking) { return 'On the waitlist'; }
  if (o.full) { return 'Full · waitlist open'; }
  return 'Room for ' + o.spotsLeft + ' more';
}

var DATA = null;

/* ---------- static bindings ---------- */
function bindStatic() {
  var p = DATA.passes, c = DATA.club;
  var prices = { day: p.day.price_idr, duo: p.duo.price_idr, 'duo-total': p.duo.price_idr * (p.duo.people || 2), 'duo-old': p.duo.old_price_idr, recharge_day: p.recharge_day.price_idr };
  qsa('[data-price]').forEach(function (el) { var v = prices[el.getAttribute('data-price')]; if (v) { el.textContent = EF.api.k(v); } });
  qsa('[data-bind="weekly-count"]').forEach(function (el) { el.textContent = EF.api.weeklyCount(); });
  qsa('[data-bind="weekend-note"]').forEach(function (el) { el.textContent = DATA.timetable.weekend_note; });
  qsa('[data-bind="address"]').forEach(function (el) { el.textContent = c.address; });
  qsa('[data-bind="wa-link"]').forEach(function (el) { el.textContent = c.whatsapp.number; el.href = 'https://wa.me/' + c.whatsapp.wa; });
}


/* ---------- next up: three invite cards ---------- */
var nextBox, lastSpots = {};
function whenLabel(o) {
  if (o.dayIndex === 0) { return 'Today · ' + EF.api.dateShort(o.ymd); }
  if (o.dayIndex === 1) { return 'Tomorrow · ' + EF.api.dateShort(o.ymd); }
  return EF.api.dateLong(o.ymd);
}
var nextKey = '';
/* every avatar the page draws comes from its own assets/img/r/ files (RULINGS #53a); the v1 96 px file is no longer requested */
function avR(src) { var m = /avatar-([a-z]+)\.webp/.exec(String(src || '')); return m ? 'assets/img/r/avatar-' + m[1] + '-96.webp' : src; }
function ssAttr(src, px) { var m = (DATA && DATA.srcset) || {}, v = m[String(src || '').split('/').pop()]; return v ? ' srcset="' + v + '" sizes="' + px + 'px"' : ''; }
function renderNext(roll) {
  if (!nextBox) {
    nextBox = qs('[data-nextup]');
    if (!nextBox) { return; }
    nextBox.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-occ]'); if (b) { openOcc(b.getAttribute('data-occ')); } });
  }
  var list = EF.api.upcoming(3);
  if (!list.length) { nextBox.innerHTML = '<p class="nextup__loading">No classes left this week. New dates appear every day.</p>'; nextKey = ''; return; }
  var prev = {}, key = list.map(function (o) { return o.id; }).join('|');
  if (key === nextKey && nextBox.querySelector('.ncard')) {
    list.forEach(function (o) { var sp = nextBox.querySelector('[data-spots="' + o.id + '"]'); if (sp) { sp.innerHTML = seats(o.spotsLeft, o.capacity); } lastSpots[o.id] = o.spotsLeft; });
    return;
  }
  nextKey = key;
  var NM = {}, k0, src0 = [(DATA && DATA.nextup_media) || {}, (DATA && DATA.nextup_media_page) || {}];   /* the stock mobility clip is page-only (v2.json nextup_media_page) */
  src0.forEach(function (o) { for (k0 in o) { if (Object.prototype.hasOwnProperty.call(o, k0)) { NM[k0] = o[k0]; } } });
  function media(o) {
    var m = NM[o.cls.family];
    if (!m) { return ''; }
    var pos = ' style="object-position:' + esc(m.card_pos || m.pos || '50% 50%') + '"';   /* pos is the finder's 4:3 crop */
    return '<span class="ncard__media" aria-hidden="true"><img class="media__poster" src="' + esc(m.poster || m.still) + '" alt="" width="640" height="300" loading="lazy" decoding="async"' + pos + '>' +
      (m.video ? '<video data-clip data-group="nextup" muted loop playsinline preload="none" src="' + esc(m.video) + '" aria-hidden="true" tabindex="-1"' + pos + '></video>' : '') + '</span>';
  }

  nextBox.innerHTML = list.map(function (o, i) {
    var md = media(o);
    return '<button class="ncard' + (md ? ' has-media' : '') + '" type="button" data-testid="next-card" data-occ="' + esc(o.id) + '" style="--i:' + i + '">' + md +
      '<span class="ncard__when">' + esc(whenLabel(o)) + (i === 0 ? CHIP : '') + '</span>' +
      '<span class="ncard__time">' + esc(o.time) + '</span>' +
      '<span class="ncard__name">' + esc(o.cls.name) + '</span>' +
      '<span class="who-line"><img src="' + esc(avR(o.coach.avatar)) + '"' + ssAttr(o.coach.avatar, 40) + ' alt="" width="40" height="40" loading="lazy"><span>with <b>' + esc(o.coach.name) + '</b></span></span>' +
      '<span class="ncard__meta">' + o.cls.length_min + ' min · ' + esc(o.cls.level) + ((NM[o.cls.family] && NM[o.cls.family].stock) ? ' · Stock clip' : '') + '</span>' +
      '<span class="ncard__foot"><span class="spots" data-spots="' + esc(o.id) + '">' + seats(o.spotsLeft, o.capacity) + '</span>' +
      '<span class="fauxbtn">Book <span class="arr" aria-hidden="true">→</span></span></span>' +
    '</button>';
  }).join('');
  list.forEach(function (o) { lastSpots[o.id] = o.spotsLeft; });
  if (EF.motion && EF.motion.scan) { EF.motion.scan(nextBox.parentNode); }
  if (EF.media && EF.media.scan) { EF.media.scan(nextBox); }
}

/* ---------- classes: the class rows inside each family card ---------- */
function daysText(slots) {
  var seen = [], i;
  for (i = 0; i < slots.length; i++) { if (seen.indexOf(slots[i].dowShort) < 0) { seen.push(slots[i].dowShort); } }
  return listJoin(seen);
}
function renderChapters() {
  qsa('[data-chap-classes]').forEach(function (ul) {
    var fid = ul.getAttribute('data-chap-classes'), classes = EF.api.classesInFamily(fid), weekly = 0;
    ul.innerHTML = classes.map(function (c) {
      var slots = EF.api.slots(c.id), co = EF.api.coach(c.coach), next = EF.api.occ(c.id);
      weekly += slots.length;
      var when = next ? 'Next: ' + dayPhrase(next) + ' at ' + next.time : '';
      return '<li><button class="frow" type="button" data-open-occ="' + esc(next ? next.id : '') + '"' + (next ? '' : ' disabled') + '>' +
        (co ? '<img src="' + esc(avR(co.avatar)) + '"' + ssAttr(co.avatar, 40) + ' alt="" width="40" height="40" loading="lazy">' : '') +
        '<span class="frow__name">' + esc(c.name) + '</span>' +
        '<span class="frow__meta">' + esc((co ? co.name + ' · ' : '') + daysText(slots)) + '<br>' + esc(when) + '</span>' +
        '<span class="frow__go">Book</span></button></li>';
    }).join('');
    var card = ul.closest('.chap__card'), cnt = card && qs('[data-bind="fam-count"]', card);
    if (cnt) { cnt.textContent = plural(weekly, 'class', 'classes') + ' a week'; }
  });
}

/* ---------- schedule ---------- */
var S = { day: 0, family: '', coaches: [], times: [], levels: [] };
var sched = {};
var TIMES = [
  { id: 'morning', name: 'Morning, before 12:00', test: function (t) { return t < '12:00'; } },
  { id: 'afternoon', name: 'Afternoon, from 12:00', test: function (t) { return t >= '12:00' && t < '17:00'; } },
  { id: 'evening', name: 'Evening, from 17:00', test: function (t) { return t >= '17:00'; } }
];
var LEVELS = [{ id: 'beginner', name: 'Beginner' }, { id: 'advanced', name: 'Advanced' }, { id: 'all', name: 'All levels' }];
function matches(o, f) {
  if (f.family && o.family.id !== f.family) { return false; }
  if (f.coaches.length && f.coaches.indexOf(o.coach.id) < 0) { return false; }
  if (f.times.length && !TIMES.some(function (t) { return f.times.indexOf(t.id) > -1 && t.test(o.time); })) { return false; }
  if (f.levels.length && f.levels.indexOf(o.cls.level_key) < 0) { return false; }
  return true;
}
function filterCount(f) { return (f.family ? 1 : 0) + f.coaches.length + f.times.length + f.levels.length; }
function copyF(f) { return { day: f.day, family: f.family, coaches: f.coaches.slice(), times: f.times.slice(), levels: f.levels.slice() }; }
function dayRows(i, f) { var day = EF.api.week()[i]; return day ? day.occs.filter(function (o) { return matches(o, f); }) : []; }

function renderDays() {
  var wk = EF.api.week(), booked = {};
  (store().bookings || []).forEach(function (b) { booked[b.ymd] = true; });
  sched.days.innerHTML = '<span class="days__ind" aria-hidden="true"></span>' + wk.map(function (day, i) {
    var sel = i === S.day;
    return '<button class="day' + (day.isToday ? ' is-today' : '') + (booked[day.ymd] ? ' has-booking' : '') + '" type="button" role="tab" id="day-tab-' + i + '" data-testid="day-' + i + '" data-day="' + i + '" aria-selected="' + sel + '" aria-controls="sched-rows" tabindex="' + (sel ? 0 : -1) + '">' +
      '<span class="day__dow">' + esc(day.isToday ? 'Today' : day.dowShort) + '</span><span class="day__num">' + day.dayNum + '</span>' +
      '<span class="vh">, ' + esc(day.long + ', ' + plural(day.occs.length, 'class', 'classes')) + (booked[day.ymd] ? ', you have a booking' : '') + '</span><span class="day__dot" aria-hidden="true"></span></button>';
  }).join('');
  moveInd();
}
function moveInd() {
  var ind = qs('.days__ind', sched.days), btn = qs('[data-day="' + S.day + '"]', sched.days);
  if (!ind || !btn) { return; }
  ind.style.width = btn.offsetWidth + 'px';
  ind.style.left = btn.offsetLeft + 'px';
}
function selectDay(i, focus) {
  S.day = i;
  qsa('.day', sched.days).forEach(function (b) {
    var on = +b.getAttribute('data-day') === i;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.tabIndex = on ? 0 : -1;
    if (on && focus) { b.focus(); }
  });
  moveInd();
  renderWho(true);
  renderRows(true);
}

/* "Who's coaching tomorrow?": the faces of the day; tapping one shows only their classes */
function whoTitle(day) {
  if (day.i === 0) { return "Who's coaching today?"; }
  if (day.i === 1) { return "Who's coaching tomorrow?"; }
  return "Who's coaching on " + day.long.split(' ')[0] + '?';
}
function renderWho(pop) {
  var day = EF.api.week()[S.day];
  if (!day || !sched.who) { return; }
  sched.whoTitle.textContent = whoTitle(day);
  var ids = [], counts = {};
  day.occs.forEach(function (o) { if (ids.indexOf(o.coach.id) < 0) { ids.push(o.coach.id); counts[o.coach.id] = 0; } counts[o.coach.id]++; });
  sched.faces.innerHTML = ids.map(function (id, i) {
    var c = EF.api.coach(id), on = S.coaches.length === 1 && S.coaches[0] === id;
    return '<button class="face' + (pop && motionOn() ? ' is-new' : '') + '" type="button" data-face="' + esc(id) + '" aria-pressed="' + on + '" style="--i:' + i + '">' +
      '<img src="' + esc(avR(c.avatar)) + '"' + ssAttr(c.avatar, 60) + ' alt="" width="60" height="60"><b>' + esc(c.name) + '</b><small>' + plural(counts[id], 'class', 'classes') + '</small><span class="vh">, show only their classes</span></button>';
  }).join('');
}
function actHtml(o) {
  if (o.past) { return '<span class="row__label">Finished</span>'; }
  if (o.booking && !o.booking.waitlist) { return '<button class="rbtn rbtn--booked" type="button" data-testid="row-book" data-book="' + esc(o.id) + '" aria-haspopup="dialog" aria-label="Booked: ' + esc(o.cls.name + ' ' + o.time) + '">Booked</button>'; }
  if (o.booking) { return '<button class="rbtn rbtn--booked" type="button" data-testid="row-book" data-book="' + esc(o.id) + '" aria-haspopup="dialog" aria-label="On the waitlist: ' + esc(o.cls.name + ' ' + o.time) + '">Waitlist</button>'; }
  if (panelOcc === o.id) { return '<button class="rbtn rbtn--booked" type="button" data-testid="row-book" data-book="' + esc(o.id) + '" aria-label="' + esc(o.cls.name + ' ' + o.time + ', open in the panel') + '">In panel</button>'; }
  if (o.full) { return '<button class="rbtn" type="button" data-testid="row-book" data-book="' + esc(o.id) + '" aria-haspopup="dialog" aria-label="' + esc('Join waitlist for ' + o.cls.name + ' at ' + o.time) + '">Join waitlist</button>'; }
  return '<button class="rbtn" type="button" data-testid="row-book" data-book="' + esc(o.id) + '" aria-haspopup="dialog" aria-label="' + esc('Book ' + o.cls.name + ' at ' + o.time) + '">Book</button>';
}
var panelOcc = null;
function enhanceRow(tr, o, i, animate) {
  tr.setAttribute('data-occ', o.id);
  tr.setAttribute('data-testid', 'row');
  tr.style.setProperty('--i', String(i));
  tr.classList.toggle('is-past', !!o.past);
  tr.classList.toggle('is-booked', !!o.booking);
  var label = o.cls.name + ', ' + o.time + ' with ' + o.coach.name + '. ' + spotsText(o) + '. See details';
  var hit = qs('.row__hit', tr);
  if (o.past) { if (hit) { hit.parentNode.removeChild(hit); } }
  else {
    if (!hit) { var main = qs('.row__main', tr); main.insertAdjacentHTML('afterbegin', '<button class="row__hit" type="button" aria-haspopup="dialog"></button>'); hit = qs('.row__hit', main); }
    hit.setAttribute('data-open', o.id); hit.setAttribute('aria-label', label);
  }
  var sp = qs('.row__spots', tr), nowFree = o.past ? -1 : (o.booking ? -2 : o.spotsLeft), prev = sp.hasAttribute('data-free') ? +sp.getAttribute('data-free') : null;
  if (prev !== nowFree) {
    var dots = qsa('.seat', sp);
    if (prev !== null && prev > nowFree && nowFree >= 0 && dots.length === o.capacity) {
      dots.forEach(function (el, k) { el.classList.toggle('seat--free', k < nowFree); });
      var lab = qs('.seatrow__lbl', sp), sr = qs('.seatrow .vh', sp), txt = EF.seats.label(nowFree), m = /^\d+/.exec(txt);
      if (lab) { lab.innerHTML = m ? '<b>' + m[0] + '</b>' + esc(txt.slice(m[0].length)) : esc(txt); }
      if (sr) { sr.textContent = nowFree <= 0 ? 'Full, ' + o.capacity + ' of ' + o.capacity + ' spots taken. Join the waitlist.' : nowFree + ' of ' + o.capacity + ' spots free'; }
      var rowEl = qs('.seatrow', sp); rowEl.setAttribute('data-free', nowFree); rowEl.classList.toggle('seatrow--full', nowFree <= 0);
    } else {
      sp.innerHTML = o.past ? ' · Finished' : (o.booking ? ' · ' + esc(spotsText(o)) : seats(o.spotsLeft, o.capacity));
    }
    sp.setAttribute('data-free', nowFree);
  }
  qs('.row__act', tr).innerHTML = actHtml(o);
  tr.classList.remove('is-enter');
  if (animate && motionOn()) { void tr.offsetWidth; tr.classList.add('is-enter'); }
}
var swapTimer = 0;
var mqWeek = w.matchMedia ? w.matchMedia('(min-width: 1024px)') : null;
function weekGrid() { return !!(mqWeek && mqWeek.matches); }
if (mqWeek) { var reWeek = function () { if (sched && sched.tbl) { renderRows(false); } }; if (mqWeek.addEventListener) { mqWeek.addEventListener('change', reWeek); } else if (mqWeek.addListener) { mqWeek.addListener(reWeek); } }
function renderRows(animate) {
  var wk = EF.api.week(), day = wk[S.day];
  if (!day) { return; }
  var grid = weekGrid(), list = dayRows(S.day, S);
  function draw() {
    qsa('tbody', sched.tbl).forEach(function (tb) {
      var dow = +tb.getAttribute('data-dow'), di = -1;
      wk.forEach(function (x, k) { if (x.dow === dow) { di = k; } });
      var d0 = grid ? wk[di] : (dow === day.dow ? day : null);
      tb.hidden = !d0;
      if (!d0) { return; }
      if (grid) { var th = qs('.tt__day th', tb); if (th) { th.textContent = d0.dowShort + ' ' + d0.dayNum + ' ' + d0.monthShort; } }   /* V2-1: the week grid's headers carry the date, today first */
      var shown = {}, i = 0;
      (grid ? dayRows(di, S) : list).forEach(function (o) { shown[o.id] = true; });
      qsa('tr.row', tb).forEach(function (tr) {
        var o = null;
        d0.occs.forEach(function (x) { if (x.classId === tr.getAttribute('data-class') && x.time === tr.getAttribute('data-time')) { o = x; } });
        if (!o) { tr.hidden = true; return; }
        tr.hidden = !shown[o.id];
        if (!tr.hidden) { enhanceRow(tr, o, i++, animate && !grid); }
      });
    });
    sched.tbl.classList.remove('is-swapping');
    sched.empty.hidden = list.length > 0;
    sched.title.textContent = (day.isToday ? 'Today,\u00a0' : (day.i === 1 ? 'Tomorrow,\u00a0' : '')) + day.long.replace(/ (\S+)$/, '\u00a0$1');   /* v1.3: "Tomorrow, Friday / 30 October", never one word alone */
    sched.count.textContent = plural(list.length, 'class', 'classes');
    var left = day.occs.filter(function (o) { return !o.past; }).length;
    if (day.isToday && day.occs.length && !left) {
      var tmr = wk[1] && wk[1].occs[0];
      sched.done.textContent = "That's today done." + (tmr ? ' Tomorrow starts at ' + tmr.time + ' with ' + tmr.cls.name + '.' : '');
      sched.done.hidden = false;
    } else { sched.done.hidden = true; }
  }
  clearTimeout(swapTimer);
  if (animate && motionOn()) { sched.tbl.classList.add('is-swapping'); swapTimer = setTimeout(draw, 150); } else { draw(); }
  renderBadge();
}
function renderBadge() {
  var n = filterCount(S), b = sched.badge;
  if (b) {
    var before = b.textContent;
    b.textContent = n;
    b.hidden = n === 0;
    if (String(n) !== before && n > 0 && motionOn()) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); }
  }
  qsa('.fchip', sched.chips).forEach(function (c) { c.setAttribute('aria-pressed', (c.getAttribute('data-fam') || '') === S.family ? 'true' : 'false'); });
  qsa('.face', sched.faces).forEach(function (f) { f.setAttribute('aria-pressed', S.coaches.length === 1 && S.coaches[0] === f.getAttribute('data-face') ? 'true' : 'false'); });
}
function firstOpenDay() {
  var wk = EF.api.week(), i;
  for (i = 0; i < wk.length; i++) { if (wk[i].occs.some(function (o) { return !o.past; })) { return i; } }
  return 0;
}
function initSchedule() {
  var box = qs('[data-schedule]');
  if (!box) { return; }
  sched = {
    box: box, days: qs('[data-days]', box), chips: qs('[data-fchips]', box), badge: qs('[data-filter-count]', box),
    title: qs('[data-day-title]', box), count: qs('[data-day-count]', box), done: qs('[data-day-done]', box),
    tbl: qs('.tt', box), empty: qs('[data-empty]', box),
    who: qs('[data-who]', box), whoTitle: qs('[data-who-title]', box), faces: qs('[data-who-faces]', box)
  };
  sched.tbl.classList.add('is-enhanced');
  S.day = firstOpenDay();
  renderDays();
  renderWho(false);
  renderRows(false);
  sched.days.addEventListener('click', function (e) { var b = e.target.closest('.day'); if (b) { selectDay(+b.getAttribute('data-day')); } });
  sched.days.addEventListener('keydown', function (e) {
    var k = e.key, n = EF.api.week().length, i = S.day;
    if (k === 'ArrowRight') { i = (i + 1) % n; } else if (k === 'ArrowLeft') { i = (i - 1 + n) % n; } else if (k === 'Home') { i = 0; } else if (k === 'End') { i = n - 1; } else { return; }
    e.preventDefault(); selectDay(i, true);
  });
  sched.faces.addEventListener('click', function (e) {
    var f = e.target.closest('.face'); if (!f) { return; }
    var id = f.getAttribute('data-face');
    S.coaches = (S.coaches.length === 1 && S.coaches[0] === id) ? [] : [id];
    renderRows(true);
  });
  sched.chips.addEventListener('click', function (e) {
    var c = e.target.closest('.fchip'); if (!c) { return; }
    S.family = c.getAttribute('data-fam') || '';
    renderRows(true);
  });
  sched.tbl.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book], [data-open]');
    if (t) { openOcc(t.getAttribute('data-book') || t.getAttribute('data-open')); }
  });
  qsa('[data-clear-filters]').forEach(function (b) { b.addEventListener('click', function () { S.family = ''; S.coaches = []; S.times = []; S.levels = []; renderRows(true); }); });
  var fb = qs('[data-open-filters]', box);
  if (fb) { fb.addEventListener('click', function () { if (EF.sheet && EF.sheet.open) { EF.sheet.open('filters', {}, '?view=filters'); } }); }
  var rt = 0;
  w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(moveInd, 120); });
  registerFilters();
}
EF.schedule = {
  show: function (o) {
    o = o || {};
    if (!sched.days) { return; }
    if (o.ymd) { EF.api.week().forEach(function (day, i) { if (day.ymd === o.ymd) { S.day = i; } }); }
    if (o.family != null) { S.family = o.family; }
    selectDay(S.day);
    var sec = d.getElementById('schedule');
    scrollToEl(sec);
    try { sec.focus({ preventScroll: true }); } catch (e) { }
  },
  state: function () { return copyF(S); }
};

/* filter drawer, rendered through EF.sheet */
function registerFilters() {
  if (!EF.sheet || !EF.sheet.register) { return; }
  EF.sheet.register('filters', function () {
    var F = copyF(S);
    return {
      label: 'Filters', progress: null, testid: 'step-filters',
      render: function (body, foot) {
        function tog(group, id, name, on, img) {
          return '<button class="tog" type="button" data-g="' + group + '" data-v="' + esc(id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (img ? '<img src="' + esc(avR(img)) + '"' + ssAttr(img, 28) + ' alt="" width="28" height="28">' : '') + esc(name) + '</button>';
        }
        body.innerHTML = '<div data-testid="step-filters"><h2 class="sh-title" id="sheet-title" tabindex="-1">Filters</h2>' +
          '<p class="sh-lead">For ' + esc(EF.api.week()[S.day].long) + '.</p>' +
          '<fieldset class="fgroup"><legend>Class type</legend><div class="opts">' + tog('family', '', 'All classes', !F.family) + DATA.families.map(function (f) { return tog('family', f.id, f.name, F.family === f.id); }).join('') + '</div></fieldset>' +
          '<fieldset class="fgroup"><legend>Coach</legend><div class="opts">' + DATA.coaches.map(function (c) { return tog('coaches', c.id, c.name, F.coaches.indexOf(c.id) > -1, c.avatar); }).join('') + '</div></fieldset>' +
          '<fieldset class="fgroup"><legend>Time of day</legend><div class="opts">' + TIMES.map(function (t) { return tog('times', t.id, t.name, F.times.indexOf(t.id) > -1); }).join('') + '</div></fieldset>' +
          '<fieldset class="fgroup"><legend>Level</legend><div class="opts">' + LEVELS.map(function (l) { return tog('levels', l.id, l.name, F.levels.indexOf(l.id) > -1); }).join('') + '</div></fieldset>' +
          '<p class="sh-lead"><span class="sample">Sample</span> Most class levels are placeholders until the club confirms them.</p></div>';
        foot.innerHTML = '<div class="foot-row"><button class="btn btn--outline btn--sm" type="button" data-testid="filters-clear" data-fclear>Clear all</button>' +
          '<button class="btn btn--primary" type="button" data-testid="filters-apply" data-fapply></button></div>';
        var apply = qs('[data-fapply]', foot);
        function sync() {
          qsa('.tog', body).forEach(function (b) {
            var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
            b.setAttribute('aria-pressed', (g === 'family' ? F.family === v : F[g].indexOf(v) > -1) ? 'true' : 'false');
          });
          apply.innerHTML = 'Show ' + plural(dayRows(S.day, F).length, 'class', 'classes') + ' <span class="arr" aria-hidden="true">→</span>';
        }
        body.addEventListener('click', function (e) {
          var b = e.target.closest('.tog'); if (!b) { return; }
          var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
          if (g === 'family') { F.family = v; } else { var at = F[g].indexOf(v); if (at > -1) { F[g].splice(at, 1); } else { F[g].push(v); } }
          sync();
        });
        qs('[data-fclear]', foot).addEventListener('click', function () { F.family = ''; F.coaches = []; F.times = []; F.levels = []; sync(); });
        apply.addEventListener('click', function () {
          S.family = F.family; S.coaches = F.coaches; S.times = F.times; S.levels = F.levels;
          renderRows(true);
          EF.sheet.close();
        });
        sync();
      }
    };
  });
}

/* ---------- coaches: counts and roles from the data; tap opens the coach sheet ---------- */
function initCoaches() {
  var box = qs('[data-coaches]');
  if (!box) { return; }
  qsa('[data-coach]', box).forEach(function (b, i) {
    var id = b.getAttribute('data-coach'), c = EF.api.coach(id);
    if (!c) { return; }
    b.parentNode.style.setProperty('--i', String(i % 4));
    var cnt = qs('[data-coach-count]', b);
    if (cnt) { cnt.textContent = EF.api.coachWeekly(id); }
    var role = qs('[data-coach-role]', b);
    if (role) {
      var names = DATA.classes.filter(function (k) { return k.coach === id; }).map(function (k) { return k.name; });
      role.textContent = c.role ? c.role.replace(' · Weight loss', '') : ('Teaches ' + listJoin(names));
    }
  });
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-coach]');
    if (b && EF.booking && EF.booking.openCoach) { EF.booking.openCoach(b.getAttribute('data-coach')); }
  });
}

/* ---------- sticky dock (phones) and header CTA (desktop) ---------- */
function initBars() {
  var bar = qs('[data-buybar]'), hdr = qs('#hdr'), hero = qs('[data-testid="hero-book"]') || qs('#top');
  var marks = [hero, qs('#top .trust'), qs('#top .hq'), qs('[data-trust-badge]')].filter(Boolean), gone = [];
  var barBtn = bar && qs('button', bar), hdrBtn = hdr && qs('.hdr__cta', hdr);
  var st = { pastHero: false, blocked: {}, sheet: !!(EF.sheet && EF.sheet.isOpen && EF.sheet.isOpen()), typing: false };
  function apply() {
    var blocked = st.blocked.offer || st.blocked.footer;
    var onBar = st.pastHero && !blocked && !st.sheet && !st.typing;
    var onHdr = st.pastHero && !st.sheet;
    if (bar) { bar.classList.toggle('is-on', onBar); bar.setAttribute('aria-hidden', onBar ? 'false' : 'true'); if (barBtn) { barBtn.tabIndex = onBar ? 0 : -1; } }
    if (hdr) { hdr.classList.toggle('cta-on', onHdr); if (hdrBtn) { hdrBtn.tabIndex = onHdr ? 0 : -1; hdrBtn.setAttribute('aria-hidden', onHdr ? 'false' : 'true'); } }
  }
  var blockers = [['offer', qs('#plus-one')], ['footer', qs('#footer')]];
  /* every hero mark (Book, rating, quote, desktop trust badge) is above the screen or not shown at this width; the +1 offer or the footer is not on screen */
  function measure() {
    var vh = w.innerHeight || d.documentElement.clientHeight;
    st.pastHero = marks.length > 0 && marks.every(function (m) { var r = m.getBoundingClientRect(); return (!r.width && !r.height) || r.bottom <= 0; });
    blockers.forEach(function (b2) { var r = b2[1] ? b2[1].getBoundingClientRect() : null; st.blocked[b2[0]] = !!r && r.top < vh - 60 && r.bottom > 0; });
    apply();
  }
  if ('IntersectionObserver' in w) {
    var mio = new IntersectionObserver(function () { measure(); });
    marks.forEach(function (m) { mio.observe(m); });
    blockers.forEach(function (b2) { if (b2[1]) { new IntersectionObserver(function () { measure(); }, { rootMargin: '0px 0px -60px 0px' }).observe(b2[1]); } });
  }
  w.addEventListener('load', measure);
  w.addEventListener('hashchange', function () { w.requestAnimationFrame(measure); });
  w.addEventListener('resize', measure);
  d.addEventListener('ef:sheet', function (e) { st.sheet = !!(e.detail && e.detail.open); apply(); });
  d.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('#page input, #page select, #page textarea')) { st.typing = true; apply(); } });
  d.addEventListener('focusout', function () { if (st.typing) { st.typing = false; apply(); } });
  var ticking = false;
  w.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    w.requestAnimationFrame(function () { ticking = false; if (hdr) { hdr.classList.toggle('is-scrolled', (w.pageYOffset || 0) > 4); } });   /* motion pass: no geometry reads in scroll frames; the observers, load and hashchange re-read */
  }, { passive: true });
  measure();
}

/* ---------- hero quotes: one real Google review at a time (shortest verbatim cuts, <=12 words), 0.4 s crossfade every 3.5 s
   (Raoul 28 Oct: "quicker alternating ... as users will scroll quickly; and make citations more prominent"). Pauses while the hero is
   off screen, on hover and focus, and with the pause control; static under reduced motion. Each quote fits 2 lines of a reserved box
   (no layout shift); one that needs more lines at the current width is skipped there (never cut). ---------- */
var GMARK = '<svg class="gmark" viewBox="0 0 48 48" width="16" height="16" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
function initQuotes() {
  var box = qs('[data-hq]');
  if (!box) { return; }
  var list = (DATA.reviews || []).filter(function (r) { return r.tags && r.tags.hero; });
  var slides = qs('.hq__slides', box), btn = qs('[data-hq-pause]', box);
  if (!list.length) { return; }
  slides.innerHTML = list.map(function (r, i) {
    return '<figure class="hq__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + '" aria-hidden="true"><blockquote><p>“' + esc(r.text) + '”</p></blockquote><figcaption>' + GMARK + '<span>' + esc(r.by) + '</span></figcaption></figure>';
  }).join('');
  var items = qsa('.hq__slide', slides), usable = [], cur = 0, timer = 0, userPaused = false, hover = false, focusIn = false, inView = true;
  function show(i) {
    items.forEach(function (it) { it.classList.remove('is-on'); it.setAttribute('aria-hidden', 'true'); });
    cur = (i + usable.length) % usable.length;
    usable[cur].classList.add('is-on'); usable[cur].removeAttribute('aria-hidden');
  }
  function measure() {
    items.forEach(function (it) { it.classList.remove('is-skip'); });
    usable = items.filter(function (it) {
      var p = qs('blockquote p', it), lh = parseFloat(getComputedStyle(p).lineHeight) || 22;
      var fits = p.getBoundingClientRect().height <= lh * 2 + 2;
      it.classList.toggle('is-skip', !fits);
      return fits;
    });
    if (!usable.length) { usable = [items[1] || items[0]]; usable[0].classList.remove('is-skip'); }
    show(0);
    btn.hidden = usable.length < 2 || !motionOn();
  }
  function auto() { return motionOn() && !userPaused && !hover && !focusIn && inView && !d.hidden && usable.length > 1; }
  function tick() { clearTimeout(timer); if (auto()) { timer = setTimeout(function () { show(cur + 1); tick(); }, 3500); } }
  if ('IntersectionObserver' in w) { new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v !== inView) { inView = v; tick(); } }).observe(box); }
  btn.addEventListener('click', function () { userPaused = !userPaused; btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false'); btn.setAttribute('aria-label', (userPaused ? 'Play' : 'Pause') + ' the review quotes'); tick(); });
  box.addEventListener('mouseenter', function () { hover = true; tick(); });
  box.addEventListener('mouseleave', function () { hover = false; tick(); });
  box.addEventListener('focusin', function () { focusIn = true; tick(); });
  box.addEventListener('focusout', function () { focusIn = false; tick(); });
  d.addEventListener('visibilitychange', tick);
  var rt = 0; w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); tick(); }, 200); });
  measure(); tick();
}

/* ---------- the live "Now / Next" bar (Raoul 29 Oct, RULINGS #31): what runs now, or what starts next, with a countdown in Bali time
   (EF.api.now, so ?now= works), the class icon and the coach; a slow blurred clip of that class under a dark layer; a tap books the
   next session of that class (class-specific, no finder); role=timer text for screen readers once a minute, not every second. ---------- */
var NB_ICON = {
  boxing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M7 10V7a3 3 0 0 1 3-3h4a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-4-4z"/><path d="M7 11h4"/><path d="M8.5 18v2h6.5v-2"/></svg>',
  conditioning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/><path d="M6.5 14a5.5 5.5 0 1 1 11 0c0 2-.8 3.6-2.2 5H8.7c-1.4-1.4-2.2-3-2.2-5z"/></svg>',
  sculpt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></svg>',
  mobility: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="12" cy="4.5" r="1.8"/><path d="M12 7v6l-4 6M12 13l4 6M5.5 9.5 12 11l6.5-1.5"/></svg>'
};
function nbFmt(ms) { var s2 = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s2 / 3600), m = Math.floor((s2 % 3600) / 60), x = s2 % 60, p2 = function (n) { return (n < 10 ? '0' : '') + n; }; return h ? h + ':' + p2(m) + ':' + p2(x) : p2(m) + ':' + p2(x); }   /* RULINGS #43: 01:58 under an hour, 1:12:05 from an hour */
function nbSay(ms) { var mins = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(mins / 60), m = mins % 60; return (h ? h + (h === 1 ? ' hour' : ' hours') + (m ? ' ' : '') : '') + (m ? m + (m === 1 ? ' minute' : ' minutes') : ''); }
function initNowBar() {
  var bar = qs('[data-nowbar]');
  if (!bar || !EF.api || !EF.api.week || !EF.api.now) { return; }
  var live = qs('[data-nowbar-open]', bar), surf = qs('[data-nowbar-surface]', bar), sr = qs('[data-nb-sr]', bar);
  var el = { state: qs('[data-nb-state]', bar), icon: qs('[data-nb-icon]', bar), cls: qs('[data-nb-cls]', bar), who: qs('[data-nb-who]', bar), lbl: qs('[data-nb-lbl]', bar), cd: qs('[data-nb-cd]', bar) };
  var cur = null, lastSay = -1, surfKey = '', mqPhone = w.matchMedia ? w.matchMedia('(max-width: 414px)') : null, post = qs('[data-nb-post]', bar);
  function pick() {
    var t = EF.api.now(), wk = EF.api.week(), nowO = null, next = null;
    wk.forEach(function (d) { d.occs.forEach(function (o) { if (!nowO && o.start <= t && o.end > t) { nowO = o; } if (o.start > t && (!next || o.start < next.start)) { next = o; } }); });
    return nowO ? { mode: 'now', o: nowO, at: nowO.end } : (next ? { mode: 'next', o: next, at: next.start } : null);
  }
  function surface(o) {
    var fam = o.cls.family, m = ((DATA && DATA.nowbar_media) || {})[fam];
    if (fam === surfKey) { return; }
    surfKey = fam; bar.setAttribute('data-family', fam);
    surf.innerHTML = m ? '<img class="media__poster" src="' + esc(m.poster) + '" alt="" width="320" height="150" decoding="async">' + (m.video ? '<video data-clip data-group="nowbar" muted loop playsinline preload="none" src="' + esc(m.video) + '" aria-hidden="true" tabindex="-1"></video>' : '') : '';
    if (EF.media && EF.media.scan) { EF.media.scan(surf); }
  }
  /* RULINGS #43: "ends in 23:14" / "starts in 1:12:05" above 414 px; "23:14 left" / "in 1:12:05" on phones */
  function labels(p) {
    var ph = !!(mqPhone && mqPhone.matches);
    el.lbl.textContent = p.mode === 'now' ? (ph ? '' : 'ends in') : (ph ? 'in' : 'starts in');
    if (post) { post.textContent = p.mode === 'now' && ph ? 'left' : ''; }
  }
  if (mqPhone) { var relabel = function () { if (cur) { labels(cur); } }; if (mqPhone.addEventListener) { mqPhone.addEventListener('change', relabel); } else if (mqPhone.addListener) { mqPhone.addListener(relabel); } }
  function paint() {
    var t = EF.api.now(), p = pick();
    if (!p) { bar.classList.remove('is-live'); live.hidden = true; return; }
    if (!cur || cur.o.id !== p.o.id || cur.mode !== p.mode) {
      cur = p; lastSay = -1;
      el.state.textContent = p.mode === 'now' ? 'Now' : 'Next';
      el.icon.innerHTML = NB_ICON[p.o.cls.family] || '';
      el.cls.textContent = p.o.cls.name;
      el.who.innerHTML = '<img src="' + esc(avR(p.o.coach.avatar)) + '"' + ssAttr(p.o.coach.avatar, 20) + ' alt="" width="20" height="20"><span>' + esc(p.o.coach.name) + '</span>';
      labels(p);
      live.setAttribute('aria-describedby', 'nb-hint');   /* the visible text is the name (label-content match); the hint says what a tap does */
      live.setAttribute('data-class', p.o.classId);
      surface(p.o);
      bar.classList.add('is-live'); live.hidden = false;
    }
    var left = p.at - t;
    el.cd.textContent = nbFmt(left);
    var mins = Math.ceil(left / 60000);
    if (mins !== lastSay) { lastSay = mins; sr.textContent = (p.mode === 'now' ? 'On now: ' : 'Next: ') + p.o.cls.name + ' with ' + p.o.coach.name + ', ' + (p.mode === 'now' ? 'ends in ' : 'starts in ') + nbSay(left) + '.'; }
  }
  live.addEventListener('click', function () { if (cur) { openOcc(cur.o.classId, { src: 'nowbar' }); } });
  paint();
  w.setInterval(paint, 1000);
}

/* ---------- photo settle (v1.2 motion pass): a [data-depth] photo or clip eases from 1.04 to 1 once when it first comes into view ---------- */
function initSettle() {
  var els = qsa('[data-depth]');
  if (!els.length || !('IntersectionObserver' in w) || !motionOn()) { els.forEach(function (e) { e.classList.add('is-settled'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-settled'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
  els.forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { e.classList.add('is-settled'); } else { io.observe(e); } });   /* on screen at load: final at once */
}

/* ---------- actions ---------- */
function initActions() {
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-open-occ]');
    if (b && b.getAttribute('data-open-occ')) { openOcc(b.getAttribute('data-open-occ')); return; }
    var u = e.target.closest && e.target.closest('[data-forget]');
    if (u) { EF.api.contact.forget(); EF.toast('Your details are forgotten on this device.'); return; }
    /* [data-book-next], [data-use-pass] and [data-duo-start] belong to engine-v2 (it opens the class finder) */
    var t = e.target.closest && e.target.closest('[data-filter-family]');
    if (t) {
      e.preventDefault();
      EF.schedule.show({ family: t.getAttribute('data-filter-family') });
    }
  });
}

function refresh() {
  renderNext(true);
  renderChapters();
  renderDays();
  renderWho(false);
  renderRows(false);
  initCoachCounts();
}
function initCoachCounts() {
  qsa('[data-coach]').forEach(function (b) { var cnt = qs('[data-coach-count]', b); if (cnt) { cnt.textContent = EF.api.coachWeekly(b.getAttribute('data-coach')); } });
}

/* ---------- boot ---------- */
function fail() {
  root.classList.add('tt-all');
  var n = qs('[data-nextup]');
  if (n) { n.innerHTML = '<p class="nextup__loading">The timetable didn\'t load. This week\'s classes are in the timetable below.</p>'; }
}
function boot() {
  if (!EF.api || !EF.api.load) { fail(); return; }
  EF.api.load().then(function (data) {
    DATA = data;
    bindStatic();
    renderNext(false);
    initNowBar();
    initSettle();
    renderChapters();
    initSchedule();
    initCoaches();
    initBars();
    initActions();
    initQuotes();
    d.addEventListener('ef:forget', refresh);
    d.addEventListener('ef:sheet', function (e) {
      var det = e.detail || {}, next = (det.open && det.panel && (det.kind === 'class' || det.kind === 'details' || det.kind === 'membership' || det.kind === 'pay')) ? det.occId : null;
      if (next !== panelOcc) { panelOcc = next; if (sched.tbl) { renderRows(false); } }
    });
    if (EF.motion && EF.motion.scan) { EF.motion.scan(d.getElementById('main')); }
    if (EF.media && EF.media.sync) { EF.media.sync(); }
    d.addEventListener('ef:booked', refresh);
    if (/[?&]view=filters\b/.test(w.location.search) && EF.sheet && EF.sheet.open) {
      try { w.history.replaceState(null, '', w.location.pathname); } catch (e) { }
      EF.sheet.open('filters', {}, '?view=filters');
    }
  }, fail);
}
if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})(window, document);
