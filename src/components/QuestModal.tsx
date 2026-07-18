import React from 'react';
import { QuestState } from '../types/game';
import { Scroll, CheckCircle2, Gift, X, Award } from 'lucide-react';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: QuestState[];
  onClaimQuest: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  isOpen,
  onClose,
  quests,
  onClaimQuest,
}) => {
  const [cheatClickCount, setCheatClickCount] = React.useState(0);

  if (!isOpen) return null;

  const handleCheatClick = () => {
    setCheatClickCount((prev) => {
      const next = prev + 1;
      if (next >= 10) {
        onClaimQuest('DEVELOPER_CHEAT_WAVE6');
        return 0;
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:scale-[0.98] transition-transform" 
            onClick={handleCheatClick}
            title="제작자 디버그 루트"
          >
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Scroll className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                별빛 마을 수호 퀘스트 {cheatClickCount > 0 && <span className="text-xs text-amber-500/80 font-mono">({cheatClickCount}/10)</span>}
              </h2>
              <p className="text-xs text-slate-400">침공하는 몬스터를 처치하고 XP 보상을 받으세요!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {quests.map((q) => {
            const progressPct = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all ${
                  q.completed && !q.claimed
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : q.claimed
                    ? 'bg-slate-800/40 border-slate-800 opacity-70'
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">[{q.code}]</span>
                      <h3 className="font-bold text-sm text-white">{q.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      배틀필드에 나타난 몬스터들을 처치하세요.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-xs text-amber-300">+{q.rewardXp} XP</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">진행도:</span>
                    <span className={q.completed ? 'text-emerald-400' : 'text-slate-300'}>
                      {q.currentCount} / {q.targetCount} ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        q.completed ? 'bg-gradient-to-r from-amber-500 to-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Claim CTA */}
                <div className="mt-3.5 flex justify-end">
                  {q.claimed ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>보상 수령 완료 (다음 사이클 준비 중)</span>
                    </div>
                  ) : q.completed ? (
                    <button
                      onClick={() => onClaimQuest(q.id)}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 cursor-pointer animate-pulse"
                    >
                      <Gift className="w-4 h-4" />
                      <span>보상 {q.rewardXp} XP 수령하기!</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium py-1">
                      진행 중... ({Math.max(0, q.targetCount - q.currentCount)}마리 남음)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>* 퀘스트 완료 시 즉시 XP가 지급되며 반복 갱신됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
