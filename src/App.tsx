// src/App.jsx
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Stars, Environment } from "@react-three/drei";
// import * as THREE from "three";

interface KeysMap {
  [key: string]: boolean;
}

interface CityBlock {
  key: string;
  position: [number, number, number]; // [x, y, z]
  modelPath: string;
}

// City Block Component
function CityBlock({
  position,
  modelPath = "public/mini-city.glb",
}: {
  position: [number, number, number];
  modelPath?: string;
}) {
  const { scene } = useGLTF(modelPath);

  // Clone the model to avoid sharing materials
  const clonedScene = React.useMemo(() => {
    return scene.clone();
  }, [scene]);

  return (
    <primitive object={clonedScene} position={position} scale={[1, 1, 1]} />
  );
}

// Camera Controller with keyboard and mouse movement
function CameraController() {
  const { camera } = useThree();
  // const controls = useRef();
  const keys = useRef<KeysMap>({});
  const mouseDown = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // Camera settings
  useEffect(() => {
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Event listeners for keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current = { ...keys.current, [e.code]: true };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current = { ...keys.current, [e.code]: false };
    };

    // Mouse control event listeners
    const handleMouseDown = (e: MouseEvent) => {
      mouseDown.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      mouseDown.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current) {
        const deltaX = e.clientX - lastMousePosition.current.x;
        const deltaY = e.clientY - lastMousePosition.current.y;

        // Rotate camera based on mouse movement
        camera.rotation.order = "YXZ"; // Prevent gimbal lock
        camera.rotateY(-deltaX * 0.002);
        camera.rotateX(-deltaY * 0.002);

        // Clamp vertical rotation to prevent camera flipping
        const PI_2 = Math.PI / 2;
        camera.rotation.x = Math.max(-PI_2, Math.min(PI_2, camera.rotation.x));

        lastMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [camera]);

  // Handle keyboard movements
  useFrame((state, delta) => {
    const speed = 10 * delta;
    // const moveVector = new THREE.Vector3();

    // Forward/backward
    if (keys.current["KeyW"]) {
      camera.translateZ(-speed);
    }
    if (keys.current["KeyS"]) {
      camera.translateZ(speed);
    }

    // Left/right
    if (keys.current["KeyA"]) {
      camera.translateX(-speed);
    }
    if (keys.current["KeyD"]) {
      camera.translateX(speed);
    }

    // Up/down
    if (keys.current["Space"]) {
      camera.translateY(speed);
    }
    if (keys.current["ShiftLeft"]) {
      camera.translateY(-speed);
    }
  });

  return null;
}

// Infinite Grid Generator
function InfiniteCity({ renderDistance = 3 }) {
  const { camera } = useThree();
  const [cityBlocks, setCityBlocks] = useState<CityBlock[]>([]);
  const blockSize = 50; // Size of one city block

  // Update city blocks based on camera position
  useFrame(() => {
    const cameraX = Math.round(camera.position.x / blockSize);
    const cameraZ = Math.round(camera.position.z / blockSize);

    const newBlocks: CityBlock[] = [];

    // Generate city blocks in a grid around the camera
    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const blockX = (cameraX + x) * blockSize;
        const blockZ = (cameraZ + z) * blockSize;

        // Use a seed based on position to always get the same model for a specific position
        // const seed = (blockX * 13) ^ (blockZ * 7);

        // Choose one of several building models based on the seed
        // const modelIndex = Math.abs(seed) % 3; // Assuming you have 3 different models
        const modelPath = `public/mini-city.glb`;

        newBlocks.push({
          key: `${blockX}-${blockZ}`,
          position: [blockX, 0, blockZ],
          modelPath,
        });
      }
    }

    setCityBlocks(newBlocks);
  });

  return (
    <>
      {cityBlocks.map((block) => (
        <CityBlock
          key={block.key}
          position={block.position}
          modelPath={block.modelPath}
        />
      ))}
    </>
  );
}

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
        <Environment preset="city" />
        <fog attach="fog" args={["#1a1a1a", 50, 200]} />

        {/* Controls */}
        <CameraController />

        {/* Infinite City Generation */}
        <InfiniteCity renderDistance={3} />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </Canvas>

      {/* Instructions overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          color: "white",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <h3>Controls:</h3>
        <p>W, A, S, D - Move</p>
        <p>Space - Move Up</p>
        <p>Shift - Move Down</p>
        <p>Click and drag - Look around</p>
      </div>
    </div>
  );
}

export default App;
