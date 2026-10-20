/* Studio: edits content/site.json and uploads media straight to the GitHub repo.
   Every Publish is one commit (files + site.json together), made with the Git Data API. */
(() => {
  'use strict';

  const OWNER = 'saikiran9185';
  const REPO = 'saikiran9185.github.io';
  const BRANCH = 'main';
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const TOKEN_KEY = 'studio-token';
  const MAX_SIDE = 2000;          // images are scaled down to this on the long side
  const VIDEO_WARN = 40e6;        // bytes

  const BLOCK_TYPES = {
    text: 'Text', quote: 'Quote', image: 'Image', video: 'Video', gallery: 'Gallery',
    compare: 'Before / after', switcher: 'Pick a version', stats: 'Numbers', tester: 'Type tester', figma: 'Figma prototype',
  };
  const SHAPES = { '1:1': 'Square', '4:5': 'Portrait', '4:3': 'Landscape', '16:9': 'Wide' };

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => {
    const ks = p.split('.');
    const last = ks.pop();
    const parent = ks.reduce((a, k) => (a[k] ??= {}), o);
    if (v === undefined) delete parent[last]; else parent[last] = v;
  };

  let token = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch { /* storage blocked */ }
  let DATA = null;
  let loadedSha = null;
  let view = 'site';
  let busy = false;
  const changed = new Set();
  const pending = new Map();   // id -> { blob, name, url }

  /* ---------------- GitHub ---------------- */

  async function gh(path, { method = 'GET', body } = {}) {
    const r = await fetch(`${API}${path ? `/${path}` : ''}`, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      let msg = '';
      try { msg = (await r.json()).message || ''; } catch { /* no body */ }
      if (r.status === 401) throw new Error('GitHub did not accept the key. It may have expired. Sign out and paste a new one.');
      if (r.status === 403 || r.status === 404) throw new Error(`GitHub refused: ${msg || r.status}. Check the key has access to ${REPO} with Contents set to Read and write.`);
      throw new Error(`GitHub error ${r.status}${msg ? `: ${msg}` : ''}`);
    }
    return r.status === 204 ? null : r.json();
  }
  const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  const blobToB64 = (blob) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });

  async function load() {
    setState('Loading…');
    const meta = await gh(`contents/content/site.json?ref=${BRANCH}`);
    loadedSha = meta.sha;
    DATA = JSON.parse(b64ToText(meta.content));
    DATA.best ??= [];
    DATA.categories ??= [];
    DATA.projects ??= [];
    changed.clear();
    $('#connect').hidden = true;
    $('#app').hidden = false;
    render();
    setState();
  }

  /* ---------------- connect ---------------- */

  $('#connectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    token = $('#tokenInput').value.trim();
    $('#connectErr').textContent = '';
    if (!token) return;
    try {
      await load();
      try { localStorage.setItem(TOKEN_KEY, token); } catch { toast('This browser blocks storage, so you will need to paste the key again next time'); }
    } catch (err) {
      $('#connectErr').textContent = err.message;
    }
  });
  $('#signout').addEventListener('click', () => {
    if (changed.size && !confirm('You have changes that are not published. Sign out anyway?')) return;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
    changed.clear();
    location.reload();
  });
  window.addEventListener('beforeunload', (e) => { if (changed.size) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- state ---------------- */

  function setState(text) {
    const el = $('#state');
    const dirty = changed.size > 0;
    el.textContent = text || (dirty ? `Not published: ${changeNames().join(', ')}` : 'Everything is published');
    el.classList.toggle('dirty', dirty && !text);
    $('#publish').disabled = busy || !dirty;
  }
  // changed holds project objects (so renaming doesn't add duplicates) or plain labels like 'site'.
  function touched(what) { changed.add(what || 'site'); setState(); }
  const subject = () => (view === 'site' ? 'site' : editRoot());
  const changeNames = () => [...new Set([...changed].map((c) => (typeof c === 'string' ? c : c.title || 'Untitled')))];

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 3200);
  }

  /* ---------------- media ---------------- */

  const mediaURL = (src) => (src?.startsWith('pending:') ? pending.get(src.slice(8))?.url : src ? `../${src}` : '');
  const isVideo = (src) => /\.(mp4|webm|mov|m4v)$/i.test(src || '') || (src?.startsWith('pending:') && pending.get(src.slice(8))?.blob.type.startsWith('video/'));

  function preview(t) {
    if (t.type === 'text') return `<div class="tt" style="background:${esc(t.bg)};color:${esc(t.fg)}">${esc(t.text)}</div>`;
    if (!t.src) return '<span>No file yet</span>';
    if (t.type === 'video' || isVideo(t.src)) return `<video src="${esc(mediaURL(t.src))}" muted playsinline preload="metadata"></video><span class="badge">VIDEO</span>`;
    return `<img src="${esc(mediaURL(t.src))}" alt="" loading="lazy">`;
  }

  const imageSize = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(img.src); };
    img.onerror = () => reject(new Error(`Could not read ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
  const videoSize = (file) => new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { resolve({ w: v.videoWidth || 16, h: v.videoHeight || 9 }); URL.revokeObjectURL(v.src); };
    v.onerror = () => reject(new Error(`Could not read ${file.name}. Try an MP4.`));
    v.src = URL.createObjectURL(file);
  });

  // Images are scaled to at most MAX_SIDE and re-saved; GIFs, SVGs and videos are uploaded as they are.
  async function prepFile(file) {
    const id = Math.random().toString(36).slice(2, 8);
    const base = slug(file.name.replace(/\.[^.]+$/, '')) || 'file';
    let ext = (file.name.split('.').pop() || '').toLowerCase();
    let blob = file;
    let w, h, kind = 'image';
    if (file.type.startsWith('video/')) {
      kind = 'video';
      ({ w, h } = await videoSize(file));
      if (file.size > VIDEO_WARN) toast(`${file.name} is ${(file.size / 1e6).toFixed(0)} MB. Big videos load slowly; try compressing it.`);
    } else if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      ({ w, h } = await imageSize(file));
    } else if (file.type.startsWith('image/')) {
      const bmp = await createImageBitmap(file);
      const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      w = Math.round(bmp.width * s);
      h = Math.round(bmp.height * s);
      const png = file.type === 'image/png';
      if (s < 1 || !['image/jpeg', 'image/png'].includes(file.type) || (!png && file.size > 900e3)) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(bmp, 0, 0, w, h);
        blob = await new Promise((r) => c.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.85));
        ext = png ? 'png' : 'jpg';
      }
      bmp.close();
    } else {
      throw new Error(`${file.name} is not an image or video`);
    }
    pending.set(id, { blob, name: `${base}-${id}.${ext}`, url: URL.createObjectURL(blob) });
    return { src: `pending:${id}`, w, h, kind, caption: base.replace(/-/g, ' ') };
  }

  async function addFiles(input, files) {
    const root = editRoot();
    const { file: act, path, key } = input.dataset;
    files = [...files];
    if (!files.length) return;
    setState(`Preparing ${files.length} file${files.length > 1 ? 's' : ''}…`);
    for (const f of files) {
      let m;
      try { m = await prepFile(f); } catch (err) { toast(err.message); continue; }
      if (act === 'tiles') {
        (root.tiles ??= []).push({ type: m.kind, src: m.src, w: m.w, h: m.h, caption: m.caption });
      } else if (act === 'set') {
        const o = getPath(root, path);
        o[key] = m.src;
        o.w = m.w; o.h = m.h;
        if (path.startsWith('tiles.')) { o.type = m.kind; delete o.text; delete o.sub; delete o.fonts; delete o.fg; }
      } else if (act === 'items') {
        const b = getPath(root, path);
        b.items ??= [];
        if (b.type === 'switcher') { b.items.push({ src: m.src, label: m.caption }); if (!b.items[1]) { b.w = m.w; b.h = m.h; } } else b.items.push({ src: m.src, w: m.w, h: m.h, caption: m.caption });
      }
    }
    touched(subject());
    renderEditor();
  }

  /* ---------------- render ---------------- */

  const editRoot = () => (view === 'site' ? DATA : DATA.projects.find((p) => p.id === view));

  function render() { renderSide(); renderEditor(); }

  function renderSide() {
    $('#plist').innerHTML = DATA.projects.map((p) => {
      const t = p.tiles?.[0];
      const th = !t ? '' : t.type === 'text' ? `<span style="display:grid;place-items:center;width:100%;height:100%;background:${esc(t.bg)};color:${esc(t.fg)}">${esc(String(t.text).slice(0, 2))}</span>` : isVideo(t.src) ? `<video src="${esc(mediaURL(t.src))}" muted preload="metadata"></video>` : `<img src="${esc(mediaURL(t.src))}" alt="" loading="lazy">`;
      return `<li><button type="button" class="nav-btn" data-view="${esc(p.id)}" aria-current="${view === p.id}"><span class="th">${th}</span><span>${esc(p.title || 'Untitled')}</span>${DATA.best.includes(p.id) ? '<em>BEST</em>' : ''}</button></li>`;
    }).join('');
    $('.side > [data-view="site"]').setAttribute('aria-current', String(view === 'site'));
  }

  function renderEditor(keepScroll = true) {
    const y = window.scrollY;
    const root = editRoot();
    if (!root) { view = 'site'; return renderEditor(false); }
    $('#editor').innerHTML = view === 'site' ? siteEditor() : projectEditor(root);
    if (keepScroll) window.scrollTo(0, y);
  }

  // field helpers
  const field = (label, path, value, { type = 'text', hint = '', kind = '' } = {}) =>
    `<label class="f"><span>${label}</span><input type="${type}"${type === 'number' ? ' step="any"' : ''} data-bind="${path}"${kind ? ` data-kind="${kind}"` : ''} value="${esc(value ?? '')}">${hint ? `<small>${hint}</small>` : ''}</label>`;
  const area = (label, path, value, rows = 3) =>
    `<label class="f"><span>${label}</span><textarea rows="${rows}" data-bind="${path}">${esc(value ?? '')}</textarea></label>`;
  const color = (label, path, value) =>
    `<label class="f"><span>${label}</span><input type="color" data-bind="${path}" value="${esc(value || '#000000')}"></label>`;
  const fileBtn = (text, act, path, key = '', accept = 'image/*', multiple = false) =>
    `<label class="btn ghost">${text}<input class="vh" type="file" accept="${accept}"${multiple ? ' multiple' : ''} data-file="${act}" data-path="${path}" data-key="${key}"></label>`;
  const drop = (text, act, path, accept, multiple = true) =>
    `<label class="drop" data-drop>${text}<input class="vh" type="file" accept="${accept}"${multiple ? ' multiple' : ''} data-file="${act}" data-path="${path}"></label>`;
  const mover = (path, k, n) =>
    `<button type="button" class="x" data-act="move" data-path="${path}" data-k="${k}" data-d="-1" aria-label="Move earlier"${k === 0 ? ' disabled' : ''}>&#8592;</button>`
    + `<button type="button" class="x" data-act="move" data-path="${path}" data-k="${k}" data-d="1" aria-label="Move later"${k === n - 1 ? ' disabled' : ''}>&#8594;</button>`
    + `<button type="button" class="x" data-act="remove" data-path="${path}" data-k="${k}" aria-label="Remove">&#10005;</button>`;

  function projectEditor(p) {
    const i = DATA.projects.indexOf(p);
    const n = DATA.projects.length;
    const published = !p._new;
    return `
      <div class="ed-head">
        <h1>${esc(p.title || 'Untitled')}</h1>
        <div class="row wrap">
          ${published ? `<a class="btn ghost" href="../#${esc(p.id)}" target="_blank" rel="noopener">View on site &#8599;</a>` : ''}
          <button type="button" class="btn ghost" data-act="moveProject" data-d="-1"${i === 0 ? ' disabled' : ''}>Move up</button>
          <button type="button" class="btn ghost" data-act="moveProject" data-d="1"${i === n - 1 ? ' disabled' : ''}>Move down</button>
          <button type="button" class="btn danger" data-act="deleteProject">Delete</button>
        </div>
      </div>

      <section class="card"><h2>Basics</h2>
        <div class="grid2">
          ${field('Title', 'title', p.title)}
          ${field('Link name', 'id', p.id, { hint: `Opens at saikiran9185.github.io/#${esc(p.id)}` })}
          ${field('Year', 'year', p.year, { type: 'number', kind: 'number' })}
          ${field('Status', 'status', p.status, { hint: 'Optional, for example In progress' })}
        </div>
        ${area('One-line description', 'one', p.one, 2)}
        <div class="grid2">${field('Role', 'role', p.role)}${field('Tools', 'tools', p.tools)}</div>
        <span class="lbl">Categories</span>
        <div class="checks">
          ${DATA.categories.map((c) => `<label class="chk"><input type="checkbox" data-act="toggleCat" data-c="${esc(c)}"${p.cats?.includes(c) ? ' checked' : ''}>${esc(c)}</label>`).join('')}
          <span class="row"><input type="text" id="newCat" placeholder="New category" aria-label="New category"><button type="button" class="btn ghost" data-act="addCat">Add</button></span>
        </div>
        <label class="chk big"><input type="checkbox" data-act="toggleBest"${DATA.best.includes(p.id) ? ' checked' : ''}> Show in Best work</label>
        <span class="lbl">Links</span>
        ${(p.links || []).map((l, k) => `<div class="row"><input type="text" data-bind="links.${k}.label" value="${esc(l.label)}" placeholder="Label" aria-label="Link label"><input type="url" data-bind="links.${k}.url" value="${esc(l.url)}" placeholder="https://" aria-label="Link address"><button type="button" class="x" data-act="remove" data-path="links" data-k="${k}" aria-label="Remove link">&#10005;</button></div>`).join('')}
        <div><button type="button" class="btn ghost" data-act="addLink">+ Add link</button></div>
      </section>

      <section class="card"><h2>Look</h2>
        <p class="hint">Optional. Gives this case study its own fonts and colours.</p>
        <label class="chk big"><input type="checkbox" data-act="toggleStyle"${p.style ? ' checked' : ''}> Use its own look</label>
        ${p.style ? `
          <div class="grid3">${color('Background', 'style.bg', p.style.bg)}${color('Text', 'style.fg', p.style.fg)}${color('Soft text', 'style.muted', p.style.muted)}${color('Lines', 'style.line', p.style.line)}${color('Accent', 'style.accent', p.style.accent)}</div>
          <div class="grid2">${field('Title font', 'style.display', p.style.display, { hint: 'Any Google Fonts name, for example Instrument Serif' })}${field('Title weight', 'style.weight', p.style.weight, { type: 'number', kind: 'number', hint: '400 for fonts with one weight, 700 for bold' })}</div>` : ''}
      </section>

      <section class="card"><h2>On the wall</h2>
        <p class="hint">These pieces show in All work, in this order. The first picture is also the Best work cover.</p>
        <div class="tiles">${(p.tiles || []).map((t, k) => tileCard(t, k, p.tiles.length)).join('')}</div>
        ${drop('<strong>Drop images, GIFs or videos</strong><span>or click to choose. Big images are resized for you.</span>', 'tiles', '', 'image/*,video/*')}
        <div><button type="button" class="btn ghost" data-act="addTextTile">+ Add a type tile</button></div>
      </section>

      <section class="card"><h2>Case study</h2>
        <p class="hint">The page people see after clicking. Build it from blocks; use the arrows to reorder.</p>
        <div class="blocks">${(p.blocks || []).map((b, k) => blockCard(b, k, p.blocks.length)).join('') || '<p class="hint">No blocks yet.</p>'}</div>
        <div class="add-block"><span class="lbl">Add a block</span>
          <div class="row wrap">${Object.entries(BLOCK_TYPES).map(([k, v]) => `<button type="button" class="btn ghost" data-act="addBlock" data-type="${k}">${v}</button>`).join('')}</div>
        </div>
      </section>`;
  }

  function tileCard(t, k, n) {
    const shape = Object.keys(SHAPES).find((s) => { const [w, h] = s.split(':'); return Math.abs(w / h - t.w / t.h) < 0.01; }) || '';
    return `<div class="tile-card">
      <div class="thumb" style="aspect-ratio:${t.w}/${t.h};${t.bg ? `background:${esc(t.bg)}` : ''}">${preview(t)}</div>
      ${t.type === 'text' ? `
        ${field('Text', `tiles.${k}.text`, t.text)}
        ${field('Small line', `tiles.${k}.sub`, t.sub)}
        ${field('Fonts (comma separated)', `tiles.${k}.fonts`, (t.fonts || []).join(', '), { kind: 'list' })}
        <div class="grid2">${color('Background', `tiles.${k}.bg`, t.bg)}${color('Text', `tiles.${k}.fg`, t.fg)}</div>
        <label class="f"><span>Shape</span><select data-shape="tiles.${k}">${Object.entries(SHAPES).map(([v, l]) => `<option value="${v}"${v === shape ? ' selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
      <input type="text" data-bind="tiles.${k}.caption" value="${esc(t.caption)}" placeholder="Caption" aria-label="Caption">
      <div class="tools"><span class="row">${mover('tiles', k, n)}</span>${t.type !== 'text' ? fileBtn('Replace', 'set', `tiles.${k}`, 'src', 'image/*,video/*') : ''}</div>
    </div>`;
  }

  function mediaField(path, key, src, w, h, accept = 'image/*') {
    const t = { src, w, h, type: accept.startsWith('video') ? 'video' : 'image' };
    return `<div class="mf"><div class="thumb">${preview(t)}</div><div>${fileBtn(src ? 'Replace file' : 'Choose file', 'set', path, key, accept)}</div></div>`;
  }

  function blockCard(b, k, n) {
    const P = `blocks.${k}`;
    let body = '';
    switch (b.type) {
      case 'text': body = field('Heading', `${P}.title`, b.title) + area('Text', `${P}.body`, b.body, 5); break;
      case 'quote': body = area('Quote', `${P}.text`, b.text, 3); break;
      case 'image': body = mediaField(P, 'src', b.src, b.w, b.h) + field('Caption', `${P}.caption`, b.caption); break;
      case 'video': body = mediaField(P, 'src', b.src, b.w, b.h, 'video/*') + field('Caption', `${P}.caption`, b.caption); break;
      case 'compare':
        body = `<div class="grid2"><div class="f"><span>Left picture (before)</span>${mediaField(P, 'a', b.a, b.w, b.h)}</div><div class="f"><span>Right picture (after)</span>${mediaField(P, 'b', b.b, b.w, b.h)}</div></div>`
          + `<div class="grid2">${field('Left label', `${P}.la`, b.la)}${field('Right label', `${P}.lb`, b.lb)}</div>`
          + field('Caption', `${P}.caption`, b.caption)
          + '<small>Use two pictures of the same size.</small>';
        break;
      case 'gallery':
      case 'switcher': {
        const items = b.items || [];
        body = `<div class="items">${items.map((it, j) => `<div class="item-card"><div class="thumb" style="aspect-ratio:4/3">${preview({ src: it.src })}</div>`
          + `<input type="text" data-bind="${P}.items.${j}.${b.type === 'switcher' ? 'label' : 'caption'}" value="${esc(b.type === 'switcher' ? it.label : it.caption)}" placeholder="${b.type === 'switcher' ? 'Name' : 'Caption'}" aria-label="Caption">`
          + `<div class="tools">${mover(`${P}.items`, j, items.length)}</div></div>`).join('')}</div>`
          + drop('<strong>Drop pictures</strong><span>or click to choose</span>', 'items', P, 'image/*')
          + field('Caption under the block', `${P}.caption`, b.caption);
        break;
      }
      case 'stats':
        body = (b.items || []).map((it, j) => `<div class="row">${`<input type="number" data-bind="${P}.items.${j}.n" data-kind="number" value="${esc(it.n)}" aria-label="Number" style="max-width:140px">`}<input type="text" data-bind="${P}.items.${j}.label" value="${esc(it.label)}" placeholder="What it counts" aria-label="Label"><button type="button" class="x" data-act="remove" data-path="${P}.items" data-k="${j}" aria-label="Remove">&#10005;</button></div>`).join('')
          + `<div><button type="button" class="btn ghost" data-act="addStat" data-path="${P}.items">+ Add number</button></div>`;
        break;
      case 'tester':
        body = field('Sample text', `${P}.text`, b.text) + field('Fonts (comma separated)', `${P}.fonts`, (b.fonts || []).join(', '), { kind: 'list' }) + field('Caption', `${P}.caption`, b.caption);
        break;
      case 'figma':
        body = field('Figma share link', `${P}.url`, b.url, { type: 'url', hint: 'In Figma: Share → Copy link (for a prototype, use Present → Share prototype).' }) + field('Caption', `${P}.caption`, b.caption);
        break;
      default: body = '<p class="hint">This block type can only be edited in site.json.</p>';
    }
    return `<div class="block-card"><div class="bc-head"><strong>${esc(BLOCK_TYPES[b.type] || b.type)}</strong><span class="row">${mover('blocks', k, n).replace(/&#8592;/, '&#8593;').replace(/&#8594;/, '&#8595;')}</span></div>${body}</div>`;
  }

  function siteEditor() {
    const s = DATA.site;
    const t = DATA.theme;
    const modes = ['light', 'dark'];
    const colorNames = { bg: 'Background', fg: 'Text', muted: 'Soft text', accent: 'Accent', tile: 'Tiles', line: 'Lines' };
    return `
      <div class="ed-head"><h1>Site and theme</h1></div>

      <section class="card"><h2>Words</h2>
        ${field('Your name', 'site.name', s.name)}
        ${area('Big headline', 'site.headline', s.headline, 2)}
        ${area('Line under it', 'site.intro', s.intro, 2)}
        <div class="grid2">${field('Best work title', 'site.bestTitle', s.bestTitle)}${field('All work title', 'site.wallTitle', s.wallTitle)}</div>
        ${field('About title', 'site.aboutTitle', s.aboutTitle)}
        ${area('About you', 'site.about', s.about, 4)}
        <div class="grid2">${field('Email', 'site.email', s.email, { type: 'email' })}${field('Tools you use (comma separated)', 'site.skills', (s.skills || []).join(', '), { kind: 'list' })}</div>
        <span class="lbl">Links</span>
        ${(s.links || []).map((l, k) => `<div class="row"><input type="text" data-bind="site.links.${k}.label" value="${esc(l.label)}" placeholder="Label" aria-label="Link label"><input type="url" data-bind="site.links.${k}.url" value="${esc(l.url)}" placeholder="https://" aria-label="Link address"><button type="button" class="x" data-act="remove" data-path="site.links" data-k="${k}" aria-label="Remove link">&#10005;</button></div>`).join('')}
        <div><button type="button" class="btn ghost" data-act="addSiteLink">+ Add link</button></div>
      </section>

      <section class="card"><h2>Categories</h2>
        <p class="hint">The filter buttons on the wall. Renaming one updates every project that uses it.</p>
        ${DATA.categories.map((c, k) => `<div class="list-row"><input type="text" data-cat="${k}" value="${esc(c)}" aria-label="Category name"><span class="row">${mover('categories', k, DATA.categories.length).replace('data-act="remove"', 'data-act="removeCat"')}</span></div>`).join('')}
        <div class="row"><input type="text" id="newCat" placeholder="New category" aria-label="New category"><button type="button" class="btn ghost" data-act="addCat">Add</button></div>
      </section>

      <section class="card"><h2>Best work order</h2>
        <p class="hint">To add a project here, open it and tick Show in Best work.</p>
        ${DATA.best.map((id, k) => `<div class="list-row"><span>${esc(DATA.projects.find((p) => p.id === id)?.title || id)}</span><span class="row">${mover('best', k, DATA.best.length)}</span></div>`).join('') || '<p class="hint">Nothing in Best work yet.</p>'}
      </section>

      <section class="card"><h2>Theme</h2>
        <p class="hint">Quickest way: open your site, press Customize, change things until you like them, then press Publish there.</p>
        <div class="grid2">
          <label class="f"><span>Light or dark</span><select data-bind="theme.mode">${['system', 'light', 'dark'].map((m) => `<option value="${m}"${t.mode === m ? ' selected' : ''}>${m === 'system' ? 'Follow the visitor' : m[0].toUpperCase() + m.slice(1)}</option>`).join('')}</select></label>
          ${field('Title size', 'theme.titleScale', t.titleScale, { type: 'number', kind: 'number', hint: '1 is normal, 1.2 is 20% bigger' })}
          ${field('Title font', 'theme.fonts.display', t.fonts.display, { hint: 'Any Google Fonts name' })}
          ${field('Text font', 'theme.fonts.body', t.fonts.body, { hint: 'Any Google Fonts name' })}
        </div>
        ${modes.map((m) => `<span class="lbl">${m === 'light' ? 'Light' : 'Dark'} colours</span><div class="grid3">${Object.entries(colorNames).map(([k, l]) => color(l, `theme.colors.${m}.${k}`, t.colors[m][k])).join('')}</div>`).join('')}
        <span class="lbl">Wall</span>
        <div class="grid3">
          <label class="f"><span>Columns</span><select data-bind="theme.wall.columns" data-kind="cols">${['auto', 2, 3, 4, 5, 6, 7].map((c) => `<option value="${c}"${String(t.wall.columns) === String(c) ? ' selected' : ''}>${c === 'auto' ? 'Auto' : c}</option>`).join('')}</select></label>
          ${field('Gap (px)', 'theme.wall.gap', t.wall.gap, { type: 'number', kind: 'number' })}
          ${field('Corners (px)', 'theme.wall.radius', t.wall.radius, { type: 'number', kind: 'number' })}
          <label class="f"><span>Titles on tiles</span><select data-bind="theme.wall.captions">${[['hover', 'On hover'], ['below', 'Below'], ['off', 'Off']].map(([v, l]) => `<option value="${v}"${t.wall.captions === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="f"><span>Hover effect</span><select data-bind="theme.wall.hover">${[['lift', 'Lift'], ['zoom', 'Zoom'], ['none', 'None']].map(([v, l]) => `<option value="${v}"${t.wall.hover === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="checks">
          <label class="chk"><input type="checkbox" data-bind="theme.show.best" data-kind="bool"${t.show.best ? ' checked' : ''}> Show Best work</label>
          <label class="chk"><input type="checkbox" data-bind="theme.show.about" data-kind="bool"${t.show.about ? ' checked' : ''}> Show About</label>
        </div>
      </section>`;
  }

  /* ---------------- editing ---------------- */

  function convert(el) {
    const k = el.dataset.kind;
    if (k === 'bool') return el.checked;
    if (k === 'number') return el.value === '' ? undefined : Number(el.value);
    if (k === 'list') return el.value.split(',').map((s) => s.trim()).filter(Boolean);
    if (k === 'cols') return el.value === 'auto' ? 'auto' : Number(el.value);
    return el.value;
  }

  const editor = $('#editor');
  editor.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset.bind || el.dataset.bind === 'id') return;
    const root = editRoot();
    setPath(root, el.dataset.bind, convert(el));
    touched(subject());
    if (el.dataset.bind === 'title') { $('#editor h1').textContent = root.title || 'Untitled'; renderSide(); }
    if (el.type === 'color' || /^tiles\.\d+\.(text|bg|fg)$/.test(el.dataset.bind)) {
      const card = el.closest('.tile-card');
      const k = Number(el.dataset.bind.split('.')[1]);
      if (card && root.tiles?.[k]?.type === 'text') { const th = $('.thumb', card); th.style.background = root.tiles[k].bg; th.innerHTML = preview(root.tiles[k]); }
    }
  });

  editor.addEventListener('change', (e) => {
    const el = e.target;
    const root = editRoot();
    if (el.dataset.file) { addFiles(el, el.files); el.value = ''; return; }
    if (el.dataset.bind === 'id') return renameProject(root, el);
    if (el.dataset.shape) {
      const [w, h] = el.value.split(':').map(Number);
      Object.assign(getPath(root, el.dataset.shape), { w, h });
      touched(subject());
      return renderEditor();
    }
    if (el.dataset.cat != null) return renameCategory(Number(el.dataset.cat), el);
    if (el.dataset.bind && el.dataset.kind === 'list') { el.value = convert(el).join(', '); }
  });

  // Drag-and-drop onto any drop zone.
  editor.addEventListener('dragover', (e) => { const d = e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  editor.addEventListener('dragleave', (e) => { const d = e.target.closest('[data-drop]'); if (d) d.classList.remove('over'); });
  editor.addEventListener('drop', (e) => {
    const d = e.target.closest('[data-drop]');
    if (!d) return;
    e.preventDefault();
    d.classList.remove('over');
    addFiles($('input[type="file"]', d), e.dataTransfer.files);
  });

  function renameProject(p, el) {
    const old = p.id;
    let id = slug(el.value) || old;
    if (id !== old && DATA.projects.some((q) => q.id === id)) { toast(`Another project already uses “${id}”`); id = old; }
    el.value = id;
    if (id === old) return;
    p.id = id;
    DATA.best = DATA.best.map((b) => (b === old ? id : b));
    view = id;
    touched(p);
    render();
  }

  function renameCategory(k, el) {
    const old = DATA.categories[k];
    const name = el.value.trim();
    if (!name || (name !== old && DATA.categories.includes(name))) { el.value = old; return toast('That name is empty or already used'); }
    DATA.categories[k] = name;
    DATA.projects.forEach((p) => { p.cats = (p.cats || []).map((c) => (c === old ? name : c)); });
    touched('categories');
  }

  function newBlock(type) {
    switch (type) {
      case 'text': return { type, title: '', body: '' };
      case 'quote': return { type, text: '' };
      case 'image': case 'video': return { type, src: '', w: 16, h: 9, caption: '' };
      case 'gallery': return { type, items: [], caption: '' };
      case 'compare': return { type, a: '', b: '', w: 16, h: 9, la: 'Before', lb: 'After', caption: '' };
      case 'switcher': return { type, items: [], w: 16, h: 9, caption: '' };
      case 'stats': return { type, items: [{ n: 0, label: '' }] };
      case 'tester': return { type, text: 'Type here', fonts: ['Noto Sans Telugu'], caption: '' };
      case 'figma': return { type, url: '', caption: '' };
      default: return { type };
    }
  }

  const actions = {
    move(root, el) {
      const arr = getPath(root, el.dataset.path);
      const k = Number(el.dataset.k);
      const j = k + Number(el.dataset.d);
      if (j < 0 || j >= arr.length) return false;
      [arr[k], arr[j]] = [arr[j], arr[k]];
    },
    remove(root, el) { getPath(root, el.dataset.path).splice(Number(el.dataset.k), 1); },
    moveProject(root, el) {
      const i = DATA.projects.indexOf(root);
      const j = i + Number(el.dataset.d);
      if (j < 0 || j >= DATA.projects.length) return false;
      [DATA.projects[i], DATA.projects[j]] = [DATA.projects[j], DATA.projects[i]];
    },
    deleteProject(root) {
      if (!confirm(`Delete “${root.title || 'Untitled'}” from the site? Its files stay in the repo.`)) return false;
      DATA.projects.splice(DATA.projects.indexOf(root), 1);
      DATA.best = DATA.best.filter((id) => id !== root.id);
      changed.delete(root);
      changed.add(`removed ${root.title || 'project'}`);
      view = 'site';
    },
    toggleCat(root, el) {
      root.cats ??= [];
      if (el.checked) root.cats.push(el.dataset.c); else root.cats = root.cats.filter((c) => c !== el.dataset.c);
    },
    addCat(root) {
      const name = $('#newCat').value.trim();
      if (!name) return false;
      if (!DATA.categories.includes(name)) DATA.categories.push(name);
      if (view !== 'site' && !(root.cats ??= []).includes(name)) root.cats.push(name);
    },
    removeCat(root, el) {
      const name = DATA.categories[Number(el.dataset.k)];
      DATA.categories.splice(Number(el.dataset.k), 1);
      DATA.projects.forEach((p) => { p.cats = (p.cats || []).filter((c) => c !== name); });
    },
    toggleBest(root, el) {
      if (el.checked) { if (!DATA.best.includes(root.id)) DATA.best.push(root.id); } else DATA.best = DATA.best.filter((id) => id !== root.id);
    },
    addLink(root) { (root.links ??= []).push({ label: '', url: '' }); },
    addSiteLink() { (DATA.site.links ??= []).push({ label: '', url: '' }); },
    toggleStyle(root, el) {
      if (el.checked) root.style = { display: '', weight: 700, bg: '#FFFFFF', fg: '#16171A', muted: '#62666D', line: '#D5D7D2', accent: '#C8006E' };
      else delete root.style;
    },
    addTextTile(root) { (root.tiles ??= []).push({ type: 'text', text: 'Aa', sub: '', fonts: ['Anybody'], w: 1, h: 1, bg: '#1F2A44', fg: '#FFFFFF', caption: '' }); },
    addBlock(root, el) { (root.blocks ??= []).push(newBlock(el.dataset.type)); },
    addStat(root, el) { getPath(root, el.dataset.path).push({ n: 0, label: '' }); },
  };

  editor.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const root = editRoot();
    const act = actions[el.dataset.act];
    if (!act || act(root, el) === false) return;
    if (view !== 'site' || el.dataset.act !== 'deleteProject') touched(view === 'site' ? 'site' : root);
    else setState();
    const scrollToEnd = el.dataset.act === 'addBlock';
    render();
    if (scrollToEnd) $('#editor .blocks .block-card:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav-btn[data-view]');
    if (!nav) return;
    view = nav.dataset.view;
    render();
    window.scrollTo(0, 0);
  });

  $('#newProject').addEventListener('click', () => {
    let id = 'new-project';
    for (let n = 2; DATA.projects.some((p) => p.id === id); n++) id = `new-project-${n}`;
    DATA.projects.unshift({ _new: true, id, title: '', year: new Date().getFullYear(), cats: [], one: '', role: '', tools: '', links: [], tiles: [], blocks: [{ type: 'text', title: 'About this project', body: '' }] });
    view = id;
    touched(DATA.projects[0]);
    render();
    window.scrollTo(0, 0);
    $('#editor [data-bind="title"]')?.focus();
  });

  // New projects take their link name from the title until it is published.
  editor.addEventListener('input', (e) => {
    const root = editRoot();
    if (e.target.dataset.bind !== 'title' || !root?._new) return;
    const id = slug(root.title) || root.id;
    if (id === root.id || DATA.projects.some((q) => q !== root && q.id === id)) return;
    DATA.best = DATA.best.map((b) => (b === root.id ? id : b));
    root.id = id;
    view = id;
    const idField = $('#editor [data-bind="id"]');
    if (idField) { idField.value = id; idField.nextElementSibling.textContent = `Opens at saikiran9185.github.io/#${id}`; }
    renderSide();
  });

  /* ---------------- publish ---------------- */

  function problems(data) {
    const out = [];
    const ids = new Set();
    for (const p of data.projects) {
      const name = p.title || 'A project';
      if (!p.title) out.push('A project has no title.');
      if (ids.has(p.id)) out.push(`Two projects use the link name “${p.id}”.`);
      ids.add(p.id);
      if (!p.tiles?.length) out.push(`${name} needs at least one picture, video or type tile on the wall.`);
      if (!p.cats?.length) out.push(`${name} has no category.`);
      (p.blocks || []).forEach((b) => {
        if ((b.type === 'image' || b.type === 'video') && !b.src) out.push(`${name}: a ${b.type} block has no file yet.`);
        if (b.type === 'compare' && (!b.a || !b.b)) out.push(`${name}: a before/after block needs two pictures.`);
        if ((b.type === 'gallery' || b.type === 'switcher') && !b.items?.length) out.push(`${name}: a ${BLOCK_TYPES[b.type].toLowerCase()} block has no pictures.`);
      });
    }
    return out;
  }

  function showBanner(html, bad = false) {
    $('#editor .banner')?.remove();
    $('#editor').insertAdjacentHTML('afterbegin', `<div class="banner${bad ? ' bad' : ''}" role="alert">${html}</div>`);
    window.scrollTo(0, 0);
  }

  $('#publish').addEventListener('click', async () => {
    const issues = problems(DATA);
    if (issues.length) return showBanner(`Fix these first:<ul>${issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`, true);
    busy = true;
    setState('Publishing…');
    try {
      // Swap pending files for their final paths in media/<project-id>/.
      const out = JSON.parse(JSON.stringify(DATA));
      const uploads = new Map();
      const swap = (node, pid) => {
        if (Array.isArray(node)) return node.forEach((n, i) => { if (typeof n === 'string' && n.startsWith('pending:')) node[i] = finalPath(n, pid); else swap(n, pid); });
        if (node && typeof node === 'object') for (const k of Object.keys(node)) {
          if (typeof node[k] === 'string' && node[k].startsWith('pending:')) node[k] = finalPath(node[k], pid); else swap(node[k], pid);
        }
      };
      const finalPath = (ref, pid) => {
        const f = pending.get(ref.slice(8));
        const path = `media/${pid}/${f.name}`;
        uploads.set(path, f.blob);
        return path;
      };
      out.projects.forEach((p) => { delete p._new; swap(p, p.id); });

      const head = await gh(`git/ref/heads/${BRANCH}`);
      const headSha = head.object.sha;
      const current = await gh(`contents/content/site.json?ref=${headSha}`);
      if (current.sha !== loadedSha) throw new Error('site.json was changed somewhere else after Studio opened it. Copy anything you typed, reload Studio, and make the change again.');
      const baseCommit = await gh(`git/commits/${headSha}`);

      const tree = [];
      let n = 0;
      for (const [path, blob] of uploads) {
        setState(`Uploading ${++n} of ${uploads.size}…`);
        const b = await gh('git/blobs', { method: 'POST', body: { content: await blobToB64(blob), encoding: 'base64' } });
        tree.push({ path, mode: '100644', type: 'blob', sha: b.sha });
      }
      setState('Saving…');
      const json = await gh('git/blobs', { method: 'POST', body: { content: `${JSON.stringify(out, null, 2)}\n`, encoding: 'utf-8' } });
      tree.push({ path: 'content/site.json', mode: '100644', type: 'blob', sha: json.sha });
      const newTree = await gh('git/trees', { method: 'POST', body: { base_tree: baseCommit.tree.sha, tree } });
      const commit = await gh('git/commits', { method: 'POST', body: { message: `Studio: ${changeNames().join(', ')}`.slice(0, 200), tree: newTree.sha, parents: [headSha] } });
      await gh(`git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha } });

      DATA = out;
      loadedSha = json.sha;
      pending.forEach((f) => URL.revokeObjectURL(f.url));
      pending.clear();
      changed.clear();
      busy = false;
      render();
      setState();
      const link = view !== 'site' ? `<a href="../#${esc(view)}" target="_blank" rel="noopener">Open it on the site</a>` : '<a href="../" target="_blank" rel="noopener">Open the site</a>';
      showBanner(`Published. The site updates in a minute or two. ${link}`);
    } catch (err) {
      busy = false;
      setState();
      showBanner(esc(err.message), true);
    }
  });

  /* ---------------- boot ---------------- */

  if (!token) {
    $('#connect').hidden = false;
  } else {
    load().catch((err) => {
      $('#connect').hidden = false;
      $('#connectErr').textContent = err.message;
    });
  }
})();
