export const PSYCHOLOGY_ISLAND_LAYOUT = [
  { id: 'center', x: 0, z: 0, radius: 22.0, elevation: 4.8 },
  { id: 'island-personal', x: -5.0, z: -78.0, radius: 19.0, elevation: 4.4 },
  { id: 'island-01', x: -62.0, z: -35.0, radius: 19.0, elevation: 3.2 },
  { id: 'island-02', x: -68.0, z: 38.0, radius: 20.0, elevation: 2.5 },
  { id: 'island-03', x: -16.0, z: 76.0, radius: 20.5, elevation: 4.4 },
  { id: 'island-04', x: 52.0, z: 62.0, radius: 20.0, elevation: 3.4 },
  { id: 'island-05', x: 78.0, z: 12.0, radius: 21.0, elevation: 2.8 },
  { id: 'island-06', x: 56.0, z: -52.0, radius: 19.5, elevation: 5.0 }
];

export const BRIDGE_STYLES = [
  { id: 'stone', name: '宏偉大理石大道橋', profile: 'arch', arc: 2.0, width: 5.8, color: '#ded7c9' },
  { id: 'grand-stairs', name: '皇家階梯天橋', profile: 'stairs', arc: 0, width: 6.0, color: '#f4e3c4' },
  { id: 'glass', name: '光芒水晶大道橋', profile: 'arch', arc: 1.8, width: 5.6, color: '#d6c8ee' },
  { id: 'covered', name: '宏偉長廊亭橋', profile: 'arch', arc: 0.45, width: 5.8, color: '#cdb4a2' },
  { id: 'lantern-arc', name: '彩虹心靈明燈橋', profile: 'arch', arc: 1.9, width: 5.8, color: '#e7c8b1' },
  { id: 'rope', name: '群島懸索金橋', profile: 'sag', arc: -0.85, width: 5.4, color: '#bfa08a' }
];

export function bridgeRoute(from, to, style) {
  if (!style) return [from, to];
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  const entry = Math.min(length * 0.32, style.landingStart ?? 1.6);
  const exit = Math.min(length * 0.32, style.landingEnd ?? 1.6);
  const ramp = Math.max(0.1, length - entry - exit);
  const count = Math.max(26, Math.ceil(length / 0.55), Math.ceil(Math.abs(to.y - from.y) / 0.12 * length / ramp));
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
  const radius = Math.max(65, 32 / Math.sin(Math.PI / count));
  return [
    { id: 'center', x: 0, z: 0, radius: 19.5, elevation: 4.6 },
    { id: 'island-personal', x: -6.0, z: -92.0, radius: 16.5, elevation: 4.0 },
    ...Array.from({ length: count }, (_, i) => {
      const step = (Math.PI * 2) / count;
      const angle = -2.7 + i * step;
      return {
        id: `island-${String(i + 1).padStart(2, '0')}`,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius * 0.92,
        radius: 16.0 + (i % 3) * 1.0,
        elevation: 1.6 + ((i * 1.6) % 3.6)
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
      width: base.width + variant * 0.08,
      arc: base.arc + (base.profile === 'arch' ? variant * 0.08 : 0)
    };
  });
}

export function connectionsFor(count) {
  const id = i => `island-${String(i + 1).padStart(2, '0')}`;
  // 1. Outer perimeter loop connecting adjacent course islands
  const edges = Array.from({ length: count }, (_, i) => [id(i), id((i + 1) % count)]);
  // 2. Direct radial spoke avenues from Central Academic Acropolis to all islands
  for (let i = 0; i < count; i++) {
    edges.push(['center', id(i)]);
  }
  // 3. Dedicated grand celestial avenues to Personal Island
  edges.push(['center', 'island-personal']);
  edges.push(['island-personal', id(0)]); // to island-01
  edges.push(['island-personal', id(count - 1)]); // to island-06
  return edges;
}
