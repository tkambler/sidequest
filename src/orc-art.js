/** Tall, horned orc archer in a coarse pixel grid: iron plate, green skin, and a bow. */
export function orcSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42" shape-rendering="crispEdges" aria-hidden="true">
    <!-- Upright olive horns and a flat, stepped iron helmet. -->
    <path fill="#94985f" d="M12 0h2v4h2v1h-4zm12 4h2V0h2v5h-4z"/>
    <path fill="#b0b17d" d="M12 0h1v3h-1zm14 0h1v3h-1z"/>
    <path fill="#484a40" d="M15 4h10v4h1v8h-3V9h-8z"/>
    <path fill="#77796a" d="M15 4h9v2h-2v2h-7z"/>
    <path fill="#8b8c77" d="M15 4h5v1h-1v1h-2v1h-2z"/>
    <!-- Narrow face, heavy brow, square yellow eyes, and a broad lower jaw. -->
    <path fill="#3f813a" d="M14 8h9v3h1v5h-2v2h-7v-2h-1z"/>
    <path fill="#5b9c44" d="M14 9h4v4h-1v3h5v1h-7v-2h-1z"/>
    <path fill="#738743" d="M15 8h2v2h-2zm5 0h2v2h-2z"/>
    <path fill="#e0cc32" d="M14 11h2v2h-2zm6 0h2v2h-2z"/>
    <path fill="#68943f" d="M17 12h2v3h-2z"/>
    <path fill="#315d30" d="M17 16h5v1h-5z"/>
    <!-- Long exposed arms frame a plain, broad breastplate. -->
    <path fill="#3d803b" d="M12 17h2v3h-2v7h-1v2H9v-2h1v-7h2zm14 0h2v3h2v9h-2v-8h-2z"/>
    <path fill="#67ae50" d="M11 18h2v3h-2zm-1 4h1v5h-1zm18-2h1v7h-1z"/>
    <path fill="#8c8d82" d="M14 15h3v2h5v-2h3v2h2v12H13V18h1z"/>
    <path fill="#a1a296" d="M14 18h10v10H14z"/>
    <path fill="#777b71" d="M14 17h3v2h-3zm8 0h3v2h-3zm-8 3h4v1h-4zm8 0h3v1h-3z"/>
    <path fill="#b0b0a1" d="M19 18h3v1h-3zm-5 4h1v5h-1z"/>
    <path fill="#92958a" d="M17 23h7v5h-7z"/>
    <path fill="#73786f" d="M25 19h2v10h-2z"/>
    <path fill="#484c3d" d="M9 28h3v2H9zm19 0h2v2h-2z"/>
    <path fill="#6b5d33" d="M13 29h14v2H13z"/>
    <path fill="#969064" d="M19 29h2v1h-2z"/>
    <!-- Slim, separated legs with small olive boot soles. -->
    <g class="orc-leg leg-a">
      <path fill="#404d59" d="M14 31h6v3h-4v7h-2z"/>
      <path fill="#56636d" d="M14 31h6v1h-4v3h-2z"/>
      <path fill="#535536" d="M14 40h2v2h-2z"/>
    </g>
    <g class="orc-leg leg-b">
      <path fill="#47545f" d="M21 31h6v11h-2v-8h-4z"/>
      <path fill="#63707a" d="M22 32h4v1h-4z"/>
      <path fill="#737044" d="M25 40h2v2h-2z"/>
    </g>
    <g class="bow">
      <path fill="#715031" d="M29 12h3v3h2v4h1v8h-1v4h-2v3h-3v-2h2v-4h1V18h-1v-3h-2z"/>
      <path fill="#b28b4b" d="M30 13h1v3h2v4h1v6h-1v4h-2v3h-1v-2h1v-4h1v-8h-1v-3h-1z"/>
      <path class="bow-string" d="M29 13L20 23L29 33" fill="none" stroke="#e4d5a3" stroke-width=".8"/>
      <path fill="#d9b673" d="M19 22h17v1H19z"/><path fill="#554931" d="M19 23h17v1H19z"/>
      <path fill="#b75f25" d="M35 20l4 3-4 3v-2h-3v-2h3z"/>
      <path fill="#e3ad31" d="M35 22h3v2h-3z"/>
      <path fill="#72a244" d="M18 22h3v3h-3z"/>
    </g>
  </svg>`;
}

export function flameSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 14" shape-rendering="crispEdges" aria-hidden="true"><path fill="#c34b22" d="M4 0h2v4h2V3h1v5h1v4H8v2H2v-2H0V8h2V5h2z"/><path fill="#ef8528" d="M4 4h2v3h2v5H7v1H3v-1H2V8h2z"/><path fill="#f6c64c" d="M4 8h2v2h1v3H3v-3h1z"/><path fill="#fff0a3" d="M4 11h2v2H4z"/></svg>`;
}

export function arrowSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="#d3b67a" d="M2 5h17v2H2z"/><path fill="#807158" d="M1 3h3v2h2v1H3v2H1V6H0V5h1z"/><path class="arrow-flame" fill="#d55823" d="M17 4V2h2v2h2V3h1v3h2v3h-2v2h-3V9h-2z"/><path fill="#f5a932" d="M19 5h2v2h2v2h-4z"/><path fill="#ffe28b" d="M20 6h1v3h-1z"/></svg>`;
}
