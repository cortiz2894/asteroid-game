// Scene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { useControls, Leva } from "leva";
import { useRef, useState, useCallback, useEffect } from "react";
import { HandTracking } from "./HandTracking";
import GameScene from "./GameScene";

// types.ts
export interface ShipType {
  id: string;
  position: [number, number, number];
  speed: number;
}

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);

  const { positionX, positionY, positionZ } = useControls("Camera controls", {
    positionX: { value: 0, min: -20, max: 20 },
    positionY: { value: 1.55, min: -20, max: 20 },
    positionZ: { value: 2, min: -20, max: 20 },
  });

  const updateHandPosition = useCallback((x: number, y: number) => {
    setHandPosition({ x, y });
  }, []);

  return (
    <section className="flex flex-col lg:flex-row gap-10 w-full h-screen">
      <div className="w-full h-full relative" ref={containerRef}>
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded">
          Score: {score}
        </div>
        <Leva collapsed />
        <HandTracking setHandPosition={updateHandPosition} />
        <Canvas
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          {/* <Effects /> */}
          <GameScene handPosition={handPosition} setScore={setScore} />
        </Canvas>
      </div>
    </section>
  );
}
