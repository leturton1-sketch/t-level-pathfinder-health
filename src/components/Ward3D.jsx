import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createWardItem, createTextTexture, clampToBounds, checkCollision, SUITE_OFFSETS, SUITE_LABELS, DEFAULT_PATIENTS } from "@/lib/wardItems";
import WardItemDropdown from "@/components/WardItemDropdown";
import { getPatientForBed } from "@/lib/wardPatients";

const WARD_W = 20;
const WARD_D = 16;

function createFloorTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  // Ivory/off-white high-gloss base
  ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, 512, 512);
  // Polished gloss gradient sheen
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "rgba(245,242,232,0.2)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(245,242,232,0.2)");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
  // Subtle polished noise
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(255,253,248,0.02)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  // Very subtle tile lines
  ctx.strokeStyle = "rgba(0,0,0,0.015)"; ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 3);
  return t;
}

function buildWard(scene, offset, label, wallsRef) {
  const { x: ox, z: oz } = offset;

  // Raised, polished pastel floor slab
  const floorTint = label.includes("Suite A") ? 0xFBE5EE
    : label.includes("Suite B") ? 0xE2F4E8
    : label.includes("Theory") ? 0xFFF7CD
    : 0xDCEFFA;
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(WARD_W, 0.28, WARD_D),
    new THREE.MeshPhysicalMaterial({
      map: createFloorTexture(), color: floorTint, roughness: 0.16, metalness: 0.08,
      clearcoat: 0.75, clearcoatRoughness: 0.12,
    })
  );
  floor.position.set(ox, -0.14, oz); floor.receiveShadow = true; floor.castShadow = true; scene.add(floor);

  // Camera-facing room marker: remains readable from every orbit angle and zoom level
  const labelTexture = createTextTexture(label.toUpperCase(), 1024, 160, "#1F4B5C", "rgba(247,252,255,0.94)");
  const floorLabel = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTexture, transparent: true, depthTest: false, depthWrite: false,
  }));
  floorLabel.position.set(ox, 4.25, oz - 5.8);
  floorLabel.scale.set(9.5, 1.5, 1);
  floorLabel.renderOrder = 50;
  floorLabel.userData.isRoomLabel = true;
  scene.add(floorLabel);

  // Thick white-grey glass walls with studio highlights
  const wallMat = () => new THREE.MeshPhysicalMaterial({
    color: 0xEEF2F0, roughness: 0.24, metalness: 0.03, transmission: 0.08,
    clearcoat: 0.8, clearcoatRoughness: 0.16, transparent: true, opacity: 0.34,
    side: THREE.DoubleSide,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(WARD_W, 3.5, 0.2), wallMat());
  backWall.position.set(ox, 1.75, oz - WARD_D / 2);
  backWall.userData = { normal: new THREE.Vector3(0, 0, 1) };
  backWall.castShadow = true; backWall.receiveShadow = true;
  scene.add(backWall); wallsRef.current.push(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat());
  leftWall.position.set(ox - WARD_W / 2, 1.75, oz);
  leftWall.userData = { normal: new THREE.Vector3(1, 0, 0) };
  leftWall.castShadow = true; leftWall.receiveShadow = true;
  scene.add(leftWall); wallsRef.current.push(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat());
  rightWall.position.set(ox + WARD_W / 2, 1.75, oz);
  rightWall.userData = { normal: new THREE.Vector3(-1, 0, 0) };
  rightWall.castShadow = true; rightWall.receiveShadow = true;
  scene.add(rightWall); wallsRef.current.push(rightWall);

  // Ceiling lights — long thin fixtures
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xF8F8FF, emissiveIntensity: 0.6, roughness: 0.3 });
  [-4, 4].forEach(x => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.4), lightMat);
    light.position.set(ox + x, 3.3, oz); scene.add(light);
  });

  }

function disposeMesh(child) {
  if (child.isMesh) { child.geometry?.dispose(); }
}

export default function Ward3D({
  items = [], editMode = false, selectedItemId = null, snapToGrid = true,
  selectedItemForPlacement = null, suite = "both", cameraCommand = null,
  onItemSelect, onItemMove, onItemPlace, onBedClick, onSelectItemType,
  activeCallBed = null,
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const groundRef = useRef(null);
  const itemsMapRef = useRef(new Map());
  const itemsArrayRef = useRef([]);
  const wallsRef = useRef([]);
  const animFrameRef = useRef(null);
  const cameraTargetRef = useRef(null);
  const dragRef = useRef({ active: false, itemId: null, startX: 0, startY: 0, moved: false });
  const hoveredBedRef = useRef(null);
  const stateRef = useRef({});
  const [bedTooltip, setBedTooltip] = useState(null);

  stateRef.current = { editMode, snapToGrid, items, selectedItemId, selectedItemForPlacement, onItemSelect, onItemMove, onItemPlace, onBedClick };

  // Filter items by visible suite
  const visibleItems = suite === "A" ? items.filter(i => i.x < -15)
    : suite === "B" ? items.filter(i => i.x >= -15 && i.x < 15 && i.z < 15)
    : suite === "C" ? items.filter(i => i.x >= 15)
    : suite === "D" ? items.filter(i => i.z >= 15)
    : items;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAFAFA);
    scene.fog = new THREE.Fog(0xFAFAFA, 80, 160);
    sceneRef.current = scene;

    // Clear stale item meshes from previous scene so they re-create in the new one
    itemsMapRef.current.clear();
    itemsArrayRef.current = [];

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    const SUITE_CAMERAS = {
      A: { pos: { x: -30, y: 10, z: 16 }, target: { x: -30, y: 0, z: 0 } },
      B: { pos: { x: 0, y: 10, z: 16 }, target: { x: 0, y: 0, z: 0 } },
      C: { pos: { x: 30, y: 10, z: 16 }, target: { x: 30, y: 0, z: 0 } },
      D: { pos: { x: 0, y: 10, z: 41 }, target: { x: 0, y: 0, z: 25 } },
      all: { pos: { x: 0, y: 35, z: 55 }, target: { x: 0, y: 0, z: 12 } },
    };
    const cam = SUITE_CAMERAS[suite] || SUITE_CAMERAS.all;
    const camPos = cam.pos, camTarget = cam.target;
    camera.position.set(camPos.x, camPos.y, camPos.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 3;
    controls.maxDistance = 120;
    controls.target.set(camTarget.x, camTarget.y, camTarget.z);
    if (editMode) {
      controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    } else {
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    }
    controlsRef.current = controls;

    // Bright medical studio lighting with soft grey-green bounce
    scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xB8CEC2, 1.1));
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.72));
    const sunLight = new THREE.DirectionalLight(0xFFFDF8, 1.15);
    sunLight.position.set(10, 25, 10); sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.radius = 6; scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0xDFF7EA, 0.55);
    fillLight.position.set(-10, 15, -10); scene.add(fillLight);

    // Build wards
    wallsRef.current = [];
    const suitesToBuild = suite === "all" ? ["A", "B", "C", "D"] : [suite];
    suitesToBuild.forEach(s => buildWard(scene, SUITE_OFFSETS[s], SUITE_LABELS[s], wallsRef));

    // Ground for raycasting
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ visible: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
    groundRef.current = ground;

    // Grid in edit mode
    if (editMode) {
      const grid = new THREE.GridHelper(100, 100, 0x2C3E50, 0xAABBCC);
      grid.position.y = 0.01; grid.material.opacity = 0.3; grid.material.transparent = true;
      scene.add(grid);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const getMouse = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
    };

    const onPointerDown = (event) => {
      const st = stateRef.current;
      if (!st.editMode) return;
      getMouse(event);
      const hits = raycaster.intersectObjects(itemsArrayRef.current, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj.parent && !obj.userData.itemId) obj = obj.parent;
        if (obj.userData.itemId) {
          dragRef.current = { active: false, itemId: obj.userData.itemId, startX: event.clientX, startY: event.clientY, moved: false };
          controls.enabled = false;
        }
      }
    };

    const onPointerMove = (event) => {
      const st = stateRef.current;
      getMouse(event);
      if (dragRef.current.itemId && !dragRef.current.active) {
        const dx = event.clientX - dragRef.current.startX;
        const dy = event.clientY - dragRef.current.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 5) dragRef.current.active = true;
      }
      if (dragRef.current.active) {
        const groundHits = raycaster.intersectObject(ground, false);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          let x = pt.x, z = pt.z;
          if (st.snapToGrid) { x = Math.round(x); z = Math.round(z); }
          const clamped = clampToBounds(x, z);
          if (!checkCollision(dragRef.current.itemId, clamped.x, clamped.z, st.items)) {
            const mesh = itemsMapRef.current.get(dragRef.current.itemId);
            if (mesh) mesh.position.set(clamped.x, 0, clamped.z);
          }
        }
        return;
      }
      if (!st.editMode) {
        const hits = raycaster.intersectObjects(itemsArrayRef.current, true);
        let bedId = null;
        let bedDetails = null;
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) {
            const item = st.items.find(i => i.id === obj.userData.itemId);
            if (item?.type === "bed") {
              bedId = obj.userData.itemId;
              const patient = getPatientForBed(item.designation);
              bedDetails = {
                designation: item.designation || "Unnumbered",
                name: patient?.name || "No patient allocated",
                nhsNumber: patient?.nhs_number || "Not assigned",
              };
            }
          }
        }
        if (bedDetails) {
          const rect = renderer.domElement.getBoundingClientRect();
          setBedTooltip({
            ...bedDetails,
            left: Math.min(event.clientX - rect.left + 16, Math.max(12, rect.width - 248)),
            top: Math.min(event.clientY - rect.top + 16, Math.max(12, rect.height - 104)),
          });
        } else {
          setBedTooltip(null);
        }
        if (bedId !== hoveredBedRef.current) {
          if (hoveredBedRef.current) {
            const prev = itemsMapRef.current.get(hoveredBedRef.current);
            const ring = prev?.children.find(c => c.name === "hoverRing");
            if (ring) { prev.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
          }
          if (bedId) {
            const mesh = itemsMapRef.current.get(bedId);
            if (mesh) {
              const ring = new THREE.Mesh(
                new THREE.RingGeometry(1.2, 1.4, 32),
                new THREE.MeshBasicMaterial({ color: 0x4488ff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
              );
              ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.name = "hoverRing";
              mesh.add(ring);
            }
          }
          hoveredBedRef.current = bedId;
          renderer.domElement.style.cursor = bedId ? "pointer" : "default";
        }
      }
    };

    const onPointerUp = (event) => {
      const st = stateRef.current;
      if (st.editMode) {
        if (dragRef.current.itemId) {
          if (dragRef.current.active) {
            const mesh = itemsMapRef.current.get(dragRef.current.itemId);
            if (mesh) st.onItemMove?.(dragRef.current.itemId, mesh.position.x, mesh.position.z);
          } else {
            st.onItemSelect?.(dragRef.current.itemId);
          }
          controls.enabled = true;
          dragRef.current = { active: false, itemId: null, startX: 0, startY: 0, moved: false };
          return;
        }
        if (st.selectedItemForPlacement) {
          getMouse(event);
          const groundHits = raycaster.intersectObject(ground, false);
          if (groundHits.length > 0) {
            const pt = groundHits[0].point;
            let x = pt.x, z = pt.z;
            if (st.snapToGrid) { x = Math.round(x); z = Math.round(z); }
            const clamped = clampToBounds(x, z);
            if (!checkCollision(null, clamped.x, clamped.z, st.items)) {
              st.onItemPlace?.(st.selectedItemForPlacement, clamped.x, clamped.z);
            }
          }
        } else if (st.selectedItemId) {
          st.onItemSelect?.(null);
        }
      } else {
        getMouse(event);
        const hits = raycaster.intersectObjects(itemsArrayRef.current, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) st.onBedClick?.(obj.userData.itemId);
        }
      }
    };

    const onPointerLeave = () => {
      setBedTooltip(null);
      if (hoveredBedRef.current) {
        const previousBed = itemsMapRef.current.get(hoveredBedRef.current);
        const ring = previousBed?.children.find(c => c.name === "hoverRing");
        if (ring) { previousBed.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
      }
      hoveredBedRef.current = null;
      renderer.domElement.style.cursor = "default";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    // Animation loop with wall opacity update + camera lerp
    const camDir = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Update wall opacity based on camera angle
      camera.getWorldDirection(camDir);
      wallsRef.current.forEach(wall => {
        toCam.subVectors(camera.position, wall.position).normalize();
        const dot = toCam.dot(wall.userData.normal);
        // dot > 0: camera is outside this wall → transparent (see through)
        // dot < 0: camera is inside → more opaque
        wall.material.opacity = 0.18 + Math.max(0, -dot) * 0.28;
      });

      const pulse = 0.55 + Math.sin(performance.now() * 0.009) * 0.35;
      itemsMapRef.current.forEach((itemMesh) => {
        const marker = itemMesh.children.find((child) => child.name === "callBellMarker");
        if (marker) {
          marker.scale.setScalar(0.92 + pulse * 0.16);
          marker.children.forEach((child) => { if (child.material) child.material.opacity = pulse; });
        }
      });

      // Camera lerp
      if (cameraTargetRef.current) {
        camera.position.lerp(cameraTargetRef.current.pos, 0.08);
        controls.target.lerp(cameraTargetRef.current.look, 0.08);
        if (camera.position.distanceTo(cameraTargetRef.current.pos) < 0.3) cameraTargetRef.current = null;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [editMode, suite]);

  // Camera command
  useEffect(() => {
    if (!cameraCommand?.nonce) return;
    if (cameraCommand.type === "reset") {
      const SUITE_CAM_RESET = {
        A: { pos: new THREE.Vector3(-30, 10, 16), look: new THREE.Vector3(-30, 0, 0) },
        B: { pos: new THREE.Vector3(0, 10, 16), look: new THREE.Vector3(0, 0, 0) },
        C: { pos: new THREE.Vector3(30, 10, 16), look: new THREE.Vector3(30, 0, 0) },
        D: { pos: new THREE.Vector3(0, 10, 41), look: new THREE.Vector3(0, 0, 25) },
        all: { pos: new THREE.Vector3(0, 35, 55), look: new THREE.Vector3(0, 0, 12) },
      };
      cameraTargetRef.current = SUITE_CAM_RESET[suite] || SUITE_CAM_RESET.all;
    } else if (cameraCommand.type === "focus" && cameraCommand.target) {
      const { x, z } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x + 4, 4, z + 4), look: new THREE.Vector3(x, 1, z) };
    } else if (cameraCommand.type === "suite" && cameraCommand.target) {
      const { x, z, lookZ = 0 } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x, 10, z), look: new THREE.Vector3(x, 0, lookZ) };
    }
  }, [cameraCommand, suite]);

  // Diff-based item rendering
  useEffect(() => {
    if (!sceneRef.current) return;
    const map = itemsMapRef.current;
    const scene = sceneRef.current;

    map.forEach((mesh) => {
      const ring = mesh.children.find(c => c.name === "selectionRing");
      if (ring) { mesh.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
      const callMarker = mesh.children.find(c => c.name === "callBellMarker");
      if (callMarker) { mesh.remove(callMarker); callMarker.traverse(disposeMesh); }
    });

    if (!editMode && !visibleItems.length) { return; }

    const currentIds = new Set(visibleItems.map(i => i.id));

    map.forEach((mesh, id) => {
      if (!currentIds.has(id)) { scene.remove(mesh); mesh.traverse(disposeMesh); map.delete(id); }
    });

    visibleItems.forEach((item) => {
      let mesh = map.get(item.id);
      if (mesh) {
        const old = mesh.userData.itemOptions || {};
        const patient = getPatientForBed(item.designation);
        if (old.designation !== item.designation || old.patientId !== patient?.id) { scene.remove(mesh); mesh.traverse(disposeMesh); map.delete(item.id); mesh = null; }
      }
      if (!mesh) {
        const patient = getPatientForBed(item.designation);
        const statusPatient = DEFAULT_PATIENTS[item.designation];
        const options = { designation: item.designation, alert: statusPatient?.status === "red", patient, patientId: patient?.id };
        mesh = createWardItem(item.type, options);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        mesh.userData = { itemId: item.id, itemOptions: options };
        scene.add(mesh); map.set(item.id, mesh);
      }
      mesh.position.set(item.x, 0, item.z);
      mesh.rotation.y = item.rotationY || 0;
      if (item.type === "bed" && item.designation === activeCallBed) {
        const marker = new THREE.Group();
        marker.name = "callBellMarker";
        marker.position.set(0, 3.2, 0);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 12, 32), new THREE.MeshBasicMaterial({ color: 0xFC4421, transparent: true, opacity: 0.9 }));
        halo.rotation.x = Math.PI / 2;
        const bell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), new THREE.MeshStandardMaterial({ color: 0xFF9567, emissive: 0xFC4421, emissiveIntensity: 2, transparent: true, opacity: 1 }));
        const light = new THREE.PointLight(0xFC4421, 3, 8);
        marker.add(halo, bell, light);
        mesh.add(marker);
      }
      if (item.id === selectedItemId) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.9, 1.15, 32),
          new THREE.MeshBasicMaterial({ color: 0x4488ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.name = "selectionRing";
        mesh.add(ring);
      }
    });

    itemsArrayRef.current = Array.from(map.values());
  }, [visibleItems, selectedItemId, editMode, activeCallBed]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {bedTooltip && !editMode && (
        <div
          className="pointer-events-none absolute z-40 w-[232px] rounded-2xl border border-white/90 bg-slate-950/90 px-3.5 py-3 text-white shadow-[0_18px_45px_-18px_rgba(15,23,42,.9)] backdrop-blur-xl"
          style={{ left: bedTooltip.left, top: bedTooltip.top }}
          role="tooltip"
        >
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">Bed {bedTooltip.designation}</p>
          <p className="mt-1 text-sm font-bold">{bedTooltip.name}</p>
          <p className="mt-1 text-[11px] text-slate-300"><span className="font-semibold text-white">NHS number:</span> {bedTooltip.nhsNumber}</p>
        </div>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="polished-glass-edge pointer-events-none whitespace-nowrap rounded-xl border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-lg backdrop-blur-xl">
          {editMode
            ? "EDIT MODE · Every item is moveable · Drag to position · Scroll to zoom"
            : "Left-drag to orbit · Scroll to zoom · Click a bed to inspect"}
        </div>
        {editMode && (
          <WardItemDropdown
            selectedItemForPlacement={selectedItemForPlacement}
            onSelectItemType={onSelectItemType}
          />
        )}
      </div>
    </div>
  );
}