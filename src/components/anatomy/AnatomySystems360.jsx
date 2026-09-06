import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SYSTEM_META, SYSTEM_ORDER } from "@/lib/anatomy3D";

const BODY_TARGET = new THREE.Vector3(0, 1.05, 0);

function mat(color, opacity = 1) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.48,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity > 0.9,
    side: THREE.DoubleSide,
    clearcoat: 0.18,
    clearcoatRoughness: 0.52,
  });
}

function addPart(group, geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function makeSystem(system) {
  const group = new THREE.Group();
  group.userData.system = system;
  const color = SYSTEM_META[system].color;
  const material = mat(color, system === "integumentary" ? 0.32 : system === "muscular" ? 0.74 : 0.96);
  const bone = mat(0xe8dfd0, 0.94);
  const tube = (radius, length, position, rotation) =>
    addPart(group, new THREE.CapsuleGeometry(radius, length, 6, 12), material, position, rotation);

  if (system === "integumentary") {
    addPart(group, new THREE.SphereGeometry(0.115, 28, 20), material, [0, 1.83, 0]);
    addPart(group, new THREE.CapsuleGeometry(0.23, 0.72, 8, 18), material, [0, 1.3, 0], [0, 0, 0], [0.78, 1, 0.52]);
    tube(0.075, 0.62, [0.22, 1.35, 0], [0, 0, -0.18]);
    tube(0.075, 0.62, [-0.22, 1.35, 0], [0, 0, 0.18]);
    tube(0.105, 0.78, [0.1, 0.48, 0], [0, 0, 0]);
    tube(0.105, 0.78, [-0.1, 0.48, 0], [0, 0, 0]);
  } else if (system === "muscular") {
    addPart(group, new THREE.SphereGeometry(0.105, 24, 16), material, [0, 1.83, 0.015], [0, 0, 0], [1.12, 0.88, 1]);
    addPart(group, new THREE.CapsuleGeometry(0.24, 0.64, 8, 16), material, [0, 1.32, 0], [0, 0, 0], [0.95, 1, 0.56]);
    tube(0.09, 0.57, [0.22, 1.34, 0.02], [0, 0, -0.2]);
    tube(0.09, 0.57, [-0.22, 1.34, 0.02], [0, 0, 0.2]);
    tube(0.12, 0.72, [0.105, 0.48, 0.02], [0, 0, 0]);
    tube(0.12, 0.72, [-0.105, 0.48, 0.02], [0, 0, 0]);
  } else if (system === "skeletal") {
    addPart(group, new THREE.SphereGeometry(0.105, 20, 14), bone, [0, 1.83, 0]);
    addPart(group, new THREE.CapsuleGeometry(0.028, 0.72, 5, 10), bone, [0, 1.3, -0.02]);
    [1.08, 1.16, 1.24, 1.32, 1.4].forEach((y, i) =>
      addPart(group, new THREE.TorusGeometry(0.17 + i * 0.008, 0.012, 8, 20, Math.PI * 1.55), bone, [0, y, 0], [Math.PI / 2, 0, Math.PI / 2])
    );
    tube(0.035, 0.72, [0.1, 0.48, 0], [0, 0, 0]);
    tube(0.035, 0.72, [-0.1, 0.48, 0], [0, 0, 0]);
  } else if (system === "nervous") {
    addPart(group, new THREE.SphereGeometry(0.09, 24, 18), material, [0, 1.84, 0.05], [0, 0, 0], [1.15, 0.9, 1]);
    addPart(group, new THREE.CapsuleGeometry(0.018, 0.72, 5, 10), material, [0, 1.38, -0.08]);
    [[0.16, 1.34, 0.02], [-0.16, 1.34, 0.02], [0.08, 0.82, 0.02], [-0.08, 0.82, 0.02]].forEach((p) => tube(0.012, 0.52, p, [0, 0, p[0] > 0 ? -0.18 : 0.18]));
  } else if (system === "cardiovascular") {
    addPart(group, new THREE.SphereGeometry(0.075, 24, 18), material, [-0.045, 1.28, 0.09], [0, 0, -0.2], [0.9, 1.15, 0.72]);
    addPart(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.03, 1.2, 0.06), new THREE.Vector3(-0.02, 1.48, 0.03), new THREE.Vector3(0.05, 1.57, 0)]), 24, 0.012, 8), material);
    tube(0.009, 0.48, [0.02, 0.93, 0.02], [0, 0, 0]);
    tube(0.009, 0.44, [0.02, 1.55, 0.01], [0, 0, 0]);
  } else if (system === "respiratory") {
    addPart(group, new THREE.SphereGeometry(0.09, 24, 18), material, [-0.1, 1.31, 0.02], [0, 0, 0], [0.8, 1.35, 0.72]);
    addPart(group, new THREE.SphereGeometry(0.09, 24, 18), material, [0.1, 1.31, 0.02], [0, 0, 0], [0.8, 1.35, 0.72]);
    tube(0.016, 0.16, [0, 1.56, 0.03], [0, 0, 0]);
    addPart(group, new THREE.SphereGeometry(0.16, 20, 12), material, [0, 1.11, 0], [0, 0, 0], [1.2, 0.22, 0.8]);
  } else if (system === "digestive") {
    addPart(group, new THREE.SphereGeometry(0.095, 24, 18), material, [0.08, 1.38, -0.01], [0, 0, 0], [1.25, 0.66, 0.76]);
    addPart(group, new THREE.TorusGeometry(0.07, 0.012, 8, 28), material, [0, 0.98, 0.06], [Math.PI / 2, 0, 0]);
    addPart(group, new THREE.TorusGeometry(0.055, 0.01, 8, 24), material, [0, 0.98, 0.06], [Math.PI / 2, 0.4, 0]);
  } else if (system === "urinary") {
    [-0.1, 0.1].forEach((x) => addPart(group, new THREE.SphereGeometry(0.045, 20, 14), material, [x, 1.12, -0.06], [0, 0, 0], [0.72, 1.2, 0.82]));
    addPart(group, new THREE.SphereGeometry(0.055, 20, 14), material, [0, 0.88, 0.06], [0, 0, 0], [1, 0.82, 0.85]);
  } else if (system === "endocrine") {
    [[0, 1.84, 0.08, 0.025], [-0.08, 1.18, 0.06, 0.018], [0.08, 1.18, 0.06, 0.018], [0, 1.02, 0.06, 0.016]].forEach(([x, y, z, r]) =>
      addPart(group, new THREE.SphereGeometry(r, 16, 12), material, [x, y, z])
    );
  } else if (system === "lymphatic") {
    [[-0.2, 1.45, 0.04], [0.2, 1.45, 0.04], [-0.2, 1.12, 0.04], [0.2, 1.12, 0.04], [-0.12, 0.9, 0.06], [0.12, 0.9, 0.06]].forEach((p) =>
      addPart(group, new THREE.SphereGeometry(0.018, 14, 10), material, p)
    );
    addPart(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 1.45, 0.04), new THREE.Vector3(0, 1.25, 0.04), new THREE.Vector3(0.2, 1.12, 0.04)]), 16, 0.005, 7), material);
  } else if (system === "reproductive") {
    addPart(group, new THREE.TorusGeometry(0.055, 0.012, 8, 20), material, [-0.05, 0.98, 0.08], [Math.PI / 2, 0, 0]);
    addPart(group, new THREE.TorusGeometry(0.055, 0.012, 8, 20), material, [0.05, 0.98, 0.08], [Math.PI / 2, 0, 0]);
    addPart(group, new THREE.CapsuleGeometry(0.014, 0.12, 5, 10), material, [0, 0.88, 0.08], [0, 0, 0]);
  }

  group.traverse((object) => {
    if (object.isMesh) object.userData.system = system;
  });
  group.renderOrder = SYSTEM_ORDER.indexOf(system);
  return group;
}

export default function AnatomySystems360({ activeSystems = SYSTEM_ORDER, onRemoveSystem }) {
  const mountRef = useRef(null);
  const syncRef = useRef(() => {});
  const renderRef = useRef(() => {});
  const activeRef = useRef(activeSystems);
  const removeRef = useRef(onRemoveSystem);
  activeRef.current = activeSystems;
  removeRef.current = onRemoveSystem;

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 50);
    camera.position.set(0, 1.08, 4.2);
    camera.lookAt(BODY_TARGET);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-2, 4, 4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8be8ff, 1.6);
    rim.position.set(2, 2, -4);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const systems = SYSTEM_ORDER.map((system) => makeSystem(system));
    systems.forEach((group) => scene.add(group));
    const surfaceGroup = systems.find((group) => group.userData.system === "integumentary");
    const surfaceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe7a995,
      roughness: 0.42,
      metalness: 0,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 0.2,
      clearcoatRoughness: 0.48,
      transmission: 0.08,
      thickness: 0.22,
    });
    new OBJLoader().load(
      "/models/anatomy/male-surface.obj",
      (object) => {
        while (surfaceGroup.children.length) {
          const child = surfaceGroup.children.pop();
          child.geometry?.dispose();
        }
        object.scale.setScalar(0.205);
        object.position.set(0, 0.02, 0);
        object.traverse((child) => {
          if (!child.isMesh) return;
          child.material = surfaceMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.system = "integumentary";
        });
        surfaceGroup.add(object);
        renderRef.current();
      },
      undefined,
      () => renderRef.current(),
    );

    let theta = 0;
    let dragging = false;
    let lastX = 0;
    let downX = 0;
    let downY = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const syncVisibility = () => systems.forEach((group) => { group.visible = activeRef.current.includes(group.userData.system); });
    syncRef.current = syncVisibility;
    renderRef.current = () => renderer.render(scene, camera);
    syncVisibility();
    const onDown = (event) => {
      dragging = true;
      lastX = event.clientX;
      downX = event.clientX;
      downY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event) => {
      if (!dragging) return;
      theta += (event.clientX - lastX) * 0.008;
      lastX = event.clientX;
      systems.forEach((group) => { group.rotation.y = theta; });
      renderRef.current();
    };
    const onUp = (event) => {
      dragging = false;
      if (Math.abs(event.clientX - downX) > 5 || Math.abs(event.clientY - downY) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(systems.filter((group) => group.visible), true);
      const hit = hits.find((item) => item.object.userData.system);
      if (hit) removeRef.current?.(hit.object.userData.system);
    };
    const onWheel = (event) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.002, 2.8, 6);
      camera.lookAt(BODY_TARGET);
      renderRef.current();
    };
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.render(scene, camera);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    renderer.render(scene, camera);
    return () => {
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      systems.forEach((group) => group.traverse((object) => { if (object.geometry) object.geometry.dispose(); if (object.material && object.material !== surfaceMaterial) object.material.dispose(); }));
      surfaceMaterial.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      syncRef.current = () => {};
      renderRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    syncRef.current();
    renderRef.current();
  }, [activeSystems]);

  return <div ref={mountRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label="Interactive 360 degree anatomical model" />;
}
