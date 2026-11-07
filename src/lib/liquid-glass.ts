/**
 * Builds the displacement map used by the liquid-glass SVG filter, scaled to any element size.
 * Matches the original 420×280 / 52px-radius map: 5% inset, inner radius = radius − inset.
 */
export function displacementMap(w: number, h: number, radius: number): string {
  const r = Math.min(radius, w / 2, h / 2);
  const inset = Math.max(3, Math.round(Math.min(w, h) * 0.05));
  const rx = Math.max(0, r - inset);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="Y" x1="0" x2="0" y1="3%" y2="97%"><stop offset="0%" stop-color="#0F0"/><stop offset="100%" stop-color="#000"/></linearGradient><linearGradient id="X" x1="2%" x2="98%" y1="0" y2="0"><stop offset="0%" stop-color="#F00"/><stop offset="100%" stop-color="#000"/></linearGradient></defs><rect width="${w}" height="${h}" fill="#808080"/><g filter="blur(2px)"><rect width="${w}" height="${h}" fill="#000080"/><rect width="${w}" height="${h}" fill="url(#Y)" style="mix-blend-mode:screen"/><rect width="${w}" height="${h}" fill="url(#X)" style="mix-blend-mode:screen"/><rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${rx}" ry="${rx}" fill="#808080" filter="blur(${inset}px)"/></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Refraction strength: 144 at 280px tall in the original, scaled with the shorter side. */
export function displacementScale(w: number, h: number): number {
  return Math.round(Math.min(w, h) * (144 / 280));
}
