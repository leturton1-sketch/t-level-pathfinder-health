import * as THREE from "three";

export const WARD_ITEM_TYPES = [
  { type: "bed", label: "Bed" },
  { type: "curtain_rail", label: "Curtain Rail" },
  { type: "curtain", label: "Privacy Curtain" },
  { type: "chair", label: "Chair" },
  { type: "nurse_station", label: "Nurse Station" },
  { type: "sink", label: "Sink" },
  { type: "waste_bin", label: "Waste Bin" },
];

const M = {
  bed: new THREE.MeshStandardMaterial({ color: 0xb0b8c0, roughness: 0.4, metalness: 0.5 }),
  mattress: new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.8 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xd0d5db, roughness: 0.5, metalness: 0.2 }),
  desk: new THREE.MeshStandardMaterial({ color: 0xd0d5db, roughness: 0.4, metalness: 0.3 }),
  deskTop: new THREE.MeshStandardMaterial({ color: 0xe0e5eb, roughness: 0.2 }),
  curtain: new THREE.MeshStandardMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }),
  yellowLid: new THREE.MeshStandardMaterial({ color: 0xe6b800, roughness: 0.5 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.2 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0.2 }),
};

export function createWardItem(type) {
  switch (type) {
    case "bed": return createBed();
    case "curtain_rail": return createCurtainRail();
    case "curtain": return createCurtain();
    case "chair": return createChair();
    case "nurse_station": return createNurseStation();
    case "sink": return createSink();
    case "waste_bin": return createWasteBin();
    default: return new THREE.Group();
  }
}

function createBed() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 2.5), M.bed);
  frame.position.y = 0.4; frame.castShadow = true; g.add(frame);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 2.3), M.mattress);
  mat.position.y = 0.68; g.add(mat);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), M.pillow);
  pillow.position.set(0, 0.8, -0.8); g.add(pillow);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.1), M.bed);
  hb.position.set(0, 0.7, -1.25); g.add(hb);
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