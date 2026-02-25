"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sphere, MeshDistortMaterial, Points, PointMaterial, Html } from "@react-three/drei";
import { Suspense, useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES & DATA ---

type ProjectData = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  color: string;
  link: string;
  image?: string;
};

const PROJECTS: ProjectData[] = [
  {
    id: "3",
    title: "Managdress",
    description: "Solution SaaS innovante pour l'écosystème de la mode. Gestion de stock et clients via IA.",
    tech: ["Next.js", "MongoDB", "Node.js"],
    color: "#ff0070",
    link: "https://managdress.fr",
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "4",
    title: "Manageo",
    description: "Système de gestion de restaurant intelligent. Optimisation des menus et suivi des stocks.",
    tech: ["React", "Node.js", "MySQL"],
    color: "#667eea",
    link: "https://manageo.site",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "5",
    title: "Sportigo",
    description: "Plateforme de gestion pour complexes sportifs. Réservations et abonnements simplifiés.",
    tech: ["Next.js", "PostgreSQL", "Tailwind"],
    color: "#39ff14",
    link: "https://sportigo.fr",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  }
];

const SKILLS = ["AI Engineering", "Machine Learning", "Fullstack dev", "Three.js", "Python", "React", "Next.js"];

// --- 3D COMPONENTS ---

function ConnectionLine({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const lineRef = useRef<THREE.Line>(null);
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
  }, []);

  useFrame(() => {
    if (lineRef.current && targetRef.current) {
      const pos = targetRef.current.position;
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      positions[3] = pos.x;
      positions[4] = pos.y;
      positions[5] = pos.z;
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#fff", transparent: true, opacity: 0.1 }))} ref={lineRef} />
  );
}

const AI_TOOLS = [
  {
    name: "Cursor",
    color: "#5eead4",
    icon: "https://static.cdnlogo.com/logos/c/23/cursor.svg"
  },
  {
    name: "Gemini",
    color: "#4285f4",
    icon: "https://static.cdnlogo.com/logos/g/15/google-gemini_800.png"
  },
  {
    name: "ChatGPT",
    color: "#10a37f",
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
  },
  {
    name: "Claude",
    color: "#d97757",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Anthropic_logo.svg"
  }
];

function DroneShip({ tool, index }: { tool: typeof AI_TOOLS[0]; index: number }) {
  const meshRef = useRef<THREE.Group>(null);

  // Random flight path parameters
  const randomFactor = useMemo(() => ({
    orbit: 5 + Math.random() * 4,
    speed: (0.1 + Math.random() * 0.2) * (index % 2 === 0 ? 1 : -1),
    offset: Math.random() * Math.PI * 2,
    yFreq: 0.5 + Math.random() * 0.5,
    yAmp: 1 + Math.random() * 2
  }), [index]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * randomFactor.speed + randomFactor.offset;
      meshRef.current.position.x = Math.cos(t) * randomFactor.orbit;
      meshRef.current.position.z = Math.sin(t) * randomFactor.orbit;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * randomFactor.yFreq) * randomFactor.yAmp;

      // Look direction (tangent to circle)
      meshRef.current.rotation.y = -t + Math.PI / 2;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* The "Ship" body */}
        <mesh>
          <coneGeometry args={[0.1, 0.4, 3]} />
          <meshStandardMaterial color={tool.color} emissive={tool.color} emissiveIntensity={2} />
        </mesh>
        {/* Engine glow */}
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.05, 0, 0.2, 8]} />
          <meshBasicMaterial color={tool.color} transparent opacity={0.6} />
        </mesh>

        <Html distanceFactor={10} position={[0, 0.45, 0]} center>
          <div style={{
            width: "28px",
            height: "28px",
            filter: `drop-shadow(0 0 8px ${tool.color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img
              src={tool.icon}
              alt={tool.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: tool.name === "ChatGPT" || tool.name === "Claude" || tool.name === "Cursor" ? "brightness(1.8)" : "none"
              }}
            />
          </div>
        </Html>
      </Float>
    </group>
  );
}

function Hyperspace({ active }: { active: boolean }) {
  const count = 1000;
  const pointsRef = useRef<THREE.Points>(null);
  const [positions] = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = Math.random() * -20;
    }
    return [p];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Move stars towards camera
        positions[i * 3 + 2] += delta * 50;
        if (positions[i * 3 + 2] > 5) positions[i * 3 + 2] = -20;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={active ? 1 : 0}
      />
    </Points>
  );
}

function Starfield({ count = 5000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const colorOptions = ["#ffffff", "#00f2ff", "#7000ff", "#ff0070"];

    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      size[i] = Math.random() * 0.15;

      const c = new THREE.Color(colorOptions[Math.floor(Math.random() * colorOptions.length)]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, size, col];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function ShootingStars() {
  const count = 15;
  const stars = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * -40
      ),
      speed: 0.1 + Math.random() * 0.2,
      length: 1 + Math.random() * 3,
      opacity: Math.random()
    }));
  }, []);

  return (
    <group>
      {stars.map((star, i) => (
        <ShootingStar key={i} {...star} />
      ))}
    </group>
  );
}

function ShootingStar({ position, speed, length, opacity }: any) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.z += speed * 200 * (state.clock.elapsedTime % 0.1);
      ref.current.position.x += speed * 10 * Math.sin(state.clock.elapsedTime);

      if (ref.current.position.z > 20) {
        ref.current.position.z = -40;
        ref.current.position.x = (Math.random() - 0.5) * 60;
        ref.current.position.y = (Math.random() - 0.5) * 60;
      }
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.02, 0.02, length]} />
      <meshBasicMaterial color="#00f2ff" transparent opacity={opacity * 0.5} />
    </mesh>
  );
}

function DataParticles({ count = 3000, isTransitioning = false }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 25;
      p[i * 3 + 1] = (Math.random() - 0.5) * 15;
      p[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      if (isTransitioning) {
        pointsRef.current.scale.z = 10;
        pointsRef.current.position.z += 0.5;
      } else {
        pointsRef.current.scale.z = 1;
        pointsRef.current.position.z = 0;
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      }
    }
  });

  return (
    <Points ref={pointsRef} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00f2ff"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

function ProjectSatellite({
  project,
  index,
  total,
  activeProject,
  onSelect
}: {
  project: ProjectData;
  index: number;
  total: number;
  activeProject: ProjectData | null;
  onSelect: (p: ProjectData | null) => void
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isSelected = activeProject?.id === project.id;

  const angle = (index / total) * Math.PI * 2;
  const radius = isSelected ? 0 : 3.6;

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * 0.35;

      if (isSelected) {
        // Smoothly move to center
        meshRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        meshRef.current.rotation.y += 0.01;
      } else {
        const currentAngle = angle + t;
        const targetX = Math.cos(currentAngle) * radius;
        const targetZ = Math.sin(currentAngle) * radius;
        const targetY = Math.sin(t * 1.5 + index) * 0.6;

        meshRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
        meshRef.current.rotation.y += 0.02;
      }
    }
  });

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : project);
      }}
    >
      {!isSelected && <ConnectionLine targetRef={meshRef} />}
      <Float speed={isSelected ? 1 : 3} rotationIntensity={isSelected ? 0.5 : 2} floatIntensity={isSelected ? 0.5 : 1.5}>
        <Sphere args={[isSelected ? 1.4 : 0.38, 64, 64]}>
          <MeshDistortMaterial
            color={project.color}
            emissive={project.color}
            emissiveIntensity={hovered || isSelected ? 2.5 : 0.6}
            distort={isSelected ? 0.3 : 0.4}
            speed={isSelected ? 2 : 4}
          />
        </Sphere>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[isSelected ? 2.2 : 0.6, 0.005, 16, 100]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.3} />
        </mesh>

        {/* Holographic label */}
        <Html distanceFactor={10} position={[0, isSelected ? 1.8 : 0.7, 0]} center>
          <div style={{
            color: project.color,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isSelected ? "12px" : "10px",
            whiteSpace: "nowrap",
            padding: "4px 8px",
            background: "rgba(0,0,0,0.8)",
            border: `1px solid ${project.color}`,
            borderRadius: "4px",
            opacity: hovered || isSelected ? 1 : 0.6,
            transition: "all 0.3s",
            pointerEvents: "none",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: isSelected ? "800" : "400"
          }}>
            {isSelected ? `ACTIVE_NODE: ${project.title}` : project.title}
          </div>
        </Html>
      </Float>
    </group>
  );
}

function Earth({ activeProject }: { activeProject: ProjectData | null }) {
  const earthRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const cityLightsRef = useRef<THREE.Points>(null);

  const cityPoints = useMemo(() => {
    const pts = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const r = 1.02;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pts[i * 3 + 2] = r * Math.cos(phi);
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0015;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.0025;
    }
    if (cityLightsRef.current) {
      cityLightsRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={earthRef} visible={!activeProject} scale={[1, 1, 1]}>
      {/* Atmosphere Glow - Purple */}
      <Sphere args={[1.1, 64, 64]}>
        <meshPhongMaterial
          color="#7000ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Main Earth Body - Deep Blue */}
      <Sphere args={[1, 64, 64]}>
        <meshPhongMaterial
          color="#05081a"
          emissive="#0a112e"
          specular="#111111"
          shininess={5}
        />
      </Sphere>

      {/* Primary Tech Grid - Cyan */}
      <Sphere args={[1.01, 64, 64]}>
        <meshBasicMaterial
          color="#00f2ff"
          transparent
          opacity={0.6}
          wireframe
        />
      </Sphere>

      {/* Secondary Tech Grid - Rose/Pink */}
      <Sphere args={[1.02, 32, 32]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <meshBasicMaterial
          color="#ff0070"
          transparent
          opacity={0.25}
          wireframe
        />
      </Sphere>

      {/* City Lights / Data Nodes - Bright Gold */}
      <Points ref={cityLightsRef} positions={cityPoints}>
        <PointMaterial
          transparent
          color="#ffcc00"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={1}
        />
      </Points>

      {/* Moving Data Stripes - Vibrant Green */}
      <mesh rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[1.05, 0.008, 16, 100]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.4} />
      </mesh>

      <pointLight color="#7000ff" intensity={1} distance={5} position={[2, 2, 2]} />
      <pointLight color="#00f2ff" intensity={1} distance={5} position={[-2, -2, -2]} />
    </group>
  );
}

function Galaxy() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 12000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const distance = Math.random() * 15;
      const angle = distance * 1.5;
      const spiralOffset = (Math.random() - 0.5) * 2;

      const x = Math.cos(angle + (i % 3) * (Math.PI * 2 / 3)) * distance + spiralOffset;
      const y = (Math.random() - 0.5) * 1.5;
      const z = Math.sin(angle + (i % 3) * (Math.PI * 2 / 3)) * distance + spiralOffset;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const color = new THREE.Color();
      if (i % 3 === 0) color.set("#00f2ff"); // Cyan
      else if (i % 3 === 1) color.set("#ff0070"); // Rose
      else color.set("#39ff14"); // Green

      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return [pos, cols];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      {/* Central light source with a different color */}
      <Sphere args={[0.5, 32, 32]}>
        <meshBasicMaterial color="#ff0070" />
      </Sphere>
      <pointLight intensity={20} distance={30} color="#ff0070" />
    </group>
  );
}

const AICore = Earth;

function GridFloor() {
  return (
    <group position={[0, -3.5, 0]}>
      <gridHelper args={[100, 40, "#111", "#151520"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#020205" />
      </mesh>
    </group>
  );
}

function DigitalSun() {
  return (
    <group position={[12, 8, -15]}>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[2.5, 64, 64]}>
          <MeshDistortMaterial
            color="#ff3300"
            emissive="#ffcc00"
            emissiveIntensity={2}
            distort={0.4}
            speed={2}
          />
        </Sphere>
        {/* Holographic rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.5, 0.015, 16, 100]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[4.2, 0.008, 16, 100]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} />
        </mesh>
      </Float>
      <pointLight intensity={3} distance={100} color="#ffaa00" />
    </group>
  );
}

// --- UI COMPONENTS ---

function Overlay({
  activeProject,
  onReset,
  showAbout,
  setShowAbout,
  showContactMenu,
  setShowContactMenu
}: {
  activeProject: ProjectData | null;
  onReset: () => void;
  showAbout: boolean;
  setShowAbout: (val: boolean) => void;
  showContactMenu: boolean;
  setShowContactMenu: (val: boolean) => void;
}) {
  return (
    <div className="overlay">
      <div className="scan-line" />

      <div className="overlay-top">
        <div style={{ display: "flex", gap: "20px", pointerEvents: "auto" }}>
          <div className="badge">
            <div className="badge-dot" />
            <span>KASSIM KHEMACI / PORTFOLIO 2025</span>
          </div>

          <button
            onClick={() => setShowAbout(!showAbout)}
            className="skill-tag"
            style={{
              cursor: "pointer",
              background: showAbout ? "var(--accent)" : "rgba(255,255,255,0.05)",
              color: showAbout ? "#000" : "#fff",
              borderColor: showAbout ? "var(--accent)" : "rgba(255,255,255,0.2)",
              transition: "all 0.3s"
            }}
          >
            {showAbout ? "RETOUR AU COEUR" : "MON PROFIL"}
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <a href="https://github.com/kass-6910" target="_blank" rel="noopener noreferrer" className="skill-tag" style={{ cursor: "pointer", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              GITHUB
            </a>
            <a href="https://www.linkedin.com/in/kassim-khemaci-0428492a2/" target="_blank" rel="noopener noreferrer" className="skill-tag" style={{ cursor: "pointer", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              LINKEDIN
            </a>
          </div>
        </div>

        <div className="ai-info">
          <div className="ai-info-header">
            <span>PORTFOLIO_ENGINE</span>
            <span style={{ color: "#00f2ff" }}>{activeProject ? "EXPLORATION_MODE" : "STANDBY"}</span>
          </div>
          <div className="ai-info-line">
            <span className="label">ACTIVE_NODE:</span>
            <span className="value">{activeProject ? activeProject.id : "IDLE"}</span>
          </div>
          {activeProject && (
            <button
              onClick={onReset}
              style={{
                marginTop: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "inherit",
                pointerEvents: "auto"
              }}
            >
              RETOUR AU CENTRE
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1, pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          {showAbout ? (
            <motion.div
              key="about-panel"
              className="content-panel"
              style={{ pointerEvents: "auto", maxWidth: "700px" }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="subheadline">Ingénieur Fullstack & IA</span>
                  <h1 className="headline" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>À Propos</h1>
                </div>
              </div>

              <div className="about-scroll" style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "10px" }}>
                <p className="paragraph" style={{ fontSize: "16px", marginBottom: "30px" }}>
                  Développeur passionné par la convergence entre le développement web moderne et l'intelligence artificielle.
                  Je transforme des concepts complexes en interfaces fluides et des algorithmes de données en expériences utilisateur intelligentes.
                </p>

                <div className="experience-item" style={{ marginBottom: "25px", borderLeft: "2px solid var(--accent)", paddingLeft: "15px" }}>
                  <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "monospace", marginBottom: "5px" }}>2023 - PRÉSENT</div>
                  <h3 style={{ color: "#fff", margin: 0 }}>Étudiant en Ingénierie @ SUPINFO</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "5px 0" }}>Master of Science en Informatique - Spécialisation Intelligence Artificielle.</p>
                </div>

                <div className="experience-item" style={{ marginBottom: "25px", borderLeft: "2px solid var(--accent)", paddingLeft: "15px" }}>
                  <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "monospace", marginBottom: "5px" }}>ÉCOLE D'INGÉNIEUR</div>
                  <h3 style={{ color: "#fff", margin: 0 }}>Master en Informatique</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "5px 0" }}>Spécialisation Intelligence Artificielle et Systèmes Distribués.</p>
                </div>

                <div className="experience-item" style={{ marginBottom: "25px", borderLeft: "2px solid var(--accent)", paddingLeft: "15px" }}>
                  <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "monospace", marginBottom: "5px" }}>VISION</div>
                  <h3 style={{ color: "#fff", margin: 0 }}>L'IA au service de l'Humain</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "5px 0" }}>
                    Ma vision est de rendre la technologie transparente et accessible, en utilisant l'IA non pas comme un outil complexe,
                    mais comme un assistant naturel intégré au quotidien.
                  </p>
                </div>

                <div className="experience-item" style={{ marginBottom: "25px", borderLeft: "2px solid var(--accent)", paddingLeft: "15px" }}>
                  <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "monospace", marginBottom: "5px" }}>CONTACT</div>
                  <h3 style={{ color: "#fff", margin: 0 }}>Coordonnées Directes</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "5px 0", fontFamily: "monospace" }}>
                    Email : kassim.khemaci2005@gmail.com<br />
                    Tél : 06 15 03 57 75
                  </p>
                </div>
              </div>

              <div className="skills-container" style={{ marginTop: "10px" }}>
                <span className="skill-tag" style={{ background: "rgba(0, 242, 255, 0.1)", borderColor: "var(--accent)" }}>Exploration</span>
                <span className="skill-tag" style={{ background: "rgba(112, 0, 255, 0.1)", borderColor: "var(--accent-secondary)" }}>Précision</span>
                <span className="skill-tag">Innovation</span>
              </div>
            </motion.div>
          ) : !activeProject ? (
            <motion.div
              key="main-panel"
              className="content-panel"
              style={{ pointerEvents: "auto" }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <span className="subheadline">Étudiant @ SUPINFO / Ingénieur Fullstack & IA</span>
              <h1 className="headline" style={{ fontSize: "clamp(40px, 5vw, 64px)" }}>Kassim<br />Khemaci</h1>
              <p className="paragraph">
                Futur ingénieur passionné par l'IA et le développement.
                Actuellement en Master à SUPINFO, j'explore les frontières entre le code et l'intelligence artificielle.
              </p>

              <div className="skills-container">
                {SKILLS.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                <AnimatePresence mode="wait">
                  {!showContactMenu ? (
                    <motion.button
                      key="contact-toggle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setShowContactMenu(true)}
                      className="contact-button"
                      style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
                    >
                      ME CONTACTER
                    </motion.button>
                  ) : (
                    <motion.div
                      key="contact-options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}
                    >
                      <a href="mailto:kassim.khemaci2005@gmail.com" className="contact-button" style={{ width: "100%", justifyContent: "center" }}>
                        EMAIL
                      </a>
                      <a href="tel:0615035775" className="contact-button" style={{ width: "100%", justifyContent: "center", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                        TÉLÉPHONE
                      </a>
                      <button
                        onClick={() => setShowContactMenu(false)}
                        style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "10px", cursor: "pointer", fontFamily: "monospace", marginTop: "5px" }}
                      >
                        [ RETOUR ]
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="project-panel"
              className="content-panel"
              style={{ pointerEvents: "auto", borderLeft: `4px solid ${activeProject.color}` }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <span className="subheadline" style={{ color: activeProject.color }}>Projet Sélectionné</span>
              <h1 className="headline" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>{activeProject.title}</h1>
              <p className="paragraph">
                {activeProject.description}
              </p>

              <div className="skills-container" style={{ margin: "10px 0 20px" }}>
                {activeProject.tech.map(t => (
                  <span key={t} className="skill-tag" style={{ color: activeProject.color, borderColor: activeProject.color }}>{t}</span>
                ))}
              </div>

              {activeProject.image && (
                <div style={{
                  width: "100%",
                  maxHeight: "250px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: `1px solid ${activeProject.color}44`,
                  background: "rgba(0,0,0,0.4)",
                  marginBottom: "15px",
                  boxShadow: `0 0 20px ${activeProject.color}22`
                }}>
                  <img
                    src={activeProject.image}
                    alt={activeProject.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      filter: "brightness(0.9) contrast(1.1)"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <a href={activeProject.link} target="_blank" rel="noopener noreferrer" className="contact-button" style={{ background: activeProject.color, color: "#000", marginTop: 0 }}>
                  VOIR LE PROJET
                </a>
                <button
                  onClick={onReset}
                  className="contact-button"
                  style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.2)", marginTop: 0 }}
                >
                  RETOUR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="overlay-bottom" style={{ pointerEvents: "none" }}>
        <div className="badge" style={{ background: "transparent", border: "none", backdropFilter: "none", boxShadow: "none", color: "rgba(255,255,255,0.3)" }}>
          © 2025 PORTFOLIO — KASSIM KHEMACI
        </div>

        <AnimatePresence>
          {!activeProject && !showAbout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="badge"
              style={{
                pointerEvents: "auto",
                background: "rgba(0, 242, 255, 0.05)",
                borderColor: "rgba(0, 242, 255, 0.2)",
                color: "var(--accent)",
                cursor: "default"
              }}
            >
              <div className="badge-dot" />
              <span>NAVIGATION: CLIQUEZ SUR LES NODES POUR EXPLORER MES PROJETS</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackgroundClick({ onClick }: { onClick: () => void }) {
  return (
    <mesh
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[20, 16, 16]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function Scene() {
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  const toggleAbout = () => {
    setIsTransitioning(true);
    // Hyperspace jump timing: stars stretch, then view switch
    setTimeout(() => {
      setShowAbout(!showAbout);
      setActiveProject(null);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 800);
    }, 600);
  };

  return (
    <div className="stage">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#020205"]} />
        <fog attach="fog" args={["#020205", 5, isTransitioning ? 60 : 45]} />

        <BackgroundClick onClick={() => {
          if (!showAbout) setActiveProject(null);
        }} />

        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={3} color="#00f2ff" />
        <pointLight position={[-10, -10, -10]} intensity={2.5} color="#7000ff" />
        <pointLight position={[0, 5, -15]} intensity={5} color="#ff3300" />

        <Suspense fallback={null}>
          {isTransitioning && <Hyperspace active={true} />}

          <AnimatePresence>
            {!isTransitioning && (
              <group>
                {showAbout ? (
                  <Galaxy />
                ) : (
                  <>
                    <AICore activeProject={activeProject} />
                    <group>
                      {PROJECTS.map((p, i) => (
                        <ProjectSatellite
                          key={p.id}
                          project={p}
                          index={i}
                          total={PROJECTS.length}
                          activeProject={activeProject}
                          onSelect={setActiveProject}
                        />
                      ))}
                    </group>

                    <group>
                      {AI_TOOLS.map((tool, i) => (
                        <DroneShip key={tool.name} tool={tool} index={i} />
                      ))}
                    </group>

                    <DataParticles isTransitioning={isTransitioning} />
                    <Starfield />
                    <ShootingStars />
                  </>
                )}
              </group>
            )}
          </AnimatePresence>
          <GridFloor />
          <DigitalSun />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={!isTransitioning}
          minDistance={showAbout ? 4 : 6}
          maxDistance={25}
          autoRotate={!activeProject && !isTransitioning}
          autoRotateSpeed={showAbout ? 0.2 : 0.4}
          target={[0, 0, 0]}
        />
      </Canvas>

      <Overlay
        activeProject={activeProject}
        onReset={() => setActiveProject(null)}
        showAbout={showAbout}
        setShowAbout={toggleAbout}
        showContactMenu={showContactMenu}
        setShowContactMenu={setShowContactMenu}
      />
    </div>
  );
}
