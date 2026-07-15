import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createWardItem, createTextTexture, WARD_BOUNDS, clampToBounds, checkCollision } from "@/lib/wardItems";

const WARD_W = 30;
const WARD_D = 24;

function createFloorTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#D5D8DD"; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(0,0,0,0.07)"; ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 5);
  return t;
}

function buildWardStructure(scene) {
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WARD_W, WARD_D),
    new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // Walls — white
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(WARD_W, 3.5, 0.2), wallMat);
  backWall.position.set(0, 1.75, -WARD_D / 2); backWall.receiveShadow = true; scene.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat);
  leftWall.position.set(-WARD_W / 2, 1.75, 0); scene.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, WARD_D), wallMat);
  rightWall.position.set(WARD_W / 2, 1.75, 0); scene.add(rightWall);

  // Windows on back wall — high level
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8eaed, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.2, roughness: 0.1, metalness: 0.3 });
  [-8, 0, 8].forEach(x => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 0.22), frameMat);
    frame.position.set(x, 2.4, -WARD_D / 2 + 0.05); scene.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.3), glassMat);
    glass.position.set(x, 2.4, -WARD_D / 2 + 0.17); scene.add(glass);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, 0.05), frameMat);
    barH.position.set(x, 2.4, -WARD_D / 2 + 0.18); scene.add(barH);
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.3, 0.05), frameMat);
    barV.position.set(x, 2.4, -WARD_D / 2 + 0.18); scene.add(barV);
  });

  // Bay labels
  const bayATex = createTextTexture("BAY A", 256, 64, "#0066cc", "#f2f4f7");
  const bayA = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: bayATex }));
  bayA.position.set(-WARD_W / 2 + 0.15, 2.8, 0); bayA.rotation.y = Math.PI / 2; scene.add(bayA);
  const bayBTex = createTextTexture("BAY B", 256, 64, "#0066cc", "#f2f4f7");
  const bayB = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: bayBTex }));
  bayB.position.set(WARD_W / 2 - 0.15, 2.8, 0); bayB.rotation.y = -Math.PI / 2; scene.add(bayB);

  // Nurses' station (fixed)
  const ns = new THREE.Group(); ns.position.set(0, 0, -WARD_D / 2 + 2.5);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xe0e4ea, roughness: 0.4, metalness: 0.2 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(7, 0.9, 1.8), deskMat);
  desk.position.y = 0.45; desk.castShadow = true; ns.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, 2), new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.2 }));
  top.position.y = 0.92; ns.add(top);
  [-2, 0, 2].forEach(x => {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a2b4a, emissive: 0x1a3a5a, emissiveIntensity: 0.3 }));
    mon.position.set(x, 1.4, -0.5); ns.add(mon);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x666, metalness: 0.8 }));
    stand.position.set(x, 1.1, -0.5); ns.add(stand);
  });
  const nsLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.4), new THREE.MeshBasicMaterial({ map: createTextTexture("NURSES' STATION", 256, 48, "#1a2b4a", "#e0e4ea") }));
  nsLabel.position.set(0, 0.6, 1); nsLabel.rotation.x = -Math.PI / 2; ns.add(nsLabel);
  scene.add(ns);

  // Clean utility corner
  const utilMat = new THREE.MeshStandardMaterial({ color: 0xdce0e5, roughness: 0.6 });
  const utilCabinet = new THREE.Mesh(new THREE.BoxGeometry(2, 1.8, 0.6), utilMat);
  utilCabinet.position.set(-WARD_W / 2 + 1.3, 0.9, WARD_D / 2 - 1.5); scene.add(utilCabinet);
  const utilLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshBasicMaterial({ map: createTextTexture("CLEAN UTILITY", 256, 48, "#666", "#dce0e5") }));
  utilLabel.position.set(-WARD_W / 2 + 1.3, 1.5, WARD_D / 2 - 1.18); utilLabel.rotation.y = 0; scene.add(utilLabel);
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
  const animFrameRef = useRef(null);
  const cameraTargetRef = useRef(null);
  const dragRef = useRef({ active: false, itemId: null, startX: 0, startY: 0, moved: false });
  const hoveredBedRef = useRef(null);
  const stateRef = useRef({});

  stateRef.current = { editMode, snapToGrid, items, selectedItemId, selectedItemForPlacement, onItemSelect, onItemMove, onItemPlace, onBedClick };

  // Main scene setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef0f3);
    scene.fog = new THREE.Fog(0xeef0f3, 40, 80);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    const camPos = { x: 0, y: 14, z: 22 };
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
    controls.target.set(0, 0, 0);
    if (editMode) {
      controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    } else {
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    }
    controlsRef.current = controls;

    // Soft natural lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0xfff8e8, 0.6);
    sunLight.position.set(10, 25, -5); sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.radius = 6;
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.25);
    fillLight.position.set(-10, 15, 10); scene.add(fillLight);

    // Build ward structure
    buildWardStructure(scene);

    // Ground for raycasting (invisible)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
    groundRef.current = ground;

    // Grid in edit mode
    if (editMode) {
      const grid = new THREE.GridHelper(30, 30, 0x0066cc, 0xbbccdd);
      grid.position.y = 0.01; grid.material.opacity = 0.4; grid.material.transparent = true;
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

    // Pointer down — start potential drag in edit mode
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

    // Pointer move — drag or hover
    const onPointerMove = (event) => {
      const st = stateRef.current;
      getMouse(event);

      // Check drag threshold
      if (dragRef.current.itemId && !dragRef.current.active) {
        const dx = event.clientX - dragRef.current.startX;
        const dy = event.clientY - dragRef.current.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 5) dragRef.current.active = true;
      }

      // Handle drag
      if (dragRef.current.active) {
        const groundHits = raycaster.intersectObject(ground, false);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          let x = pt.x, z = pt.z;
          if (st.snapToGrid) { x = Math.round(x); z = Math.round(z); }
          const clamped = clampToBounds(x, z);
          if (!checkCollision(dragRef.current.itemId, clamped.x, clamped.z, st.items)) {
            // Update mesh directly for performance
            const mesh = itemsMapRef.current.get(dragRef.current.itemId);
            if (mesh) mesh.position.set(clamped.x, 0, clamped.z);
          }
        }
        return;
      }

      // Hover (non-edit mode)
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

    // Pointer up — finalize drag, select, or place
    const onPointerUp = (event) => {
      const st = stateRef.current;
      if (st.editMode) {
        if (dragRef.current.itemId) {
          if (dragRef.current.active) {
            // Drag ended — commit position
            const mesh = itemsMapRef.current.get(dragRef.current.itemId);
            if (mesh) st.onItemMove?.(dragRef.current.itemId, mesh.position.x, mesh.position.z);
          } else {
            // Click — select item
            st.onItemSelect?.(dragRef.current.itemId);
          }
          controls.enabled = true;
          dragRef.current = { active: false, itemId: null, startX: 0, startY: 0, moved: false };
          return;
        }
        // No item pressed — place new item or deselect
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
        // Non-edit: bed click
        getMouse(event);
        const hits = raycaster.intersectObjects(itemsArrayRef.current, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj.parent && !obj.userData.itemId) obj = obj.parent;
          if (obj.userData.itemId) {
            st.onBedClick?.(obj.userData.itemId);
          }
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // Animation loop with camera lerp
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
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
      cameraTargetRef.current = { pos: new THREE.Vector3(0, 14, 22), look: new THREE.Vector3(0, 0, 0) };
    } else if (cameraCommand.type === "focus" && cameraCommand.target) {
      const { x, z } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x + 4, 4, z + 4), look: new THREE.Vector3(x, 1, z) };
    } else if (cameraCommand.type === "suite" && cameraCommand.target) {
      const { x, z } = cameraCommand.target;
      cameraTargetRef.current = { pos: new THREE.Vector3(x, 10, z), look: new THREE.Vector3(x, 0, 0) };
    }
  }, [cameraCommand]);

  // Diff-based item rendering (no flicker)
  useEffect(() => {
    if (!sceneRef.current) return;
    const map = itemsMapRef.current;
    const scene = sceneRef.current;

    // Remove selection rings
    map.forEach((mesh) => {
      const ring = mesh.children.find(c => c.name === "selectionRing");
      if (ring) { mesh.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    });

    if (!editMode && !items.length) { return; }

    const currentIds = new Set(items.map(i => i.id));

    // Remove deleted items
    map.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        mesh.traverse(disposeMesh);
        map.delete(id);
      }
    });

    // Add/update items
    items.forEach((item) => {
      let mesh = map.get(item.id);

      // Rebuild if options changed
      if (mesh) {
        const old = mesh.userData.itemOptions || {};
        if (old.designation !== item.designation || old.expanded !== item.expanded) {
          scene.remove(mesh); mesh.traverse(disposeMesh); map.delete(item.id); mesh = null;
        }
      }

      if (!mesh) {
        const options = { designation: item.designation, expanded: item.expanded };
        mesh = createWardItem(item.type, options);
        mesh.userData = { itemId: item.id, itemOptions: options };
        scene.add(mesh);
        map.set(item.id, mesh);
      }

      mesh.position.set(item.x, 0, item.z);
      mesh.rotation.y = item.rotationY || 0;

      // Selection ring (blue)
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
  }, [items, selectedItemId, editMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-slate-600 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none border border-slate-200">
        {editMode
          ? "EDIT MODE · Drag items to reposition · Right-click drag to orbit · Scroll to zoom"
          : "Drag to orbit · Right-click to pan · Scroll to zoom · Click a bed to view patient"}
      </div>
    </div>
  );
}