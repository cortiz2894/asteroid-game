"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

interface ShipProps {
  position: [number, number, number];
  onDestroy: () => void;
}

const Ship = forwardRef<THREE.Mesh, ShipProps>(
  ({ position, onDestroy }, forwardedRef) => {
    const internalRef = useRef<THREE.Mesh>(null);

    useImperativeHandle(forwardedRef, () => internalRef.current!);

    useFrame((state, delta) => {
      if (!internalRef.current) return;

      internalRef.current.position.z += 5 * delta;
      if (internalRef.current.position.z >= 10) {
        onDestroy();
      }
    });

    return (
      <mesh ref={internalRef} position={position}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="green" wireframe />
      </mesh>
    );
  }
);

Ship.displayName = "Ship";

export default Ship;

// Ships move to the front camera
// import type React from "react";
// import * as THREE from "three";
// import { useFrame, useThree } from "@react-three/fiber";
// import { useRef } from "react";

// interface ShipProps {
//   position: [number, number, number];
//   onDestroy: () => void;
// }

// const Ship: React.FC<ShipProps> = ({ position, onDestroy }) => {
//   const shipRef = useRef<THREE.Mesh>(null);
//   const { camera } = useThree();

//   useFrame(() => {
//     if (!shipRef.current) return;
//     //Basic movement towards the camera
//     const direction = new THREE.Vector3()
//       .subVectors(camera.position, shipRef.current.position)
//       .normalize();
//     shipRef.current.position.add(direction.clone().multiplyScalar(0.05));

//     //Destroy ship if it reaches the camera
//     if (shipRef.current.position.distanceTo(camera.position) < 1) {
//       onDestroy();
//     }
//   });

//   return (
//     <mesh ref={shipRef} position={position}>
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color="blue" />
//     </mesh>
//   );
// };

// export default Ship;
