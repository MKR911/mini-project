// src/App.jsx
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";

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
  modelPath = "/mini-city.glb",
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
  const keys = useRef<KeysMap>({});
  const mouseDown = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Target position for smooth camera movement
  const targetPosition = useRef(new THREE.Vector3(0, 100, 100));

  // Store camera direction vector instead of a fixed look-at point
  const cameraDirection = useRef(new THREE.Vector3());

  // Camera constraints
  const MIN_HEIGHT = 20;
  const MAX_HEIGHT = 200;

  // Camera settings
  useEffect(() => {
    camera.position.set(50, 80, 10);
    camera.lookAt(0, 0, 0);
    targetPosition.current.copy(camera.position);

    // Store initial camera direction
    cameraDirection.current.set(0, 0, 0).sub(camera.position).normalize();

    // Event listeners for keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current = { ...keys.current, [e.code]: true };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current = { ...keys.current, [e.code]: false };
    };

    // Mouse control event listeners - modified for drag-to-move
    const handleMouseDown = (e: MouseEvent) => {
      mouseDown.current = true;
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      mouseDown.current = false;
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current && isDragging.current) {
        const deltaX = e.clientX - lastMousePosition.current.x;
        const deltaY = e.clientY - lastMousePosition.current.y;

        // Calculate movement direction based on camera orientation
        const forward = new THREE.Vector3(
          cameraDirection.current.x,
          0,
          cameraDirection.current.z
        ).normalize();

        // Right vector is perpendicular to forward and up
        const right = new THREE.Vector3()
          .crossVectors(forward, new THREE.Vector3(0, 1, 0))
          .normalize();

        // Move camera based on mouse drag (reversed for intuitive control)
        const dragSpeed = 0.5;
        targetPosition.current.addScaledVector(forward, deltaY * dragSpeed);
        targetPosition.current.addScaledVector(right, -deltaX * dragSpeed);

        lastMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Zoom with mouse wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Calculate zoom direction and amount
      const zoomSpeed = 0.1;
      const zoomDelta = e.deltaY * zoomSpeed;

      // Move camera position along the direction vector
      targetPosition.current.addScaledVector(
        cameraDirection.current,
        -zoomDelta
      );
    };

    // Touch events for mobile support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        mouseDown.current = true;
        isDragging.current = true;
        lastMousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (mouseDown.current && isDragging.current && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - lastMousePosition.current.x;
        const deltaY = e.touches[0].clientY - lastMousePosition.current.y;

        // Calculate movement direction based on camera orientation
        const forward = new THREE.Vector3(
          cameraDirection.current.x,
          0,
          cameraDirection.current.z
        ).normalize();

        // Right vector is perpendicular to forward and up
        const right = new THREE.Vector3()
          .crossVectors(forward, new THREE.Vector3(0, 1, 0))
          .normalize();

        // Move camera based on touch drag (reversed for intuitive control)
        const dragSpeed = 0.5;
        targetPosition.current.addScaledVector(forward, deltaY * dragSpeed);
        targetPosition.current.addScaledVector(right, -deltaX * dragSpeed);

        lastMousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseDown.current = false;
      isDragging.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [camera]);

  // Handle keyboard movements and smooth camera transitions
  useFrame((state, delta) => {
    const speed = 120 * delta;
    const moveSpeed = 2.0; // Adjust for smoother movement

    // Calculate movement direction based on camera orientation
    // Forward/backward movement should be along the ground plane (XZ)
    const forward = new THREE.Vector3(
      cameraDirection.current.x,
      0,
      cameraDirection.current.z
    ).normalize();

    // Right vector is perpendicular to forward and up
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    // Apply movement to target position
    if (keys.current["KeyW"]) {
      targetPosition.current.addScaledVector(forward, speed);
    }
    if (keys.current["KeyS"]) {
      targetPosition.current.addScaledVector(forward, -speed);
    }
    if (keys.current["KeyA"]) {
      targetPosition.current.addScaledVector(right, -speed);
    }
    if (keys.current["KeyD"]) {
      targetPosition.current.addScaledVector(right, speed);
    }

    // Up/down movement (maintain Y axis)
    if (keys.current["Space"]) {
      targetPosition.current.y += speed;
    }
    if (keys.current["ShiftLeft"]) {
      targetPosition.current.y -= speed;
    }

    // Apply height constraints
    targetPosition.current.y = Math.max(
      MIN_HEIGHT,
      Math.min(MAX_HEIGHT, targetPosition.current.y)
    );

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, delta * moveSpeed);

    // Calculate look-at point by adding direction vector to camera position
    const lookAtPoint = new THREE.Vector3()
      .copy(camera.position)
      .add(cameraDirection.current.clone().multiplyScalar(100));

    // Make camera look in the stored direction
    camera.lookAt(lookAtPoint);
  });

  return null;
}

// Infinite Grid Generator - improved for smoother rendering
function InfiniteCity({ renderDistance = 9 }) {
  const { camera } = useThree();
  const [cityBlocks, setCityBlocks] = useState<CityBlock[]>([]);
  const blockSize = 50; // Size of one city block
  const previousBlocksRef = useRef<CityBlock[]>([]);

  // Preload models to avoid rendering delays
  useEffect(() => {
    // Preload the city model
    useGLTF.preload("/mini-city.glb");
  }, []);

  // Update city blocks based on camera position with optimization
  useFrame(() => {
    const cameraX = Math.round(camera.position.x / blockSize);
    const cameraZ = Math.round(camera.position.z / blockSize);

    // Check if we need to update blocks (only update when camera moves to new block)
    const shouldUpdate =
      previousBlocksRef.current.length === 0 ||
      Math.abs(
        cameraX -
          Math.round(previousBlocksRef.current[0]?.position[0] / blockSize)
      ) > 0 ||
      Math.abs(
        cameraZ -
          Math.round(previousBlocksRef.current[0]?.position[2] / blockSize)
      ) > 0;

    if (shouldUpdate) {
      const newBlocks: CityBlock[] = [];

      // Generate city blocks in a grid around the camera with increased render distance
      for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
          const blockX = (cameraX + x) * blockSize;
          const blockZ = (cameraZ + z) * blockSize;

          const modelPath = `/mini-city.glb`;

          newBlocks.push({
            key: `${blockX}-${blockZ}`,
            position: [blockX, 0, blockZ],
            modelPath,
          });
        }
      }

      // Update blocks and store reference
      setCityBlocks(newBlocks);
      previousBlocksRef.current = newBlocks;
    }
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

        {/* Controls */}
        <CameraController />

        {/* Infinite City Generation with increased render distance */}
        <InfiniteCity renderDistance={9} />

        {/* Improved ground plane that follows the camera */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </Canvas>

      {/* Instructions overlay - updated for new controls */}
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
        <p>W, A, S, D - Move camera</p>
        <p>Space - Move Up</p>
        <p>Shift - Move Down</p>
        <p>Click and drag - Move through city</p>
        <p>Mouse wheel - Zoom in/out</p>
        <p>Touch and drag - Move (mobile)</p>
      </div>
    </div>
  );
}

export default App;
