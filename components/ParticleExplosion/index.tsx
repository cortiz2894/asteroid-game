// ParticleExplosion.tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

interface ParticleExplosionProps {
  position: [number, number, number];
  onComplete: () => void;
}

export const ParticleExplosion = ({
  position,
  onComplete,
}: ParticleExplosionProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particlesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // Duration in milliseconds

  useEffect(() => {
    if (!particlesGeometryRef.current) return;

    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Initial position
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];

      // Random velocity direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 2;

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;
    }

    particlesGeometryRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particlesGeometryRef.current.setAttribute(
      "velocity",
      new THREE.BufferAttribute(velocities, 3)
    );
  }, [position]);

  useFrame(() => {
    if (!particlesRef.current || !particlesGeometryRef.current) return;

    const positions = particlesGeometryRef.current.attributes.position;
    const velocities = particlesGeometryRef.current.attributes.velocity;
    const elapsed = (Date.now() - startTime.current) / 1000;

    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        positions.array[i3] += velocities.array[i3] * 0.1;
        positions.array[i3 + 1] += velocities.array[i3 + 1] * 0.1;
        positions.array[i3 + 2] += velocities.array[i3 + 2] * 0.1;
      }
      positions.needsUpdate = true;
    }

    if (elapsed > duration / 1000) {
      onComplete();
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry ref={particlesGeometryRef} />
      <pointsMaterial
        color="green"
        size={0.1}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// FloatingScore.tsx
interface FloatingScoreProps {
  position: [number, number, number];
  score: number;
  onComplete: () => void;
}

export const FloatingScore = ({
  position,
  score,
  onComplete,
}: FloatingScoreProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // Duration in milliseconds
  const opacityRef = useRef(1);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = elapsed / duration;

    // Float upward and fade out
    groupRef.current.position.y += 0.01;
    opacityRef.current = 1 - progress;

    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        color="white"
        fontSize={0.3}
        anchorX="center"
        anchorY="middle"
        opacity={opacityRef.current}
      >
        {`+${score}`}
      </Text>
    </group>
  );
};
