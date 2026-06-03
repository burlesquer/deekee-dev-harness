'use client';

import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment } from './Environment';
import { OfficeLayout } from './OfficeLayout';
import { AgentCharacters } from './characters/AgentCharacters';

function TestBox() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#FF6B2C" />
    </mesh>
  );
}

export default function OfficeCanvas() {
  const [showGrid, setShowGrid] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 컨트롤 버튼들 */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setDebugMode((v) => !v)}
          className="cursor-pointer border border-dk-harness-orange/20 bg-white/80 px-2.5 py-1 font-mono text-xs text-dk-harness-orange backdrop-blur-sm hover:bg-dk-harness-light"
        >
          {debugMode ? '▶ Full Scene' : '⬛ Debug'}
        </button>
        <button
          onClick={() => setShowGrid((v) => !v)}
          className="cursor-pointer border border-dk-harness-orange/20 bg-white/80 px-2.5 py-1 font-mono text-xs text-dk-harness-orange backdrop-blur-sm hover:bg-dk-harness-light"
        >
          {showGrid ? 'Grid OFF' : 'Grid ON'}
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 15, 18], fov: 40 }}
        style={{ background: '#faf5ef' }}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#faf5ef');
        }}
      >
        <Suspense fallback={null}>
          {debugMode ? (
            <>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 8, 5]} intensity={1.0} />
              <TestBox />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#f5ebe0" />
              </mesh>
            </>
          ) : (
            <>
              <Environment showGrid={showGrid} />
              <OfficeLayout />
              <AgentCharacters />
            </>
          )}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={25}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
