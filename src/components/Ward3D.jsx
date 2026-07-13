import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Ward3D({ patients = [], onBedClick, selectedBed = null }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const bedMeshesRef = useRef([]);
  const animFrameRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1b2a);
    scene.fog = new THREE.Fog(0x0d1b2a, 15, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 8, 14);
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
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 6;
    controls.maxDistance = 25;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0x3a5a8a, 0.5);
    scene.add(ambient);

    const overheadLight = new THREE.PointLight(0xfff5e0, 0.8, 30);
    overheadLight.position.set(0, 6, 0);
    overheadLight.castShadow = true;
    scene.add(overheadLight);

    const light2 = new THREE.PointLight(0x4db8c9, 0.4, 25);
    light2.position.set(-8, 5, -5);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x4db8c9, 0.4, 25);
    light3.position.set(8, 5, -5);
    scene.add(light3);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor stripes (for clinical look)
    for (let i = -2; i <= 2; i++) {
      const stripeGeo = new THREE.PlaneGeometry(0.15, 20);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x2a4a5a, roughness: 0.6 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 5, 0.01, 0);
      scene.add(stripe);
    }

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e3548, roughness: 0.9 });
    const wallGeo = new THREE.BoxGeometry(30, 4, 0.3);
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2, -15);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const sideWallGeo = new THREE.BoxGeometry(0.3, 4, 30);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-15, 2, 0);
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(15, 2, 0);
    scene.add(rightWall);

    // Nursing station
    const stationGeo = new THREE.BoxGeometry(6, 1, 2);
    const stationMat = new THREE.MeshStandardMaterial({ color: 0x2a4055, roughness: 0.4, metalness: 0.3 });
    const station = new THREE.Mesh(stationGeo, stationMat);
    station.position.set(0, 0.5, -10);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);

    // Station top
    const topGeo = new THREE.BoxGeometry(6.2, 0.1, 2.2);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x3a5570, roughness: 0.3 });
    const stationTop = new THREE.Mesh(topGeo, topMat);
    stationTop.position.set(0, 1.05, -10);
    stationTop.castShadow = true;
    scene.add(stationTop);

    // Monitors on station
    for (let i = 0; i < 3; i++) {
      const screenGeo = new THREE.BoxGeometry(1, 0.6, 0.05);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x00a9a5, emissive: 0x00a9a5, emissiveIntensity: 0.3 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-2 + i * 2, 1.5, -10);
      scene.add(screen);
    }

    // Beds — 6 beds in 2 rows of 3
    const bedPositions = [
      { x: -8, z: 2 }, { x: -8, z: -3 }, { x: -8, z: -8 },
      { x: 8, z: 2 }, { x: 8, z: -3 }, { x: 8, z: -8 },
    ];

    bedMeshesRef.current = [];

    bedPositions.forEach((pos, idx) => {
      const bedGroup = new THREE.Group();
      bedGroup.position.set(pos.x, 0, pos.z);
      bedGroup.userData = { bedIndex: idx, isBed: true };

      // Bed frame
      const frameGeo = new THREE.BoxGeometry(2.2, 0.5, 3);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a6070, roughness: 0.5, metalness: 0.4 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 0.5;
      frame.castShadow = true;
      frame.receiveShadow = true;
      bedGroup.add(frame);

      // Mattress
      const mattressGeo = new THREE.BoxGeometry(2, 0.2, 2.8);
      const mattressMat = new THREE.MeshStandardMaterial({ color: 0xe0e8f0, roughness: 0.7 });
      const mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.position.y = 0.85;
      mattress.castShadow = true;
      bedGroup.add(mattress);

      // Pillow
      const pillowGeo = new THREE.BoxGeometry(1.5, 0.15, 0.6);
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.8 });
      const pillow = new THREE.Mesh(pillowGeo, pillowMat);
      pillow.position.set(0, 1.02, -1);
      bedGroup.add(pillow);

      // Headboard
      const headGeo = new THREE.BoxGeometry(2.4, 1.2, 0.15);
      const headboard = new THREE.Mesh(headGeo, frameMat);
      headboard.position.set(0, 1, -1.5);
      headboard.castShadow = true;
      bedGroup.add(headboard);

      // Bed number sign
      const signGeo = new THREE.PlaneGeometry(0.5, 0.3);
      const signCanvas = document.createElement("canvas");
      signCanvas.width = 128; signCanvas.height = 80;
      const ctx = signCanvas.getContext("2d");
      ctx.fillStyle = "#0d1b2a";
      ctx.fillRect(0, 0, 128, 80);
      ctx.fillStyle = "#00a9a5";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Bed ${idx + 1}`, 64, 55);
      const signTexture = new THREE.CanvasTexture(signCanvas);
      const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 1.7, -1.5);
      bedGroup.add(sign);

      // Patient (if occupied)
      const patient = patients[idx];
      if (patient) {
        const bodyColor = patient.news2_score >= 7 ? 0xe05555 : patient.news2_score >= 5 ? 0xe0a840 : 0x60a070;
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6, transparent: true, opacity: 0.85 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 1.3, -0.2);
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        bedGroup.add(body);

        // Monitor next to bed
        const monitorGeo = new THREE.BoxGeometry(0.6, 0.8, 0.08);
        const monitorMat = new THREE.MeshStandardMaterial({
          color: bodyColor,
          emissive: bodyColor,
          emissiveIntensity: 0.5,
        });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.set(1.5, 1.5, 0);
        bedGroup.add(monitor);

        // Monitor stand
        const standGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(1.5, 0.75, 0);
        bedGroup.add(stand);
      }

      bedGroup.userData.isBed = true;
      bedGroup.userData.bedIndex = idx;
      scene.add(bedGroup);
      bedMeshesRef.current.push(bedGroup);
    });

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
      const intersects = raycaster.intersectObjects(bedMeshesRef.current, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.isBed) obj = obj.parent;
        if (obj.userData.isBed) {
          onBedClick?.(obj.userData.bedIndex);
        }
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    // Resize handler
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
  }, [patients, onBedClick]);

  // Update selected bed highlight
  useEffect(() => {
    bedMeshesRef.current.forEach((group, idx) => {
      group.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          // Highlight logic would go here — keeping it simple
        }
      });
    });
  }, [selectedBed]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 text-xs text-clinical-teal/70 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none">
        Drag to rotate · Scroll to zoom · Tap a bed to interact
      </div>
    </div>
  );
}