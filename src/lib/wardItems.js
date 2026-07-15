import * as THREE from "three";

export const WARD_BOUNDS = { minX: -25, maxX: 25, minZ: -8, maxZ: 8 };
export const SUITE_OFFSET_A = { x: -15, z: 0 };
export const SUITE_OFFSET_B = { x: 15, z: 0 };

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
  A4: { name: "Dorothy Clarke", age: 69, pronouns: "she/her", condition: "Post-operative — cholecystectomy (Day 1)", news2: 3, status: "green", allergies: "No known allergies", observations: { rr: 15, spo2: 98, sbp: 125, hr: 72, temp: 36.9 }, tasks: ["Pain assessment", "Wound site check", "Fluid balance"] },
  B1: { name: "Patricia Chen", age: 54, pronouns: "she/her", condition: "Diabetic ketoacidosis — insulin infusion", news2: 8, status: "red", allergies: "Latex", observations: { rr: 24, spo2: 91, sbp: 95, hr: 112, temp: 37.2 }, tasks: ["Insulin infusion review", "Blood glucose hourly", "Fluid balance chart"] },
  B2: { name: "Robert Davies", age: 71, pronouns: "he/him", condition: "C. difficile infection — isolation precautions", news2: 4, status: "purple", allergies: "No known allergies", observations: { rr: 18, spo2: 96, sbp: 118, hr: 82, temp: 37.6 }, tasks: ["Stool chart", "Fluid balance", "Infection control precautions"] },
  B3: { name: "Available Bed", age: null, pronouns: null, condition: "Bed available — prepared for admission", news2: 0, status: "green", allergies: null, observations: null, tasks: ["Bed made and ready", "Awaiting admission"] },
  B4: { name: "Michael Brennan", age: 62, pronouns: "he/him", condition: "Acute pancreatitis — conservative management", news2: 5, status: "amber", allergies: "Codeine", observations: { rr: 20, spo2: 95, sbp: 105, hr: 88, temp: 38.1 }, tasks: ["NBM status review", "IV fluid assessment", "Pain score"] },
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
  const suiteConfigs = [
    { prefix: "A", offset: -15 },
    { prefix: "B", offset: 15 },
  ];
  suiteConfigs.forEach(({ prefix, offset }) => {
    const bedPositions = [
      { x: -4, z: -3, num: 1 },
      { x: 1, z: -3, num: 2 },
      { x: -4, z: 3, num: 3 },
      { x: 1, z: 3, num: 4 },
    ];
    bedPositions.forEach(({ x, z, num }) => {
      items.push({ id: id(), type: "bed", x: offset + x, z, rotationY: 0, designation: `${prefix}${num}` });
      items.push({ id: id(), type: "bedside_cabinet", x: offset + x + 1.8, z: z + 0.3, rotationY: 0 });
      items.push({ id: id(), type: "observation_monitor", x: offset + x - 1.8, z: z + 0.3, rotationY: 0 });
    });
    items.push({ id: id(), type: "curtain", x: offset - 1.5, z: 0, rotationY: 0 });
    items.push({ id: id(), type: "curtain", x: offset + 2.5, z: 0, rotationY: 0 });
    items.push({ id: id(), type: "iv_stand", x: offset - 5, z: -4, rotationY: 0 });
    items.push({ id: id(), type: "chair", x: offset - 2, z: -4.5, rotationY: Math.PI });
    items.push({ id: id(), type: "waste_bin", x: offset - 5, z: 6, rotationY: 0 });
  });
  return items;
}

export function getItemLabel(item) {
  if (item.designation) return item.designation;
  const t = WARD_ITEM_TYPES.find(t => t.type === item.type);
  return t?.label || item.type;
}

export function checkCollision(itemId, x, z, items, minDist = 1.5) {
  return items.some(item => item.id !== itemId && Math.abs(item.x - x) < minDist && Math.abs(item.z - z) < minDist);
}

export function clampToBounds(x, z) {
  return { x: Math.max(WARD_BOUNDS.minX, Math.min(WARD_BOUNDS.maxX, x)), z: Math.max(WARD_BOUNDS.minZ, Math.min(WARD_BOUNDS.maxZ, z)) };
}

export function createTextTexture(text, w = 128, h = 48, color = "#2C3E50", bg = "transparent") {
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

// Colors matched to reference image
const M = {
  bedFrame: new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.4, metalness: 0.3 }),
  mattress: new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.8 }),
  duvet: new THREE.MeshStandardMaterial({ color: 0xC8E6C9, roughness: 0.7 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xD8D8D8, roughness: 0.3, metalness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3 }),
  cabinet: new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.5, metalness: 0.1 }),
  cabinetTop: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 }),
  screenBody: new THREE.MeshStandardMaterial({ color: 0x2C3E50, roughness: 0.4 }),
  screenAlert: new THREE.MeshStandardMaterial({ color: 0xFFD6D6, emissive: 0xFFD6D6, emissiveIntensity: 0.5 }),
  screenNormal: new THREE.MeshStandardMaterial({ color: 0xD6F5D6, emissive: 0x88DD88, emissiveIntensity: 0.3 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xF8F6F0, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide }),
  wood: new THREE.MeshStandardMaterial({ color: 0xC8C5BE, roughness: 0.5, metalness: 0.2 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.6 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.2 }),
};

export function createWardItem(type, options = {}) {
  switch (type) {
    case "bed": return createBed(options.designation);
    case "bedside_cabinet": return createCabinet();
    case "observation_monitor": return createMonitor(options.alert);
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
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 0.08), M.bedFrame);
  hb.position.set(0, 0.8, -1.2); g.add(hb);
  [-0.9, 0.9].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 2), M.rail);
    rail.position.set(x, 0.82, 0); g.add(rail);
  });
  if (designation) {
    const tex = createTextTexture(designation, 128, 48, "#2C3E50", "#FFFFFF");
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), new THREE.MeshBasicMaterial({ map: tex }));
    label.position.set(0, 1.2, -1.19); g.add(label);
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

function createMonitor(alert = false) {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), M.metal);
  stand.position.y = 0.7; g.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), M.metal);
  base.position.y = 0.02; g.add(base);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.04), M.screenBody);
  screen.position.set(0, 1.5, 0); g.add(screen);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), alert ? M.screenAlert : M.screenNormal);
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