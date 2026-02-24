"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

function StreetLights({ isNight, count = 80 }: { isNight: boolean; count?: number }) {
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.045, 2.1, 8), []);
  const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.09, 12, 12), []);

  const poleMat = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: isNight ? "#141826" : "#2a2f3f",
        emissive: new THREE.Color(isNight ? "#0a0b12" : "#000000"),
      }),
    [isNight],
  );

  const bulbMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: isNight ? "#ffd9a3" : "#1b1f2c",
        transparent: true,
        opacity: isNight ? 1 : 0.55,
        toneMapped: false,
      }),
    [isNight],
  );

  const positions = useMemo(() => {
    const out: Array<[number, number, number, number]> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const radius = 8 + Math.random() * 26;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 0;
      const rotY = angle + (Math.random() - 0.5) * 0.25;
      out.push([x, y, z, rotY]);
    }
    return out;
  }, [count]);

  const setInstances = (pole: THREE.InstancedMesh | null, bulb: THREE.InstancedMesh | null) => {
    if (!pole || !bulb) return;
    for (let i = 0; i < count; i++) {
      const [x, y, z, rotY] = positions[i];
      dummy.position.set(x, y + 2.1 / 2, z);
      dummy.rotation.set(0, rotY, 0);
      const s = 0.9 + Math.random() * 0.25;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      pole.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 2.1 + 0.12, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bulb.setMatrixAt(i, dummy.matrix);
    }
    pole.instanceMatrix.needsUpdate = true;
    bulb.instanceMatrix.needsUpdate = true;
  };

  return (
    <group>
      <instancedMesh
        ref={(mesh) => {
          (poleRef as any).current = mesh;
          setInstances(mesh, bulbRef.current);
        }}
        args={[poleGeo, poleMat, count]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          (bulbRef as any).current = mesh;
          setInstances(poleRef.current, mesh);
        }}
        args={[bulbGeo, bulbMat, count]}
      />
    </group>
  );
}

function LegoHead({ y = 1.45 }: { y?: number }) {
  const headGeo = useMemo(() => {
    const r = 0.55;
    const h = 0.9;
    const fillet = 0.09;
    const half = h / 2;
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, -half));
    const steps = 8;
    const cxB = r - fillet;
    const cyB = -half + fillet;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * (Math.PI / 2);
      const x = cxB + fillet * Math.cos(Math.PI / 2 - t);
      const py = cyB - fillet * Math.sin(Math.PI / 2 - t);
      pts.push(new THREE.Vector2(x, py));
    }
    pts.push(new THREE.Vector2(r, half - fillet));
    const cxT = r - fillet;
    const cyT = half - fillet;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * (Math.PI / 2);
      const x = cxT + fillet * Math.cos(t);
      const py = cyT + fillet * Math.sin(t);
      pts.push(new THREE.Vector2(x, py));
    }
    pts.push(new THREE.Vector2(0, half));
    return new THREE.LatheGeometry(pts, 48);
  }, []);

  const studGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.22, 0.18, 32), []);
  const eyeGeo = useMemo(() => new THREE.CircleGeometry(0.06, 24), []);
  const mouthGeo = useMemo(() => new THREE.RingGeometry(0.17, 0.205, 36, 1, Math.PI * 0.06, Math.PI * 0.88), []);

  const yellowPlastic = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: "#F2CD37",
        emissive: new THREE.Color("#2a2509"),
      }),
    [],
  );

  const faceInk = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0b0e16" }), []);

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={headGeo} material={yellowPlastic} castShadow receiveShadow />
      <mesh geometry={studGeo} material={yellowPlastic} position={[0, 0.54, 0]} castShadow receiveShadow />
      <group position={[0, 0.02, 0.553]}>
        <mesh geometry={eyeGeo} material={faceInk} position={[-0.18, 0.12, 0]} />
        <mesh geometry={eyeGeo} material={faceInk} position={[0.18, 0.12, 0]} />
        <mesh geometry={mouthGeo} material={faceInk} position={[0, -0.08, 0]} rotation={[0, 0, Math.PI]} />
      </group>
    </group>
  );
}

function SmokeParticle({ index, total }: { index: number; total: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * 100, []);
  const speed = useMemo(() => 0.4 + Math.random() * 0.2, []);
  const xOffset = useMemo(() => (Math.random() - 0.5) * 0.1, []);
  const zOffset = useMemo(() => (Math.random() - 0.5) * 0.1, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    const progress = t % 1;
    ref.current.position.y = progress * 2.0;
    ref.current.position.x = xOffset + Math.sin(t * 1.5) * 0.3 * progress;
    ref.current.position.z = zOffset + Math.cos(t * 1.0) * 0.2 * progress;
    const s = 0.15 + progress * 0.5;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (mat && typeof mat.opacity !== "undefined") {
      mat.opacity = 0.3 * (1 - Math.pow(progress, 2));
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#dddddd" transparent depthWrite={false} />
    </mesh>
  );
}

function Smoke() {
  const particles = useMemo(() => Array.from({ length: 12 }), []);
  return (
    <group>
      {particles.map((_, i) => (
        <SmokeParticle key={i} index={i} total={12} />
      ))}
    </group>
  );
}

type ProjectData = {
  title: string;
  color: string;
  subject: string;
  stack: string[];
  location: string;
  dates: string;
  realisations: string[];
  link: string;
};

function IDEWindow({ project }: { project: ProjectData | null }) {
  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            width: "420px",
            maxHeight: "70vh",
            background: "#161616",
            borderRadius: "10px",
            border: "1px solid #333",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Fira Code', 'Courier New', monospace",
          }}
        >
          <div style={{ background: "#212121", padding: "10px 15px", display: "flex", alignItems: "center", borderBottom: "1px solid #333" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ width: "11px", height: "11px", background: "#ff5f56", borderRadius: "50%" }} />
              <div style={{ width: "11px", height: "11px", background: "#ffbd2e", borderRadius: "50%" }} />
              <div style={{ width: "11px", height: "11px", background: "#27c93f", borderRadius: "50%" }} />
            </div>
            <div style={{ marginLeft: "20px", color: "#999", fontSize: "12px", background: "#161616", padding: "4px 12px", borderRadius: "4px 4px 0 0", border: "1px solid #333", borderBottom: "none" }}>
              {project.title.toLowerCase()}.js
            </div>
          </div>
          <div style={{ padding: "20px", fontSize: "13px", color: "#d4d4d4", overflowY: "auto", lineHeight: "1.6" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ color: project.color, fontSize: "16px", marginBottom: "4px" }}>◆ {project.title} ◆</div>
              <div style={{ color: "#888", fontSize: "12px" }}>{project.location} // {project.dates}</div>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <span style={{ color: project.color }}>- Sujet :</span>
              <p style={{ margin: "5px 0 0 10px", color: "#aaa" }}>{project.subject}</p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <span style={{ color: project.color }}>- Compétences :</span>
              <p style={{ margin: "5px 0 0 10px", color: "#aaa" }}>{project.stack.join(" - ")}</p>
            </div>
            <div>
              <span style={{ color: project.color }}>- Réalisations :</span>
              <ul style={{ margin: "5px 0 0 10px", padding: "0 0 0 15px", listStyleType: "circle", color: "#aaa" }}>
                {project.realisations.map((r, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProjectPoster({ position, rotation, project, onHover }: { position: [number, number, number]; rotation: [number, number, number]; project: ProjectData; onHover: (p: ProjectData | null) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position} rotation={rotation} onPointerOver={() => { setHovered(true); onHover(project); }} onPointerOut={() => { setHovered(false); onHover(null); }} onClick={() => window.open(project.link, "_blank")}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.65, 0.05]} />
        <meshLambertMaterial color={hovered ? "#ffffff" : "#f0f0f0"} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.39, 0.59]} />
        <meshBasicMaterial color={project.color} />
      </mesh>
      <mesh position={[0, -0.22, 0.031]}>
        <planeGeometry args={[0.25, 0.03]} />
        <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

function House({ isNight, onHoverProject }: { isNight: boolean; onHoverProject: (p: ProjectData | null) => void }) {
  const width = 2.4;
  const depth = 2.4;
  const floorTh = 0.1;
  const ceilingTh = 0.1;
  const wallTh = 0.1;
  const wallH = 1.4;

  const floorGeo = useMemo(() => new THREE.BoxGeometry(width, floorTh, depth), []);
  const ceilingGeo = useMemo(() => new THREE.BoxGeometry(width, ceilingTh, depth), []);
  const foundationGeo = useMemo(() => new THREE.BoxGeometry(width + 0.06, 0.22, depth + 0.06), []);

  const palette = useMemo(() => {
    if (isNight) {
      return { wall: "#2b3558", wallEmissive: "#0b0e1d", ceiling: "#1c2542", floor: "#131a2e", foundation: "#0b0f1f" };
    }
    return { wall: "#d7c8aa", wallEmissive: "#000000", ceiling: "#c9bda7", floor: "#2e241c", foundation: "#6e6f78" };
  }, [isNight]);

  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ color: palette.wall, emissive: new THREE.Color(palette.wallEmissive) }), [palette]);

  const bedBaseGeo = useMemo(() => new THREE.BoxGeometry(0.85, 0.16, 0.52), []);
  const bedMattressGeo = useMemo(() => new THREE.BoxGeometry(0.84, 0.08, 0.50), []);
  const pillowGeo = useMemo(() => new THREE.BoxGeometry(0.26, 0.06, 0.16), []);
  const deskTopGeo = useMemo(() => new THREE.BoxGeometry(0.55, 0.06, 0.28), []);
  const deskLegGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.26, 0.06), []);
  const screenGeo = useMemo(() => new THREE.PlaneGeometry(0.22, 0.14), []);

  const spacerHeight = 0.21;
  const spacerRadius = 0.24;
  const spacerGeo = useMemo(() => new THREE.CylinderGeometry(spacerRadius, spacerRadius, spacerHeight, 44), []);
  const chimneyGeo = useMemo(() => new THREE.BoxGeometry(0.25, 1.0, 0.25), []);

  const projects: ProjectData[] = [
    { title: "L'Étincelle", color: "#ff4757", link: "https://github.com", subject: "Développement d'une plateforme e-commerce moderne.", location: "Annecy, France", dates: "2023 - 2024", stack: ["React", "Next.js", "Stripe", "Tailwind"], realisations: ["Conception de l'UI/UX", "Intégration du paiement", "Optimisation SEO"] },
    { title: "Horizon", color: "#2f3542", link: "https://github.com", subject: "App de gestion de tâches collaborative.", location: "Genève, Suisse", dates: "2022 - 2023", stack: ["TypeScript", "Node.js", "Socket.io", "Redis"], realisations: ["Sync temps réel", "Architecture micro-services", "Dashboard admin"] },
    { title: "Nébuleuse", color: "#5352ed", link: "https://github.com", subject: "Visualisation de données IoT complexes.", location: "Remote", dates: "2021 - 2022", stack: ["React Three Fiber", "D3.js", "MQTT", "Go"], realisations: ["Rendu 3D de data", "Interface temps réel", "Optimisation GPU"] },
    { title: "Saphir", color: "#1e90ff", link: "https://github.com", subject: "Réseau social pour artistes numériques.", location: "Lyon, France", dates: "2020 - 2021", stack: ["Vue.js", "Firebase", "Web3", "Solidity"], realisations: ["Gestion NFT", "Flux dynamique", "Wallet integration"] },
    { title: "Onyx", color: "#2ecc71", link: "https://github.com", subject: "Algorithme d'optimisation de contenu.", location: "Paris, France", dates: "2019 - 2020", stack: ["Python", "TensorFlow", "FastAPI", "PostgreSQL"], realisations: ["Moteur NLP", "Scraping massif", "API performante"] },
    { title: "Zénith", color: "#ffa502", link: "https://github.com", subject: "Solution domotique globale open-source.", location: "Chambéry, France", dates: "2018 - 2019", stack: ["Electron", "React", "Rust", "Raspberry Pi"], realisations: ["App Desktop native", "Com zigbee/zwave", "Encryption E2E"] },
  ];

  return (
    <group>
      <group>
        <mesh geometry={foundationGeo} position={[0, 0.11, 0]} castShadow receiveShadow>
          <meshLambertMaterial color={palette.foundation} />
        </mesh>
        <mesh geometry={floorGeo} position={[0, floorTh / 2, 0]} castShadow receiveShadow>
          <meshLambertMaterial color={palette.floor} emissive={palette.wallEmissive} />
        </mesh>
        <mesh position={[0, floorTh + wallH / 2, depth / 2 - wallTh / 2]} castShadow receiveShadow>
          <boxGeometry args={[width, wallH, wallTh]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        <mesh position={[0, floorTh + wallH / 2, -(depth / 2 - wallTh / 2)]} castShadow receiveShadow>
          <boxGeometry args={[width, wallH, wallTh]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        <mesh position={[width / 2 - wallTh / 2, floorTh + wallH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallTh, wallH, depth]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        <mesh position={[-(width / 2 - wallTh / 2), floorTh + wallH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallTh, wallH, depth]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        <mesh geometry={ceilingGeo} position={[0, floorTh + wallH + ceilingTh / 2, 0]} castShadow receiveShadow>
          <meshLambertMaterial color={palette.ceiling} emissive={palette.wallEmissive} />
        </mesh>

        <group position={[width / 2 + 0.01, floorTh + wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ProjectPoster position={[-0.75, 0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[0]} />
          <ProjectPoster position={[0, 0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[1]} />
          <ProjectPoster position={[0.75, 0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[2]} />
          <ProjectPoster position={[-0.75, -0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[3]} />
          <ProjectPoster position={[0, -0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[4]} />
          <ProjectPoster position={[0.75, -0.38, 0]} rotation={[0, 0, 0]} onHover={onHoverProject} project={projects[5]} />
        </group>

        <group position={[0, floorTh, -0.6]}>
          <mesh geometry={bedBaseGeo} position={[0, 0.08, 0]} castShadow receiveShadow>
            <meshLambertMaterial color="#252e48" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={bedMattressGeo} position={[0, 0.18, 0]} castShadow receiveShadow>
            <meshLambertMaterial color="#cfd7ff" emissive="#14193a" />
          </mesh>
          <mesh geometry={pillowGeo} position={[-0.22, 0.24, -0.14]} castShadow receiveShadow>
            <meshLambertMaterial color="#f3f5ff" emissive="#14193a" />
          </mesh>
          <mesh geometry={pillowGeo} position={[0.06, 0.24, -0.14]} castShadow receiveShadow>
            <meshLambertMaterial color="#f3f5ff" emissive="#14193a" />
          </mesh>
        </group>

        <group position={[0.8, floorTh, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={deskTopGeo} position={[0, 0.40, 0]} castShadow receiveShadow>
            <meshLambertMaterial color="#1f2740" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={deskLegGeo} position={[-0.22, 0.20, -0.10]} castShadow receiveShadow>
            <meshLambertMaterial color="#1a2136" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={deskLegGeo} position={[0.22, 0.20, -0.10]} castShadow receiveShadow>
            <meshLambertMaterial color="#1a2136" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={deskLegGeo} position={[-0.22, 0.20, 0.10]} castShadow receiveShadow>
            <meshLambertMaterial color="#1a2136" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={deskLegGeo} position={[0.22, 0.20, 0.10]} castShadow receiveShadow>
            <meshLambertMaterial color="#1a2136" emissive="#0b0e1d" />
          </mesh>
          <mesh geometry={screenGeo} position={[0, 0.55, -0.1]} castShadow>
            <meshBasicMaterial color="#2a6bff" toneMapped={false} />
          </mesh>
        </group>
      </group>

      <mesh geometry={spacerGeo} position={[0, 1.6 + spacerHeight / 2, 0]} castShadow receiveShadow>
        <meshLambertMaterial color={isNight ? "#1a2342" : "#9a8c78"} />
      </mesh>

      <LegoHead y={2.0 + spacerHeight} />

      <group position={[0.8, 1.6, -0.8]}>
        <mesh geometry={chimneyGeo} castShadow receiveShadow>
          <meshLambertMaterial color={palette.foundation} />
        </mesh>
        <group position={[0, 0.55, 0]}>
          <Smoke />
        </group>
      </group>
    </group>
  );
}

const GRASS_VERTEX_SHADER = `
  varying vec2 vUv;
  varying float vDist;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec4 instancePosition = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vDist = length(instancePosition.xz);
    float wind = sin(uTime * 1.5 + instancePosition.x * 0.5 + instancePosition.z * 0.5) * 0.15;
    wind += sin(uTime * 2.5 + instancePosition.x * 1.2) * 0.05;
    vec3 pos = position;
    pos.x += wind * pow(uv.y, 2.0);
    pos.z += wind * 0.5 * pow(uv.y, 2.0);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const GRASS_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vec3 baseColor = vec3(0.05, 0.12, 0.05);
    vec3 topColor = vec3(0.18, 0.42, 0.18);
    float fade = smoothstep(25.0, 40.0, vDist);
    vec3 color = mix(baseColor, topColor, vUv.y);
    gl_FragColor = vec4(mix(color, vec3(0.05, 0.05, 0.08), fade), 1.0);
  }
`;

function Grass({ count = 20000, minRadius = 2.5, maxRadius = 40 }: { count?: number; minRadius?: number; maxRadius?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const span = Math.max(0.0001, maxRadius - minRadius);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minRadius + Math.random() * span;
      pos.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pos;
  }, [count, minRadius, maxRadius]);

  useFrame((state) => {
    try {
      if (materialRef.current?.uniforms?.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
    } catch { }
  });

  const setInstances = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const [x, y, z] = positions[i];
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI;
      const scale = 0.2 + Math.random() * 0.35;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <instancedMesh ref={setInstances} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.2, 1, 1, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={GRASS_VERTEX_SHADER}
        fragmentShader={GRASS_FRAGMENT_SHADER}
        uniforms={{ uTime: { value: 0 } }}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function Ground({ isNight }: { isNight: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color={isNight ? "#07070a" : "#3a2b1f"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 96]} />
        <meshLambertMaterial color={isNight ? "#15161c" : "#8a8a8a"} />
      </mesh>
      <Grass count={20000} minRadius={6.5} maxRadius={40} />
    </group>
  );
}

function SimpleCloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const baseSpeed = useMemo(() => 0.1 + Math.random() * 0.1, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * baseSpeed) * 2;
    }
  });

  const cloudMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 }), []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh material={cloudMat}><sphereGeometry args={[1.2, 16, 16]} /></mesh>
      <mesh material={cloudMat} position={[1.1, 0.2, 0.3]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      <mesh material={cloudMat} position={[-1, 0.1, -0.2]}><sphereGeometry args={[0.9, 16, 16]} /></mesh>
      <mesh material={cloudMat} position={[0.5, 0.5, 0]}><sphereGeometry args={[0.8, 16, 16]} /></mesh>
      <mesh material={cloudMat} position={[-0.6, 0.4, 0.3]}><sphereGeometry args={[0.7, 16, 16]} /></mesh>
    </group>
  );
}

function SkyObjects({ isNight }: { isNight: boolean }) {
  const sunRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.2;
    if (sunRef.current) sunRef.current.position.set(Math.cos(t) * 15, Math.sin(t) * 10, -10);
    if (moonRef.current) moonRef.current.position.set(Math.cos(t + Math.PI) * 15, Math.sin(t + Math.PI) * 10, -10);
  });

  return (
    <group>
      <group ref={sunRef}>
        <mesh visible={!isNight}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshBasicMaterial color="#ffcc33" />
        </mesh>
      </group>
      <group ref={moonRef}>
        <mesh visible={isNight}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial color="#eef" />
        </mesh>
      </group>
      {!isNight && (
        <group>
          <SimpleCloud position={[0, 12, -15]} scale={1.5} />
          <SimpleCloud position={[12, 10, -12]} scale={1.2} />
          <SimpleCloud position={[-10, 11, -10]} scale={1.0} />
          <SimpleCloud position={[8, 13, -18]} scale={1.3} />
          <SimpleCloud position={[-15, 9, -14]} scale={0.9} />
        </group>
      )}
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
    </group>
  );
}

type SectionId = "accueil" | "projets" | "contact" | "a-propos";

function normalizeAngleRad(a: number) {
  const twoPi = Math.PI * 2;
  return ((a % twoPi) + twoPi) % twoPi;
}

function sectionFromAzimuth(azimuthRad: number): SectionId {
  const a = normalizeAngleRad(azimuthRad);
  if (a >= 0 && a < Math.PI / 2) return "accueil";
  if (a >= Math.PI / 2 && a < Math.PI) return "projets";
  if (a >= Math.PI && a < (3 * Math.PI) / 2) return "a-propos";
  return "contact";
}

function Overlay({ section }: { section: SectionId }) {
  if (section === "contact") {
    return (
      <div className="overlay">
        <div className="overlayTop">
          <div className="pill">
            <span className="dot" />
            <span className="pillText">On discute ? — Contactez-moi</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.section
            key="contact"
            className="panel contact-grid"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="kicker">Discutons d'une idée</p>
              <h1 className="title">Contact</h1>
              <p className="body" style={{ marginBottom: "20px" }}>
                Je suis toujours ouvert à de nouveaux projets passionnants ou à de simples échanges sur la tech.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <a
                  href="https://github.com/kassimkhemaci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-btn"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/kassimkhemaci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-btn"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  LinkedIn
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Email professionnel</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    readOnly
                    value="kassim.khemaci@gmail.com"
                    style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px" }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("kassim.khemaci@gmail.com");
                      alert("Email copié !");
                    }}
                    style={{ background: "#2a6bff", color: "white", border: "none", borderRadius: "8px", padding: "0 15px", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    Copier
                  </button>
                </div>
              </div>
              <div>
                <button
                  onClick={() => window.location.href = "mailto:kassim.khemaci@gmail.com"}
                  style={{ width: "100%", background: "white", color: "#010104", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Envoyer un message
                </button>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    );
  }

  if (section === "a-propos") {
    return (
      <div className="overlay">
        <div className="overlayTop">
          <div className="pill">
            <span className="dot" />
            <span className="pillText">Développeur Fullstack — Créateur 3D</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.section
            key="a-propos"
            className="panel contact-grid"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <p className="kicker">Une identité claire, un style sobre</p>
              <h1 className="title">À propos</h1>
              <p className="body" style={{ marginBottom: "20px" }}>
                Je construis des interfaces fluides, interactives et performantes. Mon approche combine rigueur technique et exploration créative, notamment à travers la 3D temps réel pour le web.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <span className="skill-badge">React / Next.js</span>
                <span className="skill-badge">Three.js / R3F</span>
                <span className="skill-badge">Node.js</span>
                <span className="skill-badge">TypeScript</span>
                <span className="skill-badge">Framer Motion</span>
                <span className="skill-badge">Tailwind CSS</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="info-item">
                <span className="info-label">Localisation</span>
                <span className="info-value">Annecy / Remote</span>
              </div>
              <div className="info-item">
                <span className="info-label">Expérience</span>
                <span className="info-value">+5 ans</span>
              </div>
              <div className="info-item">
                <span className="info-label">Spécialité</span>
                <span className="info-value">Fullstack & 3D</span>
              </div>
              <div className="info-item">
                <span className="info-label">Passions</span>
                <span className="info-value">Code & Design</span>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    );
  }

  const content = {
    accueil: { title: "Kassim Khemaci", subtitle: "Développeur Fullstack", body: "Exploration immersive de mon univers numérique. Fais tourner la maison pour découvrir mes projets et mon parcours." },
    projets: { title: "Projets", subtitle: "Sélection courte, impact max.", body: "Explore mes réalisations directement sur les murs de la maison. Survole les cadres pour afficher les détails dans l'IDE." },
  }[section as "accueil" | "projets"];


  return (
    <div className="overlay">
      <div className="overlayTop">
        <div className="pill">
          <span className="dot" />
          <span className="pillText">Drag pour tourner — Scroll pour zoom</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.section
          key={section}
          className="panel"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="kicker">{content.subtitle}</p>
          <h1 className="title">{content.title}</h1>
          <p className="body">{content.body}</p>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

export default function Scene() {
  const [section, setSection] = useState<SectionId>("accueil");
  const [isNight, setIsNight] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectData | null>(null);

  const skyColor = isNight ? "#010104" : "#87ceeb";
  const ambientIntensity = isNight ? 0.35 : 0.8;
  const directIntensity = isNight ? 0.4 : 1.2;

  return (
    <div className="stage">
      <button
        onClick={() => setIsNight(!isNight)}
        style={{
          position: "absolute", top: "20px", right: "20px", zIndex: 100,
          background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "50%",
          width: "50px", height: "50px", cursor: "pointer", fontSize: "24px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {isNight ? "🌙" : "☀️"}
      </button>

      <Canvas dpr={1} camera={{ position: [0, 2.3, 5.2], fov: 42 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <color attach="background" args={[skyColor]} />
        <fog attach="fog" args={[skyColor, 7, 55]} />
        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[4, 7, 3]} intensity={directIntensity} color={isNight ? "#4e5ba6" : "#f3f7ff"} />

        <Suspense fallback={null}>
          <group>
            <SkyObjects isNight={isNight} />
            <StreetLights isNight={isNight} />
            <House isNight={isNight} onHoverProject={setHoveredProject} />
            <Ground isNight={isNight} />
          </group>
        </Suspense>

        <OrbitControls
          enablePan={false}
          target={[0, 1.4, 0]}
          minDistance={3.8}
          maxDistance={12}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 2.05}
          rotateSpeed={0.65}
          dampingFactor={0.08}
          enableDamping
          onChange={(e) => {
            const controls = e?.target as any;
            if (controls?.getAzimuthalAngle) {
              const az = controls.getAzimuthalAngle();
              const next = sectionFromAzimuth(az);
              setSection((prev) => (prev === next ? prev : next));
            }
          }}
        />
      </Canvas>

      <Overlay section={section} />
      <IDEWindow project={hoveredProject} />
    </div>
  );
}
