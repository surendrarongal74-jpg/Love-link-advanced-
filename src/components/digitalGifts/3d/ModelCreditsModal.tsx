import React from 'react';
import { X, ExternalLink, Sparkles, Award } from 'lucide-react';

export interface ModelCreditItem {
  world: string;
  item: string;
  model: string;
  author: string;
  license: string;
  creditLine: string;
  link: string;
}

export const MODEL_CREDITS_DATA: ModelCreditItem[] = [
  // Ever Tide
  {
    world: 'Ever Tide',
    item: 'Palm trees',
    model: 'Palm Trees',
    author: 'yadrogames',
    license: 'CC Attribution 4.0',
    creditLine: '"Palm Trees" by yadrogames on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-55690379305145488e20afb05fc687e6',
  },
  {
    world: 'Ever Tide',
    item: 'Tropical beach base',
    model: 'Stylized Tropical Beach Diorama',
    author: 'visthetique',
    license: 'CC Attribution 4.0',
    creditLine: '"Stylized Tropical Beach Diorama" by visthetique on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-3c41f170b992430693b2a17d3deecf34',
  },
  {
    world: 'Ever Tide',
    item: 'String lights',
    model: 'Simple String Lights',
    author: 'TrixtheProtogen',
    license: 'CC Attribution 4.0',
    creditLine: '"Simple String Lights" by TrixtheProtogen on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-1c0ba51226534223ae20a4f46bf4317b',
  },
  {
    world: 'Ever Tide',
    item: 'Pier, barrels, crates',
    model: 'Stylized Pirate Island Pack',
    author: 'CGlads',
    license: 'CC Attribution 4.0',
    creditLine: '"Stylized Pirate Island Pack" by CGlads on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-77d8d91e3fb14ef289850bc59d8683d6',
  },
  {
    world: 'Ever Tide',
    item: 'Ever Tide sign',
    model: 'Stylized wood signs',
    author: 'Pasindu.Anjana',
    license: 'CC Attribution 4.0',
    creditLine: '"Stylized wood signs" by Pasindu.Anjana on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-d529ec8478304d45a5048e15cf9cc9db',
  },
  {
    world: 'Ever Tide',
    item: 'Lanterns',
    model: 'Old oil lamp',
    author: 'rudavin',
    license: 'CC Attribution 4.0',
    creditLine: '"Old oil lamp" by rudavin on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-aaa99a374e0c4a98868383c42ff6ae0d',
  },
  {
    world: 'Ever Tide',
    item: 'Rowboat',
    model: 'Old Boat',
    author: 'donnichols',
    license: 'CC Attribution 4.0',
    creditLine: '"Old Boat" by donnichols on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-a9ce4ca0cac14f448c72bb94ad193437',
  },
  {
    world: 'Ever Tide',
    item: 'Umbrella, beach props',
    model: 'Low Poly Beach Assets',
    author: 'Edwin3D',
    license: 'CC Attribution 4.0',
    creditLine: '"Low Poly Beach Assets" by Edwin3D on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-66c18ecd7a834d4a99dabc46b5ee6e4a',
  },
  {
    world: 'Ever Tide',
    item: 'More beach props',
    model: 'Summer Beach Pack',
    author: 'SkinOmegaProductions',
    license: 'CC Attribution 4.0',
    creditLine: '"Summer Beach Pack" by SkinOmegaProductions on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-833a752c06db4f98a1bc4658f4035f7a',
  },
  {
    world: 'Ever Tide',
    item: 'Banner plane',
    model: 'War Plane (toon)',
    author: 'animanyarty',
    license: 'CC Attribution 4.0',
    creditLine: '"War Plane (toon)" by animanyarty on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-b487f1128b984da8ae8cd9ce0a02d9ba',
  },
  {
    world: 'Ever Tide / Our Museum',
    item: 'Benches',
    model: 'Classic Park Bench (Low Poly)',
    author: 'berkgedik',
    license: 'CC Attribution 4.0',
    creditLine: '"Classic Park Bench (Low Poly)" by berkgedik on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-01a5b64427984632bb44242da3813bb1',
  },

  // Our Museum
  {
    world: 'Our Museum',
    item: 'Museum hall',
    model: "Richard's Art Gallery - Audio Tour",
    author: 'shinymagic',
    license: 'CC Attribution 4.0',
    creditLine: `"Richard's Art Gallery - Audio Tour" by shinymagic on Sketchfab, licensed CC BY 4.0`,
    link: 'https://sketchfab.com/3d-models/none-0e3e19faa6474fd5974e6a7ed1b221d8',
  },
  {
    world: 'Our Museum',
    item: 'Photo frames',
    model: 'Fancy Picture Frame',
    author: 'jamiemcfarlane',
    license: 'CC Attribution 4.0',
    creditLine: '"Fancy Picture Frame" by jamiemcfarlane on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-b54984abe2394345a81621719bf8bf1a',
  },

  // Kitty Letter
  {
    world: 'Kitty Letter',
    item: 'Kitten',
    model: 'Cute Chibi Cat',
    author: '_polybit_',
    license: 'CC Attribution 4.0',
    creditLine: '"Cute Chibi Cat" by _polybit_ on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-8a7876b624554441b89926cfa380f36e',
  },

  // Paris Together
  {
    world: 'Paris Together',
    item: 'Eiffel Tower',
    model: '( FREE ) La tour Eiffel',
    author: 'Lambo_SC04',
    license: 'CC Attribution 4.0',
    creditLine: '"( FREE ) La tour Eiffel" by Lambo_SC04 on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-8553f94d06e24cb4b0fde1080f281674',
  },
  {
    world: 'Paris Together',
    item: 'Arc de Triomphe',
    model: 'Arc de Triomphe, Paris (with texture)',
    author: 'HoangHiepVu',
    license: 'CC Attribution 4.0',
    creditLine: '"Arc de Triomphe, Paris (with texture)" by HoangHiepVu on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-f5096afb1a3345e2bf1a82231d9f89c4',
  },
  {
    world: 'Paris Together',
    item: 'Paris street building',
    model: 'Parisian building diorama',
    author: 'maheylah',
    license: 'CC Attribution 4.0',
    creditLine: '"Parisian building diorama" by maheylah on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-4b99125447d64031bcd4b18cff451e8d',
  },
  {
    world: 'Paris Together',
    item: 'Haussmann-style block',
    model: 'French style building',
    author: 'kingdome',
    license: 'CC Attribution 4.0',
    creditLine: '"French style building" by kingdome on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-2e3fba6f6727468da18dc6b1c68134de',
  },
  {
    world: 'Paris Together',
    item: 'Cafe',
    model: 'Day 328: Cafe OZ',
    author: 'alban',
    license: 'CC Attribution 4.0',
    creditLine: '"Day 328: Cafe OZ" by alban on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-871eedc6b52d4f60aff809d50e20f922',
  },
  {
    world: 'Paris Together',
    item: 'Street lamp',
    model: 'Day 137: Parisian lamppost',
    author: 'edemaistre',
    license: 'CC Attribution 4.0',
    creditLine: '"Day 137: Parisian lamppost" by edemaistre on Sketchfab, licensed CC BY 4.0',
    link: 'https://sketchfab.com/3d-models/none-25ea1769fa89408e8b61ad09cb42234e',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentWorld?: string;
}

export function ModelCreditsModal({ isOpen, onClose, currentWorld }: Props) {
  if (!isOpen) return null;

  const filteredCredits = currentWorld
    ? MODEL_CREDITS_DATA.filter((c) =>
        c.world.toLowerCase().includes(currentWorld.toLowerCase()) ||
        currentWorld.toLowerCase().includes(c.world.toLowerCase())
      )
    : MODEL_CREDITS_DATA;

  const displayList = filteredCredits.length > 0 ? filteredCredits : MODEL_CREDITS_DATA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">3D World Inspirations & Credits</h3>
              <p className="text-xs text-slate-400">Attributions for 3D modeling references and creative works</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of models */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-800/60">
          {displayList.map((credit, i) => (
            <div key={i} className="pt-3.5 first:pt-0 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {credit.world}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{credit.item}</span>
                  <span className="text-xs text-slate-400">({credit.model})</span>
                </div>
                <p className="text-xs text-slate-300">
                  By <span className="font-semibold text-amber-300">{credit.author}</span> •{' '}
                  <span className="text-emerald-400 font-mono text-[11px]">{credit.license}</span>
                </p>
                <p className="text-[11px] text-slate-500 italic">{credit.creditLine}</p>
              </div>

              <a
                href={credit.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition"
              >
                <span>Sketchfab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-center text-xs text-slate-400">
          All models referenced under Creative Commons Attribution 4.0 International (CC BY 4.0).
        </div>
      </div>
    </div>
  );
}
