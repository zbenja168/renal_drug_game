/* Primary Active Transport: shared header, promo card and corner badge for the
   static study tools (STYLE_SPEC.md §2 and §4).
   Source of truth: C:/study-tools/_shared/static/at-header.js, copied into each site
   by _shared/sync_static.py. Edit it there, not in a site.

   Load it right after <body> (synchronously, so the header is there on first paint):
     <script src="at-site.js"></script>
     <script src="at-header.js" data-page="index|game|app"></script>
   at-site.js (generated from courses.json) sets window.AT_SITE:
     { course, title, kind: 'qbank'|'game', accent, onAccent, home, siblings:[{label,url,current}],
       variants:[{match:<regex on file name>, ...overrides}], param, byParam:{value:{...overrides}},
       card: true|false, label: <optional small eyebrow pun> }
   Page types: "index" gets the H1 and the promo card; "game" gets a smaller title
   that links home plus a back/prev/next row built from the page's old fixed
   corner links; "app" is like index but never moves anything. */
(function () {
  'use strict';
  var AT_URL = 'https://activetransport.app';
  var me = document.currentScript;
  var page = (me && me.getAttribute('data-page')) || 'index';
  var S = {};
  var base = window.AT_SITE || {};
  for (var k in base) S[k] = base[k];
  var file = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  (S.variants || []).forEach(function (v) {
    if (new RegExp(v.match, 'i').test(file)) for (var k in v) if (k !== 'match') S[k] = v[k];
  });
  if (S.byParam) {
    var pv = new URLSearchParams(location.search).get(S.param || 's');
    if (!S.byParam[pv] && S.prefixParam) {
      var cv = (new URLSearchParams(location.search).get(S.prefixParam) || '').split('_')[0];
      pv = (S.prefixMap || {})[cv];
    }
    var o = S.byParam[pv] || S.byParam[S.defaultParam];
    if (o) for (var k2 in o) S[k2] = o[k2];
  }
  if (me && me.getAttribute('data-card') === '0') S.card = false;

  var root = document.documentElement;
  if (S.accent) root.style.setProperty('--at-accent', S.accent);
  if (S.pageBg) root.style.setProperty('--at-page-bg', S.pageBg);
  if (S.onAccent) root.style.setProperty('--at-on-accent', S.onAccent);
  if (S.setTitle) document.title = S.setTitle;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mark(size) {
    var w = (size * 30 / 28).toFixed(1);
    return '<span class="at-mark" aria-hidden="true" style="width:' + w + 'px;height:' + size + 'px">' +
      '<svg viewBox="0 0 120 112"><rect x="0" y="68" width="120" height="8" rx="4" fill="#475569"/>' +
      '<rect x="0" y="92" width="120" height="8" rx="4" fill="#475569"/>' +
      '<ellipse cx="60" cy="84" rx="20" ry="16" fill="#0d7f76" opacity=".92" stroke="#38bdf8" stroke-width="1.4" stroke-opacity=".75"/>' +
      '<rect x="55" y="50" width="10" height="36" rx="5" fill="#38bdf8" opacity=".85"/>' +
      '<g class="at-mark-head"><ellipse cx="60" cy="37" rx="22" ry="16" fill="#fbbf24" opacity=".28"/>' +
      '<circle cx="60" cy="26" r="10.5" fill="#fbbf24" opacity=".85"/><circle cx="43" cy="35" r="10.5" fill="#f59e0b" opacity=".82"/>' +
      '<circle cx="77" cy="35" r="10.5" fill="#f59e0b" opacity=".82"/></g>' +
      '<circle class="at-mark-sub" cx="60" cy="112" r="4.5"/>' +
      '<g class="at-mark-head"><circle cx="50" cy="47" r="9" fill="#fbbf24" opacity=".82"/>' +
      '<circle cx="70" cy="47" r="9" fill="#fbbf24" opacity=".82"/></g></svg></span>';
  }

  function headerHTML() {
    var sibs = (S.siblings || []);
    var nav = '';
    if (sibs.length > 1) {
      nav = '<nav class="at-sh-sibs" aria-label="' + esc(S.course) + ' study tools">' + sibs.map(function (s) {
        return '<a class="at-sh-pill" href="' + esc(s.url) + '"' + (s.current ? ' aria-current="page"' : '') + '>' + esc(s.label) + '</a>';
      }).join('') + '</nav>';
    }
    var title = esc(S.title || '');
    var label = S.label ? '<span class="at-sh-label">' + esc(S.label) + '</span>' : '';
    var homeFile = (S.home || 'index.html').split('/').pop();
    var linkHome = page === 'game' || (page === 'app' && file !== homeFile);
    var h = page === 'index'
      ? '<h1 class="at-sh-h1">' + title + label + '</h1>'
      : '<div class="at-sh-h1">' + (linkHome ? '<a href="' + esc(S.home || './') + '">' + title + '</a>' : title) + label + '</div>';
    var skinHide = (S.skinHide || []).indexOf(file) >= 0 ? ' data-at-skinhide=""' : '';
    return '<header class="at-sh" data-at-header=""' + skinHide + '>' +
      '<div class="at-sh-in">' +
      '<a class="at-sh-brand" href="' + AT_URL + '/#primary" target="_blank" rel="noopener noreferrer" title="Active Transport home">' +
      mark(26) + '<span class="at-wordmark at-sh-word">Active Transport</span></a>' +
      '<div class="at-sh-title"><div class="at-sh-eyebrow">Active Transport · ' + esc(S.course) + '</div>' + h + '</div>' +
      nav + '</div></header>' +
      (page === 'game' ? '<nav class="at-gamenav" aria-label="Game navigation"></nav>' : '');
  }

  function cardHTML() {
    return '<div class="at-card-wrap"><a class="at-card" id="at-card-root" href="' + AT_URL + '/#primary" target="_blank" rel="noopener noreferrer">' +
      '<span class="at-card-icon">' + mark(34) + '</span>' +
      '<span class="at-card-title">Part of <span class="at-wordmark">Active Transport</span></span>' +
      '<span class="at-card-cta">Open Active Transport &rarr;</span></a></div>';
  }

  // Animated course art (activetransport.app/static/course-art/<key>.svg) under
  // the header on a tool's main page; game pages keep their space for the game.
  var ART_KEYS = { 'BOOM': 'boom', 'Immunology': 'immuno', 'Microbiology': 'micro', 'Pathology': 'path',
    'Pharmacology': 'pharm', 'Blood & Lymph': 'blood', 'Cardiovascular': 'cardio', 'Respiratory': 'resp',
    'Renal': 'renal', 'Gastrointestinal': 'gi', 'Endocrine': 'endo', 'Reproductive': 'repro', 'Skin & MSK': 'msk' };
  function insertArt() {
    var key = S.artKey || ART_KEYS[S.course];
    if (!key || S.art === false || page === 'game' || document.querySelector('[data-at-art]')) return;
    var h = document.querySelector('[data-at-header]');
    if (!h) return;
    h.insertAdjacentHTML('afterend', '<div class="at-art-wrap" data-at-art=""><img class="at-art" alt="" decoding="async" src="' +
      AT_URL + '/static/course-art/' + key + '.svg" onerror="this.parentNode.remove()"></div>');
  }

  function insertHeader() {
    if (document.querySelector('[data-at-header]')) return;
    var host = S.mount ? document.querySelector(S.mount) : null;
    if (host) host.insertAdjacentHTML('afterbegin', headerHTML());
    else {
      document.body.insertAdjacentHTML('afterbegin', headerHTML());
      bleed();
    }
    insertArt();
  }

  // The header runs edge to edge even when the page pads <body>.
  function bleed() {
    var h = document.querySelector('[data-at-header]');
    if (!h || h.parentNode !== document.body) return;
    var b = getComputedStyle(document.body);
    var px = function (v) { return parseFloat(v) || 0; };
    var t = px(b.paddingTop) + px(b.marginTop), l = px(b.paddingLeft) + px(b.marginLeft), r = px(b.paddingRight) + px(b.marginRight);
    h.style.margin = (t ? -t : 0) + 'px ' + (r ? -r : 0) + 'px 0 ' + (l ? -l : 0) + 'px';
  }
  window.addEventListener('resize', bleed);

  // Old fixed top-corner links (back to index, prev / next) become one static row.
  function buildGameNav() {
    var nav = document.querySelector('.at-gamenav');
    if (!nav) return;
    var homeFile = (S.home || '').split('/').pop();
    var picked = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el.closest && el.closest('[data-at-header],.at-corner')) return;
      if (el.id === 'at-badge-root' || el.id === 'at-auth-badge') return;
      if (!/^(A|DIV|NAV)$/.test(el.tagName)) return;
      var cs = getComputedStyle(el);
      if (cs.position !== 'fixed') return;
      var top = parseFloat(cs.top);
      if (!(top >= 0 && top < 60)) return;
      var links = el.tagName === 'A' ? [el] : Array.prototype.slice.call(el.querySelectorAll('a'));
      if (!links.length || links.length > 4) return;
      picked.push(el);
    });
    var left = [], right = [], seen = {};
    picked.forEach(function (el) {
      var links = el.tagName === 'A' ? [el] : Array.prototype.slice.call(el.querySelectorAll('a'));
      links.forEach(function (a) {
        var raw = a.getAttribute('href') || '';
        if (seen[raw]) { if (a.parentNode) a.parentNode.removeChild(a); return; }
        seen[raw] = 1;
        var href = raw.split('/').pop();
        var isHome = (homeFile && href === homeFile) || /index/i.test(href) || /index|back|all games/i.test(a.textContent);
        a.removeAttribute('style'); a.removeAttribute('onmouseover'); a.removeAttribute('onmouseout');
        a.className = 'at-gn-btn';
        if (isHome) { a.innerHTML = '&larr; ' + esc(S.backLabel || 'All games'); left.push(a); } else right.push(a);
      });
      if (el.tagName !== 'A' && el.parentNode) el.parentNode.removeChild(el);
    });
    left.forEach(function (a) { nav.appendChild(a); });
    if (right.length) {
      var sp = document.createElement('span'); sp.className = 'at-gn-spacer'; nav.appendChild(sp);
      right.forEach(function (a) { nav.appendChild(a); });
    }
    if (!left.length && S.home) {
      var b = document.createElement('a'); b.className = 'at-gn-btn'; b.href = S.home; b.innerHTML = '&larr; ' + esc(S.backLabel || 'All games');
      nav.insertBefore(b, nav.firstChild);
    }
  }

  function corner() {
    // Old injected badges / cards (pre-2026-11 markup) are replaced by the shared ones.
    Array.prototype.forEach.call(document.querySelectorAll('#at-badge-root, #at-card-root'), function (el) {
      if (!el.closest('.at-corner') && !el.closest('.at-card-wrap')) el.parentNode.removeChild(el);
    });
    var stack = document.createElement('div');
    stack.className = 'at-corner';
    stack.innerHTML = '<a id="at-badge-root" class="at-badge" href="' + AT_URL + '" target="_blank" rel="noopener noreferrer" ' +
      'title="Made by Active Transport: NBME-style questions from your own notes">' + mark(22) +
      '<span class="at-badge-text"><span class="at-wordmark" style="font-size:.82rem">Active Transport</span>' +
      '<span class="at-badge-sub">AI NBME questions &rarr;</span></span></a>';
    document.body.appendChild(stack);
    if (S.spacer !== false) {
      var sp = document.createElement('div'); sp.className = 'at-corner-spacer'; sp.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sp);
    }
    function adopt() {
      var pill = document.getElementById('at-auth-badge');
      if (pill && pill.parentElement !== stack) stack.appendChild(pill);
      return !!pill;
    }
    if (!adopt() && window.MutationObserver) {
      var obs = new MutationObserver(function () { if (adopt()) obs.disconnect(); });
      obs.observe(document.body, { childList: true });
      setTimeout(function () { obs.disconnect(); }, 20000);
    }
  }

  function promo() {
    if (S.card === false || (page === 'game' && !S.cardOnGames)) return;
    if (document.querySelector('.at-card-wrap')) return;
    var slot = document.querySelector('[data-at-card]');
    if (slot) { slot.outerHTML = cardHTML(); return; }
    var after = S.cardAfter ? document.querySelector(S.cardAfter) : (document.querySelector('main') || null);
    if (after && after.parentNode) after.insertAdjacentHTML('afterend', cardHTML());
    else {
      var st = document.querySelector('.at-corner');
      if (st) st.insertAdjacentHTML('beforebegin', cardHTML()); else document.body.insertAdjacentHTML('beforeend', cardHTML());
    }
  }

  function late() {
    if (page === 'game') buildGameNav();
    corner();
    promo();
  }

  if (document.body && !S.mount) insertHeader();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { insertHeader(); late(); });
  } else { insertHeader(); late(); }
})();
