import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { BODY_SHELLS, ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";
import { alignAnatomicalGroupToBody } from "@/lib/anatomicalSpatialAnchors";

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

/**
 * Normalises a dynamically-loaded skin mesh to the procedural body envelope:
 * resets its transform, fits it to the body height and aligns bounding-box
 * centres, so the imported asset shares the same origin and bounds as the
 * runtime-generated organs. Both objects must share a common parent (BodyRoot).
 */
function normalizeSurfaceToBody(surface, bodyEnvelope) {
  if (!surface || !bodyEnvelope) return;
  bodyEnvelope.updateWorldMatrix(true, true);
  const bodyBox = new THREE.Box3().setFromObject(bodyEnvelope);
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
  if (bodySize.y <= 0) return;

  surface.scale.setScalar(1);
  surface.position.set(0, 0, 0);
  surface.rotation.set(0, 0, 0);
  surface.updateWorldMatrix(true, true);
  const surfSize = new THREE.Box3().setFromObject(surface).getSize(new THREE.Vector3());
  if (surfSize.y <= 0) return;

  const scale = bodySize.y / surfSize.y;
  surface.scale.setScalar(scale);
  surface.updateWorldMatrix(true, true);
  const scaledCenter = new THREE.Box3().setFromObject(surface).getCenter(new THREE.Vector3());
  // BodyRoot has an identity transform, so world space == local space here.
  surface.position.copy(bodyCenter.clone().sub(scaledCenter));
  surface.updateWorldMatrix(true, true);
}

function createClinicalTextures(renderer) {
  const size = renderer.capabilities.maxTextureSize >= 4096 && window.devicePixelRatio > 1 ? 1024 : 512;
  const canvases = Array.from({ length: 5 }, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    return canvas;
  });
  const [colourCanvas, tissueCanvas, muscleCanvas, boneCanvas, roughnessCanvas] = canvases;
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
  const [map, tissueMap, muscleMap, boneMap, roughnessMap] = canvases.map((canvas) => new THREE.CanvasTexture(canvas));
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

export default function Anatomy3DViewer({ gender, activeSystems, selectedId, isolatedId, reconstructId, onSelectStructure, resetNonce, pathologyStructureId = null, viewMode = "full" }) {
  const mountRef = useRef(null);
  const groupsRef = useRef({});            // id -> THREE.Group (structure)
  const baseColorsRef = useRef({});        // id -> THREE.Color
  const shellRef = useRef(null);
  const bodyRootRef = useRef(null);
  const importedSurfaceRef = useRef(null);
  const materialsRef = useRef([]);
  const clippingPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.015));
  const genderRef = useRef(gender);
  genderRef.current = gender;
  const reconstructAnimRef = useRef({ active: false, t: 0 });
  const pathologyRef = useRef(null);
  pathologyRef.current = pathologyStructureId;
  const controlsRef = useRef({ reset: null });  // set by setup effect
  const cbRef = useRef(onSelectStructure);
  cbRef.current = onSelectStructure;

  // ── Scene setup (once) ──
  useEffect(() => {
    const mount = mountRef.current;
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    const clinicalTextures = createClinicalTextures(renderer);
    mount.appendChild(renderer.domElement);

    // Single unified root container — shell, imported surface and all anatomical
    // systems share origin (0,0,0) and an identity transform matrix, so global
    // translations/rotations applied here propagate equally to every system.
    const bodyRoot = new THREE.Group();
    bodyRoot.name = "BodyRoot";
    scene.add(bodyRoot);
    bodyRootRef.current = bodyRoot;

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
    buildShell(BODY_SHELLS[gender] ? BODY_SHELLS[gender].parts : BODY_SHELLS.male.parts);
    bodyRoot.add(shellGroup);
    shellRef.current = { group: shellGroup, mat: shellMat, build: buildShell };

    // User-supplied anatomical base mesh. The procedural shell remains as the
    // female and low-bandwidth fallback so the learning module never blocks.
    const surfaceMat = shellMat.clone();
    materialsRef.current.push(surfaceMat);
    surfaceMat.opacity = 0.28;
    surfaceMat.depthWrite = true;
    new OBJLoader().load(
      "/models/anatomy/male-surface.obj",
      (object) => {
        object.name = "Imported anatomical surface";
        object.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.material = surfaceMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        // Unify origin + bounding box with the procedural body envelope so the
        // external skin mesh and internal organs share the same frame.
        normalizeSurfaceToBody(object, shellGroup);
        object.visible = genderRef.current === "male";
        shellGroup.visible = genderRef.current !== "male";
        bodyRoot.add(object);
        importedSurfaceRef.current = object;
      },
      undefined,
      () => { shellGroup.visible = true; }
    );

    // Structures
    const structGroup = new THREE.Group();
    bodyRoot.add(structGroup);
    ANATOMY_STRUCTURES.forEach((s) => {
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
      const educationalOpacity = isIntegumentary ? 0.2 : isMuscle ? 0.36 : isDiaphragm ? 0.5 : isLymphatic ? 0.76 : 1;
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
        side: isMuscle || isIntegumentary || isDiaphragm ? THREE.DoubleSide : THREE.FrontSide,
        clearcoat: isBone ? 0 : hasCapsule ? 0.2 : isDiaphragm ? 0.04 : isVascular ? 0.08 : 0.06,
        clearcoatRoughness: hasCapsule ? 0.58 : 0.74,
        sheen: isBone ? 0 : isMuscle ? 0.16 : 0.1,
        sheenColor: color.clone().lerp(new THREE.Color(0xffffff), 0.26),
        transmission: isBone ? 0 : isDiaphragm ? 0.46 : isMuscle ? 0.12 : isLymphatic ? 0.2 : isParenchymal ? 0.085 : 0.025,
        thickness: isDiaphragm ? 0.025 : isMuscle ? 0.06 : isLymphatic ? 0.04 : isParenchymal ? 0.14 : 0.055,
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
      groupsRef.current[s.id] = grp;
      baseColorsRef.current[s.id] = color;
    });

    // ── Orbit controls (manual) ──
    let dragging = false, panning = false, lastX = 0, lastY = 0;
    const onDown = (e) => {
      dragging = true; panning = e.button === 2 || e.shiftKey;
      lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e) => {
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
    const onUp = () => { dragging = false; renderer.domElement.style.cursor = "grab"; };
    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius *= 1 + e.deltaY * 0.0012;
      spherical.radius = Math.max(1.2, Math.min(8, spherical.radius));
      viewTween.radius = spherical.radius;
      viewTween.target.copy(BODY_TARGET);
      updateCamera();
    };
    renderer.domElement.style.cursor = "grab";
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
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
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
      const heart = groupsRef.current.heart;
      if (heart?.visible && pathologyId !== "heart" && !ra.active) {
        const beatPhase = clock.elapsedTime % 0.82;
        const beat = beatPhase < 0.12 ? Math.sin((beatPhase / 0.12) * Math.PI) : 0;
        heart.scale.setScalar(1 + beat * 0.075);
      }
      const lungs = groupsRef.current.lungs;
      if (lungs?.visible && pathologyId !== "lungs" && !ra.active) {
        const breath = Math.sin(clock.elapsedTime * 1.35) * 0.035;
        lungs.scale.set(1 + breath * 0.45, 1 + breath, 1 + breath * 0.6);
      }
      Object.entries(groupsRef.current).forEach(([id, grp]) => {
        if (id !== pathologyId || !grp.visible || reconstructAnimRef.current.active) return;
        const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.055;
        grp.scale.setScalar(pulse);
        grp.traverse((m) => {
          if (m.isMesh) {
            m.material.emissive = new THREE.Color(0xff4d6d);
            m.material.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 3.4) * 0.2;
          }
        });
      });
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
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
    const clippingPlanes = viewMode === "cross-section" ? [clippingPlaneRef.current] : [];
    materialsRef.current.forEach((material) => {
      material.clippingPlanes = clippingPlanes;
      material.clipShadows = viewMode === "cross-section";
      material.needsUpdate = true;
    });
  }, [viewMode]);

  // ── Rebuild shell on gender change ──
  useEffect(() => {
    const sh = shellRef.current;
    if (!sh) return;
    sh.build(BODY_SHELLS[gender] ? BODY_SHELLS[gender].parts : BODY_SHELLS.male.parts);
    const imported = importedSurfaceRef.current;
    if (imported) {
      if (gender === "male") normalizeSurfaceToBody(imported, sh.group);
      imported.visible = gender === "male";
    }
    sh.group.visible = gender !== "male" || !imported;
  }, [gender]);

  // ── Visibility: gender + active systems + isolate ──
  useEffect(() => {
    const isolated = isolatedId;
    Object.entries(groupsRef.current).forEach(([id, grp]) => {
      const def = ANATOMY_STRUCTURES.find((s) => s.id === id);
      if (!def) return;
      let visible;
      if (isolated) {
        visible = id === isolated;
      } else {
        const genderMatch = def.genders === "both" || def.genders === gender;
        const systemActive = activeSystems.includes(def.system);
        visible = genderMatch && systemActive;
      }
      grp.visible = visible;
      if (visible) {
        grp.traverse((m) => {
          if (m.isMesh) {
            const educationalOpacity = m.material.userData.educationalOpacity ?? 1;
            m.material.opacity = id === isolated ? 1 : educationalOpacity;
            m.material.depthWrite = id === isolated ? true : (m.material.userData.educationalDepthWrite ?? true);
            m.material.wireframe = false;
            m.material.emissive = new THREE.Color(0x000000);
          }
        });
        grp.scale.setScalar(1);
      }
    });
    // Dim shell when isolating
    if (shellRef.current) {
      shellRef.current.mat.opacity = isolated ? 0.03 : 0.16;
    }
  }, [gender, activeSystems, isolatedId]);

  // ── Selected highlight ──
  useEffect(() => {
    Object.entries(groupsRef.current).forEach(([id, grp]) => {
      grp.traverse((m) => {
        if (!m.isMesh) return;
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

  // ── Reset camera ──
  useEffect(() => {
    controlsRef.current.reset?.();
  }, [resetNonce]);

  return <div ref={mountRef} className="w-full h-full" />;
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }