import * as THREE from "three";

export const WARD_BOUNDS = { minX: -45, maxX: 45, minZ: -10, maxZ: 35 };
export const SUITE_OFFSET_A = { x: -30, z: 0 };
export const SUITE_OFFSET_B = { x: 0, z: 0 };
export const SUITE_OFFSET_C = { x: 30, z: 0 };
export const SUITE_OFFSET_D = { x: 0, z: 25 };
export const SUITE_OFFSETS = { A: SUITE_OFFSET_A, B: SUITE_OFFSET_B, C: SUITE_OFFSET_C, D: SUITE_OFFSET_D };
export const SUITE_LABELS = { A: "Clinical Suite A", B: "Clinical Suite B", C: "Clinical Skills Room", D: "Health Theory 101" };

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
  { type: "nurses_station", label: "Nurses' Station" },
  { type: "tv", label: "Wall TV / Screen" },
  { type: "table", label: "Table" },
  { type: "wall_cabinet", label: "Wall Cabinet Unit" },
];

export const DEFAULT_PATIENTS = {
  A1: { name: "Margaret Thompson", age: 78, pronouns: "she/her", condition: "Post-operative recovery — hip replacement (Day 2)", news2: 2, status: "green", allergies: "Penicillin (severe)", observations: { rr: 16, spo2: 97, sbp: 128, hr: 76, temp: 36.8 }, tasks: ["Hourly observations", "Pain assessment", "Mobilise with physio"] },
  A2: { name: "James Wilson", age: 65, pronouns: "he/him", condition: "Community-acquired pneumonia", news2: 6, status: "amber", allergies: "No known allergies", observations: { rr: 22, spo2: 93, sbp: 110, hr: 95, temp: 38.4 }, tasks: ["IV antibiotics — due 14:00", "Sputum culture", "Increase fluid intake"] },
  A3: { name: "Dorothy Clarke", age: 69, pronouns: "she/her", condition: "Post-operative — cholecystectomy (Day 1)", news2: 3, status: "green", allergies: "No known allergies", observations: { rr: 15, spo2: 98, sbp: 125, hr: 72, temp: 36.9 }, tasks: ["Pain assessment", "Wound site check", "Fluid balance"] },
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

  const addBed = (x, z, designation, rotY = 0) => {
    items.push({ id: id(), type: "bed", x, z, rotationY: rotY, designation });
    items.push({ id: id(), type: "bedside_cabinet", x: x + 1.8 * Math.cos(rotY), z: z + 1.8 * Math.sin(rotY), rotationY: rotY });
    items.push({ id: id(), type: "observation_monitor", x: x - 1.8 * Math.cos(rotY), z: z - 1.8 * Math.sin(rotY), rotationY: rotY });
  };

  // === Room A (Clinical Suite A) — offset (-30, 0) ===
  // 2 beds horizontal top-left, 1 bed below, nurses' station at bottom, TV on top wall
  const oA = SUITE_OFFSET_A;
  addBed(oA.x - 5, oA.z - 4, "A1");
  addBed(oA.x - 2, oA.z - 4, "A2");
  addBed(oA.x - 3.5, oA.z + 0.5, "A3");
  items.push({ id: id(), type: "nurses_station", x: oA.x - 3.5, z: oA.z + 5, rotationY: 0 });
  items.push({ id: id(), type: "tv", x: oA.x - 3.5, z: oA.z - 7.5, rotationY: 0 });
  items.push({ id: id(), type: "waste_bin", x: oA.x - 8, z: oA.z + 6, rotationY: 0 });
  items.push({ id: id(), type: "chair", x: oA.x - 3.5, z: oA.z + 3, rotationY: Math.PI });

  // === Room B (Clinical Suite B) — offset (0, 0) ===
  // 4 beds stacked vertically along the right wall
  const oB = SUITE_OFFSET_B;
  [-5.5, -1.8, 1.8, 5.5].forEach((zOff, i) => {
    addBed(oB.x + 5, oB.z + zOff, `B${i + 1}`);
  });
  items.push({ id: id(), type: "waste_bin", x: oB.x - 8, z: oB.z + 6, rotationY: 0 });
  items.push({ id: id(), type: "iv_stand", x: oB.x - 3, z: oB.z - 4, rotationY: 0 });

  // === Room C (Skills Room) — offset (30, 0) ===
  // Sink on top wall, 2 tables in center, L-shaped countertop in bottom-right
  const oC = SUITE_OFFSET_C;
  items.push({ id: id(), type: "sink", x: oC.x, z: oC.z - 6.5, rotationY: 0 });
  items.push({ id: id(), type: "table", x: oC.x - 3, z: oC.z, rotationY: 0 });
  items.push({ id: id(), type: "table", x: oC.x + 3, z: oC.z, rotationY: 0 });
  items.push({ id: id(), type: "wall_cabinet", x: oC.x + 4, z: oC.z + 5, rotationY: 0 });
  items.push({ id: id(), type: "chair", x: oC.x - 3, z: oC.z + 2, rotationY: Math.PI });
  items.push({ id: id(), type: "chair", x: oC.x + 3, z: oC.z + 2, rotationY: Math.PI });
  items.push({ id: id(), type: "chair", x: oC.x - 3, z: oC.z - 2, rotationY: 0 });
  items.push({ id: id(), type: "chair", x: oC.x + 3, z: oC.z - 2, rotationY: 0 });

  // === Room D (Theory Room) — offset (0, 25) ===
  // 2 large tables side-by-side in center, TV on right wall
  const oD = SUITE_OFFSET_D;
  items.push({ id: id(), type: "table", x: oD.x - 3, z: oD.z, rotationY: 0 });
  items.push({ id: id(), type: "table", x: oD.x + 3, z: oD.z, rotationY: 0 });
  items.push({ id: id(), type: "tv", x: oD.x + 9, z: oD.z, rotationY: -Math.PI / 2 });
  items.push({ id: id(), type: "chair", x: oD.x - 3, z: oD.z + 2, rotationY: Math.PI });
  items.push({ id: id(), type: "chair", x: oD.x + 3, z: oD.z + 2, rotationY: Math.PI });
  items.push({ id: id(), type: "chair", x: oD.x - 3, z: oD.z - 2, rotationY: 0 });
  items.push({ id: id(), type: "chair", x: oD.x + 3, z: oD.z - 2, rotationY: 0 });

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
  bedFrame: new THREE.MeshPhysicalMaterial({ color: 0xE8EFEB, roughness: 0.28, metalness: 0.16, clearcoat: 0.55 }),
  mattress: new THREE.MeshStandardMaterial({ color: 0xFFFDFC, roughness: 0.72 }),
  duvet: new THREE.MeshStandardMaterial({ color: 0xCDE9DA, roughness: 0.58 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xD8D8D8, roughness: 0.3, metalness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3 }),
  cabinet: new THREE.MeshPhysicalMaterial({ color: 0xDCE8E1, roughness: 0.28, metalness: 0.08, clearcoat: 0.62 }),
  cabinetTop: new THREE.MeshPhysicalMaterial({ color: 0xFFFDF8, roughness: 0.18, clearcoat: 0.8 }),
  screenBody: new THREE.MeshStandardMaterial({ color: 0x50665B, roughness: 0.32, metalness: 0.16 }),
  screenAlert: new THREE.MeshStandardMaterial({ color: 0xFFD6D6, emissive: 0xFFD6D6, emissiveIntensity: 0.5 }),
  screenNormal: new THREE.MeshStandardMaterial({ color: 0xD6F5D6, emissive: 0x88DD88, emissiveIntensity: 0.3 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xF8F6F0, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide }),
  wood: new THREE.MeshStandardMaterial({ color: 0xD9E2DD, roughness: 0.42, metalness: 0.08 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xFFE7A3, roughness: 0.5 }),
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
    case "nurses_station": return createNursesStation();
    case "tv": return createTV();
    case "table": return createTable();
    case "wall_cabinet": return createWallCabinet();
    case "countertop": return createWallCabinet(); // backwards compatibility for saved layouts
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

function createNursesStation() {
  const g = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 1.2), M.cabinetTop);
  desk.position.y = 0.75; desk.castShadow = true; g.add(desk);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 0.05), M.cabinet);
  panel.position.set(0, 0.4, 0.6); g.add(panel);
  [[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.73, 0.08), M.metal);
    leg.position.set(x, 0.365, z); g.add(leg);
  });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), M.metal);
  stand.position.set(0, 0.88, -0.2); g.add(stand);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.03), M.screenBody);
  screen.position.set(0, 1.1, -0.2); g.add(screen);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.28), M.screenNormal);
  display.position.set(0, 1.1, -0.185); g.add(display);
  return g;
}

function createTV() {
  const g = new THREE.Group();
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), M.metal);
  mount.position.y = 2.6; g.add(mount);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 0.08), M.screenBody);
  frame.position.y = 2.2; frame.castShadow = true; g.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.15), M.screenNormal);
  screen.position.set(0, 2.2, 0.045); g.add(screen);
  return g;
}

function createTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.1), M.wood);
  top.position.y = 0.75; top.castShadow = true; g.add(top);
  [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.73, 0.08), M.metal);
    leg.position.set(x, 0.365, z); g.add(leg);
  });
  return g;
}

function createWallCabinet() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), M.cabinet);
  body.position.y = 1.45; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.76, 0.04), M.cabinetTop);
  door.position.set(0, 1.45, 0.47); door.castShadow = true; g.add(door);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.05), M.metal);
  handle.position.set(0.27, 1.45, 0.51); g.add(handle);
  const glow = new THREE.PointLight(0xE8FFF1, 0.25, 3);
  glow.position.set(0, 1.2, 0.8); g.add(glow);
  return g;
}