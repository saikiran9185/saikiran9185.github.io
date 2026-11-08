/* Dot-pad link dial — opening section of saikiran9185.github.io.
   Press on the grille, drag toward a platform, release to open it.
   Config lives in content/site.json → "dial". A platform shows only once it has a url.
   Generated from ~/Projects/DotPadLinks/web/dial.src.js (icons are inlined at build). */
(() => {
  const root = document.getElementById('dial');
  if (!root) return;

  const ICONS = {"behance": "M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z", "linkedin": "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", "instagram": "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z", "pinterest": "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z", "spotify": "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z", "mail": "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm.8 2.1V17h16.4V7.1l-8.2 6.1zM5.4 7l6.6 4.9L18.6 7z", "globe": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9h-3.5a15.6 15.6 0 0 0-1.3-6.1A8 8 0 0 1 19.9 11zM12 4.1c1 1.3 2.2 3.8 2.4 6.9H9.6C9.8 7.9 11 5.4 12 4.1zM8.9 4.9A15.6 15.6 0 0 0 7.6 11H4.1a8 8 0 0 1 4.8-6.1zM4.1 13h3.5a15.6 15.6 0 0 0 1.3 6.1A8 8 0 0 1 4.1 13zm7.9 6.9c-1-1.3-2.2-3.8-2.4-6.9h4.8c-.2 3.1-1.4 5.6-2.4 6.9zm3.1-.8a15.6 15.6 0 0 0 1.3-6.1h3.5a8 8 0 0 1-4.8 6.1z"};
  const ORANGE = '#FF8E48', INK = '#231f20', CREAM = '#fffceb';
  const DEFAULT = {
    hint: 'Press, drag toward where you want to go, release to open',
    platforms: [
      { name: 'Behance', icon: 'behance', color: '#1769FF', url: 'https://www.behance.net/chepurikiran', label: 'behance.net/chepurikiran' },
      { name: 'Website', icon: 'globe', color: '#FF8E48', url: '/', label: 'saikiran9185.github.io' },
      { name: 'Mail', icon: 'mail', color: '#EA4335', url: 'mailto:saikiran9185@gmail.com', label: 'saikiran9185@gmail.com' },
      { name: 'Instagram', icon: 'instagram', color: '#E1306C', url: 'https://www.instagram.com/saikiran_chepuri/', label: '@saikiran_chepuri' },
    ],
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- colour helpers ----------
  const hex2rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const rgb2hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const lumOf = (c) => {
    const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  };
  const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const WHITE = [255, 255, 255], INKC = hex2rgb(INK), CREAMC = hex2rgb(CREAM), ORANGEC = hex2rgb(ORANGE);
  const onColour = (c) => (contrast(WHITE, c) >= contrast(INKC, c) ? '#ffffff' : INK);
  const readableOnCream = (c) => {           // darken accents used as text on the cream card (brand orange stays)
    if (c.every((v, i) => Math.abs(v - ORANGEC[i]) < 2)) return c;
    let x = c.slice();
    for (let k = 0; k < 40 && contrast(x, CREAMC) < 3; k++) x = x.map((v) => v * 0.94);
    return x;
  };
  const smooth = (t) => t * t * (3 - 2 * t);

  // ---------- geometry (SVG user units, pad centre at 200,200) ----------
  const C = 200, PR = 124, RING = PR + 9, ICON_R = 170, RINGS = 7, SP = (PR * 0.88) / RINGS;
  const FINGER = 46, FR = FINGER / 2, BLOOM = FR * 3.0;
  const rad = (d) => (d * Math.PI) / 180;
  const pol = (r, a) => [C + r * Math.cos(rad(a)), C - r * Math.sin(rad(a))];
  const angDiff = (a, b) => Math.abs((((a - b + 180) % 360) + 360) % 360 - 180);

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  function init(cfg) {
    cfg = cfg && Array.isArray(cfg.platforms) ? cfg : DEFAULT;
    const P = cfg.platforms.filter((p) => p && p.url && ICONS[p.icon]);
    if (!P.length) { root.hidden = true; return; }
    const N = P.length, STEP = 360 / N;
    const ANG = P.map((_, i) => 90 - i * STEP);
    const COLS = P.map((p) => hex2rgb(p.color || ORANGE));

    const $ = (s) => root.querySelector(s);
    $('.dial-hint').textContent = cfg.hint || DEFAULT.hint;
    const pill = $('.dial-pill'), pillText = $('.dial-pill span'), sub = $('.dial-sub'), idle = $('.dial-idle');
    idle.textContent = `${N} place${N === 1 ? '' : 's'} to find me`;

    // ---------- build the pad ----------
    const svg = el('svg', { viewBox: '0 0 400 400', class: 'dial-svg', role: 'group', 'aria-label': 'Link dial' });
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: 'dialGrad', gradientUnits: 'userSpaceOnUse' }, defs);
    const stops = [0, 0.5, 1].map((o) => el('stop', { offset: o }, grad));
    const disc = el('circle', { cx: C, cy: C, r: PR, fill: 'url(#dialGrad)' }, svg);
    el('circle', { cx: C, cy: C, r: RING, fill: 'none', stroke: 'url(#dialGrad)', 'stroke-width': 5 }, svg);
    const dotsG = el('g', {}, svg);
    const dots = [];
    for (let k = 0; k <= RINGS; k++) {
      const cnt = k === 0 ? 1 : 6 * k;
      for (let j = 0; j < cnt; j++) {
        const a = 90 + (360 * j) / cnt, r = k * SP;
        const [x, y] = pol(r, a);
        dots.push({ k, r, a, x, y, n: el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.2, fill: '#111' }, dotsG) });
      }
    }
    const halo = el('circle', { cx: C, cy: C, r: 17, fill: '#fff', opacity: 0.18 }, svg);
    const knobShade = el('circle', { cx: C, cy: C, r: 12.5, fill: '#000', opacity: 0.35 }, svg);
    const knob = el('circle', { cx: C, cy: C, r: 11, fill: '#fff' }, svg);

    // platform icons = real links (tap/click/keyboard work without dragging)
    const icons = P.map((p, i) => {
      const [x, y] = pol(ICON_R, ANG[i]);
      const a = el('a', { href: p.url, class: 'dial-icon', 'aria-label': p.name }, svg);
      if (/^https?:/.test(p.url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      const ring = el('circle', { cx: x, cy: y, r: 16, fill: '#262626', stroke: '#3a3a3a', 'stroke-width': 1 }, a);
      const g = el('path', { d: ICONS[p.icon], fill: '#fff', opacity: 0.8, 'fill-rule': 'evenodd',
        transform: `translate(${x - 7.5} ${y - 7.5}) scale(${15 / 24})` }, a);
      a.addEventListener('click', (e) => { if (p.url.startsWith('#')) { e.preventDefault(); go(p); } });
      return { a, ring, g, x, y };
    });
    $('.dial-pad').appendChild(svg);

    // ---------- colour model ----------
    function colourAt(theta) {
      const rel = ((((90 - theta) % 360) + 360) % 360) / STEP;
      const i = Math.floor(rel) % N, t = rel - Math.floor(rel), hold = 0.2;
      if (t < hold) return COLS[i];
      if (t > 1 - hold) return COLS[(i + 1) % N];
      return mixRGB(COLS[i], COLS[(i + 1) % N], smooth((t - hold) / (1 - 2 * hold)));
    }
    const nearest = (theta) => ANG.reduce((b, a, i) => (angDiff(theta, a) < angDiff(theta, ANG[b]) ? i : b), 0);

    // ---------- state ----------
    const st = {
      down: false, theta: 90, dist: 0,            // finger
      hx: C, hy: C,                               // knob (smoothed)
      press: 0,                                   // 0..1 how "on" the spread is
      c1: ORANGEC.slice(), cm: ORANGEC.slice(), c2: ORANGEC.slice(),
      sel: -1, raf: 0,
    };

    // ---------- feedback: haptic + soft click ----------
    let actx;
    function tick(strong) {
      if (navigator.vibrate) navigator.vibrate(strong ? 18 : 8);
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(strong ? 520 : 1400, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.05 : 0.025, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (strong ? 0.09 : 0.035));
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.1);
      } catch { /* audio not available */ }
    }

    function go(p) {
      if (p.url.startsWith('#')) {
        const target = document.querySelector(p.url) || document.querySelector('main');
        target && target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      } else if (p.url.startsWith('/') || p.url.startsWith('mailto:')) {
        window.location.href = p.url;
      } else {
        const w = window.open(p.url, '_blank', 'noopener');
        if (!w) window.location.href = p.url;
      }
    }

    // ---------- render one frame ----------
    function render() {
      const sel = st.sel, theta = st.theta;
      // target colours
      let t1, tm, t2;
      if (sel < 0) { t1 = tm = t2 = sel === -2 ? colourAt(theta) : ORANGEC; }
      else {
        tm = colourAt(theta);
        const lock = 1 - Math.min(1, angDiff(theta, ANG[sel]) / 12);      // 1 = settled on one platform
        t1 = mixRGB(colourAt(theta + 180 / N), tm, lock);
        t2 = mixRGB(colourAt(theta - 180 / N), tm, lock);
      }
      const ease = reduceMotion ? 1 : 0.2;
      st.c1 = mixRGB(st.c1, t1, ease); st.cm = mixRGB(st.cm, tm, ease); st.c2 = mixRGB(st.c2, t2, ease);

      // knob follows the finger (soft spring), returns to centre on release
      const [tx, ty] = st.down ? pol(Math.min(st.dist, PR * 0.86), theta) : [C, C];
      const k = reduceMotion ? 1 : (st.down ? 0.45 : 0.18);
      st.hx += (tx - st.hx) * k; st.hy += (ty - st.hy) * k;
      st.press += ((st.down ? 1 : 0) - st.press) * (reduceMotion ? 1 : 0.22);

      // gradient along the tangent at theta (c1 = counter-clockwise neighbour side)
      const phi = theta + 90;
      const [gx1, gy1] = pol(PR, phi), [gx2, gy2] = pol(PR, phi + 180);
      grad.setAttribute('x1', gx1); grad.setAttribute('y1', gy1); grad.setAttribute('x2', gx2); grad.setAttribute('y2', gy2);
      stops[0].setAttribute('stop-color', rgb2hex(st.c1));
      stops[1].setAttribute('stop-color', rgb2hex(st.cm));
      stops[2].setAttribute('stop-color', rgb2hex(st.c2));

      // dots: fan from the centre toward the knob ∪ bloom under the knob
      const hr = Math.hypot(st.hx - C, st.hy - C);
      const reach = PR, pr = st.press;
      for (const d of dots) {
        let p = 0, sw = 0, wave = 0;
        if (pr > 0.02) {
          if (d.k > 0 && hr > 4 && d.r <= reach + SP * 0.5) {
            const da = rad(angDiff(d.a, theta));
            if (da < Math.PI / 2) {
              const along = d.r * Math.cos(da), perp = d.r * Math.sin(da);
              const width = 7 + along * Math.tan(rad(21.9));       // same fan angle as the approved FINAL frames
              if (perp <= width + SP * 0.35) p = 0.72 + 0.28 * Math.min(1, along / reach);
            }
          }
          const dd = Math.hypot(d.x - st.hx, d.y - st.hy);
          if (dd <= BLOOM) {
            sw = Math.max(0, 1 - dd / (FR * 1.5)) ** 0.7;
            wave = (0.5 + 0.5 * Math.cos((2 * Math.PI * dd) / (FR * 1.25))) * (1 - dd / BLOOM);
            p = Math.max(p, 0.62 + 0.38 * Math.max(sw, wave));
          }
          p *= pr;
        }
        if (p > 0.05) {
          d.n.setAttribute('fill', '#fff'); d.n.setAttribute('opacity', p.toFixed(2));
          d.n.setAttribute('r', (4.4 + (3.2 * sw + 0.9 * wave) * pr).toFixed(2));
        } else {
          d.n.setAttribute('fill', '#111'); d.n.setAttribute('opacity', 1); d.n.setAttribute('r', 4.2);
        }
      }
      knob.setAttribute('cx', st.hx); knob.setAttribute('cy', st.hy);
      knobShade.setAttribute('cx', st.hx); knobShade.setAttribute('cy', st.hy);
      halo.setAttribute('cx', st.hx); halo.setAttribute('cy', st.hy);

      // page accents follow the pad colour
      const acc = st.cm;
      root.style.setProperty('--acc', rgb2hex(acc));
      root.style.setProperty('--on-acc', onColour(acc));
      root.style.setProperty('--acc-text', rgb2hex(readableOnCream(acc)));

      // icons
      icons.forEach((ic, i) => {
        const on = i === sel && angDiff(theta, ANG[i]) < 12;
        ic.ring.setAttribute('r', on ? 19 : 16);
        ic.ring.setAttribute('fill', on ? P[i].color : '#262626');
        ic.ring.setAttribute('stroke', on ? '#fff' : (i === sel ? rgb2hex(acc) : '#3a3a3a'));
        ic.ring.setAttribute('stroke-width', on || i === sel ? 1.8 : 1);
        ic.g.setAttribute('fill', on ? onColour(COLS[i]) : '#fff');
        ic.g.setAttribute('opacity', on ? 1 : 0.8);
        const s = on ? 18 : 15;
        ic.g.setAttribute('transform', `translate(${ic.x - s / 2} ${ic.y - s / 2}) scale(${s / 24})`);
      });

      const moving = Math.abs(tx - st.hx) + Math.abs(ty - st.hy) > 0.3 || Math.abs((st.down ? 1 : 0) - st.press) > 0.01 ||
        Math.abs(st.cm[0] - tm[0]) + Math.abs(st.cm[1] - tm[1]) + Math.abs(st.cm[2] - tm[2]) > 1.5;
      st.raf = moving || st.down ? requestAnimationFrame(render) : 0;
    }
    const kick = () => { if (!st.raf) st.raf = requestAnimationFrame(render); };

    function label() {
      if (st.sel >= 0) {
        const p = P[st.sel];
        pill.hidden = false; idle.hidden = true;
        pillText.textContent = p.name.toUpperCase();
        sub.textContent = p.label || p.url.replace(/^mailto:|^https?:\/\/(www\.)?/g, '');
      } else if (st.down) {
        pill.hidden = true; idle.hidden = false; idle.textContent = 'Drag outward';
        sub.textContent = '';
      } else {
        pill.hidden = true; idle.hidden = false; idle.textContent = `${N} place${N === 1 ? '' : 's'} to find me`;
        sub.textContent = '';
      }
    }

    // ---------- pointer ----------
    const toLocal = (e) => {
      const b = svg.getBoundingClientRect();
      return [((e.clientX - b.left) / b.width) * 400, ((e.clientY - b.top) / b.height) * 400];
    };
    function update(e) {
      const [x, y] = toLocal(e);
      const dx = x - C, dy = C - y;
      st.dist = Math.hypot(dx, dy);
      if (st.dist > 2) st.theta = (Math.atan2(dy, dx) * 180) / Math.PI;
      const prev = st.sel;
      st.sel = st.dist < PR * 0.22 ? -1 : nearest(st.theta);
      if (st.sel !== prev) { if (st.sel >= 0) tick(false); label(); }
      kick();
    }
    svg.addEventListener('pointerdown', (e) => {
      const [x, y] = toLocal(e);
      if (Math.hypot(x - C, y - C) > RING + 8) return;     // icons outside the ring stay normal links
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      st.down = true; root.classList.add('is-dragging');
      update(e); label();
    });
    svg.addEventListener('pointermove', (e) => { if (st.down) update(e); });
    const end = (e, cancel) => {
      if (!st.down) return;
      st.down = false; root.classList.remove('is-dragging');
      const sel = st.sel;
      st.sel = cancel ? -1 : sel;
      if (!cancel && sel >= 0) { tick(true); setTimeout(() => go(P[sel]), reduceMotion ? 0 : 140); }
      setTimeout(() => { st.sel = -1; label(); kick(); }, reduceMotion ? 0 : 420);
      kick();
    };
    svg.addEventListener('pointerup', (e) => end(e, false));
    svg.addEventListener('pointercancel', (e) => end(e, true));

    // keyboard: arrows pick a platform on the pad, Enter opens it
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') { st.sel = -1; label(); kick(); return; }
      if (e.key === 'Enter' || e.key === ' ') { if (st.sel >= 0) go(P[st.sel]); return; }
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      st.sel = st.sel < 0 ? 0 : (st.sel + dir + N) % N;
      st.theta = ANG[st.sel]; label(); kick();
    });

    label();
    render();
  }

  // card artwork (outlined vector; accents recolour via CSS variables)
  fetch('/assets/dial/card.svg').then((r) => r.text()).then((t) => { root.querySelector('.dial-card').innerHTML = t; }).catch(() => {});
  fetch('/content/site.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => init(d.dial)).catch(() => init(DEFAULT));
})();
