import * as THREE from "three";

export const WARD_BOUNDS = { minX: -14, maxX: 14, minZ: -11, maxZ: 11 };

export const WARD_ITEM_TYPES = [
  { type: "bed", label: "Hospital Bed" },
  { type: "bedside_cabinet", label: "Bedside Cabinet" },
  { type: "observation_monitor", label: "Observation Monitor" },
  { type: "iv_stand", label: "IV Stand" },
  { type: "curtain", label: "Privacy Curtain" },
  { type: "chair", label: "Chair" },
  { type: "overbed_table", label: "Over-bed Table" },
  { type: "waste_bin", label: "Waste Bin" },
  { type: "sink", label: "Sink" },
];

export const DEFAULT_PATIENTS = {
  A1: { name: "Margaret Thompson", age: 78, pronouns: "she/her", condition: "Post-operative recovery — hip replacement (Day 2)", news2: 2, status: "green", allergies: "Penicillin (severe)", observations: { rr: 16, spo2: 97, sbp: 128, hr: 76, temp: 36.8 }, tasks: ["Hourly observations", "Pain assessment", "Mobilise with physio"] },
  A2: { name: "James Wilson", age: 65, pronouns: "he/him", condition: "Community-acquired pneumonia", news2: 6, status: "amber", allergies: "No known allergies", observations: { rr: 22, spo2: 93, sbp: 110, hr: 95, temp: 38.4 }, tasks: ["IV antibiotics — due 14:00", "Sputum culture", "Increase fluid intake"] },
  A3: { name: "Available Bed", age: null, pronouns: null, condition: "Bed available — prepared for admission", news2: 0, status: "green", allergies: null, observations: null, tasks: ["Bed made and ready", "Awaiting admission"] },
  B1: { name: "Patricia Chen", age: 54, pronouns: "she/her", condition: "Diabetic ketoacidosis — insulin infusion", news2: 8, status: "red", allergies: "Latex", observations: { rr: 24, spo2: 91, sbp: 95, hr: 112, temp: 37.2 }, tasks: ["Insulin infusion review", "Blood glucose hourly", "Fluid balance chart"] },
  B2: { name: "Robert Davies", age: 71, pronouns: "he/him", condition: "C. difficile infection — isolation precautions", news2: 4, status: "purple", allergies: "No known allergies", observations: { rr: 18, spo2: 96, sbp: 118, hr: 82, temp: 37.6 }, tasks: ["Stool chart", "Fluid balance", "Infection control precautions"] },
  B3: { name: "Available Bed", age: null, pronouns: null, condition: "Bed available — prepared for admission", news2: 0, status: "green", allergies: null, observations: null, tasks: ["Bed made and ready", "Awaiting admission"] },
};

export const STATUS_CONFIG = {
  green: { label: "Stable", bg: "bg-clinical-green/10", text: "text-clinical-green", border: "border-clinical-green/30", dot: "bg-clinical-green", hex: 0x4caf50 },
  amber: { label: "Requires Attention", bg: "bg-clinical-amber/10", text: "text-clinical-amber", border: "border-clinical-amber/30", dot: "bg-clinical-amber", hex: 0xff9800 },
  red: { label: "Urgent", bg: "bg-clinical-red/10", text: "text-clinical-red", border: "border-clinical-red/30", dot: "bg-clinical-red", hex: 0xf44336 },
  purple: { label: "Isolation", bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/30", dot: "bg-purple-500", hex: 0x9c27b0 },
};

export function generateDefaultItems() {
  const items = [];
  let c = 0;
  const id = () => `item_default_${c++}`;
  [-5, 0, 5].forEach((z, i) => {
    const n = i + 1;
    items.push({ id: id(), type: "bed", x: -10, z, rotationY: -Math.PI / 2, designation: `A${n}` });
    items.push({ id: id(), type: "bedside_cabinet", x: -8, z: z + 0.8, rotationY: 0 });
    items.push({ id: id(), type: "observation_monitor", x: -12, z: z + 0.8, rotationY: 0 });
    items.push({ id: id(), type: "overbed_table", x: -8.5, z: z - 0.5, rotationY: 0 });
    items.push({ id: id(), type: "bed", x: 10, z, rotationY: Math.PI / 2, designation: `B${n}` });
    items.push({ id: id(), type: "bedside_cabinet", x: 8, z: z + 0.8, rotationY: 0 });
    items.push({ id: id(), type: "observation_monitor", x: 12, z: z + 0.8, rotationY: Math.PI });
    items.push({ id: id(), type: "overbed_table", x: 8.5, z: z - 0.5, rotationY: 0 });
  });
  items.push({ id: id(), type: "curtain", x: -9, z: -2.5, rotationY: Math.PI / 2 });
  items.push({ id: id(), type: "curtain", x: -9, z: 2.5, rotationY: Math.PI / 2 });
  items.push({ id: id(), type: "curtain", x: 9, z: -2.5, rotationY: Math.PI / 2 });
  items.push({ id: id(), type: "curtain", x: 9, z: 2.5, rotationY: Math.PI / 2 });
  items.push({ id: id(), type: "iv_stand", x: -11, z: -6, rotationY: 0 });
  items.push({ id: id(), type: "iv_stand", x: 11, z: 1, rotationY: 0 });
  items.push({ id: id(), type: "chair", x: -7, z: -4, rotationY: -Math.PI / 2 });
  items.push({ id: id(), type: "chair", x: 7, z: 4, rotationY: Math.PI / 2 });
  items.push({ id: id(), type: "waste_bin", x: -7, z: 9, rotationY: 0 });
  items.push({ id: id(), type: "waste_bin", x: 7, z: 9, rotationY: 0 });
  items.push({ id: id(), type: "sink", x: -12, z: 9, rotationY: 0 });
  return items;
}

export function getItemLabel(item) {
  if (item.designation) return `${item.designation}`;
  const t = WARD_ITEM_TYPES.find(t => t.type === item.type);
  return t?.label || item.type;
}

export function checkCollision(itemId, x, z, items, minDist = 1.5) {
  return items.some(item =>
    item.id !== itemId &&
    Math.abs(item.x - x) < minDist &&
    Math.abs(item.z - z) < minDist
  );
}

export function clampToBounds(x, z) {
  return {
    x: Math.max(WARD_BOUNDS.minX, Math.min(WARD_BOUNDS.maxX, x)),
    z: Math.max(WARD_BOUNDS.minZ, Math.min(WARD_BOUNDS.maxZ, z)),
  };
}

export function createTextTexture(text, w = 128, h = 48, color = "#1a2b4a", bg = "transparent") {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.6)}px Arial`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(c);
}

const M = {
  bedFrame: new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.4, metalness: 0.6 }),
  mattress: new THREE.MeshStandardMaterial({ color: 0xf5f8fb, roughness: 0.8 }),
  duvet: new THREE.MeshStandardMaterial({ color: 0xd6e4f0, roughness: 0.7 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
  rail: new THREE.MeshStandardMaterial({ color: 0x6a7a8a, roughness: 0.3, metalness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 }),
  cabinet: new THREE.MeshStandardMaterial({ color: 0xe0e4ea, roughness: 0.5, metalness: 0.2 }),
  cabinetTop: new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.3 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x1a2b4a, emissive: 0x1a3a5a, emissiveIntensity: 0.3 }),
  screenGreen: new THREE.MeshStandardMaterial({ color: 0x2a5a3a, emissive: 0x4caf50, emissiveIntensity: 0.4 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xc4d0de, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide }),
  wood: new THREE.MeshStandardMaterial({ color: 0xc8c5be, roughness: 0.5, metalness: 0.2 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xeef2f5, roughness: 0.2 }),
};

export function createWardItem(type, options = {}) {
  switch (type) {
    case "bed": return createBed(options.designation);
    case "bedside_cabinet": return createCabinet();
    case "observation_monitor": return createMonitor();
    case "iv_stand": return createIVStand();
    case "curtain": return createCurtain();
    case "chair": return createChair();
    case "overbed_table": return createOverbedTable();
    case "waste_bin": return createWasteBin();
    case "sink": return createSink();
    default: return new THREE.Group();
  }
}

function createBed(designation) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 2.4), M.bedFrame);
  frame.position.y = 0.5; frame.castShadow = true; g.add(frame);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.15, 2.2), M.mattress);
  mattress.position.y = 0.75; g.add(mattress);
  const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.4), M.duvet);
  duvet.position.set(0, 0.85, 0.3); g.add(duvet);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.5), M.pillow);
  pillow.position.set(0, 0.86, -0.8); g.add(pillow);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.9, 0.08), M.bedFrame);
  hb.position.set(0, 0.9, -1.2); g.add(hb);
  [-0.9, 0.9].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 2), M.rail);
    rail.position.set(x, 0.85, 0); g.add(rail);
  });
  if (designation) {
    const tex = createTextTexture(designation, 128, 48, "#1a2b4a", "#ffffff");
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), new THREE.MeshBasicMaterial({ map: tex }));
    label.position.set(0, 1.35, -1.19); g.add(label);
  }
  return g;
}

function createCabinet() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), M.cabinet);
  body.position.y = 0.35; body.castShadow = true; g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.55), M.cabinetTop);
  top.position.y = 0.72; g.add(top);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), M.metal);
  handle.position.set(0, 0.5, 0.26); g.add(handle);
  return g;
}

function createMonitor() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), M.metal);
  stand.position.y = 0.7; g.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), M.metal);
  base.position.y = 0.02; g.add(base);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.04), M.screen);
  screen.position.set(0, 1.5, 0); g.add(screen);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), M.screenGreen);
  display.position.set(0, 1.5, 0.025); g.add(display);
  return g;
}

function createIVStand() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 8), M.metal);
  pole.position.y = 0.9; g.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 16), M.metal);
  base.position.y = 0.02; g.add(base);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI), M.metal);
  hook.position.set(0, 1.8, 0); hook.rotation.x = Math.PI / 2; g.add(hook);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.06), new THREE.MeshStandardMaterial({ color: 0xddeeff, transparent: true, opacity: 0.6 }));
  bag.position.set(0, 1.65, 0); g.add(bag);
  return g;
}

function createCurtain() {
  const g = new THREE.Group();
  const h = 2.2, w = 3;
  const track = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.04), M.metal);
  track.position.set(0, h + 0.1, 0); g.add(track);
  const c1 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.curtain);
  c1.position.set(0, h / 2, 0); g.add(c1);
  [-w/2 + 0.1, w/2 - 0.1].forEach(x => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 6), M.metal);
    p.position.set(x, h / 2, 0); g.add(p);
  });
  return g;
}

function createChair() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.55), M.wood);
  seat.position.y = 0.45; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), M.wood);
  back.position.set(0, 0.72, -0.24); g.add(back);
  [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.05), M.wood);
    leg.position.set(x, 0.22, z); g.add(leg);
  });
  return g;
}

function createOverbedTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), M.cabinetTop);
  top.position.y = 0.85; top.castShadow = true; g.add(top);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), M.metal);
  pole.position.set(0.25, 0.42, 0); g.add(pole);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), M.metal);
  base.position.set(0.25, 0.02, 0); g.add(base);
  return g;
}

function createWasteBin() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.75, 16), M.yellow);
  body.position.y = 0.38; body.castShadow = true; g.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16), M.yellow);
  lid.position.y = 0.78; g.add(lid);
  return g;
}

function createSink() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.45), M.metal);
  stand.position.y = 0.4; g.add(stand);
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.5), M.porcelain);
  basin.position.y = 0.86; g.add(basin);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), M.metal);
  faucet.position.set(0, 1.05, -0.15); g.add(faucet);
  return g;
}