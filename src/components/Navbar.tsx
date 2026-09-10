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
  onOpenBlueprints?: () => void;
  blueprintCount?: number;
  coupons?: number;
  gameMode?: string;
  synergyCount?: number;
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
  onOpenBlueprints,
  blueprintCount = 0,
  coupons = 0,
  gameMode = 'STORY',
  synergyCount = 0,
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
            {gameMode === 'HARDCORE' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                💀 하드코어
              </span>
            ) : gameMode === 'BRAWL' ? (
              <span className="text-orange-400 font-bold flex items-center gap-1">
                ⚔️ 난투
              </span>
            ) : (
              <span className="text-amber-400 font-bold">웨이브 {currentWave}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Blueprint Inventory button */}
        {onOpenBlueprints && (
          <button
            onClick={onOpenBlueprints}
            className={`relative px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              coupons > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black animate-pulse ring-2 ring-amber-400'
                : blueprintCount > 0
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
            title="설계도 인벤토리 (보유 설계도 및 효과 확인)"
          >
            <span className="text-xs">🎒</span>
            <span className="hidden sm:inline">설계도</span>
            {coupons > 0 ? (
              <span className="bg-slate-950 text-amber-300 text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                쿠폰 {coupons}
              </span>
            ) : blueprintCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-mono px-1 rounded">
                {blueprintCount}
              </span>
            ) : null}
            {synergyCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono flex items-center gap-0.5">
                ✨{synergyCount}
              </span>
            )}
          </button>
        )}

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
