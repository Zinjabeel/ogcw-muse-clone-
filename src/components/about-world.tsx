import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Lightformer, OrbitControls, Text3D } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { DataTexture, Group, MathUtils, RedFormat } from "three";

type Palette = { ink: string; paper: string; accent: string; metal: string };

function CultureSculpture({ palette, reduced }: { palette: Palette; reduced: boolean }) {
  const group = useRef<Group>(null);
  const time = useRef(0);
  const viewport = useThree((state) => state.viewport);
  const texture = useMemo(() => {
    const pixels = new Uint8Array(64 * 64);
    for (let i = 0; i < pixels.length; i += 1) pixels[i] = 130 + ((i * 73 + Math.floor(i / 64) * 31) % 90);
    const map = new DataTexture(pixels, 64, 64, RedFormat);
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({ pointer }, rawDelta) => {
    const sculpture = group.current;
    if (!sculpture || reduced) return;
    const delta = Math.min(rawDelta, 0.05);
    time.current += delta;
    sculpture.rotation.y = MathUtils.damp(sculpture.rotation.y, pointer.x * 0.18 - 0.18, 3, delta);
    sculpture.rotation.x = MathUtils.damp(sculpture.rotation.x, -pointer.y * 0.08 + 0.12, 3, delta);
    sculpture.position.y = Math.sin(time.current * 0.7) * 0.07;
  });
  const scale = Math.min(viewport.width / 7.6, viewport.height / 3.6, 1.35);
  return (
    <group ref={group} scale={scale} rotation={[0.12, -0.18, -0.045]}>
      <Center>
        <Text3D font="/fonts/ogcw-display.json" size={1.6} height={0.5} curveSegments={10} bevelEnabled bevelThickness={0.035} bevelSize={0.025} bevelSegments={3}>
          OGCW
          <meshStandardMaterial color={palette.accent} metalness={0.68} roughness={0.27} roughnessMap={texture} />
        </Text3D>
      </Center>
      <mesh rotation={[0.55, 0.4, -0.24]} position={[0, 0, -0.5]}>
        <torusGeometry args={[3.1, 0.025, 8, 120]} />
        <meshStandardMaterial color={palette.metal} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh rotation={[0.85, -0.3, 0.24]} position={[0, 0, -0.65]}>
        <torusGeometry args={[2.85, 0.012, 6, 120]} />
        <meshStandardMaterial color={palette.paper} metalness={0.55} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function AboutWorld() {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      setPalette({ ink: token("--culture-ink"), paper: token("--culture-paper"), accent: token("--culture-accent"), metal: token("--culture-metal") });
    };
    read();
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(query.matches);
    motion();
    query.addEventListener("change", motion);
    return () => query.removeEventListener("change", motion);
  }, []);
  if (!palette) return null;
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} aria-label="Interactive three-dimensional OGCW lettering">
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 6]} intensity={3} color={palette.paper} />
      <directionalLight position={[-5, 1, 3]} intensity={1.4} color={palette.accent} />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={3} position={[0, 4, 5]} scale={[10, 3, 1]} color={palette.paper} />
          <Lightformer intensity={2} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[5, 5, 1]} color={palette.paper} />
        </Environment>
        <CultureSculpture palette={palette} reduced={reduced} />
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} enableDamping minPolarAngle={Math.PI / 2 - 0.35} maxPolarAngle={Math.PI / 2 + 0.35} minAzimuthAngle={-0.5} maxAzimuthAngle={0.5} />
    </Canvas>
  );
}