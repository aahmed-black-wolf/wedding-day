"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* A 2D heart shape extruded slightly, reused as geometry. */
function useHeartGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    shape.moveTo(x, y + 0.25);
    shape.bezierCurveTo(x, y + 0.25, x - 0.25, y, x - 0.5, y);
    shape.bezierCurveTo(x - 0.9, y, x - 0.9, y + 0.45, x - 0.9, y + 0.45);
    shape.bezierCurveTo(x - 0.9, y + 0.75, x - 0.55, y + 1.0, x, y + 1.3);
    shape.bezierCurveTo(x + 0.55, y + 1.0, x + 0.9, y + 0.75, x + 0.9, y + 0.45);
    shape.bezierCurveTo(x + 0.9, y + 0.45, x + 0.9, y, x + 0.5, y);
    shape.bezierCurveTo(x + 0.25, y, x, y + 0.25, x, y + 0.25);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
    });
    geo.center();
    geo.scale(0.35, 0.35, 0.35);
    return geo;
  }, []);
}

function Hearts({ count = 14 }) {
  const geometry = useHeartGeometry();
  const group = useRef();
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: Math.random() * 12 - 6,
        z: (Math.random() - 0.5) * 6 - 2,
        speed: 0.25 + Math.random() * 0.5,
        sway: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        scale: 0.4 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
      })),
    [count]
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.children.forEach((mesh, i) => {
      const d = data[i];
      mesh.position.y += d.speed * delta;
      mesh.position.x += Math.sin(state.clock.elapsedTime * 0.6 + d.phase) * d.sway * delta;
      mesh.rotation.z += delta * 0.3;
      if (mesh.position.y > 7) mesh.position.y = -7;
    });
  });

  return (
    <group ref={group}>
      {data.map((d, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[d.x, d.y, d.z]}
          rotation={[0, 0, d.rot]}
          scale={d.scale}
        >
          <meshStandardMaterial
            color={i % 3 === 0 ? "#e8a0a8" : i % 3 === 1 ? "#d65f72" : "#f3c0c6"}
            roughness={0.35}
            metalness={0.1}
            emissive="#7d2b3a"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

function Petals({ count = 50 }) {
  const points = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = Math.random() * 14 - 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return arr;
  }, [count]);

  const speeds = useMemo(
    () => Array.from({ length: count }, () => 0.15 + Math.random() * 0.4),
    [count]
  );

  useFrame((state, delta) => {
    if (!points.current) return;
    const pos = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * delta;
      pos[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.004;
      if (pos[i * 3 + 1] > 7) pos[i * 3 + 1] = -7;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        color="#f6c7cd"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 9], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#ffe9d6" />
      <pointLight position={[-4, -2, 3]} intensity={0.6} color="#e8a0a8" />
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Hearts />
      </Float>
      <Petals />
    </Canvas>
  );
}
