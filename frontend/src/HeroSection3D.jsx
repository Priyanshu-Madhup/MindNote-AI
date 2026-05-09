import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame }          from '@react-three/fiber';
import * as THREE                    from 'three';
import gsap                          from 'gsap';
import { ScrollTrigger }             from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD  = '#c9a84c';
const GOLD2 = '#f4d03f';

const NODE_DEFS = [
  { label: 'PODCAST',    angle: 90  },
  { label: 'QUIZ',       angle: 162 },
  { label: 'MIND MAP',   angle: 234 },
  { label: 'SUMMARY',    angle: 306 },
  { label: 'FLASHCARDS', angle: 18  },
];

// Place nodes on a tilted ellipse for 3D depth
const nodePos = (deg, r = 2.6) => {
  const a = (deg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(a) * r,
    Math.sin(a) * r * 0.50,   // vertical squish → tilt illusion
    Math.sin(a) * r * 0.30,   // Z depth
  );
};

// ─── Central Orb ─────────────────────────────────────────────────────────────
function CentralOrb({ scrollRef }) {
  const innerRef = useRef();
  const glowRef  = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = scrollRef.current;
    if (innerRef.current) {
      innerRef.current.position.y = Math.sin(t * 0.7) * 0.07;
      // Phase 3: slightly expand
      const s = 1 + p * 0.5;
      innerRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.06 + p * 0.12;
      glowRef.current.material.emissiveIntensity = 0.3 + p * 0.7;
    }
  });

  return (
    <group>
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.08}
          emissive={GOLD}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* halo shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial
          color={GOLD}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          emissive={GOLD}
          emissiveIntensity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Orbit Node ──────────────────────────────────────────────────────────────
function OrbitNode({ pos, idx }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current)
      meshRef.current.position.y = pos.y + Math.sin(t * 0.55 + idx * 1.1) * 0.055;
  });
  return (
    <group position={pos.toArray()}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.20, 24, 24]} />
        <meshStandardMaterial
          color="#111"
          metalness={0.95}
          roughness={0.05}
          emissive={GOLD}
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial
          color={GOLD}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Connection Lines + Pulsing Particles ────────────────────────────────────
function Connections({ nodePositions, scrollRef }) {
  const lineMatRefs = useRef([]);
  const particleRefs = useRef([]);
  const progRef = useRef(nodePositions.map((_, i) => i / nodePositions.length));

  // Build line geometries once
  const lineGeoms = useMemo(() =>
    nodePositions.map(pos => {
      const pts = [new THREE.Vector3(0, 0, 0), pos.clone()];
      return new THREE.BufferGeometry().setFromPoints(pts);
    }),
  [nodePositions]);

  useFrame(({ clock, delta }) => {
    const t = clock.getElapsedTime();
    const p = scrollRef.current; // 0..1

    lineMatRefs.current.forEach((mat, i) => {
      if (!mat) return;
      const pulse = 0.25 + Math.sin(t * 1.8 + i * 1.2) * 0.2;
      mat.opacity = 0.12 + p * pulse;
      mat.color.set(p > 0.15 ? GOLD : '#333');
    });

    progRef.current = progRef.current.map((prog, i) => {
      const next = (prog + delta * (0.4 + i * 0.04)) % 1;
      const mesh = particleRefs.current[i];
      if (mesh) {
        const lerped = nodePositions[i].clone().multiplyScalar(next);
        mesh.position.copy(lerped);
        const alpha = Math.min(p * 2.5, 1) * Math.sin(next * Math.PI) * 0.9;
        mesh.material.opacity = alpha;
      }
      return next;
    });
  });

  return (
    <>
      {nodePositions.map((pos, i) => (
        <group key={i}>
          <primitive
            object={new THREE.Line(
              lineGeoms[i],
              new THREE.LineBasicMaterial({ color: '#333', transparent: true, opacity: 0.12 }),
            )}
            ref={el => { if (el) lineMatRefs.current[i] = el.material; }}
          />
          <mesh ref={el => particleRefs.current[i] = el}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial
              color={GOLD2}
              emissive={GOLD2}
              emissiveIntensity={3}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Ambient Particle Cloud ───────────────────────────────────────────────────
function ParticleCloud() {
  const count = 280;
  const pointsRef = useRef();

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz  = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.4;
      sz[i] = 0.4 + Math.random() * 1.2;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current)
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size"     args={[sizes,     1]} />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD}
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Full 3D Scene ────────────────────────────────────────────────────────────
function Scene({ scrollRef, mouseRef }) {
  const groupRef   = useRef();
  const nodePositions = useMemo(() => NODE_DEFS.map(n => nodePos(n.angle)), []);

  useFrame(({ camera, clock }) => {
    const p  = scrollRef.current;
    const t  = clock.getElapsedTime();
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    if (groupRef.current) {
      // Continuous slow auto-spin + scroll-driven tilt
      groupRef.current.rotation.y = t * 0.12 + p * Math.PI * 0.45 + mx * 0.14;
      groupRef.current.rotation.x = p * 0.28 - my * 0.09;
    }

    // Phase 3 zoom (scroll > 0.6)
    const phase3 = Math.max(0, (p - 0.6) / 0.4);
    const targetZ = THREE.MathUtils.lerp(5, 2.2, phase3);
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    camera.position.x += (mx * 0.4  - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.25 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]}   color={GOLD}    intensity={2.5} distance={7} decay={2} />
      <pointLight position={[4, 4, 4]}   color="#ffffff" intensity={0.4} />
      <pointLight position={[-3, -3, 2]} color={GOLD2}   intensity={0.3} />

      <ParticleCloud />

      <group ref={groupRef}>
        <CentralOrb scrollRef={scrollRef} />
        <Connections nodePositions={nodePositions} scrollRef={scrollRef} />
        {nodePositions.map((pos, i) => (
          <OrbitNode key={i} pos={pos} idx={i} />
        ))}
      </group>
    </>
  );
}

// ─── Hero Section (exported) ──────────────────────────────────────────────────
export default function HeroSection3D({ onEnterApp }) {
  const sectionRef = useRef();
  const leftRef    = useRef();
  const scrollRef  = useRef(0);
  const mouseRef   = useRef({ x: 0, y: 0 });

  // Mouse parallax
  useEffect(() => {
    const onMove = e => {
      mouseRef.current = {
        x:  (e.clientX / window.innerWidth)  * 2 - 1,
        y:  (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ScrollTrigger — progress + text fade (no GSAP pin needed; sticky CSS handles it)
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start:   'top top',
        end:     'bottom bottom',
        onUpdate: self => {
          scrollRef.current = self.progress;
          if (leftRef.current)
            leftRef.current.style.opacity = String(1 - self.progress * 0.78);
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ display: 'flex', height: '280vh', background: '#0a0a0a', position: 'relative' }}
    >
      {/* ── Left: sticky pinned text ──────────────────────────────────────── */}
      <div
        ref={leftRef}
        style={{
          width: '38%',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 52px',
          zIndex: 10,
          willChange: 'opacity',
        }}
      >
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: GOLD,
          marginBottom: '18px',
          display: 'block',
        }}>
          V2.0 NOW LIVE
        </span>

        <h1 style={{
          fontFamily: 'Epilogue, sans-serif',
          fontSize: 'clamp(2rem, 3.6vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          color: '#f0ece0',
          marginBottom: '22px',
          margin: '0 0 22px 0',
        }}>
          Turn Any Document Into{' '}
          <span style={{ color: '#f4d03f', fontStyle: 'italic' }}>Knowledge</span>
        </h1>

        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1rem',
          lineHeight: 1.72,
          color: '#6a6560',
          marginBottom: '40px',
          maxWidth: '360px',
        }}>
          Podcasts, flashcards, mind maps, quizzes — all generated by AI from your
          notes. Scroll to watch the transformation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
          <button
            id="hero3d-get-started"
            onClick={onEnterApp}
            style={{
              background: '#e6c364',
              color: '#0a0a0a',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              padding: '18px 36px',
              cursor: 'pointer',
            }}
          >
            Get Started Free
          </button>
          <button
            id="hero3d-how-it-works"
            onClick={() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'transparent',
              color: '#f0ece0',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: '1px solid #222',
              padding: '18px 36px',
              cursor: 'pointer',
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Scroll cue */}
        <div style={{ marginTop: '56px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '1px', height: '36px',
            background: `linear-gradient(to bottom, ${GOLD}, transparent)`,
          }} />
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#383530',
          }}>
            Scroll to explore
          </span>
        </div>
      </div>

      {/* ── Right: R3F canvas ─────────────────────────────────────────────── */}
      <div style={{
        width: '62%',
        height: '100vh',
        position: 'sticky',
        top: 0,
        // Radial mask: left edge bleeds into the dark background
        maskImage:
          'radial-gradient(ellipse 85% 95% at 65% 50%, black 35%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 95% at 65% 50%, black 35%, transparent 100%)',
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 58 }}
          style={{ background: 'transparent' }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene scrollRef={scrollRef} mouseRef={mouseRef} />
        </Canvas>
      </div>
    </section>
  );
}
