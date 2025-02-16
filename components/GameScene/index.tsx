"use client";

import { useFrame } from "@react-three/fiber";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Ship from "../Ship";
import * as THREE from "three";
import Crosshair from "../Crosshair";

// types.ts
export interface ShipType {
  id: string;
  position: [number, number, number];
  speed: number;
}

interface Bullet {
  id: string;
  position: [number, number, number];
  speed: number;
  direction: THREE.Vector3;
}

function Bullet({
  position,
  direction,
  onHit,
}: {
  position: [number, number, number];
  direction: THREE.Vector3;
  onHit: () => void;
}) {
  const bulletRef = useRef<THREE.Mesh>(null);
  const speed = 15;
  const raycaster = new THREE.Raycaster();

  useFrame((state, delta) => {
    if (!bulletRef.current) return;

    // Update bullet position based on direction
    bulletRef.current.position.add(
      direction.clone().multiplyScalar(speed * delta)
    );

    // Remove bullet when it goes too far
    if (bulletRef.current.position.z < -20) {
      onHit();
    }

    // Update raycaster position and direction
    raycaster.set(bulletRef.current.position, direction);

    // Make raycaster available globally for collision checks
    if (!window.bulletRaycasters) {
      window.bulletRaycasters = new Map();
    }
    window.bulletRaycasters.set(bulletRef.current.uuid, raycaster);

    return () => {
      window.bulletRaycasters?.delete(bulletRef.current?.uuid);
    };
  });

  return (
    <mesh position={position} ref={bulletRef}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial
        color="yellow"
        emissive="yellow"
        emissiveIntensity={2}
      />
    </mesh>
  );
}

// function Cube({
//   position,
//   onShoot,
//   crosshairPosition,
// }: {
//   position: [number, number, number];
//   onShoot: (
//     position: [number, number, number],
//     direction: THREE.Vector3
//   ) => void;
//   crosshairPosition: [number, number, number];
// }) {
//   const cubeRef = useRef<THREE.Mesh>(null);
//   const lastShootTime = useRef(0);
//   const shootInterval = 500;

//   useFrame((state) => {
//     if (!cubeRef.current) return;
//     const currentTime = state.clock.getElapsedTime() * 1000;
//     if (currentTime - lastShootTime.current > shootInterval) {
//       const direction = new THREE.Vector3()
//         .subVectors(
//           new THREE.Vector3(...crosshairPosition),
//           new THREE.Vector3(...position)
//         )
//         .normalize();
//       onShoot(position, direction);
//       lastShootTime.current = currentTime;
//     }
//   });

//   return (
//     <mesh ref={cubeRef} position={position}>
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color="hotpink" wireframe />
//     </mesh>
//   );
// }

function Cube({
  position,
  onShoot,
  crosshairPosition,
}: {
  position: [number, number, number];
  onShoot: (
    position: [number, number, number],
    direction: THREE.Vector3
  ) => void;
  crosshairPosition: [number, number, number];
}) {
  const cubeRef = useRef<THREE.Mesh>(null);
  const lastShootTime = useRef(0);
  const shootInterval = 500;

  useFrame((state) => {
    if (!cubeRef.current) return;
    const currentTime = state.clock.getElapsedTime() * 1000;

    // Make the cube look at the crosshair
    const lookAtVector = new THREE.Vector3(...crosshairPosition);
    cubeRef.current.lookAt(lookAtVector);

    if (currentTime - lastShootTime.current > shootInterval) {
      const direction = new THREE.Vector3()
        .subVectors(
          new THREE.Vector3(...crosshairPosition),
          new THREE.Vector3(...position)
        )
        .normalize();
      onShoot(position, direction);
      lastShootTime.current = currentTime;
    }
  });

  return (
    <mesh ref={cubeRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" wireframe />
    </mesh>
  );
}

interface GameSceneProps {
  handPosition: {
    x: number;
    y: number;
  };
  setScore: Dispatch<SetStateAction<number>>;
}

const GameScene = ({ handPosition, setScore }: GameSceneProps) => {
  const [ships, setShips] = useState<ShipType[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const shipRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const crosshairPosition = useRef<[number, number, number]>([0, 0, -5]);

  // Handle shooting
  const handleShoot = useCallback(
    (position: [number, number, number], direction: THREE.Vector3) => {
      const newBullet: Bullet = {
        id: Math.random().toString(),
        position: position,
        speed: 15,
        direction: direction,
      };
      setBullets((prev) => [...prev, newBullet]);
    },
    []
  );

  // Spawn new ships
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const newShip: ShipType = {
        id: Math.random().toString(),
        position: [Math.random() * 10 - 5, Math.random() * 6 - 3, -15],
        speed: 5 + Math.random() * 2,
      };

      setShips((prev) => [...prev, newShip]);
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, []);

  // Check raycaster collisions
  useFrame(() => {
    if (!window.bulletRaycasters) return;

    // Get all ship meshes for raycasting
    const shipMeshes: THREE.Mesh[] = [];
    shipRefs.current.forEach((mesh) => {
      if (mesh) shipMeshes.push(mesh);
    });

    // Check each bullet's raycaster against ships
    window.bulletRaycasters.forEach((raycaster, bulletId) => {
      const intersects = raycaster.intersectObjects(shipMeshes);

      if (intersects.length > 0) {
        // Found a collision
        const hitShip = intersects[0].object;
        const shipId = Array.from(shipRefs.current.entries()).find(
          ([_, mesh]) => mesh === hitShip
        )?.[0];

        if (shipId) {
          // Remove both bullet and ship
          setBullets((prev) => prev.filter((b) => b.id !== bulletId));
          setShips((prev) => prev.filter((s) => s.id !== shipId));
          setScore((prev) => prev + 100);
        }
      }
    });
  });

  useFrame(() => {
    crosshairPosition.current = [-handPosition.x * 10, handPosition.y * 10, -5];
  });

  return (
    <>
      <Cube
        position={[-handPosition.x * 3, handPosition.y * 3, 0]}
        onShoot={handleShoot}
        crosshairPosition={crosshairPosition.current}
      />

      <Crosshair position={crosshairPosition.current} />

      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          onHit={() =>
            setBullets((prev) => prev.filter((b) => b.id !== bullet.id))
          }
        />
      ))}

      {ships.map((ship) => (
        <Ship
          key={ship.id}
          ref={(mesh: THREE.Mesh) => {
            if (mesh) {
              shipRefs.current.set(ship.id, mesh);
            } else {
              shipRefs.current.delete(ship.id);
            }
          }}
          position={ship.position}
          onDestroy={() => {
            setShips((prev) => prev.filter((s) => s.id !== ship.id));
            shipRefs.current.delete(ship.id);
          }}
        />
      ))}
    </>
  );
};

export default GameScene;

// Add to global Window interface
declare global {
  interface Window {
    bulletRaycasters?: Map<string, THREE.Raycaster>;
  }
}
