import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const STATE_STYLE = {
  idle: { colour: 0x38bdf8, glow: 0.45, speed: 0.32 },
  listening: { colour: 0xef4444, glow: 0.85, speed: 0.55 },
  working: { colour: 0xa855f7, glow: 1, speed: 1.15 },
  complete: { colour: 0x10b981, glow: 1, speed: 0.42 },
  offline: { colour: 0x64748b, glow: 0.12, speed: 0 },
};

function physicalMaterial(colour, metalness = 0.1, roughness = 0.42) {
  return new THREE.MeshPhysicalMaterial({
    color: colour,
    metalness,
    roughness,
    clearcoat: 0.28,
    clearcoatRoughness: 0.32,
  });
}

function makeWing(side, silver) {
  const wing = new THREE.Group();
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), silver);
  shoulder.scale.set(1.25, 0.55, 0.45);
  shoulder.position.set(side * 0.36, 1.35, 0);
  wing.add(shoulder);

  const rows = [
    { count: 7, y: 1.38, length: 0.78, spread: 0.31 },
    { count: 6, y: 1.18, length: 0.92, spread: 0.34 },
    { count: 5, y: 0.98, length: 1.02, spread: 0.37 },
  ];

  rows.forEach((row, rowIndex) => {
    for (let index = 0; index < row.count; index += 1) {
      const feather = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), silver);
      const distance = 0.58 + index * row.spread;
      feather.scale.set(row.length * 1.55, 0.22, 0.11);
      feather.position.set(side * distance, row.y - index * 0.055, -rowIndex * 0.045);
      feather.rotation.z = side * (-0.17 - index * 0.035);
      feather.rotation.y = side * 0.08;
      wing.add(feather);

      const vein = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, row.length * 0.58, 6),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65 }),
      );
      vein.position.copy(feather.position);
      vein.rotation.z = feather.rotation.z + side * Math.PI / 2;
      wing.add(vein);
    }
  });

  return wing;
}

function createSerpent(green, emeraldGlow) {
  const group = new THREE.Group();
  const points = [];
  for (let index = 0; index <= 90; index += 1) {
    const progress = index / 90;
    const angle = progress * Math.PI * 5.2;
    const radius = 0.31 - progress * 0.08;
    points.push(new THREE.Vector3(
      Math.sin(angle) * radius,
      -1.55 + progress * 3.05,
      0.2 + Math.cos(angle) * radius,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const body = new THREE.Mesh(new THREE.TubeGeometry(curve, 180, 0.085, 12, false), green);
  group.add(body);

  const glow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(180)),
    emeraldGlow,
  );
  group.add(glow);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), green);
  head.scale.set(1.45, 0.72, 0.82);
  head.position.copy(points.at(-1)).add(new THREE.Vector3(0.16, 0.02, 0));
  head.rotation.z = -0.18;
  group.add(head);

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    );
    eye.position.copy(head.position).add(new THREE.Vector3(0.11, 0.045, side * 0.12));
    group.add(eye);
  });

  const tongueCurve = new THREE.CatmullRomCurve3([
    head.position.clone().add(new THREE.Vector3(0.19, -0.02, 0)),
    head.position.clone().add(new THREE.Vector3(0.36, -0.03, 0)),
    head.position.clone().add(new THREE.Vector3(0.47, -0.01, 0.05)),
  ]);
  const tongue = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(tongueCurve.getPoints(12)),
    new THREE.LineBasicMaterial({ color: 0xef4444 }),
  );
  group.add(tongue);

  return { group, glow };
}

export default function ClinicalAssistant360({ state = "idle" }) {
  const mountRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.1, 8.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.position.y = -0.1;
    scene.add(root);

    const silver = physicalMaterial(0xcbd5e1, 0.78, 0.22);
    const darkSilver = physicalMaterial(0x64748b, 0.86, 0.28);
    const green = physicalMaterial(0x16a34a, 0.08, 0.38);
    green.emissive = new THREE.Color(0x064e3b);
    green.emissiveIntensity = 0.2;
    const emeraldGlow = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.75,
    });

    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.125, 4.35, 28), darkSilver);
    staff.castShadow = true;
    root.add(staff);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 22), silver);
    cap.position.y = 2.28;
    cap.castShadow = true;
    root.add(cap);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.34, 24), darkSilver);
    collar.position.y = 1.94;
    root.add(collar);

    const leftWing = makeWing(-1, silver);
    const rightWing = makeWing(1, silver);
    root.add(leftWing, rightWing);

    const serpent = createSerpent(green, emeraldGlow);
    root.add(serpent.group);

    const statusRingMaterial = new THREE.MeshBasicMaterial({
      color: STATE_STYLE.idle.colour,
      transparent: true,
      opacity: 0.48,
    });
    const statusRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.018, 10, 100), statusRingMaterial);
    statusRing.rotation.x = Math.PI / 2;
    statusRing.position.y = -1.55;
    root.add(statusRing);

    const particles = [];
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0 });
    for (let index = 0; index < 24; index += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), particleMaterial);
      const angle = (index / 24) * Math.PI * 2;
      particle.userData = { angle, radius: 0.9 + (index % 4) * 0.16, lift: (index % 6) * 0.22 };
      root.add(particle);
      particles.push(particle);
    }

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.45, 64),
      new THREE.ShadowMaterial({ color: 0x334155, opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.28;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.HemisphereLight(0xf8fafc, 0x94a3b8, 2.4));
    const key = new THREE.DirectionalLight(0xfff7ed, 4.2);
    key.position.set(-3, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(STATE_STYLE.idle.colour, 4.5, 12);
    rim.position.set(3.2, 1.6, 3);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5.7;
    controls.maxDistance = 11;
    controls.target.set(0, 0.05, 0);
    controls.autoRotate = true;

    const clock = new THREE.Clock();
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const current = STATE_STYLE[stateRef.current] || STATE_STYLE.idle;
      const stateColour = new THREE.Color(current.colour);
      const working = stateRef.current === "working" || stateRef.current === "listening";
      const complete = stateRef.current === "complete";
      const offline = stateRef.current === "offline";

      root.position.y = offline ? -0.14 : -0.1 + Math.sin(time * (working ? 2.3 : 1.05)) * (working ? 0.07 : 0.035);
      leftWing.rotation.y = working ? Math.sin(time * 4.4) * 0.18 : Math.sin(time * 1.2) * 0.035;
      rightWing.rotation.y = -leftWing.rotation.y;
      leftWing.rotation.z = complete ? -0.12 : 0;
      rightWing.rotation.z = complete ? 0.12 : 0;
      serpent.glow.opacity = offline ? 0.08 : 0.55 + Math.sin(time * (working ? 7 : 2)) * 0.3;
      green.emissiveIntensity = offline ? 0 : current.glow * (working ? 0.75 + Math.sin(time * 6) * 0.24 : 0.28);
      statusRingMaterial.color.lerp(stateColour, 0.09);
      statusRingMaterial.opacity = offline ? 0.1 : 0.35 + current.glow * 0.35;
      statusRing.rotation.z = time * current.speed;
      statusRing.scale.setScalar(complete ? 1 + Math.sin(time * 3) * 0.08 : 1);
      rim.color.lerp(stateColour, 0.08);
      rim.intensity = offline ? 0.5 : 3.4 + current.glow * 2.5;
      controls.autoRotate = !offline;
      controls.autoRotateSpeed = current.speed;

      particleMaterial.opacity = complete ? 0.82 : 0;
      particles.forEach((particle, index) => {
        const data = particle.userData;
        const phase = time * 1.8 + data.angle;
        particle.position.set(
          Math.cos(phase) * data.radius,
          -1.6 + ((time * 0.65 + data.lift) % 3.5),
          Math.sin(phase) * data.radius,
        );
        particle.scale.setScalar(0.7 + Math.sin(time * 3 + index) * 0.25);
      });

      root.traverse((object) => {
        if (!object.material || object === statusRing) return;
        if ("opacity" in object.material && object.material.transparent) {
          object.material.opacity = offline ? Math.min(object.material.opacity, 0.34) : Math.max(object.material.opacity, 0.62);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const label = {
    idle: "Idle · ready for a task",
    listening: "Listening for your instruction",
    working: "Working on your task",
    complete: "Task complete",
    offline: "Not working · action required",
  }[state] || "Idle · ready for a task";

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_42%,rgba(186,230,253,.48),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.98),rgba(226,232,240,.76))]">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="Rotatable 3D winged clinical assistant symbol" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/90 bg-white/78 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-slate-600 shadow-lg backdrop-blur-xl">
        Drag to rotate 360° · Scroll to zoom
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-white/90 bg-white/82 px-4 py-3 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-700">Clinical assistant status</p>
          <p className="mt-0.5 text-xs font-extrabold text-slate-900">{label}</p>
        </div>
        <span
          className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_18px_currentColor]"
          style={{ color: `#${(STATE_STYLE[state]?.colour || STATE_STYLE.idle.colour).toString(16).padStart(6, "0")}`, backgroundColor: "currentColor" }}
        />
      </div>
    </div>
  );
}
