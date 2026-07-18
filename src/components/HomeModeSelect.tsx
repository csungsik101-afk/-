import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Flame, Trophy, Swords, Zap, HelpCircle } from 'lucide-react';
import { sound } from '../utils/sound';
import { GameModeType } from '../types/game';

interface HomeModeSelectProps {
  isOpen: boolean;
  onSelect: (mode: GameModeType) => void;
}

export const HomeModeSelect: React.FC<HomeModeSelectProps> = ({ isOpen, onSelect }) => {
  const [selectedMode, setSelectedMode] = useState<GameModeType>('STORY');

  if (!isOpen) return null;

  const handleStart = () => {
    sound.playLevelUp && sound.playLevelUp();
    onSelect(selectedMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Decorative glowing gradient backgrounds */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 sm:p-10 text-center relative z-10">
          <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Game Mode Selection
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            별빛 마을 용사기
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8">
            마을의 평화를 위해 몰려오는 위험에 대비하세요.<br />
            당신의 도전을 기다리는 두 가지의 게임 모드가 준비되어 있습니다.
          </p>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Story Mode Card */}
            <motion.div
              whileHover={{ scale: 1.015 }}
              onClick={() => {
                setSelectedMode('STORY');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 text-left transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'STORY'
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              {selectedMode === 'STORY' && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`p-3 rounded-xl border ${selectedMode === 'STORY' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100">스토리 모드 (Story)</h3>
                    <p className="text-xs text-indigo-400 font-bold">마을 구출 정규 스테이지</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  점점 강력해지는 몬스터의 정규 공세를 이겨내는 모드입니다. 마을 이장님이 도망간 사연과 함께 웨이브 단위로 성장하는 즐거움을 느껴보세요!
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400">✔</span> 단계별로 상승하는 정규 웨이브 시스템
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400">✔</span> 다양한 업적 및 퀘스트 클리어 시스템
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400">✔</span> 정밀하게 조정된 균형 잡힌 게임 플레이
                </div>
              </div>
            </motion.div>

            {/* Brawl Mode Card */}
            <motion.div
              whileHover={{ scale: 1.015 }}
              onClick={() => {
                setSelectedMode('BRAWL');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 text-left transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'BRAWL'
                  ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              {selectedMode === 'BRAWL' && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`p-3 rounded-xl border ${selectedMode === 'BRAWL' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100">난투 모드 (Brawl)</h3>
                    <p className="text-xs text-rose-400 font-bold">5분간의 무한 수하물 공세</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  조무래기들이 쉬지 않고 수없이 떼지어 몰려옵니다! 5분 동안 살벌한 공세를 견뎌낸 뒤, 최후의 순간에 등장하는 모든 보스 군단을 제압하십시오.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">💀</span> 조무래기 몬스터들의 무한 대난투 공세
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">⏳</span> 실시간 5분 타임라인 게이지 제공
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">🔥</span> 5분 종료 즉시 모든 보스 동시 소환 (조무래기 중단)
                </div>
              </div>
            </motion.div>
          </div>

          {/* Confirm Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleStart}
              className={`w-full max-w-md py-4 px-8 rounded-2xl text-slate-950 font-black tracking-wider text-base sm:text-lg transition-all cursor-pointer ${
                selectedMode === 'STORY'
                  ? 'bg-gradient-to-r from-indigo-400 to-indigo-500 hover:from-indigo-300 hover:to-indigo-400 shadow-[0_4px_25px_rgba(99,102,241,0.3)]'
                  : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-300 hover:to-rose-400 shadow-[0_4px_25px_rgba(244,63,94,0.3)]'
              }`}
            >
              {selectedMode === 'STORY' ? '스토리 모드로 진입하기' : '난투 모드로 진입하기'}
            </button>
            <p className="text-xs text-slate-500">
              선택 후 클래스를 지정하면 해당 모드로 게임이 시작됩니다.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
