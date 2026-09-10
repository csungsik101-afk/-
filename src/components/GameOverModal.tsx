import React from 'react';
import { Trophy, Skull, RotateCcw, Award, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  waveReached: number;
  level: number;
  totalXp: number;
  enemiesKilled: number;
  bossesKilled: number;
  onRestart: () => void;
  gameMode?: string | null;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  waveReached,
  level,
  totalXp,
  enemiesKilled,
  bossesKilled,
  onRestart,
  gameMode = 'STORY',
}) => {
  React.useEffect(() => {
    if (isOpen && isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, isVictory]);

  if (!isOpen) return null;

  const isHardcore = gameMode === 'HARDCORE';
  const isBrawl = gameMode === 'BRAWL';

  const modalTitle = isHardcore
    ? isVictory
      ? '👑 하드코어 모드 클리어!'
      : '💀 하드코어 모드 실패 (리셋)'
    : isBrawl
    ? isVictory
      ? '⚔️ 난투 모드 클리어!'
      : '⚔️ 난투 모드 실패...'
    : isVictory
    ? '별빛 마을 수호 완료!'
    : '별빛 마을 방어 실패...';

  const modalSubtitle = isHardcore
    ? isVictory
      ? '극악의 난이도와 5페이즈 보스 「 ERROR」를 격파하여 하드코어 모드를 완벽히 정복했습니다!'
      : '하드코어 모드는 단 한 번의 사망으로 모든 진행도가 리셋됩니다. 다시 도전해 보세요!'
    : isBrawl
    ? isVictory
      ? '조무래기들의 무한 공세를 견디고 전 보스 군단을 모두 소탕했습니다!'
      : '몰려드는 적들의 파상공세를 버텨내지 못했습니다.'
    : isVictory
    ? '모든 악질 유저와 치명적인 버그들을 완벽히 퇴치하고 마을을 구원했습니다!'
    : '침공하는 몬스터들의 물량 공세에 별빛 마을의 수호 장벽이 무너졌습니다.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-slate-900 border-2 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center ${
          isVictory
            ? isHardcore
              ? 'border-emerald-400 shadow-emerald-500/30'
              : 'border-amber-400 shadow-amber-500/30'
            : isHardcore
            ? 'border-red-600 shadow-red-600/40'
            : 'border-rose-600 shadow-rose-600/30'
        }`}
      >
        {/* Icon Header */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 border-2 shadow-inner ${
            isVictory
              ? isHardcore
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-200 text-slate-950 animate-bounce'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-200 text-slate-950 animate-bounce'
              : 'bg-gradient-to-tr from-rose-950 to-red-900 border-rose-500 text-rose-300'
          }`}
        >
          {isVictory ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          {modalTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          {modalSubtitle}
        </p>

        {/* Stats Summary Card */}
        <div className="w-full bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3 mb-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              {isHardcore ? '하드코어 결과' : isBrawl ? '난투 모드 결과' : '도달한 웨이브'}
            </span>
            <span className="font-black text-sm text-white">
              {isHardcore
                ? isVictory
                  ? '보스 「 ERROR」 격파 완료 🏆'
                  : '단일 목숨 소진 (초기화됨) 💀'
                : isBrawl
                ? isVictory
                  ? '난투 5분 생존 & 보스 격파 🏆'
                  : '난투 중 전사 💀'
                : `웨이브 ${waveReached} / 5 ${isVictory ? '🏆' : ''}`}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> 최종 용사 레벨
            </span>
            <span className="font-black text-sm text-amber-300">Lv.{level} (총 {totalXp} XP)</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-rose-400" /> 처치한 총 적 수
            </span>
            <span className="font-black text-sm text-rose-300">{enemiesKilled} 마리</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> 처치한 악질 보스
            </span>
            <span className="font-black text-sm text-emerald-300">{bossesKilled} 마리</span>
          </div>
        </div>

        {/* Replay CTA */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>
            {isHardcore
              ? isVictory
                ? '하드코어 정복 완료 (새 게임으로 리셋)'
                : '단일 생명 소진 (처음부터 다시 도전 / 리셋)'
              : '다시 수호하러 가기 (새 게임)'}
          </span>
        </button>
      </div>
    </div>
  );
};
