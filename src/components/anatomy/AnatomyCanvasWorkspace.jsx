import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Box,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  Layers3,
  MousePointer2,
  Pin,
  Rotate3D,
  Ruler,
  Upload,
} from "lucide-react";

const SYSTEM_COLOURS = {
  Muscle: 0x8f342d,
  Bone: 0xd9c79b,
  Organ: 0x9f3434,
  Vessel: 0xb41f2a,
  Nerve: 0xe0b445,
  Other: 0x8b96a8,
};

function makeMaterial(colour, roughness = 0.58, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({
    color: colour,
    roughness,
    metalness,
    side: THREE.DoubleSide,
  });
}

function addNamedMesh(group, geometry, material, name, system, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.system = system;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function buildProceduralAnatomy() {
  const root = new THREE.Group();
  root.name = "Anatomical study model";

  const muscle = makeMaterial(SYSTEM_COLOURS.Muscle, 0.62, 0.0);
  const bone = makeMaterial(SYSTEM_COLOURS.Bone, 0.74, 0.0);
  const organ = makeMaterial(SYSTEM_COLOURS.Organ, 0.7, 0.0);
  const vessel = makeMaterial(SYSTEM_COLOURS.Vessel, 0.46, 0.02);

  // Head and neck
  addNamedMesh(root, new THREE.SphereGeometry(0.42, 44, 28), muscle, "Head musculature", "Muscle", [0, 3.28, 0], [0.9, 1.08, 0.92]);
  addNamedMesh(root, new THREE.CylinderGeometry(0.18, 0.22, 0.54, 28), muscle, "Neck musculature", "Muscle", [0, 2.77, 0]);
  addNamedMesh(root, new THREE.SphereGeometry(0.31, 34, 24), bone, "Skull", "Bone", [0, 3.28, -0.02], [0.92, 1.02, 0.9]);

  // Torso muscle masses
  addNamedMesh(root, new THREE.SphereGeometry(0.83, 44, 30), muscle, "Thoracic musculature", "Muscle", [0, 1.95, 0], [1.03, 1.22, 0.58]);
  addNamedMesh(root, new THREE.SphereGeometry(0.67, 42, 28), muscle, "Abdominal wall", "Muscle", [0, 0.98, 0], [0.9, 1.28, 0.54]);
  addNamedMesh(root, new THREE.SphereGeometry(0.72, 42, 28), muscle, "Pelvic musculature", "Muscle", [0, 0.04, 0], [1.03, 0.7, 0.72]);

  // Sternum and simplified ribs
  addNamedMesh(root, new THREE.BoxGeometry(0.12, 1.36, 0.12), bone, "Sternum", "Bone", [0, 1.93, 0.49]);
  for (let i = 0; i < 6; i += 1) {
    const y = 2.36 - i * 0.23;
    const rib = new THREE.TorusGeometry(0.56 - i * 0.025, 0.028, 10, 56, Math.PI * 1.58);
    addNamedMesh(root, rib, bone, `Rib pair ${i + 1}`, "Bone", [0, y, 0], [1, 1, 0.68], [Math.PI / 2, 0, 0.66]);
  }

  // Spine
  for (let i = 0; i < 16; i += 1) {
    const y = 2.7 - i * 0.18;
    addNamedMesh(root, new THREE.BoxGeometry(0.18, 0.13, 0.18), bone, `Vertebra ${i + 1}`, "Bone", [0, y, -0.34]);
  }

  // Major organs
  addNamedMesh(root, new THREE.SphereGeometry(0.26, 34, 24), organ, "Heart", "Organ", [0.13, 2.02, 0.38], [0.9, 1.18, 0.78], [0, 0, -0.22]);
  addNamedMesh(root, new THREE.SphereGeometry(0.42, 36, 26), organ, "Right lung", "Organ", [-0.38, 2.12, 0.19], [0.74, 1.24, 0.56]);
  addNamedMesh(root, new THREE.SphereGeometry(0.4, 36, 26), organ, "Left lung", "Organ", [0.4, 2.12, 0.19], [0.72, 1.2, 0.54]);
  addNamedMesh(root, new THREE.SphereGeometry(0.5, 36, 26), organ, "Liver", "Organ", [-0.18, 1.23, 0.3], [1.12, 0.58, 0.72], [0, 0, -0.08]);
  addNamedMesh(root, new THREE.SphereGeometry(0.28, 32, 22), organ, "Stomach", "Organ", [0.28, 1.22, 0.29], [0.9, 1.16, 0.68], [0, 0, 0.22]);

  // Aorta / central vessel
  addNamedMesh(root, new THREE.CylinderGeometry(0.055, 0.06, 2.55, 18), vessel, "Aorta", "Vessel", [0.08, 1.25, -0.03]);

  // Limbs
  const limbGeo = new THREE.CapsuleGeometry(0.18, 1.18, 10, 22);
  addNamedMesh(root, limbGeo, muscle, "Right upper arm", "Muscle", [-0.93, 1.85, 0], [0.98, 1, 1], [0, 0, -0.17]);
  addNamedMesh(root, limbGeo, muscle, "Left upper arm", "Muscle", [0.93, 1.85, 0], [0.98, 1, 1], [0, 0, 0.17]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.14, 1.06, 10, 22), muscle, "Right forearm", "Muscle", [-1.12, 0.72, 0], [0.92, 1, 0.92], [0, 0, -0.08]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.14, 1.06, 10, 22), muscle, "Left forearm", "Muscle", [1.12, 0.72, 0], [0.92, 1, 0.92], [0, 0, 0.08]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.26, 1.44, 12, 24), muscle, "Right thigh", "Muscle", [-0.4, -1.24, 0], [1.04, 1, 1.02], [0, 0, -0.03]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.26, 1.44, 12, 24), muscle, "Left thigh", "Muscle", [0.4, -1.24, 0], [1.04, 1, 1.02], [0, 0, 0.03]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.18, 1.34, 10, 22), muscle, "Right lower leg", "Muscle", [-0.4, -2.72, 0], [0.95, 1, 0.95]);
  addNamedMesh(root, new THREE.CapsuleGeometry(0.18, 1.34, 10, 22), muscle, "Left lower leg", "Muscle", [0.4, -2.72, 0], [0.95, 1, 0.95]);

  // Simplified long bones
  const boneGeo = new THREE.CylinderGeometry(0.055, 0.065, 1.34, 16);
  [
    ["Right humerus", [-0.93, 1.84, 0]], ["Left humerus", [0.93, 1.84, 0]],
    ["Right femur", [-0.4, -1.27, 0]], ["Left femur", [0.4, -1.27, 0]],
  ].forEach(([name, pos]) => addNamedMesh(root, boneGeo, bone, name, "Bone", pos));

  return root;
}

function summariseMeshes(root) {
  const rows = [];
  root?.traverse((obj) => {
    if (obj.isMesh) {
      rows.push({
        uuid: obj.uuid,
        name: obj.name || "Unnamed structure",
        system: obj.userData.system || "Other",
        visible: obj.visible,
      });
    }
  });
  return rows;
}

function normaliseModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  root.position.sub(centre);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 6.6 / maxDim;
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(root);
}

export default function AnatomyCanvasWorkspace() {
  const mountRef = useRef(null);
  const fileInputRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const meshesRef = useRef([]);
  const selectedRef = useRef(null);
  const highlightRef = useRef(null);
  const clippingRef = useRef({ x: null, y: null, z: null });
  const boundsRef = useRef(new THREE.Box3(new THREE.Vector3(-1, -3.5, -1), new THREE.Vector3(1, 3.5, 1)));
  const markersRef = useRef([]);
  const modeRef = useRef("select");
  const annotationTextRef = useRef("Clinical note");

  const [meshes, setMeshes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("select");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Studio ready · procedural anatomical study loaded");
  const [wireframe, setWireframe] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [clipEnabled, setClipEnabled] = useState({ x: false, y: false, z: false });
  const [clipValue, setClipValue] = useState({ x: 0, y: 0, z: 0 });
  const [annotations, setAnnotations] = useState([]);
  const [annotationText, setAnnotationText] = useState("Clinical note");

  const groupedMeshes = useMemo(() => {
    const groups = {};
    meshes.forEach((item) => {
      if (!groups[item.system]) groups[item.system] = [];
      groups[item.system].push(item);
    });
    return groups;
  }, [meshes]);

  const refreshMeshes = () => {
    meshesRef.current = [];
    modelRef.current?.traverse((obj) => {
      if (obj.isMesh) meshesRef.current.push(obj);
    });
    setMeshes(summariseMeshes(modelRef.current));
  };

  const applyClipping = () => {
    const planes = [
      clipEnabled.x ? clippingRef.current.x : null,
      clipEnabled.y ? clippingRef.current.y : null,
      clipEnabled.z ? clippingRef.current.z : null,
    ].filter(Boolean);
    meshesRef.current.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.clippingPlanes = planes;
        mat.clipIntersection = false;
        mat.needsUpdate = true;
      });
    });
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    annotationTextRef.current = annotationText;
  }, [annotationText]);

  useEffect(() => {
    applyClipping();
  }, [clipEnabled]);

  useEffect(() => {
    clippingRef.current.x && (clippingRef.current.x.constant = clipValue.x);
    clippingRef.current.y && (clippingRef.current.y.constant = clipValue.y);
    clippingRef.current.z && (clippingRef.current.z.constant = clipValue.z);
  }, [clipValue]);

  useEffect(() => {
    meshesRef.current.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        mat.wireframe = wireframe;
        mat.needsUpdate = true;
      });
    });
  }, [wireframe]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111318);
    scene.fog = new THREE.Fog(0x111318, 11, 24);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
    camera.position.set(6.9, 1.45, 8.7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 3.3;
    controls.maxDistance = 18;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x343038, 1.65));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb9ff, 2.3);
    fill.position.set(-6, 3, 5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff9a82, 3.1);
    rim.position.set(1, 4, -7);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.2, 96),
      new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.86, metalness: 0.02 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.78;
    floor.receiveShadow = true;
    floor.name = "Studio floor";
    scene.add(floor);

    const grid = new THREE.GridHelper(13, 26, 0x545967, 0x262a33);
    grid.position.y = -3.76;
    grid.name = "Anatomy grid";
    scene.add(grid);

    clippingRef.current = {
      x: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
      y: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      z: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    };

    const model = buildProceduralAnatomy();
    scene.add(model);
    modelRef.current = model;
    boundsRef.current = new THREE.Box3().setFromObject(model);
    refreshMeshes();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const clearHighlight = () => {
      if (!highlightRef.current) return;
      const { mesh, colours } = highlightRef.current;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat, index) => {
        if (mat.color && colours[index]) mat.color.copy(colours[index]);
        mat.emissive?.setHex(0x000000);
      });
      highlightRef.current = null;
    };

    const highlight = (mesh) => {
      clearHighlight();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const colours = mats.map((mat) => mat.color?.clone?.() || null);
      mats.forEach((mat) => {
        mat.emissive?.setHex(0x3a1221);
        if (mat.color) mat.color.lerp(new THREE.Color(0xff806d), 0.25);
      });
      highlightRef.current = { mesh, colours };
    };

    const toPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (event) => {
      toPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshesRef.current.filter((m) => m.visible), true);
      return hits[0] || null;
    };

    const onPointerMove = (event) => {
      if (modeRef.current !== "select") {
        renderer.domElement.style.cursor = "crosshair";
        return;
      }
      const hit = pick(event);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    };

    const onPointerDown = (event) => {
      const hit = pick(event);
      if (!hit?.object) {
        if (modeRef.current === "select") {
          clearHighlight();
          selectedRef.current = null;
          setSelected(null);
        }
        return;
      }

      if (modeRef.current === "annotate") {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 18, 12),
          new THREE.MeshStandardMaterial({ color: 0xffd447, emissive: 0x6b5200, emissiveIntensity: 0.7 }),
        );
        marker.position.copy(hit.point);
        marker.name = "Annotation marker";
        scene.add(marker);
        markersRef.current.push(marker);
        const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
        setAnnotations((current) => [...current, {
          id,
          text: annotationTextRef.current.trim() || "Clinical note",
          structure: hit.object.name || "Structure",
          position: hit.point.toArray(),
        }]);
        return;
      }

      selectedRef.current = hit.object;
      highlight(hit.object);
      setSelected({
        uuid: hit.object.uuid,
        name: hit.object.name || "Unnamed structure",
        system: hit.object.userData.system || "Other",
      });
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      const width = Math.max(320, mount.clientWidth);
      const height = Math.max(520, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      grid.visible = gridVisible;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((mat) => mat.dispose?.());
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []); // Scene is intentionally initialised once.

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const grid = scene.getObjectByName("Anatomy grid");
    if (grid) grid.visible = gridVisible;
  }, [gridVisible]);

  const toggleMesh = (uuid) => {
    const mesh = meshesRef.current.find((item) => item.uuid === uuid);
    if (!mesh) return;
    mesh.visible = !mesh.visible;
    setMeshes((current) => current.map((item) => item.uuid === uuid ? { ...item, visible: mesh.visible } : item));
  };

  const focusSelected = () => {
    const mesh = selectedRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!mesh || !camera || !controls) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length(), 0.5);
    controls.target.copy(centre);
    camera.position.copy(centre.clone().add(new THREE.Vector3(radius * 1.8, radius * 0.6, radius * 2.4)));
    controls.update();
  };

  const resetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(6.9, 1.45, 8.7);
    controls.target.set(0, 0.1, 0);
    controls.update();
  };

  const loadFile = async (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".glb") && !lower.endsWith(".gltf")) {
      setStatus("Unsupported file · choose a .glb or self-contained .gltf model");
      return;
    }
    setLoading(true);
    setStatus(`Loading ${file.name}…`);
    try {
      const url = URL.createObjectURL(file);
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      URL.revokeObjectURL(url);

      gltf.scene.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.userData.system = obj.userData.system || "Other";
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        });
      });

      const scene = sceneRef.current;
      if (modelRef.current) scene.remove(modelRef.current);
      markersRef.current.forEach((marker) => scene.remove(marker));
      markersRef.current = [];
      setAnnotations([]);
      modelRef.current = gltf.scene;
      scene.add(gltf.scene);
      boundsRef.current = normaliseModel(gltf.scene);
      refreshMeshes();
      applyClipping();
      resetView();
      setStatus(`${file.name} loaded · ${summariseMeshes(gltf.scene).length} selectable meshes`);
    } catch (error) {
      setStatus(`Model load failed · ${error?.message || "invalid GLB/GLTF"}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setPlane = (axis, enabled) => {
    setClipEnabled((current) => ({ ...current, [axis]: enabled }));
  };

  const clipRange = (axis) => {
    const box = boundsRef.current;
    const size = box.getSize(new THREE.Vector3());
    return Math.max(axis === "x" ? size.x : axis === "y" ? size.y : size.z, 1);
  };

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-violet-600" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Structure hierarchy</p>
            <h2 className="text-sm font-black text-slate-900">Anatomy layers</h2>
          </div>
        </div>
        <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
          {Object.entries(groupedMeshes).map(([system, items]) => (
            <div key={system} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{system}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.uuid}
                    onClick={() => toggleMesh(item.uuid)}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-white"
                  >
                    {item.visible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-[#111318] shadow-[0_24px_70px_-34px_rgba(15,23,42,.85)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl">
          <button type="button" onClick={() => setMode("select")} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${mode === "select" ? "bg-violet-600 text-white" : "bg-white/8 text-slate-200 hover:bg-white/12"}`}>
            <MousePointer2 className="h-4 w-4" /> Select
          </button>
          <button type="button" onClick={() => setMode("annotate")} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${mode === "annotate" ? "bg-amber-500 text-slate-950" : "bg-white/8 text-slate-200 hover:bg-white/12"}`}>
            <Pin className="h-4 w-4" /> Annotate
          </button>
          <button type="button" onClick={resetView} className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/12">
            <Rotate3D className="h-4 w-4" /> Reset view
          </button>
          <button type="button" onClick={focusSelected} disabled={!selected} className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/12 disabled:opacity-35">
            <Focus className="h-4 w-4" /> Focus
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} className="ml-auto flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-900 hover:bg-slate-100 disabled:opacity-50">
            <Upload className="h-4 w-4" /> {loading ? "Loading…" : "Load GLB / GLTF"}
          </button>
          <input ref={fileInputRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden" onChange={(event) => loadFile(event.target.files?.[0])} />
        </div>

        <div className="relative min-h-[720px]">
          <div ref={mountRef} className="absolute inset-0" aria-label="Interactive 3D anatomy canvas" />
          <div className="pointer-events-none absolute left-4 top-4 max-w-[72%] rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-semibold text-slate-200 backdrop-blur-md">
            {status}
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-bold text-slate-300 backdrop-blur-md">Drag · rotate 360°</span>
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-bold text-slate-300 backdrop-blur-md">Wheel · zoom</span>
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-bold text-slate-300 backdrop-blur-md">Right drag · pan</span>
          </div>
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-rose-600" />
            <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-600">Section planes</p><h2 className="text-sm font-black text-slate-900">Cross-section controls</h2></div>
          </div>
          {[
            ["x", "Sagittal", "X"],
            ["y", "Transverse", "Y"],
            ["z", "Coronal", "Z"],
          ].map(([axis, label, short]) => {
            const range = clipRange(axis);
            return (
              <div key={axis} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <input type="checkbox" checked={clipEnabled[axis]} onChange={(event) => setPlane(axis, event.target.checked)} />
                    {label} <span className="text-slate-400">({short})</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">{clipValue[axis].toFixed(2)}</span>
                </div>
                <input type="range" min={-range / 2} max={range / 2} step={range / 140} value={clipValue[axis]} onChange={(event) => setClipValue((current) => ({ ...current, [axis]: Number(event.target.value) }))} className="w-full accent-rose-600" />
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><Box className="h-5 w-5 text-cyan-600" /><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-600">Render controls</p><h2 className="text-sm font-black text-slate-900">Viewport display</h2></div></div>
          <label className="flex items-center justify-between rounded-xl px-2 py-2 text-xs font-bold text-slate-700"><span>Wireframe</span><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /></label>
          <label className="flex items-center justify-between rounded-xl px-2 py-2 text-xs font-bold text-slate-700"><span>Reference grid</span><input type="checkbox" checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} /></label>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><Ruler className="h-5 w-5 text-violet-600" /><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Inspector</p><h2 className="text-sm font-black text-slate-900">Selected structure</h2></div></div>
          {selected ? (
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">{selected.system}</p>
              <p className="mt-1 text-lg font-black">{selected.name}</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Click Focus to isolate the camera around this structure. Layer visibility remains independently controllable.</p>
            </div>
          ) : <p className="text-xs leading-5 text-slate-500">Select a visible mesh in the 3D canvas to inspect it.</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><Pin className="h-5 w-5 text-amber-500" /><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600">Annotations</p><h2 className="text-sm font-black text-slate-900">3D clinical markers</h2></div></div>
          <input value={annotationText} onChange={(event) => setAnnotationText(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Marker label" />
          <p className="mt-2 text-[10px] leading-4 text-slate-500">Choose Annotate, then click directly on a structure to place a 3D marker.</p>
          {annotations.length > 0 && <div className="mt-3 space-y-2">{annotations.slice(-5).reverse().map((item) => <div key={item.id} className="rounded-xl bg-amber-50 p-2.5"><p className="text-[11px] font-black text-amber-950">{item.text}</p><p className="text-[9px] text-amber-700">{item.structure}</p></div>)}</div>}
        </div>
      </aside>
    </div>
  );
}
