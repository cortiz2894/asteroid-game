// Scene.tsx
"use client";

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { useControls, Leva } from "leva";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { HandTracking } from "./HandTracking";
import GameScene from "./GameScene";
import { Effects } from "./Effects";
import styles from "./Scene.module.scss";
import { EffectComposer, RenderPass, ShaderPass } from "three-stdlib";
import { useLoader } from "@react-three/fiber";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";
import * as THREE from "three";
// types.ts
export interface ShipType {
  id: string;
  position: [number, number, number];
  speed: number;
}

// Extend Three.js classes to make them available in JSX
extend({ EffectComposer, RenderPass, ShaderPass });

const TEXTURE_PATH =
  "https://res.cloudinary.com/dg5nsedzw/image/upload/v1641657168/blog/vaporwave-threejs-textures/grid.png";
const DISPLACEMENT_PATH =
  "https://res.cloudinary.com/dg5nsedzw/image/upload/v1641657200/blog/vaporwave-threejs-textures/displacement.png";
const METALNESS_PATH =
  "https://res.cloudinary.com/dg5nsedzw/image/upload/v1641657200/blog/vaporwave-threejs-textures/metalness.png";

function VaporwaveTerrain() {
  const [gridTexture, displacementTexture, metalnessTexture] = useLoader(
    THREE.TextureLoader,
    [TEXTURE_PATH, DISPLACEMENT_PATH, METALNESS_PATH]
  );
  const meshRef = useRef<THREE.Mesh>();
  const meshRef2 = useRef<THREE.Mesh>();

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    const speed = 0.15;
    const planeLength = 2.8;

    if (meshRef.current && meshRef2.current) {
      meshRef.current.position.z = (elapsedTime * speed) % planeLength;
      meshRef2.current.position.z =
        ((elapsedTime * speed) % planeLength) - planeLength;

      // Reset positions when they go out of view
      if (meshRef.current.position.z >= planeLength) {
        meshRef.current.position.z -= planeLength * 2;
      }
      if (meshRef2.current.position.z >= 0) {
        meshRef2.current.position.z -= planeLength * 2;
      }
    }
  });

  const planeGeometry = new THREE.PlaneGeometry(2.8, 2.8, 24, 24);
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: gridTexture,
    displacementMap: displacementTexture,
    displacementScale: 1.4,
    metalnessMap: metalnessTexture,
    metalness: 0.96,
    roughness: 0.5,
  });

  return (
    <>
      <mesh
        ref={meshRef}
        rotation-x={-Math.PI * 0.5}
        position-y={-0.2}
        position-z={0}
        geometry={planeGeometry}
        material={planeMaterial}
      />
      <mesh
        ref={meshRef2}
        rotation-x={-Math.PI * 0.5}
        position-y={-0.2}
        position-z={-2.8}
        geometry={planeGeometry}
        material={planeMaterial}
      />
    </>
  );
}

function Lights() {
  const spotlightRef = useRef<THREE.SpotLight>();
  const spotlight2Ref = useRef<THREE.SpotLight>();

  useEffect(() => {
    if (spotlightRef.current) {
      spotlightRef.current.target.position.set(-0.25, 0.25, 0.25);
    }
    if (spotlight2Ref.current) {
      spotlight2Ref.current.target.position.set(0.25, 0.25, 0.25);
    }
  }, []);

  return (
    <>
      <ambientLight intensity={15} color="#ffffff" />
      <spotLight
        ref={spotlightRef}
        color="#d53c3d"
        intensity={550}
        distance={30}
        angle={Math.PI * 0.1}
        penumbra={0.25}
        position={[0.5, 2, 2.2]}
      />
      <spotLight
        ref={spotlight2Ref}
        color="#d53c3d"
        intensity={550}
        distance={30}
        angle={Math.PI * 0.1}
        penumbra={0.25}
        position={[-0.5, 2, 2.2]}
      />
    </>
  );
}

function PostProcessing() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer>();

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms["amount"].value = 0.0015;
    composer.addPass(rgbShiftPass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionPass);

    composerRef.current = composer;
  }, [gl, scene, camera]); // Added dependencies

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return null;
}

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);

  const { positionX, positionY, positionZ } = useControls("Camera controls", {
    positionX: { value: 0, min: -20, max: 20 },
    positionY: { value: 0.06, min: -20, max: 20 },
    positionZ: { value: 1.1, min: -20, max: 20 },
  });

  const updateHandPosition = useCallback((x: number, y: number) => {
    setHandPosition({ x, y });
  }, []);

  return (
    <section className="flex flex-col lg:flex-row gap-10 w-full h-screen">
      <div
        className={`w-full h-full relative ${styles.background}`}
        // className={`w-full h-full relative`}
        ref={containerRef}
      >
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
            background: "transparent",
          }}
        >
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Effects />
          <GameScene handPosition={handPosition} setScore={setScore} />
        </Canvas>
        <Canvas
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            position: "absolute",
            zIndex: -1,
            top: 0,
            background:
              // "linear-gradient(0deg, rgb(225 83 72) 30%, rgb(66 16 156) 100%)",
              // "linear-gradient(0deg, rgba(40,195,236,1) 0%, rgba(40,195,236,1) 32%, rgba(0,0,0,1) 93%, rgba(0,0,0,1) 100%)", // Bluish
              "linear-gradient(0deg, rgb(242, 4, 97) 0%, rgb(208, 14, 107) 18%, rgb(19 18 40) 82%, rgb(11 19 38) 100%)",
          }}
          camera={{
            fov: 75,
            near: 0.01,
            far: 20,
            position: [positionX, positionY, positionZ],
          }}
        >
          <fog attach="fog" args={["#9a0a4e", 1.3, 4.5]} />

          {/* <fog attach="fog" args={["#2393b2", 1.3, 4.5]} /> // Bluish */}
          {/* <fog attach="fog" args={["#481c2b", 1, 2.5]} /> */}
          <Lights />
          <VaporwaveTerrain />
          <PostProcessing />
        </Canvas>
      </div>
    </section>
  );
}
