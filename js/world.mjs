export const PSYCHOLOGY_ISLAND_LAYOUT = [
  { id: 'center', x: 0, z: 0, radius: 11.2, elevation: 3.6 },
  { id: 'island-01', x: -36.0, z: -18.0, radius: 9.0, elevation: 2.0 },
  { id: 'island-02', x: -38.0, z: 22.0, radius: 9.6, elevation: 1.2 },
  { id: 'island-03', x: -10.0, z: 44.0, radius: 10.0, elevation: 3.4 },
  { id: 'island-04', x: 26.0, z: 38.0, radius: 9.4, elevation: 2.2 },
  { id: 'island-05', x: 44.0, z: 6.0, radius: 10.4, elevation: 1.4 },
  { id: 'island-06', x: 28.0, z: -28.0, radius: 9.2, elevation: 4.2 }
];

export const BRIDGE_STYLES = [
  { id: 'stone', name: '大理石拱橋', profile: 'arch', arc: 1.1, width: 2.0, color: '#ded7c9' },
  { id: 'grand-stairs', name: '宏偉階梯長橋', profile: 'stairs', arc: 0, width: 2.1, color: '#f4e3c4' },
  { id: 'glass', name: '晶瑩水晶拱橋', profile: 'arch', arc: 0.95, width: 1.85, color: '#d6c8ee' },
  { id: 'covered', name: '長廊亭橋', profile: 'arch', arc: 0.2, width: 1.9, color: '#cdb4a2' },
  { id: 'lantern-arc', name: '明燈彩虹拱橋', profile: 'arch', arc: 0.85, width: 1.95, color: '#e7c8b1' },
  { id: 'rope', name: '索道吊橋', profile: 'sag', arc: -0.5, width: 1.8, color: '#bfa08a' }
];

export function bridgeRoute(from, to, style) {
  if (!style) return [from, to];
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  const entry = Math.min(length * 0.35, style.landingStart ?? 0.85);
  const exit = Math.min(length * 0.35, style.landingEnd ?? 0.85);
  const ramp = Math.max(0.1, length - entry - exit);
  const count = Math.max(20, Math.ceil(length / 0.45), Math.ceil(Math.abs(to.y - from.y) / 0.12 * length / ramp));
  const start = entry / length;
  const end = 1 - exit / length;
  const ts = [start, end, 1];
  for (let i = 1; i < count; i++) ts.push(i / count);
  const times = [...new Set(ts.map(t => Number(t.toFixed(10))))].sort((a, b) => a - b);
  const points = [{ ...from }];

  for (const t of times) {
    const u = Math.max(0, Math.min(1, (t - start) / (end - start)));
    const x = from.x + (to.x - from.x) * t;
    const z = from.z + (to.z - from.z) * t;
    const y = from.y + (to.y - from.y) * u + Math.sin(u * Math.PI) * (style.arc || 0);

    if (style.profile === 'stairs') {
      points.push({ x, y: points.at(-1).y, z });
      if (Math.abs(y - points.at(-1).y) > 1e-8) points.push({ x, y, z });
    } else {
      points.push({ x, y, z });
    }
  }
  points[points.length - 1] = { ...to };
  return points;
}

export function layoutFor(count) {
  if (count === 6) {
    return PSYCHOLOGY_ISLAND_LAYOUT;
  }
  const radius = Math.max(40, 20 / Math.sin(Math.PI / count));
  return [
    { id: 'center', x: 0, z: 0, radius: 11.2, elevation: 3.6 },
    ...Array.from({ length: count }, (_, i) => {
      const step = (Math.PI * 2) / count;
      const angle = -2.7 + i * step;
      return {
        id: `island-${String(i + 1).padStart(2, '0')}`,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius * 0.92,
        radius: 9.0 + (i % 3) * 0.6,
        elevation: 0.8 + ((i * 1.6) % 3.6)
      };
    })
  ];
}

export function bridgeStylesFor(count) {
  return Array.from({ length: count }, (_, i) => {
    const base = BRIDGE_STYLES[i % BRIDGE_STYLES.length];
    const variant = Math.floor(i / BRIDGE_STYLES.length);
    return {
      ...base,
      family: base.id,
      id: variant ? `${base.id}-${variant + 1}` : base.id,
      name: variant ? `${base.name} · ${variant + 1}` : base.name,
      variant,
      width: base.width + variant * 0.05,
      arc: base.arc + (base.profile === 'arch' ? variant * 0.05 : 0)
    };
  });
}

export function connectionsFor(count) {
  const id = i => `island-${String(i + 1).padStart(2, '0')}`;
  // Outer perimeter loop
  const edges = Array.from({ length: count }, (_, i) => [id(i), id((i + 1) % count)]);
  // Direct radial spoke avenues from Central Academic Acropolis to all islands
  for (let i = 0; i < count; i++) {
    edges.push(['center', id(i)]);
  }
  return edges;
}
