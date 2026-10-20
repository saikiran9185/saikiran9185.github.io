/* Portfolio demo. Everything on the page comes from content/site.json:
   site text, theme tokens, categories, best-work order, projects, tiles and case-study blocks.
   The Customize panel edits the same data live and keeps it in this browser. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fmt = (n) => Number(n).toLocaleString('en-IN');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  const STORE = 'portfolio-tune-v1';
  const EASE = 'cubic-bezier(.2,.75,.1,1)';

  // Google Fonts offered in the Customize panel; any other family name can be typed in.
  const FONTS = {
    'Anybody': 'Anybody:wdth,wght@50..150,100..900',
    'Hanken Grotesk': 'Hanken+Grotesk:wght@300..800',
    'Instrument Serif': 'Instrument+Serif:ital@0;1',
    'Bricolage Grotesque': 'Bricolage+Grotesque:opsz,wght@12..96,200..800',
    'Fraunces': 'Fraunces:opsz,wght@9..144,100..900',
    'DM Serif Display': 'DM+Serif+Display:ital@0;1',
    'Syne': 'Syne:wght@400..800',
    'Unbounded': 'Unbounded:wght@200..900',
    'Archivo': 'Archivo:wdth,wght@62..125,100..900',
    'Big Shoulders Display': 'Big+Shoulders+Display:wght@100..900',
    'Space Grotesk': 'Space+Grotesk:wght@300..700',
    'Manrope': 'Manrope:wght@200..800',
    'IBM Plex Sans': 'IBM+Plex+Sans:wght@300;400;500;600;700',
    'Jersey 10': 'Jersey+10',
    'Martian Mono': 'Martian+Mono:wdth,wght@75..112.5,300..600',
    'JetBrains Mono': 'JetBrains+Mono:wght@200..800',
  };
  const loadedFonts = new Set(['Anybody', 'Hanken Grotesk', 'Martian Mono', 'Instrument Serif', 'Jersey 10',
    'Noto Sans Telugu', 'Ramaraja', 'Suravaram', 'Gidugu', 'Tenali Ramakrishna']);
  const FALLBACK = { display: '"Arial Narrow", system-ui, sans-serif', body: 'system-ui, -apple-system, "Segoe UI", sans-serif' };

  function loadFont(name) {
    if (!name || loadedFonts.has(name)) return;
    loadedFonts.add(name);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS[name] || name.trim().replace(/\s+/g, '+')}&display=swap`;
    document.head.appendChild(link);
  }
  const family = (name, fallback) => `"${name}", ${fallback}`;

  let BASE, DATA, projects, byId, tiles;
  const state = { filter: 'All', current: null, source: null, lastFocus: null };

  /* ---------------- data + storage ---------------- */

  const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  function merge(target, src) {
    for (const k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && target[k] && typeof target[k] === 'object') merge(target[k], src[k]);
      else target[k] = src[k];
    }
    return target;
  }
  function loadSaved() { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ site: DATA.site, theme: DATA.theme })); } catch { /* storage blocked */ }
    $('#tJson').value = JSON.stringify({ site: DATA.site, theme: DATA.theme }, null, 2);
  }

  /* ---------------- theme ---------------- */

  const resolvedMode = () => (DATA.theme.mode === 'system' ? (darkMQ.matches ? 'dark' : 'light') : DATA.theme.mode);

  function applyTheme() {
    const t = DATA.theme;
    const root = document.documentElement;
    const mode = resolvedMode();
    root.dataset.mode = t.mode;
    root.dataset.resolved = mode;
    for (const [k, v] of Object.entries(t.colors[mode])) root.style.setProperty(`--${k}`, v);
    loadFont(t.fonts.display);
    loadFont(t.fonts.body);
    root.style.setProperty('--f-display', family(t.fonts.display, FALLBACK.display));
    root.style.setProperty('--f-body', family(t.fonts.body, FALLBACK.body));
    root.style.setProperty('--title-scale', t.titleScale);
    root.style.setProperty('--gap', `${t.wall.gap}px`);
    root.style.setProperty('--radius', `${t.wall.radius}px`);
    const wall = $('#wallGrid');
    wall.classList.remove('c-hover', 'c-below', 'c-off', 'h-lift', 'h-zoom', 'h-none');
    wall.classList.add(`c-${t.wall.captions}`, `h-${t.wall.hover}`);
    $$('[data-show]').forEach((el) => { el.hidden = !t.show[el.dataset.show]; });
    layoutWall();
  }
  darkMQ.addEventListener('change', () => { if (DATA && DATA.theme.mode === 'system') { applyTheme(); syncTune(); } });

  function applyText() {
    $$('[data-edit]').forEach((el) => { if (document.activeElement !== el) el.textContent = getPath(DATA, el.dataset.edit) ?? ''; });
    document.title = DATA.site.name;
    $('#email').textContent = DATA.site.email;
    $('#skills').innerHTML = DATA.site.skills.map((s) => `<li>${esc(s)}</li>`).join('');
    $('#aboutLinks').innerHTML = DATA.site.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  }

  /* ---------------- media ---------------- */

  function media(t, eager) {
    if (t.type === 'video') {
      return `<video src="${esc(t.src)}" poster="${esc(t.poster || '')}" muted loop playsinline preload="metadata" aria-label="${esc(t.caption || '')}"></video>`;
    }
    if (t.type === 'text') {
      const fonts = t.fonts?.length ? t.fonts : ['Noto Sans Telugu'];
      return `<div class="tt" style="background:${esc(t.bg)};color:${esc(t.fg)}" data-fonts="${esc(JSON.stringify(fonts))}" data-k="0">`
        + `<div class="te"${/[\u0C00-\u0C7F]/.test(t.text) ? ' lang="te"' : ''} style="font-family:'${esc(fonts[0])}', var(--f-te)">${esc(t.text)}</div>`
        + (t.sub ? `<div class="sub">${esc(t.sub)}</div>` : '')
        + `<span class="fname">${esc(fonts[0])}</span></div>`;
    }
    return `<img src="${esc(t.src)}" alt="${esc(t.caption || '')}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
  }

  // Videos play only while on screen; live type tiles cycle fonts only while on screen.
  const videoIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && !reduced) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: 0.25 });
  const liveText = new Set();
  const textIO = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? liveText.add(e.target) : liveText.delete(e.target))));
  function watchMedia(root) {
    $$('video', root).forEach((v) => { if (!v.controls) videoIO.observe(v); });
    $$('.tt', root).forEach((t) => textIO.observe(t));
    $$('img', root).forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('ok'); });
  }
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
  setInterval(() => {
    if (reduced || document.hidden) return;
    liveText.forEach((tt) => {
      const fonts = JSON.parse(tt.dataset.fonts);
      if (fonts.length < 2) return;
      const k = (Number(tt.dataset.k) + 1) % fonts.length;
      tt.dataset.k = k;
      const te = $('.te', tt);
      te.style.opacity = 0;
      setTimeout(() => {
        te.style.fontFamily = `'${fonts[k]}', var(--f-te)`;
        $('.fname', tt).textContent = fonts[k];
        te.style.opacity = 1;
      }, 250);
    });
  }, 1800);

  /* ---------------- intro + chips ---------------- */

  const countIn = (c) => (c === 'All' ? projects.length : projects.filter((p) => p.cats.includes(c)).length);

  function buildChips() {
    const cats = ['All', ...DATA.categories].filter((c) => countIn(c));
    $('#chips').innerHTML = cats.map((c) => `<button type="button" class="chip" data-c="${esc(c)}" aria-pressed="${c === state.filter}">${esc(c)}<span>${countIn(c)}</span></button>`).join('');
    $('#jump').innerHTML = DATA.categories.filter(countIn).map((c) => `<button type="button" data-c="${esc(c)}">${esc(c)} <span>${countIn(c)}</span></button>`).join('');
  }
  function setFilter(c) {
    state.filter = c;
    $$('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === c)));
    layoutWall();
  }
  $('#chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setFilter(b.dataset.c); });
  $('#jump').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setFilter(b.dataset.c);
    $('#wall').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------------- best work rail ---------------- */

  function buildRail() {
    const rail = $('#rail');
    rail.innerHTML = DATA.best.map((id, k) => {
      const p = byId[id];
      if (!p) return '';
      const ti = Math.max(0, p.tiles.findIndex((t) => t.type !== 'text'));
      const t = p.tiles[ti];
      return `<button type="button" class="card" data-pid="${esc(p.id)}" data-ti="${ti}">`
        + `<div class="m"${t.bg ? ` style="background:${esc(t.bg)}"` : ''}>${media(t)}<span class="num mono">${String(k + 1).padStart(2, '0')}</span></div>`
        + `<span class="t">${esc(p.title)}</span><span class="o">${esc(p.one)}</span></button>`;
    }).join('');
    watchMedia(rail);
    updateRailCount();
  }
  function railStep() { const c = $('.card', $('#rail')); return c ? c.getBoundingClientRect().width + 14 : 300; }
  function updateRailCount() {
    const rail = $('#rail');
    const n = $$('.card', rail).length;
    const i = Math.min(n, Math.round(rail.scrollLeft / railStep()) + 1);
    $('#railCount').textContent = `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
  }
  $('#rail').addEventListener('scroll', updateRailCount, { passive: true });
  $('#railPrev').addEventListener('click', () => $('#rail').scrollBy({ left: -railStep(), behavior: 'smooth' }));
  $('#railNext').addEventListener('click', () => $('#rail').scrollBy({ left: railStep(), behavior: 'smooth' }));

  // Mouse drag-to-scroll for horizontal strips; touch keeps native scrolling.
  function dragScroll(el) {
    let down = false, moved = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('drag'); }
      if (moved) el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) { el.classList.remove('drag'); el.dataset.dragged = '1'; setTimeout(() => delete el.dataset.dragged, 60); }
    });
    el.addEventListener('click', (e) => { if (el.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  dragScroll($('#rail'));

  /* ---------------- masonry wall ---------------- */

  function buildWall() {
    const wall = $('#wallGrid');
    // Round-robin across projects so one project's pieces don't clump together.
    const order = [];
    const most = Math.max(...projects.map((p) => p.tiles.length));
    for (let i = 0; i < most; i++) for (const p of projects) if (p.tiles[i]) order.push({ p, t: p.tiles[i], i });
    wall.innerHTML = '';
    tiles = order.map(({ p, t, i }) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tile';
      el.dataset.pid = p.id;
      el.dataset.ti = i;
      el.setAttribute('aria-label', `${p.title}, ${t.caption || ''}`);
      const kind = t.type === 'video' ? '<span class="kind">VIDEO</span>' : t.type === 'text' && (t.fonts || []).length > 1 ? '<span class="kind">LIVE TYPE</span>' : '';
      el.innerHTML = `<div class="m" style="aspect-ratio:${t.w}/${t.h};${t.bg ? `background:${esc(t.bg)}` : ''}">${media(t)}${kind}</div>`
        + `<div class="cap"><b>${esc(p.title)}</b><i>${esc(t.caption || p.year)}</i></div>`;
      wall.appendChild(el);
      return { p, t, el, x: 0, y: 0, w: 0 };
    });
    watchMedia(wall);
    layoutWall();
    requestAnimationFrame(() => requestAnimationFrame(() => wall.classList.add('ready')));
  }

  function layoutWall() {
    if (!tiles) return;
    const wall = $('#wallGrid');
    const W = wall.clientWidth;
    const { gap, columns, captions } = DATA.theme.wall;
    const auto = W < 520 ? 2 : W < 860 ? 3 : W < 1250 ? 4 : 5;
    const n = Math.max(1, Math.min(columns === 'auto' ? auto : Number(columns), Math.floor((W + gap) / 110)));
    const cw = (W - gap * (n - 1)) / n;
    const capH = captions === 'below' ? 30 : 0;
    const heights = new Array(n).fill(0);
    for (const T of tiles) {
      const show = state.filter === 'All' || T.p.cats.includes(state.filter);
      if (show) {
        let c = 0;
        for (let k = 1; k < n; k++) if (heights[k] < heights[c] - 1) c = k;
        T.x = c * (cw + gap); T.y = heights[c]; T.w = cw;
        heights[c] += (cw * T.t.h) / T.t.w + capH + gap;
      }
      T.el.classList.toggle('out', !show);
      T.el.tabIndex = show ? 0 : -1;
      T.el.style.width = `${T.w || cw}px`;
      T.el.style.transform = `translate(${T.x}px, ${T.y}px)${show ? '' : ' scale(.92)'}`;
    }
    wall.style.height = `${Math.max(0, Math.max(...heights) - gap)}px`;
  }
  let raf = 0;
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { layoutWall(); updateRailCount(); }); }).observe($('#wallGrid'));

  /* ---------------- case study ---------------- */

  const caseEl = $('#case');
  const caseScroll = $('#caseScroll');
  const caseBody = $('#caseBody');

  function block(b) {
    const cap = b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : '';
    switch (b.type) {
      case 'text':
        return `<section class="blk b-text"><h3>${esc(b.title || '')}</h3><p>${esc(b.body)}</p></section>`;
      case 'quote':
        return `<blockquote class="blk b-quote">${esc(b.text)}</blockquote>`;
      case 'image':
        return `<figure class="blk b-image"><div class="frame" style="--arn:${b.w / b.h};aspect-ratio:${b.w}/${b.h};${b.bg ? `background:${esc(b.bg)}` : ''}"><img src="${esc(b.src)}" alt="${esc(b.caption || '')}" loading="lazy" decoding="async"></div>${cap}</figure>`;
      case 'video':
        return `<figure class="blk b-video"><div class="frame" style="aspect-ratio:${b.w}/${b.h}"><video src="${esc(b.src)}" poster="${esc(b.poster || '')}" muted loop playsinline preload="metadata" data-auto></video></div>${cap}</figure>`;
      case 'stats':
        return `<section class="blk b-stats">${b.items.map((i) => `<div><div class="n" data-n="${Number(i.n)}">${fmt(i.n)}</div><div class="l">${esc(i.label)}</div></div>`).join('')}</section>`;
      case 'gallery':
        return `<figure class="blk b-gallery"><div class="strip">${b.items.map((i) => `<figure><div class="frame" style="--ar:${i.w}/${i.h};${i.bg ? `background:${esc(i.bg)}` : ''}"><img src="${esc(i.src)}" alt="${esc(i.caption || '')}" loading="lazy" decoding="async"></div>${i.caption ? `<figcaption>${esc(i.caption)}</figcaption>` : ''}</figure>`).join('')}</div>${cap}</figure>`;
      case 'compare':
        return `<figure class="blk b-compare"><div class="cmp" style="--ar:${b.w}/${b.h};--arn:${b.w / b.h}">`
          + `<img class="b" src="${esc(b.b)}" alt="${esc(b.lb)}"><img class="a" src="${esc(b.a)}" alt="${esc(b.la)}">`
          + `<span class="tag l">${esc(b.la)}</span><span class="tag r">${esc(b.lb)}</span>`
          + `<div class="handle"><button type="button" class="knob" role="slider" aria-label="Compare ${esc(b.la)} and ${esc(b.lb)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">&#8249;&#8250;</button></div></div>${cap}</figure>`;
      case 'switcher':
        return `<figure class="blk b-switcher"><div class="sw"><div class="stage" style="--ar:${b.w}/${b.h}">${b.items.map((it, k) => `<img src="${esc(it.src)}" alt="${esc(it.label)}" loading="lazy" style="opacity:${k ? 0 : 1}">`).join('')}</div>`
          + `<div class="opts">${b.items.map((it, k) => `<button type="button" data-k="${k}" aria-pressed="${k === 0}">${esc(it.label)}</button>`).join('')}</div></div>${cap}</figure>`;
      case 'tester':
        return `<figure class="blk b-tester"><div class="tst"><div class="ctl"><div class="fonts">${b.fonts.map((f, k) => `<button type="button" data-f="${esc(f)}" aria-pressed="${k === 0}">${esc(f)}</button>`).join('')}</div>`
          + `<label>Size <input type="range" min="24" max="160" value="72" data-size aria-label="Text size"></label></div>`
          + `<div class="txt" contenteditable="true" spellcheck="false" lang="te" style="font-family:'${esc(b.fonts[0])}', var(--f-te)">${esc(b.text)}</div></div>${cap}</figure>`;
      case 'figma':
        return b.url
          ? `<figure class="blk b-figma"><iframe src="https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(b.url)}" allowfullscreen loading="lazy" title="Figma prototype"></iframe>${cap}</figure>`
          : `<figure class="blk b-figma"><div class="ph"><strong>Figma prototype</strong><span>${esc(b.caption || '')}</span></div></figure>`;
      default:
        return '';
    }
  }

  function renderCase(p, ti) {
    const t = p.tiles[ti] || p.tiles[0];
    const arn = t.w / t.h;
    const i = projects.indexOf(p);
    const next = projects[(i + 1) % projects.length];
    const facts = [['Year', p.year], ['Role', p.role], ['Tools', p.tools], ['Status', p.status]].filter((f) => f[1]);
    caseBody.innerHTML = `
      <header class="ch ${arn < 1.05 ? 'split' : 'stack'}">
        <div class="ch-media" style="--arn:${arn};aspect-ratio:${t.w}/${t.h};${t.bg ? `background:${esc(t.bg)}` : ''}">${media(t, true)}</div>
        <div class="ch-meta">
          <p class="eyebrow">${p.cats.map(esc).join(' · ')}</p>
          <h1 id="caseTitle">${esc(p.title)}</h1>
          <p class="one">${esc(p.one)}</p>
          <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          ${p.links?.length ? `<div class="links">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} &#8599;</a>`).join('')}</div>` : ''}
        </div>
      </header>
      <div class="blocks">${p.blocks.map(block).join('')}</div>
      <footer class="next"><span class="mono">Next project</span>
        <button type="button" data-next="${esc(next.id)}"><span class="t">${esc(next.title)}</span><span class="o">${esc(next.one)}</span></button>
      </footer>`;
    $('#caseBarTitle').textContent = p.title;
    hydrate(caseBody);
    watchMedia(caseBody);
    $$('video[data-auto]', caseBody).forEach((v) => videoIO.observe(v));
  }

  function styleCase(p) {
    const s = p.style || {};
    const map = { bg: '--c-bg', fg: '--c-fg', muted: '--c-muted', line: '--c-line', accent: '--c-accent', weight: '--c-weight' };
    for (const [k, v] of Object.entries(map)) { if (s[k] != null) caseEl.style.setProperty(v, s[k]); else caseEl.style.removeProperty(v); }
    if (s.display) { loadFont(s.display); caseEl.style.setProperty('--c-display', family(s.display, 'Georgia, serif')); } else caseEl.style.removeProperty('--c-display');
  }

  // Shared-element move: the clicked tile's picture grows into the case-study hero (and back on close).
  function morph(from, to, reverse) {
    if (!from || !to || reduced) return Promise.resolve();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return Promise.resolve();
    let start;
    const sameShape = Math.abs(a.width / a.height - b.width / b.height) / (b.width / b.height) < 0.06;
    if (sameShape) {
      start = { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})` };
    } else {
      const s = a.width / b.width;
      start = { transform: `translate(${a.left - b.left}px, ${a.top + a.height / 2 - b.top - (b.height * s) / 2}px) scale(${s})`, opacity: 0.2 };
    }
    const end = { transform: 'none', opacity: 1 };
    from.style.visibility = 'hidden';
    const anim = to.animate(reverse ? [end, start] : [start, end], { duration: reverse ? 520 : 700, easing: EASE, fill: reverse ? 'forwards' : 'none' });
    return anim.finished.catch(() => {}).then(() => { if (!reverse) from.style.visibility = ''; });
  }

  function openCase(id, ti = 0, fromEl = null) {
    const p = byId[id];
    if (!p) return;
    const first = caseEl.hidden;
    state.current = { p, ti };
    styleCase(p);
    renderCase(p, ti);
    if (first) {
      state.lastFocus = document.activeElement;
      state.source = fromEl;
      caseEl.hidden = false;
      document.documentElement.classList.add('locked');
      caseScroll.scrollTop = 0;
      caseEl.classList.remove('leaving');
      caseEl.classList.add('entering');
      morph(fromEl, $('.ch-media', caseBody), false);
      setTimeout(() => caseEl.classList.remove('entering'), 1100);
      $('#caseClose').focus({ preventScroll: true });
    } else {
      state.source = null;
      caseScroll.scrollTo({ top: 0 });
      caseEl.classList.remove('swap');
      void caseEl.offsetWidth;
      caseEl.classList.add('swap');
    }
    try { history.replaceState(null, '', `#${id}`); } catch { /* sandboxed */ }
    observeBlocks();
    onCaseScroll();
  }

  function findSource() {
    const { p, ti } = state.current;
    const visible = (m) => { const r = m.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
    if (state.source && visible(state.source)) return state.source;
    return [...$$(`.tile[data-pid="${p.id}"][data-ti="${ti}"]:not(.out) .m`), ...$$(`.card[data-pid="${p.id}"] .m`)].find(visible) || null;
  }

  function closeCase() {
    if (caseEl.hidden) return;
    const target = findSource();
    const hero = $('.ch-media', caseBody);
    const heroOnScreen = hero && hero.getBoundingClientRect().bottom > 60;
    caseEl.classList.remove('entering', 'swap');
    caseEl.classList.add('leaving');
    const done = () => {
      caseEl.hidden = true;
      caseEl.classList.remove('leaving');
      document.documentElement.classList.remove('locked');
      $$('video', caseBody).forEach((v) => v.pause());
      caseBody.innerHTML = '';
      if (target) target.style.visibility = '';
      try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sandboxed */ }
      state.lastFocus?.focus?.({ preventScroll: true });
    };
    if (target && heroOnScreen && !reduced) morph(target, hero, true).then(done);
    else setTimeout(done, reduced ? 0 : 380);
  }

  function step(d) {
    const i = projects.indexOf(state.current.p);
    openCase(projects[(i + d + projects.length) % projects.length].id, 0);
  }

  function onCaseScroll() {
    const max = caseScroll.scrollHeight - caseScroll.clientHeight;
    $('#caseProgress').style.transform = `scaleX(${max > 0 ? caseScroll.scrollTop / max : 0})`;
    $('#caseBarTitle').classList.toggle('on', caseScroll.scrollTop > 260);
  }
  caseScroll.addEventListener('scroll', onCaseScroll, { passive: true });
  $('#caseClose').addEventListener('click', closeCase);
  $('#casePrev').addEventListener('click', () => step(-1));
  $('#caseNext').addEventListener('click', () => step(1));
  caseBody.addEventListener('click', (e) => { const b = e.target.closest('[data-next]'); if (b) openCase(b.dataset.next, 0); });

  // Blocks rise in as they scroll into view; stats count up, compare sliders do a short sweep.
  let blockIO;
  function observeBlocks() {
    blockIO?.disconnect();
    blockIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      blockIO.unobserve(e.target);
      $$('.n[data-n]', e.target).forEach(countUp);
      const cmp = $('.cmp', e.target);
      if (cmp) sweep(cmp);
    }), { root: caseScroll, threshold: 0.12 });
    $$('.blk', caseBody).forEach((b) => { if (!reduced) b.classList.add('rv'); blockIO.observe(b); });
  }
  function countUp(el) {
    const n = Number(el.dataset.n);
    if (reduced || !n) return;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = fmt(Math.round(n * (1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function setCmp(cmp, pct) {
    pct = Math.max(0, Math.min(100, pct));
    cmp.style.setProperty('--x', `${pct}%`);
    $('.knob', cmp).setAttribute('aria-valuenow', Math.round(pct));
  }
  function sweep(cmp) {
    if (reduced || cmp.dataset.touched) return;
    const t0 = performance.now();
    const tick = (t) => {
      if (cmp.dataset.touched) return;
      const k = Math.min(1, (t - t0) / 1600);
      setCmp(cmp, 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k));
      if (k < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 300);
  }

  function hydrate(root) {
    $$('.cmp', root).forEach((cmp) => {
      const at = (e) => { const r = cmp.getBoundingClientRect(); setCmp(cmp, ((e.clientX - r.left) / r.width) * 100); };
      cmp.addEventListener('pointerdown', (e) => { cmp.dataset.touched = '1'; cmp.setPointerCapture(e.pointerId); at(e); });
      cmp.addEventListener('pointermove', (e) => { if (cmp.hasPointerCapture(e.pointerId)) at(e); });
      $('.knob', cmp).addEventListener('keydown', (e) => {
        const now = parseFloat(cmp.style.getPropertyValue('--x')) || 50;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); cmp.dataset.touched = '1'; setCmp(cmp, now + (e.key === 'ArrowRight' ? 5 : -5)); }
      });
    });

    $$('.b-switcher', root).forEach((sw) => {
      const imgs = $$('.stage img', sw);
      const btns = $$('.opts button', sw);
      let k = 0, touched = false;
      const show = (n) => {
        k = n;
        imgs.forEach((im, j) => { im.style.opacity = j === n ? 1 : 0; });
        btns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === n)));
      };
      btns.forEach((b, j) => b.addEventListener('click', () => { touched = true; show(j); }));
      const timer = setInterval(() => {
        if (!sw.isConnected) return clearInterval(timer);
        const r = sw.getBoundingClientRect();
        if (!touched && !reduced && r.top < innerHeight && r.bottom > 0) show((k + 1) % imgs.length);
      }, 2200);
    });

    $$('.b-tester', root).forEach((tb) => {
      const txt = $('.txt', tb);
      $$('[data-f]', tb).forEach((b) => b.addEventListener('click', () => {
        txt.style.fontFamily = `'${b.dataset.f}', var(--f-te)`;
        $$('[data-f]', tb).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }));
      $('[data-size]', tb).addEventListener('input', (e) => { txt.style.fontSize = `${e.target.value}px`; });
    });

    $$('.strip', root).forEach(dragScroll);
  }

  /* ---------------- open from wall / rail ---------------- */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('.tile, .card');
    if (!el || document.body.classList.contains('editing')) return;
    openCase(el.dataset.pid, Number(el.dataset.ti), $('.m', el));
  });

  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]');
    if (e.key === 'Escape') {
      if (!$('#tune').hidden) return toggleTune(false);
      return closeCase();
    }
    if (caseEl.hidden || typing) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------------- customize panel ---------------- */

  const COLOR_LABELS = { bg: 'Background', fg: 'Text', muted: 'Soft text', accent: 'Accent', tile: 'Tiles', line: 'Lines' };

  function toggleTune(open) {
    const panel = $('#tune');
    panel.hidden = !open;
    $('#tuneBtn').setAttribute('aria-expanded', String(open));
    if (open) { syncTune(); $('#tuneClose').focus(); } else $('#tuneBtn').focus();
  }
  $('#tuneBtn').addEventListener('click', () => toggleTune($('#tune').hidden));
  $('#tuneClose').addEventListener('click', () => toggleTune(false));

  function fillFontSelect(sel, current) {
    const names = Object.keys(FONTS);
    if (current && !names.includes(current)) names.unshift(current);
    sel.innerHTML = names.map((n) => `<option${n === current ? ' selected' : ''}>${esc(n)}</option>`).join('');
  }

  function syncTune() {
    const t = DATA.theme;
    const mode = resolvedMode();
    const segs = { tMode: t.mode, tCaps: t.wall.captions, tHover: t.wall.hover };
    for (const [id, v] of Object.entries(segs)) $$(`#${id} button`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    $('#tModeNote').textContent = `(${mode})`;
    $('#tColors').innerHTML = Object.keys(COLOR_LABELS).map((k) => `<label for="c-${k}">${COLOR_LABELS[k]}<input id="c-${k}" type="color" data-k="${k}" value="${esc(t.colors[mode][k])}"></label>`).join('');
    fillFontSelect($('#tDisplay'), t.fonts.display);
    fillFontSelect($('#tBody'), t.fonts.body);
    $('#tScale').value = t.titleScale; $('#tScaleOut').textContent = `${Math.round(t.titleScale * 100)}%`;
    $('#tCols').value = String(t.wall.columns);
    $('#tGap').value = t.wall.gap; $('#tGapOut').textContent = `${t.wall.gap}px`;
    $('#tRadius').value = t.wall.radius; $('#tRadiusOut').textContent = `${t.wall.radius}px`;
    $('#tShowBest').checked = t.show.best;
    $('#tShowAbout').checked = t.show.about;
    $('#tJson').value = JSON.stringify({ site: DATA.site, theme: DATA.theme }, null, 2);
  }

  function changed(sync = true) { applyTheme(); save(); if (sync) syncTune(); }

  function bindSeg(id, set) {
    $(`#${id}`).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { set(b.dataset.v); changed(); } });
  }
  bindSeg('tMode', (v) => { DATA.theme.mode = v; });
  bindSeg('tCaps', (v) => { DATA.theme.wall.captions = v; });
  bindSeg('tHover', (v) => { DATA.theme.wall.hover = v; });

  $('#tColors').addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    DATA.theme.colors[resolvedMode()][k] = e.target.value;
    changed(false);
  });
  $('#tDisplay').addEventListener('change', (e) => { DATA.theme.fonts.display = e.target.value; changed(); });
  $('#tBody').addEventListener('change', (e) => { DATA.theme.fonts.body = e.target.value; changed(); });
  function useCustom(slot) {
    const name = $('#tCustom').value.trim();
    if (!name) return toast('Type a Google Font name first');
    DATA.theme.fonts[slot] = name;
    changed();
    toast(`Loading ${name} from Google Fonts`);
  }
  $('#tCustomTitles').addEventListener('click', () => useCustom('display'));
  $('#tCustomBody').addEventListener('click', () => useCustom('body'));
  $('#tScale').addEventListener('input', (e) => { DATA.theme.titleScale = Number(e.target.value); $('#tScaleOut').textContent = `${Math.round(e.target.value * 100)}%`; changed(false); });
  $('#tCols').addEventListener('change', (e) => { DATA.theme.wall.columns = e.target.value === 'auto' ? 'auto' : Number(e.target.value); changed(); });
  $('#tGap').addEventListener('input', (e) => { DATA.theme.wall.gap = Number(e.target.value); $('#tGapOut').textContent = `${e.target.value}px`; changed(false); });
  $('#tRadius').addEventListener('input', (e) => { DATA.theme.wall.radius = Number(e.target.value); $('#tRadiusOut').textContent = `${e.target.value}px`; changed(false); });
  $('#tShowBest').addEventListener('change', (e) => { DATA.theme.show.best = e.target.checked; changed(); });
  $('#tShowAbout').addEventListener('change', (e) => { DATA.theme.show.about = e.target.checked; changed(); });

  // Edit text right on the page.
  $('#tEdit').addEventListener('change', (e) => {
    const on = e.target.checked;
    document.body.classList.toggle('editing', on);
    $$('[data-edit]').forEach((el) => {
      if (!on) { el.removeAttribute('contenteditable'); return; }
      el.contentEditable = 'plaintext-only';
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    });
    if (on) toast('Click any outlined text to change it');
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest?.('[data-edit]');
    if (!el || !document.body.classList.contains('editing')) return;
    setPath(DATA, el.dataset.edit, el.textContent.trim());
    save();
  });
  $('.brand').addEventListener('click', (e) => { if (document.body.classList.contains('editing')) e.preventDefault(); });

  $('#tCopy').addEventListener('click', () => {
    const text = $('#tJson').value;
    navigator.clipboard.writeText(text).then(
      () => toast('Copied. Paste it over "site" and "theme" in content/site.json'),
      () => { $('#tJson').select(); toast('Press Cmd+C to copy'); },
    );
  });
  $('#tReset').addEventListener('click', () => {
    try { localStorage.removeItem(STORE); } catch { /* storage blocked */ }
    DATA.site = clone(BASE.site);
    DATA.theme = clone(BASE.theme);
    applyText();
    changed();
    toast('Back to the settings in site.json');
  });

  $('#copyEmail').addEventListener('click', () => {
    navigator.clipboard.writeText(DATA.site.email).then(
      () => toast('Email copied'),
      () => { getSelection().selectAllChildren($('#email')); toast('Press Cmd+C to copy'); },
    );
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
  }

  /* ---------------- boot ---------------- */

  fetch('content/site.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((json) => {
      BASE = json;
      DATA = clone(json);
      const saved = loadSaved();
      if (saved?.theme) merge(DATA.theme, saved.theme);
      if (saved?.site) merge(DATA.site, saved.site);
      projects = DATA.projects;
      byId = Object.fromEntries(projects.map((p) => [p.id, p]));
      applyText();
      buildChips();
      buildRail();
      buildWall();
      applyTheme();
      const id = decodeURIComponent(location.hash.slice(1));
      if (byId[id]) openCase(id, 0);
    })
    .catch((err) => {
      $('.headline').textContent = 'Could not load content/site.json.';
      $('.lede').textContent = 'Open the site through a local server (see README), not by double-clicking index.html.';
      console.error(err);
    });
})();
