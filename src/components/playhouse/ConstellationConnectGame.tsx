import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Star, Moon, RefreshCw, Wand2, Trophy, 
  HelpCircle, Eye, CheckCircle2, Flame, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface StarNode {
  id: number;
  x: number; // percentage 10-90
  y: number; // percentage 15-85
  label: string;
  color: string;
}

export interface ConstellationLevel {
  level: number;
  constellationName: string;
  storySnippet: string;
  secretKeyword: string;
  partnerClueA: string;
  partnerClueB: string;
  nodes: StarNode[];
  targetEdges: [number, number][]; // pairs of connected node IDs
}

const FALLBACK_CONSTELLATIONS: ConstellationLevel[] = [
  {
    level: 1,
    constellationName: "The Twin Starlight",
    storySnippet: "Two solitary stars that crossed cosmic lightyears to illuminate each other's sky.",
    secretKeyword: "ETERNAL",
    partnerClueA: "Connect Alpha Starlight (1) directly to Beta (2) and Delta (4).",
    partnerClueB: "Connect Gamma Beacon (3) to Beta (2) and to the Cosmic Anchor (5).",
    nodes: [
      { id: 1, x: 25, y: 25, label: "Alpha", color: "#fb7185" },
      { id: 2, x: 50, y: 40, label: "Beta", color: "#f43f5e" },
      { id: 3, x: 75, y: 25, label: "Gamma", color: "#c084fc" },
      { id: 4, x: 35, y: 75, label: "Delta", color: "#e879f9" },
      { id: 5, x: 65, y: 75, label: "Epsilon", color: "#38bdf8" }
    ],
    targetEdges: [
      [1, 2], [2, 3], [1, 4], [3, 5], [4, 5]
    ]
  },
  {
    level: 2,
    constellationName: "The Heart Compass",
    storySnippet: "No matter how far the world spins, this constellation always points true North to you.",
    secretKeyword: "DESTINY",
    partnerClueA: "Anchor the North Heart (1) to East Horizon (3) and West Haven (2).",
    partnerClueB: "Join the South Radiance (4) to the Center Core (5) and West Haven (2).",
    nodes: [
      { id: 1, x: 50, y: 20, label: "North Heart", color: "#f43f5e" },
      { id: 2, x: 20, y: 50, label: "West Haven", color: "#a855f7" },
      { id: 3, x: 80, y: 50, label: "East Horizon", color: "#ec4899" },
      { id: 4, x: 50, y: 80, label: "South Radiance", color: "#06b6d4" },
      { id: 5, x: 50, y: 50, label: "Center Core", color: "#eab308" }
    ],
    targetEdges: [
      [1, 2], [1, 3], [2, 4], [3, 4], [2, 5], [3, 5]
    ]
  }
];

interface ConstellationGameState {
  level: number;
  currentLevelData: ConstellationLevel;
  connectedEdges: [number, number][]; // pairs of connected node IDs [from, to] (sorted)
  solved: boolean;
  score: number;
  completedAt?: number;
}

export function ConstellationConnectGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<ConstellationGameState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isGeneratingLevel, setIsGeneratingLevel] = useState(false);
  const [showClueModal, setShowClueModal] = useState(false);

  const docRef = space?.id ? doc(db, 'coupleSpaces', space.id, 'playhouseGames', 'constellation-puzzle') : null;

  // Real-time Firestore snapshot
  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setGameState(JSON.parse(data.data));
          } catch (e) {
            console.error('Error parsing constellation game state:', e);
          }
        }
      } else {
        const initLevel = FALLBACK_CONSTELLATIONS[0];
        const initState: ConstellationGameState = {
          level: 1,
          currentLevelData: initLevel,
          connectedEdges: [],
          solved: false,
          score: 100
        };
        setDoc(docRef, {
          id: 'constellation-puzzle',
          coupleSpaceId: space?.id || '',
          gameType: 'constellation-puzzle',
          status: 'playing',
          round: 1,
          data: JSON.stringify(initState),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/constellation-puzzle`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/constellation-puzzle`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const levelData = gameState?.currentLevelData || FALLBACK_CONSTELLATIONS[0];

  // Helper: check if two edges are identical regardless of order
  const isSameEdge = (e1: [number, number], e2: [number, number]) => {
    return (e1[0] === e2[0] && e1[1] === e2[1]) || (e1[0] === e2[1] && e1[1] === e2[0]);
  };

  const edgeExists = (edges: [number, number][], a: number, b: number) => {
    return edges.some(e => isSameEdge(e, [a, b]));
  };

  // Node selection & line connection
  const handleNodeClick = (nodeId: number) => {
    if (!docRef || !gameState || gameState.solved) return;
    sound.playPop();

    if (selectedNodeId === null) {
      setSelectedNodeId(nodeId);
      return;
    }

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      return;
    }

    // Toggle edge between selectedNodeId and nodeId
    const fromId = Math.min(selectedNodeId, nodeId);
    const toId = Math.max(selectedNodeId, nodeId);

    let nextEdges: [number, number][];
    if (edgeExists(gameState.connectedEdges, fromId, toId)) {
      // Remove edge
      nextEdges = gameState.connectedEdges.filter(e => !isSameEdge(e, [fromId, toId]));
      sound.playPop();
    } else {
      // Add edge
      nextEdges = [...gameState.connectedEdges, [fromId, toId]];
      sound.playChime();
    }

    setSelectedNodeId(null);

    // Check if all target edges are connected and no missing target edges
    const isTargetMet = levelData.targetEdges.every(target => 
      nextEdges.some(e => isSameEdge(e, target))
    );

    const isExtraAvoided = nextEdges.every(e => 
      levelData.targetEdges.some(target => isSameEdge(e, target))
    );

    const isSolved = isTargetMet && isExtraAvoided;

    if (isSolved) {
      sound.playCelebration();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24']
      });
    }

    const updatedState: ConstellationGameState = {
      ...gameState,
      connectedEdges: nextEdges,
      solved: isSolved,
      score: isSolved ? gameState.score + 50 : gameState.score,
      completedAt: isSolved ? Date.now() : gameState.completedAt
    };

    updateDoc(docRef, {
      data: JSON.stringify(updatedState),
      status: isSolved ? 'cleared' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  // Reset lines
  const handleResetEdges = () => {
    if (!docRef || !gameState) return;
    sound.playPop();
    setSelectedNodeId(null);
    const updatedState: ConstellationGameState = {
      ...gameState,
      connectedEdges: [],
      solved: false
    };
    updateDoc(docRef, {
      data: JSON.stringify(updatedState),
      status: 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  // Next level via AIRA endless generator
  const handleNextAiraLevel = async () => {
    if (!docRef || !gameState) return;
    sound.chime();
    setIsGeneratingLevel(true);

    const nextLevelNum = (gameState.level || 1) + 1;
    let nextLevelData: ConstellationLevel;

    try {
      const airaItem = await generateAiraGameContent<any>('constellation-puzzle', nextLevelNum);
      if (airaItem?.constellationName) {
        // Construct dynamic celestial layout
        const nodeCount = Math.min(Math.max(airaItem.nodesCount || 5, 4), 6);
        const dynamicNodes: StarNode[] = [];
        const colors = ['#f43f5e', '#a855f7', '#38bdf8', '#fbbf24', '#ec4899', '#34d399'];
        
        // Arrange stars in an organic celestial ring with slight offsets
        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2 + (Math.sin(i) * 0.4);
          const radiusX = 32 + (i % 2 === 0 ? 6 : -6);
          const radiusY = 30 + (i % 2 === 1 ? 6 : -6);
          const x = Math.round(50 + Math.cos(angle) * radiusX);
          const y = Math.round(50 + Math.sin(angle) * radiusY);
          dynamicNodes.push({
            id: i + 1,
            x: Math.max(15, Math.min(85, x)),
            y: Math.max(18, Math.min(82, y)),
            label: `Star ${i + 1}`,
            color: colors[i % colors.length]
          });
        }

        // Build target edges in loop plus cross-bridges
        const edges: [number, number][] = [];
        for (let i = 0; i < nodeCount; i++) {
          edges.push([i + 1, ((i + 1) % nodeCount) + 1]);
        }
        if (nodeCount >= 5) {
          edges.push([1, 4]);
        }

        nextLevelData = {
          level: nextLevelNum,
          constellationName: airaItem.constellationName,
          storySnippet: airaItem.storySnippet || "A new celestial chapter formed by two aligned hearts.",
          secretKeyword: airaItem.secretKeyword || "STARLIGHT",
          partnerClueA: airaItem.partnerClueA || "Connect the outer ring stars in clockwise sequence.",
          partnerClueB: airaItem.partnerClueB || "Bridge the diagonal astral line between Star 1 and Star 4.",
          nodes: dynamicNodes,
          targetEdges: edges
        };
      } else {
        nextLevelData = FALLBACK_CONSTELLATIONS[(nextLevelNum - 1) % FALLBACK_CONSTELLATIONS.length];
      }
    } catch (e) {
      console.warn('AIRA constellation generation fallback:', e);
      nextLevelData = FALLBACK_CONSTELLATIONS[(nextLevelNum - 1) % FALLBACK_CONSTELLATIONS.length];
    } finally {
      setIsGeneratingLevel(false);
    }

    const updatedState: ConstellationGameState = {
      level: nextLevelNum,
      currentLevelData: nextLevelData,
      connectedEdges: [],
      solved: false,
      score: gameState.score + 25
    };

    updateDoc(docRef, {
      data: JSON.stringify(updatedState),
      status: 'playing',
      round: nextLevelNum,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  // Determine partner role: Partner A or Partner B for asymmetric clue display
  const isPartnerA = userData?.id && space?.members?.[0] === userData.id;
  const myClue = isPartnerA ? levelData.partnerClueA : levelData.partnerClueB;
  const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
  const partnerRoleName = isPartnerA ? 'Astral Guide (Partner A)' : 'Celestial Navigator (Partner B)';

  return (
    <div className="space-y-4">
      {/* Top Status & Synergy Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 border border-indigo-900/60 shadow-lg relative overflow-hidden">
        {/* Ambient Cosmic Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-400/30">
              Lv {gameState?.level || 1}
            </span>
            <div>
              <h2 className="font-serif font-black text-sm text-white flex items-center gap-1.5">
                {levelData.constellationName}
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h2>
              <p className="text-[11px] text-indigo-200/80">Co-Op Star Linking Puzzle</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { sound.playPop(); setShowClueModal(true); }}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Clues</span>
            </button>

            <button
              onClick={handleResetEdges}
              disabled={gameState?.solved}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all disabled:opacity-40"
              title="Reset lines"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Asymmetric Clue Banner */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 border border-indigo-500/20 text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-300">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-rose-400" />
              <span>Your Role: {partnerRoleName}</span>
            </span>
            <span className="text-[10px] text-slate-400">Collaborate with {partnerName}!</span>
          </div>
          <p className="text-white/90 font-medium text-xs leading-relaxed">
            "{myClue}"
          </p>
        </div>
      </div>

      {/* Main Interactive Celestial Canvas */}
      <div className="bg-slate-950 rounded-3xl p-4 border border-indigo-950 shadow-xl relative aspect-square max-h-[380px] w-full mx-auto overflow-hidden select-none">
        {/* Background Twinkling Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
        
        {/* Render Connected SVG Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {/* Target faint guide lines if needed or current active connected lines */}
          {gameState?.connectedEdges.map((edge, idx) => {
            const nodeA = levelData.nodes.find(n => n.id === edge[0]);
            const nodeB = levelData.nodes.find(n => n.id === edge[1]);
            if (!nodeA || !nodeB) return null;

            return (
              <line
                key={`edge-${idx}`}
                x1={`${nodeA.x}%`}
                y1={`${nodeA.y}%`}
                x2={`${nodeB.x}%`}
                y2={`${nodeB.y}%`}
                stroke={gameState?.solved ? "#fbbf24" : "#ec4899"}
                strokeWidth={gameState?.solved ? "3" : "2"}
                strokeDasharray={gameState?.solved ? "none" : "4 2"}
                className={gameState?.solved ? "transition-all duration-700" : ""}
              />
            );
          })}

          {/* Line preview from currently selected node to mouse/touch */}
          {selectedNodeId && (() => {
            const startNode = levelData.nodes.find(n => n.id === selectedNodeId);
            if (!startNode) return null;
            return (
              <circle
                cx={`${startNode.x}%`}
                cy={`${startNode.y}%`}
                r="18"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="animate-spin"
              />
            );
          })()}
        </svg>

        {/* Render Star Nodes */}
        <div className="relative z-20 w-full h-full">
          {levelData.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnected = gameState?.connectedEdges.some(e => e[0] === node.id || e[1] === node.id);

            return (
              <motion.button
                key={node.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNodeClick(node.id)}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute w-10 h-10 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-4 ring-cyan-400 bg-cyan-500 text-white scale-110 shadow-lg shadow-cyan-500/50' 
                    : isConnected
                    ? 'ring-2 ring-rose-400/80 bg-slate-900 text-white shadow-md'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-slate-500'
                }`}
              >
                <Star className={`w-4 h-4 ${gameState?.solved ? 'text-amber-300 fill-amber-300 animate-pulse' : isSelected ? 'text-white' : 'text-rose-400'}`} />
                <span className="text-[9px] font-extrabold -mt-0.5 leading-none">{node.id}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Solved Overlay Card */}
        <AnimatePresence>
          {gameState?.solved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center text-white"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center mb-3 shadow-lg shadow-rose-500/40">
                <Sparkles className="w-7 h-7 text-white fill-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full mb-1">
                Constellation Awakened ✨
              </span>
              <h3 className="font-serif font-black text-xl text-white mb-1">
                {levelData.constellationName}
              </h3>
              <p className="text-xs text-rose-200/90 max-w-xs mb-4 leading-relaxed">
                "{levelData.storySnippet}"
              </p>

              <button
                onClick={handleNextAiraLevel}
                disabled={isGeneratingLevel}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
              >
                {isGeneratingLevel ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AIRA is Aligning Stars...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Next AIRA Constellation (Level {gameState.level + 1})</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer & Instruction Strip */}
      <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌌</span>
          <div>
            <p className="font-bold text-gray-900">
              {gameState?.connectedEdges.length || 0} / {levelData.targetEdges.length} Stars Connected
            </p>
            <p className="text-[11px] text-gray-500">Tap two stars to draw an energy beam.</p>
          </div>
        </div>

        <button
          onClick={handleNextAiraLevel}
          disabled={isGeneratingLevel}
          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          {isGeneratingLevel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          <span>AIRA New Map</span>
        </button>
      </div>

      {/* Clues Modal */}
      <AnimatePresence>
        {showClueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <h3 className="font-serif font-bold text-base text-gray-900">Celestial Map Clues</h3>
                </div>
                <button
                  onClick={() => setShowClueModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                  <span className="font-bold text-rose-700 block text-[11px]">Partner A Clue:</span>
                  <p className="text-gray-700">{levelData.partnerClueA}</p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
                  <span className="font-bold text-indigo-700 block text-[11px]">Partner B Clue:</span>
                  <p className="text-gray-700">{levelData.partnerClueB}</p>
                </div>

                <div className="text-[11px] text-gray-500 italic bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  Tip: Speak aloud or message each other in Chat to combine both clues and form the true celestial outline!
                </div>
              </div>

              <button
                onClick={() => setShowClueModal(false)}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-all"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
