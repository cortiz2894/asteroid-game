import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CrosshairProps {
  position: [number, number, number];
}

const Crosshair: React.FC<CrosshairProps> = ({ position }) => {
  const crosshairRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (crosshairRef.current) {
      crosshairRef.current.position.set(...position);
    }
  });

  return (
    <group ref={crosshairRef}>
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.05, 0.08, 32]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.02, 0.1, 0.02]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>
  );
};

export default Crosshair;
