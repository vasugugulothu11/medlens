import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AnatomyHighlight } from '../../types';

export type DissectionLayer = 'cutaway' | 'viscera' | 'skeletal' | 'muscular' | 'cardiovascular';

interface RealAnatomyModelProps {
  highlights: AnatomyHighlight[];
  selectedStructure: string | null;
  layer: DissectionLayer;
  showCallouts: 'all' | 'flagged' | 'none';
  onSelectStructure: (structureId: string, position?: [number, number, number], label?: string) => void;
  isCyberMode?: boolean;
}

// Helper: check if structure is clinically flagged
export function getAnatomicalHighlight(
  highlights: AnatomyHighlight[],
  id: string
): AnatomyHighlight | undefined {
  const target = id.toLowerCase();
  return highlights.find((h) => {
    const hid = h.structureId.toLowerCase();
    return hid === target || hid.includes(target) || target.includes(hid);
  });
}

// =============================================================================
// CALLOUT PIN & LEADER LINE COMPONENT (Matches Reference Images 1, 3, 4)
// =============================================================================
interface CalloutPinProps {
  label: string;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  isFlagged: boolean;
  severity?: 'high' | 'medium' | 'low';
  flagReason?: string;
  isSelected: boolean;
  onClick: () => void;
  visible: boolean;
}

const CalloutPin: React.FC<CalloutPinProps> = ({
  label,
  sourcePos,
  targetPos,
  isFlagged,
  severity = 'medium',
  flagReason,
  isSelected,
  onClick,
  visible,
}) => {
  const [hovered, setHovered] = useState(false);
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (dotRef.current && (isFlagged || isSelected)) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.25;
      dotRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!visible) return null;

  const accentColor = isSelected
    ? '#f43f5e'
    : isFlagged
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : hovered
    ? '#38bdf8'
    : '#94a3b8';

  const lineColor = isSelected
    ? '#f43f5e'
    : isFlagged
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#64748b';

  return (
    <group>
      {/* 3D Anatomical Leader Line */}
      <Line
        points={[sourcePos, [targetPos[0] * 0.6 + sourcePos[0] * 0.4, targetPos[1], sourcePos[2] * 0.5], targetPos]}
        color={lineColor}
        lineWidth={hovered || isSelected ? 2 : 1}
        transparent
        opacity={hovered || isSelected ? 0.95 : isFlagged ? 0.85 : 0.5}
      />

      {/* Target Pin Head Dot */}
      <mesh ref={dotRef} position={sourcePos}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* Interactive Floating HTML Badge */}
      <Html
        position={targetPos}
        center
        distanceFactor={6}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold tracking-tight transition-all duration-150 cursor-pointer shadow-md border ${
            isSelected
              ? 'bg-rose-950/90 text-rose-200 border-rose-500 scale-105 shadow-rose-900/50'
              : isFlagged
              ? severity === 'high'
                ? 'bg-red-950/90 text-red-200 border-red-500 shadow-red-900/50 hover:scale-105'
                : 'bg-amber-950/90 text-amber-200 border-amber-500 shadow-amber-900/50 hover:scale-105'
              : hovered
              ? 'bg-slate-800/95 text-cyan-200 border-cyan-500 scale-105 shadow-slate-900'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSelected
                ? 'bg-rose-400 animate-ping'
                : isFlagged
                ? severity === 'high'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span className="font-medium">{label}</span>
          {isFlagged && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                severity === 'high' ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'
              }`}
            >
              Flag
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};

// =============================================================================
// PROCEDURAL PROCEDURAL ANATOMICAL GEOMETRIES
// =============================================================================

// 1. Realistic Vertebral Column (Articulated Spine T1-L5, Cervical, Sacrum)
const ArticulatedSpine: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const vertebrae = useMemo(() => {
    const items = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const y = 1.05 - i * 0.085;
      const width = 0.075 + (i > 14 ? (i - 14) * 0.008 : 0);
      const isLumbar = i >= 14 && i <= 19;
      items.push({ id: i, y, width, isLumbar });
    }
    return items;
  }, []);

  const boneColor = isSelected ? '#f43f5e' : isHighlighted ? (severity === 'high' ? '#ef4444' : '#f97316') : '#ded7c6';
  const discColor = '#948a78';

  return (
    <group onClick={onClick}>
      {vertebrae.map((v) => (
        <group key={v.id} position={[0, v.y, -0.05]}>
          {/* Vertebral Body */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[v.width, v.width * 1.05, 0.055, 16]} />
            <meshStandardMaterial color={boneColor} roughness={0.45} metalness={0.08} />
          </mesh>

          {/* Intervertebral Disc */}
          <mesh position={[0, -0.035, 0]}>
            <cylinderGeometry args={[v.width * 0.96, v.width * 0.96, 0.022, 16]} />
            <meshStandardMaterial color={discColor} roughness={0.6} />
          </mesh>

          {/* Posterior Spinous Process (Prominent in Lateral & Posterior views) */}
          <mesh position={[0, 0, -v.width * 1.1]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.025, 0.035, v.width * 1.2]} />
            <meshStandardMaterial color={boneColor} roughness={0.45} />
          </mesh>

          {/* Transverse Processes */}
          <mesh position={[-v.width * 1.1, 0, -0.02]}>
            <boxGeometry args={[v.width * 0.8, 0.025, 0.03]} />
            <meshStandardMaterial color={boneColor} roughness={0.45} />
          </mesh>
          <mesh position={[v.width * 1.1, 0, -0.02]}>
            <boxGeometry args={[v.width * 0.8, 0.025, 0.03]} />
            <meshStandardMaterial color={boneColor} roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Triangular Sacrum & Coccyx */}
      <group position={[0, -0.88, -0.06]}>
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.22, 0.35, 16]} />
          <meshStandardMaterial color={boneColor} roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
};

// 2. Ribcage & Costal Cartilage & Sternum (Reference Images 1, 3, 4)
const RibcageAndSternum: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
  showFullOrHalf?: 'half' | 'full';
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick, showFullOrHalf = 'half' }) => {
  const boneColor = isSelected ? '#f43f5e' : isHighlighted ? (severity === 'high' ? '#ef4444' : '#f97316') : '#e4dcd0';
  const cartilageColor = '#c8d9e6'; // Bluish-white translucent costal cartilage

  // Generate 8 curved rib pairs
  const ribs = useMemo(() => {
    const list = [];
    for (let i = 0; i < 9; i++) {
      const y = 0.82 - i * 0.095;
      const radiusX = 0.34 + Math.sin((i / 8) * Math.PI) * 0.16;
      const radiusZ = 0.22 + Math.sin((i / 8) * Math.PI) * 0.09;
      list.push({ id: i, y, radiusX, radiusZ });
    }
    return list;
  }, []);

  return (
    <group onClick={onClick}>
      {/* Central Sternum (Manubrium + Body + Xiphoid Process) */}
      <group position={[0, 0.52, 0.28]}>
        {/* Manubrium (Top Shield) */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.035]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        {/* Sternal Body */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.03]} />
          <meshStandardMaterial color={boneColor} roughness={0.4} />
        </mesh>
        {/* Xiphoid Process Tip */}
        <mesh position={[0, -0.16, -0.01]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.04, 0.08, 12]} />
          <meshStandardMaterial color={cartilageColor} roughness={0.3} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Clavicles (Collar Bones) */}
      <mesh position={[-0.32, 0.94, 0.16]} rotation={[0.08, 0.2, -0.18]} castShadow>
        <cylinderGeometry args={[0.026, 0.032, 0.44, 12]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>
      <mesh position={[0.32, 0.94, 0.16]} rotation={[0.08, -0.2, 0.18]} castShadow>
        <cylinderGeometry args={[0.026, 0.032, 0.44, 12]} />
        <meshStandardMaterial color={boneColor} roughness={0.4} />
      </mesh>

      {/* Curved Ribs with Costal Cartilage */}
      {ribs.map((r) => (
        <group key={r.id} position={[0, r.y, 0]}>
          {/* Left Rib (always visible in cutaway) */}
          <group position={[0.02, 0, 0]}>
            {/* Posterior & Lateral Bone Arc */}
            <mesh rotation={[0.18, 0.2, -0.14]} castShadow>
              <torusGeometry args={[r.radiusX * 0.92, 0.022, 10, 24, Math.PI * 0.65]} />
              <meshStandardMaterial color={boneColor} roughness={0.42} />
            </mesh>
            {/* Anterior Costal Cartilage connecting to Sternum */}
            <mesh position={[0.06, -0.02, r.radiusZ * 1.1]} rotation={[0.05, 0.4, 0.1]}>
              <cylinderGeometry args={[0.02, 0.022, 0.18, 10]} />
              <meshStandardMaterial color={cartilageColor} roughness={0.3} transparent opacity={0.88} />
            </mesh>
          </group>

          {/* Right Rib (visible if full mode, or partially visible in cutaway) */}
          {showFullOrHalf === 'full' && (
            <group position={[-0.02, 0, 0]}>
              <mesh rotation={[0.18, -0.2, 0.14]} castShadow>
                <torusGeometry args={[r.radiusX * 0.92, 0.022, 10, 24, Math.PI * 0.65]} />
                <meshStandardMaterial color={boneColor} roughness={0.42} />
              </mesh>
              <mesh position={[-0.06, -0.02, r.radiusZ * 1.1]} rotation={[0.05, -0.4, -0.1]}>
                <cylinderGeometry args={[0.02, 0.022, 0.18, 10]} />
                <meshStandardMaterial color={cartilageColor} roughness={0.3} transparent opacity={0.88} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

// 3. Realistic Anatomical Heart & Aorta (Left Ventricle, Aortic Arch, Coronary Arteries)
const RealisticHeart: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const heartGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (heartGroupRef.current) {
      const t = clock.getElapsedTime();
      // Physiological lub-dub cardiac rhythm
      const beat1 = Math.sin(t * 4.5);
      const beat2 = Math.sin(t * 4.5 + 0.35);
      const expansion = 1 + (beat1 > 0.7 ? 0.07 : 0) + (beat2 > 0.8 ? 0.04 : 0);
      heartGroupRef.current.scale.set(expansion, expansion * 1.02, expansion);
    }
  });

  const muscleColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#8f2824'; // Deep cardiac myocardium crimson
  const aortaColor = '#b91c1c'; // Bright oxygenated arterial red
  const cavaColor = '#1d4ed8'; // Deoxygenated venous blue

  return (
    <group ref={heartGroupRef} position={[-0.04, 0.44, 0.14]} onClick={onClick}>
      {/* Main Cardiac Mass (Ventricular Cone tilted slightly left) */}
      <mesh rotation={[0.22, 0.25, -0.38]} castShadow>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={muscleColor} roughness={0.35} metalness={0.12} />
      </mesh>

      {/* Left Ventricle Apex (Anterior pointed tip toward left hypochondrium) */}
      <mesh position={[-0.07, -0.11, 0.04]} rotation={[0.3, 0.2, -0.4]} castShadow>
        <coneGeometry args={[0.11, 0.16, 20]} />
        <meshStandardMaterial color={muscleColor} roughness={0.35} metalness={0.12} />
      </mesh>

      {/* Atrial Base */}
      <mesh position={[0.04, 0.09, -0.02]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color="#7a201c" roughness={0.4} />
      </mesh>

      {/* Ascending Aorta & Iconic Aortic Arch */}
      <group position={[0.02, 0.12, 0]}>
        {/* Ascending Root */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.042, 0.045, 0.14, 16]} />
          <meshStandardMaterial color={aortaColor} roughness={0.28} />
        </mesh>
        {/* Curved Aortic Arch */}
        <mesh position={[-0.03, 0.16, -0.03]} rotation={[0, 0, -Math.PI * 0.4]}>
          <torusGeometry args={[0.08, 0.038, 12, 20, Math.PI * 0.85]} />
          <meshStandardMaterial color={aortaColor} roughness={0.28} />
        </mesh>
        {/* Brachiocephalic, Carotid, Subclavian Branches */}
        <mesh position={[-0.06, 0.25, -0.01]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.014, 0.016, 0.08, 10]} />
          <meshStandardMaterial color={aortaColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.02, 0.26, -0.02]}>
          <cylinderGeometry args={[0.013, 0.014, 0.09, 10]} />
          <meshStandardMaterial color={aortaColor} roughness={0.3} />
        </mesh>
        <mesh position={[0.02, 0.25, -0.03]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.014, 0.015, 0.08, 10]} />
          <meshStandardMaterial color={aortaColor} roughness={0.3} />
        </mesh>
      </group>

      {/* Pulmonary Trunk */}
      <mesh position={[-0.04, 0.13, 0.06]} rotation={[0.4, 0.2, -0.3]}>
        <cylinderGeometry args={[0.036, 0.038, 0.13, 14]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>

      {/* Superior Vena Cava */}
      <mesh position={[0.09, 0.18, -0.03]}>
        <cylinderGeometry args={[0.032, 0.035, 0.18, 14]} />
        <meshStandardMaterial color={cavaColor} roughness={0.3} />
      </mesh>

      {/* Anterior Interventricular Coronary Artery (Sulcus branch) */}
      <mesh position={[-0.04, -0.04, 0.14]} rotation={[0.2, 0.1, -0.5]}>
        <cylinderGeometry args={[0.007, 0.006, 0.18, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.2} emissive="#ef4444" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
};

// 4. Lungs with Bronchial Arborization & Lobes (Reference Images 1, 3, 4)
const RealisticLungs: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const lungGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (lungGroupRef.current) {
      const t = clock.getElapsedTime();
      // Gentle rhythmic respiratory expansion
      const resp = 1 + Math.sin(t * 1.8) * 0.025;
      lungGroupRef.current.scale.set(resp, resp * 1.01, resp * 1.03);
    }
  });

  const lungColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#ad6363'; // Realistic textured pulmonary pink-mauve

  return (
    <group ref={lungGroupRef} onClick={onClick}>
      {/* Right Lung (3 Lobes: Superior, Middle, Inferior) */}
      <group position={[-0.24, 0.44, 0.04]}>
        {/* Superior Lobe */}
        <mesh position={[0, 0.16, 0]} rotation={[0.05, 0.1, 0.05]} castShadow>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshStandardMaterial color={lungColor} roughness={0.55} />
        </mesh>
        {/* Middle & Inferior Lobes */}
        <mesh position={[0, -0.06, 0]} rotation={[-0.05, 0.1, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.32, 10, 16]} />
          <meshStandardMaterial color={lungColor} roughness={0.55} />
        </mesh>
      </group>

      {/* Left Lung (2 Lobes with deep Cardiac Notch accommodating Heart) */}
      <group position={[0.22, 0.44, 0.02]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color={lungColor} roughness={0.55} />
        </mesh>
        <mesh position={[0.02, -0.08, 0]} rotation={[0, -0.15, -0.05]} castShadow>
          <capsuleGeometry args={[0.12, 0.28, 10, 16]} />
          <meshStandardMaterial color={lungColor} roughness={0.55} />
        </mesh>
      </group>

      {/* Trachea & Primary Bronchi Bifurcation */}
      <group position={[0, 0.72, 0.02]}>
        {/* Trachea with Cartilaginous Rings */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.032, 0.034, 0.22, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        {/* Right Main Bronchus */}
        <mesh position={[-0.07, -0.04, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.022, 0.024, 0.12, 12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.4} />
        </mesh>
        {/* Left Main Bronchus */}
        <mesh position={[0.08, -0.05, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.02, 0.022, 0.14, 12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// 5. Diaphragm Dome (Partitioning Thorax & Abdomen)
const DiaphragmDome: React.FC<{
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, isSelected, onClick }) => {
  const diaColor = isSelected ? '#f43f5e' : isHighlighted ? '#f97316' : '#945353';

  return (
    <group position={[0, 0.16, 0.04]} onClick={onClick}>
      {/* Dome-shaped muscular partition */}
      <mesh rotation={[Math.PI * 0.1, 0, 0]} receiveShadow>
        <sphereGeometry args={[0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial
          color={diaColor}
          roughness={0.6}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
};

// 6. Realistic Liver & Gallbladder (Reference Images 1, 3, 4)
const RealisticLiverAndGallbladder: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const liverColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#702d22'; // Smooth reddish-brown hepatocyte tissue
  const gallColor = '#1e5e3a'; // Emerald green bile sac

  return (
    <group position={[-0.06, 0.06, 0.14]} onClick={onClick}>
      {/* Large Right Hepatic Lobe */}
      <mesh position={[-0.12, 0, 0]} rotation={[0.1, 0.2, -0.15]} castShadow>
        <sphereGeometry args={[0.21, 20, 20]} />
        <meshStandardMaterial color={liverColor} roughness={0.32} metalness={0.1} />
      </mesh>

      {/* Tapering Left Hepatic Lobe crossing the midline */}
      <mesh position={[0.09, 0.03, 0.02]} rotation={[0.08, 0.15, -0.28]} castShadow>
        <cylinderGeometry args={[0.08, 0.16, 0.26, 16]} />
        <meshStandardMaterial color={liverColor} roughness={0.32} metalness={0.1} />
      </mesh>

      {/* Pear-shaped Emerald Gallbladder nestled under right lobe */}
      <mesh position={[-0.14, -0.12, 0.09]} rotation={[0.3, 0.2, 0.1]} castShadow>
        <sphereGeometry args={[0.052, 16, 16]} />
        <meshStandardMaterial color={gallColor} roughness={0.25} metalness={0.2} />
      </mesh>
    </group>
  );
};

// 7. Stomach & Pancreas (Reference Images 3, 4)
const RealisticStomachAndPancreas: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const stomachColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#99505c'; // Pearlescent gastric mucosa
  const pancreasColor = '#d9943b'; // Textured golden endocrine gland

  return (
    <group onClick={onClick}>
      {/* J-shaped Stomach with Fundus & Greater Curvature */}
      <group position={[0.11, 0.08, 0.12]}>
        {/* Gastric Fundus */}
        <mesh position={[0.04, 0.08, -0.02]} castShadow>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color={stomachColor} roughness={0.36} />
        </mesh>
        {/* Gastric Body & Greater Curvature */}
        <mesh position={[-0.04, -0.05, 0.03]} rotation={[0.2, 0.2, 0.6]} castShadow>
          <capsuleGeometry args={[0.09, 0.18, 12, 16]} />
          <meshStandardMaterial color={stomachColor} roughness={0.36} />
        </mesh>
      </group>

      {/* Horizontal Pancreas nestled behind stomach in duodenal bed */}
      <mesh position={[0.01, -0.06, 0.06]} rotation={[0.1, 0.1, -0.2]} castShadow>
        <capsuleGeometry args={[0.048, 0.26, 10, 14]} />
        <meshStandardMaterial color={pancreasColor} roughness={0.65} />
      </mesh>
    </group>
  );
};

// 8. Intestinal Viscera (Segmented Colon Haustra + Convoluted Small Bowel)
const RealisticIntestines: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const smallBowelColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#b86658';
  const colonColor = '#a8584a';

  // Haustral segments of colon
  const colonNodes = useMemo(() => {
    return [
      // Ascending Colon (right flank)
      { pos: [-0.22, -0.42, 0.08], scale: 0.075 },
      { pos: [-0.23, -0.3, 0.09], scale: 0.08 },
      { pos: [-0.22, -0.18, 0.1], scale: 0.085 },
      // Hepatic flexure -> Transverse Colon arching across
      { pos: [-0.14, -0.15, 0.15], scale: 0.08 },
      { pos: [-0.02, -0.14, 0.16], scale: 0.085 },
      { pos: [0.11, -0.15, 0.15], scale: 0.08 },
      // Splenic flexure -> Descending Colon (left flank)
      { pos: [0.21, -0.19, 0.1], scale: 0.085 },
      { pos: [0.22, -0.31, 0.09], scale: 0.08 },
      { pos: [0.21, -0.43, 0.08], scale: 0.075 },
    ];
  }, []);

  return (
    <group position={[0, -0.06, 0]} onClick={onClick}>
      {/* Large Intestine Segmented Haustra Frame */}
      {colonNodes.map((c, idx) => (
        <mesh key={idx} position={c.pos as [number, number, number]} castShadow>
          <sphereGeometry args={[c.scale, 14, 14]} />
          <meshStandardMaterial color={colonColor} roughness={0.45} />
        </mesh>
      ))}

      {/* Small Intestine Convoluted Coils (Jejunum & Ileum) in Central Pelvic Nest */}
      <group position={[0, -0.36, 0.13]}>
        <mesh castShadow>
          <torusGeometry args={[0.13, 0.045, 10, 20, Math.PI * 1.6]} />
          <meshStandardMaterial color={smallBowelColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.05, 0.06, 0.03]} rotation={[0.4, 0.3, 0.8]}>
          <torusGeometry args={[0.09, 0.042, 10, 18, Math.PI * 1.5]} />
          <meshStandardMaterial color={smallBowelColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.06, -0.05, 0.04]} rotation={[-0.3, 0.2, 0.5]}>
          <torusGeometry args={[0.1, 0.04, 10, 18, Math.PI * 1.4]} />
          <meshStandardMaterial color={smallBowelColor} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// 9. Retroperitoneal Kidneys & Adrenal Glands (Visible in Posterior View - Ref 2 & 4)
const RetroperitonealKidneys: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const kidneyColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#631f1f'; // Deep bean-red renal parenchyma
  const adrenalColor = '#eab308'; // Golden yellow suprarenal gland

  return (
    <group position={[0, -0.06, -0.08]} onClick={onClick}>
      {/* Right Kidney (Slightly lower due to liver footprint) */}
      <group position={[-0.18, -0.06, 0]}>
        {/* Bean-shaped body */}
        <mesh rotation={[0.1, 0.2, -0.2]} castShadow>
          <sphereGeometry args={[0.085, 18, 18]} />
          <meshStandardMaterial color={kidneyColor} roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Right Adrenal Gland */}
        <mesh position={[0.02, 0.09, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.038, 0.05, 10]} />
          <meshStandardMaterial color={adrenalColor} roughness={0.5} />
        </mesh>
        {/* Ureter descending */}
        <mesh position={[0.02, -0.16, 0]}>
          <cylinderGeometry args={[0.007, 0.008, 0.22, 8]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </mesh>
      </group>

      {/* Left Kidney */}
      <group position={[0.18, -0.02, 0]}>
        <mesh rotation={[0.1, -0.2, 0.2]} castShadow>
          <sphereGeometry args={[0.088, 18, 18]} />
          <meshStandardMaterial color={kidneyColor} roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Left Adrenal Gland */}
        <mesh position={[-0.02, 0.09, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.038, 0.05, 10]} />
          <meshStandardMaterial color={adrenalColor} roughness={0.5} />
        </mesh>
        {/* Ureter descending */}
        <mesh position={[-0.02, -0.18, 0]}>
          <cylinderGeometry args={[0.007, 0.008, 0.24, 8]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// 10. Anatomical Skull & Brain (Cross-Section Frontal Lobe - Reference 1)
const AnatomicalHeadAndBrain: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick }) => {
  const boneColor = isSelected ? '#f43f5e' : isHighlighted ? (severity === 'high' ? '#ef4444' : '#f97316') : '#ded6c6';
  const brainColor = '#cf8e8e'; // Convoluted cerebral gyri pink

  return (
    <group position={[0, 1.48, 0]} onClick={onClick}>
      {/* Cranial Vault (Bony Skull Dome) */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={boneColor} roughness={0.46} />
      </mesh>

      {/* Sagittal Cross-Section: Exposed Brain (Frontal Lobe & Cortex as in Ref 1) */}
      <group position={[0.08, 0.14, 0.05]}>
        {/* Frontal & Cerebral Cortex Convolutions */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={brainColor} roughness={0.62} bumpScale={0.05} />
        </mesh>
        {/* Cerebellum (posterior base) */}
        <mesh position={[-0.02, -0.12, -0.12]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#b57474" roughness={0.6} />
        </mesh>
        {/* Brainstem & Pons leading into spinal canal */}
        <mesh position={[0, -0.19, -0.06]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.16, 14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
      </group>

      {/* Facial Skeleton & Orbits */}
      <group position={[-0.04, -0.08, 0.22]}>
        {/* Eye Orbit Sockets */}
        <mesh position={[-0.1, 0.04, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.04, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* Maxilla & Mandible */}
        <mesh position={[-0.01, -0.14, -0.02]}>
          <boxGeometry args={[0.18, 0.14, 0.14]} />
          <meshStandardMaterial color={boneColor} roughness={0.48} />
        </mesh>
      </group>
    </group>
  );
};

// 11. Realistic Musculoskeletal Cutaway Wall (Pectoralis, Rectus Abdominis, Linea Alba, Obliques, Serratus - Ref 1, 3, 4)
const MuscularCutawayShell: React.FC<{
  isHighlighted: boolean;
  severity?: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
  fullOrHalf?: 'half' | 'full';
}> = ({ isHighlighted, severity = 'medium', isSelected, onClick, fullOrHalf = 'half' }) => {
  const muscleColor = isSelected
    ? '#f43f5e'
    : isHighlighted
    ? severity === 'high'
      ? '#ef4444'
      : '#f97316'
    : '#a8473c'; // Fibrous striated red muscle
  const tendonColor = '#dfd3cb'; // White glistening tendon inscriptions

  // Six-pack rectus abdominis segments
  const abNodes = [
    { y: 0.18, scaleY: 0.09 },
    { y: 0.06, scaleY: 0.09 },
    { y: -0.06, scaleY: 0.09 },
  ];

  return (
    <group onClick={onClick}>
      {/* Right Side Musculoskeletal Wall (Screen Left - Anatomical Right) */}
      <group position={[-0.14, 0, 0]}>
        {/* Pectoralis Major Muscle (Upper Chest Slab) */}
        <mesh position={[-0.12, 0.58, 0.28]} rotation={[0.08, 0.22, -0.12]} castShadow>
          <boxGeometry args={[0.26, 0.28, 0.07]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} />
        </mesh>

        {/* Anterior Deltoid & Shoulder */}
        <mesh position={[-0.38, 0.68, 0.18]} rotation={[0, 0, 0.4]} castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} />
        </mesh>

        {/* Rectus Abdominis Muscle (Divided by Tendinous Inscriptions) */}
        {abNodes.map((ab, i) => (
          <group key={i} position={[-0.07, ab.y, 0.26]}>
            {/* Muscle Belly */}
            <mesh castShadow>
              <boxGeometry args={[0.11, ab.scaleY, 0.05]} />
              <meshStandardMaterial color={muscleColor} roughness={0.48} />
            </mesh>
            {/* White Tendon Inscription Divider Line */}
            <mesh position={[0, -ab.scaleY * 0.52, 0.01]}>
              <boxGeometry args={[0.115, 0.012, 0.045]} />
              <meshStandardMaterial color={tendonColor} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Linea Alba (Vertical Central Tendon Line) */}
        <mesh position={[-0.01, 0.08, 0.27]}>
          <boxGeometry args={[0.014, 0.46, 0.045]} />
          <meshStandardMaterial color={tendonColor} roughness={0.3} />
        </mesh>

        {/* External Oblique Muscle (Flank contour) */}
        <mesh position={[-0.24, 0.05, 0.16]} rotation={[0.1, 0.3, -0.18]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.42, 14]} />
          <meshStandardMaterial color={muscleColor} roughness={0.52} />
        </mesh>

        {/* Serratus Anterior (Fingers interdigitating with ribs) */}
        <mesh position={[-0.26, 0.36, 0.18]} rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.08, 0.18, 0.05]} />
          <meshStandardMaterial color={muscleColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Full Mode: Mirror on left side */}
      {fullOrHalf === 'full' && (
        <group position={[0.14, 0, 0]}>
          <mesh position={[0.12, 0.58, 0.28]} rotation={[0.08, -0.22, 0.12]} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.07]} />
            <meshStandardMaterial color={muscleColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.38, 0.68, 0.18]} rotation={[0, 0, -0.4]} castShadow>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={muscleColor} roughness={0.5} />
          </mesh>
          {abNodes.map((ab, i) => (
            <group key={i} position={[0.07, ab.y, 0.26]}>
              <mesh castShadow>
                <boxGeometry args={[0.11, ab.scaleY, 0.05]} />
                <meshStandardMaterial color={muscleColor} roughness={0.48} />
              </mesh>
              <mesh position={[0, -ab.scaleY * 0.52, 0.01]}>
                <boxGeometry args={[0.115, 0.012, 0.045]} />
                <meshStandardMaterial color={tendonColor} roughness={0.3} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.24, 0.05, 0.16]} rotation={[0.1, -0.3, 0.18]} castShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.42, 14]} />
            <meshStandardMaterial color={muscleColor} roughness={0.52} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 12. Pelvis & Femur (Reference Image 1)
const PelvisAndFemur: React.FC<{
  boneColor?: string;
  onClick: () => void;
}> = ({ boneColor = '#ded6c6', onClick }) => {
  return (
    <group position={[0, -0.72, 0]} onClick={onClick}>
      {/* Iliac Crests (Winged Pelvis) */}
      <mesh position={[-0.22, 0, 0.02]} rotation={[0.1, 0.3, -0.3]} castShadow>
        <torusGeometry args={[0.16, 0.038, 10, 20, Math.PI * 0.7]} />
        <meshStandardMaterial color={boneColor} roughness={0.45} />
      </mesh>
      <mesh position={[0.22, 0, 0.02]} rotation={[0.1, -0.3, 0.3]} castShadow>
        <torusGeometry args={[0.16, 0.038, 10, 20, Math.PI * 0.7]} />
        <meshStandardMaterial color={boneColor} roughness={0.45} />
      </mesh>

      {/* Pubic Symphysis */}
      <mesh position={[0, -0.16, 0.12]}>
        <boxGeometry args={[0.14, 0.08, 0.06]} />
        <meshStandardMaterial color={boneColor} roughness={0.45} />
      </mesh>

      {/* Proximal Femur (Head, Neck, Shaft - as labeled in Ref 1) */}
      <group position={[-0.28, -0.22, 0]}>
        {/* Femoral Head ball */}
        <mesh position={[0.06, 0.04, 0]}>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial color={boneColor} roughness={0.42} />
        </mesh>
        {/* Femoral Shaft */}
        <mesh position={[-0.02, -0.42, 0]} rotation={[0, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.042, 0.038, 0.82, 14]} />
          <meshStandardMaterial color={boneColor} roughness={0.42} />
        </mesh>
      </group>

      <group position={[0.28, -0.22, 0]}>
        <mesh position={[-0.06, 0.04, 0]}>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial color={boneColor} roughness={0.42} />
        </mesh>
        <mesh position={[0.02, -0.42, 0]} rotation={[0, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.042, 0.038, 0.82, 14]} />
          <meshStandardMaterial color={boneColor} roughness={0.42} />
        </mesh>
      </group>
    </group>
  );
};

// =============================================================================
// MAIN REALISTIC ANATOMY MODEL COMPONENT
// =============================================================================
export const RealAnatomyModel: React.FC<RealAnatomyModelProps> = ({
  highlights,
  selectedStructure,
  layer,
  showCallouts,
  onSelectStructure,
  isCyberMode = false,
}) => {
  // Define realistic leader line pin coordinates matching Reference Images 1, 3, 4
  const callouts = useMemo(() => {
    return [
      {
        id: 'brain',
        label: 'Frontal Lobe',
        sourcePos: [0.12, 1.62, 0.16] as [number, number, number],
        targetPos: [0.85, 1.82, 0.3] as [number, number, number],
        system: 'nervous',
      },
      {
        id: 'heart',
        label: 'Left Ventricle',
        sourcePos: [-0.08, 0.36, 0.22] as [number, number, number],
        targetPos: [0.95, 0.42, 0.25] as [number, number, number],
        system: 'cardiovascular',
      },
      {
        id: 'aorta',
        label: 'Aorta',
        sourcePos: [-0.02, 0.62, 0.14] as [number, number, number],
        targetPos: [0.95, 0.68, 0.2] as [number, number, number],
        system: 'cardiovascular',
      },
      {
        id: 'lungs',
        label: 'Right Lung',
        sourcePos: [-0.28, 0.52, 0.18] as [number, number, number],
        targetPos: [-0.98, 0.72, 0.25] as [number, number, number],
        system: 'respiratory',
      },
      {
        id: 'ribcage',
        label: 'Rib V',
        sourcePos: [0.18, 0.58, 0.28] as [number, number, number],
        targetPos: [0.95, 0.92, 0.3] as [number, number, number],
        system: 'skeletal',
      },
      {
        id: 'diaphragm',
        label: 'Diaphragm',
        sourcePos: [0.08, 0.18, 0.22] as [number, number, number],
        targetPos: [0.95, 0.18, 0.25] as [number, number, number],
        system: 'respiratory',
      },
      {
        id: 'liver',
        label: 'Liver',
        sourcePos: [-0.14, 0.08, 0.22] as [number, number, number],
        targetPos: [-0.95, 0.08, 0.25] as [number, number, number],
        system: 'digestive',
      },
      {
        id: 'pancreas',
        label: 'Pancreas',
        sourcePos: [0.02, -0.05, 0.18] as [number, number, number],
        targetPos: [0.95, -0.06, 0.22] as [number, number, number],
        system: 'endocrine',
      },
      {
        id: 'kidneys',
        label: 'Kidneys',
        sourcePos: [0.18, -0.08, -0.06] as [number, number, number],
        targetPos: [-0.95, -0.22, 0.15] as [number, number, number],
        system: 'urinary',
      },
      {
        id: 'intestines',
        label: 'Small Intestine',
        sourcePos: [0.02, -0.38, 0.22] as [number, number, number],
        targetPos: [-0.95, -0.48, 0.25] as [number, number, number],
        system: 'digestive',
      },
      {
        id: 'musculoskeletal',
        label: 'Rectus Abdominis',
        sourcePos: [-0.12, 0.05, 0.28] as [number, number, number],
        targetPos: [0.95, -0.34, 0.3] as [number, number, number],
        system: 'muscular',
      },
      {
        id: 'musculoskeletal',
        label: 'Pectoralis Major',
        sourcePos: [-0.22, 0.62, 0.28] as [number, number, number],
        targetPos: [0.95, 1.15, 0.3] as [number, number, number],
        system: 'muscular',
      },
      {
        id: 'spine',
        label: 'Vertebral Body L1',
        sourcePos: [0, -0.08, -0.08] as [number, number, number],
        targetPos: [0.95, -0.68, 0.1] as [number, number, number],
        system: 'skeletal',
      },
      {
        id: 'pelvis',
        label: 'Femur',
        sourcePos: [-0.28, -0.78, 0.06] as [number, number, number],
        targetPos: [-0.95, -0.88, 0.2] as [number, number, number],
        system: 'skeletal',
      },
    ];
  }, []);

  // Layer visibility booleans
  const showSkeleton = layer === 'skeletal' || layer === 'cutaway' || layer === 'cardiovascular';
  const showViscera = layer === 'viscera' || layer === 'cutaway' || layer === 'cardiovascular';
  const showMuscles = layer === 'muscular' || layer === 'cutaway';
  const isFullMuscular = layer === 'muscular';
  const isFullSkeleton = layer === 'skeletal';

  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Realistic Head & Brain */}
      <AnatomicalHeadAndBrain
        isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'brain'))}
        severity={getAnatomicalHighlight(highlights, 'brain')?.severity}
        isSelected={selectedStructure === 'brain'}
        onClick={() => onSelectStructure('brain', [0, 1.48, 0], 'Brain / Frontal Lobe')}
      />

      {/* 2. Articulated Spine Column (T1-L5, Cervical, Sacrum) */}
      {showSkeleton && (
        <ArticulatedSpine
          isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'spine'))}
          severity={getAnatomicalHighlight(highlights, 'spine')?.severity}
          isSelected={selectedStructure === 'spine'}
          onClick={() => onSelectStructure('spine', [0, 0.1, -0.05], 'Articulated Spine & Vertebrae')}
        />
      )}

      {/* 3. Ribcage, Costal Cartilage & Sternum */}
      {showSkeleton && (
        <RibcageAndSternum
          isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'ribcage'))}
          severity={getAnatomicalHighlight(highlights, 'ribcage')?.severity}
          isSelected={selectedStructure === 'ribcage'}
          showFullOrHalf={isFullSkeleton ? 'full' : 'half'}
          onClick={() => onSelectStructure('ribcage', [0, 0.45, 0.28], 'Ribcage & Costal Cartilage')}
        />
      )}

      {/* 4. Internal Viscera (Organs) */}
      {showViscera && (
        <>
          {/* Heart & Aorta */}
          <RealisticHeart
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'heart'))}
            severity={getAnatomicalHighlight(highlights, 'heart')?.severity}
            isSelected={selectedStructure === 'heart'}
            onClick={() => onSelectStructure('heart', [-0.04, 0.44, 0.14], 'Heart & Left Ventricle')}
          />

          {/* Lungs */}
          <RealisticLungs
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'lungs'))}
            severity={getAnatomicalHighlight(highlights, 'lungs')?.severity}
            isSelected={selectedStructure === 'lungs'}
            onClick={() => onSelectStructure('lungs', [-0.02, 0.44, 0.04], 'Pulmonary Airways & Lungs')}
          />

          {/* Diaphragm */}
          <DiaphragmDome
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'diaphragm'))}
            isSelected={selectedStructure === 'diaphragm'}
            onClick={() => onSelectStructure('diaphragm', [0, 0.16, 0.04], 'Thoracoabdominal Diaphragm')}
          />

          {/* Liver & Gallbladder */}
          <RealisticLiverAndGallbladder
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'liver'))}
            severity={getAnatomicalHighlight(highlights, 'liver')?.severity}
            isSelected={selectedStructure === 'liver'}
            onClick={() => onSelectStructure('liver', [-0.06, 0.06, 0.14], 'Liver & Hepatic Parenchyma')}
          />

          {/* Stomach & Pancreas */}
          <RealisticStomachAndPancreas
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'pancreas') || getAnatomicalHighlight(highlights, 'stomach'))}
            severity={getAnatomicalHighlight(highlights, 'pancreas')?.severity || 'medium'}
            isSelected={selectedStructure === 'pancreas' || selectedStructure === 'stomach'}
            onClick={() => onSelectStructure('pancreas', [0.01, -0.06, 0.06], 'Pancreas & Gastric Pouch')}
          />

          {/* Intestines */}
          <RealisticIntestines
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'intestines'))}
            severity={getAnatomicalHighlight(highlights, 'intestines')?.severity}
            isSelected={selectedStructure === 'intestines'}
            onClick={() => onSelectStructure('intestines', [0, -0.32, 0.12], 'Small & Large Intestines')}
          />

          {/* Kidneys & Adrenals */}
          <RetroperitonealKidneys
            isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'kidneys'))}
            severity={getAnatomicalHighlight(highlights, 'kidneys')?.severity}
            isSelected={selectedStructure === 'kidneys'}
            onClick={() => onSelectStructure('kidneys', [0, -0.06, -0.08], 'Retroperitoneal Kidneys & Adrenals')}
          />
        </>
      )}

      {/* 5. Musculoskeletal Wall (Cutaway or Full Muscle Shell) */}
      {showMuscles && (
        <MuscularCutawayShell
          isHighlighted={Boolean(getAnatomicalHighlight(highlights, 'musculoskeletal'))}
          severity={getAnatomicalHighlight(highlights, 'musculoskeletal')?.severity}
          isSelected={selectedStructure === 'musculoskeletal'}
          fullOrHalf={isFullMuscular ? 'full' : 'half'}
          onClick={() => onSelectStructure('musculoskeletal', [-0.18, 0.32, 0.28], 'Pectoralis & Rectus Abdominis')}
        />
      )}

      {/* 6. Pelvic Girdle & Femur Bones */}
      {showSkeleton && (
        <PelvisAndFemur
          onClick={() => onSelectStructure('pelvis', [0, -0.72, 0], 'Pelvic Girdle & Femur')}
        />
      )}

      {/* 7. Interactive Callout Pins & 3D Leader Lines (Reference Images 1, 3, 4) */}
      {showCallouts !== 'none' && (
        <group>
          {callouts.map((c, idx) => {
            const h = getAnatomicalHighlight(highlights, c.id);
            const isFlag = Boolean(h);
            const isSel = selectedStructure === c.id;

            // Visibility filter
            if (showCallouts === 'flagged' && !isFlag && !isSel) {
              return null;
            }

            return (
              <CalloutPin
                key={`${c.id}-${idx}`}
                label={c.label}
                sourcePos={c.sourcePos}
                targetPos={c.targetPos}
                isFlagged={isFlag}
                severity={h?.severity}
                flagReason={h?.reason}
                isSelected={isSel}
                visible={true}
                onClick={() => onSelectStructure(c.id, c.sourcePos, c.label)}
              />
            );
          })}
        </group>
      )}
    </group>
  );
};
