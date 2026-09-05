import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./FloatingAICompanion.css";

const POSITION_KEY = "pathfinder-clinical-ai-companion-position";
const MINIMIZED_KEY = "pathfinder-clinical-ai-companion-minimized";
const MARGIN = 12;
const SNAP_DISTANCE = 48;
const FULL_SIZE = { width: 140, height: 180 };
const HEAD_SIZE = { width: 78, height: 78 };

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

  const voiceRings = [0, 1, 2].map((index) => {
    const material = new THREE.MeshBasicMaterial({
      color: 0x52efff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.53, 48), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.4 + index * 0.008;
    ring.visible = false;
    root.add(ring);
    return ring;
  });

  return { root, torso, head, wave, hoverGlow, chest, joint, voiceRings };
}

function loadPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY));
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {}
  return null;
}

function loadMinimized() {
  try { return localStorage.getItem(MINIMIZED_KEY) === "true"; } catch { return false; }
}

function dockPosition(minimized) {
  const size = minimized ? HEAD_SIZE : FULL_SIZE;
  return {
    x: Math.max(MARGIN, window.innerWidth - size.width - MARGIN),
    y: Math.max(MARGIN, window.innerHeight - size.height - MARGIN),
  };
}

export default function FloatingAICompanion({ state = "idle", expanded = false, onActivate }) {
  const mountRef = useRef(null);
  const widgetRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const clickTimerRef = useRef(null);
  const positionRef = useRef(loadPosition());
  const [position, setPositionState] = useState(positionRef.current);
  const [minimized, setMinimized] = useState(loadMinimized);

  const setPosition = (next) => {
    positionRef.current = next;
    setPositionState(next);
  };

  useEffect(() => () => window.clearTimeout(clickTimerRef.current), []);

  useEffect(() => {
    const clamp = () => {
      if (!positionRef.current) return;
      const size = minimized ? HEAD_SIZE : FULL_SIZE;
      const current = positionRef.current;
      const next = {
        x: Math.max(MARGIN, Math.min(current.x, window.innerWidth - size.width - MARGIN)),
        y: Math.max(MARGIN, Math.min(current.y, window.innerHeight - size.height - MARGIN)),
      };
      if (next.x !== current.x || next.y !== current.y) setPosition(next);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [minimized]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const dimensions = minimized ? HEAD_SIZE : FULL_SIZE;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, dimensions.width / dimensions.height, 0.1, 20);
    camera.position.set(0, 0, 4.3);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(dimensions.width, dimensions.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const companion = buildCompanion();
    companion.torso.visible = !minimized;
    companion.chest.visible = !minimized;
    companion.joint.visible = !minimized;
    companion.hoverGlow.visible = !minimized;
    companion.voiceRings.forEach((ring) => { ring.visible = false; });
    companion.root.position.y = minimized ? -0.78 : 0;
    // Match the main educator: reduce only the rendered model by 30%, not its touch target.
    companion.root.scale.setScalar(minimized ? 0.91 : 0.7);
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
      const listening = state === "listening";
      const baseY = minimized ? -0.78 : 0;
      companion.root.position.y = baseY + Math.sin(t * 1.7) * 0.045;
      companion.root.rotation.y = Math.sin(t * 0.65) * 0.08;
      companion.head.rotation.z = Math.sin(t * 0.9) * 0.025;
      companion.wave.forEach((bar, index) => {
        const pulse = active ? 0.55 + Math.abs(Math.sin(t * 7 + index * 0.8)) * 0.8 : 0.7;
        bar.scale.y = pulse;
      });
      const glow = 0.18 + Math.sin(t * 2.2) * 0.06;
      companion.hoverGlow.material.opacity = active ? glow + 0.12 : glow;
      companion.chest.scale.setScalar(active ? 1 + Math.sin(t * 4) * 0.04 : 1);
      companion.voiceRings.forEach((ring, index) => {
        if (minimized) {
          ring.visible = false;
          return;
        }
        const phase = (t * 1.65 + index / 3) % 1;
        ring.visible = listening;
        ring.scale.setScalar(1 + phase * 1.9);
        ring.material.opacity = listening ? (1 - phase) * 0.2 : 0;
      });
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
  }, [state, minimized]);

  const snapToNearbyEdge = (point) => {
    const size = minimized ? HEAD_SIZE : FULL_SIZE;
    const maxX = window.innerWidth - size.width - MARGIN;
    const maxY = window.innerHeight - size.height - MARGIN;
    const distances = [
      { axis: "x", value: MARGIN, distance: Math.abs(point.x - MARGIN) },
      { axis: "x", value: maxX, distance: Math.abs(point.x - maxX) },
      { axis: "y", value: MARGIN, distance: Math.abs(point.y - MARGIN) },
      { axis: "y", value: maxY, distance: Math.abs(point.y - maxY) },
    ].filter((edge) => edge.distance <= SNAP_DISTANCE);
    if (!distances.length) return point;
    return distances.reduce((next, edge) => ({ ...next, [edge.axis]: edge.value }), point);
  };

  const onPointerDown = (event) => {
    const rect = widgetRef.current.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    movedRef.current = false;
    widgetRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const size = minimized ? HEAD_SIZE : FULL_SIZE;
    const next = {
      x: Math.max(MARGIN, Math.min(event.clientX - dragRef.current.dx, window.innerWidth - size.width - MARGIN)),
      y: Math.max(MARGIN, Math.min(event.clientY - dragRef.current.dy, window.innerHeight - size.height - MARGIN)),
    };
    const current = positionRef.current || widgetRef.current.getBoundingClientRect();
    if (Math.abs(next.x - current.x) > 3 || Math.abs(next.y - current.y) > 3) movedRef.current = true;
    setPosition(next);
  };

  const onPointerUp = (event) => {
    if (!dragRef.current) return;
    try { widgetRef.current.releasePointerCapture(event.pointerId); } catch {}
    dragRef.current = null;
    if (movedRef.current) {
      const snapped = snapToNearbyEdge(positionRef.current || dockPosition(minimized));
      setPosition(snapped);
      localStorage.setItem(POSITION_KEY, JSON.stringify(snapped));
      return;
    }
    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => onActivate?.(), 220);
  };

  const onDoubleClick = (event) => {
    event.preventDefault();
    window.clearTimeout(clickTimerRef.current);
    const nextMinimized = !minimized;
    const docked = dockPosition(nextMinimized);
    setMinimized(nextMinimized);
    setPosition(docked);
    localStorage.setItem(MINIMIZED_KEY, String(nextMinimized));
    localStorage.setItem(POSITION_KEY, JSON.stringify(docked));
  };

  const style = position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined;
  const status = state === "idle" ? "Pathfinder AI ready" : `Pathfinder AI · ${state}`;

  return (
    <div
      ref={widgetRef}
      className={`ai-companion-container${minimized ? " is-minimized" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={expanded ? "Close Pathfinder clinical AI text box" : "Open Pathfinder clinical AI text box"}
      aria-expanded={expanded}
      title={`${expanded ? "Click to close" : "Click to open"} · Drag to move · Double-click to dock or restore`}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onActivate?.(); }}
    >
      <div ref={mountRef} className="ai-companion-canvas" aria-hidden="true" />
      {!minimized && <div className="ai-status-pill" role="status"><i />{status}</div>}
    </div>
  );
}
