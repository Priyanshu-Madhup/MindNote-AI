import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame }          from '@react-three/fiber';
import * as THREE                    from 'three';
import gsap                          from 'gsap';
import { ScrollTrigger }             from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD  = '#c9a84c';
const GOLD2 = '#f4d03f';

// ─── Node layout ──────────────────────────────────────────────────────────────
const NODE_DEFS = [
  { label: 'PODCAST',    angle: 90  },
  { label: 'QUIZ',       angle: 162 },
  { label: 'MIND MAP',   angle: 234 },
  { label: 'SUMMARY',    angle: 306 },
  { label: 'FLASHCARDS', angle: 18  },
];

const nodePos = (deg, r = 2.6) => {
  const a = (deg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(a) * r,
    Math.sin(a) * r * 0.5,
    Math.sin(a) * r * 0.3,
  );
};

// ─── Central Orb ──────────────────────────────────────────────────────────────
function CentralOrb({ scrollRef }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scrollRef.current;
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 0.6) * 0.06;
      const s = 1 + p * 0.6;
      meshRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.05 + p * 0.16;
      glowRef.current.material.emissiveIntensity = 0.2 + p * 1.0;
      const gs = 1 + p * 0.7;
      glowRef.current.scale.setScalar(gs);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshStandardMaterial
          color="#1a1a1a" metalness={0.9} roughness={0.08}
          emissive={GOLD} emissiveIntensity={0.2}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial
          color={GOLD} transparent opacity={0.05}
          side={THREE.BackSide}
          emissive={GOLD} emissiveIntensity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Orbit Node ───────────────────────────────────────────────────────────────
function OrbitNode({ basePos, idx, scrollRef }) {
  const grpRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scrollRef.current;
    if (!grpRef.current) return;
    // Spread outward as user scrolls (1x → 1.5x)
    const spread = 1 + p * 0.5;
    grpRef.current.position.set(
      basePos.x * spread,
      basePos.y * spread + Math.sin(t * 0.5 + idx * 1.1) * 0.06,
      basePos.z * spread,
    );
  });

  return (
    <group ref={grpRef}>
      <mesh>
        <sphereGeometry args={[0.20, 24, 24]} />
        <meshStandardMaterial
          color="#111" metalness={0.95} roughness={0.05}
          emissive={GOLD} emissiveIntensity={0.45}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial
          color={GOLD} transparent opacity={0.07}
          side={THREE.BackSide} depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Connection Lines + Data Particles ────────────────────────────────────────
function Connections({ nodePositions, scrollRef }) {
  const lineRefs    = useRef([]);
  const particleRef = useRef([]);
  const progRef     = useRef(nodePositions.map((_, i) => i / nodePositions.length));

  const lineGeoms = useMemo(() =>
    nodePositions.map(pos => {
      const pts = [new THREE.Vector3(0, 0, 0), pos.clone()];
      return new THREE.BufferGeometry().setFromPoints(pts);
    }),
  [nodePositions]);

  useFrame(({ clock, delta }) => {
    const t = clock.getElapsedTime();
    const p = scrollRef.current;
    const spread = 1 + p * 0.5;

    lineRefs.current.forEach((lineObj, i) => {
      if (!lineObj) return;
      // Dynamically update end point to match spread
      const endPt = nodePositions[i].clone().multiplyScalar(spread);
      const positions = lineObj.geometry.attributes.position;
      positions.setXYZ(1, endPt.x, endPt.y, endPt.z);
      positions.needsUpdate = true;

      const pulse = 0.2 + Math.sin(t * 2.0 + i * 1.3) * 0.2;
      lineObj.material.opacity = 0.08 + p * pulse;
      lineObj.material.color.set(p > 0.1 ? GOLD : '#333');
    });

    // Data particles travel along lines
    progRef.current = progRef.current.map((prog, i) => {
      const speed = 0.3 + p * 0.5 + i * 0.03;
      const next = (prog + delta * speed) % 1;
      const mesh = particleRef.current[i];
      if (mesh) {
        const endPt = nodePositions[i].clone().multiplyScalar(spread);
        mesh.position.copy(endPt.multiplyScalar(next));
        mesh.material.opacity = Math.min(p * 3, 1) * Math.sin(next * Math.PI) * 0.85;
      }
      return next;
    });
  });

  return (
    <>
      {nodePositions.map((_, i) => (
        <group key={i}>
          <primitive
            object={new THREE.Line(
              lineGeoms[i],
              new THREE.LineBasicMaterial({ color: '#333', transparent: true, opacity: 0.1 }),
            )}
            ref={el => { if (el) lineRefs.current[i] = el; }}
          />
          <mesh ref={el => (particleRef.current[i] = el)}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color={GOLD2} emissive={GOLD2} emissiveIntensity={3}
              transparent opacity={0} depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Ambient Particle Cloud ───────────────────────────────────────────────────
function ParticleCloud({ scrollRef }) {
  const count = 350;
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r     = 3 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.4;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const p = scrollRef.current;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    pointsRef.current.material.opacity = 0.15 + p * 0.3;
    pointsRef.current.material.size = 0.025 + p * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD} size={0.025} sizeAttenuation
        transparent opacity={0.15} depthWrite={false}
      />
    </points>
  );
}

// ─── Full Scene ───────────────────────────────────────────────────────────────
function Scene({ scrollRef, mouseRef }) {
  const groupRef      = useRef();
  const nodePositions = useMemo(() => NODE_DEFS.map(n => nodePos(n.angle)), []);

  useFrame(({ camera, clock }) => {
    const p  = scrollRef.current;
    const t  = clock.getElapsedTime();
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    if (groupRef.current) {
      // Slow auto-rotation + scroll-driven tilt + mouse parallax
      groupRef.current.rotation.y = t * 0.08 + p * Math.PI * 0.55 + mx * 0.12;
      groupRef.current.rotation.x = p * 0.3 - my * 0.08;
    }

    // Camera: zoom in as user scrolls deeper, plus mouse offset
    const targetZ = THREE.MathUtils.lerp(5.5, 2.0, Math.min(p * 1.4, 1));
    const targetX = mx * 0.35;
    const targetY = -my * 0.2 + p * -0.3;
    camera.position.z += (targetZ - camera.position.z) * 0.03;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]}   color={GOLD}    intensity={2} distance={8} decay={2} />
      <pointLight position={[5, 5, 4]}   color="#ffffff" intensity={0.3} />
      <pointLight position={[-3, -3, 2]} color={GOLD2}   intensity={0.25} />

      <ParticleCloud scrollRef={scrollRef} />

      <group ref={groupRef}>
        <CentralOrb scrollRef={scrollRef} />
        <Connections nodePositions={nodePositions} scrollRef={scrollRef} />
        {nodePositions.map((pos, i) => (
          <OrbitNode key={i} basePos={pos} idx={i} scrollRef={scrollRef} />
        ))}
      </group>
    </>
  );
}

// ─── Fixed Full-Page Background (exported) ────────────────────────────────────
export default function Background3D({ scrollRef }) {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = e => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth)  * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ScrollTrigger drives the single scrollRef
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => { scrollRef.current = self.progress; },
      });
    });
    return () => ctx.revert();
  }, [scrollRef]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 58 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        eventSource={undefined}
      >
        <Scene scrollRef={scrollRef} mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}
