import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const SUITE_W = 18;
const SUITE_D = 14;
const SUITE_OFFSET_A = { x: -13, z: 0 };
const SUITE_OFFSET_B = { x: 13, z: 0 };

function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F4F4F4";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#D8D8D8";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createTextTexture(text, w = 256, h = 64, color = "#555", bg = "transparent") {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.55)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(canvas);
}

function buildSuite(scene, offset, suiteLabel, patients, bedGroups) {
  const { x: ox, z: oz } = offset;

  // Floor with grid pattern
  const gridTex = createGridTexture();
  const floorGeo = new THREE.PlaneGeometry(SUITE_W, SUITE_D);
  const floorMat = new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ox, 0, oz);
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls — U-shape (back, left, right)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeaecec, roughness: 0.9 });
  const backWallGeo = new THREE.BoxGeometry(SUITE_W, 3.5, 0.15);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(ox, 1.75, oz - SUITE_D / 2);
  scene.add(backWall);

  const sideWallGeo = new THREE.BoxGeometry(0.15, 3.5, SUITE_D);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.position.set(ox - SUITE_W / 2, 1.75, oz);
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.position.set(ox + SUITE_W / 2, 1.75, oz);
  scene.add(rightWall);

  // Suite label on back wall
  const labelTex = createTextTexture(suiteLabel, 256, 64, "#888", "#eaecec");
  const labelGeo = new THREE.PlaneGeometry(3, 0.75);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(ox, 3, oz - SUITE_D / 2 + 0.1);
  scene.add(label);

  // Ceiling light fixtures
  const lightFixMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfffef0,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  const bedPositions = [
    { x: -4, z: 2.5 },
    { x: 0.5, z: 2.5 },
    { x: -4, z: -2.5 },
    { x: 0.5, z: -2.5 },
  ];

  bedPositions.forEach((pos) => {
    const fixGeo = new THREE.BoxGeometry(2.5, 0.1, 0.7);
    const fix = new THREE.Mesh(fixGeo, lightFixMat);
    fix.position.set(ox + pos.x, 3.3, oz + pos.z);
    scene.add(fix);
  });

  // Nurse station ceiling light
  const nsFixGeo = new THREE.BoxGeometry(3, 0.1, 1);
  const nsFix = new THREE.Mesh(nsFixGeo, lightFixMat);
  nsFix.position.set(ox + 6, 3.3, oz);
  scene.add(nsFix);

  // Translucent partition material
  const partitionMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });

  // Beds
  bedPositions.forEach((pos, idx) => {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(ox + pos.x, 0, oz + pos.z);
    bedGroup.userData = { bedIndex: idx, isBed: true };

    const patient = patients[idx];
    const statusColor = !patient
      ? 0xcccccc
      : patient.news2_score >= 7
      ? 0xffaaaa
      : patient.news2_score >= 5
      ? 0xffd180
      : 0xa5d6a4;

    // Bed frame
    const frameGeo = new THREE.BoxGeometry(1.8, 0.4, 2.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, roughness: 0.4, metalness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.4;
    frame.castShadow = true;
    bedGroup.add(frame);

    // Mattress
    const mattressGeo = new THREE.BoxGeometry(1.6, 0.15, 2.3);
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.8 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.y = 0.68;
    bedGroup.add(mattress);

    // Pillow
    const pillowGeo = new THREE.BoxGeometry(1.2, 0.1, 0.5);
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(0, 0.8, -0.8);
    bedGroup.add(pillow);

    // Headboard
    const headGeo = new THREE.BoxGeometry(1.9, 0.8, 0.1);
    const headboard = new THREE.Mesh(headGeo, frameMat);
    headboard.position.set(0, 0.7, -1.25);
    bedGroup.add(headboard);

    // Indicator post
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0.8, 1.5, -1.1);
    bedGroup.add(post);

    // Indicator display
    const dispGeo = new THREE.BoxGeometry(0.4, 0.3, 0.05);
    const dispMat = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 0.6,
    });
    const display = new THREE.Mesh(dispGeo, dispMat);
    display.position.set(0.8, 2.7, -1.1);
    bedGroup.add(display);

    // Patient body
    if (patient) {
      const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: statusColor,
        roughness: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 1.0, 0);
      body.rotation.z = Math.PI / 2;
      bedGroup.add(body);

      // Monitor
      const monGeo = new THREE.BoxGeometry(0.4, 0.5, 0.05);
      const monMat = new THREE.MeshStandardMaterial({
        color: statusColor,
        emissive: statusColor,
        emissiveIntensity: 0.4,
      });
      const monitor = new THREE.Mesh(monGeo, monMat);
      monitor.position.set(-1, 1.3, 0);
      bedGroup.add(monitor);

      const standGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(-1, 0.65, 0);
      bedGroup.add(stand);
    }

    // Partitions
    if (idx % 2 === 0) {
      const partGeo = new THREE.PlaneGeometry(2.8, 2.2);
      const partition = new THREE.Mesh(partGeo, partitionMat);
      partition.position.set(1.15, 1.5, 0);
      partition.rotation.y = Math.PI / 2;
      bedGroup.add(partition);
    }
    if (idx < 2) {
      const partGeo = new THREE.PlaneGeometry(2.5, 2.2);
      const partition = new THREE.Mesh(partGeo, partitionMat);
      partition.position.set(0, 1.5, -2.5);
      bedGroup.add(partition);
    }

    // Bed label on headboard
    const bedLabelTex = createTextTexture(`${suiteLabel}-${idx + 1}`, 128, 48, "#666", "transparent");
    const bedLabelGeo = new THREE.PlaneGeometry(0.7, 0.26);
    const bedLabelMat = new THREE.MeshBasicMaterial({ map: bedLabelTex, transparent: true });
    const bedLabel = new THREE.Mesh(bedLabelGeo, bedLabelMat);
    bedLabel.position.set(0, 1.15, -1.26);
    bedGroup.add(bedLabel);

    scene.add(bedGroup);
    bedGroups.push(bedGroup);
  });

  // Nurse station
  const nsGroup = new THREE.Group();
  nsGroup.position.set(ox + 6, 0, oz);

  const deskGeo = new THREE.BoxGeometry(3.5, 0.8, 1.5);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xd0d5db, roughness: 0.4, metalness: 0.3 });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.y = 0.6;
  desk.castShadow = true;
  nsGroup.add(desk);

  const topGeo = new THREE.BoxGeometry(3.7, 0.08, 1.7);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xe0e5eb, roughness: 0.2 });
  const deskTop = new THREE.Mesh(topGeo, topMat);
  deskTop.position.y = 1.04;
  nsGroup.add(deskTop);

  const monScreenGeo = new THREE.BoxGeometry(0.8, 0.5, 0.04);
  const monScreenMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    emissive: 0x2c3e50,
    emissiveIntensity: 0.2,
  });
  const monScreen = new THREE.Mesh(monScreenGeo, monScreenMat);
  monScreen.position.set(0, 1.5, -0.3);
  nsGroup.add(monScreen);

  const monStandGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
  const monStandMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
  const monStand = new THREE.Mesh(monStandGeo, monStandMat);
  monStand.position.set(0, 1.2, -0.3);
  nsGroup.add(monStand);

  const nsLabelTex = createTextTexture("NURSE STATION", 256, 48, "#666", "transparent");
  const nsLabelGeo = new THREE.PlaneGeometry(2, 0.38);
  const nsLabelMat = new THREE.MeshBasicMaterial({ map: nsLabelTex, transparent: true });
  const nsLabel = new THREE.Mesh(nsLabelGeo, nsLabelMat);
  nsLabel.position.set(0, 1.35, 0.76);
  nsLabel.rotation.x = -Math.PI / 2;
  nsGroup.add(nsLabel);

  scene.add(nsGroup);
}

export default function Ward3D({ patients = [], onBedClick, selectedBed = null, suite = "A" }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const bedMeshesRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 30, 70);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);

    let camPos, camTarget;
    if (suite === "both") {
      camPos = { x: 0, y: 16, z: 28 };
      camTarget = { x: 0, y: 0, z: 0 };
    } else {
      const off = suite === "A" ? SUITE_OFFSET_A : SUITE_OFFSET_B;
      camPos = { x: off.x + 8, y: 10, z: 16 };
      camTarget = { x: off.x, y: 0, z: 0 };
    }
    camera.position.set(camPos.x, camPos.y, camPos.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.target.set(camTarget.x, camTarget.y, camTarget.z);
    controlsRef.current = controls;

    // Lighting — bright, clinical
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.3);
    fillLight.position.set(-10, 15, -10);
    scene.add(fillLight);

    bedMeshesRef.current = [];

    // Build suites based on selection
    if (suite === "A" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_A, "Suite A", patients, bedMeshesRef.current);
    }
    if (suite === "B" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_B, "Suite B", patients, bedMeshesRef.current);
    }

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Click handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bedMeshesRef.current, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.isBed) obj = obj.parent;
        if (obj.userData.isBed) {
          onBedClick?.(obj.userData.bedIndex);
        }
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [patients, onBedClick, suite]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-slate-500 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none border border-slate-200">
        Drag to rotate · Scroll to zoom · Tap a bed to interact
      </div>
    </div>
  );
}