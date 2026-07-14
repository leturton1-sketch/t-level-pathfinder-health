import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createWardItem } from "@/lib/wardItems";

const SUITE_W = 18;
const SUITE_D = 14;
const SUITE_OFFSET_A = { x: -13, z: 0 };
const SUITE_OFFSET_B = { x: 13, z: 0 };

function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F4F4F4"; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#D8D8D8"; ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
  return tex;
}

function createTextTexture(text, w = 256, h = 64, color = "#555", bg = "transparent") {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.55)}px Arial`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(canvas);
}

function buildSuite(scene, offset, suiteLabel, patients, bedGroups, showFurniture = true) {
  const { x: ox, z: oz } = offset;

  // Floor
  const gridTex = createGridTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(SUITE_W, SUITE_D),
    new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ox, 0, oz);
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls — U-shape
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeaecec, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(SUITE_W, 3.5, 0.15), wallMat);
  backWall.position.set(ox, 1.75, oz - SUITE_D / 2); scene.add(backWall);
  const sideWallGeo = new THREE.BoxGeometry(0.15, 3.5, SUITE_D);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat); leftWall.position.set(ox - SUITE_W / 2, 1.75, oz); scene.add(leftWall);
  const rightWall = new THREE.Mesh(sideWallGeo, wallMat); rightWall.position.set(ox + SUITE_W / 2, 1.75, oz); scene.add(rightWall);

  // Suite label
  const labelTex = createTextTexture(suiteLabel, 256, 64, "#888", "#eaecec");
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: labelTex }));
  label.position.set(ox, 3, oz - SUITE_D / 2 + 0.1); scene.add(label);

  // Ceiling light fixtures (always shown)
  const lightFixMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffef0, emissiveIntensity: 0.5, roughness: 0.3 });
  const bedPositions = [{ x: -4, z: 2.5 }, { x: 0.5, z: 2.5 }, { x: -4, z: -2.5 }, { x: 0.5, z: -2.5 }];
  bedPositions.forEach((pos) => {
    const fix = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.7), lightFixMat);
    fix.position.set(ox + pos.x, 3.3, oz + pos.z); scene.add(fix);
  });
  const nsFix = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), lightFixMat);
  nsFix.position.set(ox + 6, 3.3, oz); scene.add(nsFix);

  if (!showFurniture) return;

  // Translucent partition material
  const partitionMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, transparent: true, opacity: 0.2, roughness: 0.1, side: THREE.DoubleSide });

  // Beds
  bedPositions.forEach((pos, idx) => {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(ox + pos.x, 0, oz + pos.z);
    bedGroup.userData = { bedIndex: idx, isBed: true };

    const patient = patients[idx];
    const statusColor = !patient ? 0xcccccc : patient.news2_score >= 7 ? 0xffaaaa : patient.news2_score >= 5 ? 0xffd180 : 0xa5d6a4;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, roughness: 0.4, metalness: 0.5 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 2.5), frameMat);
    frame.position.y = 0.4; frame.castShadow = true; bedGroup.add(frame);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 2.3), new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.8 }));
    mattress.position.y = 0.68; bedGroup.add(mattress);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
    pillow.position.set(0, 0.8, -0.8); bedGroup.add(pillow);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.1), frameMat);
    headboard.position.set(0, 0.7, -1.25); bedGroup.add(headboard);

    // Indicator post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.3 }));
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

    // Partitions
    if (idx % 2 === 0) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), partitionMat);
      p.position.set(1.15, 1.5, 0); p.rotation.y = Math.PI / 2; bedGroup.add(p);
    }
    if (idx < 2) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.2), partitionMat);
      p.position.set(0, 1.5, -2.5); bedGroup.add(p);
    }

    // Bed label
    const blTex = createTextTexture(`${suiteLabel}-${idx + 1}`, 128, 48, "#666", "transparent");
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.26), new THREE.MeshBasicMaterial({ map: blTex, transparent: true }));
    bl.position.set(0, 1.15, -1.26); bedGroup.add(bl);

    scene.add(bedGroup); bedGroups.push(bedGroup);
  });

  // Nurse station
  const ns = new THREE.Group(); ns.position.set(ox + 6, 0, oz);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: 0xd0d5db, roughness: 0.4, metalness: 0.3 }));
  desk.position.y = 0.6; desk.castShadow = true; ns.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.08, 1.7), new THREE.MeshStandardMaterial({ color: 0xe0e5eb, roughness: 0.2 }));
  top.position.y = 1.04; ns.add(top);
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0.2 }));
  mon.position.set(0, 1.5, -0.3); ns.add(mon);
  const mStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 }));
  mStand.position.set(0, 1.2, -0.3); ns.add(mStand);
  const nsLab = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.38), new THREE.MeshBasicMaterial({ map: createTextTexture("NURSE STATION", 256, 48, "#666", "transparent"), transparent: true }));
  nsLab.position.set(0, 1.35, 0.76); nsLab.rotation.x = -Math.PI / 2; ns.add(nsLab);
  scene.add(ns);
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
  const groundRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({});

  // Keep latest state for click handler
  stateRef.current = { editMode, selectedItemForPlacement, selectedItemId, onItemPlace, onItemMove, onItemSelect, onBedClick };

  // Main scene setup
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
      camPos = { x: 0, y: 16, z: 28 }; camTarget = { x: 0, y: 0, z: 0 };
    } else {
      const off = suite === "A" ? SUITE_OFFSET_A : SUITE_OFFSET_B;
      camPos = { x: off.x + 8, y: 10, z: 16 }; camTarget = { x: off.x, y: 0, z: 0 };
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

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    const fill = new THREE.DirectionalLight(0xeef2ff, 0.3); fill.position.set(-10, 15, -10); scene.add(fill);

    bedMeshesRef.current = [];
    placedItemsRef.current = [];

    // Build suites
    const showFurniture = !editMode;
    if (suite === "A" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_A, "Suite A", showFurniture ? patients : [], bedMeshesRef.current, showFurniture);
    }
    if (suite === "B" || suite === "both") {
      buildSuite(scene, SUITE_OFFSET_B, "Suite B", showFurniture ? patients : [], bedMeshesRef.current, showFurniture);
    }

    // Ground plane for raycasting (invisible)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    groundRef.current = ground;

    // Grid in edit mode
    if (editMode) {
      const grid = new THREE.GridHelper(50, 50, 0xbbbbbb, 0xdddddd);
      grid.position.y = 0.01;
      scene.add(grid);
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

      const st = stateRef.current;

      if (st.editMode) {
        // Check placed items first
        const itemHits = raycaster.intersectObjects(placedItemsRef.current, true);
        if (itemHits.length > 0) {
          let obj = itemHits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) {
            st.onItemSelect?.(obj.userData.itemId);
            return;
          }
        }
        // Check ground
        const groundHits = raycaster.intersectObject(ground, false);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          if (st.selectedItemForPlacement) {
            st.onItemPlace?.(st.selectedItemForPlacement, pt.x, pt.z);
          } else if (st.selectedItemId) {
            st.onItemMove?.(st.selectedItemId, pt.x, pt.z);
          }
        }
      } else {
        // Default bed click
        const hits = raycaster.intersectObjects(bedMeshesRef.current, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.isBed) obj = obj.parent;
          if (obj.userData.isBed) {
            st.onBedClick?.(obj.userData.bedIndex);
          }
        }
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    // Resize
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
  }, [patients, onBedClick, suite, editMode]);

  // Update placed items (without rebuilding scene)
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old placed items
    placedItemsRef.current.forEach((mesh) => {
      sceneRef.current.remove(mesh);
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (child.material?.userData?.cloned) child.material.dispose();
        }
      });
    });
    placedItemsRef.current = [];

    if (!editMode) return;

    // Add current placed items
    placedItems.forEach((item) => {
      const mesh = createWardItem(item.type);
      mesh.position.set(item.x, 0, item.z);
      mesh.rotation.y = item.rotationY || 0;
      mesh.userData = { itemId: item.id, isPlacedItem: true };

      // Selection highlight
      if (item.id === selectedItemId) {
        mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            const cloned = child.material.clone();
            cloned.userData = { cloned: true };
            cloned.emissive = new THREE.Color(0x8db600);
            cloned.emissiveIntensity = 0.3;
            child.material = cloned;
          }
        });
      }

      sceneRef.current.add(mesh);
      placedItemsRef.current.push(mesh);
    });
  }, [placedItems, selectedItemId, editMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-slate-500 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none border border-slate-200">
        {editMode
          ? "EDIT MODE · Click floor to place · Click item to select"
          : "Drag to rotate · Scroll to zoom · Tap a bed to interact"}
      </div>
    </div>
  );
}