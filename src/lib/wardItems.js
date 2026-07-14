import * as THREE from "three";

export const WARD_ITEM_TYPES = [
  { type: "bed", label: "Bed" },
  { type: "curtain_rail", label: "Curtain Rail" },
  { type: "curtain", label: "Privacy Curtain" },
  { type: "chair", label: "Chair" },
  { type: "nurse_station", label: "Nurse Station" },
  { type: "sink", label: "Sink" },
  { type: "waste_bin", label: "Waste Bin" },
  { type: "window", label: "Window" },
  { type: "door", label: "Door" },
];

function createTextTexture(text, w = 128, h = 48, color = "#333", bg = "transparent") {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.6)}px Arial`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(canvas);
}

const M = {
  bed: new THREE.MeshStandardMaterial({ color: 0xa8b0b8, roughness: 0.4, metalness: 0.5 }),
  mattress: new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.8 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xedebe5, roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xc8c5be, roughness: 0.5, metalness: 0.2 }),
  desk: new THREE.MeshStandardMaterial({ color: 0xcac6bf, roughness: 0.4, metalness: 0.3 }),
  deskTop: new THREE.MeshStandardMaterial({ color: 0xd8d4cd, roughness: 0.2 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xdcd9d3, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }),
  yellowLid: new THREE.MeshStandardMaterial({ color: 0xe6b800, roughness: 0.5 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.2 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0.2 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa0c4d4, transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.3 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xddd9d2, roughness: 0.7 }),
};

export function createWardItem(type, options = {}) {
  switch (type) {
    case "bed": return createBed(options.designation);
    case "curtain_rail": return createCurtainRail();
    case "curtain": return createCurtain();
    case "chair": return createChair();
    case "nurse_station": return options.expanded ? createNurseStationDouble() : createNurseStation();
    case "sink": return createSink();
    case "waste_bin": return createWasteBin();
    case "window": return createWindow();
    case "door": return createDoor();
    default: return new THREE.Group();
  }
}

function createBed(designation) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 2.5), M.bed);
  frame.position.y = 0.4; frame.castShadow = true; g.add(frame);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 2.3), M.mattress);
  mat.position.y = 0.68; g.add(mat);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), M.pillow);
  pillow.position.set(0, 0.8, -0.8); g.add(pillow);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.1), M.bed);
  hb.position.set(0, 0.7, -1.25); g.add(hb);
  if (designation) {
    const tex = createTextTexture(designation, 128, 48, "#333", "#ddd9d2");
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), new THREE.MeshBasicMaterial({ map: tex }));
    label.position.set(0, 1.15, -1.26); g.add(label);
  }
  return g;
}

function createCurtainRail() {
  const g = new THREE.Group();
  const h = 2.4, w = 3, d = 3;
  [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([x,z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,h,8), M.metal);
    p.position.set(x, h/2, z); g.add(p);
  });
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(w,0.06,0.06), M.metal); r1.position.set(0,h,-d/2); g.add(r1);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(w,0.06,0.06), M.metal); r2.position.set(0,h,d/2); g.add(r2);
  const r3 = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,d), M.metal); r3.position.set(-w/2,h,0); g.add(r3);
  const r4 = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,d), M.metal); r4.position.set(w/2,h,0); g.add(r4);
  return g;
}

function createCurtain() {
  const g = new THREE.Group();
  const h = 2.2, w = 3;
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(w,h), M.curtain); p1.position.set(0,h/2,-1.5); g.add(p1);
  const p2 = new THREE.Mesh(new THREE.PlaneGeometry(w,h), M.curtain); p2.position.set(0,h/2,1.5); g.add(p2);
  const p3 = new THREE.Mesh(new THREE.PlaneGeometry(3,h), M.curtain); p3.position.set(-1.5,h/2,0); p3.rotation.y=Math.PI/2; g.add(p3);
  const p4 = new THREE.Mesh(new THREE.PlaneGeometry(3,h), M.curtain); p4.position.set(1.5,h/2,0); p4.rotation.y=Math.PI/2; g.add(p4);
  const track = new THREE.Mesh(new THREE.BoxGeometry(w,0.05,3), M.metal); track.position.set(0,h+0.1,0); g.add(track);
  return g;
}

function createChair() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.08,0.6), M.wood); seat.position.y=0.5; seat.castShadow=true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.08), M.wood); back.position.set(0,0.8,-0.26); g.add(back);
  [[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]].forEach(([x,z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.5,0.06), M.wood); leg.position.set(x,0.25,z); g.add(leg);
  });
  return g;
}

function createNurseStation() {
  const g = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5,0.8,1.5), M.desk); desk.position.y=0.6; desk.castShadow=true; g.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.7,0.08,1.7), M.deskTop); top.position.y=1.04; g.add(top);
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,0.04), M.screen); mon.position.set(0,1.5,-0.3); g.add(mon);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,6), M.metal); stand.position.set(0,1.2,-0.3); g.add(stand);
  return g;
}

function createNurseStationDouble() {
  const g = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6.5,0.8,1.5), M.desk); desk.position.y=0.6; desk.castShadow=true; g.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(6.7,0.08,1.7), M.deskTop); top.position.y=1.04; g.add(top);
  [-1.5, 1.5].forEach(x => {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,0.04), M.screen); mon.position.set(x,1.5,-0.3); g.add(mon);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,6), M.metal); stand.position.set(x,1.2,-0.3); g.add(stand);
  });
  return g;
}

function createSink() {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.8,0.5), M.metal); stand.position.y=0.4; g.add(stand);
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.15,0.5), M.porcelain); basin.position.y=0.85; g.add(basin);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.3,8), M.metal); faucet.position.set(0,1.05,-0.15); g.add(faucet);
  const spout = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.02,0.15), M.metal); spout.position.set(0,1.15,-0.07); g.add(spout);
  return g;
}

function createWasteBin() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,0.8,16), M.yellow); body.position.y=0.4; body.castShadow=true; g.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.08,16), M.yellowLid); lid.position.y=0.84; g.add(lid);
  return g;
}

function createWindow() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.1), M.wood);
  frame.position.y = 1.5; g.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), M.glass);
  glass.position.set(0, 1.5, 0.06); g.add(glass);
  const barH = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.04), M.wood);
  barH.position.set(0, 1.5, 0.08); g.add(barH);
  const barV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), M.wood);
  barV.position.set(0, 1.5, 0.08); g.add(barV);
  return g;
}

function createDoor() {
  const g = new THREE.Group();
  const fL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.15), M.wood); fL.position.set(-0.5, 1.1, 0); g.add(fL);
  const fR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.15), M.wood); fR.position.set(0.5, 1.1, 0); g.add(fR);
  const fT = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.15), M.wood); fT.position.set(0, 2.15, 0); g.add(fT);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.05), M.wood); door.position.set(-0.05, 1.1, 0); g.add(door);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), M.metal); handle.position.set(0.35, 1.1, 0.06); g.add(handle);
  return g;
}