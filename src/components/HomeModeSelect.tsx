import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Flame, Trophy, Swords, Zap, Skull, Scroll, ShieldAlert, Star, User } from 'lucide-react';
import { sound } from '../utils/sound';
import { GameModeType } from '../types/game';
import { getStoredNickname } from '../services/rankingService';

interface HomeModeSelectProps {
  isOpen: boolean;
  onSelect: (mode: GameModeType) => void;
  onOpenRanking?: () => void;
}

export const HomeModeSelect: React.FC<HomeModeSelectProps> = ({ isOpen, onSelect, onOpenRanking }) => {
  const [selectedMode, setSelectedMode] = useState<GameModeType>('RANK');

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
        className="w-full max-w-6xl bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Decorative glowing gradient backgrounds */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 sm:p-10 text-center relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
              Game Mode Selection
            </span>
            {onOpenRanking && (
              <>
                <button
                  onClick={onOpenRanking}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-750 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>글로벌 랭킹 (Top 10)</span>
                </button>
                <button
                  onClick={onOpenRanking}
                  className="px-3 py-1 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 rounded-full text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="등록 닉네임 설정 및 랭킹 열기"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>등록 닉네임: <strong className="text-amber-300 font-bold">{getStoredNickname()}</strong></span>
                  <span className="text-[10px] text-amber-400 underline ml-0.5">변경</span>
                </button>
              </>
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            별빛 마을 용사기
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8">
            마을의 평화를 위해 몰려오는 위험에 대비하세요.<br />
            원하는 모드를 선택하여 전투를 시작하거나 랭크 모드로 글로벌 기록에 도전하세요.
          </p>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 text-left">
            {/* Rank Mode Card (NEW) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedMode('RANK');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'RANK'
                  ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1">
                <span>RANK</span>
                <span>⭐</span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <div className={`p-2.5 rounded-xl border ${selectedMode === 'RANK' ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1">
                      랭크 모드
                    </h3>
                    <p className="text-[11px] text-amber-400 font-bold">별빛 보스전 & 글로벌 랭킹</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  오직 최종 보스 <strong className="text-amber-300">「별빛」</strong>과의 1:1 보스전! 시작 시 <strong className="text-cyan-300">스킬 20회 연속 획득</strong> 후 최단 시간 클리어 기록으로 글로벌 Top 10에 도전하세요.
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">⭐</span> 오직 별빛과의 보스전
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">⚡</span> 시작 시 스킬 20회 획득
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">🏆</span> Firebase 글로벌 랭킹 연동
                </div>
              </div>
            </motion.div>

            {/* Story Mode Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedMode('STORY');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'STORY'
                  ? 'border-indigo-500 bg-indigo-950/30 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              {selectedMode === 'STORY' && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <div className={`p-2.5 rounded-xl border ${selectedMode === 'STORY' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100">스토리 모드</h3>
                    <p className="text-[11px] text-indigo-400 font-bold">정규 5웨이브 + 보스</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  점점 강력해지는 몬스터의 정규 공세를 이겨내는 모드입니다. 웨이브 단위로 성장하는 즐거움을 느껴보세요!
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-400">✔</span> 단계별 정규 웨이브 시스템
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-400">✔</span> 다양한 업적 & 퀘스트
                </div>
              </div>
            </motion.div>

            {/* Brawl Mode Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedMode('BRAWL');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'BRAWL'
                  ? 'border-orange-500 bg-orange-950/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              {selectedMode === 'BRAWL' && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <div className={`p-2.5 rounded-xl border ${selectedMode === 'BRAWL' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100">난투 모드</h3>
                    <p className="text-[11px] text-orange-400 font-bold">5분간의 무한 공세</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  조무래기들이 쉬지 않고 수없이 떼지어 몰려옵니다! 5분 동안 살벌한 공세를 견뎌낸 뒤 최종 보스 군단을 제압하세요.
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">🔥</span> 조무래기 무한 대난투
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">⏳</span> 5분 후 전 보스 동시 출현
                </div>
              </div>
            </motion.div>

            {/* Hardcore Mode Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedMode('HARDCORE');
                sound.playHit && sound.playHit();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all overflow-hidden flex flex-col justify-between ${
                selectedMode === 'HARDCORE'
                  ? 'border-red-500 bg-red-950/40 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1">
                <span>NEW</span>
                <span>💀</span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <div className={`p-2.5 rounded-xl border ${selectedMode === 'HARDCORE' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-slate-800/80 border-slate-700/50 text-slate-400'}`}>
                    <Skull className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1">
                      하드코어 모드
                    </h3>
                    <p className="text-[11px] text-red-400 font-bold">설계도 빌드 & 보스 ERROR</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  시작 시 <strong className="text-amber-300">선택 설계도 쿠폰 3개</strong> 지급! 원하는 3종 장비를 조합하고, <strong className="text-cyan-300">대시 회피 기동</strong>으로 5페이즈 보스 「 ERROR」를 처치하세요.
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">📜</span> 3개 쿠폰으로 자유 설계도 빌드
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">⚡</span> Space / Shift 고속 대시 회피
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400">👾</span> 보스 「 ERROR」 5단계 페이즈
                </div>
              </div>
            </motion.div>
          </div>

          {/* Confirm Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleStart}
              className={`w-full max-w-md py-4 px-8 rounded-2xl text-slate-950 font-black tracking-wider text-base sm:text-lg transition-all cursor-pointer ${
                selectedMode === 'RANK'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_4px_25px_rgba(251,191,36,0.35)]'
                  : selectedMode === 'STORY'
                  ? 'bg-gradient-to-r from-indigo-400 to-indigo-500 hover:from-indigo-300 hover:to-indigo-400 shadow-[0_4px_25px_rgba(99,102,241,0.3)]'
                  : selectedMode === 'BRAWL'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 shadow-[0_4px_25px_rgba(249,115,22,0.3)]'
                  : 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white shadow-[0_4px_25px_rgba(239,68,68,0.4)]'
              }`}
            >
              {selectedMode === 'RANK'
                ? '랭크 모드로 진입하기 ⭐'
                : selectedMode === 'STORY'
                ? '스토리 모드로 진입하기'
                : selectedMode === 'BRAWL'
                ? '난투 모드로 진입하기'
                : '하드코어 모드로 진입하기 💀'}
            </button>
            <p className="text-xs text-slate-500">
              선택 후 클래스를 지정하면 해당 모드로 게임이 시작됩니다.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom Right Screen Credit Badge */}
      <div className="fixed bottom-4 right-5 z-50 pointer-events-none select-none flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-sm sm:text-base font-mono font-bold text-slate-200 shadow-2xl backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
        <span className="tracking-wide">made by S.L.</span>
      </div>
    </div>
  );
};
