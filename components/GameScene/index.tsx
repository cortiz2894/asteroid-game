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
import Asteroid from "../Asteroid";
import * as THREE from "three";
import Crosshair from "../Crosshair";
import { FloatingScore, ParticleExplosion } from "../ParticleExplosion";
import { Text } from "@react-three/drei";
import NeonTunnel from "../NeonTunnel";

// types.ts
export interface AsteroidType {
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
  isPaused,
}: {
  position: [number, number, number];
  direction: THREE.Vector3;
  onHit: () => void;
  isPaused: boolean;
}) {
  const bulletRef = useRef<THREE.Mesh>(null);
  const speed = 15;
  const raycaster = new THREE.Raycaster();

  useFrame((state, delta) => {
    if (isPaused || !bulletRef.current) return;

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
    <group ref={bulletRef}>
      <mesh position={[position[0] - 0.3, position[1], position[2]]}>
        <sphereGeometry args={[0.1, 4, 4]} />
        <meshStandardMaterial
          color="yellow"
          emissive="yellow"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[position[0] + 0.3, position[1], position[2]]}>
        <sphereGeometry args={[0.1, 4, 4]} />
        <meshStandardMaterial
          color="yellow"
          emissive="yellow"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

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
  const shootInterval = 200;

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
      <meshStandardMaterial color="white" wireframe />
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
  const [asteroids, setAsteroid] = useState<AsteroidType[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const AsteroidRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const crosshairPosition = useRef<[number, number, number]>([0, 0, -5]);

  const [isPaused, setIsPaused] = useState(false);
  const [frozenHandPosition, setFrozenHandPosition] = useState(handPosition);
  const [spawnTimer, setSpawnTimer] = useState<NodeJS.Timeout | null>(null);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        // When pausing, store current hand position
        setFrozenHandPosition(handPosition);
        // Clear spawn timer when pausing
        if (spawnTimer) {
          clearInterval(spawnTimer);
          setSpawnTimer(null);
        }
      } else {
        // When unpausing, restore spawn timer
        const timer = setInterval(() => {
          const newAsteroid: AsteroidType = {
            id: Math.random().toString(),
            position: [Math.random() * 10 - 5, Math.random() * 6 - 3, -15],
            speed: 5 + Math.random() * 2,
          };
          setAsteroid((prev) => [...prev, newAsteroid]);
        }, 2000);
        setSpawnTimer(timer);
      }
      return !prev;
    });
  }, [handPosition, spawnTimer]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePause]);

  const [explosions, setExplosions] = useState<
    Array<{
      id: string;
      position: [number, number, number];
    }>
  >([]);

  const [floatingScores, setFloatingScores] = useState<
    Array<{
      id: string;
      position: [number, number, number];
      score: number;
    }>
  >([]);

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

  // Spawn new Asteroids
  useEffect(() => {
    if (!isPaused && !spawnTimer) {
      const timer = setInterval(() => {
        const newAsteroid: AsteroidType = {
          id: Math.random().toString(),
          position: [Math.random() * 10 - 5, Math.random() * 6 - 3, -15],
          speed: 5 + Math.random() * 2,
        };
        setAsteroid((prev) => [...prev, newAsteroid]);
      }, 2000);
      setSpawnTimer(timer);
    }
    return () => {
      if (spawnTimer) {
        clearInterval(spawnTimer);
      }
    };
  }, [isPaused]);

  // Check raycaster collisions
  useFrame(() => {
    if (isPaused) return;

    crosshairPosition.current = [-handPosition.x * 10, handPosition.y * 10, -5];

    if (!window.bulletRaycasters) return;

    // Get all asteroid meshes for raycasting
    const asteroidMeshes: THREE.Mesh[] = [];
    AsteroidRefs.current.forEach((mesh) => {
      if (mesh) asteroidMeshes.push(mesh);
    });

    // Check each bullet's raycaster against asteroids
    window.bulletRaycasters.forEach((raycaster, bulletId) => {
      const intersects = raycaster.intersectObjects(asteroidMeshes);

      if (intersects.length > 0) {
        // Found a collision
        const hitAsteroid = intersects[0].object;
        const hitPoint = intersects[0].point.toArray() as [
          number,
          number,
          number
        ];
        const asteroidId = Array.from(AsteroidRefs.current.entries()).find(
          ([_, mesh]) => mesh === hitAsteroid
        )?.[0];

        if (asteroidId) {
          // Remove both bullet and asteroid
          setBullets((prev) => prev.filter((b) => b.id !== bulletId));
          setAsteroid((prev) => prev.filter((s) => s.id !== asteroidId));
          setScore((prev) => prev + 100);
          // Add explosion effect
          setExplosions((prev) => [
            ...prev,
            { id: Math.random().toString(), position: hitPoint },
          ]);
          // Add floating score
          const scoreValue = 100;
          setFloatingScores((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              position: hitPoint,
              score: scoreValue,
            },
          ]);

          setScore((prev) => prev + scoreValue);
        }
      }
    });
  });

  const currentHandPosition = isPaused ? frozenHandPosition : handPosition;

  return (
    <>
      <Cube
        position={[
          -currentHandPosition.x * 4.5,
          currentHandPosition.y * 3.5,
          0,
        ]}
        onShoot={handleShoot}
        crosshairPosition={crosshairPosition.current}
        isPaused={isPaused}
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
          isPaused={isPaused}
        />
      ))}

      {asteroids.map((asteroid) => (
        <Asteroid
          key={asteroid.id}
          ref={(mesh: THREE.Mesh) => {
            if (mesh) {
              AsteroidRefs.current.set(asteroid.id, mesh);
            } else {
              AsteroidRefs.current.delete(asteroid.id);
            }
          }}
          position={asteroid.position}
          size={Math.random() * (145 - 15) + 15}
          onDestroy={() => {
            setAsteroid((prev) => prev.filter((s) => s.id !== asteroid.id));
            AsteroidRefs.current.delete(asteroid.id);
          }}
        />
      ))}

      {explosions.map((explosion) => (
        <ParticleExplosion
          key={explosion.id}
          position={explosion.position}
          onComplete={() => {
            setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
          }}
        />
      ))}

      {floatingScores.map((score) => (
        <FloatingScore
          key={score.id}
          position={score.position}
          score={score.score}
          onComplete={() => {
            setFloatingScores((prev) => prev.filter((s) => s.id !== score.id));
          }}
        />
      ))}

      {isPaused && (
        <Text
          color="white"
          fontSize={1}
          anchorX="center"
          anchorY="middle"
          opacity={1}
        >
          {`Juego pausado`}
        </Text>
      )}
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
