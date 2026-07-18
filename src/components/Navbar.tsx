import React from 'react';
import { Volume2, VolumeX, BookOpen, Scroll, Shield, Trophy, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

interface NavbarProps {
  currentWave: number;
  level: number;
  unspentPoints: number;
  unclaimedQuests: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCodex: () => void;
  onOpenQuests: () => void;
  onOpenStats: () => void;
  onRestart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWave,
  level,
  unspentPoints,
  unclaimedQuests,
  soundEnabled,
  onToggleSound,
  onOpenCodex,
  onOpenQuests,
  onOpenStats,
  onRestart,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-red-600 p-1.5 rounded-lg shadow-md shrink-0">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent truncate max-w-[120px] sm:max-w-none">
            별빛 마을 HP
          </h1>
          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1 sm:gap-1.5">
            <span className="hidden sm:inline">실시간 액션 디펜스</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-amber-400 font-bold">웨이브 {currentWave}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Level & Stat allocation button */}
        <button
          onClick={onOpenStats}
          className={`relative px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            unspentPoints > 0
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse ring-2 ring-emerald-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Lv.{level} 스탯</span>
          <span className="sm:hidden font-mono">Lv.{level}</span>
          {unspentPoints > 0 && (
            <span className="bg-white text-emerald-800 text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full">
              +{unspentPoints}
            </span>
          )}
        </button>
 
        {/* Quests button */}
        <button
          onClick={onOpenQuests}
          className={`relative px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            unclaimedQuests > 0
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white animate-bounce ring-2 ring-amber-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Scroll className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">퀘스트</span>
          {unclaimedQuests > 0 && (
            <span className="bg-white text-orange-800 text-[9px] sm:text-[10px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
              !
            </span>
          )}
        </button>
 
        {/* Codex / Lore button */}
        <button
          onClick={onOpenCodex}
          className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">도감/규칙</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            sound.enabled = !soundEnabled;
            onToggleSound();
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
          title={soundEnabled ? '소리 끄기' : '소리 켜기'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 transition-all"
          title="재시작"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
