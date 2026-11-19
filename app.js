(() => {
  "use strict";
  const CFG = window.SITE_CONFIG || {};
  const DATA = window.PACK_DATA;
  // Idioma: inglés por defecto; i18n.js decide y traduce el HTML antes de seguir
  const LANG = window.LANG || "en";
  if (window.applyI18n) window.applyI18n();
  const tr = (en, es) => (LANG === "es" ? es : en);
  const L = (x) => (x && typeof x === "object" ? (x[LANG] ?? x.en ?? Object.values(x)[0]) : x);
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) n.append(kid);
    return n;
  };

  if (!DATA) {
    document.body.prepend(el("p", { class: "wrap fine", text: "Falta data.js: ejecuta python tools/build_site.py" }));
    return;
  }
  // Orden del explorador: primero lo que más se ve en Bedwars, luego las animadas
  const TOP = ["items/", "blocks/wool", "blocks/hardened_clay", "blocks/glass", "blocks/end_stone",
    "blocks/obsidian", "blocks/planks", "blocks/ladder", "models/", "gui/"];
  const rank = (t) => {
    const i = TOP.findIndex((p) => t.id.startsWith(p));
    return (i < 0 ? TOP.length : i) * 2 + (t.pack.anim ? 0 : 1);
  };
  DATA.textures.sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  const v = (src) => (DATA.version ? `${src}?v=${DATA.version}` : src);
  const byId = new Map(DATA.textures.map((t) => [t.id, t]));

  // ------------------------------------------------------------ textos fijos
  document.querySelectorAll("[data-name]").forEach((n) => (n.textContent = CFG.name || "Starseer"));
  document.querySelectorAll("[data-tagline]").forEach((n) => (n.textContent = L(CFG.tagline) || ""));
  $("#updated").textContent = new Date(DATA.updated + "T12:00:00").toLocaleDateString(LANG, { day: "numeric", month: "long", year: "numeric" });

  // ------------------------------------------------------------ texturas animadas
  // Cada textura se dibuja en un <canvas> a su tamaño real y el CSS la amplía sin
  // suavizar. Las animadas siguen su .mcmeta: 20 ticks por segundo, con
  // interpolación si la tiene.
  const images = new Map();
  const loadImage = (src) => {
    if (!images.has(src)) {
      images.set(src, new Promise((ok, fail) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = fail;
        img.src = v(src);
      }));
    }
    return images.get(src);
  };

  const live = new Set();
  const visible = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
  });

  function texCanvas(info, label) {
    const c = el("canvas", { class: "tex", role: "img", "aria-label": label || "" });
    c.width = c.height = info.w;
    loadImage(info.src).then((img) => {
      c._img = img;
      if (info.anim) {
        c._anim = info.anim;
        c._total = info.anim.frames.reduce((s, f) => s + f[1], 0);
        c._last = -1;
        live.add(c);
        io.observe(c);
      } else {
        c.height = img.height;
      }
      draw(c, 0, 0);
    }).catch(() => {});
    return c;
  }

  function draw(c, index, next, t) {
    const ctx = c.getContext("2d");
    const w = c.width;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, c.height);
    ctx.globalAlpha = 1;
    const h = c._anim ? w : c._img.height;
    ctx.drawImage(c._img, 0, index * w, w, h, 0, 0, w, h);
    if (t > 0) {
      ctx.globalAlpha = t;
      ctx.drawImage(c._img, 0, next * w, w, w, 0, 0, w, w);
    }
  }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  function frame(now) {
    const tick = Math.floor((now - t0) / 50);
    for (const c of live) {
      if (!c.isConnected) { live.delete(c); io.unobserve(c); continue; }
      if (!visible.has(c) && !c.closest("dialog[open]")) continue;
      const { frames, interpolate } = c._anim;
      let t = tick % c._total, k = 0;
      while (t >= frames[k][1]) t -= frames[k++][1];
      const key = interpolate ? tick : k;
      if (key === c._last) continue;
      c._last = key;
      const next = frames[(k + 1) % frames.length][0];
      draw(c, frames[k][0], next, interpolate ? t / frames[k][1] : 0);
    }
    requestAnimationFrame(frame);
  }
  if (!reduceMotion) requestAnimationFrame(frame);

  // ------------------------------------------------------------ portada
  const animated = DATA.textures.filter((t) => t.pack.anim).length;
  const stats = [
    [DATA.textures.length, tr("textures changed", "texturas cambiadas")],
    [animated, tr("animations", "animaciones")],
    ["16×", tr("vanilla resolution", "resolución vanilla")],
    [DATA.downloads.length, DATA.downloads.length === 1 ? tr("version", "versión") : tr("versions", "versiones")],
  ];
  $("#stats").append(...stats.map(([n, l]) => el("li", {}, el("b", { text: String(n), "data-count": typeof n === "number" ? n : "" }), el("span", { text: l }))));

  document.querySelectorAll("[data-anim-count]").forEach((n) => (n.textContent = animated));

  // La perla del pack, animada con su .mcmeta, en lugar del icono estático
  const pearl = byId.get("items/ender_pearl");
  if (pearl) $("#hero-pearl").replaceChildren(texCanvas(pearl.pack, ""));

  // Estrellas en píxeles que titilan sobre el fondo (cuadrados, sin suavizado)
  (function stars() {
    const c = $("#hero-stars"), hero = c.parentElement, ctx = c.getContext("2d");
    let list = [], running = true;
    const rand = (a, b) => a + Math.random() * (b - a);
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = Math.round(hero.clientWidth * dpr);
      c.height = Math.round(hero.clientHeight * dpr);
      const px = Math.max(2, Math.round(2 * dpr));
      const n = Math.round((hero.clientWidth * hero.clientHeight) / 9000);
      list = Array.from({ length: n }, () => ({
        x: Math.round(rand(0, c.width) / px) * px, y: Math.round(rand(0, c.height * 0.8) / px) * px,
        s: px * (Math.random() < 0.12 ? 2 : 1), cross: Math.random() < 0.06,
        ph: rand(0, Math.PI * 2), sp: rand(0.6, 1.8), hue: ["#ffffff", "#cfe3ff", "#ffd6f2", "#8fe6dc"][Math.floor(rand(0, 4))],
      }));
      draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const st of list) {
        const a = reduceMotion ? 0.6 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(now / 1000 * st.sp + st.ph)) ** 3;
        ctx.globalAlpha = a;
        ctx.fillStyle = st.hue;
        ctx.fillRect(st.x, st.y, st.s, st.s);
        if (st.cross && a > 0.55) {
          ctx.globalAlpha = a * 0.6;
          ctx.fillRect(st.x - st.s, st.y, st.s, st.s); ctx.fillRect(st.x + st.s, st.y, st.s, st.s);
          ctx.fillRect(st.x, st.y - st.s, st.s, st.s); ctx.fillRect(st.x, st.y + st.s, st.s, st.s);
        }
      }
    }
    new IntersectionObserver(([e]) => (running = e.isIntersecting)).observe(hero);
    addEventListener("resize", resize);
    resize();
    if (!reduceMotion) (function loop(now) { if (running && !hero.closest("[hidden]")) draw(now); requestAnimationFrame(loop); })(0);
  })();

  // ------------------------------------------------------------ vitrina de animaciones
  const SHOWCASE = [
    ["items/ender_pearl", tr("Ender pearl", "Perla de ender"),
      tr("The eye opens, looks around and closes again.", "El ojo se abre, mira alrededor y vuelve a cerrarse.")],
    ["blocks/diamond_ore", tr("Diamond ore", "Mena de diamante"),
      tr("A four-point star runs along the veins, one at a time.", "Una estrella de cuatro puntas recorre las vetas por turnos.")],
    ["items/diamond", tr("Diamond", "Diamante"),
      tr("A diagonal glint every few seconds: you spot it on the ground instantly.", "Un destello diagonal cada pocos segundos: lo ves tirado en el suelo al instante.")],
    ["items/gold_ingot", tr("Gold ingot", "Lingote de oro"),
      tr("Its own glint, offset from the rest so they never shine together.", "Su propio destello, desfasado del resto para que no brillen a la vez.")],
    ["blocks/redstone_ore", tr("Redstone ore", "Mena de redstone"),
      tr("Each nugget pulses on its own beat and tints the stone around it.", "Cada pepita late a su ritmo y tiñe la piedra de alrededor.")],
    ["items/fireball", tr("Fireball", "Bola de fuego"), tr("Magma pulsing from the core.", "Magma que late desde el centro.")],
    ["items/bow_pulling_2", tr("Fully drawn bow", "Arco en tensión"),
      tr("The string flashes white and red: you know when to let go.", "La cuerda parpadea en blanco y rojo: sabes cuándo soltar.")],
    ["items/bucket_lava", tr("Lava bucket", "Cubo de lava"),
      tr("The lava swirls in streaks and bubbles pop at the rim.", "La lava se remueve en vetas y revientan burbujas en la boca.")],
    ["blocks/enchanting_table_top", tr("Enchanting table", "Mesa de encantamientos"),
      tr("The diamonds glint in turns and the cloth breathes.", "Los diamantes destellan por turnos y el paño respira.")],
    ["items/fishing_rod_uncast", tr("Fishing rod", "Caña de pescar"),
      tr("The bobber floats and sometimes dips without warning.", "El corcho flota y a veces se hunde de golpe.")],
    ["blocks/furnace_front_on", tr("Lit furnace", "Horno encendido"),
      tr("The flames flicker from the bottom up.", "Las llamas parpadean de abajo arriba.")],
    ["items/beef_cooked", tr("Steak", "Filete"),
      tr("Three wisps of steam curl upward.", "Tres volutas de vapor que suben ondulando.")],
  ].filter(([id]) => byId.get(id)?.pack.anim);

  (function showcase() {
    if (!SHOWCASE.length) return;
    const STEP = 6000;
    let idx = 0, auto = !reduceMotion, timer;
    const reel = $("#reel"), bar = $("#stage-bar");
    const buttons = SHOWCASE.map(([id, title], i) => el("button", {
      "aria-pressed": "false", "aria-label": title, title,
      onclick: () => { auto = false; show(i); },
    }, texCanvas(byId.get(id).pack, "")));
    reel.append(...buttons);
    function show(i) {
      idx = i;
      const [id, title, desc] = SHOWCASE[i];
      const t = byId.get(id);
      $("#stage-tex").replaceChildren(texCanvas(t.pack, title));
      $("#stage-kicker").textContent = `${t.pack.anim.frames.length} ${tr("frames", "fotogramas")} · ${(t.pack.anim.frames.reduce((s, f) => s + f[1], 0) / 20).toFixed(1)} s ${tr("per loop", "por ciclo")}`;
      $("#stage-title").textContent = title;
      $("#stage-desc").textContent = desc;
      buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      bar.className = "";
      void bar.offsetWidth;            // reinicia la animación de la barra
      bar.className = auto ? "run" : "stop";
      bar.style.setProperty("--dur", STEP + "ms");
      clearTimeout(timer);
      if (auto) timer = setTimeout(() => show((idx + 1) % SHOWCASE.length), STEP);
    }
    // La reproducción automática se pausa al pasar el ratón por la vitrina
    const box = $(".showcase");
    box.addEventListener("mouseenter", () => { if (auto) { clearTimeout(timer); bar.style.animationPlayState = "paused"; } });
    box.addEventListener("mouseleave", () => { if (auto) show(idx); });
    show(0);
  })();

  // ------------------------------------------------------------ bloques en 3D
  // Cubos de CSS 3D con un <canvas> por cara (así las caras animadas se mueven).
  // [nombre, arriba, lados, frente, abajo]; si falta frente o abajo se usan los lados.
  const CUBES = [
    ["TNT", "tnt_top", "tnt_side", null, "tnt_bottom"],
    [tr("Crafting table", "Mesa de crafteo"), "crafting_table_top", "crafting_table_side", "crafting_table_front", "planks_oak"],
    [tr("Lit furnace", "Horno encendido"), "furnace_top", "furnace_side", "furnace_front_on", "furnace_top"],
    [tr("Enchanting table", "Mesa de encantamientos"), "enchanting_table_top", "enchanting_table_side", null, "enchanting_table_bottom"],
    [tr("Diamond block", "Bloque de diamante"), "diamond_block", "diamond_block"],
    [tr("Emerald block", "Bloque de esmeralda"), "emerald_block", "emerald_block"],
    [tr("Diamond ore", "Mena de diamante"), "diamond_ore", "diamond_ore"],
    [tr("Obsidian", "Obsidiana"), "obsidian", "obsidian"],
    [tr("Bookshelf", "Librería"), "planks_oak", "bookshelf"],
    [tr("Jack o'lantern", "Calabaza encendida"), "pumpkin_top", "pumpkin_side", "pumpkin_face_on", "pumpkin_top"],
    [tr("Red glass", "Cristal rojo"), "glass_red", "glass_red", null, null, true],
    [tr("Oak log", "Tronco de roble"), "log_oak_top", "log_oak", null, "log_oak_top"],
  ];
  (function cubes() {
    const host = $("#cubes");
    const T = (n) => n && byId.get("blocks/" + n);
    const states = [];
    CUBES.forEach(([name, top, side, front, bottom, glass], i) => {
      if (!T(top) || !T(side)) return;
      const faces = { top, bottom: bottom || side, front: front || side, back: side, left: side, right: side };
      const cube = el("div", { class: "cube" }, ...Object.entries(faces).map(([k, n]) =>
        el("div", { class: `face f-${k}`, style: glass ? "backface-visibility:visible" : "" }, texCanvas((T(n) || T(side)).pack, ""))));
      const cell = el("div", { class: "cube-cell", role: "img", "aria-label": `${name}, ${tr("3D view", "en 3D")}` },
        el("div", { class: "scene" }, cube), el("div", { class: "cube-shadow" }), el("span", { text: name }));
      host.append(cell);
      const st = { cube, rx: -24, ry: 35 + i * 23, vy: 0, drag: null };
      states.push(st);
      // Arrastrar para girar; al soltar conserva algo de inercia
      cell.addEventListener("pointerdown", (e) => { cell.setPointerCapture(e.pointerId); st.drag = { x: e.clientX, y: e.clientY }; st.vy = 0; });
      cell.addEventListener("pointermove", (e) => {
        if (!st.drag) return;
        const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
        st.ry += dx * 0.6; st.rx = Math.max(-80, Math.min(80, st.rx - dy * 0.5));
        st.vy = dx * 0.6; st.drag = { x: e.clientX, y: e.clientY };
        paint(st);
      });
      const end = () => { st.drag = null; };
      cell.addEventListener("pointerup", end);
      cell.addEventListener("pointercancel", end);
      paint(st);
    });
    function paint(st) { st.cube.style.transform = `rotateX(${st.rx}deg) rotateY(${st.ry}deg)`; }
    let visibleCubes = false;
    new IntersectionObserver(([e]) => (visibleCubes = e.isIntersecting)).observe(host);
    (function loop() {
      if (visibleCubes) for (const st of states) {
        if (st.drag) continue;
        st.vy *= 0.94;                                   // inercia que se apaga
        const spin = reduceMotion ? 0 : 0.35;            // giro lento de base
        st.ry += st.vy + (Math.abs(st.vy) < spin ? spin : 0);
        st.rx += (-24 - st.rx) * 0.04;                   // vuelve a su inclinación
        paint(st);
      }
      requestAnimationFrame(loop);
    })();
  })();

  // ------------------------------------------------------------ partículas al descargar
  // Usa los críticos del propio pack (particles.png, sprites 65 y 66 de 8×8).
  const fx = el("canvas", { class: "fx", "aria-hidden": "true" });
  document.body.append(fx);
  const parts = [];
  let fxRunning = false;
  const sprite = byId.get("particle/particles");
  function burst(x, y) {
    if (reduceMotion || !sprite) return;
    loadImage(sprite.pack.src).then((img) => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const sp = (5 + Math.random() * 7) * dpr;
        parts.push({ x: x * dpr, y: y * dpr, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0,
          max: 40 + Math.random() * 25, sx: Math.random() < 0.55 ? 8 : 16, k: Math.round((3 + Math.random() * 2) * dpr) });
      }
      if (!fxRunning) { fxRunning = true; requestAnimationFrame((t) => step(img)); }
    }).catch(() => {});
  }
  function step(img) {
    const ctx = fx.getContext("2d");
    ctx.clearRect(0, 0, fx.width, fx.height);
    ctx.imageSmoothingEnabled = false;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.97;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, (p.max - p.life) / 12);
      const s = 8 * p.k;
      ctx.drawImage(img, p.sx, 32, 8, 8, Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    if (parts.length) requestAnimationFrame(() => step(img));
    else { fxRunning = false; ctx.clearRect(0, 0, fx.width, fx.height); }
  }

  // ------------------------------------------------------------ novedades
  const FEATURES = [
    ["img", tr("Cosmic sky", "Cielo cósmico"),
      tr("Nebulas, a galactic band and thousands of stars. No clouds blocking the view.", "Nebulosas, una banda galáctica y miles de estrellas. Sin nubes que tapen la vista.")],
    ["blocks/wool_colored_red", tr("Clean wool and clay", "Lana y arcilla limpias"),
      tr("Flat, beveled colors: you can tell every team apart from afar.", "Colores planos con bisel: distingues cada equipo a distancia.")],
    ["blocks/glass_blue", tr("Team glass", "Cristal de equipo"),
      tr("Framed in its wool color, with connected glass that only joins its own color.", "Marco del color de su lana y cristal conectado que solo se une con su mismo color.")],
    ["items/diamond", tr("Animated resources", "Recursos animados"),
      tr("Diamonds, emeralds and ingots glint in turns. You spot them on the ground instantly.", "Diamante, esmeralda y lingotes destellan por turnos. Los ves en el suelo al instante.")],
    ["items/iron_chestplate", tr("Readable armor", "Armaduras distinguibles"),
      tr("Stitching, rivets or a gem edge depending on the material, even when enchanted.", "Costuras, remaches o filo de gema según el material, también con encantamiento.")],
    ["items/diamond_sword", tr("Matching weapons and tools", "Armas y herramientas a juego"),
      tr("Short swords and tools in their material's palette.", "Espadas cortas y herramientas con la paleta de su material.")],
    ["items/potion_bottle_drinkable", tr("Redesigned shop", "Tienda rediseñada"),
      tr("Bubbling potions, bridge egg, bedbug, Dream Defender and magic milk.", "Pociones que burbujean, huevo puente, bedbug, Dream Defender y leche mágica.")],
    ["items/fireball", tr("Readable effects", "Efectos legibles"),
      tr("Low fire, solid crits, clearer water and a fireball with living magma.", "Fuego bajo, críticos opacos, agua más clara y una bola de fuego con magma vivo.")],
    ["items/apple_golden", tr("Red and cobalt HUD", "HUD rojo y cobalto"),
      tr("Hearts, hotbar and menus in one palette, with text that always stays readable.", "Corazones, hotbar e interfaces en la misma paleta, con el texto siempre legible.")],
  ];
  $("#features").append(...FEATURES.map(([id, title, desc], i) => {
    const t = byId.get(id);
    const icon = id === "img" ? el("img", { class: "tex", src: "img/pack.png", alt: "" })
      : t ? texCanvas(t.pack, "") : el("span", { class: "tex" });
    return el("article", { class: "feature reveal", style: `--i:${i % 3}` }, icon,
      el("div", {}, el("h3", { text: title }), el("p", { text: desc })));
  }));

  // ------------------------------------------------------------ aparición al hacer scroll
  document.documentElement.classList.add("js");
  const revealer = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((n) => revealer.observe(n));

  // Las cifras de la portada cuentan hasta su valor
  if (!reduceMotion) document.querySelectorAll("[data-count]").forEach((b) => {
    const end = +b.dataset.count;
    if (!end) return;
    const t0 = performance.now(), dur = 1100;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      b.textContent = Math.round(end * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });

  // ------------------------------------------------------------ antes / después
  // Dos rejillas idénticas de <canvas>: el pack abajo y vanilla encima, recortada.
  // Así el lado del pack se ve animado. Los PNG quedan solo de respaldo.
  const cmp = $("#compare");
  const cmpIds = (DATA.compare.ids || []).filter((id) => byId.get(id)?.vanilla);
  if (cmpIds.length) {
    const grid = (side) => el("div", { class: "cmp-grid", style: `--cols:${DATA.compare.cols || 7}` },
      ...cmpIds.map((id) => texCanvas(byId.get(id)[side], "")));
    $("#cmp-pack").replaceWith(Object.assign(grid("pack"), { id: "cmp-pack" }));
    $("#cmp-vanilla").replaceWith(Object.assign(grid("vanilla"), { id: "cmp-vanilla" }));
  } else {
    $("#cmp-pack").src = v(DATA.compare.pack);
    $("#cmp-vanilla").src = v(DATA.compare.vanilla);
    [$("#cmp-pack"), $("#cmp-vanilla")].forEach((i) => { i.width = DATA.compare.w; i.height = DATA.compare.h; });
  }
  const setSplit = (pct) => {
    pct = Math.max(0, Math.min(100, pct));
    $("#cmp-top").style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    $("#cmp-handle").style.left = pct + "%";
    cmp.setAttribute("aria-valuenow", Math.round(pct));
  };
  const fromPointer = (e) => {
    const r = cmp.getBoundingClientRect();
    setSplit(((e.clientX - r.left) / r.width) * 100);
  };
  cmp.addEventListener("pointerdown", (e) => { cmp.setPointerCapture(e.pointerId); fromPointer(e); });
  cmp.addEventListener("pointermove", (e) => { if (cmp.hasPointerCapture(e.pointerId)) fromPointer(e); });
  cmp.addEventListener("keydown", (e) => {
    const now = +cmp.getAttribute("aria-valuenow");
    if (e.key === "ArrowLeft") { setSplit(now - 5); e.preventDefault(); }
    if (e.key === "ArrowRight") { setSplit(now + 5); e.preventDefault(); }
  });
  setSplit(50);

  // ------------------------------------------------------------ explorador
  const PAGE = 96;
  let cat = "all", query = "", onlyAnim = false, shown = PAGE;
  const counts = {};
  DATA.textures.forEach((t) => (counts[t.cat] = (counts[t.cat] || 0) + 1));
  const chips = [["all", `${tr("All", "Todo")} (${DATA.textures.length})`],
    ...Object.entries(DATA.categories).filter(([k]) => counts[k]).map(([k, v]) => [k, `${L(v)} (${counts[k]})`])];
  $("#chips").append(...chips.map(([k, label]) => el("button", {
    class: "chip", "aria-pressed": String(k === cat), text: label, "data-cat": k,
    onclick: () => {
      cat = k; shown = PAGE;
      document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === k)));
      renderGrid();
    },
  })));
  $("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); shown = PAGE; renderGrid(); });
  $("#only-anim").addEventListener("change", (e) => { onlyAnim = e.target.checked; shown = PAGE; renderGrid(); });

  function renderGrid() {
    const list = DATA.textures.filter((t) =>
      (cat === "all" || t.cat === cat) && (!onlyAnim || t.pack.anim) && (!query || t.id.toLowerCase().includes(query)));
    const grid = $("#grid");
    grid.replaceChildren(...list.slice(0, shown).map((t) => el("button", {
      class: "cell", title: t.id, onclick: () => openViewer(t),
    }, texCanvas(t.pack, t.name), el("span", { text: t.name }),
      t.pack.anim ? el("span", { class: "badge", text: tr("animated", "animada") }) : !t.vanilla ? el("span", { class: "badge", text: tr("new", "nueva") }) : null)));
    $("#count").textContent = list.length ? `${list.length} ${tr("textures", "texturas")}` : tr("No textures match your search.", "Ninguna textura coincide con la búsqueda.");
    $(".more")?.remove();
    if (list.length > shown) {
      grid.after(el("button", { class: "btn btn-ghost more", text: `${tr("Show more", "Mostrar más")} (${list.length - shown})`,
        onclick: () => { shown += PAGE * 2; renderGrid(); } }));
    }
  }
  renderGrid();

  const viewer = $("#viewer");
  function openViewer(t) {
    $("#viewer-title").textContent = t.name;
    $("#viewer-pack").replaceChildren(texCanvas(t.pack, `${t.name}, ${tr("pack", "en el pack")}`));
    $("#viewer-vanilla").replaceChildren(t.vanilla ? texCanvas(t.vanilla, `${t.name}, vanilla`)
      : el("p", { class: "none", text: tr("Not in vanilla: this one is new to the pack.", "No existe en vanilla: es nueva del pack.") }));
    const bits = [`assets/minecraft/textures/${t.id}.png`, `${t.pack.w}×${t.pack.w} px`];
    if (t.pack.anim) bits.push(`${t.pack.anim.frames.length} ${tr("frames", "fotogramas")}${t.pack.anim.interpolate ? tr(", interpolated", ", interpolada") : ""}`);
    $("#viewer-meta").textContent = bits.join(" · ");
    viewer.showModal();
  }

  // ------------------------------------------------------------ galería
  // Dos tipos de pieza: imagen generada (cielo, armaduras, HUD, interfaces) o un
  // set de texturas que se dibuja en vivo, con sus animaciones.
  const lightbox = $("#lightbox");
  const setCanvases = (ids) => ids.map((id) => byId.get(id)).filter(Boolean)
    .map((t) => texCanvas(t.pack, t.name));
  $("#gallery").append(...DATA.gallery.map((g) => {
    const frame = g.set
      ? el("div", { class: "frame set", style: `--cols:${g.cols}` }, ...setCanvases(g.set))
      : el("div", { class: "frame" }, el("img", { src: v(g.src), alt: L(g.title), loading: "lazy", width: g.w, height: g.h }));
    return el("button", {
      class: "shot" + (g.photo ? " photo wide" : ""),
      onclick: () => {
        const img = $("#lightbox-img"), box = $("#lightbox-set");
        img.hidden = !!g.set;
        box.hidden = !g.set;
        if (g.set) {
          box.style.setProperty("--cols", g.cols);
          box.replaceChildren(...setCanvases(g.set));
        } else {
          img.src = v(g.src);
          img.alt = L(g.title);
        }
        $("#lightbox-cap").textContent = `${L(g.title)}. ${L(g.desc)}`;
        lightbox.showModal();
      },
    }, frame, el("div", { class: "txt" }, el("h3", { text: L(g.title) }), el("p", { text: L(g.desc) })));
  }));
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  // ------------------------------------------------------------ descargas
  const kb = (b) => (b >= 1 << 20 ? (b / (1 << 20)).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  $("#downloads").append(...DATA.downloads.map((d) => {
    const name = d.file.split("/").pop();
    const copy = el("button", { class: "copy", text: tr("Copy", "Copiar") });
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(d.sha256); copy.textContent = tr("Copied", "Copiado"); }
      catch { copy.textContent = tr("Select it", "Selecciónalo"); }
      setTimeout(() => (copy.textContent = tr("Copy", "Copiar")), 1600);
    });
    return el("article", { class: "dl" + (d.main ? " main" : "") },
      el("h3", {}, L(d.label), d.main ? el("span", { class: "tag", text: tr("Recommended", "Recomendada") }) : null),
      el("p", { text: L(d.note) }),
      el("dl", {},
        el("dt", { text: tr("File", "Archivo") }), el("dd", { text: name }),
        el("dt", { text: tr("Size", "Tamaño") }), el("dd", { text: kb(d.bytes) }),
        el("dt", { text: tr("Textures", "Texturas") }), el("dd", { text: String(d.textures) }),
        el("dt", { text: "SHA-256" }), el("dd", { class: "hash" }, el("code", { text: d.sha256, title: d.sha256 }), copy)),
      el("a", { class: "btn", href: d.file, download: name, text: `${tr("Download", "Descargar")} ${d.id}`,
        onclick: (e) => {
          const r = e.currentTarget.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2);
          showThanks(d.file, name);
        } }));
  }));

  // Al descargar: la descarga sigue su curso y encima aparece el aviso de apoyo.
  const thanks = $("#thanks");
  function showThanks(file, name) {
    const retry = $("#thanks-retry");
    retry.href = file;
    retry.setAttribute("download", name);
    setTimeout(() => thanks.showModal(), reduceMotion ? 200 : 900);   // deja ver las partículas
  }
  thanks.querySelector("[data-goto]").addEventListener("click", () => {
    thanks.close();
    setTimeout(() => $("#instalar").scrollIntoView({ behavior: "smooth" }), 50);
  });

  // ------------------------------------------------------------ apoyo y comunidad
  const support = CFG.support || [];
  const supportBtn = (s, cls) => s.url
    ? el("a", { class: cls, href: s.url, target: "_blank", rel: "noopener", text: `${tr("Support on", "Apoyar en")} ${s.label}` })
    : el("span", { class: cls, "aria-disabled": "true", text: `${s.label}: ${tr("coming soon", "próximamente")}` });
  $("#support").append(...support.map((s) => el("article", { class: "support-card" },
    el("h3", { text: s.label }), el("p", { text: L(s.desc) }), supportBtn(s, "btn btn-sm"))));
  const live_links = support.filter((s) => s.url);
  $("#thanks-links").append(...(live_links.length ? live_links.map((s) => supportBtn(s, "btn btn-sm")) : []),
    el("a", { class: "btn btn-sm btn-ghost", href: "#/apoyar", "data-close": "", text: tr("More ways to support", "Más formas de apoyar") }));
  const comm = (CFG.community || []).filter((c) => c.url);
  if (comm.length) $("#community").append(...comm.map((c) => el("a", { href: c.url, target: "_blank", rel: "noopener", text: c.label })));

  // ------------------------------------------------------------ páginas (#/ruta)
  const pages = [...document.querySelectorAll("[data-page]")];
  const titles = LANG === "es"
    ? { inicio: "", texturas: "Texturas", galeria: "Galería", descargar: "Descargar", ayuda: "Ayuda", apoyar: "Apoyar" }
    : { inicio: "", texturas: "Textures", galeria: "Gallery", descargar: "Download", ayuda: "Help", apoyar: "Support" };
  const baseTitle = tr("Starseer · Bedwars texture pack", "Starseer · Texture pack de Bedwars");
  function route() {
    let name = location.hash.replace(/^#\/?/, "") || "inicio";
    if (!titles.hasOwnProperty(name)) name = "inicio";
    pages.forEach((p) => (p.hidden = p.dataset.page !== name));
    document.querySelectorAll("[data-route]").forEach((a) =>
      a.dataset.route === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    document.title = titles[name] ? `${titles[name]} · ${CFG.name || "Starseer"}` : baseTitle.replace("Starseer", CFG.name || "Starseer");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", route);
  route();

  // ------------------------------------------------------------ pestañas de instalación
  const tabs = document.querySelectorAll("[data-tab]");
  tabs.forEach((b) => b.addEventListener("click", () => {
    tabs.forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
  }));
})();
