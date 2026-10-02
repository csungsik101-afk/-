import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Clock, User, X, RefreshCw, Sparkles, AlertCircle, Check } from 'lucide-react';
import { RankingRecord } from '../types/game';
import { getOrCreatePlayerId, getStoredNickname, saveStoredNickname, subscribeToTop10Rankings, fetchTop10Rankings, updateStoredAndRemoteNickname } from '../services/rankingService';
import { isFirebaseReady } from '../services/firebase';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankings?: RankingRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
  highlightPlayerId?: string;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  isOpen,
  onClose,
  rankings: propRankings,
  isLoading = false,
  onRefresh,
  highlightPlayerId,
}) => {
  const currentPlayerId = highlightPlayerId || getOrCreatePlayerId();
  const [nickname, setNickname] = useState(getStoredNickname());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [internalRankings, setInternalRankings] = useState<RankingRecord[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNickname(getStoredNickname());

    if (propRankings && propRankings.length > 0) {
      setInternalRankings(propRankings);
      return;
    }

    setInternalLoading(true);
    const unsubscribe = subscribeToTop10Rankings((data) => {
      setInternalRankings(data);
      setInternalLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, propRankings]);

  const displayRankings = propRankings && propRankings.length > 0 ? propRankings : internalRankings;
  const loading = isLoading || internalLoading;

  const handleManualRefresh = async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    setInternalLoading(true);
    const latest = await fetchTop10Rankings();
    setInternalRankings(latest);
    setInternalLoading(false);
  };

  if (!isOpen) return null;

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim();
    if (!clean) return;

    setIsSavingNickname(true);
    const res = await updateStoredAndRemoteNickname(clean);
    setIsSavingNickname(false);

    if (res.success) {
      setSavedSuccess(true);
      setFeedbackMessage(
        res.hasRemoteRecord
          ? `「${res.nickname}」(으)로 랭킹 닉네임이 성공적으로 변경되었습니다! 🏆`
          : `「${res.nickname}」(으)로 저장되었습니다! 보스 클리어 시 이 닉네임으로 자동 등재됩니다.`
      );

      // 즉시 로컬 목록 내 항목 닉네임 갱신
      setInternalRankings((prev) =>
        prev.map((item) =>
          item.playerId === currentPlayerId ? { ...item, nickname: res.nickname } : item
        )
      );

      setTimeout(() => {
        setSavedSuccess(false);
        setFeedbackMessage(null);
      }, 3500);
    }
  };

  const getClassBadge = (cls?: string) => {
    switch (cls) {
      case 'ASSASSIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">암살자</span>;
      case 'TANKER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800">탱커</span>;
      case 'BERSERKER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">버서커</span>;
      case 'MAGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">마법사</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">{cls || '용사'}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  글로벌 별빛 타임어택 랭킹
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  TOP 10
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firebase Firestore 실시간 동기화</span>
                {!isFirebaseReady && (
                  <span className="text-amber-400 font-bold ml-1">(오프라인 모드)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* My Nickname Bar */}
        <div className="bg-slate-950/70 px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <form onSubmit={handleSaveNickname} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
              <User className="w-3.5 h-3.5 text-amber-400" /> 등록할 닉네임:
            </span>
            <input
              type="text"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="등록할 닉네임 입력 (최대 20자)"
              className="bg-slate-900 border border-slate-700 text-white px-2.5 py-1 rounded-lg text-xs flex-1 max-w-[220px] focus:outline-none focus:border-amber-400 font-medium"
            />
            <button
              type="submit"
              disabled={isSavingNickname || !nickname.trim()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-slate-950" /> : null}
              <span>{isSavingNickname ? '저장 중...' : '저장'}</span>
            </button>
          </form>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {feedbackMessage ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                {feedbackMessage}
              </span>
            ) : (
              <span className="text-slate-500">
                저장한 닉네임으로 랭킹 기록이 등록 및 변경됩니다.
              </span>
            )}
          </div>
        </div>

        {/* Content Table / List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2">
          {(!displayRankings || displayRankings.length === 0) ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-300">
                등록된 랭킹 기록이 없습니다. (없음)
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                오직 별빛과의 1:1 보스전인 <strong className="text-amber-400">랭크 모드</strong>를 플레이하고 첫 번째 명예의 전당 랭커가 되어보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayRankings.map((record, index) => {
                const rank = index + 1;
                const isMe = record.playerId === currentPlayerId;

                return (
                  <div
                    key={record.id || `${record.playerId}_${index}`}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all ${
                      rank === 1
                        ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40 shadow-sm'
                        : rank === 2
                        ? 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-400/40'
                        : rank === 3
                        ? 'bg-gradient-to-r from-amber-700/10 via-slate-900 to-slate-900 border-amber-700/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    } ${isMe ? 'ring-2 ring-indigo-500 bg-indigo-950/20' : ''}`}
                  >
                    {/* Rank & User Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank Number / Medal */}
                      <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                        {rank === 1 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                            1
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-300 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                            2
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-md">
                            3
                          </div>
                        ) : (
                          <span className="text-sm sm:text-base font-extrabold text-slate-400 font-mono">
                            {rank}
                          </span>
                        )}
                      </div>

                      {/* Nickname & Class */}
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-slate-100 truncate">
                            {record.nickname || '익명 용사'}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-500 text-white shrink-0">
                              나 (ME)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          {getClassBadge(record.playerClass)}
                          {record.updatedAt && (
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                              {new Date(record.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clear Record Time */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-base sm:text-lg font-black text-amber-300">
                          {Number(record.clearTime).toFixed(2)}s
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        클리어 기록
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>랭크 모드는 오직 보스 「별빛」만을 상대하는 스피드런 모드입니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
