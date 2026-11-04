/* Warm: the engine draws its own coach avatars (finder rows, step 2 strip) from coach.avatar. Point them at this page's own assets/img/r/ files (RULINGS #53a)
   before anything renders, so the shared v1 96 px file is never requested (WebKit fetches an img's src before its srcset is set). Loaded right after api.js. */
(function () {
  var EF = window.EF;
  if (!EF || !EF.api || !EF.api.load) { return; }
  EF.api.load().then(function (d) {
    (d.coaches || []).forEach(function (c) {
      var m = /avatar-([a-z]+)\.webp/.exec(String(c.avatar || ''));
      if (m) { c.avatar = 'assets/img/r/avatar-' + m[1] + '-96.webp'; }
    });
  }, function () {});
})();
