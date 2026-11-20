// Datos editables a mano. Lo generado (descargas, texturas, galería) está en data.js.
// Los textos van en los dos idiomas: { en: "...", es: "..." }.
window.SITE_CONFIG = {
  name: "Starseer",
  tagline: {
    en: "A Bedwars texture pack: clean, readable and with a cosmic sky.",
    es: "Texture pack de Bedwars: limpio, legible y con un cielo cósmico.",
  },
  // Enlaces de apoyo y comunidad. Los que queden vacíos no se muestran.
  support: [
    { id: "kofi", label: "Ko-fi", url: "https://ko-fi.com/charlie520", desc: { en: "A one-off coffee, no account needed.", es: "Un café puntual, sin cuenta." } },
  ],
  community: [
    { label: "Discord", url: "https://discord.gg/KKZrs9uh6w" },
    { label: "YouTube", url: "" },
    { label: "TikTok", url: "" },
  ],
  // Historial de versiones, la más reciente primero. Al publicar una versión, añádela
  // arriba: quien descargó una anterior verá estas novedades en la página de descarga.
  changelog: [
    {
      version: "1.0.0",
      date: "2026-11-19",
      items: {
        en: ["First public release: 317 reworked textures and 41 animations.",
          "Cosmic sky (OptiFine Custom Sky) and connected glass in every colour.",
          "Animated resources, clean HUD, readable team wool and clay.",
          "Armour, tools and menus matched to the pack's palette."],
        es: ["Primera versión pública: 317 texturas rehechas y 41 animaciones.",
          "Cielo cósmico (Custom Sky de OptiFine) y cristal conectado en todos los colores.",
          "Recursos animados, HUD limpio, lana y arcilla de equipo legibles.",
          "Armaduras, herramientas y menús a juego con la paleta del pack."],
      },
    },
  ],
};
