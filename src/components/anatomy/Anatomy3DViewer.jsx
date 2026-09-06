import { useEffect, useRef } from "react";
import * as THREE from "three";
import { captureTransform, applyTransform } from "@/lib/anatomyTransforms";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { BODY_SHELLS, ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";
import { alignAnatomicalGroupToBody, conformGroupsToBodyEnvelope, keepGroupInsideBodyEnvelope } from "@/lib/anatomicalSpatialAnchors";

const BODY_TARGET = new THREE.Vector3(0, 0.95, 0);

function buildGeometry(shape) {
  switch (shape.type) {
    case "lathe": {
      const pts = shape.points.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
      return new THREE.LatheGeometry(pts, shape.segments || 32);
    }
    case "sphere":
      return new THREE.SphereGeometry(shape.radius, 28, 20);
    case "capsule":
      return new THREE.CapsuleGeometry(shape.radius, shape.length, 6, 14);
    case "cylinder":
      return new THREE.CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.height, shape.radialSegments || 20, 1, false);
    case "torus":
      return new THREE.TorusGeometry(shape.radius, shape.tube, shape.radialSegments || 10, shape.tubularSegments || 28, shape.arc || Math.PI * 2);
    case "tube": {
      const curve = new THREE.CatmullRomCurve3(shape.points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
      return new THREE.TubeGeometry(curve, Math.max(20, shape.points.length * 6), shape.radius, 10, false);
    }
    default:
      return new THREE.SphereGeometry(0.05, 16, 12);
  }
}

function applyScale(mesh, scale) {
  if (!scale) return;
  mesh.scale.set(scale[0], scale[1], scale[2]);
}

// Clinical surface canvases are expensive to generate (~1.3M pixel writes).
// Cache them for the browser session so revisits to the anatomy viewer skip the
// regeneration loop; fresh GPU textures are still created per renderer instance.
let _clinicalCanvases = null;
let _clinicalCanvasesSize = 0;

function generateClinicalCanvases(size) {
  const canvases = Array.from({ length: 5 }, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    return canvas;
  });
  const contexts = canvases.map((canvas) => canvas.getContext("2d"));
  const images = contexts.map((context) => context.createImageData(size, size));
  const [colourImage, tissueImage, muscleImage, boneImage, roughnessImage] = images;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const cellular = Math.sin(x * 0.61) * Math.cos(y * 0.47) * 4 + Math.sin((x + y) * 0.19) * 3;
      const capillary = Math.max(0, 1 - Math.abs(Math.sin(x * 0.035 + Math.sin(y * 0.04) * 1.8))) * (Math.sin(y * 0.11) > 0.7 ? 13 : 0);
      const striation = Math.sin(y * 0.68 + Math.sin(x * 0.08) * 2.4) * 17 + Math.sin(y * 1.9) * 4;
      const poreField = Math.sin(x * 0.29) * Math.sin(y * 0.31) + Math.sin(x * 0.73 + y * 0.41);
      const cancellousPore = poreField > 1.18 ? 55 : Math.max(0, poreField) * 10;
      const tissueHeight = Math.max(0, Math.min(255, 128 + cellular * 4 - capillary * 1.7));
      const muscleHeight = Math.max(0, Math.min(255, 128 + striation + cellular * 1.5));
      const boneHeight = Math.max(0, Math.min(255, 158 + cellular * 2.5 - cancellousPore));

      colourImage.data.set([216 + cellular, 151 + cellular - capillary * .22, 137 + cellular - capillary, 255], i);
      tissueImage.data.set([tissueHeight, tissueHeight, tissueHeight, 255], i);
      muscleImage.data.set([muscleHeight, muscleHeight, muscleHeight, 255], i);
      boneImage.data.set([boneHeight, boneHeight, boneHeight, 255], i);
      const roughness = Math.max(80, Math.min(235, 168 + cellular * 4 + capillary * 1.5));
      roughnessImage.data.set([roughness, roughness, roughness, 255], i);
    }
  }

  contexts.forEach((context, index) => context.putImageData(images[index], 0, 0));
  return canvases;
}

function createClinicalTextures(renderer) {
  const size = renderer.capabilities.maxTextureSize >= 4096 && window.devicePixelRatio > 1 ? 1024 : 512;
  if (!_clinicalCanvases || _clinicalCanvasesSize !== size) {
    _clinicalCanvases = generateClinicalCanvases(size);
    _clinicalCanvasesSize = size;
  }
  const [map, tissueMap, muscleMap, boneMap, roughnessMap] = _clinicalCanvases.map((canvas) => new THREE.CanvasTexture(canvas));
  map.colorSpace = THREE.SRGBColorSpace;
  const textures = [map, tissueMap, muscleMap, boneMap, roughnessMap];
  textures.forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  });
  map.repeat.set(5, 8);
  tissueMap.repeat.set(12, 18);
  muscleMap.repeat.set(5, 24);
  boneMap.repeat.set(18, 24);
  roughnessMap.repeat.set(10, 16);
  return { map, tissueMap, muscleMap, boneMap, roughnessMap, textures };
}

export default function Anatomy3DViewer({ genitalia = "male", activeSystems, selectedId, isolatedId, reconstructId, onSelectStructure, resetNonce, pathologyStructureId = null, viewMode = "full", structureOverrides = {}, hiddenStructures = [], clippedStructures = [], customStructures = [], editMode = false, onTransformStructure, onTransformDefaults }) {
  const mountRef = useRef(null);
  const invalidateRef = useRef(() => {});
  const groupsRef = useRef({});            // id -> THREE.Group (structure)
  const baseColorsRef = useRef({});        // id -> THREE.Color
  const shellRef = useRef(null);
  const importedSurfaceRef = useRef(null);
  const materialsRef = useRef([]);
  const clippingPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.015));
  const genitaliaRef = useRef(genitalia);
  genitaliaRef.current = genitalia;
  const reconstructAnimRef = useRef({ active: false, t: 0 });
  const pathologyRef = useRef(null);
  pathologyRef.current = pathologyStructureId;
  const controlsRef = useRef({ reset: null });  // set by setup effect
  const customGroupRef = useRef(null);          // admin-added structures container
  const customGroupsRef = useRef({});           // id -> THREE.Group (custom)
  const neonOutlineRef = useRef(null);          // integumentary neon outline group
  const cbRef = useRef(onSelectStructure);
  cbRef.current = onSelectStructure;
  const editModeRef = useRef(editMode); editModeRef.current = editMode;
  const selectedIdRef = useRef(selectedId); selectedIdRef.current = selectedId;
  const transformCbRef = useRef(onTransformStructure); transformCbRef.current = onTransformStructure;

  const overridesRef = useRef(structureOverrides); overridesRef.current = structureOverrides;
  const defaultsCbRef = useRef(onTransformDefaults); defaultsCbRef.current = onTransformDefaults;
  const publishDefaults = () => defaultsCbRef.current?.(Object.fromEntries(
    Object.entries(groupsRef.current).map(([id, group]) => [id, {
      position: group.userData.transformBase?.position.toArray() || [0, 0, 0],
      rotation: group.userData.transformBase?.rotation.toArray().slice(0, 3) || [0, 0, 0],
    }])
  ));

  // ── Scene setup (once) ──
  useEffect(() => {
    const mount = mountRef.current;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const spherical = { radius: 3.2, theta: Math.PI * 0.5, phi: Math.PI * 0.42 };
    const viewTween = { radius: 3.2, target: new THREE.Vector3(0, 0.95, 0) };
    const updateCamera = () => {
      const sinPhi = Math.sin(spherical.phi);
      camera.position.set(
        BODY_TARGET.x + spherical.radius * sinPhi * Math.cos(spherical.theta),
        BODY_TARGET.y + spherical.radius * Math.cos(spherical.phi),
        BODY_TARGET.z + spherical.radius * sinPhi * Math.sin(spherical.theta)
      );
      camera.lookAt(BODY_TARGET);
      invalidateRef.current();
    };
    controlsRef.current.reset = () => {
      spherical.radius = viewTween.radius = 3.2;
      spherical.theta = Math.PI * 0.5;
      spherical.phi = Math.PI * 0.42;
      BODY_TARGET.set(0, 0.95, 0);
      viewTween.target.copy(BODY_TARGET);
      updateCamera();
    };
    controlsRef.current.setView = (mode) => {
      const torso = mode === "torso" || mode === "cross-section";
      viewTween.radius = torso ? 1.62 : 3.2;
      viewTween.target.set(0, torso ? 1.18 : 0.95, 0);
      if (mode === "cross-section") {
        spherical.theta = Math.PI * 0.5;
        spherical.phi = Math.PI * 0.5;
      }
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    const clinicalTextures = createClinicalTextures(renderer);
    mount.appendChild(renderer.domElement);

    // High-key clinical three-point studio lighting.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8eef3, 1.05));
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));

    const key = new THREE.DirectionalLight(0xffe5d2, 2.45);
    key.position.set(-3.2, 4.8, 3.4);
    key.target.position.set(0, 0.95, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 2.4;
    key.shadow.camera.bottom = -0.5;
    key.shadow.bias = -0.00025;
    key.shadow.normalBias = 0.015;
    key.shadow.radius = 7;
    scene.add(key, key.target);

    const fill = new THREE.DirectionalLight(0xf8fafc, 1.28);
    fill.position.set(3.5, 2.6, 3);
    fill.target.position.set(0, 1, 0);
    scene.add(fill, fill.target);

    const rim = new THREE.DirectionalLight(0xb9e6ff, 1.65);
    rim.position.set(1.4, 2.7, -3.6);
    rim.target.position.set(0, 1.05, 0);
    scene.add(rim, rim.target);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      new THREE.ShadowMaterial({ color: 0x64748b, transparent: true, opacity: 0.13 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.006;
    floor.receiveShadow = true;
    scene.add(floor);

    // Body shell (translucent cadaver mannequin)
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0b6a3, map: clinicalTextures.map, bumpMap: clinicalTextures.tissueMap,
      bumpScale: 0.006, roughnessMap: clinicalTextures.roughnessMap, roughness: 0.46,
      metalness: 0, transparent: true, opacity: 0.16, depthWrite: false,
      side: THREE.DoubleSide, transmission: 0.28, thickness: 0.34,
      attenuationColor: new THREE.Color(0xc74f58), attenuationDistance: 0.72,
      clearcoat: 0.16, clearcoatRoughness: 0.64, sheen: 0.22,
      sheenColor: new THREE.Color(0xffb4ae), specularIntensity: 0.38,
    });
    materialsRef.current = [shellMat];
    const shellGroup = new THREE.Group();
    const buildShell = (parts) => {
      while (shellGroup.children.length) shellGroup.remove(shellGroup.children[0]);
      parts.forEach((p) => {
        const mesh = new THREE.Mesh(buildGeometry(p.shape), shellMat);
        if (p.position) mesh.position.set(p.position[0], p.position[1], p.position[2]);
        if (p.rotation) mesh.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
        mesh.renderOrder = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        shellGroup.add(mesh);
      });
    };
    buildShell(BODY_SHELLS.male.parts);
    scene.add(shellGroup);
    shellRef.current = { group: shellGroup, mat: shellMat, build: buildShell };

    // Integumentary neon outline — a wireframe clone of the body shell that
    // traces the silhouette exactly, replacing the legacy floating "skin"
    // ellipsoid so the integumentary layer conforms to the visible body.
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x2ee6d6, wireframe: true, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
    neonMat.userData.isNeonOutline = true;
    materialsRef.current.push(neonMat);
    const neonGroup = new THREE.Group();
    neonGroup.userData.id = "skin";
    const buildNeonOutline = (parts) => {
      while (neonGroup.children.length) neonGroup.remove(neonGroup.children[0]);
      neonGroup.position.set(0, 0, 0);
      neonGroup.scale.set(1, 1, 1);
      neonGroup.rotation.set(0, 0, 0);
      parts.forEach((p) => {
        const mesh = new THREE.Mesh(buildGeometry(p.shape), neonMat);
        if (p.position) mesh.position.set(p.position[0], p.position[1], p.position[2]);
        if (p.rotation) mesh.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
        mesh.userData.id = "skin";
        neonGroup.add(mesh);
      });
    };
    // Build the neon outline from a loaded object (e.g. the imported male OBJ
    // surface) so the wireframe conforms to the VISIBLE body instead of the
    // procedural fallback shell — preventing the floating vertical columns
    // that appear when the two bodies differ in proportion.
    const buildNeonFromObject = (object) => {
      while (neonGroup.children.length) neonGroup.remove(neonGroup.children[0]);
      neonGroup.position.copy(object.position);
      neonGroup.scale.copy(object.scale);
      neonGroup.rotation.copy(object.rotation);
      object.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        const wm = new THREE.Mesh(m.geometry, neonMat);
        wm.position.copy(m.position);
        wm.rotation.copy(m.rotation);
        wm.scale.copy(m.scale);
        wm.userData.id = "skin";
        neonGroup.add(wm);
      });
    };
    buildNeonOutline(BODY_SHELLS.male.parts);
    scene.add(neonGroup);
    neonOutlineRef.current = { group: neonGroup, mat: neonMat, build: buildNeonOutline, buildFromObject: buildNeonFromObject };
    groupsRef.current["skin"] = neonGroup;
    baseColorsRef.current["skin"] = new THREE.Color(0x2ee6d6);

    // User-supplied anatomical base mesh. The procedural shell remains as the
    // female and low-bandwidth fallback so the learning module never blocks.
    const surfaceMat = shellMat.clone();
    materialsRef.current.push(surfaceMat);
    surfaceMat.opacity = 0.28;
    // Translucent surface must NOT write depth, otherwise it occludes the
    // internal organs from every angle and blocks 360° visibility.
    surfaceMat.depthWrite = false;
    new OBJLoader().load(
      "/models/anatomy/male-surface.obj",
      (object) => {
        if (disposed) { object.traverse((mesh) => mesh.geometry?.dispose()); return; }
        object.name = "Imported anatomical surface";
        object.scale.setScalar(0.205);
        object.position.set(0, 0.02, 0);
        object.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.material = surfaceMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        object.visible = true;
        shellGroup.visible = false;
        scene.add(object);
        importedSurfaceRef.current = object;
        // The imported surface is the visual source of truth. Re-map every
        // procedural system to its measured proportions before hiding the
        // fallback shell, so limb structures track the actual silhouette.
        structGroup.children.forEach((group) => applyTransform(group));
        conformGroupsToBodyEnvelope(
          shellGroup,
          object,
          structGroup.children,
          0.975,
        );
        structGroup.children.forEach((group) => {
          group.userData.constrainedScale = group.scale.clone();
          captureTransform(group);
          applyTransform(group, overridesRef.current[group.userData.id]);
        });
        // Conform the integumentary neon outline to the real imported surface
        // so it traces the visible body, not the procedural fallback shell.
        if (neonOutlineRef.current) {
          neonOutlineRef.current.buildFromObject(object);
          captureTransform(neonGroup);
          applyTransform(neonGroup, overridesRef.current.skin);
        }
        publishDefaults();
        invalidateRef.current();
      },
      undefined,
      () => { if (!disposed) { shellGroup.visible = true; invalidateRef.current(); } }
    );

    // Structures
    const structGroup = new THREE.Group();
    scene.add(structGroup);

    // Admin-added custom structures container
    const customGroup = new THREE.Group();
    scene.add(customGroup);
    customGroupRef.current = customGroup;
    ANATOMY_STRUCTURES.forEach((s) => {
      if (s.id === "skin") return; // integumentary rendered as neon outline above
      const grp = new THREE.Group();
      grp.userData.id = s.id;
      const isBone = s.system === "skeletal";
      const isMuscle = s.system === "muscular";
      const isLymphatic = s.system === "lymphatic";
      const isIntegumentary = s.system === "integumentary";
      const isDiaphragm = s.id === "diaphragm";
      const isVascular = ["aorta", "vena_cava", "arterial_tree", "venous_tree"].includes(s.id);
      const hasCapsule = ["liver", "kidneys", "spleen"].includes(s.id);
      const isParenchymal = ["liver", "kidneys", "lungs", "spleen", "brain"].includes(s.id);
      const color = new THREE.Color(
        isBone ? 0xe8deca : isLymphatic ? (s.color ?? 0xd6aa58) : (s.color ?? SYSTEM_META[s.system].color)
      );
      const bumpTexture = isBone
        ? clinicalTextures.boneMap
        : isMuscle
          ? clinicalTextures.muscleMap
          : clinicalTextures.tissueMap;
      const educationalOpacity = isIntegumentary ? 0.2 : isMuscle ? 0.68 : isDiaphragm ? 0.5 : isLymphatic ? 0.76 : 1;
      const mat = new THREE.MeshPhysicalMaterial({
        color: isDiaphragm ? new THREE.Color(0xd9f2f1) : color,
        metalness: 0,
        roughness: isBone ? 0.84 : isMuscle ? 0.62 : isDiaphragm ? 0.72 : hasCapsule ? 0.38 : isVascular ? 0.44 : 0.5,
        roughnessMap: isBone ? clinicalTextures.boneMap : clinicalTextures.roughnessMap,
        bumpMap: bumpTexture,
        bumpScale: isBone ? 0.0045 : isMuscle ? 0.006 : isVascular ? 0.0015 : 0.003,
        aoMap: bumpTexture,
        aoMapIntensity: isBone ? 0.38 : 0.22,
        transparent: educationalOpacity < 1,
        opacity: educationalOpacity,
        depthWrite: educationalOpacity >= 0.95,
        side: THREE.DoubleSide,
        clearcoat: isBone ? 0 : hasCapsule ? 0.2 : isDiaphragm ? 0.04 : isVascular ? 0.08 : 0.06,
        clearcoatRoughness: hasCapsule ? 0.58 : 0.74,
        sheen: isBone ? 0 : isMuscle ? 0.16 : 0.1,
        sheenColor: color.clone().lerp(new THREE.Color(0xffffff), 0.26),
        transmission: isBone ? 0 : isDiaphragm ? 0.46 : isMuscle ? 0.035 : isLymphatic ? 0.2 : isParenchymal ? 0.085 : 0.025,
        thickness: isDiaphragm ? 0.025 : isMuscle ? 0.035 : isLymphatic ? 0.04 : isParenchymal ? 0.14 : 0.055,
        attenuationColor: color.clone().multiplyScalar(0.78),
        attenuationDistance: isParenchymal ? 0.38 : 0.7,
        specularIntensity: isBone ? 0.12 : hasCapsule ? 0.36 : 0.25,
      });
      mat.userData.educationalOpacity = educationalOpacity;
      mat.userData.educationalDepthWrite = educationalOpacity >= 0.95;
      materialsRef.current.push(mat);
      const partDefs = s.parts ? s.parts : [{ shape: s.shape, position: [0, 0, 0], rotation: s.rotation, scale: s.scale }];
      partDefs.forEach((p) => {
        const mesh = new THREE.Mesh(buildGeometry(p.shape), mat);
        if (mesh.geometry.attributes.uv && !mesh.geometry.attributes.uv2) {
          mesh.geometry.setAttribute("uv2", mesh.geometry.attributes.uv.clone());
        }
        if (p.position) mesh.position.set(p.position[0], p.position[1], p.position[2]);
        if (p.rotation) mesh.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
        if (p.scale) applyScale(mesh, p.scale);
        else if (s.scale) applyScale(mesh, s.scale);
        mesh.userData.id = s.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        grp.add(mesh);
      });
      if (s.position) grp.position.set(s.position[0], s.position[1], s.position[2]);
      if (s.rotation) grp.rotation.set(s.rotation[0], s.rotation[1], s.rotation[2]);
      structGroup.add(grp);
      if (["brain", "heart", "lungs", "liver", "stomach", "kidneys", "bladder"].includes(s.id)) {
        alignAnatomicalGroupToBody(shellGroup, grp, s.id, { applyScale: false });
      }
      if (["muscular", "skeletal", "nervous", "cardiovascular"].includes(s.system)) {
        keepGroupInsideBodyEnvelope(shellGroup, grp);
      }
      grp.userData.constrainedScale = grp.scale.clone();
      groupsRef.current[s.id] = grp;
      baseColorsRef.current[s.id] = color;
    });

    Object.values(groupsRef.current).forEach(captureTransform);
    publishDefaults();

    // ── Orbit controls (manual) ──
    let dragging = false, panning = false, lastX = 0, lastY = 0;
    let movingId = null;
    let moveStart = null;
    const onDown = (e) => {
      // Edit-mode grab: if a structure is selected and the pointer lands on it,
      // translate the organ instead of orbiting the camera.
      if (e.isPrimary === false || e.button > 2) return;
      if (editModeRef.current && e.button === 0 && !e.shiftKey) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const pickMeshes = [];
        Object.values(groupsRef.current).forEach((g) => { if (g.visible) g.traverse((m) => { if (m.isMesh) pickMeshes.push(m); }); });
        const hits = raycaster.intersectObjects(pickMeshes, false);
        if (hits.length && hits[0].object.userData.id) {
          movingId = hits[0].object.userData.id;
          cbRef.current?.(movingId);
          renderer.domElement.setPointerCapture(e.pointerId);
          const grp = groupsRef.current[movingId];
          moveStart = { x: e.clientX, y: e.clientY, pos: grp.position.clone() };
          renderer.domElement.style.cursor = "move";
          return;
        }
      }
      dragging = true; panning = e.button === 2 || e.shiftKey;
      lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (movingId && !editModeRef.current) { movingId = null; moveStart = null; }
      if (movingId) {
        const grp = groupsRef.current[movingId];
        if (grp && moveStart) {
          const dx = e.clientX - moveStart.x;
          const dy = e.clientY - moveStart.y;
          const dist = camera.position.distanceTo(grp.getWorldPosition(new THREE.Vector3()));
          const scale = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / renderer.domElement.clientHeight;
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
          const next = moveStart.pos.clone().addScaledVector(right, dx * scale).addScaledVector(up, -dy * scale);
          grp.position.copy(next);
          invalidateRef.current();
        }
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (panning) {
        const panScale = spherical.radius * 0.0008;
        const right = new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize();
        const up = camera.up.clone();
        BODY_TARGET.addScaledVector(right, -dx * panScale);
        BODY_TARGET.addScaledVector(up, dy * panScale);
      } else {
        spherical.theta -= dx * 0.006;
        spherical.phi -= dy * 0.006;
        spherical.phi = Math.max(0.18, Math.min(Math.PI - 0.18, spherical.phi));
      }
      updateCamera();
      viewTween.radius = spherical.radius;
      viewTween.target.copy(BODY_TARGET);
    };
    const onUp = () => {
      if (movingId) {
        const grp = groupsRef.current[movingId];
        if (grp && editModeRef.current) transformCbRef.current?.(movingId, { position: grp.position.clone().sub(grp.userData.pivotOffset || new THREE.Vector3()).toArray() });
        movingId = null;
        moveStart = null;
        renderer.domElement.style.cursor = "grab";
        return;
      }
      dragging = false; renderer.domElement.style.cursor = "grab";
    };
    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius *= 1 + e.deltaY * 0.0012;
      spherical.radius = Math.max(1.2, Math.min(8, spherical.radius));
      viewTween.radius = spherical.radius;
      viewTween.target.copy(BODY_TARGET);
      updateCamera();
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";
    window.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    // ── Picking ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0, downY = 0;
    const onPickDown = (e) => { downX = e.clientX; downY = e.clientY; };
    const onPickUp = (e) => {
      if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) return; // dragged, not a click
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = [];
      Object.values(groupsRef.current).forEach((g) => {
        if (g.visible) g.traverse((m) => { if (m.isMesh) meshes.push(m); });
      });
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length && hits[0].object.userData.id) cbRef.current?.(hits[0].object.userData.id);
    };
    renderer.domElement.addEventListener("pointerdown", onPickDown);
    renderer.domElement.addEventListener("pointerup", onPickUp);

    // ── Render loop ──
    const clock = new THREE.Clock();
    let raf = 0;
    let inView = true;
    let rendering = false;
    const requestRender = () => {
      if (!disposed && !rendering && !raf && inView && !document.hidden) raf = requestAnimationFrame(animate);
    };
    invalidateRef.current = requestRender;
    const animate = () => {
      raf = 0;
      if (disposed || !inView || document.hidden) return;
      rendering = true;
      const dt = Math.min(0.05, Math.max(1 / 60, clock.getDelta()));
      const viewEase = 1 - Math.exp(-dt * 5.2);
      spherical.radius = THREE.MathUtils.lerp(spherical.radius, viewTween.radius, viewEase);
      BODY_TARGET.lerp(viewTween.target, viewEase);
      updateCamera();
      // Reconstruct build-up animation
      const ra = reconstructAnimRef.current;
      if (ra.active) {
        ra.t = Math.min(1, ra.t + dt / 1.4);
        const grp = groupsRef.current[ra.id];
        if (grp) {
          grp.traverse((m) => {
            if (m.isMesh) {
              m.material.opacity = 0.12 + 0.88 * easeOut(ra.t);
              m.material.emissive = baseColorsRef.current[ra.id].clone().multiplyScalar(0.35 * (1 - ra.t));
              m.material.wireframe = ra.t < 0.6;
            }
          });
          const sc = 0.6 + 0.4 * easeOut(ra.t);
          grp.scale.setScalar(sc);
        }
        if (ra.t >= 1) { ra.active = false; }
      }
      const pathologyId = pathologyRef.current;
      Object.entries(groupsRef.current).forEach(([id, grp]) => {
        if (id !== pathologyId || !grp.visible || reconstructAnimRef.current.active) return;
        const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.055;
        grp.scale.setScalar(pulse);
        grp.traverse((m) => {
          if (!m.isMesh) return;
          if (m.material.userData.isNeonOutline) return;
          m.material.emissive = new THREE.Color(0xff4d6d);
          m.material.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 3.4) * 0.2;
        });
      });
      renderer.render(scene, camera);
      rendering = false;
      const moving = Math.abs(spherical.radius - viewTween.radius) > 0.0005 || BODY_TARGET.distanceTo(viewTween.target) > 0.0005;
      if (moving || ra.active || groupsRef.current[pathologyId]?.visible) requestRender();
    };
    const onVisibility = () => {
      if (document.hidden || !inView) { cancelAnimationFrame(raf); raf = 0; }
      else requestRender();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; onVisibility(); });
    observer.observe(mount);
    document.addEventListener("visibilitychange", onVisibility);
    requestRender();

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      requestRender();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      disposed = true;
      invalidateRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("pointerdown", onPickDown);
      renderer.domElement.removeEventListener("pointerup", onPickUp);
      clinicalTextures.textures.forEach((texture) => texture.dispose());
      materialsRef.current = [];
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    controlsRef.current.setView?.(viewMode);
    // Global cross-section clips only the body shell/surface; per-structure
    // clipping is handled in the visibility effect below so admin cuts persist.
    const planes = viewMode === "cross-section" ? [clippingPlaneRef.current] : [];
    if (shellRef.current) {
      shellRef.current.mat.clippingPlanes = planes;
      shellRef.current.mat.clipShadows = viewMode === "cross-section";
      shellRef.current.mat.needsUpdate = true;
    }
    const imported = importedSurfaceRef.current;
    if (imported) {
      imported.traverse((m) => {
        if (m.isMesh) {
          m.material.clippingPlanes = planes;
          m.material.clipShadows = viewMode === "cross-section";
          m.material.needsUpdate = true;
        }
      });
    }
  }, [viewMode]);

  // ── Visibility: genitalia + active systems + isolate + admin overrides ──
  useEffect(() => {
    const isolated = isolatedId;
    const hidden = new Set(hiddenStructures || []);
    const clipped = new Set(clippedStructures || []);
    const overrides = structureOverrides || {};
    const globalClip = viewMode === "cross-section" ? [clippingPlaneRef.current] : [];
    Object.entries(groupsRef.current).forEach(([id, grp]) => {
      const def = ANATOMY_STRUCTURES.find((s) => s.id === id);
      // Apply admin position/rotation overrides
      applyTransform(grp, overrides[id]);
      if (!def) {
        // Custom admin-added structure
        grp.visible = !hidden.has(id);
        grp.traverse((m) => {
          if (m.isMesh) {
            m.material.clippingPlanes = clipped.has(id) ? [clippingPlaneRef.current] : globalClip;
            m.material.clipShadows = clipped.has(id) || viewMode === "cross-section";
            m.material.needsUpdate = true;
          }
        });
        return;
      }
      let visible;
      if (isolated) {
        visible = id === isolated;
      } else {
        const genderMatch = def.genders === "both" || def.genders === genitaliaRef.current;
        const systemActive = activeSystems.includes(def.system);
        visible = genderMatch && systemActive;
      }
      visible = visible && !hidden.has(id);
      grp.visible = visible;
      if (visible) {
        grp.traverse((m) => {
          if (!m.isMesh) return;
          // Neon outline keeps its wireframe/opacity; only clipping is applied.
          if (m.material.userData.isNeonOutline) {
            m.material.clippingPlanes = clipped.has(id) ? [clippingPlaneRef.current] : globalClip;
            m.material.clipShadows = clipped.has(id) || viewMode === "cross-section";
            m.material.needsUpdate = true;
            return;
          }
          const educationalOpacity = m.material.userData.educationalOpacity ?? 1;
          m.material.opacity = id === isolated ? 1 : educationalOpacity;
          m.material.depthWrite = id === isolated ? true : (m.material.userData.educationalDepthWrite ?? true);
          m.material.wireframe = false;
          m.material.emissive = new THREE.Color(0x000000);
          m.material.clippingPlanes = clipped.has(id) ? [clippingPlaneRef.current] : globalClip;
          m.material.clipShadows = clipped.has(id) || viewMode === "cross-section";
          m.material.needsUpdate = true;
        });
        // Preserve the OBJ-conformed scale of the integumentary neon outline
        // so toggling the layer off/on keeps it aligned with the visible body.
        // applyTransform preserves the fitted baseline scale and chosen size.
      }
    });
    // Dim shell when isolating
    if (shellRef.current) {
      shellRef.current.mat.opacity = isolated ? 0.03 : 0.16;
    }
  }, [genitalia, activeSystems, isolatedId, hiddenStructures, structureOverrides, clippedStructures, viewMode]);

  // ── Selected highlight ──
  useEffect(() => {
    Object.entries(groupsRef.current).forEach(([id, grp]) => {
      grp.traverse((m) => {
        if (!m.isMesh) return;
        if (m.material.userData.isNeonOutline) return;
        if (id === selectedId && !reconstructAnimRef.current.active) {
          m.material.emissive = baseColorsRef.current[id].clone().multiplyScalar(0.45);
          m.material.emissiveIntensity = 1;
        } else if (id !== isolatedId) {
          m.material.emissive = new THREE.Color(0x000000);
        }
      });
    });
  }, [selectedId, isolatedId]);

  // ── Trigger reconstruct animation ──
  useEffect(() => {
    if (!reconstructId) { reconstructAnimRef.current.active = false; return; }
    reconstructAnimRef.current = { active: true, t: 0, id: reconstructId };
  }, [reconstructId]);

  // ── Admin custom structures (add/remove at runtime) ──
  useEffect(() => {
    const group = customGroupRef.current;
    if (!group) return;
    // Dispose & remove previous custom groups
    Object.values(customGroupsRef.current).forEach((grp) => {
      grp.traverse((m) => { if (m.isMesh) m.geometry?.dispose?.(); });
      group.remove(grp);
      if (grp.userData.id) {
        delete groupsRef.current[grp.userData.id];
        delete baseColorsRef.current[grp.userData.id];
      }
    });
    customGroupsRef.current = {};
    (customStructures || []).forEach((c) => {
      const color = new THREE.Color(c.color ?? 0x765AB0);
      const mat = new THREE.MeshPhysicalMaterial({
        color, metalness: 0, roughness: 0.5, transparent: true, opacity: 0.92,
        side: THREE.DoubleSide, clearcoat: 0.12, depthWrite: true,
      });
      mat.userData.educationalOpacity = 0.92;
      mat.userData.educationalDepthWrite = true;
      materialsRef.current.push(mat);
      const grp = new THREE.Group();
      grp.userData.id = c.id;
      grp.userData.custom = true;
      const mesh = new THREE.Mesh(buildGeometry(c.shape), mat);
      if (c.position) mesh.position.set(c.position[0], c.position[1], c.position[2]);
      if (c.rotation) mesh.rotation.set(c.rotation[0], c.rotation[1], c.rotation[2]);
      if (c.scale) mesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
      mesh.userData.id = c.id;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      grp.add(mesh);
      group.add(grp);
      captureTransform(grp);
      applyTransform(grp, overridesRef.current[c.id]);
      grp.visible = !hiddenStructures.includes(c.id);
      customGroupsRef.current[c.id] = grp;
      groupsRef.current[c.id] = grp;
      baseColorsRef.current[c.id] = color;
    });
    publishDefaults();
  }, [customStructures]);

  // ── Reset camera ──
  useEffect(() => {
    controlsRef.current.reset?.();
  }, [resetNonce]);

  useEffect(() => {
    invalidateRef.current();
  }, [genitalia, activeSystems, selectedId, isolatedId, reconstructId, resetNonce, pathologyStructureId, viewMode, structureOverrides, hiddenStructures, clippedStructures, customStructures]);

  return <div ref={mountRef} className="w-full h-full" />;
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }