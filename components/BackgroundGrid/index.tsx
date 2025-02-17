"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GradientTexture } from "@react-three/drei";
import * as THREE from "three";

// Custom shader for the grid
const gridShader = {
  uniforms: {
    time: { value: 0 },
    gridColor: { value: new THREE.Color("#ff1b6b") },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 gridColor;
    varying vec2 vUv;

    void main() {
      // Create grid lines with larger rectangles (reduced scale)
      float scale = 20.0; // Reduced from 50.0 to make grid bigger
      vec2 grid = abs(fract(vUv * scale + vec2(0.0, time * 2.0)) - 0.5); // Changed minus to plus for opposite direction
      float line = min(grid.x, grid.y);
      
      // Create grid effect with fade at both ends
      float gridEffect = 1.0 - smoothstep(0.01, 0.05, line);
      
      // Fade at both beginning and end
      float fadeStart = smoothstep(0.0, 0.2, vUv.y); // Fade in at start
      float fadeEnd = smoothstep(1.0, 0.8, vUv.y);   // Fade out at end
      float fade = fadeStart * fadeEnd;
      
      // Combine effects
      vec3 finalColor = gridColor * gridEffect * fade;
      gl_FragColor = vec4(finalColor, gridEffect * fade);
    }
  `,
};

export default function Grid() {
  // Refs for animations
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Update grid animation
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.time.value = time * 0.5;
    }
  });

  return (
    <>
      {/* Animated grid */}
      <mesh rotation-x={-Math.PI / 2.2} position-y={-8}>
        <planeGeometry args={[100, 100, 1, 1]} />
        <shaderMaterial
          ref={gridMaterialRef}
          uniforms={gridShader.uniforms}
          vertexShader={gridShader.vertexShader}
          fragmentShader={gridShader.fragmentShader}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
