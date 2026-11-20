// Idiomas del sitio. El HTML está en inglés (idioma base); aquí va el español.
// Cada elemento con data-i18n="clave" cambia su contenido por ES[clave], y
// data-i18n-attr="atributo:clave;..." cambia atributos. El idioma se elige con
// el botón EN/ES (se recuerda) o con ?lang=es en la URL.
(function () {
  "use strict";
  const ES = {
    "nav.label": "Páginas",
    "nav.home": "Inicio",
    "nav.textures": "Texturas",
    "nav.gallery": "Galería",
    "nav.download": "Descargar",
    "nav.help": "Ayuda",
    "nav.support": "Apoyar",
    "hero.pearl": "La perla de ender del pack, animada: el ojo se abre y mira alrededor",
    "hero.download": "Descargar gratis",
    "hero.all": "Ver todas las texturas",
    "motion.title": "En movimiento",
    "motion.lead": '<span data-anim-count>41</span> texturas animadas, cada una con su ritmo para que no parpadeen a la vez. Así se ven en el juego, fotograma a fotograma.',
    "motion.pick": "Elegir animación",
    "cubes.title": "En 3D",
    "cubes.lead": "Los bloques tal como los ves en el mapa, con la sombra de cada cara. Arrastra uno para girarlo.",
    "features.title": "Qué cambia",
    "features.lead": "Todo lo que importa en una partida se lee de un vistazo. El resto se ve limpio y no distrae.",
    "compare.title": "Antes y después",
    "compare.lead": "Arrastra la barra. A la izquierda, vanilla 1.8.9; a la derecha, el pack.",
    "compare.label": "Comparar vanilla con el pack",
    "cta.title": "¿Listo para probarlo?",
    "cta.text": "Gratis, sin registro y en un solo ZIP. Funciona en Lunar, Badlion y OptiFine.",
    "cta.download": "Ir a descargas",
    "cta.gallery": "Ver la galería",
    "tex.title": "Explorador de texturas",
    "tex.lead": "Las animaciones se reproducen como en el juego. Haz clic en una textura para compararla con la original.",
    "tex.search": "Buscar: wool, sword, ore…",
    "tex.searchLabel": "Buscar texturas",
    "tex.categories": "Categorías",
    "tex.onlyAnim": "Solo animadas",
    "gallery.title": "Galería",
    "gallery.lead": "Cada pieza se dibuja con las texturas actuales del pack, animaciones incluidas.",
    "dl.title": "Descargar",
    "dl.lead": "Gratis y sin registro.",
    "dl.hash": "Descarga el pack solo desde esta página. El SHA-256 te deja comprobar que el archivo no fue modificado. En PowerShell: <code>Get-FileHash .\\Starseer_1.8.9.zip</code>",
    "inst.title": "Instalación",
    "inst.tabOptifine": "OptiFine / launcher oficial",
    "inst.tabModern": "Versión 26.3",
    "inst.lunar": `
      <li>Descarga <b>Starseer_1.8.9.zip</b>. No lo descomprimas.</li>
      <li>Abre Lunar o Badlion con la versión <b>1.8.9</b> y entra en <b>Opciones → Paquetes de recursos → Abrir carpeta</b>.</li>
      <li>Mueve el ZIP a esa carpeta (es <code>%APPDATA%\\.minecraft\\resourcepacks</code>).</li>
      <li>Vuelve al juego, pasa el pack a la columna de la derecha y pulsa <b>Listo</b>.</li>
      <li>Para ver el cielo y el cristal conectado, activa en los ajustes del cliente <b>Custom Sky</b>, <b>Connected Textures</b> y <b>Animated Textures</b>.</li>`,
    "inst.optifine": `
      <li>Instala OptiFine para 1.8.9 (sin él, el pack funciona, pero sin cielo personalizado, cristal conectado ni letras de encantamiento animadas).</li>
      <li>Pulsa <kbd>Win</kbd> + <kbd>R</kbd>, escribe <code>%APPDATA%\\.minecraft\\resourcepacks</code> y pulsa <b>Enter</b>.</li>
      <li>Copia ahí <b>Starseer_1.8.9.zip</b>.</li>
      <li>En el juego: <b>Opciones → Paquetes de recursos</b>, activa el pack y pulsa <b>Listo</b>.</li>
      <li>En <b>Opciones → Ajustes de gráficos → Calidad</b>: <b>Connected Textures</b> en <i>Fancy</i> y <b>Custom Sky</b> en <i>ON</i>. En <b>Animaciones</b>, todo en <i>ON</i>.</li>`,
    "inst.modern": `
      <li>Descarga <b>Starseer_26.3.zip</b>.</li>
      <li>Abre <b>Opciones → Paquetes de recursos → Abrir carpeta de paquetes</b> y copia ahí el ZIP.</li>
      <li>Actívalo y pulsa <b>Listo</b>. Esta versión todavía no trae cielo ni cristal conectado.</li>`,
    "inst.trouble": '¿Algo no funciona? Mira la <a href="#/ayuda">ayuda</a>.',
    "help.title": "Ayuda",
    "help.lead": "Las dudas de siempre. Si la tuya no está, pregunta en Discord.",
    "faq.title": "Preguntas",
    "faq.lead": "Respuestas rápidas antes de instalar.",
    "faq.more": "Términos de uso y más ayuda →",
    "help.discordTitle": "¿Sigue sin funcionar? Pregunta en Discord",
    "help.discordText": "Cuéntalo en #install-help o abre un hilo en #bugs con tu versión y cliente. Además, te enterarás antes que nadie de las versiones nuevas.",
    "help.discordBtn": "Unirse al Discord",
    "help.terms": `
      <h2>Términos de uso</h2>
      <ul class="terms">
        <li><b>Sí:</b> usarlo, grabarlo, mostrarlo en videos y directos, y editarlo para ti.</li>
        <li><b>No:</b> resubirlo, venderlo, ponerlo tras acortadores con anuncios ni presentarlo como tuyo.</li>
      </ul>`,
    "sup.title": "Apoya el proyecto",
    "sup.lead": "El pack es y seguirá siendo gratis. Si te ahorra tiempo o te gusta jugar con él, un aporte ayuda a seguir dibujando texturas y portando la versión moderna.",
    "sup.other": "Otras formas de ayudar",
    "sup.otherList": `
      <li>Compártelo con tu equipo o enséñalo en tus videos, con el enlace a esta página.</li>
      <li>Reporta texturas que se vean mal o que te gustaría ver cambiadas.</li>`,
    "foot.updated": "Actualizado el",
    "foot.credit": "La ender pearl está inspirada en el diseño de WantedYew.",
    "foot.legal": "No es un producto oficial de Minecraft. No está aprobado por Mojang ni Microsoft ni asociado a ellos.",
    "viewer.label": "Detalle de la textura",
    "lightbox.label": "Imagen de la galería",
    "close": "Cerrar",
    "thanks.title": "¡Tu descarga empezó!",
    "thanks.text": 'Si no empieza, <a id="thanks-retry" href="#">haz clic aquí</a>. Después sigue los <a href="#/descargar" data-goto="instalar">pasos de instalación</a>.',
    "thanks.support": "<b>¿Te gusta el pack?</b> Considera apoyarnos. Es opcional y ayuda a seguir actualizándolo.",
  };

  const read = () => {
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (q === "es" || q === "en") { localStorage.setItem("lang", q); return q; }
      return localStorage.getItem("lang") || "en";
    } catch { return "en"; }
  };
  const LANG = read() === "es" ? "es" : "en";
  window.LANG = LANG;
  document.documentElement.lang = LANG;

  // La llama app.js antes de tocar el DOM, para que los elementos que reemplaza
  // (p. ej. el enlace de reintento del aviso de descarga) ya estén en su idioma.
  window.applyI18n = function () {
    if (LANG === "es") {
      document.querySelectorAll("[data-i18n]").forEach((n) => {
        const v = ES[n.dataset.i18n];
        if (v != null) n.innerHTML = v;
      });
      document.querySelectorAll("[data-i18n-attr]").forEach((n) => {
        for (const pair of n.dataset.i18nAttr.split(";")) {
          const [attr, key] = pair.split(":");
          if (ES[key] != null) n.setAttribute(attr, ES[key]);
        }
      });
    }
    const btn = document.getElementById("lang");
    if (btn) {
      btn.textContent = LANG === "es" ? "EN" : "ES";
      btn.title = LANG === "es" ? "Switch to English" : "Cambiar a español";
      btn.addEventListener("click", () => {
        try { localStorage.setItem("lang", LANG === "es" ? "en" : "es"); } catch {}
        const url = new URL(location.href);
        if (url.searchParams.has("lang")) {
          url.searchParams.delete("lang");
          location.replace(url.toString());
        } else {
          location.reload();
        }
      });
    }
  };
})();
