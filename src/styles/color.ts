// src/styles/color.ts
type RGB = { r: number; g: number; b: number; a?: number };

const clamp0_255 = (n: number) => Math.max(0, Math.min(255, n));

const parseHex = (hex: string): RGB => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b, a: 1 };
};

const parseRgba = (val: string): RGB | null => {
  const m = val
    .replace(/\s+/g, '')
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)$/i);
  if (!m) return null;
  const [, rs, gs, bs, as] = m;
  return {
    r: Number(rs),
    g: Number(gs),
    b: Number(bs),
    a: as !== undefined ? Number(as) : 1,
  };
};

const parseColor = (c: string): RGB => {
  if (!c) return { r: 0, g: 0, b: 0, a: 1 };
  if (c.startsWith('#')) return parseHex(c);
  const rgba = parseRgba(c);
  if (rgba) return rgba;
  // フォールバック: 未対応表記は黒
  return { r: 0, g: 0, b: 0, a: 1 };
};

/** 前景 rgba を背景 rgb(#) の上に合成して不透明色（rgb）を返す */
export const compositeOver = (foreground: string, background: string): string => {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  const a = fg.a ?? 1;
  const r = clamp0_255(Math.round(fg.r * a + bg.r * (1 - a)));
  const g = clamp0_255(Math.round(fg.g * a + bg.g * (1 - a)));
  const b = clamp0_255(Math.round(fg.b * a + bg.b * (1 - a)));
  return `rgb(${r}, ${g}, ${b})`; // 不透明色を返す
};

/** 半透明の surface を不透明に正規化 */
export const solidSurfaceFromTheme = (cellBackgroundColor: string, backgroundColor: string) => {
  // rgba でなければそのまま
  if (!/^rgba/i.test(cellBackgroundColor)) return cellBackgroundColor;
  return compositeOver(cellBackgroundColor, backgroundColor);
};
