import React, { useEffect, useState, useCallback } from "react";
import * as THREE from "three";

// Simple 3D Text component using basic Three.js geometries
const PauseText = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[4, 2]} />
        <meshBasicMaterial color="black" transparent opacity={0.7} />
      </mesh>

      {/* PAUSED text using boxes */}
      <group position={[-1.5, 0.3, 0]}>
        {/* Each letter is made of simple boxes */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.4, 0, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>

      <mesh position={[0, -0.5, 0]} scale={[2, 0.5, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </group>
  );
};
