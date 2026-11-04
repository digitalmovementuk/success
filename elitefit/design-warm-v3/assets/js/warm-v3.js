/* Warm v3 · warm-v3.js (4 Nov 2026; audit v3-01: reviews index, progress and tick). Two small page parts, no engine code:
   - Reviews slider (Aldy p.3, p.13): a native horizontal scroll track (swipe, trackpad, arrow keys when focused) with previous and next
     buttons that move one review; the counter is read out politely. No autoplay. Reduced motion: the buttons jump instead of glide.
   - Map (Aldy p.13): a click-to-load Google Maps embed (no API key, no request to Google until the visitor asks). */
(function () {
'use strict';
var w = window, d = document;
function qs(s, c) { return (c || d).querySelector(s); }
function qsa(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)');

var box = qs('[data-reviews]');
if (box) {
  /* audit v3-01: the index reads 01//10 (the brand's index style), a terracotta thumb follows the swipe, the quote mark ticks on each change */
  var track = qs('[data-rv-track]', box), prev = qs('[data-rv-prev]', box), next = qs('[data-rv-next]', box);
  var curEl = qs('[data-rv-cur]', box), totEl = qs('[data-rv-total]', box), thumb = qs('[data-rv-thumb]', box), mark = qs('.rv__mark', box);
  var slides = qsa('.rv__slide', track), n = slides.length, cur = -1, raf = 0;
  var pad = function (k) { return (k < 10 ? '0' : '') + k; };
  if (totEl) { totEl.textContent = pad(n); }
  if (thumb) { box.style.setProperty('--n', n); }
  var step = function () { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; };
  var update = function () {
    raf = 0;
    var st = step() || 1, max = track.scrollWidth - track.clientWidth;
    var c = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / st)));
    if (thumb) { box.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)).toFixed(4) : 0); }
    if (prev) { prev.disabled = track.scrollLeft <= 4; }
    if (next) { next.disabled = track.scrollLeft >= max - 4; }
    if (c !== cur) {
      if (cur >= 0 && mark && !(reduce && reduce.matches)) { mark.classList.remove('is-tick'); void mark.offsetWidth; mark.classList.add('is-tick'); }
      cur = c;
      if (curEl) { curEl.textContent = pad(c + 1); }
      slides.forEach(function (sl, i) { sl.classList.toggle('is-cur', i === c); });
    }
  };
  var go = function (dir) { track.scrollBy({ left: dir * step(), behavior: reduce && reduce.matches ? 'auto' : 'smooth' }); };
  if (prev) { prev.addEventListener('click', function () { go(-1); }); }
  if (next) { next.addEventListener('click', function () { go(1); }); }
  track.addEventListener('scroll', function () { if (!raf) { raf = w.requestAnimationFrame(update); } }, { passive: true });
  track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
  w.addEventListener('resize', function () { if (!raf) { raf = w.requestAnimationFrame(update); } });
  box.classList.add('is-ready');
  update();
}

/* audit v3-01, CLS 0: the coach counts keep the width of their final number while they roll up */
qsa('[data-coach-count]').forEach(function (el) { var n = (el.textContent || '').trim().length; if (n) { el.style.minWidth = n + 'ch'; } });

var map = qs('[data-map]');
if (map) {
  var load = qs('[data-map-load]', map);
  if (load) {
    load.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.className = 'map__frame';
      f.title = 'Google Maps: Elite Fit Bali, Jalan Sempol No. 26, Pererenan';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Elite Fit Bali, Jalan Sempol No. 26, Pererenan, Bali') + '&output=embed';
      map.classList.add('is-live');
      map.appendChild(f);
      f.focus();
    });
  }
}
})();
