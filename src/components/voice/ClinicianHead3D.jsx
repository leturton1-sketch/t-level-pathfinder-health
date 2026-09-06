import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const STATUS_COLOURS = {
  idle: 0x63e6d3,
  listening: 0x22d3ee,
  thinking: 0xf9a8d4,
  speaking: 0xa7f3d0,
};

function addWireMesh(group, geometry, colour, opacity = 0.72) {
  const mesh = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity })
  );
  group.add(mesh);
  return mesh;
}

function curveLine(points, colour, opacity = 0.9) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(42)),
    new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity })
  );
}

function addCallout(scene, from, to, colour) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(to[0] * 0.72, to[1], to[2]), new THREE.Vector3(...to)];
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.72 })
  );
  scene.add(line);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 8),
    new THREE.MeshBasicMaterial({ color: colour })
  );
  dot.position.set(...to);
  scene.add(dot);
}

export default function ClinicianHead3D({ status = "idle" }) {
  const mountRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.15, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.position.y = -0.05;
    scene.add(root);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 34, 30),
      new THREE.MeshPhysicalMaterial({
        color: 0x9bd9e8, transparent: true, opacity: 0.1, roughness: 0.12,
        metalness: 0.08, transmission: 0.32, side: THREE.DoubleSide, depthWrite: false,
      })
    );
    shell.scale.set(0.82, 1.13, 0.88);
    shell.position.y = 0.55;
    root.add(shell);
    addWireMesh(root, new THREE.SphereGeometry(1.23, 28, 24), 0xb9f4ee, 0.58).scale.set(0.82, 1.13, 0.88);
    root.children[root.children.length - 1].position.y = 0.55;

    // Jaw, cheeks, nose and mouth topology
    const faceLines = [
      [[-0.78,0.72,0.78],[-0.58,0.2,0.96],[0,-0.12,1.03],[0.58,0.2,0.96],[0.78,0.72,0.78]],
      [[-0.72,0.72,0.82],[-0.42,0.82,1.02],[0,0.86,1.12],[0.42,0.82,1.02],[0.72,0.72,0.82]],
      [[0,1.18,1.03],[-0.08,0.76,1.24],[0,0.58,1.32],[0.18,0.62,1.23]],
      [[-0.38,0.18,1.08],[0,0.12,1.17],[0.38,0.18,1.08]],
      [[-0.3,0.05,1.04],[0,-0.02,1.12],[0.3,0.05,1.04]],
      [[-0.92,0.55,0.55],[-0.66,0.1,0.8],[-0.36,-0.2,0.78],[0,-0.34,0.68],[0.36,-0.2,0.78],[0.66,0.1,0.8],[0.92,0.55,0.55]],
    ];
    faceLines.forEach((p, i) => root.add(curveLine(p, i % 2 ? 0xf5b7df : 0x7de9ef, 0.82)));

    // Eyes with animated lids
    const eyes = [];
    [-0.36, 0.36].forEach((x) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 20, 12),
        new THREE.MeshBasicMaterial({ color: 0xdffcff })
      );
      eye.scale.set(1.35, 0.55, 0.35);
      eye.position.set(x, 0.78, 1.06);
      root.add(eye);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
      iris.position.set(x, 0.78, 1.13);
      root.add(iris);
      eyes.push(eye, iris);
      root.add(curveLine([[x - 0.2,0.82,1.08],[x,0.9,1.13],[x + 0.2,0.82,1.08]], 0xf9a8d4));
      root.add(curveLine([[x - 0.2,0.77,1.09],[x,0.71,1.14],[x + 0.2,0.77,1.09]], 0x67e8f9));
    });

    // Ears and layered holographic hair
    [-1, 1].forEach((side) => {
      const ear = addWireMesh(root, new THREE.TorusGeometry(0.2, 0.035, 8, 28), 0x6ee7f9, 0.76);
      ear.position.set(side * 0.92, 0.62, 0);
      ear.rotation.y = Math.PI / 2;
    });
    for (let i = 0; i < 13; i++) {
      const x = -0.82 + i * 0.137;
      root.add(curveLine([[x,1.25,0.55],[x * 1.06,1.72,0.15],[x * 0.72,1.93,-0.2]], i % 3 === 0 ? 0xf0a6d6 : 0xa5f3fc, 0.72));
    }

    // Neck, shoulders and stethoscope
    root.add(curveLine([[-0.48,-0.28,0.45],[-0.5,-0.75,0.25],[-1.35,-1.05,0]], 0xa5f3fc));
    root.add(curveLine([[0.48,-0.28,0.45],[0.5,-0.75,0.25],[1.35,-1.05,0]], 0xa5f3fc));
    root.add(curveLine([[-1.35,-1.05,0],[-0.75,-1.35,0],[0,-1.45,0],[0.75,-1.35,0],[1.35,-1.05,0]], 0xf5b7df));
    root.add(curveLine([[-0.5,-0.65,0.35],[-0.72,-1.0,0.58],[-0.42,-1.3,0.62],[0,-1.18,0.72],[0.42,-1.3,0.62],[0.72,-1.0,0.58],[0.5,-0.65,0.35]], 0x22d3ee));
    const chestpiece = addWireMesh(root, new THREE.TorusGeometry(0.18, 0.035, 10, 32), 0xf9a8d4, 1);
    chestpiece.position.set(0, -1.18, 0.73);

    addCallout(scene, [0.62, 1.2, 0.4], [2.15, 1.52, 0.25], 0x67e8f9);
    addCallout(scene, [0.72, 0.45, 0.55], [2.35, 0.55, 0.2], 0xf0a6d6);
    addCallout(scene, [-0.75, 0.18, 0.45], [-2.15, 0.12, 0.25], 0xa7f3d0);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.34 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.25;
    scene.add(halo);

    scene.add(new THREE.AmbientLight(0xdffcff, 1.5));
    const key = new THREE.PointLight(0x67e8f9, 4, 12);
    key.position.set(2.5, 2.5, 4); scene.add(key);
    const rim = new THREE.PointLight(0xf9a8d4, 3, 10);
    rim.position.set(-3, 1, 1); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.3;
    controls.maxDistance = 8.5;
    controls.target.set(0, 0.2, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;

    const clock = new THREE.Clock();
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const blinkCycle = t % 4.8;
      const blink = blinkCycle > 4.55 ? Math.max(0.06, Math.abs(blinkCycle - 4.675) / 0.125) : 1;
      eyes.forEach((eye, index) => { eye.scale.y = index % 2 === 0 ? 0.55 * blink : blink; });
      const active = statusRef.current !== "idle";
      root.position.y = -0.05 + Math.sin(t * 1.15) * 0.055;
      halo.rotation.z = t * 0.12;
      halo.material.opacity = active ? 0.68 + Math.sin(t * 4) * 0.14 : 0.3;
      const statusColour = new THREE.Color(STATUS_COLOURS[statusRef.current] || STATUS_COLOURS.idle);
      key.color.lerp(statusColour, 0.08);
      key.intensity = active ? 5.2 : 3.5;
      controls.autoRotateSpeed = statusRef.current === "thinking" ? 1.1 : 0.45;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      controls.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_38%,rgba(220,210,238,.62),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.96),rgba(242,238,247,.82))]">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="Rotatable 3D AI clinician head" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-600 shadow-lg backdrop-blur-xl">
        Drag to rotate · Scroll to zoom
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 text-right">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-cyan-700">Clinical cognition interface</p>
        <p className="text-[10px] text-slate-500">Wire topology · responsive neural state</p>
      </div>
    </div>
  );
}
