import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Cpu,
  AlertTriangle,
  RefreshCw,
  Eye,
  Crosshair,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Heart,
  ChevronRight,
  Maximize2,
  Columns,
  Square,
  CheckCircle2,
  Info,
  RotateCw,
} from 'lucide-react';
import type { AnatomyHighlight, AnatomyResponse } from '../types';
import { api } from '../api';
import { RealAnatomyModel, DissectionLayer } from './anatomy/RealAnatomyModel';

interface AnatomyViewer3DProps {
  patientId: number;
}

export type CameraPreset =
  | 'anterior'
  | 'posterior'
  | 'lateral'
  | 'cardio'
  | 'cranial'
  | 'renal';

// Smooth Camera Controller with interpolation
const CameraController: React.FC<{
  preset: CameraPreset;
  selectedStructurePos?: [number, number, number] | null;
  forcedAngle?: 'anterior' | 'lateral';
}> = ({ preset, selectedStructurePos, forcedAngle }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.3, 3.8));
  const lookTarget = useRef(new THREE.Vector3(0, 0.1, 0));

  useEffect(() => {
    if (selectedStructurePos) {
      targetPos.current.set(
        selectedStructurePos[0] * 0.7,
        selectedStructurePos[1] + 0.1,
        1.7
      );
      lookTarget.current.set(
        selectedStructurePos[0],
        selectedStructurePos[1],
        selectedStructurePos[2]
      );
      return;
    }

    if (forcedAngle === 'lateral') {
      // Lateral sagittal profile perspective (Reference Image 4 right)
      targetPos.current.set(3.4, 0.25, 0);
      lookTarget.current.set(0, 0.2, 0);
      return;
    }

    switch (preset) {
      case 'posterior':
        // Posterior view looking at articulated spine & kidneys (Reference Image 2)
        targetPos.current.set(0, 0.3, -3.8);
        lookTarget.current.set(0, 0.1, 0);
        break;
      case 'lateral':
        // Profile view (Reference Image 4 right)
        targetPos.current.set(3.5, 0.25, 0);
        lookTarget.current.set(0, 0.15, 0);
        break;
      case 'cardio':
        // Thoracic close-up (Reference Image 3)
        targetPos.current.set(-0.15, 0.46, 1.6);
        lookTarget.current.set(-0.06, 0.42, 0.15);
        break;
      case 'cranial':
        // Cranial / Frontal Lobe close-up (Reference Image 1)
        targetPos.current.set(0, 1.48, 1.6);
        lookTarget.current.set(0, 1.45, 0);
        break;
      case 'renal':
        // Hepato-renal axis
        targetPos.current.set(0, -0.05, 1.7);
        lookTarget.current.set(0, -0.05, 0);
        break;
      case 'anterior':
      default:
        // Anterior cutaway frontal view (Reference Image 1, 3, 4 left)
        targetPos.current.set(0, 0.3, 3.8);
        lookTarget.current.set(0, 0.1, 0);
        break;
    }
  }, [preset, selectedStructurePos, forcedAngle]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.05);
  });

  return null;
};

// Medical Studio Floor Grid & Lighting Pedestal
const MedicalStudioPedestal: React.FC = () => {
  return (
    <group position={[0, -2.1, 0]}>
      {/* Dark reflective floor disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial
          color="#0d1424"
          roughness={0.7}
          metalness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Concentric subtle measurement rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.4, 1.415, 64]} />
        <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.9, 1.915, 64]} />
        <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const AnatomyViewer3D: React.FC<AnatomyViewer3DProps> = ({ patientId }) => {
  const [highlights, setHighlights] = useState<AnatomyHighlight[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Anatomical Layer: cutaway (default) | viscera | skeletal | muscular | cardiovascular
  const [layer, setLayer] = useState<DissectionLayer>('cutaway');

  // Callout display: 'all' | 'flagged' | 'none'
  const [calloutsMode, setCalloutsMode] = useState<'all' | 'flagged' | 'none'>('all');

  // Perspective preset
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('anterior');

  // Dual View Mode (Reference Image 4: side-by-side Anterior + Lateral)
  const [isDualView, setIsDualView] = useState(false);

  // Hologram X-Ray shader effect toggle
  const [isCyberMode, setIsCyberMode] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: AnatomyResponse = await api.getAnatomyIssues(patientId);
      setHighlights(data.highlights || []);
    } catch (err: any) {
      console.error('Failed to fetch anatomy issues:', err);
      setError(err.message || 'Failed to map clinical issues to 3D anatomy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchIssues();
      setSelectedStructure(null);
      setSelectedPos(null);
      setSelectedLabel(null);
    }
  }, [patientId]);

  const handleSelectStructure = (
    sId: string,
    pos?: [number, number, number],
    label?: string
  ) => {
    setSelectedStructure(sId);
    if (pos) setSelectedPos(pos);
    if (label) setSelectedLabel(label);
  };

  const selectedHighlight = highlights.find(
    (h) =>
      h.structureId.toLowerCase() === selectedStructure?.toLowerCase() ||
      h.structureId.toLowerCase().includes(selectedStructure?.toLowerCase() || '') ||
      (selectedStructure && h.structureId.toLowerCase().includes(selectedStructure.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 3D Anatomy Visualizer Studio Container */}
      <div className="bg-[#090d16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Top Control Bar (HUD) */}
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs z-20 relative">
          {/* Brand & Mode Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm">3D Anatomy Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  Medical Photoreal Dissection
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Realistic anatomical organ structures with deterministic lab & clinical condition mapping.
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Dual Perspective Toggle (Reference Image 4) */}
            <button
              onClick={() => setIsDualView(!isDualView)}
              className={`px-3 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 ${
                isDualView
                  ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm shadow-teal-500/30'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle dual perspective mode (Reference Image 4)"
            >
              {isDualView ? <Columns className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{isDualView ? 'Dual View Active' : 'Dual View'}</span>
            </button>

            {/* Callouts Mode Toggle */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-0.5 flex items-center text-[11px]">
              <button
                onClick={() => setCalloutsMode('all')}
                className={`px-2 py-1 rounded-lg transition ${
                  calloutsMode === 'all'
                    ? 'bg-teal-500/30 text-teal-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show all anatomical callouts"
              >
                All Pins
              </button>
              <button
                onClick={() => setCalloutsMode('flagged')}
                className={`px-2 py-1 rounded-lg transition ${
                  calloutsMode === 'flagged'
                    ? 'bg-rose-500/30 text-rose-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show only clinically flagged organs"
              >
                Flagged
              </button>
              <button
                onClick={() => setCalloutsMode('none')}
                className={`px-2 py-1 rounded-lg transition ${
                  calloutsMode === 'none'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Hide all callout labels"
              >
                Clean
              </button>
            </div>

            <button
              onClick={fetchIssues}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh clinical mappings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Floating Sub-Controls: Dissection Layer & Camera Angles */}
        <div className="absolute top-16 left-4 z-10 flex flex-col gap-2 max-w-xs">
          {/* Dissection Layer Selector */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-2.5 shadow-xl text-slate-300">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 px-1 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Anatomical Dissection:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                onClick={() => setLayer('cutaway')}
                className={`px-2 py-1.5 rounded-lg text-left transition font-medium ${
                  layer === 'cutaway'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                Half Cutaway
              </button>
              <button
                onClick={() => setLayer('viscera')}
                className={`px-2 py-1.5 rounded-lg text-left transition font-medium ${
                  layer === 'viscera'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                Internal Viscera
              </button>
              <button
                onClick={() => setLayer('skeletal')}
                className={`px-2 py-1.5 rounded-lg text-left transition font-medium ${
                  layer === 'skeletal'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                Skeletal / Spine
              </button>
              <button
                onClick={() => setLayer('muscular')}
                className={`px-2 py-1.5 rounded-lg text-left transition font-medium ${
                  layer === 'muscular'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                Musculoskeletal
              </button>
            </div>
          </div>

          {/* Perspective Preset Toolbar */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-300 shadow-xl">
            <span className="text-[10px] text-slate-400 px-1.5 uppercase font-bold">Angle:</span>
            <button
              onClick={() => {
                setCameraPreset('anterior');
                setSelectedPos(null);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                cameraPreset === 'anterior' && !selectedPos
                  ? 'bg-teal-500/30 text-teal-300 font-semibold'
                  : 'hover:bg-slate-800'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => {
                setCameraPreset('posterior');
                setSelectedPos(null);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                cameraPreset === 'posterior'
                  ? 'bg-teal-500/30 text-teal-300 font-semibold'
                  : 'hover:bg-slate-800'
              }`}
            >
              Posterior (Back)
            </button>
            <button
              onClick={() => {
                setCameraPreset('lateral');
                setSelectedPos(null);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                cameraPreset === 'lateral'
                  ? 'bg-teal-500/30 text-teal-300 font-semibold'
                  : 'hover:bg-slate-800'
              }`}
            >
              Lateral Profile
            </button>
            <button
              onClick={() => {
                setCameraPreset('cardio');
                setSelectedPos(null);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                cameraPreset === 'cardio'
                  ? 'bg-teal-500/30 text-teal-300 font-semibold'
                  : 'hover:bg-slate-800'
              }`}
            >
              Heart
            </button>
            <button
              onClick={() => {
                setCameraPreset('cranial');
                setSelectedPos(null);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                cameraPreset === 'cranial'
                  ? 'bg-teal-500/30 text-teal-300 font-semibold'
                  : 'hover:bg-slate-800'
              }`}
            >
              Neuro
            </button>
          </div>
        </div>

        {/* Active Structure Inspection HUD (Bottom Floating Card) */}
        {selectedHighlight ? (
          <div className="absolute bottom-14 left-4 right-4 sm:right-auto sm:w-[420px] z-10 bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-2xl p-4 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <h4 className="font-bold text-sm text-white">{selectedHighlight.label}</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedHighlight.system}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    selectedHighlight.severity === 'high'
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                      : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  }`}
                >
                  {selectedHighlight.severity} flag
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              {selectedHighlight.reason}
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Provenance: <strong className="text-teal-300">{selectedHighlight.source}</strong>
              </span>
              <button
                onClick={() => {
                  setSelectedStructure(null);
                  setSelectedPos(null);
                  setSelectedLabel(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : selectedLabel ? (
          <div className="absolute bottom-14 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-3 text-white shadow-xl text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span className="font-semibold">{selectedLabel}</span>
              <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                Normal anatomical bounds
              </span>
              <button
                onClick={() => {
                  setSelectedStructure(null);
                  setSelectedLabel(null);
                }}
                className="ml-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}

        {/* 3D WebGL Canvas Render Area */}
        <div className={`w-full ${isDualView ? 'grid grid-cols-1 md:grid-cols-2' : ''} h-[580px] bg-gradient-to-b from-[#090d16] via-[#101726] to-[#070b12]`}>
          {/* Main 3D Canvas (Anterior / Interactive View) */}
          <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
            {isDualView && (
              <div className="absolute top-3 right-3 z-10 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-teal-400 font-semibold border border-slate-800">
                Anterior Cutaway View (Ref 1, 3, 4)
              </div>
            )}
            <Canvas
              camera={{ position: [0, 0.3, 3.8], fov: 45 }}
              shadows
            >
              {/* Medical Studio 3-Point Lighting */}
              <ambientLight intensity={0.75} />
              {/* Key Light (Warm Key) */}
              <directionalLight position={[4, 7, 5]} intensity={1.4} castShadow shadow-bias={-0.0005} />
              {/* Fill Light (Soft Cool) */}
              <directionalLight position={[-4, 2, 4]} intensity={0.65} color="#e0f2fe" />
              {/* Back Rim Light (Separates silhouette from dark studio background) */}
              <directionalLight position={[0, 4, -5]} intensity={1.1} color="#38bdf8" />
              <pointLight position={[0, 0.4, 2]} intensity={0.5} color="#06b6d4" />

              <CameraController
                preset={cameraPreset}
                selectedStructurePos={selectedPos}
              />

              <Suspense fallback={null}>
                <RealAnatomyModel
                  highlights={highlights}
                  selectedStructure={selectedStructure}
                  layer={layer}
                  showCallouts={calloutsMode}
                  onSelectStructure={handleSelectStructure}
                  isCyberMode={isCyberMode}
                />
                <MedicalStudioPedestal />
              </Suspense>

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                minDistance={1.4}
                maxDistance={6.5}
                maxPolarAngle={Math.PI / 1.7}
                minPolarAngle={Math.PI / 4}
              />
            </Canvas>
          </div>

          {/* Secondary 3D Canvas in Dual View Mode (Lateral Sagittal Profile - Reference 4) */}
          {isDualView && (
            <div className="relative w-full h-full border-t md:border-t-0 md:border-l border-slate-800 cursor-grab active:cursor-grabbing">
              <div className="absolute top-3 right-3 z-10 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-cyan-400 font-semibold border border-slate-800">
                Lateral Sagittal Cross-Section (Ref 4)
              </div>
              <Canvas
                camera={{ position: [3.4, 0.25, 0], fov: 45 }}
                shadows
              >
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 6, 2]} intensity={1.3} castShadow />
                <directionalLight position={[-3, 1, -3]} intensity={0.7} color="#38bdf8" />

                <CameraController
                  preset={cameraPreset}
                  selectedStructurePos={selectedPos}
                  forcedAngle="lateral"
                />

                <Suspense fallback={null}>
                  <RealAnatomyModel
                    highlights={highlights}
                    selectedStructure={selectedStructure}
                    layer={layer}
                    showCallouts={calloutsMode}
                    onSelectStructure={handleSelectStructure}
                    isCyberMode={isCyberMode}
                  />
                  <MedicalStudioPedestal />
                </Suspense>

                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minDistance={1.4}
                  maxDistance={6.5}
                />
              </Canvas>
            </div>
          )}
        </div>

        {/* Filter Navigation & Interaction Footer */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Interaction:</span>
            <span className="text-[11px] text-slate-300">
              Drag to Orbit • Scroll to Zoom • Click any organ or pin to focus
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400">
              Anatomical model: BodyParts3D / Z-Anatomy, CC BY-SA 4.0
            </span>
            <button
              onClick={() => {
                setCameraPreset('anterior');
                setSelectedPos(null);
                setSelectedStructure(null);
              }}
              className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Identified Clinical Issues List */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Clinical Organ Mappings & Provenance Audit
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic correlation between patient intake conditions, reported symptoms, out-of-range lab markers, and physical 3D anatomical structures.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 self-start sm:self-auto shadow-sm">
            {highlights.length} Organ Flags Identified
          </span>
        </div>

        {highlights.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/40 rounded-2xl text-slate-400 text-xs border border-slate-800">
            No abnormal lab markers or specific organ flags are currently identified for this patient.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((h, idx) => {
              const isSelected = selectedStructure?.toLowerCase() === h.structureId.toLowerCase();

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectStructure(h.structureId, undefined, h.label)}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-950/70 border-rose-500/80 ring-2 ring-rose-500/30 shadow-lg glow-rose'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                        <h4 className="font-bold text-white text-sm">{h.label}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {h.system}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            h.severity === 'high'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                          }`}
                        >
                          {h.severity}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {h.reason}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Provenance: <strong className="text-cyan-400">{h.source}</strong>
                    </span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1 hover:underline">
                      Focus in 3D <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
