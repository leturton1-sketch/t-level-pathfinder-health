import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * An overhead fluorescent strip light rendered in 3D.
 * On mount it plays a flicker-to-life sequence (matching the CSS `flicker-on`
 * keyframe) then settles to a steady glow with a subtle micro-flicker.
 */
export default function StripLight3D({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 90;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, -0.6, 3.6);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Housing
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.5 });
    const housing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 0.5), housingMat);
    housing.position.y = 0.55;
    scene.add(housing);

    // End caps
    const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    [-3, 3].forEach((x) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.34), capMat);
      cap.position.set(x, 0.4, 0);
      scene.add(cap);
    });

    // Emissive tube
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x5eead4,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const tube = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.07, 0.3), tubeMat);
    tube.position.y = 0.4;
    scene.add(tube);

    // Light cast
    const stripLight = new THREE.PointLight(0x5eead4, 0, 14, 2);
    stripLight.position.set(0, 0.2, 0.5);
    scene.add(stripLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dir = new THREE.DirectionalLight(0xffffff, 0.45);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Flicker timeline (normalised 0..1) — mirrors CSS flicker-on
    const flicker = [
      [0.0, 0.0], [0.05, 0.4], [0.1, 0.1], [0.2, 0.7], [0.25, 0.2],
      [0.35, 0.9], [0.4, 0.5], [0.5, 1.0], [0.55, 0.6], [0.65, 1.0],
      [0.85, 0.95], [1.0, 1.0],
    ];
    const duration = 1500;
    const start = performance.now();
    let raf;

    const sample = (p) => {
      let i = 0;
      while (i < flicker.length - 1 && flicker[i + 1][0] < p) i++;
      const [p0, v0] = flicker[i];
      const [p1, v1] = flicker[Math.min(i + 1, flicker.length - 1)];
      const span = p1 - p0 || 0.0001;
      return v0 + (v1 - v0) * ((p - p0) / span);
    };

    const animate = (now) => {
      const t = now - start;
      let intensity;
      if (t >= duration) {
        intensity = 1.0 + Math.sin(now * 0.004) * 0.015 + (Math.random() - 0.5) * 0.012;
      } else {
        intensity = sample(t / duration);
      }
      const e = Math.max(0, intensity);
      tubeMat.emissiveIntensity = e * 2.4;
      stripLight.intensity = e * 3.2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      housing.geometry.dispose();
      tube.geometry.dispose();
      tubeMat.dispose();
      housingMat.dispose();
      capMat.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-clinical-teal/10 via-transparent to-transparent pointer-events-none" />
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}