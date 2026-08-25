import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { BODY_SHELLS, ANATOMY_STRUCTURES, SYSTEM_META } from "@/lib/anatomy3D";

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

function createOrganicTextures(renderer) {
  const size = 256;
  const colourCanvas = document.createElement("canvas");
  const detailCanvas = document.createElement("canvas");
  colourCanvas.width = colourCanvas.height = detailCanvas.width = detailCanvas.height = size;
  const colour = colourCanvas.getContext("2d");
  const detail = detailCanvas.getContext("2d");
  const colourImage = colour.createImageData(size, size);
  const detailImage = detail.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const pores = Math.sin(x * 0.61) * Math.cos(y * 0.47) * 5 + Math.sin((x + y) * 0.19) * 3;
      const vessel = Math.max(0, 1 - Math.abs(Math.sin(x * 0.035 + Math.sin(y * 0.04) * 1.8))) * (Math.sin(y * 0.11) > 0.7 ? 14 : 0);
      colourImage.data.set([210 + pores, 142 + pores - vessel * .28, 128 + pores - vessel, 255], i);
      const height = Math.max(0, Math.min(255, 128 + pores * 4 - vessel * 1.8));
      detailImage.data.set([height, height, height, 255], i);
    }
  }
  colour.putImageData(colourImage, 0, 0);
  detail.putImageData(detailImage, 0, 0);
  const map = new THREE.CanvasTexture(colourCanvas);
  const detailMap = new THREE.CanvasTexture(detailCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = detailMap.wrapS = detailMap.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 8);
  detailMap.repeat.set(12, 18);
  map.anisotropy = detailMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return { map, detailMap };
}

export default function Anatomy3DViewer({ gender, activeSystems, selectedId, isolatedId, reconstructId, onSelectStructure, resetNonce, pathologyStructureId = null }) {
  const mountRef = useRef(null);
  const groupsRef = useRef({});            // id -> THREE.Group (structure)
  const baseColorsRef = useRef({});        // id -> THREE.Color
  const shellRef = useRef(null);
  const importedSurfaceRef = useRef(null);
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
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const spherical = { radius: 3.2, theta: Math.PI * 0.5, phi: Math.PI * 0.42 };
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
      spherical.radius = 3.2;
      spherical.theta = Math.PI * 0.5;
      spherical.phi = Math.PI * 0.42;
      BODY_TARGET.set(0, 0.95, 0);
      updateCamera();
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const organicTextures = createOrganicTextures(renderer);
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 10;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    const rim = new THREE.PointLight(0xa78bfa, 0.5, 10);
    rim.position.set(0, 1.5, -2);
    scene.add(rim);

    // Floor disc for orientation
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.05, transparent: true, opacity: 0.72 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Body shell (translucent cadaver mannequin)
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0b6a3, map: organicTextures.map, bumpMap: organicTextures.detailMap,
      bumpScale: 0.006, roughnessMap: organicTextures.detailMap, roughness: 0.46,
      metalness: 0, transparent: true, opacity: 0.16, depthWrite: false,
      side: THREE.DoubleSide, transmission: 0.28, thickness: 0.34,
      attenuationColor: new THREE.Color(0xc74f58), attenuationDistance: 0.72,
      clearcoat: 0.16, clearcoatRoughness: 0.64, sheen: 0.22,
      sheenColor: new THREE.Color(0xffb4ae), specularIntensity: 0.38,
    });
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
    scene.add(shellGroup);
    shellRef.current = { group: shellGroup, mat: shellMat, build: buildShell };

    // User-supplied anatomical base mesh. The procedural shell remains as the
    // female and low-bandwidth fallback so the learning module never blocks.
    const surfaceMat = shellMat.clone();
    surfaceMat.opacity = 0.28;
    surfaceMat.depthWrite = true;
    new OBJLoader().load(
      "/models/anatomy/male-surface.obj",
      (object) => {
        object.name = "Imported anatomical surface";
        object.scale.setScalar(0.205);
        object.position.set(0, 0.02, 0);
        object.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.material = surfaceMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        object.visible = genderRef.current === "male";
        shellGroup.visible = genderRef.current !== "male";
        scene.add(object);
        importedSurfaceRef.current = object;
      },
      undefined,
      () => { shellGroup.visible = true; }
    );

    // Structures
    const structGroup = new THREE.Group();
    scene.add(structGroup);
    ANATOMY_STRUCTURES.forEach((s) => {
      const grp = new THREE.Group();
      grp.userData.id = s.id;
      const color = new THREE.Color(s.color ?? SYSTEM_META[s.system].color);
      const softTissue = !["skeletal", "nervous"].includes(s.system);
      const mat = new THREE.MeshPhysicalMaterial({
        color, roughness: s.system === "skeletal" ? 0.72 : 0.48, metalness: 0,
        transparent: true, opacity: 1, clearcoat: softTissue ? 0.12 : 0.04,
        clearcoatRoughness: 0.66, sheen: softTissue ? 0.18 : 0,
        sheenColor: color.clone().lerp(new THREE.Color(0xffffff), 0.35),
        transmission: softTissue ? 0.045 : 0, thickness: softTissue ? 0.08 : 0,
        bumpMap: softTissue ? organicTextures.detailMap : null,
        bumpScale: softTissue ? 0.0025 : 0,
        roughnessMap: softTissue ? organicTextures.detailMap : null,
        specularIntensity: softTissue ? 0.32 : 0.2,
      });
      const partDefs = s.parts ? s.parts : [{ shape: s.shape, position: [0, 0, 0], rotation: s.rotation, scale: s.scale }];
      partDefs.forEach((p) => {
        const mesh = new THREE.Mesh(buildGeometry(p.shape), mat);
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
    };
    const onUp = () => { dragging = false; renderer.domElement.style.cursor = "grab"; };
    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius *= 1 + e.deltaY * 0.0012;
      spherical.radius = Math.max(1.2, Math.min(8, spherical.radius));
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
      organicTextures.map.dispose();
      organicTextures.detailMap.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── Rebuild shell on gender change ──
  useEffect(() => {
    const sh = shellRef.current;
    if (!sh) return;
    sh.build(BODY_SHELLS[gender] ? BODY_SHELLS[gender].parts : BODY_SHELLS.male.parts);
    const imported = importedSurfaceRef.current;
    if (imported) imported.visible = gender === "male";
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
            m.material.opacity = id === isolated ? 1 : 0.96;
            m.material.wireframe = false;
            m.material.emissive = new THREE.Color(0x000000);
          }
        });
        grp.scale.setScalar(1);
      }
    });
    // Dim shell when isolating
    if (shellRef.current) {
      shellRef.current.mat.opacity = isolated ? 0.03 : 0.09;
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