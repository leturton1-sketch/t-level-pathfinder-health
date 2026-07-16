import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createWardItem, createTextTexture, WARD_BOUNDS, clampToBounds, checkCollision, SUITE_OFFSET_A, SUITE_OFFSET_B, DEFAULT_PATIENTS } from "@/lib/wardItems";

const WARD_W = 20;
const WARD_D = 16;

function createFloorTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  // White metallic base
  ctx.fillStyle = "#F8F8F8"; ctx.fillRect(0, 0, 512, 512);
  // Metallic gradient sheen
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "rgba(200,215,230,0.18)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.05)");
  grad.addColorStop(1, "rgba(200,215,230,0.18)");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
  // Fine noise for metallic texture
  for (let i = 0; i < 4000; i++) {
    const v = Math.random() > 0.5 ? 255 : 210;
    ctx.fillStyle = `rgba(${v},${v},${v},0.025)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  // Tile grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.04)"; ctx.lineWidth = 1;
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

  // Floor — pale grey
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WARD_W, WARD_D),
    new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 0.2, metalness: 0.6 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.set(ox, 0, oz); floor.receiveShadow = true; scene.add(floor);

  // Walls — pure white, semi-transparent (opacity updated in animation loop)
  const wallMat = () => new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9, transparent: true, opacity: 0.15, side: THREE.DoubleSide });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(WARD_W, 3.5, 0.2), wallMat());
  backWall.position.set(ox, 1.75, oz - WARD_D / 2);
  backWall.userData = { normal: new THREE.Vector3(0, 0, 1) };
  scene.add(backWall); wallsRef.current.push(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat());
  leftWall.position.set(ox - WARD_W / 2, 1.75, oz);
  leftWall.userData = { normal: new THREE.Vector3(1, 0, 0) };
  scene.add(leftWall); wallsRef.current.push(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat());
  rightWall.position.set(ox + WARD_W / 2, 1.75, oz);
  rightWall.userData = { normal: new THREE.Vector3(-1, 0, 0) };
  scene.add(rightWall); wallsRef.current.push(rightWall);

  // Ceiling lights — long thin fixtures
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xF8F8FF, emissiveIntensity: 0.6, roughness: 0.3 });
  [-4, 4].forEach(x => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.4), lightMat);
    light.position.set(ox + x, 3.3, oz); scene.add(light);
  });

  // Suite label — outside the back wall, dark navy text
  const labelTex = createTextTexture(label, 256, 64, "#2C3E50", "#FFFFFF");
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.85), new THREE.MeshBasicMaterial({ map: labelTex, side: THREE.DoubleSide }));
  labelMesh.position.set(ox, 3.2, oz - WARD_D / 2 - 0.2); scene.add(labelMesh);

  
}

function disposeMesh(child) {
  if (child.isMesh) { child.geometry?.dispose(); }
}

export default function Ward3D({
  items = [], editMode = false, selectedItemId = null, snapToGrid = true,
  selectedItemForPlacement = null, suite = "both", cameraCommand = null,
  onItemSelect, onItemMove, onItemPlace, onBedClick,
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

  stateRef.current = { editMode, snapToGrid, items, selectedItemId, selectedItemForPlacement, onItemSelect, onItemMove, onItemPlace, onBedClick };

  // Filter items by visible suite
  const visibleItems = suite === "A" ? items.filter(i => i.x < 0) : suite === "B" ? items.filter(i => i.x >= 0) : items;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAFAFA);
    scene.fog = new THREE.Fog(0xFAFAFA, 45, 85);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    let camPos, camTarget;
    if (suite === "A") { camPos = { x: -15, y: 10, z: 16 }; camTarget = { x: -15, y: 0, z: 0 }; }
    else if (suite === "B") { camPos = { x: 15, y: 10, z: 16 }; camTarget = { x: 15, y: 0, z: 0 }; }
    else { camPos = { x: 0, y: 16, z: 28 }; camTarget = { x: 0, y: 0, z: 0 }; }
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
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(camTarget.x, camTarget.y, camTarget.z);
    if (editMode) {
      controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    } else {
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    }
    controlsRef.current = controls;

    // Soft natural lighting
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.55));
    const sunLight = new THREE.DirectionalLight(0xFFF8F0, 0.5);
    sunLight.position.set(10, 25, 10); sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.radius = 6; scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0xEEF2FF, 0.2);
    fillLight.position.set(-10, 15, -10); scene.add(fillLight);

    // Build wards
    wallsRef.current = [];
    if (suite === "A" || suite === "both") buildWard(scene, SUITE_OFFSET_A, "Clinical Suite A", wallsRef);
    if (suite === "B" || suite === "both") buildWard(scene, SUITE_OFFSET_B, "Clinical Suite B", wallsRef);

    // Ground for raycasting
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ visible: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
    groundRef.current = ground;

    // Grid in edit mode
    if (editMode) {
      const grid = new THREE.GridHelper(50, 50, 0x2C3E50, 0xAABBCC);
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
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) {
            const item = st.items.find(i => i.id === obj.userData.itemId);
            if (item?.type === "bed") bedId = obj.userData.itemId;
          }
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

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

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
        wall.material.opacity = 0.05 + Math.max(0, -dot) * 0.2;
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
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [editMode, suite]);

  // Camera command
  useEffect(() => {
    if (!cameraCommand?.nonce) return;
    if (cameraCommand.type === "reset") {
      const s = suite;
      if (s === "A") cameraTargetRef.current = { pos: new THREE.Vector3(-15, 10, 16), look: new THREE.Vector3(-15, 0, 0) };
      else if (s === "B") cameraTargetRef.current = { pos: new THREE.Vector3(15, 10, 16), look: new THREE.Vector3(15, 0, 0) };
      else cameraTargetRef.current = { pos: new THREE.Vector3(0, 16, 28), look: new THREE.Vector3(0, 0, 0) };
    } else if (cameraCommand.type === "focus" && cameraCommand.target) {
      const { x, z } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x + 4, 4, z + 4), look: new THREE.Vector3(x, 1, z) };
    } else if (cameraCommand.type === "suite" && cameraCommand.target) {
      const { x, z } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x, 10, z), look: new THREE.Vector3(x, 0, 0) };
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
        if (old.designation !== item.designation) { scene.remove(mesh); mesh.traverse(disposeMesh); map.delete(item.id); mesh = null; }
      }
      if (!mesh) {
        const patient = DEFAULT_PATIENTS[item.designation];
        const options = { designation: item.designation, alert: patient?.status === "red" };
        mesh = createWardItem(item.type, options);
        mesh.userData = { itemId: item.id, itemOptions: options };
        scene.add(mesh); map.set(item.id, mesh);
      }
      mesh.position.set(item.x, 0, item.z);
      mesh.rotation.y = item.rotationY || 0;
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
  }, [visibleItems, selectedItemId, editMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-slate-600 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none border border-slate-200">
        {editMode
          ? "EDIT MODE · Drag items to reposition · Right-click drag to orbit · Scroll to zoom"
          : "Left-drag to orbit · Scroll to zoom · Click a bed to inspect"}
      </div>
    </div>
  );
}