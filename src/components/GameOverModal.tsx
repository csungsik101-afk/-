import React, { useState, useEffect } from 'react';
import { Trophy, Skull, RotateCcw, Award, ShieldAlert, Sparkles, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredNickname, submitStarlightClearRecord } from '../services/rankingService';

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
  clearTime?: number;
  playerClass?: string;
  onOpenRanking?: () => void;
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
  clearTime,
  playerClass = '용사',
  onOpenRanking,
}) => {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    submitted: boolean;
    isNewBest?: boolean;
    previousBest?: number;
    nickname?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNickname(getStoredNickname());
      setSubmitResult(null);
      setIsSubmitting(false);

      if (isVictory) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        // 랭크 모드 승리 시 기본 닉네임으로 자동 1차 등록 시도
        if (gameMode === 'RANK' && clearTime && clearTime > 0) {
          const defaultNick = getStoredNickname();
          submitStarlightClearRecord(defaultNick, clearTime, playerClass)
            .then((res) => {
              setSubmitResult({
                submitted: res.success,
                isNewBest: res.isNewBest,
                previousBest: res.previousBest,
                nickname: res.nickname,
                error: res.error,
              });
            })
            .catch((err) => {
              console.warn('자동 랭킹 기록 저장 실패:', err);
            });
        }
      }
    }
  }, [isOpen, isVictory, gameMode, clearTime, playerClass]);

  if (!isOpen) return null;

  const isHardcore = gameMode === 'HARDCORE';
  const isBrawl = gameMode === 'BRAWL';
  const isRank = gameMode === 'RANK';

  const modalTitle = isRank
    ? isVictory
      ? '🏆 별빛 보스 토벌 성공!'
      : '💀 별빛 보스 토벌 실패...'
    : isHardcore
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

  const modalSubtitle = isRank
    ? isVictory
      ? `최종 흑막 보스 「별빛」을 ${clearTime ? clearTime.toFixed(2) : '0'}초만에 격파했습니다! 기록이 Firebase 글로벌 랭킹에 등록됩니다.`
      : '별빛 보스에게 패배했습니다. 20개의 스킬을 재조합하여 다시 도전해보세요!'
    : isHardcore
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim();
    if (!clean) return;
    if (!clearTime || clearTime <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    const res = await submitStarlightClearRecord(clean, clearTime, playerClass);
    setIsSubmitting(false);

    setSubmitResult({
      submitted: res.success,
      isNewBest: res.isNewBest,
      previousBest: res.previousBest,
      nickname: res.nickname,
      error: res.error,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className={`bg-slate-900 border-2 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center my-8 ${
          isVictory
            ? isRank
              ? 'border-amber-400 shadow-amber-500/40'
              : isHardcore
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
              ? isRank
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-100 text-slate-950 animate-bounce'
                : isHardcore
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

        {/* RANK MODE CLEAR TIME SPECIAL CARD */}
        {isRank && isVictory && clearTime !== undefined && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-slate-950 to-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-4 mb-5 text-center">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              별빛 보스 격파 타임어택 기록
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight">
              {clearTime.toFixed(2)}s
            </div>

            {/* Nickname update & submit form */}
            <form onSubmit={handleManualSubmit} className="mt-3.5 flex flex-col gap-2 pt-3 border-t border-amber-500/30">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                <span>랭킹에 등록할 닉네임:</span>
                <span className="text-[10px] text-amber-400/80">저장 시 즉시 랭킹에 반영</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="등록할 닉네임 입력 (최대 20자)"
                  className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400 font-bold"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !nickname.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? '저장 중...' : '저장 및 랭킹 등록'}</span>
                </button>
              </div>

              {/* Result Notice */}
              {submitResult && (
                <div className="text-xs font-bold mt-1 text-left flex items-center gap-1.5">
                  {submitResult.submitted ? (
                    submitResult.isNewBest ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        「{submitResult.nickname || nickname}」(으)로 새 최고 기록이 글로벌 랭킹에 등재되었습니다! 🏆
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        「{submitResult.nickname || nickname}」(으)로 닉네임이 저장 및 랭킹에 반영되었습니다! (최고: {submitResult.previousBest?.toFixed(2)}s)
                      </span>
                    )
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {submitResult.error || '랭킹 저장 실패 (오프라인 모드)'}
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Stats Summary Card */}
        <div className="w-full bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3 mb-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              {isRank ? '랭크 모드 결과' : isHardcore ? '하드코어 결과' : isBrawl ? '난투 모드 결과' : '도달한 웨이브'}
            </span>
            <span className="font-black text-sm text-white">
              {isRank
                ? isVictory
                  ? `별빛 격파 (${clearTime?.toFixed(2)}초) 🏆`
                  : '별빛 격파 실패 💀'
                : isHardcore
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

        {/* Global Ranking View Button */}
        {onOpenRanking && (
          <button
            onClick={onOpenRanking}
            className="w-full mb-3 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>글로벌 랭킹 (TOP 10) 확인하기</span>
          </button>
        )}

        {/* Replay CTA */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>
            {isRank
              ? '랭크 모드 다시 도전하기'
              : isHardcore
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
