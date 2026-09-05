import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. Rotating Holographic 3D DNA Double-Helix
function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);
  const count = 24;
  const radius = 1.4;
  const heightStep = 0.25;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  const basePairs = Array.from({ length: count }).map((_, i) => {
    const angle = (i * Math.PI) / 6;
    const y = (i - count / 2) * heightStep;
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;
    return { id: i, y, p1: [x1, y, z1], p2: [x2, y, z2] };
  });

  return (
    <group ref={groupRef} position={[4, 0, -2]}>
      {basePairs.map((pair) => (
        <group key={pair.id}>
          {/* Node 1 */}
          <mesh position={pair.p1 as [number, number, number]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} roughness={0.2} />
          </mesh>
          {/* Node 2 */}
          <mesh position={pair.p2 as [number, number, number]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} roughness={0.2} />
          </mesh>
          {/* Connector bar */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) =>
                geo.setFromPoints([
                  new THREE.Vector3(...(pair.p1 as [number, number, number])),
                  new THREE.Vector3(...(pair.p2 as [number, number, number])),
                ])
              }
            />
            <lineBasicMaterial attach="material" color="#38bdf8" transparent opacity={0.35} />
          </line>
        </group>
      ))}
    </group>
  );
}

// 2. Floating 3D Glass Data Nodes
function FloatingGlassNodes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const positions: Array<[number, number, number]> = [
    [-4.5, 2, -1],
    [-3.2, -1.8, -2],
    [2.8, 2.5, -3],
    [-5, 0.5, -4],
    [5, -2, -2],
  ];

  return (
    <group ref={groupRef}>
      {positions.map((pos, idx) => (
        <Float key={idx} speed={1.5} rotationIntensity={1} floatIntensity={1.5} position={pos}>
          <mesh>
            <octahedronGeometry args={[0.45 + (idx % 3) * 0.15, 0]} />
            <meshStandardMaterial
              color="#0ea5e9"
              wireframe
              transparent
              opacity={0.35}
              emissive="#0284c7"
              emissiveIntensity={0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// 3. Bio-Neural Pulse Rings & Floating Molecular Grid
function BioNeuralRings() {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });

  return (
    <group ref={ringRef} position={[-4, 1, -3]}>
      {/* Outer Concentric Bio Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 64]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} transparent opacity={0.4} />
      </mesh>
      {/* Inner Concentric Pulse Ring */}
      <mesh rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[1.5, 0.012, 16, 48]} />
        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.9} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

export const Background3D: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050813]">
      {/* Background Ambient Radial Glow Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-cyan-500/12 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-sky-600/12 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 3D WebGL Canvas Ambient Layer */}
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#38bdf8" />
        <pointLight position={[-10, -10, -5]} intensity={0.9} color="#06b6d4" />

        <DNAHelix />
        <FloatingGlassNodes />
        <BioNeuralRings />

        {/* Ambient Floating Cyan Sparkle Grid */}
        <Sparkles count={120} scale={16} size={3} speed={0.5} opacity={0.5} color="#38bdf8" />
        <Sparkles count={60} scale={12} size={2} speed={0.3} opacity={0.4} color="#22d3ee" />
      </Canvas>
    </div>
  );
};
