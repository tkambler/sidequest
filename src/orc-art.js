/** Horned orc archer: green skin, iron armor, boots, and a bow instead of an axe. */
export function orcSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42" shape-rendering="crispEdges" aria-hidden="true">
    <path fill="#92985b" d="M10 1h2v5h3v2h-5zm16 0h2v7h-5V6h3z"/>
    <path fill="#b2b57b" d="M10 1h1v4h-1zm17 0h1v4h-1z"/>
    <path fill="#40483d" d="M14 6h10v2h2v7h-2v3H13v-3h-2V8h3z"/>
    <path fill="#787f68" d="M14 7h9v3h-9z"/>
    <path fill="#4e8c38" d="M13 11h11v7h-2v3h-8v-2h-2v-5h1z"/>
    <path fill="#6da248" d="M13 13h3v5h4v2h-6v-2h-2v-3h1z"/>
    <path fill="#c5932a" d="M14 11h2v2h-2zm6 0h2v2h-2z"/>
    <path fill="#e5d441" d="M14 14h2v2h-2zm6 0h2v2h-2z"/>
    <path fill="#a6bd55" d="M16 17h5v2h-5z"/><path fill="#f1df9d" d="M16 17h1v2h-1zm4 0h1v2h-1z"/>
    <path fill="#557f39" d="M10 20h16v3h2v7h-3v3H10v-3H8v-7h2z"/>
    <path fill="#737b70" d="M10 20h5v-1h8v1h3v11H10z"/>
    <path fill="#93978b" d="M12 21h10v8H12z"/>
    <path fill="#7b8175" d="M15 23h5v1h2v3h-2v1h-5v-2h-2v-2h2z"/>
    <path fill="#b0b2a4" d="M13 22h1v1h-1zm8 0h1v1h-1zm-9 6h2v1h-2z"/>
    <path fill="#3c702c" d="M8 23h2v7H8zm18 0h2v6h-2z"/>
    <path fill="#68a044" d="M7 25h2v6H7zm19-2h2v4h-2z"/>
    <path fill="#424b3c" d="M7 30h3v3H7zm18-2h3v3h-3z"/>
    <path fill="#6e5b32" d="M10 31h16v2H10z"/><path fill="#aaa164" d="M17 31h3v2h-3z"/>
    <g class="orc-leg leg-a"><path fill="#424d59" d="M11 33h6v4h-1v4h1v1h-7v-2h1z"/><path fill="#25302a" d="M10 40h7v2h-7z"/></g>
    <g class="orc-leg leg-b"><path fill="#515d68" d="M21 33h5v7h2v2h-7z"/><path fill="#303629" d="M21 40h7v2h-7z"/></g>
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
