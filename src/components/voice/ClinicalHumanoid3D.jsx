import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import "./ClinicalHumanoid3D.css";

const STATE = {
  idle: { colour: 0x38dff2, label: "Clinical educator online" },
  listening: { colour: 0xef4444, label: "Listening" },
  working: { colour: 0xf0b84d, label: "Processing" },
  thinking: { colour: 0xf0b84d, label: "Processing" },
  complete: { colour: 0x54f6a8, label: "Response ready" },
  speaking: { colour: 0x54f6a8, label: "Clinical educator speaking" },
  offline: { colour: 0x64748b, label: "Assistant offline" },
};

function physical(colour, metalness = 0.08, roughness = 0.24) {
  return new THREE.MeshPhysicalMaterial({
    color: colour,
    metalness,
    roughness,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
  });
}

function addRimShell(mesh, colour = 0x62eaff) {
  const rim = new THREE.Mesh(mesh.geometry.clone(), new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uColour: { value: new THREE.Color(colour) }, uStrength: { value: 0.34 } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      uniform vec3 uColour;
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.6);
        gl_FragColor = vec4(uColour, fresnel * uStrength);
      }`,
  }));
  rim.scale.multiplyScalar(1.025);
  mesh.add(rim);
  return rim.material;
}

function mesh(geometry, material, position, scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function buildRobot() {
  const root = new THREE.Group();
  const rig = {
    root,
    spine: new THREE.Group(),
    neck: new THREE.Group(),
    head: new THREE.Group(),
    leftShoulder: new THREE.Group(),
    rightShoulder: new THREE.Group(),
    mouth: null,
    eyes: [],
    visor: null,
    rimMaterials: [],
  };
  root.add(rig.spine);

  const white = physical(0xf7fafc, 0.06, 0.2);
  const silver = physical(0xaebbc4, 0.78, 0.17);
  const black = physical(0x02070a, 0.48, 0.12);
  const red = physical(0xe51e35, 0.22, 0.18);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x48efff, toneMapped: false });
  const sensor = physical(0xd9e3e8, 0.18, 0.34);

  const torso = mesh(new THREE.SphereGeometry(1, 48, 32), white, [0, -0.65, 0], [1.48, 1.25, 0.68]);
  rig.rimMaterials.push(addRimShell(torso));
  rig.spine.add(torso);

  const waist = mesh(new THREE.CylinderGeometry(0.78, 1.05, 0.72, 40), white, [0, -1.85, 0]);
  rig.spine.add(waist);

  const neckCowl = mesh(new THREE.CylinderGeometry(0.49, 0.7, 0.62, 40), silver, [0, 0.42, 0]);
  rig.neck.add(neckCowl);
  const seal = mesh(new THREE.TorusGeometry(0.66, 0.055, 12, 48), black, [0, 0.12, 0], [1, 1, 0.78]);
  seal.rotation.x = Math.PI / 2;
  rig.neck.add(seal);
  rig.spine.add(rig.neck);

  const headShell = mesh(new THREE.SphereGeometry(0.92, 56, 40), white, [0, 1.45, 0], [1.08, 0.96, 0.82]);
  rig.rimMaterials.push(addRimShell(headShell));
  rig.head.add(headShell);

  const visor = mesh(new THREE.SphereGeometry(0.73, 48, 32, 0, Math.PI * 2, 0.45, 1.82), black, [0, 1.47, 0.62], [1.03, 0.66, 0.22]);
  visor.rotation.x = -0.06;
  rig.visor = visor;
  rig.head.add(visor);

  [-0.29, 0.29].forEach((x) => {
    const eye = mesh(new THREE.CapsuleGeometry(0.09, 0.18, 6, 16), cyan, [x, 1.54, 0.79], [1.15, 1, 0.34]);
    eye.rotation.z = Math.PI / 2;
    rig.eyes.push(eye);
    rig.head.add(eye);
  });
  const mouth = mesh(new THREE.CapsuleGeometry(0.025, 0.22, 4, 12), cyan, [0, 1.24, 0.8], [1, 1, 0.25]);
  mouth.rotation.z = Math.PI / 2;
  rig.mouth = mouth;
  rig.head.add(mouth);
  rig.neck.add(rig.head);

  const shoulderGeometry = new THREE.SphereGeometry(0.48, 36, 26);
  const upperArmGeometry = new THREE.CapsuleGeometry(0.29, 0.86, 10, 24);
  [-1, 1].forEach((side) => {
    const shoulderRig = side < 0 ? rig.leftShoulder : rig.rightShoulder;
    shoulderRig.position.set(side * 1.31, -0.52, -0.08);
    const socket = mesh(shoulderGeometry, silver, [0, 0, 0], [1, 1, 0.82]);
    const shoulderCap = mesh(shoulderGeometry, white, [side * 0.07, 0, 0.02], [1.18, 1.05, 0.88]);
    rig.rimMaterials.push(addRimShell(shoulderCap));
    const arm = mesh(upperArmGeometry, white, [side * 0.03, -0.73, 0], [0.92, 1, 0.82]);
    shoulderRig.add(socket, shoulderCap, arm);
    rig.spine.add(shoulderRig);
  });

  [-0.54, 0.54].forEach((x) => {
    const panel = mesh(new THREE.BoxGeometry(0.47, 0.58, 0.08, 4, 4, 1), sensor, [x, -0.62, 0.67], [1, 1, 0.5]);
    rig.spine.add(panel);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const dot = mesh(new THREE.SphereGeometry(0.012, 8, 6), black, [x - 0.12 + col * 0.06, -0.48 + row * 0.05, 0.73]);
        rig.spine.add(dot);
      }
    }
    for (let col = 0; col < 3; col += 1) {
      const led = mesh(new THREE.BoxGeometry(0.055, 0.018, 0.018), cyan, [x - 0.07 + col * 0.07, -0.82, 0.735]);
      rig.spine.add(led);
    }
  });

  const crossVertical = mesh(new THREE.BoxGeometry(0.18, 0.65, 0.12), red, [0, -0.58, 0.77]);
  const crossHorizontal = mesh(new THREE.BoxGeometry(0.65, 0.18, 0.12), red, [0, -0.58, 0.77]);
  rig.spine.add(crossVertical, crossHorizontal);

  return rig;
}

function vitalLevel(value, warning, danger, invert = false) {
  if (invert) return value <= danger ? "danger" : value <= warning ? "warning" : "normal";
  return value >= danger ? "danger" : value >= warning ? "warning" : "normal";
}

export default function ClinicalHumanoid3D({
  state = "idle",
  speaking = false,
  listening = false,
  telemetry = { spo2: 98, heartRate: 72, news2: 0 },
}) {
  const mountRef = useRef(null);
  const stateRef = useRef(state);
  const speakingRef = useRef(speaking);
  const listeningRef = useRef(listening);
  stateRef.current = state;
  speakingRef.current = speaking;
  listeningRef.current = listening;

  const activeState = listening ? "listening" : speaking ? "speaking" : state;
  const status = STATE[activeState] || STATE.idle;
  const vitals = useMemo(() => [
    { label: "SpO₂", value: `${telemetry.spo2}%`, level: vitalLevel(telemetry.spo2, 94, 91, true) },
    { label: "HR", value: telemetry.heartRate, level: vitalLevel(telemetry.heartRate, 100, 130) },
    { label: "NEWS2", value: telemetry.news2, level: vitalLevel(telemetry.news2, 3, 5) },
  ], [telemetry.spo2, telemetry.heartRate, telemetry.news2]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0, 0.05, 7.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio <= 2,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const rig = buildRobot();
    // A further 20% reduction keeps the educator comfortably inside the stage (56% of the original scene scale).
    rig.root.scale.setScalar(0.56);
    rig.root.position.y = 0.05;
    scene.add(rig.root);
    scene.add(new THREE.HemisphereLight(0xe8fbff, 0x08131b, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 4.8);
    key.position.set(-3.2, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0x43e9ff, 6, 11);
    rim.position.set(3.4, 1.6, 2.8);
    scene.add(rim);

    const floor = mesh(new THREE.CircleGeometry(2.5, 48), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }), [0, -2.28, 0]);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let visible = true;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      const t = clock.getElapsedTime();
      const currentName = listeningRef.current ? "listening" : speakingRef.current ? "speaking" : stateRef.current;
      const current = STATE[currentName] || STATE.idle;
      const talking = currentName === "speaking";
      const processing = currentName === "working" || currentName === "thinking";

      rig.root.rotation.y += (pointerX * 0.16 - rig.root.rotation.y) * 0.045;
      rig.root.rotation.x += (pointerY * 0.035 - rig.root.rotation.x) * 0.04;
      rig.spine.position.y = Math.sin(t * 1.15) * 0.025;
      rig.head.rotation.z = Math.sin(t * 0.72) * 0.015;
      rig.head.rotation.y = Math.sin(t * 0.48) * 0.035;
      rig.leftShoulder.rotation.z = processing ? Math.sin(t * 2.5) * 0.025 : 0;
      rig.rightShoulder.rotation.z = -rig.leftShoulder.rotation.z;

      const viseme = talking ? 0.42 + Math.abs(Math.sin(t * 10.4) * 0.58) : 0.14;
      rig.mouth.scale.y += (viseme - rig.mouth.scale.y) * 0.34;
      rig.mouth.scale.x = talking ? 0.8 + Math.sin(t * 6.2) * 0.2 : 1;
      const blink = Math.sin(t * 0.83) > 0.992 ? 0.15 : 1;
      rig.eyes.forEach((eye) => { eye.scale.y = blink; });
      rig.rimMaterials.forEach((material) => {
        material.uniforms.uColour.value.lerp(new THREE.Color(current.colour), 0.08);
        material.uniforms.uStrength.value = currentName === "offline" ? 0.08 : 0.3 + Math.sin(t * 1.8) * 0.04;
      });
      rim.color.lerp(new THREE.Color(current.colour), 0.08);
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    resizeObserver.observe(mount);
    visibilityObserver.observe(mount);
    mount.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={`clinical-humanoid-3d clinical-humanoid-3d-${activeState}`}>
      <div ref={mountRef} className="clinical-humanoid-canvas" aria-label="Interactive 3D Pathfinder clinical educator" />
      <div className="clinical-3d-badge">
        <span>PATHFINDER</span><strong>CLINICAL AI</strong><small>{activeState.toUpperCase()}</small>
      </div>
      <div className="clinical-3d-vitals" aria-label="Simulated clinical telemetry">
        {vitals.map((vital) => (
          <div key={vital.label} className={`clinical-vital clinical-vital-${vital.level}`}>
            <i /><span>{vital.label}</span><strong>{vital.value}</strong>
          </div>
        ))}
        <svg viewBox="0 0 180 28" role="img" aria-label="Animated ECG trace">
          <path className="clinical-ecg-guide" d="M0 15H180" />
          <path className="clinical-ecg-trace" pathLength="1" d="M0 15H32L40 13L47 16L54 3L62 25L70 10L78 15H112L120 13L127 16L134 3L142 25L150 10L158 15H180" />
        </svg>
      </div>
      <div className="clinical-3d-status" role="status" aria-live="polite">
        <i style={{ backgroundColor: `#${status.colour.toString(16).padStart(6, "0")}` }} />
        {status.label}
        <span aria-hidden="true"><b /><b /><b /><b /></span>
      </div>
      <p className="clinical-3d-hint">Move pointer to inspect · 3D real-time model</p>
    </div>
  );
}
