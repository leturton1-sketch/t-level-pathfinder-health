import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createWardItem } from "@/lib/wardItems";

const SUITE_W = 18;
const SUITE_D = 14;
const SUITE_OFFSET_A = { x: -13, z: 0 };
const SUITE_OFFSET_B = { x: 13, z: 0 };

function createVinylTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#D5D2CD"; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4);
  return t;
}

function createTextTexture(text, w = 256, h = 64, color = "#666", bg = "transparent") {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.55)}px Arial`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(c);
}

function buildSuite(scene, offset, suiteLabel, patients, bedGroups, showFurniture = true) {
  const { x: ox, z: oz } = offset;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(SUITE_W, SUITE_D),
    new THREE.MeshStandardMaterial({ map: createVinylTexture(), roughness: 0.85, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.set(ox, 0, oz); floor.receiveShadow = true; scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2dfd8, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(SUITE_W, 3.5, 0.15), wallMat);
  backWall.position.set(ox, 1.75, oz - SUITE_D / 2); scene.add(backWall);
  const sideWallGeo = new THREE.BoxGeometry(0.15, 3.5, SUITE_D);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat); leftWall.position.set(ox - SUITE_W / 2, 1.75, oz); scene.add(leftWall);
  const rightWall = new THREE.Mesh(sideWallGeo, wallMat); rightWall.position.set(ox + SUITE_W / 2, 1.75, oz); scene.add(rightWall);

  const labelTex = createTextTexture(suiteLabel, 256, 64, "#888", "#e2dfd8");
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: labelTex }));
  label.position.set(ox, 3, oz - SUITE_D / 2 + 0.1); scene.add(label);

  const lightFixMat = new THREE.MeshStandardMaterial({ color: 0xf8f5ef, emissive: 0xfff5e0, emissiveIntensity: 0.4, roughness: 0.3 });
  const bedPositions = [{ x: -4, z: 2.5 }, { x: 0.5, z: 2.5 }, { x: -4, z: -2.5 }, { x: 0.5, z: -2.5 }];
  bedPositions.forEach((pos) => {
    const fix = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.7), lightFixMat);
    fix.position.set(ox + pos.x, 3.3, oz + pos.z); scene.add(fix);
  });
  const nsFix = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), lightFixMat);
  nsFix.position.set(ox + 6, 3.3, oz); scene.add(nsFix);

  if (!showFurniture) return;

  const partitionMat = new THREE.MeshStandardMaterial({ color: 0xdcd9d3, transparent: true, opacity: 0.2, roughness: 0.1, side: THREE.DoubleSide });

  bedPositions.forEach((pos, idx) => {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(ox + pos.x, 0, oz + pos.z);
    bedGroup.userData = { bedIndex: idx, isBed: true };

    const patient = patients[idx];
    const statusColor = !patient ? 0xcccccc : patient.news2_score >= 7 ? 0xffaaaa : patient.news2_score >= 5 ? 0xffd180 : 0xa5d6a4;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, roughness: 0.4, metalness: 0.5 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 2.5), frameMat);
    frame.position.y = 0.4; frame.castShadow = true; bedGroup.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 2.3), new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.8 }));
    mattress.position.y = 0.68; bedGroup.add(mattress);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0xedebe5, roughness: 0.8 }));
    pillow.position.set(0, 0.8, -0.8); bedGroup.add(pillow);
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.1), frameMat);
    headboard.position.set(0, 0.7, -1.25); bedGroup.add(headboard);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 }));
    post.position.set(0.8, 1.5, -1.1); bedGroup.add(post);
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: statusColor, emissive: statusColor, emissiveIntensity: 0.6 }));
    display.position.set(0.8, 2.7, -1.1); bedGroup.add(display);

    if (patient) {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 4, 8), new THREE.MeshStandardMaterial({ color: statusColor, roughness: 0.6, transparent: true, opacity: 0.7 }));
      body.position.set(0, 1.0, 0); body.rotation.z = Math.PI / 2; bedGroup.add(body);
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: statusColor, emissive: statusColor, emissiveIntensity: 0.4 }));
      mon.position.set(-1, 1.3, 0); bedGroup.add(mon);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
      stand.position.set(-1, 0.65, 0); bedGroup.add(stand);
    }

    if (idx % 2 === 0) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), partitionMat);
      p.position.set(1.15, 1.5, 0); p.rotation.y = Math.PI / 2; bedGroup.add(p);
    }
    if (idx < 2) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.2), partitionMat);
      p.position.set(0, 1.5, -2.5); bedGroup.add(p);
    }

    const prefix = suiteLabel.includes("A") ? "A" : "B";
    const blTex = createTextTexture(`${prefix}${idx + 1}`, 128, 48, "#555", "transparent");
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.26), new THREE.MeshBasicMaterial({ map: blTex, transparent: true }));
    bl.position.set(0, 1.15, -1.26); bedGroup.add(bl);

    scene.add(bedGroup); bedGroups.push(bedGroup);
  });

  const ns = new THREE.Group(); ns.position.set(ox + 6, 0, oz);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: 0xcac6bf, roughness: 0.4, metalness: 0.3 }));
  desk.position.y = 0.6; desk.castShadow = true; ns.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.08, 1.7), new THREE.MeshStandardMaterial({ color: 0xd8d4cd, roughness: 0.2 }));
  top.position.y = 1.04; ns.add(top);
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0.2 }));
  mon.position.set(0, 1.5, -0.3); ns.add(mon);
  const mStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 }));
  mStand.position.set(0, 1.2, -0.3); ns.add(mStand);
  const nsLab = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.38), new THREE.MeshBasicMaterial({ map: createTextTexture("NURSE STATION", 256, 48, "#666", "transparent"), transparent: true }));
  nsLab.position.set(0, 1.35, 0.76); nsLab.rotation.x = -Math.PI / 2; ns.add(nsLab);
  scene.add(ns);
}

function disposeMesh(child) {
  if (child.isMesh) {
    child.geometry?.dispose();
    if (child.material?.userData?.disposable) child.material.dispose();
  }
}

export default function Ward3D({
  patients = [], onBedClick, selectedBed = null, suite = "A",
  editMode = false, placedItems = [], selectedItemId = null,
  selectedItemForPlacement = null,
  onItemPlace, onItemMove, onItemSelect,
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const bedMeshesRef = useRef([]);
  const placedItemsRef = useRef([]);
  const placedItemsMapRef = useRef(new Map());
  const groundRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({});

  stateRef.current = { editMode, selectedItemForPlacement, selectedItemId, onItemPlace, onItemMove, onItemSelect, onBedClick, suite };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e6e0);
    scene.fog = new THREE.Fog(0xe8e6e0, 30, 70);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    let camPos, camTarget;
    if (suite === "both") { camPos = { x: 0, y: 16, z: 28 }; camTarget = { x: 0, y: 0, z: 0 }; }
    else { const off = suite === "A" ? SUITE_OFFSET_A : SUITE_OFFSET_B; camPos = { x: off.x + 8, y: 10, z: 16 }; camTarget = { x: off.x, y: 0, z: 0 }; }
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
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.target.set(camTarget.x, camTarget.y, camTarget.z);

    if (editMode) {
      // 360° orbit, right-click rotate, clamp pitch
      controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      controls.maxPolarAngle = Math.PI * 0.85;
      controls.minPolarAngle = 0.15;
    } else {
      controls.maxPolarAngle = Math.PI / 2.3;
      controls.minPolarAngle = 0;
    }
    controlsRef.current = controls;

    // Warm lighting
    scene.add(new THREE.AmbientLight(0xfff5e0, 0.6));
    const dirLight = new THREE.DirectionalLight(0xfff8e8, 0.5);
    dirLight.position.set(10, 20, 10); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.radius = 4;
    scene.add(dirLight);
    const fill = new THREE.DirectionalLight(0xf5f0e8, 0.25); fill.position.set(-10, 15, -10); scene.add(fill);

    bedMeshesRef.current = [];
    placedItemsRef.current = [];
    placedItemsMapRef.current = new Map();

    const showFurniture = !editMode;
    if (suite === "A" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_A, "Suite A", showFurniture ? patients : [], bedMeshesRef.current, showFurniture);
    }
    if (suite === "B" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_B, "Suite B", showFurniture ? patients : [], bedMeshesRef.current, showFurniture);
    }

    // Ground for raycasting
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
    groundRef.current = ground;

    // Grid in edit mode
    if (editMode) {
      const grid = new THREE.GridHelper(50, 50, 0x999999, 0xcccccc);
      grid.position.y = 0.01; scene.add(grid);
    }

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
      if (event.button !== undefined && event.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const st = stateRef.current;

      if (st.editMode) {
        // Check placed items first
        const itemHits = raycaster.intersectObjects(placedItemsRef.current, true);
        if (itemHits.length > 0) {
          let obj = itemHits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) { st.onItemSelect?.(obj.userData.itemId); return; }
        }
        // Check ground
        const groundHits = raycaster.intersectObject(ground, false);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          if (st.selectedItemForPlacement) {
            const type = st.selectedItemForPlacement;
            if (type === "window" || type === "door") {
              // Wall snapping
              const off = st.suite === "B" ? SUITE_OFFSET_B : SUITE_OFFSET_A;
              const distBack = Math.abs(pt.z - (off.z - SUITE_D / 2));
              const distLeft = Math.abs(pt.x - (off.x - SUITE_W / 2));
              const distRight = Math.abs(pt.x - (off.x + SUITE_W / 2));
              if (distBack <= distLeft && distBack <= distRight) {
                st.onItemPlace?.(type, Math.round(pt.x), off.z - SUITE_D / 2 + 0.1, 0);
              } else if (distLeft <= distRight) {
                st.onItemPlace?.(type, off.x - SUITE_W / 2 + 0.1, Math.round(pt.z), Math.PI / 2);
              } else {
                st.onItemPlace?.(type, off.x + SUITE_W / 2 - 0.1, Math.round(pt.z), -Math.PI / 2);
              }
            } else {
              // Grid snapping
              st.onItemPlace?.(type, Math.round(pt.x), Math.round(pt.z));
            }
          } else if (st.selectedItemId) {
            st.onItemMove?.(st.selectedItemId, Math.round(pt.x), Math.round(pt.z));
          }
        }
      } else {
        const hits = raycaster.intersectObjects(bedMeshesRef.current, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.isBed) obj = obj.parent;
          if (obj.userData.isBed) st.onBedClick?.(obj.userData.bedIndex);
        }
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [patients, onBedClick, suite, editMode]);

  // Diff-based placed items update (no flicker)
  useEffect(() => {
    if (!sceneRef.current) return;
    const map = placedItemsMapRef.current;
    const scene = sceneRef.current;

    // Remove selection ring from all items
    map.forEach((mesh) => {
      const ring = mesh.children.find((c) => c.name === "selectionRing");
      if (ring) { mesh.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    });

    if (!editMode) {
      map.forEach((mesh) => { scene.remove(mesh); mesh.traverse(disposeMesh); });
      map.clear();
      placedItemsRef.current = [];
      return;
    }

    const currentIds = new Set(placedItems.map((i) => i.id));

    // Remove deleted items
    map.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        mesh.traverse(disposeMesh);
        map.delete(id);
      }
    });

    // Add/update items
    placedItems.forEach((item) => {
      let mesh = map.get(item.id);

      // Rebuild if options changed
      if (mesh) {
        const oldOpts = mesh.userData.itemOptions || {};
        if (oldOpts.designation !== item.designation || oldOpts.expanded !== item.expanded) {
          scene.remove(mesh);
          mesh.traverse(disposeMesh);
          map.delete(item.id);
          mesh = null;
        }
      }

      if (!mesh) {
        const options = { designation: item.designation, expanded: item.expanded };
        mesh = createWardItem(item.type, options);
        mesh.userData = { itemId: item.id, isPlacedItem: true, itemOptions: options };
        scene.add(mesh);
        map.set(item.id, mesh);
      }

      // Update transform
      mesh.position.set(item.x, 0, item.z);
      mesh.rotation.y = item.rotationY || 0;

      // Selection ring
      if (item.id === selectedItemId) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.9, 1.1, 32),
          new THREE.MeshBasicMaterial({ color: 0x8db600, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        ring.name = "selectionRing";
        mesh.add(ring);
      }
    });

    placedItemsRef.current = Array.from(map.values());
  }, [placedItems, selectedItemId, editMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-slate-600 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none border border-slate-200">
        {editMode
          ? "EDIT MODE · Left-click: place/select · Right-click drag: orbit camera"
          : "Drag to rotate · Scroll to zoom · Tap a bed to interact"}
      </div>
    </div>
  );
}