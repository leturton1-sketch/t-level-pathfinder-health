import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./FloatingAICompanion.css";

const POSITION_KEY = "pathfinder-clinical-ai-companion-position";
const MARGIN = 12;

function makeMaterial(colour, emissive = 0x000000) {
  return new THREE.MeshPhysicalMaterial({
    color: colour,
    emissive,
    emissiveIntensity: emissive ? 0.75 : 0,
    metalness: 0.04,
    roughness: 0.32,
    clearcoat: 0.86,
    clearcoatRoughness: 0.18,
  });
}

function addFresnel(mesh, colour = 0x52e7f5) {
  const shell = new THREE.Mesh(mesh.geometry.clone(), new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { colour: { value: new THREE.Color(colour) } },
    vertexShader: `
      varying vec3 normalWorld;
      varying vec3 viewWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        normalWorld = normalize(mat3(modelMatrix) * normal);
        viewWorld = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      uniform vec3 colour;
      varying vec3 normalWorld;
      varying vec3 viewWorld;
      void main() {
        float edge = pow(1.0 - abs(dot(normalize(normalWorld), normalize(viewWorld))), 2.3);
        gl_FragColor = vec4(colour, edge * 0.42);
      }`,
  }));
  shell.scale.multiplyScalar(1.035);
  mesh.add(shell);
}

function buildCompanion() {
  const root = new THREE.Group();
  const white = makeMaterial(0xf7fbff);
  const dark = makeMaterial(0x07131b);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x52efff, toneMapped: false });
  const teal = new THREE.MeshBasicMaterial({ color: 0x21c7b7, toneMapped: false });

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.72, 40, 30), white);
  torso.scale.set(0.82, 1.12, 0.6);
  torso.position.y = -0.48;
  addFresnel(torso);
  root.add(torso);

  const chest = new THREE.Group();
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.025), teal);
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.025), teal);
  chest.add(vertical, horizontal);
  chest.position.set(0, -0.48, 0.58);
  root.add(chest);

  const head = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 44, 34), white);
  shell.scale.set(1.06, 0.9, 0.82);
  addFresnel(shell);
  head.add(shell);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 26, 0, Math.PI * 2, 0.5, 1.65), dark);
  visor.scale.set(1.04, 0.62, 0.24);
  visor.position.set(0, 0.02, 0.46);
  head.add(visor);

  const wave = [];
  [-0.25, -0.125, 0, 0.125, 0.25].forEach((x, index) => {
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.11, 4, 8), cyan);
    bar.position.set(x, 0.04, 0.585);
    bar.userData.index = index;
    wave.push(bar);
    head.add(bar);
  });
  head.position.y = 0.78;
  root.add(head);

  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 16), white);
  joint.position.y = 0.22;
  root.add(joint);

  const hoverGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.54, 40),
    new THREE.MeshBasicMaterial({ color: 0x52efff, transparent: true, opacity: 0.22, depthWrite: false })
  );
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.y = -1.42;
  root.add(hoverGlow);

  return { root, head, wave, hoverGlow, chest };
}

function loadPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY));
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {}
  return null;
}

export default function FloatingAICompanion({ state = "idle", onActivate }) {
  const mountRef = useRef(null);
  const widgetRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const [position, setPosition] = useState(loadPosition);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !position) return;
    const clamp = () => {
      const rect = widget.getBoundingClientRect();
      const next = {
        x: Math.max(MARGIN, Math.min(position.x, window.innerWidth - rect.width - MARGIN)),
        y: Math.max(MARGIN, Math.min(position.y, window.innerHeight - rect.height - MARGIN)),
      };
      if (next.x !== position.x || next.y !== position.y) setPosition(next);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [position]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 140 / 180, 0.1, 20);
    camera.position.set(0, 0, 4.3);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(140, 180, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const companion = buildCompanion();
    scene.add(companion.root);
    scene.add(new THREE.HemisphereLight(0xf5fdff, 0x10212a, 2.6));
    const soft = new THREE.PointLight(0xffffff, 5.2, 10);
    soft.position.set(-2.5, 3.5, 4);
    scene.add(soft);
    const edge = new THREE.PointLight(0x43e9ff, 4, 8);
    edge.position.set(2.5, 1.4, 2);
    scene.add(edge);

    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const active = state === "listening" || state === "speaking" || state === "thinking";
      companion.root.position.y = Math.sin(t * 1.7) * 0.045;
      companion.root.rotation.y = Math.sin(t * 0.65) * 0.08;
      companion.head.rotation.z = Math.sin(t * 0.9) * 0.025;
      companion.wave.forEach((bar, index) => {
        const pulse = active ? 0.55 + Math.abs(Math.sin(t * 7 + index * 0.8)) * 0.8 : 0.7;
        bar.scale.y = pulse;
      });
      const glow = 0.18 + Math.sin(t * 2.2) * 0.06;
      companion.hoverGlow.material.opacity = active ? glow + 0.12 : glow;
      companion.chest.scale.setScalar(active ? 1 + Math.sin(t * 4) * 0.04 : 1);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [state]);

  const onPointerDown = (event) => {
    if (event.target.closest("button")) return;
    const rect = widgetRef.current.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    movedRef.current = false;
    widgetRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const rect = widgetRef.current.getBoundingClientRect();
    const next = {
      x: Math.max(MARGIN, Math.min(event.clientX - dragRef.current.dx, window.innerWidth - rect.width - MARGIN)),
      y: Math.max(MARGIN, Math.min(event.clientY - dragRef.current.dy, window.innerHeight - rect.height - MARGIN)),
    };
    if (Math.abs(next.x - rect.left) > 3 || Math.abs(next.y - rect.top) > 3) movedRef.current = true;
    setPosition(next);
  };

  const onPointerUp = (event) => {
    if (!dragRef.current) return;
    try { widgetRef.current.releasePointerCapture(event.pointerId); } catch {}
    dragRef.current = null;
    if (position) localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    if (!movedRef.current) onActivate?.();
  };

  const style = position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined;
  const status = state === "idle" ? "Pathfinder AI ready" : `Pathfinder AI · ${state}`;

  return (
    <div
      ref={widgetRef}
      className="ai-companion-container"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      tabIndex={0}
      aria-label="Open Pathfinder clinical AI companion"
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onActivate?.(); }}
    >
      <div ref={mountRef} className="ai-companion-canvas" aria-hidden="true" />
      <div className="ai-status-pill" role="status"><i />{status}</div>
    </div>
  );
}
