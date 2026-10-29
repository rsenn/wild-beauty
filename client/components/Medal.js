// The medal for a perfect landing from the flyby (GALLERY.md, the running gag): a gold disc with a
// star and spread wings on a ribbon, drawn as SVG. The colours are the metal's own, not the theme's.
import { html } from '../html.js';

const feather = 'M52 99 C44 95 33 95 22 102 C33 101 41 103 48 108 Z';
const wing = html`
  <g>
    <path d=${feather} />
    <path d=${feather} transform="translate(2 -8) scale(0.92) translate(3 8)" />
    <path d=${feather} transform="translate(5 -16) scale(0.82) translate(8 16)" />
  </g>`;

export const MedalGraphic = () => html`
  <svg class="wb-medal-graphic" viewBox="0 0 120 164" role="img" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="wb-medal-gold" cx="38%" cy="32%" r="80%">
        <stop offset="0" stop-color="#fff3b0" />
        <stop offset="0.45" stop-color="#f1c232" />
        <stop offset="1" stop-color="#9a6a10" />
      </radialGradient>
      <linearGradient id="wb-medal-shine" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0" />
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.85" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <clipPath id="wb-medal-clip"><circle cx="60" cy="100" r="40" /></clipPath>
    </defs>
    <path d="M30 0 H57 L73 66 H46 Z" fill="#a0283a" />
    <path d="M90 0 H63 L47 66 H74 Z" fill="#7d1c2b" />
    <path d="M40 0 H44 L58 66 H54 Z M76 0 H80 L66 66 H62 Z" fill="#f0e6d2" />
    <circle cx="60" cy="100" r="40" fill="url(#wb-medal-gold)" stroke="#7a520c" stroke-width="3" />
    <circle cx="60" cy="100" r="33" fill="none" stroke="#fff3b0" stroke-width="1.5" stroke-opacity="0.8" />
    <g fill="#7a520c" fill-opacity="0.9" stroke="#fff3b0" stroke-width="0.6">${wing}<g transform="translate(120 0) scale(-1 1)">${wing}</g></g>
    <path d="M60 85 L64.4 94.6 L74.8 95.8 L67.1 102.9 L69.2 113.2 L60 108 L50.8 113.2 L52.9 102.9 L45.2 95.8 L55.6 94.6 Z" fill="#fff3b0" stroke="#7a520c" stroke-width="1.5" stroke-linejoin="round" />
    <g clip-path="url(#wb-medal-clip)"><rect class="wb-medal-shine" x="-10" y="55" width="30" height="90" fill="url(#wb-medal-shine)" transform="skewX(-20)" /></g>
  </svg>`;

// the medal with its words; a tap puts it away
export const Medal = ({ label, onClose }) => html`
  <div class="wb-gallery-medal" role="status" onClick=${onClose}>
    <${MedalGraphic} />
    <p>${label}</p>
  </div>`;
