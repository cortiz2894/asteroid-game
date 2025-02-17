"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface HexagonMesh {
  id: string;
  position: THREE.Vector3;
  scale: number;
}

const createHexagonPoints = (radius: number): THREE.Vector2[] => {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    points.push(
      new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius)
    );
  }
  return points;
};

export default function NeonTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const hexagonsRef = useRef<HexagonMesh[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Create hexagon shape
  const hexagonShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = createHexagonPoints(2);

    shape.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      shape.lineTo(point.x, point.y);
    });

    return shape;
  }, []);

  // Create hexagon geometry with edges
  const hexagonGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = createHexagonPoints(2);
    const vertices = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = 0;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }, []);

  // Initialize hexagons
  useEffect(() => {
    if (!initialized) {
      const initialHexagons: HexagonMesh[] = [];
      const count = 10; // Number of initial hexagons

      for (let i = 0; i < count; i++) {
        initialHexagons.push({
          id: Math.random().toString(),
          position: new THREE.Vector3(0, 0, -i * 4), // Spaced out along z-axis
          scale: 1 + i * 0.1, // Gradually increase scale
        });
      }

      hexagonsRef.current = initialHexagons;
      setInitialized(true);
    }
  }, [initialized]);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current || !initialized) return;

    // Slowly rotate the entire tunnel
    // groupRef.current.rotation.z += delta * 0.1;

    // Update hexagon positions
    hexagonsRef.current = hexagonsRef.current.map((hexagon) => {
      const newZ = hexagon.position.z + delta * 5;

      // Reset hexagon to back of tunnel if it's too far forward
      if (newZ > 10) {
        return {
          ...hexagon,
          position: new THREE.Vector3(0, 0, -20),
        };
      }

      // Update position
      return {
        ...hexagon,
        position: new THREE.Vector3(0, 0, newZ),
      };
    });
  });

  return (
    <group ref={groupRef}>
      {initialized &&
        hexagonsRef.current.map((hexagon) => (
          <group key={hexagon.id} position={hexagon.position}>
            {/* Main hexagon */}
            <line geometry={hexagonGeometry}>
              <lineBasicMaterial
                color="#ff00ff"
                linewidth={5}
                transparent
                opacity={0.8}
                emissive={new THREE.Color(0xff00ff)}
                emissiveIntensity={200}
              />
            </line>
          </group>
        ))}
    </group>
  );
}
